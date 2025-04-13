"use client";

import { useDepenses } from '@/hooks/useDepenses.hook';
import { IDepense } from '@/types/depense.type';
import FormDepense from './formDepenses.component';
import { useState } from 'react';
import { toast } from 'react-hot-toast'; // Importer toast
import fetcher from '@/utils/fetcher.utils'; // Import fetcher
import { depensesEndpoint } from '@/services/api.service'; // Import endpoint URL
import { Edit, Trash2 } from 'lucide-react'; // Utiliser des icônes pour les boutons

export default function TableDepenses() {
  const { depenses, isLoading, isError, refreshDepenses } = useDepenses();
  const [search, setSearch] = useState('');
  const [editingDepense, setEditingDepense] = useState<IDepense | null>(null); // Renommer pour clarté
  const [showAddForm, setShowAddForm] = useState(false); // État pour afficher/masquer le formulaire d'ajout

  const handleEdit = (depense: IDepense) => {
    setEditingDepense(depense);
    setShowAddForm(false); // Masquer le form d'ajout si on édite
  };

  const handleCloseForms = () => {
      setEditingDepense(null);
      setShowAddForm(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    try {
      // Remplacer fetch par fetcher
      await fetcher(`${depensesEndpoint}/${id}`, { // Utiliser l'URL importée
        method: 'DELETE',
      });
      // Succès si fetcher ne lance pas d'erreur (réponse 204 attendue)
      refreshDepenses();
      toast.success('Dépense supprimée avec succès !'); // Ajouter feedback utilisateur
    } catch (error: unknown) { // Catch erreur du fetcher
      console.error('Erreur lors de la suppression de la dépense:', error);
      // Afficher le message d'erreur
      if (error instanceof Error) {
        toast.error(error.message || 'Erreur lors de la suppression de la dépense');
      } else {
        toast.error('Erreur inconnue lors de la suppression de la dépense');
      }
    }
  };

  // Logique de filtrage (ok)
  const filtredDepenses = depenses.filter(
    (depense: IDepense) =>
      (depense.commentaire?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (typeof depense.categorie !== 'string' && depense.categorie?.nom?.toLowerCase().includes(search.toLowerCase())) || // Vérifier si catégorie.nom existe
      depense.montant.toString().includes(search.toLowerCase()) // Permettre recherche par montant
  );

  if (isLoading) {
    return <div className="text-center p-6">Chargement des dépenses...</div>;
  }

  if (isError) {
    return <div className="text-center p-6 text-red-600">Erreur lors de la récupération des dépenses.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Zone d'ajout/modification */}
       <div className="mb-6">
        {editingDepense && (
          <FormDepense
            existingDepense={editingDepense}
            onClose={handleCloseForms}
          />
        )}
        {showAddForm && !editingDepense && (
            <FormDepense onClose={handleCloseForms} />
        )}
      </div>

      {/* Barre d'actions et recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-gray-800">Mes dépenses</h3>
        <div className="flex items-center gap-4 w-full md:w-auto">
            <input
              type="text"
              placeholder="Rechercher (cat, com, montant)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input flex-grow md:w-64" // Ajuster la largeur
            />
            {!showAddForm && !editingDepense && (
                 <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary px-4 py-2 whitespace-nowrap" // Empêcher le retour à la ligne
                >
                    + Ajouter
                </button>
            )}
        </div>
      </div>


      {/* Tableau des dépenses */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Commentaire</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtredDepenses.length > 0 ? (
                 filtredDepenses.map((depense: IDepense) => (
              <tr key={depense._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(depense.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-2 font-semibold text-right whitespace-nowrap">
                  {depense.montant.toFixed(2)} €
                </td>
                <td className="px-4 py-2">{depense.typeCompte}</td>
                <td className="px-4 py-2">
                  {/* Ajouter une vérification si categorie est populée */}
                  {typeof depense.categorie !== 'string' && depense.categorie?.nom
                    ? depense.categorie.nom
                    : 'N/A'}
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{depense.commentaire}</td>
                <td className="px-4 py-2 flex justify-center space-x-2">
                  <button
                    onClick={() => handleEdit(depense)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(depense._id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
            ) : (
             <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  Aucune dépense trouvée {search ? 'pour cette recherche' : ''}.
                </td>
              </tr>
            )

            }
          </tbody>
        </table>
      </div>
    </div>
  );
}