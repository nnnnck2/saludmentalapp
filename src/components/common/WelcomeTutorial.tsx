import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, StatusBar, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import {
  COLORS, SPACING, RADIUS, SHADOWS, FONTS, APP_NAME,
} from '../../constants';
import { FloatingOrbs, PressableScale } from './Animated';
import { AppIcon, AppIconName } from './AppIcon';

type Slide = {
  icon: AppIconName;
  tint: string;
  bg: string;
  title: string;
  body: string;
};

/** Pasos del recorrido. `role` filtra los pasos por tipo de usuario. */
const SLIDES: Array<Slide & { role: 'all' | 'patient' | 'psychologist' | 'admin' }> = [
  {
    role: 'all',
    icon: 'home',
    tint: COLORS.primary,
    bg: COLORS.primaryMist,
    title: 'Tu inicio',
    body: `Desde la pantalla de inicio ves tu estado de ánimo, tus próximas citas y accesos directos a todo ${APP_NAME}. Todo empieza aquí.`,
  },
  {
    role: 'patient',
    icon: 'smile',
    tint: COLORS.success,
    bg: COLORS.successMist,
    title: 'Check-in emocional',
    body: 'Registra cómo te sientes cada día. Con el tiempo verás tu progreso y descubrirás patrones en tu ánimo.',
  },
  {
    role: 'patient',
    icon: 'calendar',
    tint: COLORS.primary,
    bg: COLORS.primaryMist,
    title: 'Citas y psicólogos',
    body: 'En "Psicólogos" puedes explorar profesionales verificados y agendar una sesión. Tus citas quedan en la sección "Citas".',
  },
  {
    role: 'patient',
    icon: 'book-open',
    tint: COLORS.secondaryDark,
    bg: COLORS.secondaryMist,
    title: 'Diario y tareas',
    body: 'Escribe lo que sientes en tu Diario. Tu psicólogo puede asignarte Tareas con ejercicios para practicar entre sesiones.',
  },
  {
    role: 'patient',
    icon: 'message-circle',
    tint: COLORS.psychologist,
    bg: COLORS.infoMist,
    title: 'Foro anónimo',
    body: 'Comparte lo que sientes con la comunidad. Puedes publicar como Anónimo: aquí nadie te juzga, solo te acompaña.',
  },
  {
    role: 'patient',
    icon: 'life-buoy',
    tint: COLORS.crisis,
    bg: COLORS.crisisLight,
    title: '¿Necesitas ayuda urgente?',
    body: 'El botón flotante con el salvavidas te lleva a líneas de ayuda y técnicas de calma, disponible en todo momento.',
  },
  {
    role: 'psychologist',
    icon: 'users',
    tint: COLORS.psychologist,
    bg: COLORS.infoMist,
    title: 'Tus pacientes',
    body: 'En "Pacientes" ves tu lista, sus estados de ánimo y tareas. Entra a un paciente para revisar su progreso detallado.',
  },
  {
    role: 'psychologist',
    icon: 'clipboard',
    tint: COLORS.info,
    bg: COLORS.infoMist,
    title: 'Tareas y revisión',
    body: 'Asigna tareas a tus pacientes y revisa sus respuestas. Tu retroalimentación aparece directo en su app.',
  },
  {
    role: 'psychologist',
    icon: 'edit-3',
    tint: COLORS.primary,
    bg: COLORS.primaryMist,
    title: 'Posts y estadísticas',
    body: 'Publica artículos para tus pacientes y consulta el rendimiento de tu práctica en la pestaña "Stats".',
  },
  {
    role: 'admin',
    icon: 'check-circle',
    tint: COLORS.admin,
    bg: '#EEEBF7',
    title: 'Verificación de psicólogos',
    body: 'Tu primera tarea: revisar y verificar psicólogos nuevos. Solo los verificados pueden recibir pacientes.',
  },
  {
    role: 'admin',
    icon: 'shield',
    tint: COLORS.admin,
    bg: '#EEEBF7',
    title: 'Moderación',
    body: 'En "Usuarios" y "Foro" gestionas cuentas y moderas publicaciones para mantener una comunidad segura.',
  },
];

const DOT_SIZE = 8;
const DOT_GAP = SPACING.sm;

/** Punto indicador: se estira suavemente al activarse. */
function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? DOT_SIZE * 2.4 : DOT_SIZE);

  useEffect(() => {
    w.value = withTiming(active ? DOT_SIZE * 2.4 : DOT_SIZE, {
      duration: 220,
      easing: Easing.inOut(Easing.ease),
    });
  }, [active, w]);

  const style = useAnimatedStyle(() => ({ width: w.value }));

  return <Animated.View style={[styles.dot, active && styles.dotActive, style]} />;
}

