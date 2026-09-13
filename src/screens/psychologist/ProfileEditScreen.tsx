import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { PsychologistProfile } from '../../types';
import { psychologistService } from '../../services/psychologists';

export function ProfileEditScreen() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<PsychologistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState('');
  const [education, setEducation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      let data = await psychologistService.getPsychologistById(user.id);
      if (!data) {
        // Crear perfil si no existe
        data = await psychologistService.createPsychologistProfile({
          id: user.id,
        } as any);
      }
      if (!data) return;
      setProfile(data);
      setBio(data.bio || '');
      setSpecializations(data.specialization?.join(', ') || '');
      setEducation(data.education?.join(', ') || '');
      setYearsExperience(data.years_experience?.toString() || '');
      setPriceRange(data.price_range || '');
      setLicenseNumber(data.license_number || '');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await psychologistService.updatePsychologistProfile(user.id, {
        bio: bio,
        specialization: specializations.split(',').map((s) => s.trim()).filter(Boolean),
        education: education.split(',').map((s) => s.trim()).filter(Boolean),
        years_experience: parseInt(yearsExperience) || 0,
        price_range: priceRange,
        license_number: licenseNumber,
      });
      await refreshProfile();
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Cargando perfil..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Información Profesional</Text>

        <Text style={styles.label}>Biografía</Text>
        <TextInput
          style={styles.textArea}
          value={bio}
          onChangeText={setBio}
          placeholder="Cuéntales a los pacientes sobre ti, tu enfoque y experiencia..."
          multiline
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Especializaciones (separadas por coma)</Text>
        <TextInput
          style={styles.input}
          value={specializations}
          onChangeText={setSpecializations}
          placeholder="Ej: Ansiedad, Depresión, Terapia de pareja"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Educación (separada por coma)</Text>
        <TextInput
          style={styles.input}
          value={education}
          onChangeText={setEducation}
          placeholder="Ej: PUCE, USFQ, U. de Guayaquil, Certificación en TCC"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Años de experiencia</Text>
        <TextInput
          style={styles.input}
          value={yearsExperience}
          onChangeText={setYearsExperience}
          placeholder="Ej: 10"
          keyboardType="number-pad"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Rango de precios</Text>
        <TextInput
          style={styles.input}
          value={priceRange}
          onChangeText={setPriceRange}
          placeholder="Ej: $15 - $30 USD por sesión"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Número de cédula profesional</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Ej: 12345678"
          placeholderTextColor={COLORS.textLight}
        />

        <Button
          title="Guardar Perfil"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información</Text>
        <Text style={styles.infoText}>
          Tu perfil será visible para los pacientes después de que un administrador lo apruebe.
          Asegúrate de que toda la información sea correcta y profesional.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  formCard: { marginBottom: SPACING.md },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  textArea: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.xs,
  },
  saveBtn: {
    marginTop: SPACING.lg,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 19,
  },
});
