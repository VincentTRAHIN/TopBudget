"use client";

import { categoriesRevenuEndpoint } from "@/services/api.service";
import { ICategorieRevenu } from "@/types/categorieRevenu.type";
import fetcher from "@/utils/fetcher.utils";
import useSWR from "swr";

export const useCategoriesRevenu = () => {
  const { data, error, isLoading, mutate } = useSWR<ICategorieRevenu[]>(categoriesRevenuEndpoint, fetcher, {
    fallbackData: [],
    onSuccess: () => {
      console.log("Categories de revenus récupérées avec succès");
    },
    onError: () => {
      console.error("Erreur lors de la récupération des catégories de revenus");
    },
  });

  return {
    categoriesRevenu: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refreshCategoriesRevenu: mutate,
  };
};
