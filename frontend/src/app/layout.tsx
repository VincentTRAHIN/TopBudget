import "@/styles/globals.css";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";


export const metadata = {
  title: "TopBudget",
  description: "Application de gestion budgétaire personnelle",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Toaster
          position="top-center"
        />
        {children}
      </body>
    </html>
  );
}
