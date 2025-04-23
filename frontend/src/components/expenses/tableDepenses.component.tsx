"use client";

import { useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { depensesEndpoint } from '@/services/api.service';
import { Edit, Trash2 } from 'lucide-react';
import { useDepenses } from '@/hooks/useDepenses.hook';

interface TableDepensesProps {
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onAdd: () => void;
  onAddCategorie: () => void;
  onFilterChange: (filters: { categorie?: string; dateDebut?: string; dateFin?: string; typeCompte?: string; sortBy?: string; order?: string }) => void;
}

export default function TableDepenses({ depenses = [], onEdit, onAdd, onAddCategorie, onFilterChange }: TableDepensesProps) {
  const [search, setSearch] = useState('');
  const { refreshDepenses } = useDepenses();

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

  const handleFilterChange = (filters: { categorie?: string; dateDebut?: string; dateFin?: string; typeCompte?: string; sortBy?: string; order?: string }) => {
    onFilterChange(filters);
  };



  const filteredDepenses = depenses.filter((depense) => {
    const searchLower = search.toLowerCase();
    return (
      depense.commentaire?.toLowerCase().includes(searchLower) ||
      (typeof depense.categorie !== 'string' && depense.categorie?.nom?.toLowerCase().includes(searchLower)) ||
      depense.montant.toString().includes(searchLower)
    );
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
          <select onChange={(e) => handleFilterChange({ categorie: e.target.value })}>
            <option value="">Toutes les catégories</option>
            {/* Ajoutez ici les options pour les catégories */}
          </select>
          <input
            type="date"
            onChange={(e) => handleFilterChange({ dateDebut: e.target.value })}
          />
          <input
            type="date"
            onChange={(e) => handleFilterChange({ dateFin: e.target.value })}
          />
          <select onChange={(e) => handleFilterChange({ typeCompte: e.target.value })}>
            <option value="">Tous les types de compte</option>
            <option value="Perso">Perso</option>
            <option value="Conjoint">Conjoint</option>
            <option value="Commun">Commun</option>
          </select>
          <select onChange={(e) => handleFilterChange({ sortBy: e.target.value })}>
            <option value="date">Trier par date</option>
            <option value="montant">Trier par montant</option>
          </select>
          <select onChange={(e) => handleFilterChange({ order: e.target.value })}>
            <option value="asc">Ascendant</option>
            <option value="desc">Descendant</option>
          </select>
          <button onClick={onAdd} className="btn-primary px-4 py-2 whitespace-nowrap">
            Ajouter une dépense
          </button>
          <button onClick={onAddCategorie} className="btn-primary px-4 py-2 whitespace-nowrap">
            Ajouter une catégorie
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Commentaire</th>
              <th className="px-4 py-2 text-left">Catégorie</th>
              <th className="px-4 py-2 text-right">Montant</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepenses.map((depense) => (
              <tr key={depense._id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{new Date(depense.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{depense.commentaire}</td>
                <td className="px-4 py-2">{typeof depense.categorie === 'string' ? depense.categorie : depense.categorie?.nom}</td>
                <td className="px-4 py-2 text-right">{depense.montant}€</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => handleEdit(depense)} className="btn-icon">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(depense._id)} className="btn-icon">
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