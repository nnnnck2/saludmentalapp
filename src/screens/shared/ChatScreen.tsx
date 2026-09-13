import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Avatar } from '../../components/common/Avatar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/chat';

export function ChatScreen() {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Obtener otro usuario de los parámetros de ruta
  const route = useRoute();
  const otherUserId = (route.params as any)?.otherUserId;

  useEffect(() => {
    if (!otherUserId) {
      loadConversations();
    } else {
      loadMessages();
    }

    // Suscribirse a nuevos mensajes
    const subscription = chatService.subscribeToMessages(user?.id || '', (message) => {
      if (message.sender_id === otherUserId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [otherUserId]);

  const loadMessages = async () => {
    if (!user || !otherUserId) return;
    try {
      const data = await chatService.getMessages(user.id, otherUserId);
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    // Esto sería para listar conversaciones
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !otherUserId) return;

    setSending(true);
    try {
      await chatService.sendMessage({
        sender_id: user.id,
        receiver_id: otherUserId,
        content: newMessage.trim(),
        appointment_id: null,
      });
      setNewMessage('');
      // El mensaje aparecerá vía suscripción o recargando
      loadMessages();
    } catch {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMine = item.sender_id === user?.id;

    return (
      <View style={[styles.messageRow, isMine && styles.myMessageRow]}>
        {!isMine && (
          <Avatar
            uri={item.sender_avatar}
            name={item.sender_name}
            size={32}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
            {new Date(item.created_at).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>—</Text>
            <Text style={styles.emptyTitle}>No hay mensajes aún</Text>
            <Text style={styles.emptyDesc}>Envía un mensaje para empezar la conversación</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          placeholderTextColor={COLORS.textLight}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Text style={styles.sendIcon}>{sending ? '...' : '→'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  messagesList: {
    padding: SPACING.md,
    paddingBottom: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    ...SHADOWS.sm,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.textOnPrimary,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  sendIcon: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
  },
});
