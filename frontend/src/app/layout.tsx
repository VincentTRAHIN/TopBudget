import "@/styles/globals.css";

import ClientLayout from "@/components/layout/clientLayout.component";

export const metadata = {
  title: "TopBudget",
  description: "Application de gestion budgétaire personnelle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
