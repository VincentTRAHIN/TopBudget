import useSWR from 'swr';
import fetcher from '../utils/fetcher.utils';
import { lastSyncEndpoint } from '../services/api.service';

/**
 * Interface pour la réponse de l'endpoint last-sync
 */
export interface LastSyncData {
  lastExpenseDate: string | null;
  lastRevenueDate: string | null;
  lastActivityDate: string | null;
  daysSinceLastExpense: number | null;
  daysSinceLastRevenue: number | null;
  daysSinceLastActivity: number | null;
  needsUpdate: boolean;
}

/**
 * Interface pour le retour du hook
 */
export interface UseLastSyncReturn {
  lastExpenseDate: Date | null;
  lastRevenueDate: Date | null;
  lastActivityDate: Date | null;
  daysSinceLastExpense: number | null;
  daysSinceLastRevenue: number | null;
  daysSinceLastActivity: number | null;
  needsUpdate: boolean;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

/**
 * Hook personnalisé pour récupérer les informations de dernière synchronisation
 * 
 * Récupère la date de la dernière dépense/revenu et indique si une mise à jour
 * est nécessaire (plus de 7 jours sans activité).
 * 
 * @returns Informations de synchronisation avec états de chargement et d'erreur
 * 
 * @example
 * ```tsx
 * const { lastActivityDate, daysSinceLastActivity, needsUpdate, isLoading } = useLastSync();
 * 
 * if (isLoading) return <div>Chargement...</div>;
 * 
 * if (needsUpdate) {
 *   return (
 *     <div className="alert alert-warning">
 *       <p>Aucune activité depuis {daysSinceLastActivity} jours</p>
 *       <button>Ajouter une dépense</button>
 *     </div>
 *   );
 * }
 * 
 * return <div>Dernière activité : {lastActivityDate?.toLocaleDateString()}</div>;
 * ```
 */
export function useLastSync(): UseLastSyncReturn {
  // Appel SWR avec fetcher
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<LastSyncData>(lastSyncEndpoint, fetcher, {
    refreshInterval: 60000, // Refresh toutes les minutes
    revalidateOnFocus: true, // Revalider quand la fenêtre reprend le focus
  });

  // Conversion des dates string en objets Date
  const lastExpenseDate = data?.lastExpenseDate ? new Date(data.lastExpenseDate) : null;
  const lastRevenueDate = data?.lastRevenueDate ? new Date(data.lastRevenueDate) : null;
  const lastActivityDate = data?.lastActivityDate ? new Date(data.lastActivityDate) : null;

  return {
    lastExpenseDate,
    lastRevenueDate,
    lastActivityDate,
    daysSinceLastExpense: data?.daysSinceLastExpense ?? null,
    daysSinceLastRevenue: data?.daysSinceLastRevenue ?? null,
    daysSinceLastActivity: data?.daysSinceLastActivity ?? null,
    needsUpdate: data?.needsUpdate ?? false,
    isLoading,
    isError: !!error,
    mutate,
  };
}
