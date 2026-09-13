import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { psychologistService } from '../../services/psychologists';

export function StatisticsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    if (!user) return;
    try {
      const data = await psychologistService.getDashboardStats(user.id);
      setStats(data);
    } catch {
      console.error('Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando estadísticas..." />;

  const statItems = [
    { icon: null, label: 'Total Pacientes', value: stats?.totalPatients || 0, color: COLORS.primary },
    { icon: null, label: 'Citas Próximas', value: stats?.upcomingAppointments || 0, color: COLORS.secondary },
    { icon: null, label: 'Tareas Pendientes', value: stats?.pendingTasks || 0, color: COLORS.warning },
    { icon: null, label: 'Vistas de Perfil', value: stats?.profileViews || 0, color: COLORS.success },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Estadísticas</Text>

      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <Card key={index} style={styles.statCard}>
            <Text style={[styles.statValue, { color: item.color }]}>
              {item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Sugerencias</Text>
        <Text style={styles.infoText}>
          • Mantén tu perfil actualizado para atraer más pacientes{'\n'}
          • Publica contenido regularmente para aumentar tu visibilidad{'\n'}
          • Revisa las tareas pendientes para mantener a tus pacientes comprometidos
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.md,
    flexGrow: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F0F6FF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
