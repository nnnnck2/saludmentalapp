import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../constants';
import { PressableScale, PulseRing } from './Animated';

/**
 * Botón flotante de crisis: acceso rápido a líneas de ayuda
 * y técnicas de calma. "Respira" suavemente y emite anillos
 * de pulso para transmitir calma y disponibilidad inmediata.
 */
export function CrisisButton() {
  const navigation = useNavigation<any>();
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.045 * breathe.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <PulseRing color={COLORS.crisis} size={52} rings={2} duration={2400} />
      <PressableScale
        style={styles.button}
        onPress={() => navigation.navigate('CrisisSupport')}
        scaleTo={0.88}
        accessibilityLabel="Ayuda en crisis"
        accessibilityRole="button"
      >
        <Animated.View style={[styles.iconWrap, breatheStyle]}>
          <Feather name="life-buoy" size={24} color={COLORS.textOnPrimary} />
        </Animated.View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.md,
    width: 52,
    height: 52,
    zIndex: 999,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.crisis,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.crisisDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
