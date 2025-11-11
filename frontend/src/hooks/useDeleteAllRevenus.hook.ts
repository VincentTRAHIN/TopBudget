/**
 * Hook personnalisé pour gérer la suppression de tous les revenus d'un utilisateur
 */
import { deleteAllRevenusEndpoint, revenusEndpoint } from "@/services/api.service";
import fetcher from "@/utils/fetcher.utils";
import { useState } from "react";
import { mutate } from "swr";

interface DeleteAllResult {
  deletedCount: number;
}

export const useDeleteAllRevenus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAllRevenus = async (): Promise<DeleteAllResult> => {
    setIsLoading(true);

    try {
      const result = await fetcher<DeleteAllResult>(deleteAllRevenusEndpoint, {
        method: "DELETE",
      });

      // Invalider le cache SWR pour forcer le rechargement des revenus
      await mutate(revenusEndpoint);

      setIsLoading(false);
      return result;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return {
    deleteAllRevenus,
    isLoading,
  };
};
