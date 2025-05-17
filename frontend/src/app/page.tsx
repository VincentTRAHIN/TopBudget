'use client';

import HomeHeader from '@/components/home/HomeHeader.component';
import { useAuth } from '@/hooks/useAuth.hook';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Bienvenue sur TopBudget
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Gérez vos dépenses facilement et efficacement
          </p>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Accéder au tableau de bord
            </Link>
          ) : (
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Se connecter
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
