'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import fetcher from '@/utils/fetcher.utils';
import {
  IUser,
  UserLoginPayload,
  UserRegisterPayload,
} from '@/types/user.type';
import {
  getMeEndpoint,
  loginUser as loginUserEndpoint,
  registerUser as registerUserEndpoint,
} from '@/services/api.service';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const router = useRouter();

  // SWR pour /api/auth/me utilise maintenant le fetcher modifié qui envoie le token
  const {
    data: user,
    error,
    mutate, 
    isLoading: isUserLoading, 
  } = useSWR<IUser | null>(getMeEndpoint, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false, // Ne pas retenter automatiquement si le token est invalide/manquant
    onError: (err) => {
      // Si /me renvoie une erreur (souvent 401), s'assurer que le token est effacé
      // et l'état utilisateur est null.
      console.error('Erreur fetch /me:', err);
      if (localStorage.getItem('authToken')) {
        localStorage.removeItem('authToken');
        // Pas besoin de redirect ici car RequireAuth s'en chargera
        mutate(null, false); // Met à jour le cache SWR sans revalidation
      }
    },
  });

  const [loadingAction, setLoadingAction] = useState(false); // État de chargement pour les actions login/register

  // Déterminer l'état de chargement initial de manière plus précise
  // On charge si SWR charge ET qu'on n'a pas encore de données ou d'erreur.
  const isLoading = isUserLoading && !error && user === undefined; // user peut être `null` après un premier chargement échoué, mais `undefined` avant

  // Gérer le cas où l'erreur est un 401 (token invalide/expiré)
  // On le fait ici plutôt que dans onError pour avoir accès à mutate
  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) {
      console.log('useAuth: Erreur 401 détectée sur /me. Nettoyage du token.');
      // Vérifier s'il y avait un token avant de le supprimer
      if (localStorage.getItem('authToken')) {
        localStorage.removeItem('authToken');
        // Mettre à jour le cache SWR à null sans revalidation réseau
        mutate(null, false);
        if (
          !['/auth/login', '/auth/register'].includes(window.location.pathname)
        ) {
          router.push('/auth/login');
        }
      }
    }
  }, [error, mutate, router]); // Ajouter router aux dépendances si utilisé

  const login = async (credentials: UserLoginPayload) => {
    setLoadingAction(true);
    try {
      const res = await fetch(loginUserEndpoint, {
        // Utiliser l'URL du service
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        // Lancer une erreur avec le message du backend si possible
        throw new Error(data.message || 'Erreur de connexion');
      }

      // --- Stockage du Token ---
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        await mutate();
        toast.success('Connexion réussie !');
      } else {
        // Gérer le cas où le backend ne renvoie pas de token même avec un statut 2xx
        console.error('Login réussi mais pas de token reçu.');
        throw new Error('Réponse invalide du serveur après connexion.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur dans login:', error);
        toast.error(error.message || 'Une erreur est survenue');
      } else {
        console.error('Erreur inconnue dans login:', error);
        toast.error('Une erreur inconnue est survenue');
      }
      localStorage.removeItem('authToken'); // Nettoyer en cas d'erreur
      await mutate(null, false); // S'assurer que l'état SWR est null
      throw error; // Renvoyer l'erreur pour que le composant puisse réagir
    } finally {
      setLoadingAction(false);
    }
  };

  const register = async (userData: UserRegisterPayload) => {
    setLoadingAction(true);
    try {
      const res = await fetch(registerUserEndpoint, {
        // Utiliser l'URL du service
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json(); // Toujours essayer de lire la réponse JSON

      if (!res.ok) {
        throw new Error(data.message || "Erreur d'inscription");
      }

      // --- Stockage du Token ---
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        await mutate();
        toast.success('Inscription réussie ! Vous pouvez vous connecter.');
      } else {
        throw new Error('Réponse invalide du serveur après inscription.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erreur dans register:', error);
        toast.error(error.message || 'Une erreur est survenue');
      } else {
        console.error('Erreur inconnue dans register:', error);
        toast.error('Une erreur inconnue est survenue');
      }
      localStorage.removeItem('authToken'); // Nettoyer en cas d'erreur
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const logout = async () => {
    // --- Suppression du Token ---
    localStorage.removeItem('authToken');

    // --- Mise à jour SWR ---
    // Met à jour immédiatement le cache SWR à null sans déclencher de revalidation réseau
    await mutate(null, false);

    toast.success('Déconnexion réussie');
    // Redirection vers la page de connexion
    router.push('/auth/login');
  };

  // Déterminer l'état d'authentification basé sur les données utilisateur de SWR
  // isLoading est vrai si on n'a ni données ni erreur (chargement initial SWR)
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading, // État de chargement global de l'authentification
    isAuthenticated,
    loadingAction, // État de chargement spécifique aux actions login/register
    login,
    register,
    logout,
    error, // Erreur SWR (si le fetch /me échoue après plusieurs tentatives par ex.)
    mutate, // Exposer mutate si besoin de rafraîchir manuellement l'état user ailleurs
  };
};
