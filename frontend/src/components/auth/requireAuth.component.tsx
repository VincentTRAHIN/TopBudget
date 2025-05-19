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
    // Vérifie si un token existe dans le localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('[RequireAuth] Aucun token trouvé, redirection vers la page de connexion');
      router.push('/auth/login');
      return;
    }

    // Si nous avons un token mais que l'utilisateur n'est pas encore authentifié,
    // essayons de rafraîchir l'utilisateur une fois
    if (token && !isAuthenticated && !isLoading) {
      console.log('[RequireAuth] Token présent mais utilisateur non authentifié, tentative de rafraîchissement');
      refreshUser().finally(() => {
        setIsCheckingAuth(false);
      });
    } else {
      setIsCheckingAuth(false);
    }

    // Si le chargement est terminé et que l'utilisateur n'est pas authentifié, rediriger
    if (!isLoading && !isAuthenticated && !isCheckingAuth) {
      console.log('[RequireAuth] Utilisateur non authentifié après vérification, redirection');
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router, refreshUser, isCheckingAuth]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex h-screen justify-center items-center">
        <p className="text-lg">Vérification de l'authentification...</p>
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
