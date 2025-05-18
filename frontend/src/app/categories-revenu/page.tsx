'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import RequireAuth from '@/components/auth/requireAuth.component';
import CategoriesRevenuList from '@/components/categories-revenu/CategoriesRevenuList.component';
import FormCategorieRevenu from '@/components/categories-revenu/FormCategorieRevenu.component';
import { useCategoriesRevenu } from '@/hooks/useCategoriesRevenu.hook';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';

export default function CategoriesRevenuPage() {
  const { categoriesRevenu, refreshCategoriesRevenu } = useCategoriesRevenu();
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
            <FormCategorieRevenu
              existingCategorieRevenu={selectedCategorieRevenu ?? undefined}
              onClose={handleCloseForm}
            />
          )}

          <CategoriesRevenuList
            categoriesRevenu={categoriesRevenu}
            onEdit={handleEdit}
            onDelete={handleSuccess}
            onAdd={handleAdd}
          />
        </div>
      </Layout>
    </RequireAuth>
  );
}
