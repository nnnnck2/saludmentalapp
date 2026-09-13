import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from '../../constants';
import { Card } from '../../components/common/Card';

const CRISIS_LINES = [
  {
    country: 'Ecuador 🇪🇨',
    flag: 'EC',
    lines: [
      { name: 'Línea 171 — opción 6', number: '171', description: 'Apoyo psicológico gratuito del Ministerio de Salud Pública (marca 171 y elige opción 6)' },
      { name: 'ECU 911', number: '911', description: 'Emergencias: policía, ambulancia, bomberos' },
      { name: 'SAMU — Cruz Roja Ecuatoriana', number: '131', description: 'Emergencia médica, atención 24/7' },
    ],
  },
  {
    country: 'Internacional',
    flag: 'INT',
    lines: [
      { name: 'International Association for Suicide Prevention', number: '', description: 'Recursos y directorio global' },
    ],
  },
];

const TECHNIQUES = [
  { title: 'Respiración 4-7-8', desc: 'Inhala 4 segundos, retén 7 segundos, exhala 8 segundos. Repite 4 veces.' },
  { title: 'Técnica 5-4-3-2-1', desc: 'Observa 5 cosas, toca 4, escucha 3, huele 2, saborea 1.' },
  { title: 'Anclaje con frío', desc: 'Sostén un cubo de hielo o lava tu rostro con agua fría.' },
  { title: 'Escritura terapéutica', desc: 'Anota todo lo que sientes sin juzgarlo. Ayuda a procesar emociones.' },
  { title: 'Cambio de entorno', desc: 'Sal a caminar 5 minutos. Un cambio de escenario ayuda a despejar la mente.' },
  { title: 'Música calmante', desc: 'Escucha música instrumental o sonidos de la naturaleza.' },
];

export function CrisisSupportScreen() {
  const [showTechniques, setShowTechniques] = useState(false);

  const callNumber = (number: string) => {
    const phoneNumber = Platform.OS === 'android' ? `tel:${number}` : `telprompt:${number}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('Llamar', `Marca al ${number}`);
        }
      })
      .catch(() => Alert.alert('Error', 'No se pudo realizar la llamada'));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroCross}>+</Text>
        </View>
        <Text style={styles.heroTitle}>¿Necesitas ayuda ahora?</Text>
        <Text style={styles.heroDesc}>
          No estás solo. Hay personas capacitadas listas para escucharte.
        </Text>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => callNumber('911')}
      >
        <View style={styles.emergencyIcon}>
          <Text style={styles.emergencyExclamation}>!</Text>
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle}>Emergencia: llama al 911 (ECU 911)</Text>
          <Text style={styles.emergencyDesc}>Si estás en peligro inmediato, llama ahora</Text>
        </View>
        <Text style={styles.emergencyArrow}>→</Text>
      </TouchableOpacity>

      {/* Crisis Lines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Líneas de ayuda</Text>
        {CRISIS_LINES.map((country, idx) => (
          <Card key={idx} style={styles.countryCard}>
            <Text style={styles.countryName}>{country.country}</Text>
            {country.lines.map((line, lIdx) => (
              <TouchableOpacity
                key={lIdx}
                style={styles.lineItem}
                onPress={() => line.number ? callNumber(line.number) : Linking.openURL('https://www.iasp.info/resources/Crisis_Centres/')}
              >
                <Text style={styles.lineName}>{line.name}</Text>
                {line.number ? (
                  <Text style={styles.lineNumber}>{line.number}</Text>
                ) : null}
                <Text style={styles.lineDesc}>{line.description}</Text>
              </TouchableOpacity>
            ))}
          </Card>
        ))}
      </View>

      {/* Grounding Techniques */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.techniquesToggle}
          onPress={() => setShowTechniques(!showTechniques)}
        >
          <Text style={styles.sectionTitle}>Técnicas de calma</Text>
          <Text style={styles.toggleArrow}>{showTechniques ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showTechniques && (
          <View style={styles.techniquesGrid}>
            {TECHNIQUES.map((tech, idx) => (
              <Card key={idx} style={styles.techniqueCard}>
                <View style={styles.techniqueDot} />
                <Text style={styles.techniqueTitle}>{tech.title}</Text>
                <Text style={styles.techniqueDesc}>{tech.desc}</Text>
              </Card>
            ))}
          </View>
        )}
      </View>

      {/* Hope Message */}
      <Card style={styles.hopeCard}>
        <Text style={styles.hopeText}>
          "Esto también pasará. Los momentos difíciles no duran para siempre.
          {'\n\n'}Respira hondo. Pide ayuda. Te lo mereces."
        </Text>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Si no estás en crisis ahora, considera guardar estos números en tu teléfono.
          Nunca sabes cuándo tú o alguien cercano podría necesitarlos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxl },
  hero: {
    backgroundColor: COLORS.crisisDark,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl * 1.5,
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  heroCross: {
    fontSize: 28,
    color: COLORS.textOnPrimary,
    fontWeight: '300',
  },
  heroTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.crisis,
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  emergencyExclamation: {
    fontSize: 20,
    color: COLORS.textOnPrimary,
    fontWeight: '800',
  },
  emergencyInfo: { flex: 1 },
  emergencyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },
  emergencyDesc: {
    fontSize: FONTS.sizes.sm - 1,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  emergencyArrow: { fontSize: 20, color: COLORS.textOnPrimary },
  section: { padding: SPACING.md },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  countryCard: { marginBottom: SPACING.md },
  countryName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  lineItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lineName: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.text },
  lineNumber: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  lineDesc: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  techniquesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  toggleArrow: { fontSize: FONTS.sizes.sm, color: COLORS.textLight },
  techniquesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  techniqueCard: {
    width: '47%',
    flexGrow: 1,
  },
  techniqueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.sm,
  },
  techniqueTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  techniqueDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  hopeCard: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.primaryLight + '40',
  },
  hopeText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primaryDark,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  footerText: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
