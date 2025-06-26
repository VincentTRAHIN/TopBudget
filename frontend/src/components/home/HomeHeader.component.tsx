'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth.hook';
import { LogIn, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAvatarColor, getInitials } from '@/utils/avatar.utils';
import Image from 'next/image';
import React, { useCallback } from 'react';

function HomeHeader() {
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  }, [logout]);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              TopBudget
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <Link
                    href="/profil"
                    className="hover:opacity-80 transition-opacity rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={`Profil de ${user.nom}`}
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={`Avatar de ${user.nom}`}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm border-2 border-gray-200 ${getAvatarColor(user.nom)}`}
                        aria-label={`Profil de ${user.nom}`}
                      >
                        {getInitials(user.nom)}
                      </div>
                    )}
                  </Link>
                  <span className="font-medium text-gray-800">{user.nom}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  <LogOut size={20} />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <LogIn size={20} />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default React.memo(HomeHeader);
