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
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Profile } from '../../types';
import { adminService } from '../../services/admin';

export function UsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'patient' | 'psychologist' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter((u) => u.role === filter);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return COLORS.error;
      case 'psychologist': return COLORS.secondary;
      case 'patient': return COLORS.primary;
      default: return COLORS.textLight;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'psychologist': return 'Psicólogo';
      case 'patient': return 'Paciente';
      default: return 'Invitado';
    }
  };

  const renderUser = ({ item }: { item: Profile }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <Avatar uri={item.avatar_url} name={item.full_name} size={44} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.full_name || 'Sin nombre'}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.date}>
            Registrado: {new Date(item.created_at).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
            {getRoleLabel(item.role)}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando usuarios..." />;

  const filters = [
    { label: 'Todos', value: 'all' as const },
    { label: 'Pacientes', value: 'patient' as const },
    { label: 'Psicólogos', value: 'psychologist' as const },
    { label: 'Admins', value: 'admin' as const },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterBtnText, filter === f.value && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No hay usuarios</Text>
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
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  filterBtnTextActive: { color: COLORS.textOnPrimary },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.xs },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  email: { fontSize: 12, color: COLORS.textSecondary },
  date: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  roleBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
});
