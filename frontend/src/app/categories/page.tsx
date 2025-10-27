'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import CategoriesList from '@/components/categories/CategoriesList.component';
import FormCategorie from '@/components/categories/formCategorie.component';
import DeleteAllCategoriesButton from '@/components/categories/DeleteAllCategoriesButton.component';
import { useCategories } from '@/hooks/useCategories.hook';
import { ICategorie } from '@/types/categorie.type';
import { categoriesEndpoint } from '@/services/api.service';
import { Plus, Settings, Search } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, isLoading, isError, refreshCategories } = useCategories();
  const [selectedCategorie, setSelectedCategorie] = useState<ICategorie | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  const handleEdit = (categorie: ICategorie) => {
    setSelectedCategorie(categorie);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setSelectedCategorie(null);
    setShowAddForm(true);
  };

  const handleDelete = () => {
    refreshCategories();
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setSelectedCategorie(null);
    refreshCategories();
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Catégories
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Gérez et organisez vos catégories de dépenses
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-indigo-600 shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>Catégories</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher une catégorie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <button
                  onClick={handleAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle Catégorie</span>
                </button>

                <DeleteAllCategoriesButton onSuccess={refreshCategories} />
              </div>
            </div>
          </div>

          {showAddForm && (
            <FormCategorie
              existingCategorie={selectedCategorie ?? undefined}
              onClose={handleFormClose}
              endpoint={categoriesEndpoint}
              refresh={refreshCategories}
            />
          )}

          <CategoriesList
            categories={categories}
            isLoading={isLoading}
            isError={isError}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            refresh={refreshCategories}
            endpoint={categoriesEndpoint}
            search={search}
          />
        </div>
      </Layout>
    </RequireAuth>
  );
}
