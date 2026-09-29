'use client';
import { useState } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { experienceCopy } from '@/i18n/experience';
import styles from './admin.module.scss';
import { ExerciseInput } from '@/features/lessons/exercise-input';
import {
  exerciseInput,
  type Answer,
  type Task,
} from '@/features/lessons/exercise-adapter';
export function ExerciseDraftPreview({
  values,
}: {
  values: Record<string, string>;
}) {
  const { locale } = useI18n();
  const [answer, setAnswer] = useState<Answer>('');
  let task: Task | null = null;
  try {
    const type = values.type;
    const options: unknown = JSON.parse(values.options || '{}');
    if (
      ['choice', 'match', 'translate', 'fill_gap'].includes(type ?? '') &&
      options &&
      typeof options === 'object' &&
      !Array.isArray(options)
    ) {
      task = {
        type: type as Task['type'],
        options: options as Task['options'],
      };
    }
  } catch {
    /* Invalid draft is explained below, without making requests. */
  }
  return (
    <details className={styles.hint}>
      <summary>{experienceCopy[locale].preview}</summary>
      {task && exerciseInput(task) && values.question?.trim() ? (
        <>
          <p style={{ whiteSpace: 'pre-wrap', marginBlock: '1rem' }}>
            {values.question}
          </p>
          <ExerciseInput
            task={task}
            answer={answer}
            onChange={setAnswer}
            disabled={false}
          />
        </>
      ) : (
        <p role="status">{experienceCopy[locale].invalid}</p>
      )}
    </details>
  );
}
