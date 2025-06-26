'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import React from 'react';

function AuthNav() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <Home size={20} />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default React.memo(AuthNav);
