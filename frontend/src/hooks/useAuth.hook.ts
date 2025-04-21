'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import fetcher from '@/utils/fetcher.utils';
import { loginEndpoint, registerEndpoint, meEndpoint } from '@/services/api.service';

export const useAuth = () => {
  const router = useRouter();

  const {
    data: user,
    error,
    mutate, 
    isLoading: isUserLoading, 
  } = useSWR(meEndpoint, fetcher, {
    shouldRetryOnError: false,
    onError: (err) => {
      if (err.status === 401) {
        localStorage.removeItem('authToken');
        mutate(null, false);
      }
    }
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
    try {
      const res = await fetch(loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse: password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur de connexion');
      }

      const data = await res.json();
      if (!data.token) {
        throw new Error('Token manquant dans la réponse');
      }

      localStorage.setItem('authToken', data.token);
      await mutate();
      return data;
    } catch (error) {
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
      const res = await fetch(registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, motDePasse: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      if (!data.token) {
        throw new Error('Token manquant dans la réponse');
      }

      localStorage.setItem('authToken', data.token);
      await mutate();
      return data;
    } catch (error) {
      localStorage.removeItem('authToken');
      await mutate(null, false);
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    await mutate(null, false);
    router.push('/auth/login');
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
    error,
    mutate,
  };
};
