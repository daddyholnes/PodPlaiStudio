import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      queryFn: async ({ queryKey }) => {
        const [url] = Array.isArray(queryKey) ? queryKey : [queryKey];
        
        if (typeof url !== 'string') {
          throw new Error('Invalid query key');
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return response.json();
        }
        
        return response.text();
      },
    },
  },
});

export async function apiRequest(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', data?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}