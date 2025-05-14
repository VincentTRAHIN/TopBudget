"use client";

import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { totalMensuelEndpoint } from '@/services/api.service';
import { IDepense } from '@/types/depense.type';

export interface CurrentMonthTotalData {
  total: number;
  depenses?: IDepense[]; // optionnel puisque nous sommes principalement intéressés par le total
}

export const useCurrentMonthTotal = () => {
  // L'URL sans paramètres de requête pour utiliser les valeurs par défaut du backend (mois et année actuels)
  const url = totalMensuelEndpoint;
  
  const { data, error, isLoading, mutate } = useSWR<CurrentMonthTotalData>(
    url,
    fetcher,
    {
      shouldRetryOnError: false,
    }
  );

  return {
    total: data?.total || 0, // retourne 0 si data ou data.total est undefined
    isLoading,
    isError: error,
    mutate,
  };
};
