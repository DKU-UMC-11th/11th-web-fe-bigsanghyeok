import { QueryClient } from "@tanstack/react-query";

// 렌더링할 때마다 새 캐시를 만들지 않고 앱 전체에서 같은 객체를 사용해요.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});
