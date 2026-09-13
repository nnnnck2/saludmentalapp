// ============================================
// MenteSana - Mental Health App
// Entry Point
// ============================================

import React, { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationListener, setupNotificationResponseListener } from './src/services/notifications';

// Mantener la splash screen visible mientras cargamos
SplashScreen.preventAutoHideAsync();

export default function App() {
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Configurar listeners de notificaciones
    const notificationSubscription = setupNotificationListener((notification) => {
      console.log('Notificación recibida:', notification);
    });

    const responseSubscription = setupNotificationResponseListener((response) => {
      console.log('Respuesta a notificación:', response);
      // Aquí se puede navegar a la pantalla correspondiente
      // basado en los datos de la notificación
    });

    return () => {
      notificationSubscription?.remove();
      responseSubscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
