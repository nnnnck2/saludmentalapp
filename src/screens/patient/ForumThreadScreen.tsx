import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../constants';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { infoAlert } from '../../utils/alert';
import { ForumPost, ForumComment } from '../../types';
import { forumService } from '../../services/forum';

type ForumThreadParams = {
  ForumThread: { postId: string; title: string };
};

export function ForumThreadScreen() {
  const route = useRoute<RouteProp<ForumThreadParams, 'ForumThread'>>();
  const { user, isAuthenticated } = useAuth();
  const { postId } = route.params;

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(0);

  useEffect(() => {
    loadThread();
    checkSupport();
  }, []);

  const loadThread = async () => {
    try {
      const [fetchedPost, fetchedComments] = await Promise.all([
        forumService.getPost(postId),
        forumService.getComments(postId),
      ]);
      setPost(fetchedPost);
      setSupportCount(fetchedPost.support_count || 0);
      setComments(fetchedComments);
    } catch {
      infoAlert('Error', 'No se pudo cargar la publicación');
    } finally {
      setLoading(false);
    }
  };

  const checkSupport = async () => {
    if (!user) return;
    try {
      const supported = await forumService.hasUserSupported(user.id, postId);
      setIsSupported(supported);
    } catch {}
  };

  const handleSupport = async () => {
    if (!user || !isAuthenticated) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para apoyar');
      return;
    }

    // Optimista: reflejar el toque al instante
    const wasSupported = isSupported;
    setIsSupported(!wasSupported);
    setSupportCount(prev => Math.max(0, prev + (wasSupported ? -1 : 1)));

    try {
      // Toggle atómico: el servidor confirma el estado real y el conteo
      const result = await forumService.toggleSupport(postId);
      setIsSupported(result.supported);
      setSupportCount(result.support_count);
    } catch {
      // Revertir si falló
      setIsSupported(wasSupported);
      setSupportCount(prev => Math.max(0, prev + (wasSupported ? 1 : -1)));
      infoAlert('Error', 'No se pudo procesar tu apoyo');
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    if (!isAuthenticated) {
      infoAlert('Inicia sesión', 'Debes iniciar sesión para comentar');
      return;
    }

    setSending(true);
    try {
      await forumService.createComment({
        post_id: postId,
        author_id: user?.id ?? null,
        content: commentText.trim(),
        is_anonymous: commentAnonymous,
      });
      setCommentText('');
      loadThread();
    } catch {
      infoAlert('Error', 'No se pudo enviar el comentario');
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Cargando..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ListHeaderComponent={
          post ? (
            <View style={styles.postCard}>
              {/* Header */}
              <View style={styles.postHeader}>
                <Avatar
                  uri={post.is_anonymous ? undefined : post.author_avatar}
                  name={post.is_anonymous ? 'A' : (post.author_name || 'U')}
                  size={38}
                />
                <View style={styles.postHeaderText}>
                  <Text style={styles.postAuthor}>
                    {post.is_anonymous ? 'Anónimo' : (post.author_name || 'Usuario')}
                  </Text>
                  <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                </View>
                {post.is_anonymous && (
                  <View style={styles.anonBadge}>
                    <Feather name="eye-off" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.anonBadgeText}>Anónimo</Text>
                  </View>
                )}
              </View>

              {/* Content */}
              {post.title && post.title !== 'Sin título' && (
                <Text style={styles.postTitle}>{post.title}</Text>
              )}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Support */}
              <View style={styles.supportRow}>
                <TouchableOpacity
                  style={[styles.supportBtn, isSupported && styles.supportBtnActive]}
                  onPress={handleSupport}
                  activeOpacity={0.7}
                >
                  <Feather
                    name="heart"
                    size={15}
                    color={isSupported ? COLORS.error : COLORS.textSecondary}
                  />
                  <Text style={[styles.supportCount, isSupported && styles.supportCountActive]}>
                    {supportCount}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.commentsLabel}>
                  {comments.length} comentario{comments.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ) : null
        }
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Avatar
                name={item.is_anonymous ? 'A' : (item.author_name || 'U')}
                size={28}
              />
              <View style={styles.commentHeaderText}>
                <Text style={styles.commentAuthor}>
                  {item.is_anonymous ? 'Anónimo' : (item.author_name || 'Usuario')}
                </Text>
                <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
              </View>
            </View>
            <Text style={styles.commentText}>{item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Feather name="message-circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin comentarios aún</Text>
            <Text style={styles.emptyDesc}>Sé el primero en responder</Text>
          </View>
        }
      />

      {/* Comment Input */}
      <View style={styles.commentInputBar}>
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe un comentario..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            placeholderTextColor={COLORS.textLight}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <Text style={styles.sendText}>...</Text>
            ) : (
              <Feather name="send" size={16} color={COLORS.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.anonToggle}
          onPress={() => setCommentAnonymous(!commentAnonymous)}
          activeOpacity={0.6}
        >
          <View style={[styles.checkbox, commentAnonymous && styles.checkboxActive]}>
            {commentAnonymous && (
              <Feather name="check" size={10} color={COLORS.textOnPrimary} />
            )}
          </View>
          <Text style={styles.anonLabel}>Anónimo</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingBottom: SPACING.xxl },

  // Post card
  postCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  postHeaderText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  postAuthor: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONTS.sizes.sm - 1,
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
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  postContent: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
  },
  supportBtnActive: {
    backgroundColor: COLORS.errorMist,
  },
  supportCount: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  supportCountActive: {
    color: COLORS.error,
  },
  commentsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },

  // Comments
  commentCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    ...SHADOWS.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  commentHeaderText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  commentAuthor: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  commentTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  commentText: {
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 36,
  },

  // Empty
  empty: {
    alignItems: 'center',
    padding: SPACING.xl * 2,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emptyDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 4,
  },

  // Comment Input
  commentInputBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.sm + 1,
    color: COLORS.text,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: COLORS.textOnPrimary,
    fontWeight: '600',
    fontSize: FONTS.sizes.sm + 1,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  anonLabel: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
  },
});
