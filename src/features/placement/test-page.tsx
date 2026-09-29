'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/providers/i18n-provider';
import { placementMessages } from '@/i18n/placement';
import { Button } from '@/components/ui/button';
import { Card, PageHeader, ProgressBar } from '@/components/ui/surface';
import { LinkButton } from '@/components/ui/link-button';
import { ConfirmDialog } from '@/components/ui/modal';
import { ExerciseInput } from '@/features/lessons/exercise-input';
import {
  exerciseInput,
  canSubmitAnswer,
  type Answer,
} from '@/features/lessons/exercise-adapter';
import { getApiFailure } from '@/services/api/errors';
import { sessionStore } from '@/features/auth/session';
import { startTest, submitTest } from './api';
import type { Level, TestStart, TestResult } from './contracts';
import styles from '@/features/lessons/lesson.module.scss';

export function TestPage({
  language,
  level,
}: {
  language: number;
  level?: Level;
}) {
  const { locale } = useI18n();
  const t = placementMessages[locale];
  const router = useRouter();
  const client = useQueryClient();
  const [attempt, setAttempt] = useState<TestStart | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [exit, setExit] = useState(false);
  const lock = useRef(false);
  const dirty = !!attempt && !result;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const start = useMutation({
    retry: false,
    mutationFn: async () => {
      const generation = sessionStore.getSnapshot().generation;
      return { attempt: await startTest(language, level), generation };
    },
    onSuccess: (data) => {
      if (data.generation === sessionStore.getSnapshot().generation)
        setAttempt({
          ...data.attempt,
          questions: [...data.attempt.questions].sort(
            (a, b) => a.order - b.order || a.id - b.id,
          ),
        });
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  const submit = useMutation({
    retry: false,
    mutationFn: async () => {
      const generation = sessionStore.getSnapshot().generation;
      if (!attempt) throw new Error('Missing attempt');
      return { result: await submitTest(attempt, answers), generation };
    },
    onSuccess: async (data) => {
      if (data.generation !== sessionStore.getSnapshot().generation) return;
      setResult(data.result);
      await client.invalidateQueries();
    },
    onSettled: () => {
      lock.current = false;
    },
  });
  const item = attempt?.questions[index];
  const supported = item && !!exerciseInput(item);
  const complete =
    !!attempt?.questions.length &&
    attempt.questions.every((question) =>
      canSubmitAnswer(question, answers[question.id]),
    );
  const busy = start.isPending || submit.isPending;
  return (
    <main id="main-content" className={styles.workspace}>
      <PageHeader title={level ? t.completion + ' · ' + level : t.placement} />
      {result ? (
        <Card className={styles.complete}>
          <h2>{result.passed ? t.passed : t.failed}</h2>
          <p>
            {t.score}: {result.score}%
          </p>
          {result.result_level && (
            <p>
              {t.current}: {result.result_level}
            </p>
          )}
          <LinkButton href="/learning-path">{t.route}</LinkButton>
        </Card>
      ) : !attempt ? (
        <Card className={styles.complete}>
          <p>{t.startHint}</p>
          {start.isError && (
            <p role="alert">
              {[403, 404, 409].includes(getApiFailure(start.error).status ?? 0)
                ? t.unavailable
                : t.error}
            </p>
          )}
          <Button
            loading={start.isPending}
            onClick={() => {
              if (lock.current) return;
              lock.current = true;
              start.mutate();
            }}
          >
            {start.isError ? t.retry : t.start}
          </Button>
          <LinkButton href="/learning-path" variant="ghost">
            {t.route}
          </LinkButton>
        </Card>
      ) : !item ? (
        <Card>
          <p>{t.emptyTest}</p>
          <LinkButton href="/learning-path">{t.route}</LinkButton>
        </Card>
      ) : (
        <section className={styles.exercise}>
          <ProgressBar
            label={t.question}
            value={
              (attempt.questions.filter((question) =>
                canSubmitAnswer(question, answers[question.id]),
              ).length /
                attempt.questions.length) *
              100
            }
          />
          <p>
            {t.question} {index + 1} / {attempt.questions.length}
          </p>
          <h2>{item.question}</h2>
          {supported ? (
            <ExerciseInput
              key={item.id}
              task={item}
              answer={answers[item.id] ?? ''}
              disabled={busy}
              onChange={(value) => {
                setAnswers({ ...answers, [item.id]: value });
                submit.reset();
              }}
            />
          ) : (
            <p role="status">{t.unsupported}</p>
          )}
          {submit.isError && <p role="alert">{t.error}</p>}
          <footer className={styles.controls}>
            <Button
              variant="secondary"
              disabled={index === 0 || busy}
              onClick={() => setIndex(index - 1)}
            >
              {t.back}
            </Button>
            {index < attempt.questions.length - 1 ? (
              <Button
                disabled={!canSubmitAnswer(item, answers[item.id]) || busy}
                onClick={() => setIndex(index + 1)}
              >
                {t.next}
              </Button>
            ) : (
              <Button
                loading={submit.isPending}
                disabled={!complete}
                onClick={() => {
                  if (lock.current) return;
                  lock.current = true;
                  submit.mutate();
                }}
              >
                {t.submit}
              </Button>
            )}
          </footer>
          <Button variant="ghost" disabled={busy} onClick={() => setExit(true)}>
            {t.route}
          </Button>
        </section>
      )}
      <ConfirmDialog
        open={exit}
        title={t.exit}
        description={t.exitHint}
        confirmLabel={t.cancel}
        loading={busy}
        onClose={() => setExit(false)}
        onConfirm={() => router.push('/learning-path')}
      />
    </main>
  );
}
