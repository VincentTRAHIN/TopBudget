'use client';

import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import TableDepenses from '@/components/expenses/tableDepenses.component';
import FormDepense from '@/components/expenses/formDepenses.component';
import FormCategorie from '@/components/categories/formCategorie.component';
import ImportCsvModal from '@/components/expenses/importCsvModal.component';
import ExpensesSummaryCard from '@/components/expenses/ExpensesSummaryCard.component';
import {
  useDepenses,
  DepenseFilters,
  DepenseSort,
} from '@/hooks/useDepenses.hook';
import { useCategories } from '@/hooks/useCategories.hook';
import { useAuth } from '@/hooks/useAuth.hook';
import { useState, useCallback, useMemo } from 'react';
import { IDepense } from '@/types/depense.type';
import { ChevronLeft, ChevronRight, Plus, Upload, Settings, User, Users } from 'lucide-react';

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

  const handleEdit = useCallback((depense: IDepense) => {
    setSelectedDepense(depense);
    setShowAddForm(true);
    setShowImportModal(false);
    setShowAddCategorieForm(false);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedDepense(null);
    setShowAddForm(true);
    setShowImportModal(false);
    setShowAddCategorieForm(false);
  }, []);

  const handleAddCategorie = useCallback(() => {
    setShowAddCategorieForm(true);
    setShowAddForm(false);
    setShowImportModal(false);
  }, []);

  const handleOpenImportModal = useCallback(() => {
    setShowImportModal(true);
    setShowAddForm(false);
    setShowAddCategorieForm(false);
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setShowImportModal(false);
  }, []);

  const handleNextPage = useCallback(() => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  }, [pagination, currentPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleFilterOrSortChange = useCallback((
    changedFilters?: Partial<DepenseFilters>,
    changedSort?: DepenseSort,
  ) => {
    if (changedFilters) {
      setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
    }
    if (changedSort) {
      setSort(changedSort);
    }
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((newSort: DepenseSort) => {
    handleFilterOrSortChange(undefined, newSort);
  }, [handleFilterOrSortChange]);

  const handleFilterChange = useCallback((newFilters: Partial<DepenseFilters>) => {
    handleFilterOrSortChange(newFilters, undefined);
  }, [handleFilterOrSortChange]);

  const handleVueChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVue(e.target.value as 'moi' | 'partenaire' | 'couple_complet');
    setCurrentPage(1);
  }, []);

  const handleVueMoi = useCallback(() => {
    handleVueChange({ target: { value: 'moi' } } as React.ChangeEvent<HTMLSelectElement>);
  }, [handleVueChange]);

  const handleVuePartenaire = useCallback(() => {
    handleVueChange({ target: { value: 'partenaire' } } as React.ChangeEvent<HTMLSelectElement>);
  }, [handleVueChange]);

  const handleVueCouple = useCallback(() => {
    handleVueChange({ target: { value: 'couple_complet' } } as React.ChangeEvent<HTMLSelectElement>);
  }, [handleVueChange]);

  const handleCloseAddCategorieForm = useCallback(() => {
    setShowAddCategorieForm(false);
  }, []);

  const handleCloseAddForm = useCallback(() => {
    setShowAddForm(false);
    setSelectedDepense(null);
  }, []);

  const pageDescription = useMemo(() => {
    if (selectedVue === 'moi') {
      return 'Gérez et suivez vos dépenses personnelles en temps réel';
    } else if (selectedVue === 'partenaire') {
      return `Consultez les dépenses de ${user?.partenaireId && typeof user.partenaireId === 'object' ? user.partenaireId.nom : 'votre partenaire'}`;
    } else {
      return 'Vue d\'ensemble des dépenses du couple';
    }
  }, [selectedVue, user?.partenaireId]);

  const partenaireId = useMemo(() => {
    return user?.partenaireId && typeof user.partenaireId === 'object'
      ? user.partenaireId._id
      : undefined;
  }, [user?.partenaireId]);

  const hasPartner = useMemo(() => {
    return user?.partenaireId && typeof user.partenaireId === 'object';
  }, [user?.partenaireId]);

  const partnerName = useMemo(() => {
    return user?.partenaireId && typeof user.partenaireId === 'object'
      ? (user.partenaireId as { nom: string; _id: string }).nom
      : '';
  }, [user?.partenaireId]);

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Dépenses
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              {pageDescription}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  onClick={handleVueMoi}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedVue === 'moi'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Mes Dépenses</span>
                </button>
                {hasPartner && (
                  <button
                    onClick={handleVuePartenaire}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedVue === 'partenaire'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>{partnerName}</span>
                  </button>
                )}
                {user?.partenaireId && (
                  <button
                    onClick={handleVueCouple}
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

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Nouvelle Dépense
                </button>
                
                <button
                  onClick={handleOpenImportModal}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Upload size={16} />
                  Importer CSV
                </button>
                
                <button
                  onClick={handleAddCategorie}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Settings size={16} />
                  Catégories
                </button>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Vue d&apos;ensemble
            </h2>
            <ExpensesSummaryCard 
              selectedVue={selectedVue}
              filters={filters}
            />
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Liste des Dépenses
            </h2>
            
            {isLoading && (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
                  <div className="text-gray-500">Chargement des dépenses...</div>
                </div>
              </div>
            )}
            
            {isError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center text-red-600">
                Erreur lors du chargement des dépenses.
              </div>
            )}

            {!isError && !isLoading && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <TableDepenses
                  depenses={depenses}
                  categories={categories}
                  currentSort={sort}
                  onEdit={handleEdit}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  currentUserId={user?._id}
                  partenaireId={partenaireId}
                />
              </div>
            )}
          </section>

          {pagination && pagination.total > 0 && (
            <section>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">{pagination.total}</span> dépenses au total
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

          {showAddCategorieForm && (
            <FormCategorie
              onClose={handleCloseAddCategorieForm}
            />
          )}
          {showAddForm && (
            <FormDepense
              existingDepense={selectedDepense ?? undefined}
              onClose={handleCloseAddForm}
            />
          )}
          {showImportModal && (
            <ImportCsvModal onClose={handleCloseImportModal} />
          )}
        </div>
      </Layout>
    </RequireAuth>
  );
}
