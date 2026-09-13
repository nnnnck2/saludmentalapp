-- ============================================
-- MenteSana - Esquema de Base de Datos
-- Mental Health App - Supabase PostgreSQL Schema
-- ============================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('guest', 'patient', 'psychologist', 'admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE task_status AS ENUM ('pending', 'submitted', 'reviewed', 'approved');
CREATE TYPE forum_post_status AS ENUM ('active', 'moderated', 'hidden');
CREATE TYPE notification_type AS ENUM ('appointment_reminder', 'task_assigned', 'task_reviewed', 'message', 'system');

-- 2. TABLAS PRINCIPALES

-- Profiles extendida de auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  is_verified BOOLEAN DEFAULT false,
  is_onboarded BOOLEAN DEFAULT false,
  push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles de psicólogos (información extendida)
CREATE TABLE psychologist_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  years_experience INTEGER,
  specialization TEXT[],
  education TEXT[],
  bio TEXT,
  consultation_modes TEXT[], -- 'online', 'in_person', 'both'
  price_range TEXT,
  languages TEXT[] DEFAULT ARRAY['español'],
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  profile_views INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts de psicólogos (para atraer clientes)
CREATE TABLE psychologist_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citas
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 50,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tareas asignadas por psicólogos
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status task_status DEFAULT 'pending',
  file_url TEXT,
  file_name TEXT,
  feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foro anónimo
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  status forum_post_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soporte a publicaciones del foro (likes)
CREATE TABLE forum_post_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Chat paciente-psicólogo
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood Tracker (Check-in emocional)
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  activities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diario personal
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_shared_with_therapist BOOLEAN DEFAULT false,
  mood_at_writing INTEGER CHECK (mood_at_writing >= 1 AND mood_at_writing <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notas del psicólogo sobre pacientes (privadas)
CREATE TABLE psychologist_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaciones
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recursos educativos
CREATE TABLE educational_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('article', 'video', 'paper', 'podcast', 'exercise')),
  url TEXT,
  content TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: rol del usuario actual (SECURITY DEFINER)
-- Evita recursión infinita de RLS: las policies de "profiles"
-- NO deben consultar la tabla profiles directamente.
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================
-- POLÍTICAS: PROFILES
-- ============================================
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Los psicólogos pueden ver perfiles de pacientes asignados
CREATE POLICY "Psychologists view assigned patients"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = profiles.id
      AND appointments.psychologist_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.patient_id = profiles.id
      AND tasks.psychologist_id = auth.uid()
    )
  );

-- Los admins pueden ver todos los perfiles
-- (usa get_user_role() SECURITY DEFINER para evitar recursión de RLS)
CREATE POLICY "Admins view all profiles"
  ON profiles FOR SELECT
  USING ((SELECT get_user_role()) = 'admin');

-- Los usuarios pueden insertar su propio perfil
-- (fallback si el trigger no se ejecutó)
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
-- (no pueden auto-promoverse a admin)
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NOT (role = 'admin' AND (SELECT get_user_role()) <> 'admin')
  );

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "Admins update profiles"
  ON profiles FOR UPDATE
  USING ((SELECT get_user_role()) = 'admin')
  WITH CHECK (true);

-- Cualquiera puede ver perfiles de psicólogos aprobados
CREATE POLICY "Anyone view approved psychologists"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM psychologist_profiles
      WHERE id = profiles.id AND is_approved = true
    )
  );

-- ============================================
-- POLÍTICAS: PSYCHOLOGIST PROFILES
-- ============================================
CREATE POLICY "Psychologists manage own profile"
  ON psychologist_profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone view approved psychologist profiles"
  ON psychologist_profiles FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Admins manage all psychologist profiles"
  ON psychologist_profiles FOR ALL
  USING (
    (SELECT get_user_role()) = 'admin'
  );

-- ============================================
-- POLÍTICAS: APPOINTMENTS
-- ============================================
CREATE POLICY "Patients view own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Psychologists view assigned appointments"
  ON appointments FOR SELECT
  USING (psychologist_id = auth.uid());

CREATE POLICY "Patients create appointments"
  ON appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Psychologists update assigned appointments"
  ON appointments FOR UPDATE
  USING (psychologist_id = auth.uid());

