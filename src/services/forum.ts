import { supabase } from '../lib/supabase';
import { ForumCategory, ForumPost, ForumComment } from '../types';

export const forumService = {
  // ---- CATEGORÍAS ----
  async getCategories(): Promise<ForumCategory[]> {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  // ---- POSTS (feeds) ----
  async getPosts(categoryId?: string): Promise<ForumPost[]> {
    // El conteo de apoyos se resuelve aparte con un RPC SECURITY DEFINER:
    // el count embebido respeta RLS (solo verías TUS apoyos) → contador
    // roto. Ver supabase/fix_forum_support_count.sql
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        comments:forum_comments (count),
        author:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const supportCounts = await this.getSupportCounts();

    return data.map((post: any) => ({
      ...post,
      comment_count: post.comments?.[0]?.count || 0,
      support_count: supportCounts.get(post.id) || 0,
      author_name: post.is_anonymous ? undefined : post.author?.full_name,
      author_avatar: post.is_anonymous ? undefined : post.author?.avatar_url,
    }));
  },

  // Mapa post_id → conteo real de apoyos (RPC SECURITY DEFINER)
  async getSupportCounts(): Promise<Map<string, number>> {
    const { data, error } = await supabase.rpc('get_forum_support_counts');
    if (error) return new Map();
    const map = new Map<string, number>();
    for (const row of (data || []) as Array<{ post_id: string; support_count: number }>) {
      map.set(row.post_id, Number(row.support_count) || 0);
    }
    return map;
  },

  // Conteo real para una publicación (RPC SECURITY DEFINER)
  async getSupportCount(postId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_forum_support_count', {
      p_post_id: postId,
    });
    if (error) return 0;
    return Number(data) || 0;
  },

  // ---- POST INDIVIDUAL ----
  async getPost(id: string): Promise<ForumPost> {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        comments:forum_comments (count),
        author:author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;

    const supportCount = await this.getSupportCount(id);

    return {
      ...data,
      comment_count: (data as any).comments?.[0]?.count || 0,
      support_count: supportCount,
      author_name: (data as any).is_anonymous ? undefined : (data as any).author?.full_name,
      author_avatar: (data as any).is_anonymous ? undefined : (data as any).author?.avatar_url,
    };
  },

  // ---- CREAR POST ----
  async createPost(post: Omit<ForumPost, 'id' | 'created_at' | 'updated_at' | 'status' | 'comment_count' | 'support_count' | 'author_name' | 'author_avatar'>) {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        category_id: post.category_id,
        author_id: post.author_id,
        title: post.title,
        content: post.content,
        is_anonymous: post.is_anonymous,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePost(id: string, updates: Partial<ForumPost>) {
    const { data, error } = await supabase
      .from('forum_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePost(id: string) {
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ---- COMENTARIOS ----
  async getComments(postId: string): Promise<ForumComment[]> {
    const { data, error } = await supabase
      .from('forum_comments')
      .select(`
        *,
        author:author_id (
          full_name
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map((comment: any) => ({
      ...comment,
      author_name: comment.is_anonymous ? undefined : comment.author?.full_name,
    }));
  },

  async createComment(comment: Omit<ForumComment, 'id' | 'created_at' | 'updated_at' | 'author_name'>) {
    const { data, error } = await supabase
      .from('forum_comments')
      .insert(comment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- MODERACIÓN ----
  async moderatePost(id: string, status: 'active' | 'moderated' | 'hidden') {
    return this.updatePost(id, { status });
  },

  // ---- SOPORTE / LIKES ----
  // Toggle atómico vía RPC: evita condiciones de carrera entre
  // "verificar si existe" e "insertar/borrar".
  async toggleSupport(postId: string): Promise<{ supported: boolean; support_count: number }> {
    const { data, error } = await supabase.rpc('toggle_forum_support', {
      p_post_id: postId,
    });
    if (error) throw error;
    const row = (data?.[0] || {}) as { supported?: boolean; support_count?: number };
    return {
      supported: !!row.supported,
      support_count: Number(row.support_count) || 0,
    };
  },

  /** @deprecated Usa toggleSupport */
  async supportPost(_userId: string, postId: string) {
    return this.toggleSupport(postId);
  },

  /** @deprecated Usa toggleSupport */
  async unsupportPost(_userId: string, postId: string) {
    const res = await this.toggleSupport(postId);
    return res;
  },

  async hasUserSupported(userId: string, postId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('forum_post_supports')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  },

  async getUserSupports(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('forum_post_supports')
      .select('post_id')
      .eq('user_id', userId);
    if (error) return [];
    return data.map((s: any) => s.post_id);
  },
};
