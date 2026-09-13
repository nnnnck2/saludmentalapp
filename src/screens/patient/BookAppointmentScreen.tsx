import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PsychologistProfile } from '../../types';
import { psychologistService } from '../../services/psychologists';
import { appointmentService } from '../../services/appointments';

type BookAppointmentParams = {
  BookAppointment: { psychologistId: string };
};

export function BookAppointmentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<BookAppointmentParams, 'BookAppointment'>>();
  const { user } = useAuth();
  const { psychologistId } = route.params;

  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('online');

  useEffect(() => {
    loadPsychologist();
  }, []);

  const loadPsychologist = async () => {
    try {
      const data = await psychologistService.getPsychologistById(psychologistId);
      setPsychologist(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const combineDateAndTime = (datePart: Date, timePart: Date): Date => {
    const combined = new Date(datePart);
    combined.setHours(timePart.getHours());
    combined.setMinutes(timePart.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  const handleBookAppointment = async () => {
    if (!user || !psychologist) return;

    const scheduledDate = combineDateAndTime(date, time);

    if (scheduledDate <= new Date()) {
      Alert.alert('Error', 'La fecha debe ser en el futuro');
      return;
    }

    setSaving(true);
    try {
      await appointmentService.createAppointment({
        patient_id: user.id,
        psychologist_id: psychologist.id,
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: 50,
        status: 'scheduled',
        notes: notes || null,
        meeting_link: null,
      });

      // Notificar al psicólogo
      await supabase.from('notifications').insert({
        user_id: psychologist.id,
        type: 'appointment_reminder',
        title: 'Nueva cita agendada',
        body: `Tienes una nueva cita con ${user.full_name}`,
        data: { patient_id: user.id },
      });

      Alert.alert(
        'Cita agendada',
        'Tu cita ha sido registrada. Recibirás un recordatorio 24 horas antes.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo agendar la cita');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando..." />;
  if (!psychologist) return <Text style={styles.errorText}>Psicólogo no encontrado</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Info del psicólogo */}
      <Card style={styles.psychCard}>
        <View style={styles.psychRow}>
          <Avatar uri={psychologist.avatar_url} name={psychologist.full_name} size={56} />
          <View style={styles.psychInfo}>
            <Text style={styles.psychName}>{psychologist.full_name}</Text>
            <Text style={styles.psychSpecialties}>
              {psychologist.specialization?.slice(0, 2).join(', ')}
            </Text>
          </View>
        </View>
      </Card>

      {/* Modalidad */}
      <Text style={styles.sectionTitle}>Modalidad de la consulta</Text>
      <View style={styles.modeRow}>
        {['online', 'in_person'].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeBtn, selectedMode === mode && styles.modeBtnActive]}
            onPress={() => setSelectedMode(mode)}
          >
            <Text style={styles.modeIcon}>
              {mode === 'online' ? 'En línea' : 'Presencial'}
            </Text>
            <Text style={[styles.modeLabel, selectedMode === mode && styles.modeLabelActive]}>
              {mode === 'online' ? 'En línea' : 'Presencial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fecha */}
      <Text style={styles.sectionTitle}>Fecha y hora</Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>Fecha</Text>
          <Text style={styles.dateTimeValue}>
            {date.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>⏰ Hora</Text>
          <Text style={styles.dateTimeValue}>
            {time.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Notas */}
      <Text style={styles.sectionTitle}>Notas para el psicólogo (opcional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Cuéntale brevemente qué te gustaría trabajar..."
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholderTextColor={COLORS.textLight}
      />

      {/* Resumen */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de la cita</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Psicólogo:</Text>
          <Text style={styles.summaryValue}>{psychologist.full_name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fecha:</Text>
          <Text style={styles.summaryValue}>
            {date.toLocaleDateString('es-ES', { dateStyle: 'full' })}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Hora:</Text>
          <Text style={styles.summaryValue}>
            {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duración:</Text>
          <Text style={styles.summaryValue}>50 minutos</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Modalidad:</Text>
          <Text style={styles.summaryValue}>
            {selectedMode === 'online' ? 'En línea' : 'Presencial'}
          </Text>
        </View>
      </Card>

      <Button
        title="Confirmar y agendar cita"
        onPress={handleBookAppointment}
        loading={saving}
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  errorText: { textAlign: 'center', padding: SPACING.xl, color: COLORS.textSecondary },
  psychCard: { marginBottom: SPACING.lg },
  psychRow: { flexDirection: 'row', alignItems: 'center' },
  psychInfo: { marginLeft: SPACING.md, flex: 1 },
  psychName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  psychSpecialties: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  modeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F6FF',
  },
  modeIcon: { fontSize: 20 },
  modeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modeLabelActive: { color: COLORS.primary },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  dateTimeBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  dateTimeLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  notesInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  summaryCard: { marginBottom: SPACING.lg },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
});
