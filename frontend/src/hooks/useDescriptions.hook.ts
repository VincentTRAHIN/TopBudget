import { depensesEndpoint } from "@/services/api.service";
import fetcher from "@/utils/fetcher.utils";
import useSWR from "swr";

/**
 * Hook custom pour récupérer les descriptions uniques des dépenses
 * Utilise SWR pour le cache et la revalidation automatique
 *
 * @returns {Object} - descriptions: tableau des descriptions, isLoading: état de chargement, error: erreur éventuelle
 */
export const useDescriptions = () => {
  const { data, error, isLoading } = useSWR<string[]>(`${depensesEndpoint}/descriptions`, fetcher, {
    revalidateOnFocus: false, // Les descriptions ne changent pas souvent
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute de cache
  });

  return {
    descriptions: data || [],
    isLoading,
    error,
  };
};
