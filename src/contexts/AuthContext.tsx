// ============================================
// MenteSana - Auth Context
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/auth';
import { Profile, UserRole, AuthState } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: UserRole) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  changeRole: (newRole: UserRole) => Promise<void>;
  /** true solo si el usuario se registró EN esta sesión de la app (cuenta nueva). */
  justSignedUp: boolean;
  clearJustSignedUp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Marca temporal: se activa SOLO al completar un registro dentro de esta
  // sesión de la app. Sirve para que el tutorial se muestre únicamente a
  // cuentas recién creadas (nunca a cuentas existentes al iniciar sesión).
  const [justSignedUp, setJustSignedUp] = useState(false);
  const clearJustSignedUp = useCallback(() => setJustSignedUp(false), []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      return await authService.getProfile(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Sincroniza el estado de la app con una sesión: carga el perfil y activa
  // la navegación. Si el perfil aún no existe, intenta crearlo (fallback).
  const syncSession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({ user: null, session: null, isLoading: false, isAuthenticated: false });
      return;
    }

    let profile = await fetchProfile(session.user.id);
    if (!profile) {
      // Fallback: el trigger pudo no haber creado el perfil
      profile = await authService.ensureProfile(session.user.id);
    }

    setState({
      user: profile,
      session,
      isLoading: false,
      isAuthenticated: true,
    });
  }, [fetchProfile]);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    // Escuchar cambios en tiempo real
    // TOKEN_REFRESHED se ignora: el perfil ya está sincronizado y evitamos
    // re-fetches innecesarios cada vez que se renueva el token.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') return;
        syncSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, syncSession]);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, role: UserRole = 'patient') => {
    const result = await authService.signUp(email, password, fullName, phone, role);
    // Registro completado → es una cuenta NUEVA: marcar para el tutorial
    setJustSignedUp(true);
    // Si hay sesión (confirmación de email desactivada), navegar de inmediato
    if (result.session) {
      await syncSession(result.session);
    }
    return { needsEmailConfirmation: result.needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn(email, password);
    // Navegación inmediata sin depender del listener
    await syncSession(data.session);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithApple = async () => {
    await authService.signInWithApple();
  };

  const signOut = async () => {
    await authService.signOut();
    setState({ user: null, session: null, isLoading: false, isAuthenticated: false });
  };

  const refreshProfile = async () => {
    if (state.user?.id) {
      const profile = await fetchProfile(state.user.id);
      if (profile) {
        setState(prev => ({ ...prev, user: profile }));
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (state.user?.id) {
      const updated = await authService.updateProfile(state.user.id, updates);
      setState(prev => ({ ...prev, user: updated }));
    }
  };

  const changeRole = async (newRole: UserRole) => {
    if (state.user?.id) {
      const updated = await authService.changeRole(state.user.id, newRole);
      setState(prev => ({ ...prev, user: updated }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshProfile,
        updateProfile,
        changeRole,
        justSignedUp,
        clearJustSignedUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
