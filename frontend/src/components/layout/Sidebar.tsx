"use client"; 

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth.hook"; // Importer le hook
import { LogOut } from "lucide-react"; // Importer une icône (optionnel)

export default function Sidebar() {
  // Récupérer l'état d'authentification et la fonction logout
  const { isAuthenticated, logout } = useAuth();

  return (
    // La sidebar est masquée sur mobile par défaut avec 'hidden md:block'
    // On peut la rendre visible et toggleable sur mobile plus tard si besoin
    <aside className="hidden md:flex flex-col w-64 h-full bg-white shadow-lg p-4 justify-between">
      <nav className="flex flex-col space-y-2">
        {/* Liens visibles par tous (ou ajuster si certains sont conditionnels) */}
        <Link href="/dashboard" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">
          Dashboard
        </Link>
        <Link href="/expenses" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">
          Mes Dépenses
        </Link>
        {/* Ajouter d'autres liens ici si nécessaire */}
      </nav>

      {/* Afficher le bouton seulement si l'utilisateur est authentifié */}
      {isAuthenticated && (
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={logout} // Appeler la fonction logout du hook
            className="w-full flex items-center px-3 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-800 font-medium"
          >
            <LogOut className="mr-2 h-5 w-5" /> {/* Icône optionnelle */}
            Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
}