-- ============================================
-- POLÍTICAS: TASKS
-- ============================================
CREATE POLICY "Patients view own tasks"
  ON tasks FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Psychologists manage assigned tasks"
  ON tasks FOR ALL
  USING (psychologist_id = auth.uid());

CREATE POLICY "Patients update own tasks (submit)"
  ON tasks FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- ============================================
-- POLÍTICAS: FORUM
-- ============================================
CREATE POLICY "Anyone can read forum"
  ON forum_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read forum posts"
  ON forum_posts FOR SELECT
  USING (status = 'active' OR author_id = auth.uid());

CREATE POLICY "Authenticated users create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users update own posts"
  ON forum_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Admins moderate forum"
  ON forum_posts FOR ALL
  USING (
    (SELECT get_user_role()) = 'admin'
  );

-- Similar policies for forum_comments
CREATE POLICY "Anyone can read forum comments"
  ON forum_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users create comments"
  ON forum_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins moderate comments"
  ON forum_comments FOR ALL
  USING (
    (SELECT get_user_role()) = 'admin'
  );

-- ============================================
-- POLÍTICAS: CHAT MESSAGES
-- ============================================
CREATE POLICY "Users view own chat messages"
  ON chat_messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users send chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================
-- POLÍTICAS: MOOD & JOURNAL (privado)
-- ============================================
CREATE POLICY "Users manage own mood entries"
  ON mood_entries FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own journal"
  ON journal_entries FOR ALL
  USING (user_id = auth.uid());

-- Psicólogos pueden ver journal si el paciente lo compartió
CREATE POLICY "Psychologists view shared journal"
  ON journal_entries FOR SELECT
  USING (
    is_shared_with_therapist = true
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = journal_entries.user_id
      AND appointments.psychologist_id = auth.uid()
      AND appointments.status = 'confirmed'
    )
  );

-- ============================================
-- POLÍTICAS: PSYCHOLOGIST NOTES
-- ============================================
CREATE POLICY "Psychologists manage own notes"
  ON psychologist_notes FOR ALL
  USING (psychologist_id = auth.uid());

-- ============================================
-- POLÍTICAS: NOTIFICATIONS
-- ============================================
CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS: EDUCATIONAL RESOURCES
-- ============================================
CREATE POLICY "Anyone can view published resources"
  ON educational_resources FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage all resources"
  ON educational_resources FOR ALL
  USING (
    (SELECT get_user_role()) = 'admin'
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_psychologist_profiles_updated_at
  BEFORE UPDATE ON psychologist_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función: crear perfil automáticamente al registrarse
-- (SECURITY DEFINER + search_path fijo: el servicio de Auth ejecuta este
--  trigger con otro rol/search_path; sin esto falla el registro)
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

  -- Si se registra como psicólogo, crear su perfil profesional pendiente de aprobación
  IF new_role = 'psychologist' THEN
    BEGIN
      INSERT INTO public.psychologist_profiles (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- no bloquear el registro del usuario
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función: incrementar contador de vistas del perfil
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS void AS $$
  UPDATE psychologist_profiles SET profile_views = profile_views + 1 WHERE id = profile_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- SEED DATA: Forum Categories
-- ============================================
INSERT INTO forum_categories (name, description, icon, sort_order) VALUES
  ('Ansiedad', 'Comparte y encuentra apoyo para manejar la ansiedad', '😰', 1),
  ('Depresión', 'Un espacio seguro para hablar sobre la depresión', '💙', 2),
  ('Estrés', 'Técnicas y experiencias para manejar el estrés diario', '😤', 3),
  ('Relaciones', 'Consejos y apoyo sobre relaciones interpersonales', '💕', 4),
  ('Autoestima', 'Trabajemos juntos en construir una mejor autoestima', '🌟', 5),
  ('Duelo', 'Espacio de apoyo para procesos de duelo y pérdida', '🕊️', 6),
  ('Hábitos Saludables', 'Comparte rutinas y hábitos que te ayudan', '🌱', 7),
  ('General', 'Otros temas de salud mental', '💬', 8);
