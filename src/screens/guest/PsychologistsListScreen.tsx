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
import { PsychologistProfile } from '../../types';
import { psychologistService } from '../../services/psychologists';

export function PsychologistsListScreen() {
  const [psychologists, setPsychologists] = useState<PsychologistProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      const data = await psychologistService.getApprovedPsychologists();
      setPsychologists(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los psicólogos');
    } finally {
      setLoading(false);
    }
  };

  const renderPsychologist = ({ item }: { item: PsychologistProfile }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={item.avatar_url} name={item.full_name} size={56} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.specialties}>
            {item.specialization?.slice(0, 3).join(', ') || 'Psicólogo general'}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>{item.rating.toFixed(1)} · {item.years_experience || 0} años exp.</Text>
          </View>
        </View>
      </View>
      {item.bio && (
        <Text style={styles.bio} numberOfLines={3}>
          {item.bio}
        </Text>
      )}
      <View style={styles.tags}>
        {item.languages?.map((lang, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{lang}</Text>
          </View>
        ))}
        {item.consultation_modes?.map((mode, i) => (
          <View key={`mode-${i}`} style={[styles.tag, styles.tagMode]}>
            <Text style={[styles.tagText, styles.tagTextMode]}>
              {mode === 'online' ? 'Online' : mode === 'in_person' ? 'Presencial' : 'Ambos'}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => Alert.alert('Info', 'Regístrate para agendar una cita')}
      >
        <Text style={styles.contactButtonText}>Agendar cita</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando psicólogos..." />;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={psychologists}
      renderItem={renderPsychologist}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No hay psicólogos disponibles</Text>
          <Text style={styles.emptyDesc}>Vuelve más tarde o regístrate para ser el primero</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  specialties: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 4,
  },
  stat: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  tagMode: {
    backgroundColor: '#F0F6FF',
  },
  tagTextMode: {
    color: COLORS.primary,
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  contactButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '600',
    fontSize: 14,
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
