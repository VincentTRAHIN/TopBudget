'use client';

import React, { useState } from 'react';
import { ICategorie } from '@/types/categorie.type';
import { RefreshCw } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories.hook';
import { Table } from '../table';
import { useColumns } from './useColumns';
import { EmptyComponent } from './empty.component';
import { categoriesEndpoint } from '@/services/api.service';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';

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
  const { refreshCategories } = useCategories();

  const { columns, actions } = useColumns<ICategorie | ICategorieRevenu>({
    onEdit,
    onDelete,
    refresh : refreshCategories,
    endpoint: categoriesEndpoint,
  });

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
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
        <Table
          columns={columns}
          data={filteredCategories}
          rowAction={actions}
          emptyRender={
            <EmptyComponent
              search={search}
              setSearch={setSearch}
              onAdd={onAdd}
              categories={categories}
            />
          }
        />
      </div>
    </div>
  );
}
