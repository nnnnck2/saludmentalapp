import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { PsychologistProfile } from '../../types';
import { adminService } from '../../services/admin';

export function VerifyPsychologistsScreen() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PsychologistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPsychologist, setSelectedPsychologist] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const data = await adminService.getPendingPsychologists();
      setPending(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (psychologistId: string) => {
    if (!user) return;
    try {
      await adminService.approvePsychologist(psychologistId, user.id);
      Alert.alert('Éxito', 'Psicólogo aprobado');
      setPending((prev) => prev.filter((p) => p.id !== psychologistId));
    } catch {
      Alert.alert('Error', 'No se pudo aprobar');
    }
  };

  const handleReject = async () => {
    if (!selectedPsychologist || !rejectReason.trim()) return;
    try {
      await adminService.rejectPsychologist(selectedPsychologist, rejectReason.trim());
      Alert.alert('Completado', 'Psicólogo rechazado');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedPsychologist(null);
      setPending((prev) => prev.filter((p) => p.id !== selectedPsychologist));
    } catch {
      Alert.alert('Error', 'No se pudo rechazar');
    }
  };

  const renderPsychologist = ({ item }: { item: PsychologistProfile }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={item.avatar_url} name={item.full_name} size={56} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.specialization && (
            <Text style={styles.specialties}>
              {item.specialization.slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
      </View>

      {item.bio && <Text style={styles.bio} numberOfLines={3}>{item.bio}</Text>}

      <View style={styles.details}>
        {item.license_number && (
          <Text style={styles.detail}>Cédula: {item.license_number}</Text>
        )}
        {item.years_experience && (
          <Text style={styles.detail}>Experiencia: {item.years_experience} años</Text>
        )}
        {item.education && item.education.length > 0 && (
          <Text style={styles.detail}>Educación: {item.education.slice(0, 2).join(', ')}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="Aprobar"
          onPress={() => handleApprove(item.id)}
          variant="primary"
          size="sm"
        />
        <Button
          title="Rechazar"
          onPress={() => {
            setSelectedPsychologist(item.id);
            setShowRejectModal(true);
          }}
          variant="danger"
          size="sm"
        />
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={pending}
        renderItem={renderPsychologist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No hay solicitudes pendientes</Text>
            <Text style={styles.emptyDesc}>Todos los psicólogos han sido verificados</Text>
          </View>
        }
      />

      <Modal visible={showRejectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Razón del rechazo</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Explica por qué se rechaza esta solicitud..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              placeholderTextColor={COLORS.textLight}
            />
            <View style={styles.modalActions}>
              <Button
                title="Enviar y rechazar"
                onPress={handleReject}
                variant="danger"
                disabled={!rejectReason.trim()}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', marginBottom: SPACING.sm },
  cardInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 12, color: COLORS.textSecondary },
  specialties: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
  bio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  details: { gap: 2, marginBottom: SPACING.sm },
  detail: { fontSize: 12, color: COLORS.textSecondary },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  rejectInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  modalActions: { gap: SPACING.sm },
  cancelText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.sm,
    fontSize: 14,
  },
});
