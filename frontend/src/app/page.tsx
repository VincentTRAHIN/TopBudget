import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-4">
      <h1 className="text-3xl font-bold">Bienvenue sur TopBudget 🚀</h1>
      <div className="flex space-x-4">
        <Link href="/dashboard" className="px-4 py-2 bg-primary text-white rounded-lg">
          Accéder au Dashboard
        </Link>
        <Link href="/auth/login" className="px-4 py-2 bg-primary-dark text-white rounded-lg">
          Connexion
        </Link>
      </div>
    </main>
  );
}
