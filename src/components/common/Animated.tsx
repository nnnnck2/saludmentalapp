import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, SHADOWS, FONTS } from '../../constants';
import { AppIcon, AppIconName } from './AppIcon';

export type { AppIconName };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Kit de animaciones "Calm Motion"
// Movimiento suave y respirable: springs,
// easing suaves y nada de saltos bruscos.
// ============================================

/* --------------------------------------------
 * FloatingOrbs — fondo ambiental con orbes de
 * color flotando lentamente (respiración visual)
 * -------------------------------------------- */
interface OrbProps {
  size: number;
  color: string;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  duration: number;
  drift: number;
  delay: number;
}

function Orb({ size, color, top, left, right, bottom, duration, drift, delay }: OrbProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift * t.value },
      { translateY: -drift * 0.6 * t.value },
      { scale: 1 + 0.08 * t.value },
    ],
    opacity: 0.7 + 0.3 * t.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        orbStyle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left, right, bottom },
      ]}
    />
  );
}

export function FloatingOrbs({ style }: { style?: StyleProp<ViewStyle> }) {
  const orbs: OrbProps[] = [
    { size: 230, color: COLORS.primaryMist, top: '-8%', left: '-14%', duration: 9000, drift: 26, delay: 0 },
    { size: 160, color: COLORS.secondaryMist, top: '24%', right: '-12%', duration: 11000, drift: -22, delay: 1200 },
    { size: 200, color: COLORS.primaryLight + '55', bottom: '4%', left: '-10%', duration: 10000, drift: 20, delay: 2400 },
    { size: 110, color: COLORS.secondaryMist, bottom: '20%', right: '6%', duration: 8000, drift: -16, delay: 800 },
  ];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
    </View>
  );
}

/* --------------------------------------------
 * AnimatedLogo — logo que "respira" con anillos
 * de halo expansivos. Único punto visual de marca.
 * -------------------------------------------- */
export function AnimatedLogo({ size = 68, halo = true }: { size?: number; halo?: boolean }) {
  const fade = useSharedValue(0);
  const breathe = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 400 });
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    ring1.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false);
    ring2.value = withDelay(
      1100,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.05 * breathe.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 1], [0.3, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [1, 1.9]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 1], [0.3, 0]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [1, 1.9]) }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, containerStyle]}>
      {halo && (
        <>
          <Animated.View
            style={[
              styles.ring,
              ring1Style,
              { width: size, height: size, borderRadius: size / 2, borderColor: COLORS.primary },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              ring2Style,
              { width: size, height: size, borderRadius: size / 2, borderColor: COLORS.secondary },
            ]}
          />
        </>
      )}
      <Animated.View
        style={[
          styles.logoBody,
          bodyStyle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={styles.logoText}>M</Text>
      </Animated.View>
    </Animated.View>
  );
}

/* --------------------------------------------
 * StaggeredInView — entrada escalonada: cada
 * elemento cae con un delay según su índice.
 * -------------------------------------------- */
export function StaggeredInView({
  index = 0,
  step = 80,
  children,
  style,
}: {
  index?: number;
  step?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.delay(index * step)
        .springify()
        .damping(16)
        .stiffness(150)}
    >
      {children}
    </Animated.View>
  );
}

/* --------------------------------------------
 * PressableScale — presionable con escala
 * elástica tipo "squish" al tocar.
 * -------------------------------------------- */
type PressableScaleProps = Omit<React.ComponentProps<typeof Pressable>, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export function PressableScale({
  scaleTo = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    scale.value = withSpring(scaleTo, { damping: 22, stiffness: 550 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, { damping: 13, stiffness: 320 });
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

/* --------------------------------------------
 * PopIn — aparece con un pequeño rebote.
 * Con `shake`, sacude lateralmente (ideal
 * para mensajes de error).
 * -------------------------------------------- */
export function PopIn({
  children,
  style,
  shake = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shake?: boolean;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateX = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    if (shake) {
      translateX.value = withSequence(
        withTiming(9, { duration: 55 }),
        withTiming(-8, { duration: 55 }),
        withTiming(5, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 45 }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

/* --------------------------------------------
 * PulseRing — anillos expansivos tipo "ping"
 * (para el botón de crisis).
 * -------------------------------------------- */
function SingleRing({ color, size, duration, delay }: { color: string; size: number; duration: number; delay: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - p.value),
    transform: [{ scale: 1 + 1.1 * p.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        ringStyle,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
      ]}
    />
  );
}

export function PulseRing({
  color,
  size,
  rings = 2,
  duration = 2000,
}: {
  color: string;
  size: number;
  rings?: number;
  duration?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {Array.from({ length: rings }).map((_, i) => (
        <SingleRing key={i} color={color} size={size} duration={duration} delay={(duration / rings) * i} />
      ))}
    </View>
  );
}

/* --------------------------------------------
 * AnimatedTabIcon — icono de tab que rebota
 * con un halo suave al activarse.
 * -------------------------------------------- */
export function AnimatedTabIcon({
  focused,
  color,
  name,
  size,
}: {
  focused: boolean;
  color: string;
  name: AppIconName;
  size: number;
}) {
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      pop.value = withSequence(
        withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 7, stiffness: 240 }),
      );
      glow.value = withSpring(1, { damping: 16, stiffness: 200 });
    } else {
      glow.value = withTiming(0, { duration: 160 });
      pop.value = withTiming(0, { duration: 120 });
    }
  }, [focused, pop, glow]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.28 * pop.value }, { translateY: -2.5 * glow.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.16 * glow.value,
    transform: [{ scale: 0.6 + 0.4 * glow.value }],
  }));

  const wrapSize = size + 12;

  return (
    <View style={{ width: wrapSize, height: wrapSize, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.tabHalo,
          haloStyle,
          { width: wrapSize, height: wrapSize, borderRadius: wrapSize / 2, backgroundColor: color },
        ]}
      />
      <Animated.View style={iconStyle}>
        <AppIcon name={name} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  logoBody: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: COLORS.primaryLight + '50',
    ...SHADOWS.md,
  },
  logoText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    letterSpacing: 1,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  tabHalo: {
    position: 'absolute',
  },
});
