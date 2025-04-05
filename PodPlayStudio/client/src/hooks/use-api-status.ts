import { useQuery } from '@tanstack/react-query';

type APIStatus = {
  apiKeyConfigured: boolean;
  apiKey: string | null;
};

export function useApiStatus() {
  const { data, isLoading, error } = useQuery<APIStatus>({
    queryKey: ['/api/status'],
    queryFn: async () => {
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch API status');
      }
      return response.json();
    },
  });

  return {
    status: data,
    isLoading,
    error,
  };
}