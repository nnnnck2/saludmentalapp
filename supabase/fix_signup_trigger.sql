-- ============================================================
-- MenteSana — MIGRACIÓN: Fix "Database error saving new user"
-- ============================================================
-- SÍNTOMA: registrar una cuenta falla con
--   500 "Database error saving new user"
-- CAUSA: el trigger on_auth_user_created (handle_new_user) falla al
--        ejecutarse cuando el servicio de Auth crea el usuario.
-- ESTA VERSIÓN BLINDADA:
--   1. Fija search_path = public (el servicio de auth ejecuta el trigger
--      con otro search_path y sin esto falla la resolución de nombres)
--   2. Califica TODOS los nombres con su esquema (public.xxx)
--   3. Reemplaza strings vacíos por NULL (NULLIF) para phone/avatar
--   4. Si el perfil de psicólogo falla, NO rompe el registro (EXCEPTION)
--   5. Recrea el trigger desde cero (DROP + CREATE) por si quedó roto
--
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
-- Es idempotente: se puede ejecutar varias veces.
-- ============================================================

-- 1) Recrear la función del trigger, blindada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_role public.user_role := 'patient';
BEGIN
  -- Respetar el rol elegido en el registro (patient/psychologist)
  IF NEW.raw_user_meta_data->>'role' IN ('guest', 'patient', 'psychologist', 'admin') THEN
    new_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    new_role
  );

  -- Si se registra como psicólogo, crear su perfil profesional pendiente
  -- de aprobación. Si esto falla, NO debe romper el registro del usuario.
  IF new_role = 'psychologist' THEN
    BEGIN
      INSERT INTO public.psychologist_profiles (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Recrear el trigger desde cero (por si el existente quedó roto
--    o apuntaba a una versión vieja de la función)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICACIÓN: crea un usuario de prueba desde la app o pide al
-- agente que lo pruebe por API. El registro debe responder 200
-- y aparecer una fila en Authentication > Users y en la tabla profiles.
-- ============================================================
