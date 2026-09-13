import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, RESOURCE_TYPE_LABELS } from '../../constants';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EducationalResource, ResourceType } from '../../types';
import { resourceService } from '../../services/resources';

const FILTERS: { label: string; value: ResourceType | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Artículos', value: 'article' },
  { label: 'Videos', value: 'video' },
  { label: 'Papers', value: 'paper' },
  { label: 'Podcasts', value: 'podcast' },
  { label: 'Ejercicios', value: 'exercise' },
];

export function ResourcesScreen() {
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ResourceType | 'all'>('all');

  useEffect(() => {
    loadResources();
  }, [activeFilter]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getResources(
        activeFilter === 'all' ? undefined : activeFilter
      );
      setResources(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const openResource = (resource: EducationalResource) => {
    if (resource.url) {
      Linking.openURL(resource.url);
    }
  };

  const renderResource = ({ item }: { item: EducationalResource }) => (
    <TouchableOpacity onPress={() => openResource(item)} activeOpacity={0.7}>
      <Card style={styles.resourceCard}>
        <View style={styles.resourceHeader}>
          <Text style={styles.resourceType}>
            {RESOURCE_TYPE_LABELS[item.type] || item.type}
          </Text>
          {item.tags?.slice(0, 2).map((tag, i) => (
            <View key={i} style={styles.resourceTag}>
              <Text style={styles.resourceTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.resourceTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.resourceDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filters}>
        <FlatList
          horizontal
          data={FILTERS}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {loading ? (
        <LoadingSpinner message="Cargando recursos..." />
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>—</Text>
              <Text style={styles.emptyTitle}>No hay recursos aún</Text>
              <Text style={styles.emptyDesc}>Pronto añadiremos más contenido</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filters: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.textOnPrimary,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  resourceCard: {
    marginBottom: SPACING.sm,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  resourceType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resourceTag: {
    backgroundColor: '#F0F6FF',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: SPACING.sm,
  },
  resourceTagText: {
    fontSize: 10,
    color: COLORS.primary,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
