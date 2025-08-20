import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyedMutator } from 'swr';
import debug from 'debug';
import { DataType, DisplayType, TableColumn, TableAction } from '../table/table.types';
import { ICategorie } from '@/types/categorie.type';
import { categoriesEndpoint, depensesEndpoint } from '@/services/api.service';
import fetcher from '@/utils/fetcher.utils';
import { DepensesResponse } from '@/hooks/useDepenses.hook';


interface UseColumnsProps {
  categories: ICategorie[];
  currentUserId?: string;
  onEdit: (depense: ICategorie) => void;
  onDelete: () => void;
  refreshCategories: KeyedMutator<ICategorie[]>;
}

export function useColumns({
  categories,
  onEdit,
  onDelete,
  refreshCategories,
}: UseColumnsProps) {
  const log = debug('app:frontend:useColumnTableCategorie');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
  

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(id);
    try {
      await fetcher(`${categoriesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Catégorie supprimée avec succès');
      refreshCategories();
      onDelete();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      if (errorMessage.includes('utilisée')) {
        toast.error('Cette catégorie est utilisée et ne peut être supprimée.');
      } else {
        toast.error('Erreur lors de la suppression de la catégorie');
      }
    } finally {
      setIsDeleting(null);
    }
  }, [refreshCategories, onDelete]);

  const columns: TableColumn<ICategorie>[] = [
    {
      accessor: 'nom',
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      accessor: 'description',
      dataType: DataType.STRING,
      enableSort: true,
    },

  ];

  // Actions
  const actions: TableAction<ICategorie>[] = [
    {
      header: 'Modifier',
      accessor: (row) => row,
      action: (row) => onEdit(row),
      icon: "edit",
      disabled: (row) => isDeleting === row._id,
    },
    {
      header: 'Supprimer',
      accessor: (row) => row,
      action: (row) => handleDelete(row._id),
      icon: "trash-2",
      color: 'red',
      disabled: (row) => isDeleting === row._id,
    },
  ];

  return {
    columns,
    actions,
    isDeleting
  };
}
