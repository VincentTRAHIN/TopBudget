/**
 * Utilitaires d'optimisation des performances
 * 
 * Ce fichier fournit des helpers pour :
 * - Lazy loading de composants
 * - Memoization avancée
 * - Debouncing et throttling
 */

import { useRef, useEffect, useMemo, DependencyList } from 'react';

/**
 * Hook pour debounce une valeur
 * Utile pour réduire le nombre de re-renders lors d'inputs fréquents
 * 
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms (défaut: 300ms)
 * @returns Valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour throttle une fonction
 * Utile pour limiter le nombre d'appels d'une fonction (ex: scroll, resize)
 * 
 * @param callback - Fonction à throttler
 * @param delay - Délai minimum entre deux appels (défaut: 300ms)
 * @returns Fonction throttlée
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef(Date.now());

  return useMemo(
    () =>
      ((...args: any[]) => {
        if (Date.now() - lastRun.current >= delay) {
          callback(...args);
          lastRun.current = Date.now();
        }
      }) as T,
    [callback, delay]
  );
}

/**
 * Hook pour détecter si un composant est visible dans le viewport
 * Utile pour lazy loading d'images ou de composants lourds
 * 
 * @param ref - Ref de l'élément à observer
 * @param options - Options de l'IntersectionObserver
 * @returns Boolean indiquant si l'élément est visible
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Hook pour memoizer des calculs coûteux avec deep comparison
 * Alternative à useMemo avec comparaison profonde des dépendances
 * 
 * @param factory - Fonction qui retourne la valeur à memoizer
 * @param deps - Dépendances (comparées en profondeur)
 * @returns Valeur memoizée
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (!ref.current || !areDeepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Comparaison profonde de deux valeurs
 * Utilisé par useDeepMemo
 */
function areDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !areDeepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Hook pour précharger une image
 * Utile pour améliorer l'UX lors du chargement d'images
 * 
 * @param src - URL de l'image à précharger
 * @returns État du chargement { loaded, error }
 */
export function useImagePreload(src: string): { loaded: boolean; error: boolean } {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  return { loaded, error };
}

/**
 * Hook pour gérer le lazy loading d'un composant
 * Charge le composant uniquement quand il devient visible
 * 
 * @param importFunc - Fonction d'import dynamique du composant
 * @param ref - Ref de l'élément container
 * @returns Composant chargé ou null
 */
export function useLazyComponent<T>(
  importFunc: () => Promise<{ default: T }>,
  ref: React.RefObject<Element>
): T | null {
  const [Component, setComponent] = useState<T | null>(null);
  const isVisible = useIntersectionObserver(ref);

  useEffect(() => {
    if (isVisible && !Component) {
      importFunc().then((module) => setComponent(module.default));
    }
  }, [isVisible, Component, importFunc]);

  return Component;
}

// Import useState manquant
import { useState } from 'react';
