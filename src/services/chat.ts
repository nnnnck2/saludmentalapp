import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';

export const chatService = {
  async getMessages(userId: string, otherUserId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getConversations(userId: string): Promise<any[]> {
    // Obtener últimos mensajes agrupados por conversación
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id (id, full_name, avatar_url),
        receiver:receiver_id (id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Agrupar por conversación y tomar el último mensaje
    const conversations = new Map<string, any>();
    for (const msg of data) {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversations.has(otherUserId)) {
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;
        conversations.set(otherUserId, {
          other_user_id: otherUserId,
          other_user_name: otherUser?.full_name,
          other_user_avatar: otherUser?.avatar_url,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: 0, // Se calcula aparte
        });
      }
    }

    return Array.from(conversations.values());
  },

  async sendMessage(message: Omit<ChatMessage, 'id' | 'created_at' | 'is_read'>) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    if (error) throw error;

    // Notificar al receptor
    await supabase.from('notifications').insert({
      user_id: message.receiver_id,
      type: 'message',
      title: 'Nuevo mensaje',
      body: message.content.substring(0, 100),
      data: { sender_id: message.sender_id },
    });

    return data;
  },

  subscribeToMessages(userId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  },

  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },
};
