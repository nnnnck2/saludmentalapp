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
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ForumPost } from '../../types';
import { forumService } from '../../services/forum';

export function ForumModerationScreen() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'moderated'>('active');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await forumService.getPosts();
      setPosts(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los posts');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (postId: string, action: 'moderated' | 'active' | 'hidden') => {
    const actionLabels = {
      moderated: 'moderado',
      active: 'restaurado',
      hidden: 'ocultado',
    };

    try {
      await forumService.moderatePost(postId, action);
      Alert.alert('Éxito', `Post ${actionLabels[action]}`);
      loadPosts();
    } catch {
      Alert.alert('Error', 'No se pudo moderar el post');
    }
  };

  const handleDelete = (postId: string) => {
    Alert.alert('Eliminar post', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await forumService.deletePost(postId);
            loadPosts();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const filteredPosts = posts.filter((p) =>
    filter === 'active' ? p.status === 'active' : p.status !== 'active'
  );

  const renderPost = ({ item }: { item: ForumPost }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          {
            backgroundColor:
              item.status === 'active' ? '#E8F5E9' :
              item.status === 'moderated' ? '#FFF3E0' : '#FFEBEE',
          },
        ]}>
          <Text style={[
            styles.statusText,
            {
              color:
                item.status === 'active' ? '#2E7D32' :
                item.status === 'moderated' ? '#E65100' : '#C62828',
            },
          ]}>
            {item.status === 'active' ? 'Activo' :
             item.status === 'moderated' ? 'Moderado' : 'Oculto'}
          </Text>
        </View>
      </View>
      <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.meta}>
        Por: {item.is_anonymous ? 'Anónimo' : 'Usuario'} ·{' '}
        {new Date(item.created_at).toLocaleDateString('es-ES')}
      </Text>

      <View style={styles.actions}>
        {item.status === 'active' ? (
          <>
            <Button
              title="Moderar"
              onPress={() => handleModerate(item.id, 'moderated')}
              variant="outline"
              size="sm"
            />
            <Button
              title="Ocultar"
              onPress={() => handleModerate(item.id, 'hidden')}
              variant="ghost"
              size="sm"
            />
            <Button
              title="Eliminar"
              onPress={() => handleDelete(item.id)}
              variant="danger"
              size="sm"
            />
          </>
        ) : (
          <Button
            title="Restaurar"
            onPress={() => handleModerate(item.id, 'active')}
            variant="primary"
            size="sm"
          />
        )}
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando foro..." />;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterBtnText, filter === 'active' && styles.filterBtnTextActive]}>
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'moderated' && styles.filterBtnActive]}
          onPress={() => setFilter('moderated')}
        >
          <Text style={[styles.filterBtnText, filter === 'moderated' && styles.filterBtnTextActive]}>
            Moderados/Ocultos
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {filter === 'active' ? 'No hay posts activos' : 'No hay posts moderados'}
            </Text>
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
  filterBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterBtnTextActive: { color: COLORS.textOnPrimary },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  statusBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  content: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  meta: { fontSize: 11, color: COLORS.textLight, marginBottom: SPACING.sm },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
});
