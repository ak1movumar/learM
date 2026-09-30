import {
  parseChatSocketEvent,
  type ChatSocketUpdate,
} from './websocket-contract';

export type ChatSocketPort = {
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  send(data: string): void;
  close(): void;
};
type Options = {
  url: string;
  createSocket: (url: string) => ChatSocketPort;
  getToken: (forceRefresh: boolean) => Promise<string | null>;
  isCurrent: () => boolean;
  onReady: () => void;
  onUpdate: (event: ChatSocketUpdate) => void;
  random?: () => number;
};

/** One connection per signed-in browser tab. All writes still use REST. */
export function startChatSocket(options: Options) {
  let stopped = false;
  let socket: ChatSocketPort | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;
  let refreshRequired = false;
  let authRetries = 0;
  const current = () => !stopped && options.isCurrent();
  function detach() {
    clearTimeout(deadline);
    clearTimeout(heartbeat);
    if (socket) {
      const previous = socket;
      socket = null;
      previous.onopen =
        previous.onmessage =
        previous.onclose =
        previous.onerror =
          null;
      previous.close();
    }
  }
  function reconnect(code = 1006) {
    detach();
    if (!current()) return;
    // One refresh per failed authentication cycle; never log out on a WS-only failure.
    if (code === 4403 || (code === 4401 && authRetries >= 1)) return;
    if (code === 4401) {
      refreshRequired = true;
      authRetries++;
    }
    const delay =
      Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)) +
      Math.floor((options.random ?? Math.random)() * 500);
    clearTimeout(retry);
    retry = setTimeout(() => {
      void connect();
    }, delay);
  }
  async function connect() {
    if (!current()) return;
    try {
      const token = await options.getToken(refreshRequired);
      refreshRequired = false;
      if (!current() || !token) return;
      const connection = options.createSocket(options.url);
      socket = connection;
      let authenticated = false;
      let awaitingPong = false;
      const active = () => current() && socket === connection;
      const send = (data: object) => {
        try {
          connection.send(JSON.stringify(data));
        } catch {
          reconnect();
        }
      };
      const ping = () => {
        if (!active()) return;
        awaitingPong = true;
        deadline = setTimeout(() => reconnect(), 10000);
        send({ type: 'ping' });
      };
      // Covers both a hung handshake and a server that never acknowledges auth.
      deadline = setTimeout(() => reconnect(), 10000);
      connection.onopen = () => {
        if (!active()) return;
        clearTimeout(deadline);
        deadline = setTimeout(() => reconnect(), 10000);
        send({ type: 'auth', access_token: token });
      };
      connection.onmessage = ({ data }) => {
        if (!active()) return;
        const event = parseChatSocketEvent(data);
        if (!event) return;
        if (event.type === 'auth.ok' && !authenticated) {
          authenticated = true;
          attempts = 0;
          authRetries = 0;
          clearTimeout(deadline);
          heartbeat = setTimeout(ping, 25000);
          options.onReady();
        } else if (authenticated && event.type === 'pong' && awaitingPong) {
          awaitingPong = false;
          clearTimeout(deadline);
          heartbeat = setTimeout(ping, 25000);
        } else if (authenticated && 'chat_id' in event) {
          options.onUpdate(event);
        }
        // Errors are informational. Auth/access failures MUST also close with 4401/4403.
      };
      connection.onclose = ({ code }) => {
        if (active()) reconnect(code);
      };
      connection.onerror = () => {
        if (active()) reconnect();
      };
    } catch {
      if (current()) reconnect();
    }
  }
  void connect();
  return () => {
    stopped = true;
    clearTimeout(retry);
    detach();
  };
}
