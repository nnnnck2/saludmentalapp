import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

export function PatientListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('all');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    if (!user) return;
    try {
      // Obtener pacientes únicos de las citas
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          patient:patient_id (id, full_name, avatar_url, email),
          status,
          scheduled_date
        `)
        .eq('psychologist_id', user.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      // Agrupar por paciente y tomar la última cita
      const patientMap = new Map<string, any>();
      data.forEach((item: any) => {
        if (!patientMap.has(item.patient_id)) {
          const p = item.patient;
          patientMap.set(item.patient_id, {
            id: p?.id || item.patient_id,
            full_name: p?.full_name,
            avatar_url: p?.avatar_url,
            email: p?.email,
            last_appointment: item.scheduled_date,
            appointment_count: 1,
          });
        } else {
          const existing = patientMap.get(item.patient_id);
          existing.appointment_count += 1;
        }
      });

      setPatients(Array.from(patientMap.values()));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  const renderPatient = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('PatientDetail', { patientId: item.id, patientName: item.full_name })
      }
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <Avatar uri={item.avatar_url} name={item.full_name} size={48} />
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.full_name || 'Paciente'}</Text>
            <Text style={styles.detail}>
              {item.appointment_count} cita{item.appointment_count !== 1 ? 's' : ''}
            </Text>
            {item.last_appointment && (
              <Text style={styles.detail}>
                Última cita: {new Date(item.last_appointment).toLocaleDateString('es-ES')}
              </Text>
            )}
          </View>
          <Text style={styles.arrow}>→</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando pacientes..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        renderItem={renderPatient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tienes pacientes aún</Text>
            <Text style={styles.emptyDesc}>
              Los pacientes que agenden citas contigo aparecerán aquí
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  detail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  arrow: { fontSize: 18, color: COLORS.textLight },
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
