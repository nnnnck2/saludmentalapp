import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { infoAlert, confirmAsync } from '../../utils/alert';
import { PsychologistPost } from '../../types';
import { psychologistService } from '../../services/psychologists';

export function PostsScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PsychologistPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    if (!user) return;
    try {
      const data = await psychologistService.getPsychologistPosts(user.id);
      setPosts(data);
    } catch {
      infoAlert('Error', 'No se pudieron cargar los posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    // Validación con feedback visible (antes fallaba en silencio)
    if (!user) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para publicar');
      return;
    }
    if (!newTitle.trim()) {
      infoAlert('Falta el título', 'Escribe un título para tu post');
      return;
    }
    if (!newContent.trim()) {
      infoAlert('Falta el contenido', 'Escribe el contenido de tu post');
      return;
    }

    setSaving(true);
    try {
      await psychologistService.createPost({
        psychologist_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        is_published: true,
      });
      setShowModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      loadPosts();
    } catch (e: any) {
      console.error('Error creando post:', e);
      const raw: string = e?.message || '';
      if (raw.includes('row-level security') || raw.includes('permission')) {
        infoAlert(
          'No se pudo publicar',
          'Tu sesión expiró o falta aplicar una migración de base de datos (fix_psychologist_posts_rls.sql).'
        );
      } else {
        infoAlert('Error', raw || 'No se pudo crear el post');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirmAsync({
      title: 'Eliminar post',
      message: `¿Eliminar "${title}"?`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    try {
      await psychologistService.deletePost(id);
      loadPosts();
    } catch {
      infoAlert('Error', 'No se pudo eliminar');
    }
  };

  const renderPost = ({ item }: { item: PsychologistPost }) => (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDate}>
          {new Date(item.created_at).toLocaleDateString('es-ES')}
        </Text>
      </View>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.title)}>
          <Text style={styles.deleteBtn}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <LoadingSpinner fullScreen message="Cargando posts..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            title="+ Nuevo post"
            onPress={() => setShowModal(true)}
            variant="primary"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No hay posts aún</Text>
            <Text style={styles.emptyDesc}>
              Crea posts para compartir tu conocimiento y atraer pacientes
            </Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Post</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtn}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Título del post"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribe tu contenido aquí..."
              value={newContent}
              onChangeText={setNewContent}
              multiline
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={styles.input}
              placeholder="Tags (separados por coma): ansiedad, bienestar"
              value={newTags}
              onChangeText={setNewTags}
              placeholderTextColor={COLORS.textLight}
            />

            <Button
              title="Publicar"
              onPress={handleCreatePost}
              loading={saving}
              disabled={!newTitle.trim() || !newContent.trim()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  postCard: {},
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  postDate: { fontSize: 11, color: COLORS.textLight },
  postContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  tag: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, color: COLORS.textSecondary },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: { fontSize: 13, color: COLORS.error },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 20, color: COLORS.textLight, padding: SPACING.xs },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
