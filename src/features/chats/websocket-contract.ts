import { z } from 'zod';

const messageEvent = z.object({
  type: z.enum([
    'message.created',
    'message.updated',
    'message.deleted',
    'message.read',
  ]),
  chat_id: z.uuid(),
  message_id: z.uuid(),
});
const chatEvent = z.object({
  type: z.enum(['chat.updated', 'chat.access_revoked']),
  chat_id: z.uuid(),
});
export const chatSocketEventSchema = z.union([
  z.object({ type: z.literal('auth.ok') }),
  z.object({ type: z.literal('pong') }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
  messageEvent,
  chatEvent,
]);
export type ChatSocketEvent = z.infer<typeof chatSocketEventSchema>;
export type ChatSocketUpdate =
  z.infer<typeof messageEvent> | z.infer<typeof chatEvent>;

export function parseChatSocketEvent(data: unknown): ChatSocketEvent | null {
  if (typeof data !== 'string' || data.length > 16384) return null;
  try {
    const parsed = chatSocketEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** No inferred server route: enable only after the backend confirms this contract. */
export function chatSocketUrl(value: string | undefined, pageProtocol: string) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      !['ws:', 'wss:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    if (pageProtocol === 'https:' && url.protocol !== 'wss:') return null;
    return url.href;
  } catch {
    return null;
  }
}
