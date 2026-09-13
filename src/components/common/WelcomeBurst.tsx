import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, SPACING, FONTS, APP_NAME } from '../../constants';
import { FloatingOrbs, AnimatedLogo, StaggeredInView, PressableScale } from './Animated';

const AUTO_DISMISS_MS = 4800;

/**
 * Pantalla de bienvenida animada: se muestra al entrar a la app
 * con sesión activa y carga todo con una entrada lenta y suave.
 */
export function WelcomeBurst({
  name,
  onDone,
}: {
  name?: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = (name || '').split(' ')[0];

  return (
    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)} exiting={FadeOut.duration(500)}>
      <View style={styles.backdrop}>
        <StatusBar barStyle="dark-content" />
        <FloatingOrbs />
        <View style={styles.center}>
          <StaggeredInView index={0}>
            <AnimatedLogo size={80} />
          </StaggeredInView>
          <StaggeredInView index={1}>
            <Text style={styles.greeting}>
              {firstName ? `Hola, ${firstName}` : 'Hola'}
            </Text>
          </StaggeredInView>
          <StaggeredInView index={2}>
            <Text style={styles.subtitle}>
              Bienvenido a {APP_NAME}.{'\n'}Tu espacio para sentirte mejor.
            </Text>
          </StaggeredInView>
          <StaggeredInView index={3}>
            <PressableScale onPress={onDone} style={styles.continueBtn}>
              <Text style={styles.continueText}>Comenzar</Text>
            </PressableScale>
          </StaggeredInView>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  greeting: {
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.hero - 6,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueBtn: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.xl + 8,
    shadowColor: COLORS.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  continueText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
});
