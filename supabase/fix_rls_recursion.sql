-- ============================================================
-- MenteSana — MIGRACIÓN: Fix "infinite recursion" en policies de profiles
-- ============================================================
-- SÍNTOMA QUE CORRIGE:
--   Login y registro no redirigen a ninguna parte.
--   Error 42P17: "infinite recursion detected in policy for relation profiles"
--   La policy "Admins view all profiles" consultaba la tabla profiles
--   dentro de una policy de la MISMA tabla → todo SELECT sobre profiles
--   fallaba → el app no podía cargar el perfil del usuario → nunca navegaba.
--
-- EJECUTAR EN: Supabase Dashboard > SQL Editor (proyecto jtdlzzdoewridxktmgeb)
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- 1) Helper: obtiene el rol del usuario actual SIN pasar por RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2) Reemplazar la policy recursiva de SELECT en profiles
DROP POLICY IF EXISTS "Admins view all profiles" ON profiles;
CREATE POLICY "Admins view all profiles"
  ON profiles FOR SELECT
  USING ((SELECT get_user_role()) = 'admin');

-- 3) INSERT propio (fallback si el trigger no creó el perfil)
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4) UPDATE propio (el app edita perfil / cambia rol; no puede auto-promoverse a admin)
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NOT (role = 'admin' AND (SELECT get_user_role()) <> 'admin')
  );

-- 5) Admins pueden actualizar cualquier perfil (gestión de roles)
DROP POLICY IF EXISTS "Admins update profiles" ON profiles;
CREATE POLICY "Admins update profiles"
  ON profiles FOR UPDATE
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK (true);

-- 6) Simplificar las demás policies admin (mismo anti-patrón, más limpio con el helper)
DROP POLICY IF EXISTS "Admins manage all psychologist profiles" ON psychologist_profiles;
CREATE POLICY "Admins manage all psychologist profiles"
  ON psychologist_profiles FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Admins moderate forum" ON forum_posts;
CREATE POLICY "Admins moderate forum"
  ON forum_posts FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Admins moderate comments" ON forum_comments;
CREATE POLICY "Admins moderate comments"
  ON forum_comments FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Admins manage all resources" ON educational_resources;
CREATE POLICY "Admins manage all resources"
  ON educational_resources FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

-- 7) Trigger de registro: respeta el rol elegido y crea perfil de psicólogo
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role user_role := 'patient';
BEGIN
  IF NEW.raw_user_meta_data->>'role' IN ('guest', 'patient', 'psychologist', 'admin') THEN
    new_role := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone',
    new_role
  );

  IF new_role = 'psychologist' THEN
    INSERT INTO psychologist_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VERIFICACIÓN: esta query ya NO debe devolver error 42P17
-- SELECT id, role FROM profiles LIMIT 1;
-- ============================================================
