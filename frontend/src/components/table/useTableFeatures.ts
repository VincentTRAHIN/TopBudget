import { useState, useMemo } from 'react';
import { TableColumn } from './table.types';

export interface UseTableFeaturesProps<T> {
  data: T[];
  defaultSortKey?: keyof T;
  columns?: TableColumn<T>[];
}


export function useTableFeatures<T extends Record<string, any>>({
  data,
  defaultSortKey,
  columns = [],
}: UseTableFeaturesProps<T>) {
  interface SortStateProps   { key: keyof T; direction: 'asc' | 'desc' } 
  const [sortState, setSortState] = useState<SortStateProps | null>(
    defaultSortKey ? { key: defaultSortKey, direction: 'desc' } : null
  );

  const handleSort = (key: keyof T) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };


  const sortedData = useMemo(() => {
    if (!sortState) return data;
    
    // Trouver la colonne correspondante pour utiliser getSortValue ou getValue
    const column = columns.find(col => col.accessor === sortState.key);
    
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Utiliser getSortValue si disponible, sinon getValue, sinon la valeur brute
      if (column?.getSortValue) {
        aValue = column.getSortValue(a);
        bValue = column.getSortValue(b);
      } else if (column?.getValue) {
        aValue = column.getValue(a);
        bValue = column.getValue(b);
      } else {
        aValue = a[sortState.key];
        bValue = b[sortState.key];
      }
      
      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortState.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortState, columns]);

  return {
    sortState,
    setSortState,
    handleSort,
    sortedData,

  };
}
