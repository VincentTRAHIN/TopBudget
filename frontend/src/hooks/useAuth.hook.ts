"use client";

import { useState } from 'react';
import useSWR  from 'swr';
import fetcher from '@/utils/fetcher.utils';
import {
  IUser,
  UserLoginPayload,
  UserRegisterPayload,
} from '@/types/user.type';
import { loginUser, registerUser } from '@/services/api.service';

export const useAuth = () => {
  const {
    data: user,
    error,
    mutate,
  } = useSWR<IUser | null>('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const [loading, setLoading] = useState(false);

  const login = async (credentials: UserLoginPayload) => {
    setLoading(true);
    try {
      const res = await fetch(loginUser, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        throw new Error('Erreur de connexion');
      }

      await mutate();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserRegisterPayload) => {
    setLoading(true);
    try {
      const res = await fetch(registerUser, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        throw new Error("Erreur d'inscription");
      }

      await mutate();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Ici à adapter plus tard selon comment tu veux faire logout (effacer JWT, etc.)
    await mutate(null);
  };

  return {
    user,
    isLoading: !user && !error,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    error,
  };
};
