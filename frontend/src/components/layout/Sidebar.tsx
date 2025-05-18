'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth.hook';
import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  CreditCard,
  Tag,
  LayoutDashboard,
  BarChart2,
  UserCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const isCategoriesPathActive = pathname.startsWith('/categories');

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white shadow-lg p-4 justify-between">
      <nav className="flex flex-col space-y-2">
        <Link
          href="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <Home size={20} />
          <span>Accueil</span>
        </Link>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/dashboard') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Tableau de Bord</span>
        </Link>

        <Link
          href="/expenses"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/expenses') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <CreditCard size={20} />
          <span>Mes Dépenses</span>
        </Link>
        <Link
          href="/revenus"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/revenus') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <ArrowDownCircle size={20} />
          <span>Mes Revenus</span>
        </Link>
        {/* Catégories menu déroulant */}
        <div>
          <button
            onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
              isCategoriesPathActive ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag size={20} />
              <span>Catégories</span>
            </div>
            {isCategoriesOpen ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {isCategoriesOpen && (
            <div className="pl-4 mt-1 space-y-1">
              <Link
                href="/categories"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-primary font-medium ${
                  isActive('/categories')
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : ''
                }`}
              >
                <span>Dépenses</span>
              </Link>
              <Link
                href="/categories-revenu"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-primary font-medium ${
                  isActive('/categories-revenu')
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : ''
                }`}
              >
                <span>Revenus</span>
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/statistiques"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/statistiques') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <BarChart2 size={20} />
          <span>Statistiques</span>
        </Link>
        <Link
          href="/profil"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium ${
            isActive('/profil') ? 'bg-indigo-50 text-indigo-600' : ''
          }`}
        >
          <UserCircle size={20} />
          <span>Mon Profil</span>
        </Link>
      </nav>

      {isAuthenticated && (
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-800 font-medium"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
}
