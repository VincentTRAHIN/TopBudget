'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import fetcher from '@/utils/fetcher.utils';
import {
  loginEndpoint,
  registerEndpoint,
  meEndpoint,
} from '@/services/api.service';
import { IUser } from '@/types/user.type';

export const useAuth = () => {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);

  // Vérifier le token au démarrage
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('[AUTH] Token initial:', token ? 'présent' : 'absent');
    setAuthInitialized(true);
  }, []);

  const {
    data: user,
    error,
    mutate,
    isLoading: isUserLoading,
  } = useSWR<IUser | null>(authInitialized ? meEndpoint : null, fetcher, {
    shouldRetryOnError: false,
    revalidateIfStale: true,
    revalidateOnFocus: true, 
    refreshInterval: 60000, // Rafraichir le token toutes les minutes
    onSuccess: (data) => {
      console.log('[AUTH] Utilisateur authentifié:', !!data);
    },
    onError: (err) => {
      console.error('[AUTH] Erreur d\'authentification:', err);
      if (err.status === 401) {
        console.warn('[AUTH] Token invalide ou expiré, suppression');
        localStorage.removeItem('authToken');
        mutate(null, false);
      }
    },
  });

  const [loadingAction, setLoadingAction] = useState(false);

  const isLoading = isUserLoading && !error && user === undefined;

  useEffect(() => {
    if (error?.status === 401) {
      const hadToken = localStorage.getItem('authToken');
      if (hadToken) {
        console.warn('[AUTH] Token invalide détecté, suppression');
        localStorage.removeItem('authToken');
        mutate(null, false);
      }
    }
  }, [error, mutate, router]);

  const login = async (email: string, password: string) => {
    setLoadingAction(true);
    try {
      console.log(`[AUTH] Tentative de connexion pour ${email}`);
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse: password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Erreur de connexion';
        console.error(`[AUTH] Échec de connexion: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.data?.token) {
        console.error('[AUTH] Token manquant dans la réponse');
        throw new Error('Token manquant dans la réponse');
      }

      console.log('[AUTH] Connexion réussie, stockage du token');
      localStorage.setItem('authToken', data.data.token);
      
      // Rechargement des informations utilisateur
      await mutate();
      
      return data;
    } catch (error) {
      console.error('[AUTH] Erreur de login:', error);
      localStorage.removeItem('authToken');
      await mutate(null, false);
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const register = async (nom: string, email: string, password: string) => {
    setLoadingAction(true);
    try {
      console.log(`[AUTH] Tentative d'inscription pour ${email}`);
      const res = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, motDePasse: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.message || "Erreur lors de l'inscription";
        console.error(`[AUTH] Échec d'inscription: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (!data.data?.token) {
        console.error('[AUTH] Token manquant dans la réponse d\'inscription');
        throw new Error('Token manquant dans la réponse');
      }

      console.log('[AUTH] Inscription réussie, stockage du token');
      localStorage.setItem('authToken', data.data.token);
      
      // Rechargement des informations utilisateur
      await mutate();
      
      return data;
    } catch (error) {
      console.error('[AUTH] Erreur d\'inscription:', error);
      localStorage.removeItem('authToken');
      await mutate(null, false);
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const logout = async () => {
    console.log('[AUTH] Déconnexion, suppression du token');
    localStorage.removeItem('authToken');
    await mutate(null, false);
    router.push('/auth/login');
  };

  // Force la vérification du token et recharge l'utilisateur
  const refreshUser = async () => {
    console.log('[AUTH] Rafraîchissement forcé des données utilisateur');
    return mutate();
  };

  const isAuthenticated = !isLoading && user !== null;

  return {
    user,
    isAuthenticated,
    isLoading,
    loadingAction,
    login,
    register,
    logout,
    refreshUser,
    error,
    mutate,
  };
};
