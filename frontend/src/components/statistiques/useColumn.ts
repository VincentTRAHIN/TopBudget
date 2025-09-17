import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { KeyedMutator } from 'swr';
import debug from 'debug';
import { DataType, DisplayType, TableColumn, TableAction } from '../table/table.types';
import fetcher from '@/utils/fetcher.utils';
import { DepensesResponse } from '@/hooks/useDepenses.hook';
import { CoupleFixedCharge } from '@/hooks/useCoupleFixedCharges.hook';

export function useColumns() {
  const log = debug('app:frontend:useColumnTableCoupleChargesFixes');

  const columns: TableColumn<CoupleFixedCharge>[] = [
    {
      accessor: 'description',
      header: 'Description',
      dataType: DataType.STRING,
    },
    {
      accessor: "montant",
      header: 'Montant',
      dataType: DataType.NUMBER,
      displayType: DisplayType.CURRENCY,
    },
    {
      accessor: 'categorie',
      header: 'Catégorie',
      dataType: DataType.STRING,
      // Custom cell rendering to handle both string and object types
      getValue: ({categorie}) => (typeof categorie === 'string' ? categorie : categorie?.nom || 'N/A'),
    },
    {
      accessor: 'payePar',
      header: 'Payé par',
      dataType: DataType.STRING,
    },
    
  ];

  return {
    columns,
  };
}
