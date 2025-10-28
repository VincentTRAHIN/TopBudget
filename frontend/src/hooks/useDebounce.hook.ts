import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour debouncer une valeur
 * Utile pour les inputs de recherche afin d'éviter les appels API trop fréquents
 * 
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut 500ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    // ou si le composant est démonté
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
