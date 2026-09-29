'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { experienceCopy } from '@/i18n/experience';
import { ArrowDown, ArrowLeft, UsersRound } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useI18n } from '@/providers/i18n-provider';
import { LinkButton } from '@/components/ui/link-button';
import { Button, IconButton } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/states';
import { chatOptions, membersOptions, messagesOptions } from './queries';
import { chatDisplayName } from './contracts';
import { MemberManager } from './member-manager';
import { ChatError, ChatLoading } from './chat-state';
import { MessageBubble } from './message-bubble';
import { Composer } from './composer';
import styles from './chat.module.scss';
export function Conversation({ id }: { id: string }) {
  const chat = useQuery(chatOptions(id));
  const members = useQuery(membersOptions(id));
  const messages = useQuery({
    ...messagesOptions(id, true),
    enabled: chat.isSuccess,
  });
  const { user } = useAuth();
  const {
    messages: { messaging: t },
    locale,
  } = useI18n();
  const [info, setInfo] = useState(false);
  const [away, setAway] = useState(false);
  const [seenId, setSeenId] = useState<string | undefined>();
  const [limit, setLimit] = useState(50);
  const viewport = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const names = new Map(
    members.data?.map((member) => [member.user_id, member.user.username]),
  );
  const title = chat.data
    ? chatDisplayName(
        chat.data,
        members.data ?? [],
        names,
        user?.id ?? '',
        t[chat.data.type],
      )
    : t.chats;
  const items = messages.data ?? [];
  const lastId = items.at(-1)?.id;
  useEffect(() => {
    if (stick.current && viewport.current)
      viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [lastId]);
  return (
    <section className={styles.conversation} aria-label={t.conversation}>
      <header className={styles.conversationHeader}>
        <LinkButton href="/chats" variant="ghost" aria-label={t.back}>
          <ArrowLeft size={20} />
        </LinkButton>
        <div>
          <h1>{title}</h1>
          <span>{chat.data ? t[chat.data.type] : t.loading}</span>
          <small className={styles.syncStatus}>
            {messages.fetchStatus === 'paused'
              ? experienceCopy[locale].paused
              : messages.isError
                ? t.refreshError
                : messages.isFetching
                  ? experienceCopy[locale].syncing
                  : experienceCopy[locale].ready}
          </small>
        </div>
        <IconButton
          label={t.members}
          disabled={!chat.isSuccess}
          onClick={() => setInfo(true)}
        >
          <UsersRound size={20} />
        </IconButton>
      </header>
      {chat.isError ? (
        <ChatError retry={() => void chat.refetch()} />
      ) : chat.isPending || messages.isPending ? (
        <ChatLoading />
      ) : messages.isError && !messages.data ? (
        <ChatError retry={() => void messages.refetch()} />
      ) : (
        <>
          {messages.isError && (
            <div className={styles.notice}>
              <Button variant="ghost" onClick={() => void messages.refetch()}>
                {t.refreshError}
              </Button>
            </div>
          )}
          <div
            ref={viewport}
            className={styles.messages}
            onScroll={(event) => {
              const el = event.currentTarget;
              stick.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < 80;
              setAway(!stick.current);
              if (stick.current) setSeenId(lastId);
            }}
          >
            {items.length > limit && (
              <Button
                variant="secondary"
                onClick={() => {
                  stick.current = false;
                  setLimit(limit + 50);
                }}
              >
                {t.older}
              </Button>
            )}
            {!items.length && (
              <EmptyState title={t.noMessages} description={t.noMessagesBody} />
            )}
            {items.slice(-limit).map((message, index, visible) => {
              const date = new Date(message.created_at);
              const previous = visible[index - 1];
              const key = date.toDateString();
              const showDate =
                !previous ||
                new Date(previous.created_at).toDateString() !== key;
              return (
                <div key={message.id}>
                  {showDate && Number.isFinite(date.getTime()) && (
                    <p className={styles.date}>
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: 'long',
                      }).format(date)}
                    </p>
                  )}
                  <MessageBubble
                    message={message}
                    name={message.sender.username}
                  />
                </div>
              );
            })}
          </div>
          {away && (
            <div className={styles.jump}>
              <Button
                variant="secondary"
                onClick={() => {
                  stick.current = true;
                  setAway(false);
                  setSeenId(lastId);
                  if (viewport.current)
                    viewport.current.scrollTop = viewport.current.scrollHeight;
                }}
              >
                <ArrowDown size={16} />
                {experienceCopy[locale].down}
                {lastId !== seenId && <span aria-hidden="true"> � </span>}
              </Button>
            </div>
          )}
          <Composer
            chat={id}
            onSent={() => {
              stick.current = true;
              requestAnimationFrame(() => {
                if (viewport.current)
                  viewport.current.scrollTop = viewport.current.scrollHeight;
              });
            }}
          />
        </>
      )}
      <Modal open={info} onClose={() => setInfo(false)} title={t.members}>
        <MemberManager chat={id} />
      </Modal>
    </section>
  );
}
