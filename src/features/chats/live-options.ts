// REST remains a fallback even when optional WebSocket notifications are enabled.
export const liveChatOptions = {
  staleTime: 0,
  refetchOnMount: 'always',
  refetchOnWindowFocus: 'always',
  refetchOnReconnect: 'always',
  refetchIntervalInBackground: false,
} as const;
