import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyedMutator } from 'swr';
import debug from 'debug';
import { DataType, TableColumn, TableAction } from '../table/table.types';
import fetcher from '@/utils/fetcher.utils';
import { ICategorieRevenu } from '@/types/categorieRevenu.type';
import { ICategorie } from '@/types/categorie.type';


interface UseColumnsProps<T> {
  onEdit: (editValue: T) => void;
  onDelete: () => void;
  refresh: KeyedMutator<T[]>;
  endpoint: string;
}

export function useColumns<T>({
  onEdit,
  onDelete,
  refresh,
  endpoint
}: UseColumnsProps<ICategorie | ICategorieRevenu>) {
  const log = debug('app:frontend:useColumnTableCategorie');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
  

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(id);
    try {
      await fetcher(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Catégorie supprimée avec succès');
      refresh();
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
  }, [refresh, onDelete]);

  const columns: TableColumn<ICategorie | ICategorieRevenu>[] = [
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
  const actions: TableAction<ICategorie | ICategorieRevenu>[] = [
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
