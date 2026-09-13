import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';

type TaskReviewParams = {
  TaskReview: { taskId: string };
};

export function TaskReviewScreen() {
  const route = useRoute<RouteProp<TaskReviewParams, 'TaskReview'>>();
  const { taskId } = route.params;
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTask();
  }, []);

  const loadTask = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      if (error) throw error;
      setTask(data);
      setFeedback(data.feedback || '');
    } catch {
      Alert.alert('Error', 'No se pudo cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'reviewed' | 'approved') => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Escribe un feedback para el paciente');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status,
          feedback: feedback.trim(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      if (error) throw error;

      // Notificar al paciente
      if (task) {
        await supabase.from('notifications').insert({
          user_id: task.patient_id,
          type: 'task_reviewed',
          title: status === 'approved' ? 'Tarea aprobada' : 'Tarea revisada',
          body: `Tu tarea "${task.title}" ha sido ${status === 'approved' ? 'aprobada' : 'revisada'}. Revisa el feedback.`,
          data: { task_id: taskId },
        });
      }

      Alert.alert('Éxito', 'Tarea actualizada');
      loadTask();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    } finally {
      setSaving(false);
    }
  };

  const openFile = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!task) return <Text style={{ textAlign: 'center', padding: 20 }}>Tarea no encontrada</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info de la tarea */}
      <Card style={styles.taskCard}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.description && (
          <Text style={styles.taskDesc}>{task.description}</Text>
        )}
        <View style={styles.taskMeta}>
          <Text style={styles.taskMetaItem}>
            Creada: {new Date(task.created_at).toLocaleDateString('es-ES')}
          </Text>
          {task.due_date && (
            <Text style={styles.taskMetaItem}>
              ⏰ Vence: {new Date(task.due_date).toLocaleDateString('es-ES')}
            </Text>
          )}
          <View style={[styles.statusBadge, {
            backgroundColor:
              task.status === 'submitted' ? '#E3F2FD' : '#FFF3E0',
          }]}>
            <Text style={[styles.statusText, {
              color: task.status === 'submitted' ? '#1565C0' : '#E65100',
            }]}>
              {task.status === 'submitted' ? 'Esperando revisión' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Archivo subido */}
      {task.file_url && (
        <TouchableOpacity style={styles.fileCard} onPress={() => openFile(task.file_url!)}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{task.file_name || 'Archivo adjunto'}</Text>
            <Text style={styles.fileAction}>Toca para abrir</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Feedback */}
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackLabel}>Tu feedback para el paciente:</Text>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Escribe aquí tu retroalimentación, sugerencias o comentarios sobre la tarea..."
          value={feedback}
          onChangeText={setFeedback}
          multiline
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <Button
          title="Aprobar tarea"
          onPress={() => handleReview('approved')}
          variant="primary"
          loading={saving}
        />
        <Button
          title="Marcar como revisada"
          onPress={() => handleReview('reviewed')}
          variant="outline"
          loading={saving}
          style={styles.secondaryAction}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  taskCard: { marginBottom: SPACING.md },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  taskDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  taskMeta: { gap: 4 },
  taskMetaItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  fileIcon: { fontSize: 24, marginRight: SPACING.md },
  fileInfo: { flex: 1 },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fileAction: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  feedbackSection: { marginBottom: SPACING.md },
  feedbackLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  feedbackInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actions: {
    gap: SPACING.sm,
  },
  secondaryAction: {
    marginTop: 0,
  },
});
