import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, APP_NAME, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { confirmAsync, infoAlert } from '../../utils/alert';

const ROLE_LABELS: Record<string, string> = {
  patient: 'Paciente',
  psychologist: 'Psicólogo',
  admin: 'Administrador',
  guest: 'Invitado',
};

export function ProfileScreen() {
  const { user, signOut, updateProfile, refreshProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    // confirmAsync funciona en web (window.confirm) y nativo (Alert.alert).
    // El antiguo Alert.alert era un no-op en web → el botón no hacía nada.
    const ok = await confirmAsync({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      confirmText: 'Cerrar sesión',
      destructive: true,
    });
    if (!ok) return;

    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
      infoAlert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      infoAlert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
      });
      await refreshProfile();
      setShowEditModal(false);
      infoAlert('Listo', 'Perfil actualizado');
    } catch {
      infoAlert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      icon: 'user' as const,
      label: 'Editar perfil',
      tint: COLORS.primary,
      onPress: () => {
        setEditName(user?.full_name || '');
        setEditPhone(user?.phone || '');
        setShowEditModal(true);
      },
    },
    {
      icon: 'bell' as const,
      label: 'Notificaciones',
      tint: COLORS.info,
      onPress: () => infoAlert('Próximamente', 'Configuración de notificaciones próximamente'),
    },
    {
      icon: 'lock' as const,
      label: 'Privacidad y seguridad',
      tint: COLORS.psychologist,
      onPress: () => infoAlert('Próximamente', 'Configuración de privacidad próximamente'),
    },
    {
      icon: 'help-circle' as const,
      label: 'Ayuda y soporte',
      tint: COLORS.secondaryDark,
      onPress: () => infoAlert('Próximamente', 'Centro de ayuda próximamente'),
    },
    {
      icon: 'file-text' as const,
      label: 'Términos y condiciones',
      tint: COLORS.textSecondary,
      onPress: () => infoAlert('Próximamente', 'Términos y condiciones próximamente'),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarRing}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={80} />
        </View>
        <Text style={styles.name}>{user?.full_name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: COLORS.primaryMist }]}>
          <Text style={[styles.roleText, { color: COLORS.primaryDark }]}>
            {ROLE_LABELS[user?.role || 'guest'] || 'Invitado'}
          </Text>
        </View>
      </View>

      {/* Menú */}
      <Card style={styles.menuCard} padding={0}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: item.tint + '14' }]}>
              <Feather name={item.icon} size={17} color={item.tint} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Información de cuenta */}
      <Card style={styles.statsCard}>
        <View style={styles.statsTitleRow}>
          <Feather name="info" size={15} color={COLORS.primary} />
          <Text style={styles.statsTitle}>Información de la cuenta</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Miembro desde</Text>
            <Text style={styles.statValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                  })
                : '—'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Rol</Text>
            <Text style={styles.statValue}>{ROLE_LABELS[user?.role || 'guest'] || 'Invitado'}</Text>
          </View>
        </View>
      </Card>

      {/* Cerrar sesión */}
      <Button
        title="Cerrar sesión"
        onPress={handleSignOut}
        variant="danger"
        size="md"
        loading={signingOut}
      />

      <Text style={styles.version}>{APP_NAME} v1.0.0</Text>

      {/* Modal de edición */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Feather name="x" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+593 99 123 4567"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textLight}
            />

            <Button
              title="Guardar cambios"
              onPress={handleSaveProfile}
              loading={saving}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarRing: {
    padding: 4,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuCard: {
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  statsCard: { marginBottom: SPACING.lg },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: SPACING.lg,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
});
