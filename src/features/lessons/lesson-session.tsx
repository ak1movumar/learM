'use client';
import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Button, IconButton } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { Badge, Card, ProgressBar } from '@/components/ui/surface';
import { EmptyState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/modal';

import { useProgress } from '@/features/learning/queries';
import { progressByLesson } from '@/features/progress/model';
import { LearningError } from '@/features/learning/data-state';
import { useLessonAttempt } from './use-lesson-attempt';
import { practiceFeedback, practiceCopy } from './practice-feedback';
import { LessonQuestion } from './lesson-question';
import { ExerciseInput } from './exercise-input';
import type { Exercise, Lesson } from './contracts';
import styles from './lesson.module.scss';
export function LessonSession({
  lesson,
  exercises,
}: {
  lesson: Lesson;
  exercises: Exercise[];
}) {
  const {
    messages: { learning: t },
    locale,
  } = useI18n();
  const router = useRouter();

  const progress = useProgress();
  const [exit, setExit] = useState(false);
  const {
    item,
    items,
    index,
    answer,
    finished,
    correct,
    canAdvance,
    lastStep,
    showAnswer,
    mistakes,
    reviewing,
    reveal,
    completed,
    dirty,
    mutation,
    advance,
    submit,
    changeAnswer,
    supported,
    canSubmit,
  } = useLessonAttempt(lesson, exercises, () => {
    void progress.refetch();
  });
  const feedback = item ? practiceFeedback(item) : null;
  const copy = practiceCopy[locale];
  return (
    <main id="main-content" className={styles.workspace}>
      <header className={styles.header}>
        <IconButton
          label={t.closeLesson}
          onClick={() =>
            dirty ? setExit(true) : router.push('/courses/' + lesson.course_id)
          }
        >
          <X size={22} />
        </IconButton>
        <div>
          <p>{lesson.title}</p>
          <ProgressBar
            value={
              finished
                ? 100
                : items.length
                  ? (completed / items.length) * 100
                  : 0
            }
            label={t.sessionProgress}
          />
        </div>
        <span>
          {completed}/{items.length}
        </span>
      </header>
      {finished ? (
        <Card className={styles.complete}>
          <CheckCircle2 size={48} />
          <h1>{copy.done}</h1>
          <p>{copy.doneHint}</p>
          {progress.isError ? (
            <LearningError onRetry={() => void progress.refetch()} />
          ) : (
            <Badge
              tone={
                progressByLesson(progress.data ?? []).get(lesson.id)?.completed
                  ? 'success'
                  : 'neutral'
              }
            >
              {progress.isFetching
                ? t.loading
                : progressByLesson(progress.data ?? []).get(lesson.id)
                      ?.completed
                  ? t.serverCompleted
                  : t.serverPending}
            </Badge>
          )}
          <div className={styles.completeActions}>
            <LinkButton href={'/courses/' + lesson.course_id}>
              {t.returnCourse}
              <ArrowRight size={17} />
            </LinkButton>
            <LinkButton variant="secondary" href="/progress">
              {t.viewProgress}
            </LinkButton>
          </div>
        </Card>
      ) : !item ? (
        <EmptyState
          title={t.noExercises}
          description={t.noExercisesHint}
          action={
            <LinkButton href={'/courses/' + lesson.course_id}>
              {t.returnCourse}
            </LinkButton>
          }
        />
      ) : (
        <section
          key={index}
          className={styles.exercise}
          aria-labelledby="exercise-title"
        >
          <div className={styles.kicker}>
            <Badge tone="primary">{t[item.type]}</Badge>
            <span>
              {t.exercise} {index + 1} {t.of} {items.length}
            </span>
          </div>
          {reviewing && <p role="status">{copy.review}</p>}
          <LessonQuestion item={item} />
          {supported ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (canAdvance) advance();
                else submit();
              }}
            >
              <ExerciseInput
                key={index}
                task={item}
                answer={answer}
                onChange={changeAnswer}
                disabled={mutation.isPending || canAdvance}
              />
              {mutation.isError && (
                <p role="alert" className={styles.error}>
                  {t.submitError}
                </p>
              )}
              {mutation.data && (
                <div
                  role="status"
                  className={correct ? styles.correct : styles.error}
                >
                  <strong>{correct ? t.correct : t.incorrect}</strong>
                  <span>
                    {t.score}: {mutation.data.score}
                  </span>
                </div>
              )}
              {mistakes === 1 && !showAnswer && !correct && (
                <div role="status">
                  <p>{copy.hint}</p>
                  {feedback && <p>{feedback.explanation}</p>}
                </div>
              )}
              {(showAnswer || (correct && feedback)) && (
                <div role="status" className={styles.correct}>
                  {feedback ? (
                    <div>
                      {showAnswer && (
                        <p>
                          <strong>
                            {copy.answer}: {feedback.answer}
                          </strong>
                        </p>
                      )}
                      <p>{feedback.explanation}</p>
                    </div>
                  ) : showAnswer ? (
                    <p>{copy.missing}</p>
                  ) : null}
                </div>
              )}
              <footer className={styles.controls}>
                {canAdvance ? (
                  <Button type="submit" size="lg">
                    {lastStep ? t.finish : t.nextExercise}
                    <ArrowRight size={18} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    loading={mutation.isPending}
                    disabled={!canSubmit}
                  >
                    {mutation.isError ? (
                      <>
                        <RotateCcw size={17} />
                        {t.sendAgain}
                      </>
                    ) : (
                      t.check
                    )}
                  </Button>
                )}
                {!canAdvance && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={mutation.isPending}
                    onClick={reveal}
                  >
                    {copy.unknown}
                  </Button>
                )}
              </footer>
            </form>
          ) : (
            <EmptyState
              title={t.unsupported}
              description={t.unsupportedHint}
              action={
                <LinkButton
                  href={'/courses/' + lesson.course_id}
                  variant="secondary"
                >
                  {t.returnCourse}
                </LinkButton>
              }
            />
          )}
        </section>
      )}
      <ConfirmDialog
        open={exit}
        onClose={() => setExit(false)}
        onConfirm={() => {
          setExit(false);
          router.push('/courses/' + lesson.course_id);
        }}
        title={t.exitTitle}
        description={t.exitBody}
        confirmLabel={t.exit}
        loading={mutation.isPending}
      />
    </main>
  );
}
