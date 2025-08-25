import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { KeyedMutator } from 'swr';
import debug from 'debug';
import { DataType, DisplayType, TableColumn, TableAction } from '../table/table.types';
import { IDepense } from '@/types/depense.type';
import { depensesEndpoint } from '@/services/api.service';
import fetcher from '@/utils/fetcher.utils';
import { DepensesResponse } from '@/hooks/useDepenses.hook';


interface UseColumnsProps {
  currentUserId?: string;
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: any) => void;
  refreshDepenses: KeyedMutator<DepensesResponse>
}

export function useColumns({
  currentUserId,
  onEdit,
  refreshDepenses,
}: UseColumnsProps) {
  const log = debug('app:frontend:useColumnTableDepenses');

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Confirmer la suppression ?')) return;
    try {
      log(`Tentative de suppression de la dépense ID: %s`, id);
      await fetcher(`${depensesEndpoint}/${id}`, {
        method: 'DELETE',
      });
      toast.success('Dépense supprimée avec succès !');
      log(`Dépense ID: %s supprimée avec succès. Rafraîchissement des dépenses.`, id);
      refreshDepenses();
    } catch (error) {
      log(`Erreur lors de la suppression de la dépense ID: %s, Erreur: %O`, id, error);
      toast.error('Erreur lors de la suppression de la dépense');
    }
  }, [refreshDepenses]);

  const columns: TableColumn<IDepense>[] = [
    {
      accessor: 'date',
      dataType: DataType.STRING,
      displayType: DisplayType.DATE,
      enableSort: true,
    },
    {
      accessor: 'description',
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      accessor: 'commentaire',
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      header: 'Catégorie',
      accessor: 'categorie',
      dataType: DataType.STRING,
      displayType: DisplayType.ENUM,
      getValue: (row) => row.categorie.nom || 'N/A',
    },
    {
      header: 'Payé par',
      accessor: 'utilisateur',
      dataType: DataType.STRING,
      getValue: (row) => row.utilisateur.nom,
    },
    {
      header: 'Charge Fixe',
      accessor: 'estChargeFixe',
      className: 'text-center',
      dataType: DataType.BOOLEAN,
      displayType: DisplayType.ICON,
      getIcon: (row) => (
        row.recurrence
          ? { name: 'pin', size: 16, color: 'blue' }
          : undefined
      ),
    },
    {
      header: 'Compte',
      accessor: 'typeCompte',
      dataType: DataType.STRING,
    },
    {
      header: 'Type de dépense',
      accessor: 'typeDepense',
      dataType: DataType.STRING,
    },
    {
      header: 'Montant (€)',
      accessor: 'montant',
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
    },
  ];

  // Actions
  const actions: TableAction<IDepense>[] = [
    {
      header: 'Modifier',
      accessor: (row) => row,
      action: (row) => onEdit(row),
      icon: "edit",
      disabled: (row) => currentUserId !== (typeof row.utilisateur === 'object' ? row.utilisateur._id : row.utilisateur),
    },
    {
      header: 'Supprimer',
      accessor: (row) => row,
      action: (row) => handleDelete(row._id),
      icon: "trash-2",
      color: 'red',
      disabled: (row) => currentUserId !== (typeof row.utilisateur === 'object' ? row.utilisateur._id : row.utilisateur),
    },
  ];

  return {
    columns,
    actions,
  };
}
