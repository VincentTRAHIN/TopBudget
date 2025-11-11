"use client";

import {
  deleteAllDepensesEndpoint,
  depensesEndpoint,
  soldeMensuelEndpoint,
  totalMensuelEndpoint,
} from "@/services/api.service";
import fetcher from "@/utils/fetcher.utils";
import debug from "debug";
import { useState } from "react";
import { mutate } from "swr";

const log = debug("app:frontend:useDeleteAllDepenses");

interface DeleteAllResult {
  deletedCount: number;
}

interface UseDeleteAllDepensesReturn {
  deleteAllDepenses: () => Promise<DeleteAllResult>;
  isLoading: boolean;
}

/**
 * Hook pour supprimer toutes les dépenses de l'utilisateur
 */
export const useDeleteAllDepenses = (): UseDeleteAllDepensesReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAllDepenses = async (): Promise<DeleteAllResult> => {
    log("Début suppression de toutes les dépenses");
    setIsLoading(true);

    try {
      const result: DeleteAllResult = await fetcher(deleteAllDepensesEndpoint, {
        method: "DELETE",
      });

      log(`${result.deletedCount} dépenses supprimées avec succès`);

      // Invalider tous les caches liés aux dépenses
      await Promise.all([
        mutate((key) => typeof key === "string" && key.startsWith(depensesEndpoint)),
        mutate(totalMensuelEndpoint),
        mutate(soldeMensuelEndpoint),
        mutate((key) => typeof key === "string" && key.includes("statistiques")),
      ]);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      log("❌ Erreur suppression:", errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteAllDepenses,
    isLoading,
  };
};

export default useDeleteAllDepenses;
