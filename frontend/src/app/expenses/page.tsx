'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TableDepenses from '@/components/expenses/tableDepenses.component';
import FormDepense from '@/components/expenses/formDepenses.component';
import FormCategorie from '@/components/categories/formCategorie.component';
import {
  useDepenses,
  DepenseFilters,
  DepenseSort,
} from '@/hooks/useDepenses.hook';
import { useCategories } from '@/hooks/useCategories.hook';
import { useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function ExpensesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepense, setSelectedDepense] = useState<IDepense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategorieForm, setShowAddCategorieForm] = useState(false);
  const [filters, setFilters] = useState<DepenseFilters>({});
  const [sort, setSort] = useState<DepenseSort>({});
  const { depenses, pagination, isLoading, isError } =
    useDepenses(currentPage, ITEMS_PER_PAGE, filters, sort);
  const { categories } = useCategories();

  const handleEdit = (depense: IDepense) => {
    setSelectedDepense(depense);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setSelectedDepense(null);
    setShowAddForm(true);
  };

  const handleAddCategorie = () => {
    setShowAddCategorieForm(true);
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

   // Le handler principal qui met à jour l'état et reset la page
   const handleFilterOrSortChange = (
    changedFilters?: Partial<DepenseFilters>,
    changedSort?: DepenseSort
 ) => {
  console.log("Changement détecté:", { changedFilters, changedSort });
  if (changedFilters) {
      setFilters(prevFilters => ({ ...prevFilters, ...changedFilters }));
  }
  if (changedSort) {
      setSort(changedSort);
  }
  setCurrentPage(1);
};

// Wrapper spécifique pour le changement de tri
const handleSortChange = (newSort: DepenseSort) => {
    handleFilterOrSortChange(undefined, newSort); 
};

// Wrapper spécifique pour le changement de filtre 
const handleFilterChange = (newFilters: Partial<DepenseFilters>) => {
    handleFilterOrSortChange(newFilters, undefined); 
};

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Mes dépenses</h1>
          {showAddCategorieForm && (
            <FormCategorie
              onClose={() => {
                setShowAddCategorieForm(false);
              }}
            />
          )}
          {showAddForm && (
            <FormDepense
              existingDepense={selectedDepense ?? undefined}
              onClose={() => {
                setShowAddForm(false);
                setSelectedDepense(null);
              }}
            />
          )}
          {isLoading && (
            <div className="text-center p-4">Chargement des dépenses...</div>
          )}
          {isError && (
            <div className="text-center p-4 text-red-600">
              Erreur lors du chargement des dépenses.
            </div>
          )}
          {!isError && (
            <>
              <TableDepenses
                depenses={depenses}
                categories={categories}
                currentSort={sort}
                onEdit={handleEdit}
                onAdd={handleAdd}
                onAddCategorie={handleAddCategorie}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}

              />
              {/* --- Section Pagination --- */}
              {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between mt-4 p-4 bg-white rounded shadow">
                  <span className="text-sm text-gray-700">
                    Total de {pagination.total} dépenses
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1 || isLoading}
                      className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      aria-label="Page précédente"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <span className="text-sm font-medium">
                      Page {pagination.page} sur {pagination.pages}
                    </span>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === pagination.pages || isLoading}
                      className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      aria-label="Page suivante"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}
