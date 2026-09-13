import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

export const appointmentService = {
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        psychologist:psychologist_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('patient_id', patientId)
      .order('scheduled_date', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      psychologist_name: item.psychologist?.full_name,
      psychologist_avatar: item.psychologist?.avatar_url,
    }));
  },

  async getPsychologistAppointments(psychologistId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('psychologist_id', psychologistId)
      .order('scheduled_date', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      patient_name: item.patient?.full_name,
    }));
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAppointment(id: string, updates: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelAppointment(id: string) {
    return this.updateAppointment(id, { status: 'cancelled' });
  },

  async getUpcomingAppointments(userId: string, role: 'patient' | 'psychologist'): Promise<Appointment[]> {
    const column = role === 'patient' ? 'patient_id' : 'psychologist_id';
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq(column, userId)
      .in('status', ['scheduled', 'confirmed'])
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data;
  },
};
