import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, APP_NAME, FONTS } from '../../constants';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FloatingOrbs, StaggeredInView, PopIn } from '../../components/common/Animated';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'psychologist'>('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleRegister = async () => {
    setFeedback(null);
    setNeedsConfirmation(false);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFeedback({ type: 'error', text: 'Por favor completa los campos obligatorios' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, fullName.trim(), phone.trim(), selectedRole);

      if (result.needsEmailConfirmation) {
        // Supabase requiere confirmar el email: no hay sesión todavía
        setNeedsConfirmation(true);
        setFeedback({
          type: 'success',
          text: '¡Cuenta creada! Te enviamos un email de confirmación. Revisa tu bandeja de entrada (y spam), confirma tu cuenta e inicia sesión.',
        });
      } else {
        // Con sesión activa el RootNavigator cambia automáticamente al dashboard
        setFeedback({
          type: 'success',
          text: selectedRole === 'psychologist'
            ? '¡Cuenta creada! Bienvenido a MenteSana. Un administrador revisará tu perfil de psicólogo.'
            : '¡Cuenta creada! Bienvenido a MenteSana.',
        });
      }
    } catch (error: any) {
      const rawMessage: string = error?.message || '';
      const message =
        rawMessage === 'User already registered'
          ? 'Ya existe una cuenta con este email. Inicia sesión.'
          : rawMessage === 'Password should be at least 6 characters'
            ? 'La contraseña debe tener al menos 6 caracteres'
            : rawMessage || 'Error al crear la cuenta';
      setFeedback({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FloatingOrbs />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <StaggeredInView index={0} style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a {APP_NAME}</Text>
        </StaggeredInView>

        {/* Selector de rol */}
        <StaggeredInView index={1}>
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedRole === 'patient' && styles.roleOptionActive,
            ]}
            onPress={() => setSelectedRole('patient')}
          >
            <View style={[
              styles.roleIndicator,
              selectedRole === 'patient' && styles.roleIndicatorActive,
            ]}>
              <Text style={[
                styles.roleIndicatorText,
                selectedRole === 'patient' && styles.roleIndicatorTextActive,
              ]}>P</Text>
            </View>
            <Text
              style={[
                styles.roleLabel,
                selectedRole === 'patient' && styles.roleLabelActive,
              ]}
            >
              Paciente
            </Text>
            <Text style={styles.roleDesc}>Busco ayuda profesional</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedRole === 'psychologist' && styles.roleOptionActive,
            ]}
            onPress={() => setSelectedRole('psychologist')}
          >
            <View style={[
              styles.roleIndicator,
              selectedRole === 'psychologist' && styles.roleIndicatorActivePsychologist,
            ]}>
              <Text style={[
                styles.roleIndicatorText,
                selectedRole === 'psychologist' && styles.roleIndicatorTextActivePsychologist,
              ]}>Ps</Text>
            </View>
            <Text
              style={[
                styles.roleLabel,
                selectedRole === 'psychologist' && styles.roleLabelActive,
              ]}
            >
              Psicólogo
            </Text>
            <Text style={styles.roleDesc}>Ofrezco mis servicios</Text>
          </TouchableOpacity>
        </View>
        </StaggeredInView>

        <StaggeredInView index={2}>
        <View style={styles.form}>
          <Input
            label="Nombre completo *"
            placeholder="Ej: Juan Pérez"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Input
            label="Email *"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Teléfono"
            placeholder="+593 99 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            helperText="Número ecuatoriano: empieza con +593"
          />

          <Input
            label="Contraseña *"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input
            label="Confirmar contraseña *"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          {feedback && (
            <PopIn shake={feedback.type === 'error'}>
              <View
                style={[
                  styles.feedbackBox,
                  feedback.type === 'error' ? styles.feedbackBoxError : styles.feedbackBoxSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackText,
                    feedback.type === 'error' ? styles.feedbackTextError : styles.feedbackTextSuccess,
                  ]}
                >
                  {feedback.text}
                </Text>
              </View>
            </PopIn>
          )}

          {needsConfirmation && (
            <Button
              title="Ir a iniciar sesión"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.goToLoginButton}
            />
          )}

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.registerButton}
          />
        </View>
        </StaggeredInView>

        <StaggeredInView index={3} style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </StaggeredInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleOption: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  roleOptionActive: {
    borderColor: COLORS.patient,
    backgroundColor: '#EDF4F0',
    ...SHADOWS.sm,
  },
  roleIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  roleIndicatorActive: {
    backgroundColor: COLORS.patient,
  },
  roleIndicatorActivePsychologist: {
    backgroundColor: COLORS.psychologist,
  },
  roleIndicatorText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleIndicatorTextActive: {
    color: COLORS.textOnPrimary,
  },
  roleIndicatorTextActivePsychologist: {
    color: COLORS.textOnPrimary,
  },
  roleLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  roleLabelActive: {
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  feedbackBox: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  feedbackBoxError: {
    borderColor: COLORS.error + '55',
    backgroundColor: COLORS.error + '1A',
  },
  feedbackBoxSuccess: {
    borderColor: COLORS.success + '55',
    backgroundColor: COLORS.success + '1A',
  },
  feedbackText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  feedbackTextError: {
    color: COLORS.errorDark,
  },
  feedbackTextSuccess: {
    color: COLORS.primaryDark,
  },
  goToLoginButton: {
    marginBottom: SPACING.sm,
  },
  registerButton: {
    marginTop: SPACING.sm,
  },
  eyeIcon: {
    fontSize: FONTS.sizes.sm - 1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});
