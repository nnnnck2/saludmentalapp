import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
  COLORS, SPACING, RADIUS, SHADOWS, MOOD_LABELS, MOOD_COLORS,
  APP_NAME, FONTS,
} from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CrisisButton } from '../../components/common/CrisisButton';
import { AppIcon } from '../../components/common/AppIcon';
import { RotatingQuote } from '../../components/common/RotatingQuote';
import { MoodLevel, Appointment } from '../../types';
import { appointmentService } from '../../services/appointments';
import { moodTrackerService } from '../../services/moodTracker';

const QUICK_ACTIONS: Array<{
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  route: string;
  tint: string;
  bg: string;
}> = [
  { icon: 'calendar',      label: 'Citas',       route: 'Citas',          tint: COLORS.primary,      bg: COLORS.primaryMist },
  { icon: 'clipboard',     label: 'Tareas',      route: 'Tareas',         tint: COLORS.info,         bg: COLORS.infoMist },
  { icon: 'message-circle',label: 'Foro',        route: 'Foro',           tint: COLORS.psychologist, bg: COLORS.infoMist },
  { icon: 'book-open',     label: 'Diario',      route: 'Journal',        tint: COLORS.secondaryDark,bg: COLORS.secondaryMist },
  { icon: 'users',         label: 'Psicólogos',  route: 'Psychologists',  tint: '#8E7CC3',           bg: '#EEEBF7' },
  { icon: 'activity',      label: 'Progreso',    route: 'MoodTracker',    tint: COLORS.success,      bg: COLORS.successMist },
];

export function PatientDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();

  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [appointments, moods] = await Promise.all([
        appointmentService.getUpcomingAppointments(user.id, 'patient'),
        moodTrackerService.getWeekSummary(user.id),
      ]);
      setUpcomingAppointments(appointments);
      setMoodEntries(moods);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodCheckin = async (mood: MoodLevel) => {
    if (!user) return;
    try {
      await moodTrackerService.createEntry({
        user_id: user.id,
        mood,
      });
      setShowMoodPicker(false);
      loadData();
    } catch (error) {
      console.error('Error guardando ánimo:', error);
    }
  };

  const averageMood = moodEntries.length > 0
    ? Math.round(moodEntries.reduce((a, b) => a + b.mood, 0) / moodEntries.length * 10) / 10
    : 0;

  const firstName = (user?.full_name || '').split(' ')[0] || 'Usuario';
  const nextAppointment = upcomingAppointments[0];

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ===== Header ===== */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={46} />
          <View style={styles.headerText}>
            <Text style={styles.headerGreeting}>Hola, {firstName}</Text>
            <Text style={styles.headerSub}>¿Cómo te sientes hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBell}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Mood check-in card (solapada sobre el header) ===== */}
      <View style={styles.moodCardWrap}>
        <View style={styles.moodCard}>
          {showMoodPicker ? (
            <View>
              <Text style={styles.moodTitle}>¿Cómo te sientes ahora?</Text>
              <View style={styles.moodOptions}>
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.moodOption}
                    onPress={() => handleMoodCheckin(level)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.moodCircle, { backgroundColor: MOOD_COLORS[level] }]} />
                    <Text style={styles.moodLabel}>{MOOD_LABELS[level]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowMoodPicker(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowMoodPicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.moodCheckinRow}>
                <View style={[styles.moodDotLarge, { backgroundColor: MOOD_COLORS[Math.round(averageMood) as MoodLevel] || COLORS.moodNeutral }]} />
                <View style={styles.moodCheckinText}>
                  <Text style={styles.moodCheckinTitle}>Check-in emocional</Text>
                  <Text style={styles.moodCheckinDesc}>
                    {moodEntries.length > 0
                      ? `Promedio esta semana: ${averageMood}/5 · ${moodEntries.length} registro${moodEntries.length !== 1 ? 's' : ''}`
                      : 'Toca para registrar cómo te sientes'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.textLight} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ===== Próxima cita ===== */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próxima cita</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Citas')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {nextAppointment ? (
          <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => navigation.navigate('Citas')}
            activeOpacity={0.8}
          >
            <View style={styles.appointmentDateBox}>
              <Text style={styles.appointmentDay}>
                {new Date(nextAppointment.scheduled_date).getDate()}
              </Text>
              <Text style={styles.appointmentMonth}>
                {new Date(nextAppointment.scheduled_date)
                  .toLocaleDateString('es-ES', { month: 'short' })
                  .replace('.', '')}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentName}>
                {nextAppointment.psychologist_name || 'Psicólogo'}
              </Text>
              <View style={styles.appointmentMeta}>
                <Feather name="clock" size={12} color={COLORS.textSecondary} />
                <Text style={styles.appointmentMetaText}>
                  {new Date(nextAppointment.scheduled_date).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View style={[
                  styles.appointmentStatusDot,
                  { backgroundColor: nextAppointment.status === 'confirmed' ? COLORS.success : COLORS.warning },
                ]} />
                <Text style={styles.appointmentMetaText}>
                  {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ) : (
          <View style={styles.appointmentEmpty}>
            <View style={styles.appointmentEmptyIcon}>
              <Feather name="calendar" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.appointmentEmptyBody}>
              <Text style={styles.appointmentEmptyTitle}>Sin citas próximas</Text>
              <Text style={styles.appointmentEmptyDesc}>
                Da el primer paso: agenda una sesión con un profesional
              </Text>
            </View>
            <Button
              title="Agendar"
              onPress={() => navigation.navigate('Psychologists')}
              variant="primary"
              size="sm"
              style={styles.appointmentEmptyBtn}
              textStyle={{ flexShrink: 0 }}
            />
          </View>
        )}
      </View>

      {/* ===== Acciones rápidas ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explora</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              onPress={() => navigation.navigate(action.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.bg }]}>
                <AppIcon name={action.icon} size={20} color={action.tint} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ===== Frase motivadora (rota con fundido) ===== */}
      <RotatingQuote />

      <CrisisButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl + SPACING.lg,
  },

  // Header
  header: {
    backgroundColor: COLORS.primaryDeep,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.xl + SPACING.lg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerGreeting: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  headerSub: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mood card
  moodCardWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl - SPACING.xs,
  },
  moodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  moodTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodOption: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  moodCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  cancelText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.sm,
  },
  moodCheckinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodDotLarge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: SPACING.md,
  },
  moodCheckinText: {
    flex: 1,
  },
  moodCheckinTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  moodCheckinDesc: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },

  // Appointment card
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  appointmentDateBox: {
    width: 52,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentDay: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.primaryDark,
    lineHeight: 24,
  },
  appointmentMonth: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  appointmentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  appointmentMetaText: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
  },
  appointmentStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  appointmentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  appointmentEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentEmptyBody: {
    flex: 1,
    marginHorizontal: SPACING.sm + 4,
  },
  appointmentEmptyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentEmptyDesc: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  appointmentEmptyBtn: {
    alignSelf: 'center',
    width: 'auto',
  },

  // Quick actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickCard: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickLabel: {
    fontSize: FONTS.sizes.sm - 1,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

});
