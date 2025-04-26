'use client';

import { useState, useEffect } from 'react';
import { IDepense } from '@/types/depense.type';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { depensesEndpoint } from '@/services/api.service';
import { Edit, Trash2 } from 'lucide-react';
import { useDepenses } from '@/hooks/useDepenses.hook';
import { categoriesEndpoint } from '@/services/api.service';
import { ICategorie } from '@/types/categorie.type';

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onAdd: () => void;
  onAddCategorie: () => void;
  onFilterChange: (filters: {
    categorie?: string;
    dateDebut?: string;
    dateFin?: string;
    typeCompte?: string;
    sortBy?: string;
    order?: string;
  }) => void;
}

export default function TableDepenses({
  depenses = [],
  onEdit,
  onAdd,
  onAddCategorie,
  onFilterChange,
}: TableDepensesProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { refreshDepenses } = useDepenses();
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('asc');
  const [categories, setCategories] = useState<ICategorie[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetcher<ICategorie[]>(categoriesEndpoint);
      setCategories(response);
    };
    fetchCategories();
  }, []);

  const handleEdit = (depense: IDepense) => {
    onEdit(depense);
  };

  const handleDelete = async (id: string) => {
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
    const newOrder = sortBy === field && order === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setOrder(newOrder);
    onFilterChange({ sortBy: field, order: newOrder });
  };

  const filteredDepenses = depenses.filter((depense) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = depense.commentaire?.toLowerCase().includes(searchLower) ||
      (typeof depense.categorie !== 'string' &&
        depense.categorie?.nom?.toLowerCase().includes(searchLower)) ||
      depense.montant.toString().includes(searchLower);

    const matchesCategory = selectedCategory 
      ? typeof depense.categorie !== 'string' && depense.categorie?._id === selectedCategory 
      : true;

    return matchesSearch && matchesCategory;
  });

  const sortedDepenses = [...filteredDepenses].sort((a, b) => {
    const aValue =
      sortBy === 'categorie'
        ? (typeof a.categorie === 'string' ? a.categorie : a.categorie?.nom) ?? ''
        : typeof a[sortBy as keyof IDepense] === 'string'
        ? (a[sortBy as keyof IDepense] as string).toLowerCase()
        : (a[sortBy as keyof IDepense] ?? '');

    const bValue =
      sortBy === 'categorie'
        ? (typeof b.categorie === 'string' ? b.categorie : b.categorie?.nom) ?? ''
        : typeof b[sortBy as keyof IDepense] === 'string'
        ? (b[sortBy as keyof IDepense] as string).toLowerCase()
        : (b[sortBy as keyof IDepense] ?? '');

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher par commentaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-grow md:w-64"
          />
          <select
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              onFilterChange({ categorie: e.target.value });
            }}
            className="input"
          >
            <option value="">
              Catégories
            </option>
            {categories.map((categorie) => (
              <option key={categorie._id} value={categorie._id}>
                {categorie.nom}
              </option>
            ))}
          </select>
          <input
            type="date"
            onChange={(e) => onFilterChange({ dateDebut: e.target.value })}
            className="input"
          />
          <input
            type="date"
            onChange={(e) => onFilterChange({ dateFin: e.target.value })}
            className="input"
          />
          <select
            onChange={(e) => onFilterChange({ typeCompte: e.target.value })}
            className="input"
          >
            <option value="">Type de compte</option>
            <option value="Perso">Perso</option>
            <option value="Conjoint">Conjoint</option>
            <option value="Commun">Commun</option>
          </select>
          <button
            onClick={onAdd}
            className="btn-primary px-4 py-2 whitespace-nowrap"
          >
            Ajouter une dépense
          </button>
          <button
            onClick={onAddCategorie}
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
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('date')}
              >
                Date {sortBy === 'date' ? (order === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('commentaire')}
              >
                Commentaire{' '}
                {sortBy === 'commentaire' ? (order === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('categorie')}
              >
                Catégorie{' '}
                {sortBy === 'categorie' ? (order === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="px-4 py-2 text-left cursor-pointer"
                onClick={() => handleSort('typeCompte')}
              >
                Type de compte{' '}
                {sortBy === 'typeCompte' ? (order === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th
                className="px-4 py-2 text-right cursor-pointer"
                onClick={() => handleSort('montant')}
              >
                Montant{' '}
                {sortBy === 'montant' ? (order === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDepenses.map((depense) => (
              <tr key={depense._id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  {new Date(depense.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">{depense.commentaire}</td>
                <td className="px-4 py-2">
                  {typeof depense.categorie === 'string'
                    ? depense.categorie
                    : depense.categorie?.nom}
                </td>
                <td className="px-4 py-2">
                  {depense.typeCompte}
                </td>
                <td className="px-4 py-2 text-right">{depense.montant}€</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(depense)}
                      className="btn-icon"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(depense._id)}
                      className="btn-icon"
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
