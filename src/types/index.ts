// ============================================
// MenteSana - Tipos y Interfaces
// ============================================

export type UserRole = 'guest' | 'patient' | 'psychologist' | 'admin';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type TaskStatus = 'pending' | 'submitted' | 'reviewed' | 'approved';
export type ForumPostStatus = 'active' | 'moderated' | 'hidden';
export type NotificationType = 'appointment_reminder' | 'task_assigned' | 'task_reviewed' | 'message' | 'system';
export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type ResourceType = 'article' | 'video' | 'paper' | 'podcast' | 'exercise';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_verified: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface PsychologistProfile {
  id: string;
  license_number: string | null;
  years_experience: number | null;
  specialization: string[] | null;
  education: string[] | null;
  bio: string | null;
  consultation_modes: string[] | null;
  price_range: string | null;
  languages: string[];
  is_approved: boolean;
  approved_by: string | null;
  profile_views: number;
  rating: number;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface PsychologistPost {
  id: string;
  psychologist_id: string;
  title: string;
  content: string;
  tags: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  psychologist_id: string;
  scheduled_date: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  psychologist_name?: string;
  psychologist_avatar?: string;
  patient_name?: string;
}

export interface Task {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  file_url: string | null;
  file_name: string | null;
  feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface ForumPost {
  id: string;
  category_id: string;
  author_id: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  status: ForumPostStatus;
  created_at: string;
  updated_at: string;
  // Joined
  comment_count?: number;
  support_count?: number;
  author_name?: string;
  author_avatar?: string;
}

export interface ForumPostSupport {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  appointment_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: MoodLevel;
  note: string | null;
  activities: string[] | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  is_shared_with_therapist: boolean;
  mood_at_writing: MoodLevel | null;
  created_at: string;
  updated_at: string;
}

export interface PsychologistNote {
  id: string;
  psychologist_id: string;
  patient_id: string;
  appointment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined
  patient_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  content: string | null;
  tags: string[] | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: Profile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}
