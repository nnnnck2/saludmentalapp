import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, APP_NAME, APP_TAGLINE, FONTS } from '../../constants';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

const FEATURES = [
  { icon: 'book-open' as const, title: 'Recursos Educativos', desc: 'Artículos, videos y ejercicios para tu bienestar' },
  { icon: 'users' as const, title: 'Conecta con Psicólogos', desc: 'Encuentra al profesional ideal para ti' },
  { icon: 'message-circle' as const, title: 'Foro de Comunidad', desc: 'Comparte y apoya a otros en un espacio seguro' },
  { icon: 'activity' as const, title: 'Seguimiento Personal', desc: 'Registra tu estado de ánimo y progreso' },
];

export function GuestHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const exploreOptions = [
    { icon: 'book-open' as const, label: 'Recursos', route: 'GuestResources' },
    { icon: 'users' as const, label: 'Psicólogos', route: 'GuestPsychologists' },
    { icon: 'message-circle' as const, label: 'Foro', route: 'GuestForum' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{APP_NAME}</Text>
        </View>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        <Text style={styles.description}>
          Una plataforma integral para cuidar tu salud mental. Conecta con profesionales,
          accede a recursos y encuentra apoyo en comunidad.
        </Text>

        <View style={styles.heroButtons}>
          <Button
            title="Comenzar ahora"
            onPress={() => navigation.navigate('Register')}
            variant="primary"
            size="lg"
          />
          <Button
            title="Ya tengo cuenta"
            onPress={() => navigation.navigate('Login')}
            variant="outline"
            size="lg"
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
        </View>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>¿Qué ofrecemos?</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((feature) => (
            <Card key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Feather name={feature.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Explore as Guest */}
      <View style={styles.exploreSection}>
        <Text style={styles.sectionTitle}>Explora antes de registrarte</Text>
        <View style={styles.exploreButtons}>
          {exploreOptions.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.exploreButton}
              onPress={() => navigation.navigate(opt.route)}
              activeOpacity={0.7}
            >
              <View style={styles.exploreCircle}>
                <Feather name={opt.icon} size={18} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.exploreLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Note */}
      <Card style={styles.safetyCard}>
        <View style={styles.safetyTitleRow}>
          <Feather name="shield" size={16} color={COLORS.primary} />
          <Text style={styles.safetyTitle}>Privacidad ante todo</Text>
        </View>
        <Text style={styles.safetyText}>
          Todos tus datos están protegidos y encriptados. Puedes participar en el foro de
          forma completamente anónima. Tu información personal nunca será compartida sin tu
          consentimiento.
        </Text>
      </Card>

      <TouchableOpacity
        style={styles.crisisBanner}
        onPress={() => navigation.navigate('CrisisSupport')}
        activeOpacity={0.8}
      >
        <View style={styles.crisisBannerIcon}>
          <Feather name="life-buoy" size={18} color={COLORS.textOnPrimary} />
        </View>
        <View style={styles.crisisBannerText}>
          <Text style={styles.crisisBannerTitle}>¿Necesitas ayuda ahora?</Text>
          <Text style={styles.crisisBannerDesc}>
            Líneas de crisis, técnicas de calma y apoyo inmediato
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={COLORS.textOnPrimary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  hero: {
    backgroundColor: COLORS.primaryDeep,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl * 1.5,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textOnPrimary,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: FONTS.sizes.hero,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 38,
  },
  description: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  heroButtons: {
    width: '100%',
    gap: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: COLORS.textOnPrimary,
  },
  secondaryButtonText: {
    color: COLORS.textOnPrimary,
  },
  features: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  featuresGrid: {
    gap: SPACING.sm,
  },
  featureCard: {
    marginBottom: SPACING.sm,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  exploreSection: {
    padding: SPACING.lg,
  },
  exploreButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  exploreButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  exploreCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  exploreLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.crisis,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  crisisBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  crisisBannerText: {
    flex: 1,
  },
  crisisBannerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  crisisBannerDesc: {
    fontSize: FONTS.sizes.sm - 1,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  safetyCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  safetyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  safetyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
