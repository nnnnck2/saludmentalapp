import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { infoAlert } from '../../utils/alert';
import { Notification } from '../../types';
import { notificationService } from '../../services/notifications';

const NOTIFICATION_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  appointment_reminder: 'calendar',
  task_assigned: 'clipboard',
  task_reviewed: 'check-circle',
  message: 'message-circle',
  system: 'info',
};

export function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch {
      infoAlert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      console.error('Error marking as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      console.error('Error marking all as read');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Marcar como leída
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo
    if (notification.data) {
      const data = notification.data as any;
      switch (notification.type) {
        case 'appointment_reminder':
          navigation.navigate('Citas');
          break;
        case 'task_assigned':
        case 'task_reviewed':
          navigation.navigate('Tareas');
          break;
        case 'message':
          if (data.sender_id) {
            navigation.navigate('Chat', { otherUserId: data.sender_id });
          }
          break;
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconTint = item.type === 'task_reviewed' ? COLORS.success
      : item.type === 'appointment_reminder' ? COLORS.primary
      : item.type === 'message' ? COLORS.psychologist
      : COLORS.textSecondary;

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card style={!item.is_read ? [styles.notificationCard, styles.unreadCard] : styles.notificationCard}>
          <View style={styles.notifRow}>
            <View style={[styles.iconContainer, !item.is_read && styles.iconUnread]}>
              <Feather
                name={NOTIFICATION_ICONS[item.type] || 'bell'}
                size={17}
                color={iconTint}
              />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              {item.body && (
                <Text style={styles.notifBody} numberOfLines={2}>
                  {item.body}
                </Text>
              )}
              <Text style={styles.notifTime}>
                {getTimeAgo(new Date(item.created_at))}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando notificaciones..." />;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadText}>
            {unreadCount} no leída{unreadCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Feather name="bell" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyDesc}>
              Aquí aparecerán tus recordatorios de citas, tareas y mensajes
            </Text>
          </View>
        }
      />
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  unreadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  notificationCard: { marginBottom: SPACING.xs },
  unreadCard: {
    backgroundColor: COLORS.primaryMist,
  },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconUnread: {
    backgroundColor: COLORS.primaryLight,
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  notifBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 20,
  },
});
