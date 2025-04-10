import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
      queryFn: async ({ queryKey }) => {
        const [url, ...params] = Array.isArray(queryKey) ? queryKey : [queryKey];
        
        if (typeof url !== 'string') {
          throw new Error('Invalid query key');
        }
        
        // Handle nested query keys like ['/api/conversations', id, 'messages']
        let fullUrl = url;
        if (params.length > 0) {
          if (params.length === 2 && params[1] === 'messages') {
            // Format: ['/api/conversations', id, 'messages']
            fullUrl = `${url}/${params[0]}/messages`;
          }
        }
        
        const response = await fetch(fullUrl);
        
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

// Helper function for making API requests
export async function apiRequest<T>(
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API request failed:', {
      url,
      method,
      status: response.status,
      errorData,
      requestBody: body ? JSON.parse(JSON.stringify(body)) : undefined
    });
    throw new Error(
      errorData.error || errorData.message || `API request failed with status ${response.status}`
    );
  }

  // For DELETE requests that return 204 No Content
  if (response.status === 204) {
    return true as unknown as T;
  }

  return response.json();
}