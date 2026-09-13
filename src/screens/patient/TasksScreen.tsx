import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Task } from '../../types';
import { taskService } from '../../services/tasks';

export function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!user) return;
    try {
      const data = await taskService.getPatientTasks(user.id);
      setTasks(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (taskId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setUploadingTaskId(taskId);
      const file = result.assets[0];
      const fileUrl = await taskService.uploadTaskFile(file.uri, file.name, user!.id);
      await taskService.submitTask(taskId, fileUrl, file.name);
      Alert.alert('Éxito', 'Tarea enviada para revisión');
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setUploadingTaskId(null);
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const config = {
      pending: { bg: '#FFF3E0', text: 'Pendiente', color: '#E65100' },
      submitted: { bg: '#E3F2FD', text: 'En revisión', color: '#1565C0' },
      reviewed: { bg: '#FFF8E1', text: 'Con comentarios', color: '#F57F17' },
      approved: { bg: '#E3F1EC', text: 'Aprobada', color: '#2E7D32' },
    };
    return config[status];
  };

  const renderTask = ({ item }: { item: Task }) => {
    const badge = getStatusBadge(item.status);
    const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status === 'pending';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
            </View>
          </View>
          {item.due_date && (
            <Text style={[styles.dueDate, isOverdue && styles.overdue]}>
              {isOverdue ? 'Vencida · ' : 'Vence: '}{new Date(item.due_date).toLocaleDateString('es-ES')}
            </Text>
          )}
        </View>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {(item.file_url && item.status !== 'pending') && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileLabel}>Archivo: {item.file_name}</Text>
          </View>
        )}

        {item.feedback && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackLabel}>Feedback del psicólogo:</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <Button
            title={uploadingTaskId === item.id ? 'Subiendo...' : 'Subir tarea'}
            onPress={() => handleSubmitTask(item.id)}
            variant="primary"
            size="sm"
            loading={uploadingTaskId === item.id}
          />
        )}
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando tareas..." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={tasks}
      renderItem={renderTask}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.empty}>            <Text style={styles.emptyIcon}>—</Text>
          <Text style={styles.emptyTitle}>No tienes tareas asignadas</Text>
          <Text style={styles.emptyDesc}>Las tareas que te asigne tu psicólogo aparecerán aquí</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.sm },
  cardHeader: { marginBottom: SPACING.sm },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  overdue: {
    color: COLORS.error,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  fileInfo: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  fileLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  feedbackSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 3,
  },
  feedbackText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
