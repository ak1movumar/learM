import type { components } from '@/types/api.generated';
import type { Exercise } from './contracts';
export type Answer = string | Record<string, string>;
export type Task = Pick<Exercise, 'type' | 'options'>;
export const exerciseCapabilities = {
  translate: { input: 'text' },
  fill_gap: { input: 'text' },
  choice: { input: 'choice' },
  match: { input: 'match' },
} as const;
export class UnsupportedExerciseContractError extends Error {
  constructor(type: string) {
    super('Invalid options for exercise: ' + type);
    this.name = 'UnsupportedExerciseContractError';
  }
}
function options(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const entries = Object.entries(value);
  if (
    !entries.length ||
    entries.some(
      ([id, text]) => !id || typeof text !== 'string' || !text.trim(),
    )
  )
    return null;
  return entries.map(([id, text]) => ({ id, text: text as string }));
}
export function exerciseInput(task: Task) {
  if (task.type === 'translate' || task.type === 'fill_gap')
    return { kind: 'text' } as const;
  if (task.type === 'choice') {
    const choices = options(task.options);
    return choices && choices.length >= 2
      ? ({ kind: 'choice', choices } as const)
      : null;
  }
  const left = options(task.options.left),
    right = options(task.options.right);
  return left && right && left.length === right.length
    ? ({ kind: 'match', left, right } as const)
    : null;
}
export function canSubmitAnswer(task: Task | undefined, answer: unknown) {
  if (!task) return false;
  const input = exerciseInput(task);
  if (!input) return false;
  if (input.kind === 'text')
    return typeof answer === 'string' && !!answer.trim();
  if (input.kind === 'choice')
    return (
      typeof answer === 'string' &&
      input.choices.some((option) => option.id === answer)
    );
  if (!answer || typeof answer !== 'object' || Array.isArray(answer))
    return false;
  const pairs = Object.entries(answer);
  return (
    pairs.length === input.left.length &&
    new Set(pairs.map(([, right]) => right)).size === pairs.length &&
    pairs.every(
      ([left, right]) =>
        input.left.some((option) => option.id === left) &&
        input.right.some((option) => option.id === right),
    )
  );
}
export function canSubmitText(task: Task | undefined, answer: string) {
  return (
    !!task &&
    exerciseCapabilities[task.type].input === 'text' &&
    canSubmitAnswer(task, answer)
  );
}
export function buildExerciseSubmission(
  task: Task,
  answer: Answer,
): components['schemas']['ExerciseSubmit'] {
  if (!exerciseInput(task))
    throw new UnsupportedExerciseContractError(task.type);
  if (!canSubmitAnswer(task, answer))
    throw new Error('Incomplete or invalid answer');
  return { answer };
}
