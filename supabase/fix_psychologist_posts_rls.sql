-- ============================================================
-- MenteSana — MIGRACIÓN: Policies de psychologist_posts
-- ============================================================
-- SÍNTOMA QUE CORRIGE:
--   El botón "Publicar" en la pestaña Posts del psicólogo falla.
--   La tabla psychologist_posts tiene RLS habilitado pero NINGUNA
--   policy → toda operación (SELECT/INSERT/UPDATE/DELETE) es
--   denegada por la base de datos.
--
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- 0) Helper (por si no se ejecutó la migración anterior)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 1) El psicólogo gestiona sus propios posts (crear, editar, eliminar, leer)
DROP POLICY IF EXISTS "Psychologists manage own posts" ON psychologist_posts;
CREATE POLICY "Psychologists manage own posts"
  ON psychologist_posts FOR ALL
  USING (psychologist_id = auth.uid())
  WITH CHECK (psychologist_id = auth.uid());

-- 2) Cualquiera puede ver los posts publicados (atraer pacientes)
DROP POLICY IF EXISTS "Anyone view published psychologist posts" ON psychologist_posts;
CREATE POLICY "Anyone view published psychologist posts"
  ON psychologist_posts FOR SELECT
  USING (is_published = true);

-- ============================================================
-- VERIFICACIÓN: desde la app del psicólogo, crear un post debe
-- funcionar. Para auditar desde SQL:
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies WHERE tablename = 'psychologist_posts';
-- ============================================================
