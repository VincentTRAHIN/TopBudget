import { useCallback } from 'react';
import { DataType, DisplayType, TableColumn, TableAction } from '../table/table.types';
import { IDepense } from '@/types/depense.type';
import { ICategorie } from '@/types/categorie.type';
import { depensesEndpoint } from '@/services/api.service';
import fetcher from '@/utils/fetcher.utils';
import toast from 'react-hot-toast';
import { DepensesResponse } from '@/hooks/useDepenses.hook';
import { KeyedMutator } from 'swr';
import debug from 'debug';
import { DataEnum } from '../table';

interface UseColumnsProps {
  categories: ICategorie[];
  currentUserId?: string;
  onEdit: (depense: IDepense) => void;
  onFilterChange: (filters: any) => void;
  refreshDepenses: KeyedMutator<DepensesResponse>
}

export function useColumns({
  categories,
  currentUserId,
  onEdit,
  onFilterChange,
  refreshDepenses,
}: UseColumnsProps) {
  const log = debug('app:frontend:useColumnTableDepenses');
  
  // Colonnes
  // Suppression des états locaux pour les filtres, tout est contrôlé par filters du parent
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target;
    onFilterChange({ search: value });
  }, [onFilterChange]);

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


  const handleDateDebutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target;
    onFilterChange({ dateDebut: value });
  }, [onFilterChange]);

  const handleDateFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = e.target;
    onFilterChange({ dateFin: value });
  }, [onFilterChange]);

  const columns: TableColumn<IDepense>[] = [
    {
      accessor: 'date',
      dataType: DataType.STRING,
      displayType: DisplayType.DATE,
      enableSort: true,
      customFilter: () => (
        [
          {
            label: "Du",
            type: DisplayType.DATE,
            onFilterChange: handleDateDebutChange,
          },
          {
            label: "Au",
            type: DisplayType.DATE,
            onFilterChange: handleDateFinChange,
          }
        ]
      )
    },
    {
      accessor: 'description',
      dataType: DataType.STRING,
      enableSort: true,
      enableFilter: true,
      onFilterChange: handleSearchChange,
    },
    {
      accessor: 'commentaire',
      dataType: DataType.STRING,
      enableSort: true,
      enableFilter: true,
      onFilterChange: handleSearchChange,
    },
    {
      header: 'Catégorie',
      accessor: 'categorie',
      dataType: DataType.STRING,
      displayType: DisplayType.ENUM,
      enableFilter: true,
      getValue: (row) => row.categorie.nom || 'N/A',
      filterOption: () => new DataEnum<ICategorie>({
        data: categories,
        getId: (row) => row._id,
        getLabel: (row) => row.nom,
        action: (value) => {
          onFilterChange({ categorie: value });
        },
      }),
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
      filterOption: () => new DataEnum<{ _id: string; nom: string }>({
        data: [
          { _id: 'Perso', nom: 'Perso' },
          { _id: 'Conjoint', nom: 'Conjoint' },
        ],
        getId: (item) => item._id,
        getLabel: (item) => item.nom,
        action: (value) => {
          onFilterChange({ typeCompte: value });
        },
      }),
    },
    {
      header: 'Type de dépense',
      accessor: 'typeDepense',
      dataType: DataType.STRING,
      filterOption: () => new DataEnum<{ _id: string; nom: string }>({
        data: [
          { _id: 'Perso', nom: 'Perso' },
          { _id: 'Commune', nom: 'Commune' },
        ],
        getId: (row) => row._id,
        getLabel: (row) => row.nom,
        action: (value) => {
          onFilterChange({ typeDepense: value });
        },
      }),
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
