import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

type PermissionStatus = {
  status: 'granted' | 'denied' | 'undetermined';
  granted: boolean;
  expires: 'never' | number;
  canAskAgain: boolean;
};

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Las notificaciones solo funcionan en dispositivos físicos');
      return false;
    }

    const permission = (await Notifications.getPermissionsAsync()) as unknown as PermissionStatus;
    if (permission.status !== 'granted') {
      const requestPermission = (await Notifications.requestPermissionsAsync()) as unknown as PermissionStatus;
      if (requestPermission.status !== 'granted') {
        console.log('Permiso de notificaciones denegado');
        return false;
      }
    }

    // Configurar canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90D9',
      });
    }

    return true;
  },

  async registerForPushNotifications(userId: string): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      // Guardar token en la base de datos
      await supabase
        .from('profiles')
        .update({ push_token: pushToken })
        .eq('id', userId);

      return pushToken;
    } catch (error) {
      console.error('Error registering push token:', error);
      return null;
    }
  },

  // ---- NOTIFICACIONES EN LA APP ----
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  // ---- PROGRAMAR NOTIFICACIONES LOCALES ----
  async scheduleAppointmentReminder(appointmentDate: Date, appointmentTitle: string) {
    const triggerDate = new Date(appointmentDate);
    triggerDate.setHours(triggerDate.getHours() - 24); // 24 horas antes

    if (triggerDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de cita',
          body: `Tienes una cita mañana: ${appointmentTitle}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }

    // Recordatorio 1 hora antes
    const oneHourBefore = new Date(appointmentDate);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);

    if (oneHourBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Cita próxima',
          body: `Tu cita "${appointmentTitle}" empieza en 1 hora`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: oneHourBefore,
        },
      });
    }
  },

  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};

// Listener para notificaciones recibidas en primer plano
export function setupNotificationListener(
  onNotification: (notification: Notifications.Notification) => void
) {
  const subscription = Notifications.addNotificationReceivedListener(onNotification);
  return subscription;
}

// Listener para respuestas a notificaciones (cuando el usuario toca)
export function setupNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(onResponse);
  return subscription;
}
