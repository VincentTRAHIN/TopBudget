import { useCallback, useEffect, useState } from "react";

interface FilterState {
  [key: string]: string | number | Date | boolean | null;
}

interface UseTableFiltersProps {
  storageKey: string;
  initialFilters?: FilterState;
}

interface UseTableFiltersReturn {
  filters: FilterState;
  setFilter: (key: string, value: string | number | Date | boolean | null) => void;
  resetFilters: () => void;
  clearFilter: (key: string) => void;
  hasActiveFilters: boolean;
}

/**
 * Hook personnalisé pour gérer la persistance des filtres de table
 * Sauvegarde automatiquement les filtres dans localStorage et les restaure au chargement
 */
export function useTableFilters({ storageKey, initialFilters = {} }: UseTableFiltersProps): UseTableFiltersReturn {
  const storageKeyWithPrefix = `topbudget-table-filters-${storageKey}`;

  const [filters, setFilters] = useState<FilterState>(() => {
    // Éviter les erreurs côté serveur (SSR)
    if (typeof window === "undefined") return initialFilters;

    try {
      const stored = localStorage.getItem(storageKeyWithPrefix);
      if (stored) {
        const parsedFilters = JSON.parse(stored);
        // Merger avec les filtres initiaux pour s'assurer qu'on a tous les champs
        return { ...initialFilters, ...parsedFilters };
      }
    } catch (error) {
      console.warn(`Erreur lors de la lecture des filtres depuis localStorage:`, error);
    }

    return initialFilters;
  });

  // Sauvegarder les filtres dans le localStorage à chaque changement
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Ne sauvegarder que les filtres non-vides et non-null
      const filtersToSave = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== null && value !== "" && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as FilterState);

      if (Object.keys(filtersToSave).length > 0) {
        localStorage.setItem(storageKeyWithPrefix, JSON.stringify(filtersToSave));
      } else {
        // Si aucun filtre actif, supprimer de localStorage
        localStorage.removeItem(storageKeyWithPrefix);
      }
    } catch (error) {
      console.warn("Impossible de sauvegarder les filtres dans localStorage:", error);
    }
  }, [filters, storageKeyWithPrefix]);

  /**
   * Met à jour un filtre spécifique
   */
  const setFilter = useCallback((key: string, value: string | number | Date | boolean | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Supprime un filtre spécifique
   */
  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  /**
   * Remet tous les filtres aux valeurs initiales
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  /**
   * Vérifie s'il y a des filtres actifs (non-vides)
   */
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key in initialFilters) {
      return value !== initialFilters[key] && value !== "" && value !== null && value !== undefined;
    }
    return value !== "" && value !== null && value !== undefined;
  });

  return {
    filters,
    setFilter,
    resetFilters,
    clearFilter,
    hasActiveFilters,
  };
}

/**
 * Hook spécialisé pour les filtres de dépenses
 */
export function useDepenseFilters() {
  return useTableFilters({
    storageKey: "depenses",
    initialFilters: {
      search: "",
      categorie: "",
      typeCompte: "",
      typeDepense: "",
      dateDebut: "",
      dateFin: "",
      montantMin: "",
      montantMax: "",
    },
  });
}

/**
 * Hook spécialisé pour les filtres de revenus
 */
export function useRevenuFilters() {
  const baseFilters = useTableFilters({
    storageKey: "revenus",
    initialFilters: {
      search: "",
      categorieRevenu: "",
      typeCompte: "",
      dateDebut: "",
      dateFin: "",
      montantMin: "",
      montantMax: "",
      estRecurrent: "",
    },
  });

  // S'assurer que tous les valeurs sont des chaînes
  const filters = Object.entries(baseFilters.filters).reduce(
    (acc, [key, value]) => {
      acc[key] = typeof value === "string" ? value : "";
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    ...baseFilters,
    filters,
  };
}

/**
 * Hook spécialisé pour les filtres de catégories
 */
export function useCategorieFilters() {
  return useTableFilters({
    storageKey: "categories",
    initialFilters: {
      recherche: "",
      actives: "",
    },
  });
}
