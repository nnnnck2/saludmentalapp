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
import { FloatingOrbs, AnimatedLogo, StaggeredInView, PopIn } from '../../components/common/Animated';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // El RootNavigator cambia automáticamente al dashboard
    } catch (error: any) {
      const rawMessage: string = error?.message || '';
      const code: string = error?.code || '';
      let message = rawMessage || 'Error al iniciar sesión';

      if (code === 'email_not_confirmed' || rawMessage.toLowerCase().includes('not confirmed')) {
        message =
          'Tu email aún no está confirmado. Revisa tu bandeja de entrada (y spam) y haz clic en el enlace de confirmación.';
      } else if (rawMessage === 'Invalid login credentials') {
        message = 'Email o contraseña incorrectos';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      await signInWithApple();
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión con Apple');
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
          <View style={styles.logoContainer}>
            <AnimatedLogo size={68} />
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
        </StaggeredInView>

        <StaggeredInView index={1}>
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            placeholder="Tu contraseña"
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

          {error && (
            <PopIn shake>
              <View style={styles.feedbackBox} testID="login-error">
                <Text style={styles.feedbackErrorText}>{error}</Text>
              </View>
            </PopIn>
          )}

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Google"
            onPress={handleGoogleSignIn}
            variant="outline"
            icon={
              <View style={styles.socialIconCircle}>
                <Text style={styles.socialIconText}>G</Text>
              </View>
            }
          />

          {Platform.OS === 'ios' && (
            <Button
              title="Apple"
              onPress={handleAppleSignIn}
              variant="outline"
              icon={
                <View style={styles.socialIconCircle}>
                  <Text style={styles.socialIconText}>A</Text>
                </View>
              }
              style={styles.socialButton}
            />
          )}
        </View>
        </StaggeredInView>

        <StaggeredInView index={2} style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Crear cuenta</Text>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  feedbackBox: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '55',
    backgroundColor: COLORS.error + '1A',
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  feedbackErrorText: {
    color: COLORS.errorDark,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  socialButton: {
    marginTop: SPACING.sm,
  },
  socialIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  socialIconText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.text,
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
