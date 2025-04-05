import { useQuery } from '@tanstack/react-query';

export interface ApiStatus {
  apiKeyConfigured: boolean;
  apiKey: string | null;
  version: string;
}

export function useApiStatus() {
  const { data, isLoading, isError, error } = useQuery<ApiStatus>({
    queryKey: ['/api/status'],
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  return {
    status: data,
    isLoading,
    isError,
    error,
    isApiConfigured: data?.apiKeyConfigured || false,
  };
}