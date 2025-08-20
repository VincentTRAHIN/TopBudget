'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import CategoriesList from '@/components/categories/CategoriesList.component';
import FormCategorie from '@/components/categories/formCategorie.component';

export default function CategoriesRevenuPage() {
  const { categoriesRevenu, isLoading, isError, refreshCategoriesRevenu } = useCategoriesRevenu();
  const [selectedCategorieRevenu, setSelectedCategorieRevenu] =
    useState<ICategorieRevenu | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (categorie: ICategorieRevenu) => {
    setSelectedCategorieRevenu(categorie);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setSelectedCategorieRevenu(null);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setSelectedCategorieRevenu(null);
    setShowAddForm(false);
    refreshCategoriesRevenu();
  };

  const handleSuccess = () => {
    refreshCategoriesRevenu();
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Catégories de Revenus</h1>
          </div>

          {showAddForm && (
            <FormCategorie
              existingCategorie={selectedCategorieRevenu ?? undefined}
              onClose={handleCloseForm}
            />
          )}

          <CategoriesList
            categories={categoriesRevenu}
            isLoading={isLoading}
            isError={isError}
            onEdit={handleEdit}
            onDelete={handleSuccess}
            onAdd={handleAdd}
          />
        </div>
      </Layout>
    </RequireAuth>
  );
}
