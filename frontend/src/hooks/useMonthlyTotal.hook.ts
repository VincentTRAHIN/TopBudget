"use client";

import { totalMensuelEndpoint } from "@/services/api.service";
import { IDepense } from "@/types/depense.type";
import fetcher from "@/utils/fetcher.utils";
import useSWR from "swr";

export interface MonthlyTotalResponse {
  depenses: IDepense[];
  total: number;
}

export const useMonthlyTotal = (year?: number, month?: number) => {
  let url = totalMensuelEndpoint;

  if (year && month) {
    const formattedMonth = String(month).padStart(2, "0");
    url = `${url}?annee=${year}&mois=${formattedMonth}`;
  }

  const { data, error, isLoading, mutate } = useSWR<MonthlyTotalResponse>(url, fetcher, {
    shouldRetryOnError: false,
    refreshInterval: 0,
    revalidateOnFocus: true,
  });

  return {
    monthlyTotal: data?.total || 0,
    depenses: data?.depenses || [],
    isLoading,
    isError: error,
    mutate,
  };
};
