// ============================================
// MenteSana - Servicio de Autenticación
// ============================================

import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import * as WebBrowser from 'expo-web-browser';

// Para autenticación con Google/Apple
WebBrowser.maybeCompleteAuthSession();

export const authService = {
  // ---- REGISTRO CON EMAIL ----
  // Devuelve needsEmailConfirmation=true si Supabase requiere confirmar el email
  // (en ese caso NO hay sesión y el usuario debe confirmar antes de entrar).
  async signUp(email: string, password: string, fullName: string, phone?: string, role: UserRole = 'patient') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
        },
      },
    });
    if (error) throw error;
    return { session: data.session, user: data.user, needsEmailConfirmation: !data.session };
  },

  // ---- INICIAR SESIÓN CON EMAIL ----
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // ---- INICIAR SESIÓN CON GOOGLE ----
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'mentesana://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;

    // Abrir la URL de autenticación
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'mentesana://auth/callback'
      );
      if (result.type === 'success') {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: extractParams(result.url, 'access_token'),
          refresh_token: extractParams(result.url, 'refresh_token'),
        });
        if (sessionError) throw sessionError;
        return sessionData;
      }
    }
    return null;
  },

  // ---- INICIAR SESIÓN CON APPLE ----
  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'mentesana://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;

    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'mentesana://auth/callback'
      );
      if (result.type === 'success') {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: extractParams(result.url, 'access_token'),
          refresh_token: extractParams(result.url, 'refresh_token'),
        });
        if (sessionError) throw sessionError;
        return sessionData;
      }
    }
    return null;
  },

  // ---- CERRAR SESIÓN ----
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // ---- OBTENER PERFIL ACTUAL ----
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  // ---- ASEGURAR PERFIL ----
  // Si por alguna razón el trigger no creó el perfil (p.ej. usuarios creados
  // antes de aplicar el schema), lo crea aquí como fallback.
  async ensureProfile(userId: string): Promise<Profile | null> {
    try {
      return await authService.getProfile(userId);
    } catch {
      // Perfil no existe → intentar crearlo con los datos de auth
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== userId) return null;

        const meta = user.user_metadata || {};
        const role = ['guest', 'patient', 'psychologist', 'admin'].includes(meta.role)
          ? (meta.role as UserRole)
          : 'patient';

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: meta.full_name || user.email,
            avatar_url: meta.avatar_url || null,
            phone: meta.phone || null,
            role,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        console.error('Error ensuring profile:', e);
        return null;
      }
    }
  },

  // ---- ACTUALIZAR PERFIL ----
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- CAMBIAR ROL (del usuario actual) ----
  async changeRole(userId: string, newRole: UserRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- RESTABLECER CONTRASEÑA ----
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'mentesana://auth/reset-password',
    });
    if (error) throw error;
    return data;
  },

  // ---- VERIFICAR SESIÓN ACTIVA ----
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },
};

// Helper para extraer parámetros de la URL de callback
function extractParams(url: string, param: string): string {
  const params = new URLSearchParams(url.split('#')[1] || '');
  return params.get(param) || '';
}
