'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TableRevenus from '@/components/revenus/tableRevenus.component';
import FormRevenu from '@/components/revenus/formRevenu.component';
import ImportCsvModalRevenu from '@/components/revenus/importCsvModalRevenu.component';
import RevenusSummaryCard from '@/components/revenus/RevenusSummaryCard.component';
import { useRevenus, RevenuFilters, RevenuSort } from '@/hooks/useRevenus.hook';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState } from 'react';
import { IRevenu } from '@/types/revenu.type';
import { ChevronLeft, ChevronRight, Plus, Upload, User, Users } from 'lucide-react';

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
        <div className="space-y-8">
          {/* Enhanced Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Revenus
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {selectedVue === 'moi' 
                ? 'Gérez et suivez vos revenus personnels en temps réel'
                : selectedVue === 'partenaire'
                ? `Consultez les revenus de ${user?.partenaireId && typeof user.partenaireId === 'object' ? user.partenaireId.nom : 'votre partenaire'}`
                : 'Vue d\'ensemble des revenus du couple'
              }
            </p>

            {/* Enhanced View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => handleVueChange({ target: { value: 'moi' } } as React.ChangeEvent<HTMLSelectElement>)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedVue === 'moi'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Mes Revenus</span>
                </button>
                {user?.partenaireId && typeof user.partenaireId === 'object' && (
                  <button
                    onClick={() => handleVueChange({ target: { value: 'partenaire' } } as React.ChangeEvent<HTMLSelectElement>)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedVue === 'partenaire'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{user.partenaireId.nom}</span>
                  </button>
                )}
                {user?.partenaireId && (
                  <button
                    onClick={() => handleVueChange({ target: { value: 'couple_complet' } } as React.ChangeEvent<HTMLSelectElement>)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedVue === 'couple_complet'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Couple Complet</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Nouveau Revenu
                </button>
                
                <button
                  onClick={handleOpenImportModalRevenu}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Upload size={16} />
                  Importer CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Vue d'ensemble */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Vue d&apos;ensemble
            </h2>
            <RevenusSummaryCard 
              selectedVue={selectedVue}
              filters={filters}
            />
          </section>

          {/* Section 3: Liste des Revenus */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Liste des Revenus
            </h2>
            
            {isLoading && (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
                  <div className="text-gray-500">Chargement des revenus...</div>
                </div>
              </div>
            )}
            
            {isError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
                Erreur lors du chargement des revenus.
              </div>
            )}

            {!isError && !isLoading && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <TableRevenus
                  revenus={revenus}
                  currentSort={sort}
                  onEdit={handleEdit}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  currentUserId={user?._id}
                />
              </div>
            )}
          </section>

          {/* Section 4: Pagination */}
          {pagination && pagination.total > 0 && (
            <section>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{pagination.total}</span> revenus au total
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page} sur {pagination.pages}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1 || isLoading}
                        className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Page précédente"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === pagination.pages || isLoading}
                        className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Page suivante"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Modals */}
          {showAddForm && (
            <FormRevenu
              existingRevenu={selectedRevenu ?? undefined}
              onClose={() => {
                setShowAddForm(false);
                setSelectedRevenu(null);
              }}
            />
          )}
          {showImportModalRevenu && (
            <ImportCsvModalRevenu onClose={handleCloseImportModalRevenu} />
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}
