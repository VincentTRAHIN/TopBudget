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
import debug from 'debug';

const log = debug('app:frontend:useAuth');

export const useAuth = () => {
  log('Initialisation du hook useAuth');
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
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
    refreshInterval: 60000,
    onSuccess: () => {
      log('Authentification SWR réussie, données utilisateur mises à jour.');
    },
    onError: (err) => {
      log("ERREUR: Erreur d'authentification SWR: %O", err);
      if (err.status === 401) {
        log('AVERTISSEMENT: Token invalide ou expiré suite à une erreur SWR, suppression du token.');
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
        localStorage.removeItem('authToken');
        mutate(null, false);
      }
    }
  }, [error, mutate, router]);

  const login = async (email: string, password: string) => {
    setLoadingAction(true);
    log(`Tentative de connexion pour %s`, email);
    try {
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse: password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || 'Erreur de connexion';
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.data?.token) {
        throw new Error('Token manquant dans la réponse');
      }

      localStorage.setItem('authToken', data.data.token);
      log('Connexion réussie, token stocké. Mutation des données utilisateur.');

      await mutate();

      return data;
    } catch (error) {
      localStorage.removeItem('authToken');
      await mutate(null, false);
      throw error;
    } finally {
      log(`Fin de l'action de connexion pour %s`, email);
      setLoadingAction(false);
    }
  };

  const register = async (nom: string, email: string, password: string) => {
    setLoadingAction(true);
    log(`Tentative d'inscription pour %s`, email);
    try {
      const res = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, motDePasse: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.message || "Erreur lors de l'inscription";
        throw new Error(errorMessage);
      }

      if (!data.data?.token) {
        throw new Error('Token manquant dans la réponse');
      }

      localStorage.setItem('authToken', data.data.token);
      log('Inscription réussie, token stocké. Mutation des données utilisateur.');

      await mutate();

      return data;
    } catch (error) {
      localStorage.removeItem('authToken');
      await mutate(null, false);
      throw error;
    } finally {
      log(`Fin de l'action d'inscription pour %s`, email);
      setLoadingAction(false);
    }
  };

  const logout = async () => {
    log('Déconnexion de l\'utilisateur, suppression du token et redirection.');
    localStorage.removeItem('authToken');
    await mutate(null, false);
    router.push('/auth/login');
  };

  const refreshUser = async () => {
    log('Rafraîchissement manuel des données utilisateur demandé.');
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
