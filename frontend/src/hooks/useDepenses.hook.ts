import useSWR from 'swr';
import fetcher from '@/utils/fetcher.utils';
import { IDepense } from '@/types/depense.type';
import { depensesEndpoint } from '@/services/api.service';

export const useDepenses = () => {
  const { data, error, isLoading, mutate } = useSWR<IDepense[]>(
    depensesEndpoint,
    fetcher,
  );

  return {
    depenses: data || [],
    isLoading,
    isError: error,
    refreshDepenses: mutate,
  };
};
