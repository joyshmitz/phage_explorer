import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes stale time - data considered fresh for this long
      staleTime: 5 * 60 * 1000,
      // 10 minutes gc time - inactive queries garbage collected after this
      // Prevents unbounded memory growth in long sessions
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

export default queryClient;

