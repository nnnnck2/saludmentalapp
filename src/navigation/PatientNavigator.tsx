import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants';
import { AnimatedTabIcon, AppIconName } from '../components/common/Animated';

// Screens
import { PatientDashboardScreen } from '../screens/patient/PatientDashboardScreen';
import { AppointmentsScreen } from '../screens/patient/AppointmentsScreen';
import { TasksScreen } from '../screens/patient/TasksScreen';
import { ForumScreen } from '../screens/patient/ForumScreen';
import { ForumThreadScreen } from '../screens/patient/ForumThreadScreen';
import { MoodTrackerScreen } from '../screens/patient/MoodTrackerScreen';
import { JournalScreen } from '../screens/patient/JournalScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { PsychologistsListScreen } from '../screens/guest/PsychologistsListScreen';
import { BookAppointmentScreen } from '../screens/patient/BookAppointmentScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { CrisisSupportScreen } from '../screens/shared/CrisisSupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PatientTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <AnimatedTabIcon
            focused={focused}
            color={color}
            size={size - 2}
            name={
              (route.name === 'Inicio' ? 'home' :
              route.name === 'Citas' ? 'calendar' :
              route.name === 'Tareas' ? 'clipboard' :
              route.name === 'Foro' ? 'message-circle' :
              'user') as AppIconName
            }
          />
        ),
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen name="Inicio" component={PatientDashboardScreen} />
      <Tab.Screen name="Citas" component={AppointmentsScreen} />
      <Tab.Screen name="Tareas" component={TasksScreen} />
      <Tab.Screen name="Foro" component={ForumScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function PatientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600', fontSize: FONTS.sizes.lg },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="PatientMain"
        component={PatientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForumThread"
        component={ForumThreadScreen}
        options={({ route }) => ({ title: (route.params as any)?.title || 'Foro' })}
      />
      <Stack.Screen
        name="MoodTracker"
        component={MoodTrackerScreen}
        options={{ title: 'Estado de ánimo' }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: 'Mi Diario' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Mensajes' }}
      />
      <Stack.Screen
        name="Psychologists"
        component={PsychologistsListScreen}
        options={{ title: 'Psicólogos' }}
      />
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{ title: 'Agendar Cita' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
      <Stack.Screen
        name="CrisisSupport"
        component={CrisisSupportScreen}
        options={{ title: 'Apoyo en Crisis' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.sm,
    height: 68,
    ...SHADOWS.lg,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
