'use client';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import * as api from './api';
import { applyMessageAcknowledgement, type Message } from './contracts';
import { sessionStore } from '@/features/auth/session';
import { sessionDrafts, messageDraftKey } from '@/lib/session-drafts';
import { liveChatOptions } from './live-options';
export const chatsOptions = () =>
  queryOptions({
    queryKey: queryKeys.chats,
    queryFn: ({ signal }) => api.getChats(signal),
    ...liveChatOptions,
    refetchInterval: 5000,
  });
export const chatOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.chat(id),
    queryFn: ({ signal }) => api.getChat(id, signal),
  });
export const membersOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.chatMembers(id),
    queryFn: ({ signal }) => api.getMembers(id, signal),
    refetchInterval: 30000,
  });
export const messagesOptions = (id: string, active = false) =>
  queryOptions({
    queryKey: queryKeys.messages(id),
    queryFn: ({ signal }) => api.getMessages(id, signal),
    ...liveChatOptions,
    refetchInterval: active ? 2000 : 5000,
  });
export const reactionsOptions = (chat: string, id: string) =>
  queryOptions({
    queryKey: queryKeys.reactions(chat, id),
    queryFn: ({ signal }) => api.getReactions(chat, id, signal),
    refetchInterval: 20000,
  });
export type MessageAction =
  | { type: 'send'; content: string }
  | { type: 'edit'; id: string; content: string }
  | { type: 'delete' | 'read'; id: string };
export function useMessageAction(chat: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (action: MessageAction) => {
      const generation = sessionStore.getSnapshot().generation;
      await client.cancelQueries({ queryKey: queryKeys.messages(chat) });
      if (sessionStore.getSnapshot().generation !== generation)
        throw new Error('Session changed');
      let message: Message | undefined;
      switch (action.type) {
        case 'send':
          message = await api.sendMessage(chat, action.content);
          break;
        case 'edit':
          message = await api.editMessage(chat, action.id, action.content);
          break;
        case 'read':
          message = await api.markRead(chat, action.id);
          break;
        case 'delete':
          await api.deleteMessage(chat, action.id);
          break;
      }
      return { message, generation };
    },
    onSuccess: async ({ message, generation }, action) => {
      if (sessionStore.getSnapshot().generation !== generation) return;
      await client.cancelQueries({ queryKey: queryKeys.messages(chat) });
      if (sessionStore.getSnapshot().generation !== generation) return;
      client.setQueryData<Message[]>(queryKeys.messages(chat), (current) =>
        message && action.type !== 'delete'
          ? applyMessageAcknowledgement(current ?? [], message, action.type)
          : (current ?? []).filter(
              (item) => action.type !== 'delete' || item.id !== action.id,
            ),
      );
      if (message && action.type === 'send')
        sessionDrafts.acknowledge(
          messageDraftKey(message.sender_id, chat),
          action.content,
        );
      if (action.type === 'delete')
        client.removeQueries({
          queryKey: queryKeys.reactions(chat, action.id),
        });
    },
    onSettled: (_data, _error, action) => {
      void client.invalidateQueries({ queryKey: queryKeys.messages(chat) });
      if (action.type !== 'read')
        void client.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
