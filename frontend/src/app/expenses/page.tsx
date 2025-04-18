"use client";

import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/requireAuth.component";
import TableDepenses from "@/components/expenses/tableDepenses.component";
import FormDepense from "@/components/expenses/formDepenses.component";
import FormCategorie from "@/components/categories/formCategorie.component";
import { useDepenses } from "@/hooks/useDepenses.hook";
import { useState } from "react";
import { IDepense } from "@/types/depense.type";

export default function ExpensesPage() {
  const { depenses } = useDepenses();
  const [selectedDepense, setSelectedDepense] = useState<IDepense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleEdit = (depense: IDepense) => {
    setSelectedDepense(depense);
    setShowAddForm(true);
  };

  const handleAdd = () => {
    setSelectedDepense(null);
    setShowAddForm(true);
  };

  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <FormCategorie />
          {showAddForm && (
            <FormDepense
              existingDepense={selectedDepense ?? undefined}
              onClose={() => {
                setShowAddForm(false);
                setSelectedDepense(null);
              }}
            />
          )}
          <TableDepenses
            depenses={depenses}
            onEdit={handleEdit}
            onAdd={handleAdd}
          />
        </div>
      </Layout>
    </RequireAuth>
  );
}
