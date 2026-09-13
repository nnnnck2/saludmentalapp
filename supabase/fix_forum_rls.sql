-- ============================================================
-- MenteSana — MIGRACIÓN: Policies del Foro + tabla faltante
-- ============================================================
-- SÍNTOMA QUE CORRIGE:
--   El botón "Publicar" del foro no hace nada / falla en silencio.
--   Además, la tabla forum_post_supports (los "apoyos"/likes) no
--   existía en la base de datos live → error 42P01.
--
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- ============================================================

-- 0) VERIFICACIÓN rápida de tablas existentes (opcional, para debug):
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'forum%'
-- ORDER BY table_name;

-- 1) Helper reutilizable (mismo patrón que fix_rls_recursion.sql)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2) FORUM_POST_SUPPORTS — crear la tabla si falta en la base live
CREATE TABLE IF NOT EXISTS forum_post_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE forum_post_supports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_forum_post_supports_post
  ON forum_post_supports(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_supports_user
  ON forum_post_supports(user_id);

-- 3) FORUM_POSTS
DROP POLICY IF EXISTS "Anyone can read forum posts" ON forum_posts;
CREATE POLICY "Anyone can read forum posts"
  ON forum_posts FOR SELECT
  USING (status = 'active' OR author_id = auth.uid() OR (SELECT get_user_role()) = 'admin');

DROP POLICY IF EXISTS "Authenticated users create posts" ON forum_posts;
CREATE POLICY "Authenticated users create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    -- El autor debe ser el propio usuario (o NULL si la sesión no lo permite)
    AND (author_id IS NULL OR author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users update own posts" ON forum_posts;
CREATE POLICY "Users update own posts"
  ON forum_posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own posts" ON forum_posts;
CREATE POLICY "Users delete own posts"
  ON forum_posts FOR DELETE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Admins moderate forum" ON forum_posts;
CREATE POLICY "Admins moderate forum"
  ON forum_posts FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

-- 4) FORUM_COMMENTS
DROP POLICY IF EXISTS "Anyone can read forum comments" ON forum_comments;
CREATE POLICY "Anyone can read forum comments"
  ON forum_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users create comments" ON forum_comments;
CREATE POLICY "Authenticated users create comments"
  ON forum_comments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (author_id IS NULL OR author_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users delete own comments" ON forum_comments;
CREATE POLICY "Users delete own comments"
  ON forum_comments FOR DELETE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS "Admins moderate comments" ON forum_comments;
CREATE POLICY "Admins moderate comments"
  ON forum_comments FOR ALL
  USING ((SELECT get_user_role()) = 'admin');

-- 5) Policies de la tabla de apoyos
DROP POLICY IF EXISTS "Users support own" ON forum_post_supports;
CREATE POLICY "Users support own"
  ON forum_post_supports FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6) FORUM_CATEGORIES — lectura pública
DROP POLICY IF EXISTS "Anyone can read forum" ON forum_categories;
CREATE POLICY "Anyone can read forum"
  ON forum_categories FOR SELECT
  USING (true);

-- 7) SEED de categorías sin emojis (limpia los íconos originales)
UPDATE forum_categories SET icon = NULL WHERE icon IS NOT NULL;

-- ============================================================
-- VERIFICACIÓN FINAL: ambas queries deben funcionar sin error
--   SELECT count(*) FROM forum_post_supports;
--   SELECT id, name FROM forum_categories LIMIT 5;
-- ============================================================
