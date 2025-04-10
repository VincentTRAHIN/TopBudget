import Layout from "@/components/layout/Layout";
import RequireAuth from "@/components/auth/requireAuth.component";
import TableDepenses from "@/components/expenses/tableDepenses.component";
import FormDepense from "@/components/expenses/formDepenses.component";
import FormCategorie from "@/components/categories/formCategorie.component";

export default function ExpensesPage() {
  return (
    <RequireAuth>
      <Layout>
        <div className="space-y-6">
          <FormCategorie />
          <FormDepense />
          <TableDepenses />
        </div>
      </Layout>
    </RequireAuth>
  );
}
