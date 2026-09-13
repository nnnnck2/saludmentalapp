import { supabase } from '../lib/supabase';
import { Task } from '../types';

export const taskService = {
  async getPatientTasks(patientId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPsychologistTasks(psychologistId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        patient:patient_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('psychologist_id', psychologistId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      patient_name: item.patient?.full_name,
    }));
  },

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status' | 'file_url' | 'file_name' | 'feedback' | 'reviewed_at'>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();
    if (error) throw error;

    // Crear notificación para el paciente
    await supabase.from('notifications').insert({
      user_id: task.patient_id,
      type: 'task_assigned',
      title: 'Nueva tarea asignada',
      body: `Tienes una nueva tarea: ${task.title}`,
      data: { task_id: data.id },
    });

    return data;
  },

  async submitTask(id: string, fileUrl: string, fileName: string) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'submitted',
        file_url: fileUrl,
        file_name: fileName,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async reviewTask(id: string, feedback: string, status: 'reviewed' | 'approved') {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status,
        feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Notificar al paciente
    const task = await supabase.from('tasks').select('patient_id, title').eq('id', id).single();
    if (task.data) {
      await supabase.from('notifications').insert({
        user_id: task.data.patient_id,
        type: 'task_reviewed',
        title: status === 'approved' ? 'Tarea aprobada' : 'Tarea revisada',
        body: `Tu tarea "${task.data.title}" ha sido ${status === 'approved' ? 'aprobada' : 'revisada'}.`,
        data: { task_id: id },
      });
    }

    return data;
  },

  async uploadTaskFile(fileUri: string, fileName: string, userId: string): Promise<string> {
    const fileExt = fileName.split('.').pop();
    const filePath = `${userId}/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('task-files')
      .upload(filePath, { uri: fileUri, name: fileName, type: `application/${fileExt}` } as any);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('task-files')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },
};
