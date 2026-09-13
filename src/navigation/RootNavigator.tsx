import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { GuestNavigator } from './GuestNavigator';
import { PatientNavigator } from './PatientNavigator';
import { PsychologistNavigator } from './PsychologistNavigator';
import { AdminNavigator } from './AdminNavigator';
import { COLORS, SPACING, RADIUS, SHADOWS, APP_NAME, FONTS } from '../constants';
import { AnimatedLogo, StaggeredInView } from '../components/common/Animated';
import { WelcomeBurst } from '../components/common/WelcomeBurst';
import { WelcomeTutorial } from '../components/common/WelcomeTutorial';

/** Ventana para considerar "nueva" una cuenta por fecha de creación. */
const TUTORIAL_NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 h

export function RootNavigator() {
  const { isLoading, isAuthenticated, user, signOut, refreshProfile, updateProfile, justSignedUp, clearJustSignedUp } = useAuth();
  const [retrying, setRetrying] = useState(false);

  // Bienvenida animada + tutorial (solo cuentas nuevas)
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const wasActive = useRef(false);

  // El tutorial es SOLO para cuentas recién creadas: exige registro en esta
  // sesión (justSignedUp) O perfil creado hace menos de 24 h (cubre OAuth y
  // reinstalaciones). Nunca se muestra a cuentas existentes, aunque
  // is_onboarded siga en false.
  const isBrandNewAccount = useMemo(() => {
    if (!user) return false;
    if (justSignedUp) return true;
    const createdAt = user.created_at ? new Date(user.created_at).getTime() : NaN;
    return Number.isFinite(createdAt) && Date.now() - createdAt < TUTORIAL_NEW_ACCOUNT_WINDOW_MS;
  }, [user, justSignedUp]);

  useEffect(() => {
    const active = !isLoading && isAuthenticated && !!user;
    // Transición: sesión cargada → mostrar bienvenida
    if (active && !wasActive.current) {
      setShowWelcome(true);
      // SOLO cuentas recién creadas → tutorial interactivo
      if (isBrandNewAccount && !user.is_onboarded) {
        setShowTutorial(true);
      }
    }
    wasActive.current = active;
  }, [isLoading, isAuthenticated, user, isBrandNewAccount]);

  const handleTutorialDone = async () => {
    setShowTutorial(false);
    clearJustSignedUp();
    if (user) {
      try {
        await updateProfile({ is_onboarded: true });
      } catch {}
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <AnimatedLogo size={72} />
        <StaggeredInView index={1}>
          <Text style={styles.brand}>{APP_NAME}</Text>
        </StaggeredInView>
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
      </View>
    );
  }

  // Autenticado pero el perfil no se pudo cargar → mostrar estado visible
  // en lugar de quedarse en modo invitado de forma silenciosa.
  if (isAuthenticated && !user) {
    return (
      <View style={styles.center}>
        <StaggeredInView index={0}>
        <Text style={styles.title}>Preparando tu perfil…</Text>
        <Text style={styles.subtitle}>
          Estamos teniendo problemas para cargar tu información. Intenta de nuevo o cierra sesión.
        </Text>
        </StaggeredInView>
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={async () => {
            setRetrying(true);
            await refreshProfile();
            setRetrying(false);
          }}
        >
          {retrying ? (
            <ActivityIndicator color={COLORS.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.retryButtonText}>Reintentar</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated || !user ? (
        <GuestNavigator />
      ) : user.role === 'admin' ? (
        <AdminNavigator />
      ) : user.role === 'psychologist' ? (
        <PsychologistNavigator />
      ) : (
        <PatientNavigator />
      )}

      {/* Bienvenida animada tras iniciar sesión */}
      {showWelcome && isAuthenticated && user && (
        <WelcomeBurst
          name={user.full_name}
          onDone={() => setShowWelcome(false)}
        />
      )}

      {/* Tutorial interactivo: SOLO cuentas nuevas (is_onboarded = false).
          Se muestra después de la pantalla de bienvenida. */}
      <WelcomeTutorial
        visible={showTutorial && !!user && !showWelcome}
        role={
          user?.role === 'psychologist' || user?.role === 'admin'
            ? user.role
            : 'patient'
        }
        onDone={handleTutorialDone}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },

  brand: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xl,
    letterSpacing: 0.5,
  },
  spinner: {
    marginTop: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.xl + 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  signOutText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: FONTS.sizes.sm,
  },
});
