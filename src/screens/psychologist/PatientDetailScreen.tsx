import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment, Task, PsychologistNote } from '../../types';

type PatientDetailParams = {
  PatientDetail: { patientId: string; patientName: string };
};

export function PatientDetailScreen() {
  const route = useRoute<RouteProp<PatientDetailParams, 'PatientDetail'>>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { patientId, patientName } = route.params;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<PsychologistNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [apptsData, tasksData, notesData] = await Promise.all([
        supabase.from('appointments').select('*').eq('patient_id', patientId).eq('psychologist_id', user.id).order('scheduled_date', { ascending: false }),
        supabase.from('tasks').select('*').eq('patient_id', patientId).eq('psychologist_id', user.id).order('created_at', { ascending: false }),
        supabase.from('psychologist_notes').select('*').eq('patient_id', patientId).eq('psychologist_id', user.id).order('created_at', { ascending: false }),
      ]);
      setAppointments(apptsData.data || []);
      setTasks(tasksData.data || []);
      setNotes(notesData.data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('psychologist_notes').insert({
        psychologist_id: user.id,
        patient_id: patientId,
        content: newNote.trim(),
      });
      if (error) throw error;
      setShowNoteModal(false);
      setNewNote('');
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTask = async () => {
    if (!taskTitle.trim() || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        patient_id: patientId,
        psychologist_id: user.id,
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        due_date: taskDueDate || null,
      });
      if (error) throw error;

      // Notificar al paciente
      await supabase.from('notifications').insert({
        user_id: patientId,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        body: `Tienes una nueva tarea: ${taskTitle.trim()}`,
      });

      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      loadData();
    } catch {
      Alert.alert('Error', 'No se pudo asignar la tarea');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Patient info */}
      <View style={styles.patientHeader}>
        <Avatar uri={null} name={patientName} size={64} />
        <Text style={styles.patientName}>{patientName}</Text>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setShowNoteModal(true)}
        >
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionLabel}>Nueva nota</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setShowTaskModal(true)}
        >
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionLabel}>Asignar tarea</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('Chat', { otherUserId: patientId })}
        >
          <Text style={styles.actionIcon}>›</Text>
          <Text style={styles.actionLabel}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Historial de citas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Citas</Text>
        {appointments.length > 0 ? (
          appointments.slice(0, 5).map((appt) => (
            <Card key={appt.id} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {new Date(appt.scheduled_date).toLocaleDateString('es-ES', {
                    dateStyle: 'medium',
                  })}
                </Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      appt.status === 'completed' ? '#E8F5E9' :
                      appt.status === 'confirmed' ? '#E3F2FD' : '#FFF3E0',
                  },
                ]}>
                  <Text style={[
                    styles.statusText,
                    {
                      color:
                        appt.status === 'completed' ? '#2E7D32' :
                        appt.status === 'confirmed' ? '#1565C0' : '#E65100',
                    },
                  ]}>
                    {appt.status}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>Sin citas registradas</Text>
        )}
      </View>

      {/* Tareas asignadas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tareas</Text>
        {tasks.length > 0 ? (
          tasks.slice(0, 5).map((task) => (
            <TouchableOpacity
              key={task.id}
              onPress={() => navigation.navigate('TaskReview', { taskId: task.id })}
            >
              <Card style={styles.taskCard}>
                <View style={styles.taskRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[
                    styles.taskStatus,
                    {
                      backgroundColor:
                        task.status === 'submitted' ? '#E3F2FD' :
                        task.status === 'reviewed' ? '#FFF8E1' :
                        task.status === 'approved' ? '#E8F5E9' : '#FFF3E0',
                    },
                  ]}>
                    <Text style={[
                      styles.taskStatusText,
                      {
                        color:
                          task.status === 'submitted' ? '#1565C0' :
                          task.status === 'reviewed' ? '#F57F17' :
                          task.status === 'approved' ? '#2E7D32' : '#E65100',
                      },
                    ]}>
                      {task.status === 'pending' ? 'Pendiente' :
                       task.status === 'submitted' ? 'Entregada' :
                       task.status === 'reviewed' ? 'Revisada' : 'Aprobada'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Sin tareas asignadas</Text>
        )}
      </View>

      {/* Notas del psicólogo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Notas</Text>
        {notes.length > 0 ? (
          notes.map((note) => (
            <Card key={note.id} style={styles.noteCard}>
              <Text style={styles.noteDate}>
                {new Date(note.created_at).toLocaleDateString('es-ES', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </Text>
              <Text style={styles.noteContent}>{note.content}</Text>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>Sin notas aún</Text>
        )}
      </View>

      {/* Modal: Nueva nota */}
      <Modal visible={showNoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva nota sobre {patientName}</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Text style={styles.closeBtn}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Escribe tus notas aquí... (solo visible para ti)"
              value={newNote}
              onChangeText={setNewNote}
              multiline
              placeholderTextColor={COLORS.textLight}
            />
            <Button title="Guardar nota" onPress={handleAddNote} loading={saving} />
          </View>
        </View>
      </Modal>

      {/* Modal: Nueva tarea */}
      <Modal visible={showTaskModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar tarea a {patientName}</Text>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Text style={styles.closeBtn}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.taskInput}
              placeholder="Título de la tarea"
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[styles.taskInput, styles.taskDescInput]}
              placeholder="Descripción (opcional)"
              value={taskDesc}
              onChangeText={setTaskDesc}
              multiline
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={styles.taskInput}
              placeholder="Fecha de entrega (YYYY-MM-DD, opcional)"
              value={taskDueDate}
              onChangeText={setTaskDueDate}
              placeholderTextColor={COLORS.textLight}
            />
            <Button
              title="Asignar tarea"
              onPress={handleAssignTask}
              loading={saving}
              disabled={!taskTitle.trim()}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  patientHeader: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.primary,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginTop: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceAlt,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  section: { padding: SPACING.md },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  historyCard: { marginBottom: SPACING.xs },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: { fontSize: 13, color: COLORS.text, textTransform: 'capitalize' },
  statusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  taskCard: { marginBottom: SPACING.xs },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  taskStatus: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  taskStatusText: { fontSize: 10, fontWeight: '600' },
  noteCard: { marginBottom: SPACING.xs },
  noteDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  noteContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  closeBtn: { fontSize: 20, color: COLORS.textLight, padding: SPACING.xs },
  noteInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  taskInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  taskDescInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
