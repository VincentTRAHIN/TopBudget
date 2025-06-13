'use client';

import { useState } from 'react';
import { ICategorie } from '@/types/categorie.type';
import { Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { categoriesEndpoint } from '@/services/api.service';
import { useCategories } from '@/hooks/useCategories.hook';

interface CategoriesListProps {
  categories: ICategorie[];
  isLoading: boolean;
  isError: Error | null;
  onEdit: (categorie: ICategorie) => void;
  onDelete: () => void;
  onAdd: () => void;
}

export default function CategoriesList({
  categories = [],
  isLoading,
  isError,
  onEdit,
  onDelete,
  onAdd,
}: CategoriesListProps) {
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { refreshCategories } = useCategories();

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await fetcher(`${categoriesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Catégorie supprimée avec succès');
      refreshCategories();
      onDelete();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('utilisée')) {
        toast.error('Cette catégorie est utilisée et ne peut être supprimée.');
      } else {
        toast.error('Erreur lors de la suppression de la catégorie');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRetry = () => {
    refreshCategories();
  };

  const filteredCategories = categories.filter((categorie) => {
    const searchLower = search.toLowerCase();
    return (
      categorie.nom.toLowerCase().includes(searchLower) ||
      categorie.description?.toLowerCase().includes(searchLower)
    );
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              disabled
              className="input flex-grow md:w-64 opacity-50"
            />
            <button
              disabled
              className="btn-primary px-4 py-2 whitespace-nowrap opacity-50 cursor-not-allowed"
            >
              Ajouter une catégorie
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500">Chargement des catégories...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              disabled
              className="input flex-grow md:w-64 opacity-50"
            />
            <button
              onClick={onAdd}
              className="btn-primary px-4 py-2 whitespace-nowrap"
            >
              Ajouter une catégorie
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-red-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Erreur lors du chargement
              </h3>
              <p className="text-gray-500 mb-4">
                Impossible de charger les catégories. Veuillez réessayer.
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-grow md:w-64"
          />
          <button
            onClick={onAdd}
            className="btn-primary px-4 py-2 whitespace-nowrap"
          >
            Ajouter une catégorie
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center">
                  {search ? (
                    <div className="text-gray-500">
                      <p className="mb-2">Aucune catégorie trouvée pour &quot;{search}&quot;</p>
                      <button
                        onClick={() => setSearch('')}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="text-gray-500">
                      <p className="mb-4">Aucune catégorie de dépense trouvée.</p>
                      <p className="text-sm mb-4">Commencez par créer votre première catégorie pour organiser vos dépenses.</p>
                      <button
                        onClick={onAdd}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Créer ma première catégorie
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune catégorie ne correspond à votre recherche.</p>
                  )}
                </td>
              </tr>
            ) : (
              filteredCategories.map((categorie) => (
                <tr key={categorie._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{categorie.nom}</td>
                  <td className="px-4 py-2">{categorie.description}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(categorie)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        aria-label="Modifier"
                        disabled={isDeleting === categorie._id}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(categorie._id)}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                        aria-label="Supprimer"
                        disabled={isDeleting === categorie._id}
                      >
                        {isDeleting === categorie._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
