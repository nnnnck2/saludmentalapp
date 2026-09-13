import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { CrisisButton } from '../../components/common/CrisisButton';
import { Appointment } from '../../types';
import { appointmentService } from '../../services/appointments';
import { psychologistService } from '../../services/psychologists';

export function PsychologistDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const [dashboardStats, appointments] = await Promise.all([
        psychologistService.getDashboardStats(user.id),
        appointmentService.getPsychologistAppointments(user.id),
      ]);
      setStats(dashboardStats);
      const upcoming = appointments.filter(
        (a) => a.status === 'scheduled' || a.status === 'confirmed'
      );
      setUpcomingAppts(upcoming.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={52} />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Bienvenido,</Text>
            <Text style={styles.name}>{user?.full_name || 'Psicólogo'}</Text>
          </View>
        </View>
      </View>

      {/* Stats cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalPatients || 0}</Text>
          <Text style={styles.statLabel}>Pacientes</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.upcomingAppointments || 0}</Text>
          <Text style={styles.statLabel}>Próximas citas</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.pendingTasks || 0}</Text>
          <Text style={styles.statLabel}>Tareas por revisar</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.profileViews || 0}</Text>
          <Text style={styles.statLabel}>Vistas de perfil</Text>
        </Card>
      </View>

      {/* Próximas citas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Citas</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Pacientes')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {upcomingAppts.length > 0 ? (
          upcomingAppts.map((appt) => (
            <Card key={appt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentRow}>
                <Avatar uri={appt.patient_name} name={appt.patient_name} size={40} />
                <View style={styles.appointmentInfo}>
                  <Text style={styles.patientName}>{appt.patient_name || 'Paciente'}</Text>
                  <Text style={styles.appointmentDate}>
                    {new Date(appt.scheduled_date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <Text style={styles.appointmentTime}>
                    {new Date(appt.scheduled_date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => navigation.navigate('Chat', { otherUserId: appt.patient_id })}
                >
                  <Text style={styles.chatBtnText}>M</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes citas próximas</Text>
          </Card>
        )}
      </View>

      {/* Acciones rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          {[
            { letter: 'P', label: 'Pacientes', screen: 'Pacientes' },
            { letter: 'E', label: 'Editar perfil', screen: 'ProfileEdit' },
            { letter: 'N', label: 'Nuevo post', screen: 'Posts' },
            { letter: 'S', label: 'Estadísticas', screen: 'Stats' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionBtn}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={styles.actionCircle}>
                <Text style={styles.actionLetter}>{action.letter}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <CrisisButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  header: {
    backgroundColor: COLORS.psychologist,
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: SPACING.md },
  greeting: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textOnPrimary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
    marginTop: -SPACING.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.md,
    flexGrow: 1,
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: { padding: SPACING.md },
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
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginBottom: SPACING.sm },
  appointmentCard: { marginBottom: SPACING.sm },
  appointmentRow: { flexDirection: 'row', alignItems: 'center' },
  appointmentInfo: { flex: 1, marginLeft: SPACING.sm },
  patientName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  appointmentDate: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  appointmentTime: { fontSize: FONTS.sizes.sm - 1, color: COLORS.textSecondary },
  chatBtn: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.psychologist },
  emptyCard: { alignItems: 'center', padding: SPACING.lg },
  emptyText: { fontSize: FONTS.sizes.sm + 1, color: COLORS.textSecondary },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
    flexGrow: 1,
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLetter: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.psychologist },
  actionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '500', color: COLORS.text },
});
