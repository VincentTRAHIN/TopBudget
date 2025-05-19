'use client';

import { useAuth } from '@/hooks/useAuth.hook';
import { getAvatarColor } from '@/utils/avatar.utils';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <h1 className="text-xl font-bold">TopBudget</h1>

      {user && (
        <Link href="/profil" className="hover:opacity-80 transition-opacity">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={`Avatar de ${user.nom || 'utilisateur'}`}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-black text-sm font-bold shadow-sm border-2 border-gray-200 ${getAvatarColor(user.nom)}`}
              aria-label={`Profil de ${user.nom || 'utilisateur'}`}
            >
              {user.nom && user.nom.length > 0 ? user.nom.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </Link>
      )}
    </header>
  );
}
