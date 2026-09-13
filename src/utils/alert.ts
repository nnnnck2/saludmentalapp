// ============================================
// MenteSana — Cross-platform alert helper
// Alert.alert es un NO-OP en react-native-web:
// nunca muestra nada y los callbacks jamás
// se ejecutan. En web usamos window.confirm,
// que sí es bloqueante y devuelve boolean.
// ============================================

import { Alert, Platform } from 'react-native';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/** Muestra un diálogo de confirmación. Resuelve true si el usuario acepta. */
export function confirmAsync({
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    // window.confirm muestra "OK / Cancel"; anteponemos el título para contexto
    const text = message ? `${title}\n\n${message}` : title;
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(text));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Alerta informativa de un solo botón (ok). */
export function infoAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    // eslint-disable-next-line no-alert
    window.alert(text);
    return;
  }
  Alert.alert(title, message);
}
