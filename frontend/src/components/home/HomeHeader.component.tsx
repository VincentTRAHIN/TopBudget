"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth.hook";
import { LogIn, LogOut, User } from "lucide-react";
import { toast } from "react-hot-toast";

export default function HomeHeader() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  };

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
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={20} />
                  <span>{user.email}</span>
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