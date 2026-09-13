import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { FloatingOrbs, StaggeredInView, PressableScale } from '../../components/common/Animated';
import { useAuth } from '../../contexts/AuthContext';

type RoleSelectParams = {
  RoleSelect: { initialRole?: 'patient' | 'psychologist' };
};

/** Tarjeta de rol: se hunde al presionar y su icono hace un "wiggle". */
function RoleCard({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  index,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  index: number;
  onPress: () => void;
}) {
  const wiggle = useSharedValue(0);
  const iconLift = useSharedValue(0);

  useEffect(() => {
    // Pequeño "hola" inicial: el icono se inclina al entrar
    iconLift.value = withDelay(
      350 + index * 120,
      withSequence(
        withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 9, stiffness: 200 }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${-14 * wiggle.value * Math.sin(wiggle.value * Math.PI * 3)}deg` },
      { translateY: -2 * iconLift.value },
      { scale: 1 + 0.08 * iconLift.value },
    ],
  }));

  const handlePressIn = () => {
    wiggle.value = 0;
    wiggle.value = withSequence(
      withTiming(1, { duration: 380, easing: Easing.linear }),
      withTiming(0, { duration: 1 }),
    );
  };

  return (
    <StaggeredInView index={index}>
      <PressableScale onPress={onPress} onPressIn={handlePressIn} scaleTo={0.975}>
        <View style={styles.optionCard}>
          <Animated.View style={[styles.optionIcon, { backgroundColor: iconBg }, iconStyle]}>
            <Feather name={icon} size={24} color={iconColor} />
          </Animated.View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{title}</Text>
            <Text style={styles.optionDesc}>{desc}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={COLORS.textLight} />
        </View>
      </PressableScale>
    </StaggeredInView>
  );
}

export function RoleSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RoleSelectParams, 'RoleSelect'>>();
  const { user, updateProfile } = useAuth();

  const handleRoleSelect = async (role: 'patient' | 'psychologist') => {
    if (user) {
      await updateProfile({ role });
    }
    // La navegación cambiará automáticamente por el AuthContext
  };

  return (
    <View style={styles.container}>
      <FloatingOrbs />
      <View style={styles.header}>
        <Text style={styles.title}>¿Cómo quieres usar MenteSana?</Text>
        <Text style={styles.subtitle}>Selecciona tu rol para personalizar tu experiencia</Text>
      </View>

      <RoleCard
        index={0}
        icon="heart"
        iconBg={COLORS.primaryMist}
        iconColor={COLORS.primary}
        title="Buscar ayuda"
        desc="Conecta con psicólogos, agenda citas, lleva un registro de tu estado de ánimo y participa en el foro de apoyo anónimo."
        onPress={() => handleRoleSelect('patient')}
      />

      <RoleCard
        index={1}
        icon="briefcase"
        iconBg={COLORS.infoMist}
        iconColor={COLORS.psychologist}
        title="Ofrecer servicios"
        desc="Gestiona tus pacientes, crea tu perfil profesional, asigna tareas y haz crecer tu práctica con nuevas herramientas."
        onPress={() => handleRoleSelect('psychologist')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
