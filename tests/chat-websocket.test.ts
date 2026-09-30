import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chatSocketUrl,
  parseChatSocketEvent,
} from '../src/features/chats/websocket-contract';
import {
  startChatSocket,
  type ChatSocketPort,
} from '../src/features/chats/websocket-client';

const chat = 'a56aa3d6-39bc-4450-95f9-b2de44a99054';
const message = '47c05f2a-d4e4-4909-bbaf-1086053f204a';
class FakeSocket implements ChatSocketPort {
  onopen: ChatSocketPort['onopen'] = null;
  onmessage: ChatSocketPort['onmessage'] = null;
  onclose: ChatSocketPort['onclose'] = null;
  onerror: ChatSocketPort['onerror'] = null;
  sent: object[] = [];
  closed = false;
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.closed = true;
  }
  open() {
    this.onopen?.(new Event('open'));
  }
  receive(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
  }
  disconnect(code = 1006) {
    this.onclose?.({ code } as CloseEvent);
  }
}
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test('WS URL is explicit, rejects credentials, query tokens and mixed content', () => {
  assert.equal(chatSocketUrl(undefined, 'https:'), null);
  assert.equal(
    chatSocketUrl('wss://api.test/ws/chats', 'https:'),
    'wss://api.test/ws/chats',
  );
  assert.equal(
    chatSocketUrl('ws://localhost:8000/ws/chats', 'http:'),
    'ws://localhost:8000/ws/chats',
  );
  for (const url of [
    'ws://api.test/ws/chats',
    'https://api.test/ws',
    'wss://api.test/ws?token=secret',
    'wss://user:secret@api.test/ws',
    'wss://api.test/ws#x',
  ])
    assert.equal(chatSocketUrl(url, 'https:'), null);
});
test('WS validates identifiers and ignores malformed, unknown and oversized events', () => {
  for (const type of [
    'message.created',
    'message.updated',
    'message.deleted',
    'message.read',
  ]) {
    assert.ok(
      parseChatSocketEvent(
        JSON.stringify({ type, chat_id: chat, message_id: message }),
      ),
    );
  }
  for (const data of [
    '{',
    '{}',
    JSON.stringify({
      type: 'message.created',
      chat_id: '../users',
      message_id: message,
    }),
    ' '.repeat(17000),
    JSON.stringify({ type: 'typing.start', chat_id: chat }),
    new Uint8Array(2),
  ])
    assert.equal(parseChatSocketEvent(data), null);
});
test('WS authenticates before updates, resyncs on reconnect, heartbeats and cleans up', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeSocket[] = [];
  let ready = 0;
  let updates = 0;
  const stop = startChatSocket({
    url: 'wss://api.test/ws/chats',
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    getToken: async () => 'access-token',
    isCurrent: () => true,
    onReady: () => {
      ready++;
    },
    onUpdate: () => {
      updates++;
    },
    random: () => 0,
  });
  t.after(stop);
  await settle();
  const first = sockets[0]!;
  first.open();
  assert.deepEqual(first.sent, [
    { type: 'auth', access_token: 'access-token' },
  ]);
  const event = { type: 'message.created', chat_id: chat, message_id: message };
  first.receive(event);
  assert.equal(updates, 0);
  first.receive({ type: 'auth.ok' });
  first.receive({ type: 'auth.ok' });
  assert.equal(ready, 1);
  first.receive(event);
  assert.equal(updates, 1);
  t.mock.timers.tick(25000);
  assert.deepEqual(first.sent.at(-1), { type: 'ping' });
  first.receive({ type: 'pong' });
  t.mock.timers.tick(10000);
  assert.equal(first.closed, false);
  first.disconnect();
  t.mock.timers.tick(1000);
  await settle();
  const second = sockets[1]!;
  second.open();
  second.receive({ type: 'auth.ok' });
  assert.equal(ready, 2);
  stop();
  assert.equal(second.closed, true);
  t.mock.timers.tick(120000);
  assert.equal(sockets.length, 2);
});
test('WS auth rejection refreshes once and stops retrying repeated rejection', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeSocket[] = [];
  const forced: boolean[] = [];
  const stop = startChatSocket({
    url: 'wss://api.test/ws/chats',
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    getToken: async (force) => {
      forced.push(force);
      return force ? 'new-token' : 'old-token';
    },
    isCurrent: () => true,
    onReady: () => {},
    onUpdate: () => {},
    random: () => 0,
  });
  t.after(stop);
  await settle();
  sockets[0]!.open();
  sockets[0]!.disconnect(4401);
  t.mock.timers.tick(1000);
  await settle();
  sockets[1]!.open();
  assert.deepEqual(forced, [false, true]);
  assert.deepEqual(sockets[1]!.sent[0], {
    type: 'auth',
    access_token: 'new-token',
  });
  sockets[1]!.disconnect(4401);
  t.mock.timers.tick(120000);
  await settle();
  assert.equal(sockets.length, 2);
});
test('WS ignores delayed events from old sessions and does not connect after pending token resolves on logout', async () => {
  let current = true;
  let resolve!: (token: string) => void;
  let connections = 0;
  const stop = startChatSocket({
    url: 'wss://api.test/ws/chats',
    createSocket: () => {
      connections++;
      return new FakeSocket();
    },
    getToken: () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
    isCurrent: () => current,
    onReady: () => assert.fail(),
    onUpdate: () => assert.fail(),
  });
  current = false;
  stop();
  resolve('old-token');
  await settle();
  assert.equal(connections, 0);
});
test('WS reconnects when auth acknowledgement or heartbeat is missing', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sockets: FakeSocket[] = [];
  const stop = startChatSocket({
    url: 'wss://api.test/ws/chats',
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    getToken: async () => 'token',
    isCurrent: () => true,
    onReady: () => {},
    onUpdate: () => {},
    random: () => 0,
  });
  t.after(stop);
  await settle();
  sockets[0]!.open();
  t.mock.timers.tick(10000);
  assert.equal(sockets[0]!.closed, true);
  t.mock.timers.tick(1000);
  await settle();
  sockets[1]!.open();
  sockets[1]!.receive({ type: 'auth.ok' });
  t.mock.timers.tick(25000);
  t.mock.timers.tick(10000);
  assert.equal(sockets[1]!.closed, true);
});
