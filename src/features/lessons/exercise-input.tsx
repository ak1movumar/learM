'use client';
import { useState } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { messages } from '@/i18n/exercise-preview';
import { ChoiceExercise, MatchExercise } from './visual-exercises';
import { TextExercise } from './text-exercise';
import { exerciseInput, type Task, type Answer } from './exercise-adapter';

export function ExerciseInput({
  task,
  answer,
  disabled,
  onChange,
}: {
  task: Task;
  answer: Answer;
  disabled: boolean;
  onChange: (answer: Answer) => void;
}) {
  const [selected, setSelected] = useState('');
  const { locale } = useI18n();
  const copy = messages[locale];
  const input = exerciseInput(task);
  if (!input) return null;
  if (input.kind === 'text')
    return (
      <TextExercise
        answer={typeof answer === 'string' ? answer : ''}
        disabled={disabled}
        onChange={onChange}
      />
    );
  if (input.kind === 'choice')
    return (
      <ChoiceExercise
        options={input.choices}
        value={typeof answer === 'string' ? answer : ''}
        onChange={onChange}
        disabled={disabled}
        label={copy.pick}
      />
    );
  const pairs = typeof answer === 'object' ? answer : {};
  return (
    <MatchExercise
      left={input.left}
      right={input.right}
      pairs={pairs}
      selected={selected}
      onSelect={setSelected}
      disabled={disabled}
      label={copy.pair}
      removeLabel={copy.remove}
      onPair={(id) => {
        if (
          disabled ||
          !selected ||
          Object.hasOwn(pairs, selected) ||
          Object.values(pairs).includes(id)
        )
          return;
        onChange({ ...pairs, [selected]: id });
        setSelected('');
      }}
      onRemove={(id) => {
        if (disabled) return;
        const next = { ...pairs };
        delete next[id];
        onChange(next);
        setSelected('');
      }}
    />
  );
}
