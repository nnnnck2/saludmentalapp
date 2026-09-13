import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/admin';

export function AdminDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminService.getSystemStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando..." />;

  const statCards = [
    { label: 'Usuarios Totales', value: stats?.totalUsers || 0, color: COLORS.primary },
    { label: 'Pacientes', value: stats?.totalPatients || 0, color: COLORS.success },
    { label: 'Psicólogos', value: stats?.totalPsychologists || 0, color: COLORS.psychologist },
    { label: 'Citas', value: stats?.totalAppointments || 0, color: COLORS.info },
    { label: 'Posts Foro', value: stats?.totalForumPosts || 0, color: COLORS.secondary },
    { label: 'Pendientes Verif.', value: stats?.pendingVerifications || 0, color: stats?.pendingVerifications > 0 ? COLORS.error : COLORS.success },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>Resumen del sistema</Text>
      </View>

      <View style={styles.statsGrid}>
        {statCards.map((item, index) => (
          <Card key={index} style={styles.statCard}>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </Card>
        ))}
      </View>

      {stats?.pendingVerifications > 0 && (
        <Card style={styles.alertCard}>
          <Text style={styles.alertTitle}>Atención requerida</Text>
          <Text style={styles.alertText}>
            Hay {stats.pendingVerifications} psicólogo(s) pendiente(s) de verificación.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerSection: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: SPACING.md,
    flexGrow: 1,
  },
  statValue: { fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  statLabel: { fontSize: FONTS.sizes.sm - 1, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  alertCard: {
    backgroundColor: COLORS.warning + '30',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginTop: SPACING.md,
  },
  alertTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  alertText: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.text,
    lineHeight: 20,
  },
});
