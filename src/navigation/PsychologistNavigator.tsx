import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants';
import { AnimatedTabIcon, AppIconName } from '../components/common/Animated';

import { PsychologistDashboardScreen } from '../screens/psychologist/PsychologistDashboardScreen';
import { PatientListScreen } from '../screens/psychologist/PatientListScreen';
import { PatientDetailScreen } from '../screens/psychologist/PatientDetailScreen';
import { TaskReviewScreen } from '../screens/psychologist/TaskReviewScreen';
import { ProfileEditScreen } from '../screens/psychologist/ProfileEditScreen';
import { PostsScreen } from '../screens/psychologist/PostsScreen';
import { StatisticsScreen } from '../screens/psychologist/StatisticsScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { CrisisSupportScreen } from '../screens/shared/CrisisSupportScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PsychologistTabs() {
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
              route.name === 'Pacientes' ? 'users' :
              route.name === 'Posts' ? 'edit-3' :
              route.name === 'Stats' ? 'bar-chart-2' :
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
      <Tab.Screen name="Inicio" component={PsychologistDashboardScreen} />
      <Tab.Screen name="Pacientes" component={PatientListScreen} />
      <Tab.Screen name="Posts" component={PostsScreen} />
      <Tab.Screen name="Stats" component={StatisticsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function PsychologistNavigator() {
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
        name="PsychologistMain"
        component={PsychologistTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: 'Paciente' }}
      />
      <Stack.Screen
        name="TaskReview"
        component={TaskReviewScreen}
        options={{ title: 'Revisar Tarea' }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: 'Editar Perfil' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Mensajes' }}
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
