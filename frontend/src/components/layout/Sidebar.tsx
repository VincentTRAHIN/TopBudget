"use client"; 

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth.hook";
import { LogOut } from "lucide-react";

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white shadow-lg p-4 justify-between">
      <nav className="flex flex-col space-y-2">
        <Link href="/dashboard" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">
          Dashboard
        </Link>
        <Link href="/expenses" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">
          Mes Dépenses
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