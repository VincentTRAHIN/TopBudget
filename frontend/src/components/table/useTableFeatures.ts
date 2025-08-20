import { useState, useMemo } from 'react';

export interface UseTableFeaturesProps<T> {
  data: T[];
  defaultSortKey?: keyof T;
}


export function useTableFeatures<T extends Record<string, any>>({
  data,
  defaultSortKey,
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
    return [...data].sort((a, b) => {
      const aValue = a[sortState.key];
      const bValue = b[sortState.key];
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
  }, [data, sortState]);

  return {
    sortState,
    setSortState,
    handleSort,
    sortedData,

  };
}
