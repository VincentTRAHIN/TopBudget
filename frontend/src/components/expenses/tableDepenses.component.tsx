'use client';

import { useCallback, useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { useDepenses, DepenseFilters } from '@/hooks/useDepenses.hook';
import { ICategorie } from '@/types/categorie.type';
import debug from 'debug';
import React from 'react';
import { Table } from '../table';
import { useColumns } from './useColumns';

const log = debug('app:frontend:TableDepenses');

interface TableDepensesProps {
  categories: ICategorie[];
  depenses: IDepense[];
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: Partial<DepenseFilters>) => void;
  currentUserId?: string;
  partenaireId?: string;
}

function TableDepenses({
  depenses = [],
  categories = [],
  onEdit,
  onFilterChange,
  currentUserId,
}: TableDepensesProps) {
  log('Composant TableDepenses rendu avec props: %O', {
    depenses,
    categories,
    currentUserId,
  });

  const { refreshDepenses } = useDepenses();
  const {
    actions,
    columns,
  } = useColumns({
    currentUserId,
    onEdit,
    onFilterChange,
    refreshDepenses
  })
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [typeCompte, setTypeCompte] = useState<string>('');
  const [typeDepense, setTypeDepense] = useState<string>('');


  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setTimeout(() => {
      onFilterChange({ search: value });
    }, 300);
  }, [onFilterChange]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    onFilterChange({ categorie: value });
  }, [onFilterChange]);

  const handleDateDebutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateDebut(value);
    onFilterChange({ dateDebut: value });
  }, [onFilterChange]);

  const handleDateFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDateFin(value);
    onFilterChange({ dateFin: value });
  }, [onFilterChange]);

  const handleTypeCompteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTypeCompte(value);
    onFilterChange({ typeCompte: value });
  }, [onFilterChange]);

  const handleTypeDepenseChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTypeDepense(value);
    onFilterChange({ typeDepense: value });
  }, [onFilterChange]);

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
            onChange={handleSearchChange}
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
            onChange={handleCategoryChange}
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
            onChange={handleDateDebutChange}
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
            onChange={handleDateFinChange}
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
            onChange={handleTypeCompteChange}
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
            onChange={handleTypeDepenseChange}
            className="input"
          >
            <option value="">Tous</option>
            <option value="Perso">Perso</option>
            <option value="Commune">Commune</option>
          </select>
        </div>
      </div>

      {/* Tableau des Dépenses */}
      <Table<IDepense>
        data={depenses}
        emptyRender={
          <div className="text-center py-4 text-gray-500">
            Aucune dépense trouvée.
          </div>
        }
        columns={columns}
        rowAction={actions}
      />

    </div>
  );
}

export default React.memo(TableDepenses);