export function WelcomeTutorial({
  visible,
  role = 'patient',
  onDone,
}: {
  visible: boolean;
  role?: 'patient' | 'psychologist' | 'admin';
  onDone: () => void;
}) {
  const slides = useMemo(
    () => SLIDES.filter((s) => s.role === 'all' || s.role === role),
    [role],
  );

  // Medido en cada render (no al cargar el bundle): refleja rotaciones y
  // cambios de tamaño del emulador/dev tools sin quedarse con un ancho viejo.
  const { width: screenWidth } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0); // índice continuo para animar

  useEffect(() => {
    if (visible) {
      setIndex(0);
      progress.value = 0;
    }
  }, [visible, progress]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    progress.value = withSpring(clamped, { damping: 20, stiffness: 160 });
    setIndex(clamped);
  };

  const isLast = index === slides.length - 1;

  // ---- Slide animado (traducción horizontal) ----
  // Cada slide ocupa el ancho COMPLETO de pantalla y la tarjeta va centrada
  // dentro con padding propio; el track avanza exactamente 1 ancho por paso.
  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -progress.value * screenWidth }],
  }));

  // ---- Barra de progreso ----
  const progressWidth = useDerivedValue(() => interpolate(
    progress.value,
    [0, Math.max(1, slides.length - 1)],
    [0.15, 1],
  ));

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  // ---- Botón dinámico (Siguiente ↔ Empezar) ----
  const ctaLabel = isLast ? 'Empezar' : 'Siguiente';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <StatusBar barStyle="dark-content" />
        <FloatingOrbs />
        <View style={styles.container}>
          {/* Encabezado */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{APP_NAME}</Text>
            <PressableScale onPress={onDone} style={styles.skipBtn}>
              <Text style={styles.skipText}>Omitir</Text>
            </PressableScale>
          </View>

          <Text style={styles.mainQuestion}>¿Necesitas ayuda navegando por la app?</Text>
          <Text style={styles.mainSub}>
            Te mostramos lo esencial en {slides.length} pasos rápidos.
          </Text>

          {/* Slides */}
          <View style={styles.viewport}>
            <Animated.View style={[styles.track, trackStyle]}>
              {slides.map((slide, i) => (
                <View key={slide.title} style={[styles.slide, { width: screenWidth }]}>
                  {/* Sin animación `entering`: en web las tarjetas fuera del
                      viewport pueden quedarse con opacity 0 y "desaparecer". */}
                  <View style={styles.card}>
                    <View style={[styles.iconWrap, { backgroundColor: slide.bg }]}>
                      <AppIcon name={slide.icon} size={26} color={slide.tint} />
                    </View>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideBody}>{slide.body}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Progreso + controles */}
          <View style={styles.footer}>
            <View style={styles.dots}>
              {slides.map((s, i) => (
                <Dot key={s.title} active={i === index} />
              ))}
            </View>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, barStyle]} />
            </View>

            <View style={styles.buttonsRow}>
              {index > 0 && (
                <PressableScale onPress={() => go(index - 1)} style={styles.backBtn}>
                  <Feather name="arrow-left" size={18} color={COLORS.textSecondary} />
                </PressableScale>
              )}
              <PressableScale
                onPress={() => (isLast ? onDone() : go(index + 1))}
                style={styles.nextBtn}
              >
                <Text style={styles.nextText}>{ctaLabel}</Text>
                <Feather
                  name={isLast ? 'check' : 'arrow-right'}
                  size={16}
                  color={COLORS.textOnPrimary}
                  style={styles.nextIcon}
                />
              </PressableScale>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingTop: (StatusBar.currentHeight || 0) + SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.primaryDeep,
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },

  mainQuestion: {
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.xxl - 2,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 30,
  },
  mainSub: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },

  viewport: {
    flex: 1,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slide: {
    // La tarjeta vive dentro de un slide de ancho completo; este padding la
    // centra y evita que se corte en los bordes de la pantalla.
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    // Evita que el footer salte al cambiar de slide por textos de distinta altura.
    minHeight: 190,
    ...SHADOWS.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  slideTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  slideBody: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  footer: {
    gap: SPACING.md,
  },
  dots: {
    flexDirection: 'row',
    gap: DOT_GAP,
    justifyContent: 'center',
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: SPACING.sm + 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  nextText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  nextIcon: {
    marginLeft: SPACING.xs,
  },
});
