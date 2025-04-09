import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 h-full bg-white shadow-lg p-4">
      <nav className="flex flex-col space-y-4">
        <Link href="/dashboard" className="text-gray-700 hover:text-primary font-medium">
          Dashboard
        </Link>
        <Link href="/expenses" className="text-gray-700 hover:text-primary font-medium">
          Mes Dépenses
        </Link>
      </nav>
    </aside>
  );
}
