'use client';

import { useState } from 'react';
import { IRevenu } from '@/types/revenu.type';
import { useRevenus, RevenuFilters, RevenuSort } from '@/hooks/useRevenus.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { Table } from '../table';
import { useColumns } from './useColumn';

interface TableRevenusProps {
  revenus: IRevenu[];
  onEdit: (revenu: IRevenu) => void;
  onFilterChange: (filters: Partial<RevenuFilters>) => void;
  currentUserId?: string;
}

export default function TableRevenus({
  revenus = [],
  onEdit,
  onFilterChange,
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

  const { actions, columns } = useColumns({
    currentUserId,
    onEdit,
    refreshRevenus,
  });

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
        <Table<IRevenu>
          data={revenus}
          columns={columns}
          rowAction={actions}
          emptyRender={
            <tr>
              <td colSpan={9} className="text-center py-4 text-gray-500">
                Aucun revenu trouvé.
              </td>
            </tr>
          }
        />
      </div>
    </div>
  );
}
