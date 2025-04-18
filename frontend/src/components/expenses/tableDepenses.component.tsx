"use client";

import { useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { toast } from 'react-hot-toast';
import fetcher from '@/utils/fetcher.utils';
import { depensesEndpoint } from '@/services/api.service';
import { Edit, Trash2 } from 'lucide-react';

interface TableDepensesProps {
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onAdd: () => void;
}

export default function TableDepenses({ depenses = [], onEdit, onAdd }: TableDepensesProps) {
  const [search, setSearch] = useState('');

  const handleEdit = (depense: IDepense) => {
    onEdit(depense);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetcher(`${depensesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Dépense supprimée avec succès !');
    } catch {
      toast.error('Erreur lors de la suppression de la dépense');
    }
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
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-grow md:w-64"
          />
          <button onClick={onAdd} className="btn-primary px-4 py-2 whitespace-nowrap">
            Ajouter une dépense
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