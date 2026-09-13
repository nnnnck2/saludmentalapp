import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { GuestHomeScreen } from '../screens/guest/GuestHomeScreen';
import { ResourcesScreen } from '../screens/guest/ResourcesScreen';
import { PsychologistsListScreen } from '../screens/guest/PsychologistsListScreen';
import { ForumScreen } from '../screens/patient/ForumScreen';
import { ForumThreadScreen } from '../screens/patient/ForumThreadScreen';
import { CrisisSupportScreen } from '../screens/shared/CrisisSupportScreen';

export type GuestStackParamList = {
  GuestHome: undefined;
  Login: undefined;
  Register: undefined;
  RoleSelect: { initialRole?: 'patient' | 'psychologist' };
  GuestResources: undefined;
  GuestPsychologists: undefined;
  GuestForum: undefined;
  GuestForumThread: { postId: string; title: string };
  GuestCrisis: undefined;
};

const Stack = createNativeStackNavigator<GuestStackParamList>();

export function GuestNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="GuestHome"
        component={GuestHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar Sesión' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Crear Cuenta' }}
      />
      <Stack.Screen
        name="RoleSelect"
        component={RoleSelectScreen}
        options={{ title: 'Seleccionar Rol' }}
      />
      <Stack.Screen
        name="GuestResources"
        component={ResourcesScreen}
        options={{ title: 'Recursos' }}
      />
      <Stack.Screen
        name="GuestPsychologists"
        component={PsychologistsListScreen}
        options={{ title: 'Psicólogos' }}
      />
      <Stack.Screen
        name="GuestForum"
        component={ForumScreen}
        options={{ title: 'Foro' }}
      />
      <Stack.Screen
        name="GuestForumThread"
        component={ForumThreadScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="GuestCrisis"
        component={CrisisSupportScreen}
        options={{ title: 'Apoyo en Crisis' }}
      />
    </Stack.Navigator>
  );
}
