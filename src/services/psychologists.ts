import { supabase } from '../lib/supabase';
import { PsychologistProfile, PsychologistPost } from '../types';

export const psychologistService = {
  // ---- PERFILES ----
  async getApprovedPsychologists(): Promise<PsychologistProfile[]> {
    const { data, error } = await supabase
      .from('psychologist_profiles')
      .select(`
        *,
        profile:profiles!inner (
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('is_approved', true)
      .order('profile_views', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      full_name: item.profile?.full_name,
      avatar_url: item.profile?.avatar_url,
      email: item.profile?.email,
    }));
  },

  async getPsychologistById(id: string): Promise<PsychologistProfile | null> {
    const { data, error } = await supabase
      .from('psychologist_profiles')
      .select(`
        *,
        profile:profiles!inner (
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('id', id)
      .single();
    if (error) return null;
    return {
      ...data,
      full_name: (data as any).profile?.full_name,
      avatar_url: (data as any).profile?.avatar_url,
      email: (data as any).profile?.email,
    };
  },

  async updatePsychologistProfile(id: string, updates: Partial<PsychologistProfile>) {
    const { data, error } = await supabase
      .from('psychologist_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createPsychologistProfile(profile: Omit<PsychologistProfile, 'created_at' | 'updated_at' | 'is_approved' | 'profile_views' | 'rating'>) {
    const { data, error } = await supabase
      .from('psychologist_profiles')
      .insert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- INCREMENTAR VISTAS ----
  async incrementProfileViews(id: string) {
    await supabase.rpc('increment_profile_views', { profile_id: id });
  },

  // ---- POSTS ----
  async getPsychologistPosts(psychologistId: string): Promise<PsychologistPost[]> {
    const { data, error } = await supabase
      .from('psychologist_posts')
      .select('*')
      .eq('psychologist_id', psychologistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPost(post: Omit<PsychologistPost, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('psychologist_posts')
      .insert(post)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePost(id: string, updates: Partial<PsychologistPost>) {
    const { data, error } = await supabase
      .from('psychologist_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePost(id: string) {
    const { error } = await supabase
      .from('psychologist_posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ---- ESTADÍSTICAS ----
  async getDashboardStats(psychologistId: string): Promise<{
    totalPatients: number;
    upcomingAppointments: number;
    pendingTasks: number;
    profileViews: number;
  }> {
    const [patientsCount, appointmentsCount, tasksCount, profile] = await Promise.all([
      supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('psychologist_id', psychologistId)
        .in('status', ['scheduled', 'confirmed', 'completed']),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', psychologistId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_date', new Date().toISOString()),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', psychologistId)
        .eq('status', 'submitted'),
      supabase
        .from('psychologist_profiles')
        .select('profile_views')
        .eq('id', psychologistId)
        .single(),
    ]);

    return {
      totalPatients: patientsCount.count || 0,
      upcomingAppointments: appointmentsCount.count || 0,
      pendingTasks: tasksCount.count || 0,
      profileViews: (profile.data as any)?.profile_views || 0,
    };
  },
};
