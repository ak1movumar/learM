'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { serverSession, sessionStore } from '@/features/auth/session';
import { refresh } from '@/services/api/client';
import { queryKeys } from '@/constants/query-keys';
import { startChatSocket } from './websocket-client';
import { chatSocketUrl } from './websocket-contract';

export function ChatWebSocket() {
  const { user } = useAuth();
  const client = useQueryClient();
  const router = useRouter();
  const { generation } = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    () => serverSession,
  );
  const userId = user?.id;
  useEffect(() => {
    const url = chatSocketUrl(
      process.env.NEXT_PUBLIC_CHAT_WS_URL,
      window.location.protocol,
    );
    if (!url || !userId) return;
    let disposed = false;
    const isCurrent = () =>
      !disposed && sessionStore.getSnapshot().generation === generation;
    const pending = new Map<string, readonly unknown[]>();
    let flush: ReturnType<typeof setTimeout> | undefined;
    const invalidate = (key: readonly unknown[]) => {
      pending.set(JSON.stringify(key), key);
      if (flush) return;
      flush = setTimeout(() => {
        flush = undefined;
        if (isCurrent())
          for (const queryKey of pending.values())
            void client.invalidateQueries({ queryKey });
        pending.clear();
      }, 100);
    };
    let stop: (() => void) | undefined;
    const connect = () => {
      stop?.();
      if (!isCurrent() || !navigator.onLine || document.hidden) return;
      stop = startChatSocket({
        url,
        createSocket: (address) => new WebSocket(address),
        isCurrent,
        getToken: async (forceRefresh) => {
          const session = sessionStore.getSnapshot();
          if (!isCurrent()) return null;
          if (forceRefresh || !session.accessToken) {
            if (!session.refreshToken) return null;
            return refresh();
          }
          return session.accessToken;
        },
        onReady: () => {
          for (const key of [
            queryKeys.chats,
            ['chat'],
            ['chatMembers'],
            ['messages'],
            ['reactions'],
          ])
            invalidate(key);
        },
        onUpdate: (event) => {
          invalidate(queryKeys.chats);
          if (event.type === 'chat.access_revoked') {
            const keys = [
              queryKeys.chat(event.chat_id),
              queryKeys.chatMembers(event.chat_id),
              queryKeys.messages(event.chat_id),
              ['reactions', event.chat_id],
            ];
            void Promise.all(
              keys.map((queryKey) => client.cancelQueries({ queryKey })),
            ).then(() => {
              if (!isCurrent()) return;
              for (const queryKey of keys) client.removeQueries({ queryKey });
              if (window.location.pathname === `/chats/${event.chat_id}`)
                router.replace('/chats');
            });
          } else if (event.type === 'chat.updated') {
            invalidate(queryKeys.chat(event.chat_id));
            invalidate(queryKeys.chatMembers(event.chat_id));
          } else {
            invalidate(queryKeys.messages(event.chat_id));
            if (event.type === 'message.deleted' && 'message_id' in event) {
              const queryKey = queryKeys.reactions(
                event.chat_id,
                event.message_id,
              );
              void client.cancelQueries({ queryKey }).then(() => {
                if (isCurrent()) client.removeQueries({ queryKey });
              });
            }
          }
        },
      });
    };
    const pause = () => {
      stop?.();
      stop = undefined;
    };
    const visibility = () => {
      if (document.hidden) pause();
      else connect();
    };
    connect();
    window.addEventListener('online', connect);
    window.addEventListener('offline', pause);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', connect);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      pause();
      clearTimeout(flush);
      window.removeEventListener('online', connect);
      window.removeEventListener('offline', pause);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', connect);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [client, generation, router, userId]);
  return null;
}
