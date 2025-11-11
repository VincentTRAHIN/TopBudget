"use client";

import RequireAuth from "@/components/auth/requireAuth.component";
import FormCategorie from "@/components/categories/formCategorie.component";
import Layout from "@/components/layout/Layout";
import { DeleteAllRevenusButton } from "@/components/revenus/DeleteAllRevenusButton.component";
import FormRevenu from "@/components/revenus/formRevenu.component";
import ImportCsvModalRevenu from "@/components/revenus/importCsvModalRevenu.component";
import TableRevenus from "@/components/revenus/tableRevenus.component";
import { ChoiceView } from "@/components/shared/HandleVue";
import { Pagination } from "@/components/shared/Pagination";
import { useAuth } from "@/hooks/useAuth.hook";
import { useCategoriesRevenu } from "@/hooks/useCategoriesRevenu.hook";
import { RevenuFilters, RevenuSort, useRevenus } from "@/hooks/useRevenus.hook";
import { IRevenu } from "@/types/revenu.type";
import { Plus, Settings, Upload } from "lucide-react";
import { useCallback, useState } from "react";

const ITEMS_PER_PAGE = 25;

export default function RevenusPage() {
  const { user } = useAuth();
  const { refreshCategoriesRevenu } = useCategoriesRevenu();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRevenu, setSelectedRevenu] = useState<IRevenu | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategorieForm, setShowAddCategorieForm] = useState(false);
  const [filters, setFilters] = useState<RevenuFilters>({});
  const [sort, setSort] = useState<RevenuSort>({ sortBy: "date", order: "desc" });
  const [selectedVue, setSelectedVue] = useState<"moi" | "partenaire" | "couple_complet">("moi");
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

  const handleAdd = useCallback(() => {
    setSelectedRevenu(null);
    setShowAddForm(true);
    setShowAddCategorieForm(false);
    setShowImportModalRevenu(false);
  }, []);

  const handleAddCategorie = useCallback(() => {
    setShowAddCategorieForm(true);
    setShowAddForm(false);
    setShowImportModalRevenu(false);
  }, []);

  const handleCloseAddCategorieForm = useCallback(() => {
    setShowAddCategorieForm(false);
  }, []);

  const handleOpenImportModalRevenu = useCallback(() => {
    setShowImportModalRevenu(true);
    setShowAddForm(false);
    setShowAddCategorieForm(false);
  }, []);

  const handleCloseImportModalRevenu = () => {
    setShowImportModalRevenu(false);
  };

  const handleFilterOrSortChange = (changedFilters?: Partial<RevenuFilters>, changedSort?: RevenuSort) => {
    if (changedFilters) {
      setFilters((prevFilters) => ({ ...prevFilters, ...changedFilters }));
    }
    if (changedSort) {
      setSort(changedSort);
    }
    setCurrentPage(1);
  };

  const handleSortChange = useCallback((sortBy: string, order: "asc" | "desc") => {
    handleFilterOrSortChange(undefined, { sortBy, order });
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<RevenuFilters>) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleVueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVue(e.target.value as "moi" | "partenaire" | "couple_complet");
    setCurrentPage(1);
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          {/* Enhanced Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Revenus</h1>
            <p className="text-sm text-gray-600 mb-6">
              {selectedVue === "moi"
                ? "Gérez et suivez vos revenus personnels en temps réel"
                : selectedVue === "partenaire"
                  ? `Consultez les revenus de ${user?.partenaireId && typeof user.partenaireId === "object" ? user.partenaireId.nom : "votre partenaire"}`
                  : "Vue d'ensemble des revenus du couple"}
            </p>

            {/* Enhanced View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <ChoiceView
                handleVueMoi={() =>
                  handleVueChange({ target: { value: "moi" } } as React.ChangeEvent<HTMLSelectElement>)
                }
                handleVuePartenaire={() =>
                  handleVueChange({ target: { value: "partenaire" } } as React.ChangeEvent<HTMLSelectElement>)
                }
                handleVueCouple={() =>
                  handleVueChange({ target: { value: "couple_complet" } } as React.ChangeEvent<HTMLSelectElement>)
                }
                selectedVue={selectedVue}
                hasPartner={user?.partenaireId && typeof user.partenaireId === "object"}
                partnerName={
                  user?.partenaireId && typeof user.partenaireId === "object"
                    ? (user.partenaireId as { nom: string; _id: string }).nom
                    : ""
                }
                user={user}
              />
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                  <Plus size={16} />
                  Nouveau Revenu
                </button>

                <button
                  onClick={handleOpenImportModalRevenu}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                  <Upload size={16} />
                  Importer CSV
                </button>

                <button
                  onClick={handleAddCategorie}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                  <Settings size={16} />
                  Catégories
                </button>
                <DeleteAllRevenusButton />
              </div>
            </div>
          </div>

          {/* Section : Liste des Revenus */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Liste des Revenus</h2>

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
                  onEdit={handleEdit}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  currentSortKey={sort.sortBy}
                  currentSortOrder={sort.order}
                  currentUserId={user?._id}
                />
              </div>
            )}
          </section>

          {/* Section 4: Pagination */}
          {pagination && pagination.total > 0 && (
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pagination={pagination}
              isLoading={isLoading}
            />
          )}

          {/* Modals */}
          {showAddCategorieForm && (
            <FormCategorie
              onClose={handleCloseAddCategorieForm}
              endpoint={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/categories-revenu`}
              refresh={refreshCategoriesRevenu}
            />
          )}
          {showAddForm && (
            <FormRevenu
              existingRevenu={selectedRevenu ?? undefined}
              onClose={() => {
                setShowAddForm(false);
                setSelectedRevenu(null);
              }}
            />
          )}
          {showImportModalRevenu && <ImportCsvModalRevenu onClose={handleCloseImportModalRevenu} />}
        </div>
      </Layout>
    </RequireAuth>
  );
}
