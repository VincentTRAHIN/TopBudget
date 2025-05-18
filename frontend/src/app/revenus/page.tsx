'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TableRevenus from '@/components/revenus/tableRevenus.component';
import FormRevenu from '@/components/revenus/formRevenu.component';
import ImportCsvModalRevenu from '@/components/revenus/importCsvModalRevenu.component';
import { useRevenus, RevenuFilters, RevenuSort } from '@/hooks/useRevenus.hook';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState } from 'react';
import { IRevenu } from '@/types/revenu.type';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export default function RevenusPage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRevenu, setSelectedRevenu] = useState<IRevenu | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<RevenuFilters>({});
  const [sort, setSort] = useState<RevenuSort>({});
  const [selectedVue, setSelectedVue] = useState<
    'moi' | 'partenaire' | 'couple_complet'
  >('moi');
  const [showImportModalRevenu, setShowImportModalRevenu] = useState(false);
  const { revenus, pagination, isLoading, isError } = useRevenus(
    currentPage,
    ITEMS_PER_PAGE,
    filters,
    sort,
    selectedVue,
  );

  const handleEdit = (revenu: IRevenu) => {
    setSelectedRevenu(revenu);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setSelectedRevenu(null);
    setShowAddForm(true);
  };

  const handleOpenImportModalRevenu = () => {
    setShowImportModalRevenu(true);
    setShowAddForm(false);
  };

  const handleCloseImportModalRevenu = () => {
    setShowImportModalRevenu(false);
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
    changedFilters?: Partial<RevenuFilters>,
    changedSort?: RevenuSort,
  ) => {
    if (changedFilters) {
      setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
    }
    if (changedSort) {
      setSort(changedSort);
    }
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: RevenuSort) => {
    handleFilterOrSortChange(undefined, newSort);
  };

  const handleFilterChange = (newFilters: Partial<RevenuFilters>) => {
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
          <h1 className="text-2xl font-bold">Mes Revenus</h1>

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
              <option value="moi">Mes Revenus</option>
              {user?.partenaireId && typeof user.partenaireId === 'object' && (
                <option value="partenaire">
                  Revenus de {user.partenaireId.nom}
                </option>
              )}
              {user?.partenaireId && (
                <option value="couple_complet">
                  Tous les Revenus du Couple
                </option>
              )}
            </select>
          </div>

          {showAddForm && (
            <FormRevenu
              existingRevenu={selectedRevenu ?? undefined}
              onClose={() => {
                setShowAddForm(false);
                setSelectedRevenu(null);
              }}
            />
          )}
          {isLoading && (
            <div className="text-center p-4">Chargement des revenus...</div>
          )}
          {isError && (
            <div className="text-center p-4 text-red-600">
              Erreur lors du chargement des revenus.
            </div>
          )}

          {!isError && (
            <>
              <TableRevenus
                revenus={revenus}
                currentSort={sort}
                onEdit={handleEdit}
                onAdd={handleAdd}
                onImport={handleOpenImportModalRevenu}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                currentUserId={user?._id}
              />
              {/* --- Section Pagination --- */}
              {pagination && pagination.total > 0 && (
                <div className="flex items-center justify-between mt-4 p-4 bg-white rounded shadow">
                  <span className="text-sm text-gray-700">
                    Total de {pagination.total} revenus
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
          {showImportModalRevenu && (
            <ImportCsvModalRevenu onClose={handleCloseImportModalRevenu} />
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}
