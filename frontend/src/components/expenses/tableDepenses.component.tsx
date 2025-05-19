'use client';

import { useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { depensesEndpoint } from '@/services/api.service';
import { Edit, Trash2, Upload, Pin } from 'lucide-react';
import {
  useDepenses,
  DepenseFilters,
  DepenseSort,
} from '@/hooks/useDepenses.hook';
import { ICategorie } from '@/types/categorie.type';

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  currentSort: DepenseSort;
  onEdit: (depense: IDepense) => void;
  onAdd: () => void;
  onAddCategorie: () => void;
  onImport: () => void;
  onFilterChange: (filters: Partial<DepenseFilters>) => void;
  onSortChange: (sort: Partial<DepenseSort>) => void;
  currentUserId?: string;
  partenaireId?: string;
}

export default function TableDepenses({
  depenses = [],
  categories = [],
  currentSort,
  onEdit,
  onAdd,
  onAddCategorie,
  onImport,
  onFilterChange,
  onSortChange,
  currentUserId,
}: TableDepensesProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [typeCompte, setTypeCompte] = useState<string>('');
  const [typeDepense, setTypeDepense] = useState<string>('');
  const { refreshDepenses } = useDepenses();

  const handleEdit = (depense: IDepense) => {
    onEdit(depense);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      await fetcher(`${depensesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Dépense supprimée avec succès !');
      refreshDepenses();
    } catch {
      toast.error('Erreur lors de la suppression de la dépense');
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
      {/* Section des Filtres */}
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
            htmlFor="category-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Catégorie
          </label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedCategory(value);
              onFilterChange({ categorie: value });
            }}
            className="input"
          >
            <option value="">Toutes</option>
            {Array.isArray(categories) &&
              categories.map((categorie) => (
                <option key={categorie._id} value={categorie._id}>
                  {categorie.nom}
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
        <div className="flex-grow min-w-[150px]">
          <label
            htmlFor="type-depense-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type de dépense
          </label>
          <select
            id="type-depense-select"
            value={typeDepense}
            onChange={(e) => {
              const value = e.target.value;
              setTypeDepense(value);
              onFilterChange({ typeDepense: value });
            }}
            className="input"
          >
            <option value="">Tous</option>
            <option value="Perso">Perso</option>
            <option value="Commune">Commune</option>
          </select>
        </div>
        {/* Boutons d'action */}
        <button
          onClick={onAdd}
          className="btn-primary px-4 py-2 whitespace-nowrap flex-shrink-0 self-end"
        >
          + Dépense
        </button>
        <button
          onClick={onAddCategorie}
          className="btn-primary px-4 py-2 whitespace-nowrap flex-shrink-0 self-end"
        >
          + Catégorie
        </button>
        <button
          onClick={onImport}
          className="btn-secondary px-4 py-2 whitespace-nowrap flex-shrink-0 self-end flex items-center gap-1"
        >
          <Upload size={16} /> Importer CSV
        </button>
      </div>

      {/* Tableau des Dépenses */}
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
                onClick={() => handleSort('categorie')}
              >
                Catégorie{' '}
                {currentSort.sortBy === 'categorie'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('utilisateur')}
              >
                Payé par{' '}
                {currentSort.sortBy === 'utilisateur'
                  ? currentSort.order === 'asc'
                    ? '↑'
                    : '↓'
                  : ''}
              </th>
              <th
                className="px-4 py-2 text-center cursor-pointer"
                onClick={() => handleSort('estChargeFixe')}
              >
                Charge Fixe{' '}
                {currentSort.sortBy === 'estChargeFixe'
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
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('typeDepense')}
              >
                Type de dépense{' '}
                {currentSort.sortBy === 'typeDepense'
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
            {depenses.length > 0 ? (
              depenses.map((depense) => (
                <tr key={depense._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {' '}
                    {new Date(depense.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-2">{depense.description}</td>
                  <td className="px-4 py-2">{depense.commentaire}</td>
                  <td className="px-4 py-2">
                    {typeof depense.categorie === 'object' &&
                    depense.categorie !== null
                      ? depense.categorie.nom
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2">
                    {typeof depense.utilisateur === 'object' &&
                    depense.utilisateur !== null &&
                    'nom' in depense.utilisateur
                      ? depense.utilisateur.nom
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {depense.estChargeFixe ? (
                      <Pin size={16} className="text-blue-500 mx-auto" />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-2">{depense.typeCompte}</td>
                  <td className="px-4 py-2">{depense.typeDepense}</td>
                  <td className="px-4 py-2 text-right font-medium whitespace-nowrap">
                    {depense.montant.toFixed(2)} €
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(depense)}
                        className={`p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Modifier"
                        disabled={
                          currentUserId !==
                          (typeof depense.utilisateur === 'object'
                            ? depense.utilisateur._id
                            : depense.utilisateur)
                        }
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(depense._id)}
                        className={`p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Supprimer"
                        disabled={
                          currentUserId !==
                          (typeof depense.utilisateur === 'object'
                            ? depense.utilisateur._id
                            : depense.utilisateur)
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
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  Aucune dépense trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
