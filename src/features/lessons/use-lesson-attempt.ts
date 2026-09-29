'use client';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import { submitExercise } from './api';
import { canAdvancePractice, needsPracticeReview } from './practice-state';
import {
  buildExerciseSubmission,
  canSubmitAnswer,
  exerciseInput,
  type Answer,
} from './exercise-adapter';
import type { Exercise, Lesson } from './contracts';

export function shouldCompleteLesson(
  index: number,
  total: number,
  correct: boolean,
) {
  return total > 0 && correct && index >= total - 1;
}

export function useLessonAttempt(
  lesson: Lesson,
  exercises: Exercise[],
  onFinish: () => void,
) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(() => [...exercises]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer>('');
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const missed = useRef(new Set<number>());
  const reviewed = useRef(new Set<number>());
  const sending = useRef(false);
  const mutation = useMutation({
    mutationFn: ({
      exercise,
      draft,
    }: {
      exercise: Exercise;
      draft: Answer;
    }) => {
      const submission = buildExerciseSubmission(exercise, draft);
      return submitExercise(exercise.id, submission.answer);
    },
    retry: false,
    onSuccess: (result, variables) => {
      if (!result.correct) {
        missed.current.add(variables.exercise.id);
        setMistakes((count) => count + 1);
      }
    },
    onSettled: () => {
      sending.current = false;
    },
  });
  const item = items[index];
  const correct = mutation.data?.correct === true;
  const canAdvance = canAdvancePractice(correct, revealed, mistakes);
  const completed = index + (canAdvance ? 1 : 0);
  const dirty =
    !finished &&
    (!!answer || index > 0 || revealed || mistakes > 0 || mutation.isPending);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const advance = () => {
    if (!item || !canAdvance || finished || sending.current) return;
    const repeat = needsPracticeReview(
      item.id,
      missed.current,
      reviewed.current,
    );
    if (repeat) {
      reviewed.current.add(item.id);
      setItems((current) => [...current, item]);
    }
    if (!repeat && shouldCompleteLesson(index, items.length, canAdvance)) {
      setFinished(true);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['learning-path'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress }),
        queryClient.invalidateQueries({ queryKey: ['xp'] }),
        queryClient.invalidateQueries({ queryKey: ['streak'] }),
        queryClient.invalidateQueries({ queryKey: ['lesson'] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.lessons(lesson.course_id),
        }),
      ]);
      onFinish();
      return;
    }
    setIndex(index + 1);
    setAnswer('');
    setMistakes(0);
    setRevealed(false);
    mutation.reset();
  };
  const submit = () => {
    if (
      !item ||
      !canSubmitAnswer(item, answer) ||
      mutation.isPending ||
      canAdvance ||
      sending.current ||
      finished
    )
      return;
    sending.current = true;
    mutation.mutate({ exercise: item, draft: answer });
  };
  const changeAnswer = (value: Answer) => {
    if (mutation.isPending || canAdvance || finished) return;
    setAnswer(value);
    if (mutation.data || mutation.isError) mutation.reset();
  };
  return {
    item,
    items,
    index,
    answer,
    finished,
    correct,
    canAdvance,
    lastStep:
      index === items.length - 1 &&
      (index >= exercises.length || (mistakes === 0 && !revealed)),
    showAnswer: revealed || mistakes >= 2,
    mistakes,
    reviewing: index >= exercises.length,
    reveal: () => {
      if (!item || sending.current || canAdvance || finished) return;
      missed.current.add(item.id);
      setRevealed(true);
    },
    completed,
    dirty,
    mutation,
    advance,
    submit,
    changeAnswer,
    supported: !!item && !!exerciseInput(item),
    canSubmit:
      canSubmitAnswer(item, answer) &&
      !mutation.isPending &&
      !canAdvance &&
      !finished,
  };
}
