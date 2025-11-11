import { DynamicIcon } from "lucide-react/dynamic";

export interface PaginationProps {
  total: number;
  page: number;
  pages: number;
}

interface PaginationModuleProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: PaginationProps;
  isLoading: boolean;
}

export function Pagination({ currentPage, setCurrentPage, pagination, isLoading }: PaginationModuleProps) {
  const handleNextPage = () => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  return (
    <section>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{pagination.total}</span> revenus au total
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Page {pagination.page} sur {pagination.pages}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || isLoading}
                className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Page précédente">
                <DynamicIcon name="chevron-left" className="h-5 w-5" />
              </button>

              <button
                onClick={handleNextPage}
                disabled={currentPage === pagination.pages || isLoading}
                className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Page suivante">
                <DynamicIcon name="chevron-right" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
