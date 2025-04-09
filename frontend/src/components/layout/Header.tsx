import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <Menu className="w-6 h-6 cursor-pointer" />
      <h1 className="text-xl font-bold">TopBudget</h1>
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
        {/* Future dropdown user */}
      </div>
    </header>
  );
}
