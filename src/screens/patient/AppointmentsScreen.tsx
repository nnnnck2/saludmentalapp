import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { Appointment } from '../../types';
import { appointmentService } from '../../services/appointments';

export function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!user) return;
    try {
      const data = await appointmentService.getPatientAppointments(user.id);
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancelAppointment(id);
              loadAppointments();
            } catch {
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          },
        },
      ]
    );
  };

  const filteredAppointments = appointments.filter((a) => {
    const isUpcoming = new Date(a.scheduled_date) > new Date();
    return filter === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={item.psychologist_avatar} name={item.psychologist_name} size={48} />
        <View style={styles.cardInfo}>
          <Text style={styles.psychologistName}>{item.psychologist_name || 'Psicólogo'}</Text>
          <Text style={styles.date}>
            {new Date(item.scheduled_date).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.time}>
            {new Date(item.scheduled_date).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}
            {item.duration_minutes} min
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor:
              item.status === 'confirmed' ? '#E8F5E9' :
              item.status === 'completed' ? '#E3F2FD' :
              item.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0',
          }
        ]}>
          <Text style={[
            styles.statusText,
            {
              color:
                item.status === 'confirmed' ? '#2E7D32' :
                item.status === 'completed' ? '#1565C0' :
                item.status === 'cancelled' ? '#C62828' : '#E65100',
            }
          ]}>
            {item.status === 'scheduled' ? 'Pendiente' :
             item.status === 'confirmed' ? 'Confirmada' :
             item.status === 'completed' ? 'Completada' :
             item.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
          </Text>
        </View>
      </View>
      {item.notes && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
      {item.meeting_link && (          <TouchableOpacity style={styles.meetingLink}>
          <Text style={styles.meetingLinkText}>Unirse a la reunión</Text>
        </TouchableOpacity>
      )}
      {(item.status === 'scheduled' || item.status === 'confirmed') && (
        <View style={styles.actions}>
          <Button
            title="Cancelar cita"
            onPress={() => handleCancel(item.id)}
            variant="danger"
            size="sm"
          />
        </View>
      )}
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando citas..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'upcoming' && styles.filterBtnActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterBtnText, filter === 'upcoming' && styles.filterBtnTextActive]}>
            Próximas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'past' && styles.filterBtnActive]}
          onPress={() => setFilter('past')}
        >
          <Text style={[styles.filterBtnText, filter === 'past' && styles.filterBtnTextActive]}>
            Pasadas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>—</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'upcoming' ? 'No tienes citas próximas' : 'No hay citas pasadas'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterBtnTextActive: {
    color: COLORS.textOnPrimary,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  psychologistName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notes: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  meetingLink: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  meetingLinkText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
