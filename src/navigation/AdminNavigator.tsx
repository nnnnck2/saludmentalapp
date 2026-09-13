import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../constants';
import { AnimatedTabIcon, AppIconName } from '../components/common/Animated';

import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { VerifyPsychologistsScreen } from '../screens/admin/VerifyPsychologistsScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { ForumModerationScreen } from '../screens/admin/ForumModerationScreen';
import { CrisisSupportScreen } from '../screens/shared/CrisisSupportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
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
              route.name === 'Verificar' ? 'check-circle' :
              route.name === 'Usuarios' ? 'users' :
              'shield') as AppIconName
            }
          />
        ),
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen name="Inicio" component={AdminDashboardScreen} />
      <Tab.Screen name="Verificar" component={VerifyPsychologistsScreen} />
      <Tab.Screen name="Usuarios" component={UsersScreen} />
      <Tab.Screen name="Foro" component={ForumModerationScreen} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
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
        name="AdminMain"
        component={AdminTabs}
        options={{ headerShown: false }}
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
