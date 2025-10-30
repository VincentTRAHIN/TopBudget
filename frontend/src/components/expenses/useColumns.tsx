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

  const handleToggleChargeFixe = useCallback(async (depenseId: string, currentValue: boolean) => {
    try {
      log(`Toggle charge fixe pour dépense ID: %s (valeur actuelle: %s)`, depenseId, currentValue);
      
      // Appel API avec mise à jour optimiste
      await refreshDepenses(
        async (currentData) => {
          // Appel API
          await fetcher(`${depensesEndpoint}/${depenseId}/toggle-charge-fixe`, {
            method: 'PATCH',
          });
          
          // Retourner les données mises à jour manuellement (pas de refetch)
          if (!currentData?.depenses) return currentData;
          
          return {
            ...currentData,
            depenses: currentData.depenses.map(depense =>
              depense._id === depenseId
                ? { ...depense, estChargeFixe: !currentValue }
                : depense
            )
          };
        },
        {
          // Mise à jour optimiste immédiate
          optimisticData: (currentData) => {
            if (!currentData?.depenses) return currentData;
            
            return {
              ...currentData,
              depenses: currentData.depenses.map(depense =>
                depense._id === depenseId
                  ? { ...depense, estChargeFixe: !currentValue }
                  : depense
              )
            };
          },
          // Ne PAS revalider automatiquement (on retourne les données directement)
          revalidate: false,
          // Revenir aux données précédentes en cas d'erreur
          rollbackOnError: true,
        }
      );

      // Toast de succès selon l'action
      toast.success(
        !currentValue 
          ? '🔒 Dépense marquée comme charge fixe' 
          : '🔓 Dépense retirée des charges fixes'
      );

      log(`Charge fixe modifiée pour dépense ID: %s`, depenseId);
    } catch (error) {
      log(`Erreur toggle charge fixe pour dépense ID: %s, Erreur: %O`, depenseId, error);
      toast.error('❌ Erreur lors de la mise à jour');
    }
  }, [refreshDepenses]);

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
      getSortValue: (row) => row.categorie.nom || 'N/A',
      enableSort: true,
    },
    {
      header: 'Payé par',
      accessor: 'utilisateur',
      dataType: DataType.STRING,
      getValue: (row) => row.utilisateur.nom,
      getSortValue: (row) => row.utilisateur.nom,
      enableSort: true,
    },
    {
      header: 'Charge Fixe/Variable',
      accessor: 'estChargeFixe',
      className: 'text-center',
      dataType: DataType.BOOLEAN,
      getValue: (row) => {
        const isDisabled = currentUserId !== (typeof row.utilisateur === 'object' ? row.utilisateur._id : row.utilisateur);
        const isFixed = row.estChargeFixe;
        
        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDisabled) {
                console.log('🟢 Appel de handleToggleChargeFixe...');
                handleToggleChargeFixe(row._id, isFixed || false);
              } else {
                console.log('🔴 Bouton disabled, action bloquée');
              }
            }}
            disabled={isDisabled}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full
              transition-all duration-200 ease-in-out
              ${isDisabled 
                ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                : 'cursor-pointer hover:shadow-md active:scale-95'
              }
              ${isFixed 
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
            aria-label={isFixed ? 'Retirer des charges fixes' : 'Marquer comme charge fixe'}
            title={
              isDisabled 
                ? 'Vous ne pouvez modifier que vos propres dépenses' 
                : isFixed 
                  ? 'Cliquer pour retirer des charges fixes' 
                  : 'Cliquer pour marquer comme charge fixe'
            }
          >
            <span className="text-base" role="img" aria-hidden="true">
              {isFixed ? '🔒' : '🔓'}
            </span>
            <span className="text-xs font-medium">
              {isFixed ? 'Fixe' : 'Variable'}
            </span>
          </button>
        ) as any;
      },
      getSortValue: (row) => row.estChargeFixe ? 1 : 0,
      enableSort: true,
    },
    {
      header: 'Compte',
      accessor: 'typeCompte',
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      header: 'Type de dépense',
      accessor: 'typeDepense',
      dataType: DataType.STRING,
      enableSort: true,
    },
    {
      header: 'Montant (€)',
      accessor: 'montant',
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
      enableSort: true,
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
