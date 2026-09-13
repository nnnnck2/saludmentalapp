import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../constants';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { infoAlert } from '../../utils/alert';
import { ForumCategory, ForumPost } from '../../types';
import { forumService } from '../../services/forum';

type FilterType = 'recientes' | 'populares';

export function ForumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('recientes');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [creating, setCreating] = useState(false);
  const [supportedPosts, setSupportedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserSupports();
    }
  }, [user, isAuthenticated]);

  const loadUserSupports = async () => {
    if (!user) return;
    try {
      const supports = await forumService.getUserSupports(user.id);
      setSupportedPosts(new Set(supports));
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, fetchedPosts] = await Promise.all([
        forumService.getCategories(),
        forumService.getPosts(selectedCategory || undefined),
      ]);
      setCategories(cats);
      const sorted = filter === 'populares'
        ? [...fetchedPosts].sort((a, b) => (b.support_count || 0) - (a.support_count || 0))
        : fetchedPosts;
      setPosts(sorted);
    } catch (e) {
      console.error('Error cargando foro:', e);
      infoAlert('Error', 'No se pudo cargar el foro');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedPosts = await forumService.getPosts(selectedCategory || undefined);
      const sorted = filter === 'populares'
        ? [...fetchedPosts].sort((a, b) => (b.support_count || 0) - (a.support_count || 0))
        : fetchedPosts;
      setPosts(sorted);
    } catch {}
    setRefreshing(false);
  }, [selectedCategory, filter]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    const sorted = newFilter === 'populares'
      ? [...posts].sort((a, b) => (b.support_count || 0) - (a.support_count || 0))
      : [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPosts(sorted);
  };

  const openCreateModal = () => {
    if (!isAuthenticated) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para publicar');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreatePost = async () => {
    // Validaciones con feedback visible (antes fallaba en silencio)
    if (!isAuthenticated) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para publicar');
      return;
    }
    if (!newContent.trim()) {
      infoAlert('Escribe algo', 'Comparte lo que sientes con la comunidad');
      return;
    }

    setCreating(true);
    try {
      // Asegurar categoría válida: las categorías se cargan en loadData();
      // si por alguna razón no hay, usamos la primera disponible o fallamos con mensaje claro.
      let categoryId = selectedCategory;
      if (!categoryId) {
        let cats = categories;
        if (!cats.length) {
          cats = await forumService.getCategories();
          setCategories(cats);
        }
        if (!cats.length) {
          infoAlert('Error', 'No hay categorías disponibles. Contacta al administrador.');
          return;
        }
        categoryId = cats[0].id;
      }

      await forumService.createPost({
        category_id: categoryId,
        author_id: user?.id ?? null,
        title: newTitle.trim() || 'Sin título',
        content: newContent.trim(),
        is_anonymous: isAnonymous,
      });
      setShowCreateModal(false);
      setNewContent('');
      setNewTitle('');
      setIsAnonymous(true);
      // Recargar manteniendo el filtro actual
      setFilter('recientes');
      await loadData();
    } catch (e: any) {
      console.error('Error creando publicación:', e);
      // Mensajes claros para los errores más comunes de RLS
      const raw: string = e?.message || '';
      if (raw.includes('row-level security') || raw.includes('permission')) {
        infoAlert(
          'No se pudo publicar',
          'Tu sesión expiró o no tienes permiso. Cierra sesión, vuelve a entrar e inténtalo de nuevo.'
        );
      } else {
        infoAlert('Error', raw || 'No se pudo crear la publicación');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSupport = async (postId: string) => {
    if (!user || !isAuthenticated) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para apoyar');
      return;
    }

    // Optimista: reflejar el toque al instante
    const wasSupported = supportedPosts.has(postId);
    setSupportedPosts(prev => {
      const next = new Set(prev);
      if (wasSupported) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, support_count: Math.max(0, (p.support_count || 0) + (wasSupported ? -1 : 1)) }
        : p
    ));

    try {
      // Toggle atómico: el servidor decide el estado real y devuelve el conteo
      const result = await forumService.toggleSupport(postId);
      setSupportedPosts(prev => {
        const next = new Set(prev);
        if (result.supported) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, support_count: result.support_count } : p
      ));
    } catch {
      // Revertir al estado previo si falló
      setSupportedPosts(prev => {
        const next = new Set(prev);
        if (wasSupported) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, support_count: Math.max(0, (p.support_count || 0) + (wasSupported ? 1 : -1)) }
          : p
      ));
      infoAlert('Error', 'No se pudo procesar tu apoyo');
    }
  };

  const navigateToPost = (post: ForumPost) => {
    navigation.navigate('ForumThread', {
      postId: post.id,
      title: post.title || 'Publicación',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const renderPost = ({ item }: { item: ForumPost }) => {
    const isSupported = supportedPosts.has(item.id);
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigateToPost(item)}
        activeOpacity={0.7}
      >
        {/* Header: Avatar + Name + Time */}
        <View style={styles.postHeader}>
          <Avatar
            uri={item.is_anonymous ? undefined : item.author_avatar}
            name={item.is_anonymous ? 'A' : (item.author_name || 'U')}
            size={38}
          />
          <View style={styles.postHeaderText}>
            <Text style={styles.postAuthor}>
              {item.is_anonymous ? 'Anónimo' : (item.author_name || 'Usuario')}
            </Text>
            <Text style={styles.postTime}>{formatTimeAgo(item.created_at)}</Text>
          </View>
          {item.is_anonymous && (
            <View style={styles.anonBadge}>
              <Feather name="eye-off" size={11} color={COLORS.textSecondary} />
              <Text style={styles.anonBadgeText}>Anónimo</Text>
            </View>
          )}
        </View>

        {/* Content */}
        {item.title && item.title !== 'Sin título' && (
          <Text style={styles.postTitle}>{item.title}</Text>
        )}
        <Text style={styles.postContent} numberOfLines={6}>
          {item.content}
        </Text>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, isSupported && styles.actionBtnActive]}
            onPress={() => handleSupport(item.id)}
            activeOpacity={0.6}
          >
            <Feather
              name="heart"
              size={15}
              color={isSupported ? COLORS.error : COLORS.textSecondary}
            />
            <Text style={[styles.actionCount, isSupported && styles.actionCountActive]}>
              {item.support_count || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigateToPost(item)}
            activeOpacity={0.6}
          >
            <Feather name="message-circle" size={15} color={COLORS.textSecondary} />
            <Text style={styles.actionCount}>{item.comment_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(
                selectedCategory === item.id ? null : item.id
              )}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryName,
                selectedCategory === item.id && styles.categoryNameActive,
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          ListEmptyComponent={<View style={styles.categoriesEmpty} />}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['recientes', 'populares'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => handleFilterChange(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'recientes' ? 'Recientes' : 'Populares'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {loading ? (
        <LoadingSpinner message="Cargando..." />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feed}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Feather name="users" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Aún no hay publicaciones</Text>
              <Text style={styles.emptyDesc}>Sé el primero en compartir algo</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        activeOpacity={0.8}
        accessibilityLabel="Nueva publicación"
        accessibilityRole="button"
      >
        <Feather name="plus" size={26} color={COLORS.textOnPrimary} />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva publicación</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalTitleInput}
              placeholder="Título (opcional)"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={COLORS.textLight}
            />

            <TextInput
              style={styles.modalContentInput}
              placeholder="¿Qué quieres compartir?"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.anonymousToggle}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.6}
              >
                <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
                  {isAnonymous && (
                    <Feather name="check" size={12} color={COLORS.textOnPrimary} />
                  )}
                </View>
                <Feather name="eye-off" size={13} color={COLORS.textSecondary} />
                <Text style={styles.anonymousLabel}>Publicar anónimamente</Text>
              </TouchableOpacity>

              <Button
                title="Publicar"
                onPress={handleCreatePost}
                loading={creating}
                disabled={!newContent.trim() || creating}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Categories
  categoriesSection: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  categoriesList: {
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  categoriesEmpty: {
    height: 8,
  },
  categoryChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primaryMist,
    borderColor: COLORS.primaryLight,
  },
  categoryName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primaryMist,
  },
  filterBtnText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },

  // Feed
  feed: {
    padding: SPACING.md,
    paddingBottom: 110,
  },
  separator: {
    height: SPACING.sm,
  },

  // Post Card
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  postHeaderText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  postAuthor: {
    fontSize: FONTS.sizes.sm + 1,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 1,
  },
  anonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  anonBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: FONTS.sizes.md + 1,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  postContent: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  actionBtnActive: {
    backgroundColor: COLORS.errorMist,
  },
  actionCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionCountActive: {
    color: COLORS.error,
  },

  // Empty
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalTitleInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalContentInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  },
  modalOptions: {
    gap: SPACING.md,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  anonymousLabel: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
});
