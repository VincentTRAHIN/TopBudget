'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import CategoriesList from '@/components/categories/CategoriesList.component';
import FormCategorie from '@/components/categories/formCategorie.component';
import { useCategories } from '@/hooks/useCategories.hook';
import { ICategorie } from '@/types/categorie.type';

export default function CategoriesPage() {
  const { categories, isLoading, isError, refreshCategories } = useCategories();
  const [selectedCategorie, setSelectedCategorie] = useState<ICategorie | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState(false);

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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Catégories de dépenses</h1>
          </div>

          {showAddForm && (
            <FormCategorie
              existingCategorie={selectedCategorie ?? undefined}
              onClose={handleFormClose}
            />
          )}

          <CategoriesList
            categories={categories}
            isLoading={isLoading}
            isError={isError}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
          />
        </div>
      </Layout>
    </RequireAuth>
  );
}
