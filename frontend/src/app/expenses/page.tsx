'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TableDepenses from '@/components/expenses/tableDepenses.component';
import FormDepense from '@/components/expenses/formDepenses.component';
import FormCategorie from '@/components/categories/formCategorie.component';
import ImportCsvModal from '@/components/expenses/importCsvModal.component';
import {
  useDepenses,
  DepenseFilters,
  DepenseSort,
} from '@/hooks/useDepenses.hook';
import { useCategories } from '@/hooks/useCategories.hook';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState } from 'react';
import { IDepense } from '@/types/depense.type';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function ExpensesPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepense, setSelectedDepense] = useState<IDepense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategorieForm, setShowAddCategorieForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [filters, setFilters] = useState<DepenseFilters>({});
  const [sort, setSort] = useState<DepenseSort>({});
  const [selectedVue, setSelectedVue] = useState<
    'moi' | 'partenaire' | 'couple_complet'
  >('moi');
  const { depenses, pagination, isLoading, isError } = useDepenses(
    currentPage,
    ITEMS_PER_PAGE,
    filters,
    sort,
    selectedVue,
  );
  const { categories } = useCategories();

  const handleEdit = (depense: IDepense) => {
    setSelectedDepense(depense);
    setShowAddForm(true);
    setShowImportModal(false);
    setShowAddCategorieForm(false);
  };

  const handleAdd = () => {
    setSelectedDepense(null);
    setShowAddForm(true);
    setShowImportModal(false);
    setShowAddCategorieForm(false);
  };

  const handleAddCategorie = () => {
    setShowAddCategorieForm(true);
    setShowAddForm(false);
    setShowImportModal(false);
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    setShowAddForm(false);
    setShowAddCategorieForm(false);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
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

  const handleFilterOrSortChange = (
    changedFilters?: Partial<DepenseFilters>,
    changedSort?: DepenseSort,
  ) => {
    console.log('Changement détecté:', { changedFilters, changedSort });
    if (changedFilters) {
      setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
    }
    if (changedSort) {
      setSort(changedSort);
    }
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: DepenseSort) => {
    handleFilterOrSortChange(undefined, newSort);
  };

  const handleFilterChange = (newFilters: Partial<DepenseFilters>) => {
    handleFilterOrSortChange(newFilters, undefined);
  };

  const handleVueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVue(e.target.value as 'moi' | 'partenaire' | 'couple_complet');
    setCurrentPage(1);
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Mes dépenses</h1>

          {/* Sélecteur de vue */}
          <div className="mb-4">
            <label htmlFor="vue-select" className="mr-2 font-medium">
              Vue :
            </label>
            <select
              id="vue-select"
              value={selectedVue}
              onChange={handleVueChange}
              className="border rounded px-2 py-1"
            >
              <option value="moi">Mes Dépenses</option>
              {user?.partenaireId && typeof user.partenaireId === 'object' && (
                <option value="partenaire">
                  Dépenses de {user.partenaireId.nom}
                </option>
              )}
              {user?.partenaireId && (
                <option value="couple_complet">
                  Toutes les Dépenses du Couple
                </option>
              )}
            </select>
          </div>

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
          {showImportModal && (
            <ImportCsvModal onClose={handleCloseImportModal} />
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
                onImport={handleOpenImportModal}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                currentUserId={user?._id}
                partenaireId={
                  user?.partenaireId && typeof user.partenaireId === 'object'
                    ? user.partenaireId._id
                    : undefined
                }
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
