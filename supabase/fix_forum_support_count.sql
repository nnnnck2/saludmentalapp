-- ============================================================
-- MenteSana — FIX: contadores de apoyo (likes) del foro
-- ============================================================
-- PROBLEMA QUE CORRIGE:
--   El contador de "apoyos" se calculaba con un count embebido
--   sobre forum_post_supports, pero las policies RLS de esa
--   tabla solo dejan ver tus PROPIAS filas → cada usuario veía
--   un conteo distinto (y normalmente 0/1), que además
--   "cambiaba solo" al recargar.
--
-- SOLUCIÓN:
--   Funciones SECURITY DEFINER (bypassan RLS de forma controlada)
--   que exponen SOLO el conteo agregado, y un toggle atómico
--   para dar/quitar apoyo.
--
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- 1) Conteo real por publicación (solo expone post_id + cantidad)
CREATE OR REPLACE FUNCTION get_forum_support_counts()
RETURNS TABLE (post_id UUID, support_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.post_id, COUNT(*)::BIGINT AS support_count
  FROM forum_post_supports s
  GROUP BY s.post_id;
$$;

-- 2) Conteo real para una sola publicación
CREATE OR REPLACE FUNCTION get_forum_support_count(p_post_id UUID)
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::BIGINT
  FROM forum_post_supports
  WHERE post_id = p_post_id;
$$;

-- 3) Toggle atómico: da o quita el apoyo del usuario autenticado
--    y devuelve el estado real + el conteo actualizado.
CREATE OR REPLACE FUNCTION toggle_forum_support(p_post_id UUID)
RETURNS TABLE (supported BOOLEAN, support_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para apoyar';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM forum_post_supports
    WHERE user_id = v_user AND post_id = p_post_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM forum_post_supports
    WHERE user_id = v_user AND post_id = p_post_id;
  ELSE
    INSERT INTO forum_post_supports (user_id, post_id)
    VALUES (v_user, p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT (NOT v_exists), COUNT(*)::BIGINT
  FROM forum_post_supports
  WHERE post_id = p_post_id;
END;
$$;

-- 4) Permisos de ejecución
--    Los invitados (anon) pueden LEER los conteos del foro público,
--    pero solo usuarios autenticados pueden apoyar.
GRANT EXECUTE ON FUNCTION get_forum_support_counts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_forum_support_count(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_forum_support(UUID) TO authenticated;

-- ============================================================
-- VERIFICACIÓN (opcional):
--   SELECT * FROM get_forum_support_counts() LIMIT 5;
-- ============================================================
