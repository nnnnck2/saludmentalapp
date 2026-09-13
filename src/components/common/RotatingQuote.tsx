import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants';

// Frases motivadoras — rotan suavemente con fundido
const QUOTES: string[] = [
  'El progreso no siempre es visible, pero cada paso cuenta. Hoy es un buen día para cuidarte.',
  'No tienes que ser positivo todo el tiempo. Sentir emociones dolorosas es parte de ser humano.',
  'Pedir ayuda no es debilidad: es un acto de valentía y de amor propio.',
  'Respira. No vas tarde, no estás fallando. Estás avanzando a tu propio ritmo.',
  'Tu valor no depende de tu productividad. Existir ya es suficiente.',
  'Las tormentas no duran para siempre. Sigue caminando, una hora a la vez.',
  'Sanar no es lineal. Los malos días no borran el progreso que llevas hecho.',
  'Trátate hoy como tratarías a alguien que amas profundamente.',
  'Un pequeño paso hoy vale más que un gran plan para mañana.',
  'Está bien descansar. No tienes que ganar el día, solo atravesarlo.',
  'Lo que sientes es válido, aunque nadie más lo entienda.',
  'Cada check-in, cada diario, cada sesión: todo eso es cuidarte. Bien hecho.',
];

const HOLD_MS = 6000;   // tiempo visible
const FADE_MS = 700;    // duración del fundido

export function RotatingQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const indexRef = useRef(index);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    // Entrada inicial
    opacity.value = withTiming(1, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) });
    translateY.value = withTiming(0, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) });

    const timers: ReturnType<typeof setTimeout>[] = [];

    const interval = setInterval(() => {
      // 1) Fundido de salida
      opacity.value = withTiming(0, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) });
      translateY.value = withTiming(10, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) });

      // 2) Al terminar, cambiar el texto y fundir de entrada
      timers.push(
        setTimeout(() => {
          indexRef.current = (indexRef.current + 1) % QUOTES.length;
          setIndex(indexRef.current);

          opacity.value = withDelay(
            120,
            withTiming(1, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) }),
          );
          translateY.value = withDelay(
            120,
            withTiming(0, { duration: FADE_MS, easing: Easing.inOut(Easing.ease) }),
          );
        }, FADE_MS + 60),
      );
    }, HOLD_MS + FADE_MS);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quoteStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.card}>
      <Feather name="sun" size={18} color={COLORS.secondaryDark} />
      <Animated.Text style={[styles.quote, quoteStyle]} numberOfLines={3}>
        {QUOTES[index]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryMist,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  quote: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
