'use client';

import { useState } from 'react';
import { ICategorie } from '@/types/categorie.type';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { categoriesEndpoint } from '@/services/api.service';
import { useCategories } from '@/hooks/useCategories.hook';

interface CategoriesListProps {
  categories: ICategorie[];
  onEdit: (categorie: ICategorie) => void;
  onDelete: () => void;
  onAdd: () => void;
}

export default function CategoriesList({
  categories = [],
  onEdit,
  onDelete,
  onAdd,
}: CategoriesListProps) {
  const [search, setSearch] = useState('');
  const { refreshCategories } = useCategories();

  const handleDelete = async (id: string) => {
    try {
      await fetcher(`${categoriesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Catégorie supprimée avec succès');
      refreshCategories();
      onDelete();
    } catch {
      toast.error('Erreur lors de la suppression de la catégorie');
    }
  };

  const filteredCategories = categories.filter((categorie) => {
    const searchLower = search.toLowerCase();
    return (
      categorie.nom.toLowerCase().includes(searchLower) ||
      categorie.description?.toLowerCase().includes(searchLower)
    );
  });

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
            {filteredCategories.map((categorie) => (
              <tr key={categorie._id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{categorie.nom}</td>
                <td className="px-4 py-2">{categorie.description}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(categorie)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      aria-label="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(categorie._id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
