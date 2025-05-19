'use client';
import { useAuth } from '@/hooks/useAuth.hook';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log(
        '[RequireAuth] Aucun token trouvé, redirection vers la page de connexion',
      );
      router.push('/auth/login');
      return;
    }

    if (token && !isAuthenticated && !isLoading) {
      console.log(
        '[RequireAuth] Token présent mais utilisateur non authentifié, tentative de rafraîchissement',
      );
      refreshUser().finally(() => {
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }

    if (!isLoading && !isAuthenticated && !isCheckingAuth) {
      console.log(
        '[RequireAuth] Utilisateur non authentifié après vérification, redirection',
      );
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router, refreshUser, isCheckingAuth]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex h-screen justify-center items-center">
        <p className="text-lg">Vérification de l&apos;authentification...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen justify-center items-center">
        <p className="text-lg">Redirection vers la page de connexion...</p>
      </div>
    );
  }

  return <>{children}</>;
}
