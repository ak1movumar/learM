// REST fallback until the backend publishes a WebSocket URL/auth/event contract.
export const liveChatOptions = {
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  refetchOnReconnect: 'always',
  refetchIntervalInBackground: false,
} as const;
