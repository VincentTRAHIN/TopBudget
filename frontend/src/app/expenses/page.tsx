"use client";

import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/requireAuth.component";
import TableDepenses from "@/components/expenses/tableDepenses.component";
import FormDepense from "@/components/expenses/formDepenses.component";
import FormCategorie from "@/components/categories/formCategorie.component";
import { useDepenses } from "@/hooks/useDepenses.hook";
import { useState } from "react";
import { IDepense } from "@/types/depense.type";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 25;

export default function ExpensesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepense, setSelectedDepense] = useState<IDepense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategorieForm, setShowAddCategorieForm] = useState(false);
  const { depenses, pagination, isLoading, refreshDepenses, isError } = useDepenses(currentPage, ITEMS_PER_PAGE);


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

  const handleFilterChange = (filters: { categorie?: string; dateDebut?: string; dateFin?: string; typeCompte?: string; sortBy?: string; order?: string }) => {
    console.log(filters);
    // TODO: Quand les filtres changent, il faudra probablement:
    // 1. Réinitialiser currentPage à 1 (setCurrentPage(1))
    // 2. Modifier le hook useDepenses pour accepter aussi les filtres et les ajouter à l'URL
    // 3. Appeler refreshDepenses ou laisser SWR refetcher car l'URL (la clé) aura changé
    setCurrentPage(1);
    refreshDepenses();

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
                refreshDepenses();
              }}
            />
          )}
          {isLoading && <div className="text-center p-4">Chargement des dépenses...</div>}
          {isError && <div className="text-center p-4 text-red-600">Erreur lors du chargement des dépenses.</div>}
          {!isError && (
            <>
          <TableDepenses
            depenses={depenses}
            onEdit={handleEdit}
            onAdd={handleAdd}
            onAddCategorie={handleAddCategorie}
            onFilterChange={handleFilterChange}
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
