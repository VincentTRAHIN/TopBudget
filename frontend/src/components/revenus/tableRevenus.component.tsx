'use client';

import { useState } from 'react';
import { IRevenu } from '@/types/revenu.type';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { revenusEndpoint } from '@/services/api.service';
import { Edit, Trash2 } from 'lucide-react';
import { useRevenus, RevenuFilters, RevenuSort } from '@/hooks/useRevenus.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';

interface TableRevenusProps {
  revenus: IRevenu[];
  currentSort: RevenuSort;
  onEdit: (revenu: IRevenu) => void;
  onFilterChange: (filters: Partial<RevenuFilters>) => void;
  onSortChange: (sort: Partial<RevenuSort>) => void;
  currentUserId?: string;
}

export default function TableRevenus({
  revenus = [],
  currentSort,
  onEdit,
  onFilterChange,
  onSortChange,
  currentUserId,
}: TableRevenusProps) {
  const [search, setSearch] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [typeCompte, setTypeCompte] = useState<string>('');
  const [categorieRevenu, setCategorieRevenu] = useState('');
  const [estRecurrent, setEstRecurrent] = useState('');
  const { refreshRevenus } = useRevenus();
  const { categoriesRevenu } = useCategoriesRevenu();

  const handleEdit = (revenu: IRevenu) => {
    onEdit(revenu);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      await fetcher(`${revenusEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Revenu supprimé avec succès !');
      refreshRevenus();
    } catch {
      toast.error('Erreur lors de la suppression du revenu');
    }
  };

  const handleSort = (field: string) => {
    const newOrder =
      currentSort.sortBy === field && currentSort.order === 'asc'
        ? 'desc'
        : 'asc';
    onSortChange({ sortBy: field, order: newOrder });
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded items-end">
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="search-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Recherche
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Description, commentaire..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTimeout(() => {
                onFilterChange({ search: e.target.value });
              }, 300);
            }}
            className="input"
          />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="categorie-revenu-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Catégorie de Revenu
          </label>
          <select
            id="categorie-revenu-select"
            value={categorieRevenu}
            onChange={(e) => {
              setCategorieRevenu(e.target.value);
              onFilterChange({ categorieRevenu: e.target.value });
            }}
            className="input"
          >
            <option value="">Toutes</option>
            {Array.isArray(categoriesRevenu) &&
              categoriesRevenu.map((cat: ICategorieRevenu) => (
                <option key={cat._id} value={cat._id}>
                  {cat.nom}
                </option>
              ))}
          </select>
        </div>
        <div className="flex-grow min-w-[130px]">
          <label
            htmlFor="date-debut"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Du
          </label>
          <input
            id="date-debut"
            type="date"
            value={dateDebut}
            onChange={(e) => {
              setDateDebut(e.target.value);
              onFilterChange({ dateDebut: e.target.value });
            }}
            className="input"
            aria-label="Date de début"
          />
        </div>
        <div className="flex-grow min-w-[130px]">
          <label
            htmlFor="date-fin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Au
          </label>
          <input
            id="date-fin"
            type="date"
            value={dateFin}
            onChange={(e) => {
              setDateFin(e.target.value);
              onFilterChange({ dateFin: e.target.value });
            }}
            className="input"
            aria-label="Date de fin"
          />
        </div>
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="type-compte-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Compte
          </label>
          <select
            id="type-compte-select"
            value={typeCompte}
            onChange={(e) => {
              const value = e.target.value;
              setTypeCompte(value);
              onFilterChange({ typeCompte: value });
            }}
            className="input"
          >
            <option value="">Tous</option>
            <option value="Perso">Perso</option>
            <option value="Conjoint">Conjoint</option>
          </select>
        </div>
        <div className="flex-grow min-w-[120px]">
          <label
            htmlFor="est-recurrent-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Récurrence
          </label>
          <select
            id="est-recurrent-select"
            value={estRecurrent}
            onChange={(e) => {
              const value = e.target.value as '' | 'true' | 'false';
              setEstRecurrent(value);
              onFilterChange({ estRecurrent: value });
            }}
            className="input"
          >
            <option value="">Tous</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>
      {/* Tableau des Revenus */}
      <div className="overflow-x-auto">
        <table className="table w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('date')}
              >
                Date{' '}
                {currentSort.sortBy === 'date'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('description')}
              >
                Description{' '}
                {currentSort.sortBy === 'description'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('categorieRevenu')}
              >
                Catégorie{' '}
                {currentSort.sortBy === 'categorieRevenu'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('estRecurrent')}
              >
                Récurrent ?{' '}
                {currentSort.sortBy === 'estRecurrent'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('commentaire')}
              >
                Commentaire{' '}
                {currentSort.sortBy === 'commentaire'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('utilisateur')}
              >
                Reçu par{' '}
                {currentSort.sortBy === 'utilisateur'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('typeCompte')}
              >
                Compte{' '}
                {currentSort.sortBy === 'typeCompte'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-right cursor-pointer"
                onClick={() => handleSort('montant')}
              >
                Montant{' '}
                {currentSort.sortBy === 'montant'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {revenus.length > 0 ? (
              revenus.map((revenu) => (
                <tr key={revenu._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(revenu.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2">{revenu.description}</td>
                  <td className="px-4 py-2">
                    {typeof revenu.categorieRevenu === 'object' &&
                    revenu.categorieRevenu !== null &&
                    'nom' in revenu.categorieRevenu
                      ? revenu.categorieRevenu.nom
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    {revenu.estRecurrent ? 'Oui' : 'Non'}
                  </td>
                  <td className="px-4 py-2">{revenu.commentaire}</td>
                  <td className="px-4 py-2">
                    {typeof revenu.utilisateur === 'object' &&
                    revenu.utilisateur !== null &&
                    'nom' in revenu.utilisateur
                      ? revenu.utilisateur.nom
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2">{revenu.typeCompte}</td>
                  <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                    {Number(revenu.montant).toFixed(2)} €
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(revenu)}
                        className={`p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Modifier"
                        disabled={
                          currentUserId !==
                          (typeof revenu.utilisateur === 'object'
                            ? revenu.utilisateur._id
                            : revenu.utilisateur)
                        }
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(revenu._id)}
                        className={`p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Supprimer"
                        disabled={
                          currentUserId !==
                          (typeof revenu.utilisateur === 'object'
                            ? revenu.utilisateur._id
                            : revenu.utilisateur)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  Aucun revenu trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
