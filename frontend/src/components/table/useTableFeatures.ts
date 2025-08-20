import { useState, useMemo } from 'react';

export interface UseTableFeaturesProps<T> {
  data: T[];
  defaultSortKey?: keyof T;
  onFilterChange?: (filters: Partial<Record<keyof T, any>>) => void;
  selectValue?: string | number | undefined;
}


export function useTableFeatures<T extends Record<string, any>>({
  data,
  defaultSortKey,
  onFilterChange,
}: UseTableFeaturesProps<T>) {
  interface SortStateProps   { key: keyof T; direction: 'asc' | 'desc' } 
  const [selectValue, setSelectValue] = useState<string | number | undefined>(undefined);
  const [sortState, setSortState] = useState<SortStateProps | null>(
    defaultSortKey ? { key: defaultSortKey, direction: 'asc' } : null
  );
  const [filters, setFilters] = useState<Partial<Record<keyof T, any>>>({});

  // Gestion du changement de filtre
  const handleFilterChange = (key: keyof T, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const handleSort = (key: keyof T) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  // Ajout du filtrage des données
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        const cell = row[key as keyof T];
        // Pour les select (enum), on compare la valeur brute
        if (typeof cell === 'number' || typeof cell === 'string') {
          return String(cell).toLowerCase().includes(String(value).toLowerCase());
        }
        return true;
      })
    );
  }, [data, filters]);

  const sortedData = useMemo(() => {
    if (!sortState) return filteredData;
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortState]);

  return {
    sortState,
    setSortState,
    handleSort,
    sortedData,

  };
}
