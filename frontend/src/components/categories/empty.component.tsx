import { ICategorie } from "@/types/categorie.type";

interface EmptyComponentProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  onAdd: () => void;
  categories: ICategorie[];
}


export function EmptyComponent({ search, onAdd, categories, setSearch }: EmptyComponentProps) {
  return (
    <tr>
      <td colSpan={3} className="px-4 py-8 text-center">
        {search ? (
          <div className="text-gray-500">
            <p className="mb-2">
              Aucune catégorie trouvée pour &quot;{search}&quot;
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              Effacer la recherche
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-gray-500">
            <p className="mb-4">
              Aucune catégorie de dépense trouvée.
            </p>
            <p className="text-sm mb-4">
              Commencez par créer votre première catégorie pour
              organiser vos dépenses.
            </p>
            <button
              onClick={onAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Créer ma première catégorie
            </button>
          </div>
        ) : (
          <p className="text-gray-500">
            Aucune catégorie ne correspond à votre recherche.
          </p>
        )}
      </td>
    </tr>
  )
}