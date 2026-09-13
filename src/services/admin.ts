import { supabase } from '../lib/supabase';
import { Profile, PsychologistProfile } from '../types';

export const adminService = {
  // ---- GESTIÓN DE USUARIOS ----
  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getUserById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  async updateUserRole(userId: string, newRole: Profile['role']) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    // Primero eliminar el perfil, luego el usuario de auth
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
  },

  // ---- VERIFICACIÓN DE PSICÓLOGOS ----
  async getPendingPsychologists(): Promise<PsychologistProfile[]> {
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
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      full_name: item.profile?.full_name,
      avatar_url: item.profile?.avatar_url,
      email: item.profile?.email,
    }));
  },

  async approvePsychologist(psychologistId: string, adminId: string) {
    const { data, error } = await supabase
      .from('psychologist_profiles')
      .update({
        is_approved: true,
        approved_by: adminId,
      })
      .eq('id', psychologistId)
      .select()
      .single();
    if (error) throw error;

    // Notificar al psicólogo
    await supabase.from('notifications').insert({
      user_id: psychologistId,
      type: 'system',
      title: 'Perfil aprobado',
      body: '¡Felicidades! Tu perfil como psicólogo ha sido aprobado. Ya puedes comenzar a recibir pacientes.',
      data: { psychologist_id: psychologistId },
    });

    return data;
  },

  async rejectPsychologist(psychologistId: string, reason: string) {
    await supabase.from('notifications').insert({
      user_id: psychologistId,
      type: 'system',
      title: 'Perfil no aprobado',
      body: `Tu perfil no ha sido aprobado. Razón: ${reason}`,
      data: { psychologist_id: psychologistId },
    });

    // Eliminar el perfil de psicólogo
    const { error } = await supabase
      .from('psychologist_profiles')
      .delete()
      .eq('id', psychologistId);
    if (error) throw error;
  },

  // ---- MODERACIÓN DEL FORO ----
  async getReportedPosts() {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        author:author_id (full_name, email)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // ---- ESTADÍSTICAS DEL SISTEMA ----
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalPsychologists: number;
    totalPatients: number;
    totalAppointments: number;
    totalForumPosts: number;
    pendingVerifications: number;
  }> {
    const [
      usersCount,
      psychologistsCount,
      patientsCount,
      appointmentsCount,
      forumPostsCount,
      pendingPsychCount,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('psychologist_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('forum_posts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('psychologist_profiles').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    ]);

    return {
      totalUsers: usersCount.count || 0,
      totalPsychologists: psychologistsCount.count || 0,
      totalPatients: patientsCount.count || 0,
      totalAppointments: appointmentsCount.count || 0,
      totalForumPosts: forumPostsCount.count || 0,
      pendingVerifications: pendingPsychCount.count || 0,
    };
  },
};
