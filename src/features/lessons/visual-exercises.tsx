'use client';
import { Check, Link2 } from 'lucide-react';
import styles from './visual-exercises.module.scss';
export type ExerciseOption = { id: string; text: string };
export function ChoiceExercise({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: ExerciseOption[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <fieldset className={styles.choices} disabled={disabled}>
      <legend>{label}</legend>
      {options.map((option, index) => (
        <label key={option.id} className={styles.choice}>
          <input
            type="radio"
            name="exercise-choice"
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span className={styles.number}>{index + 1}</span>
          <span>{option.text}</span>
          {value === option.id && <Check size={20} aria-hidden="true" />}
        </label>
      ))}
    </fieldset>
  );
}
export function MatchExercise({
  left,
  right,
  selected,
  pairs,
  onSelect,
  onPair,
  onRemove,
  disabled,
  label,
  removeLabel,
}: {
  left: ExerciseOption[];
  right: ExerciseOption[];
  selected: string;
  pairs: Record<string, string>;
  onSelect: (id: string) => void;
  onPair: (id: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
  label: string;
  removeLabel: string;
}) {
  return (
    <div className={styles.match}>
      <p>{label}</p>
      <div className={styles.columns}>
        <div>
          {left.map((option) => (
            <button
              type="button"
              key={option.id}
              className={styles.tile}
              aria-pressed={selected === option.id}
              data-paired={Object.hasOwn(pairs, option.id)}
              disabled={disabled || Object.hasOwn(pairs, option.id)}
              onClick={() => onSelect(option.id)}
            >
              {option.text}
              {Object.hasOwn(pairs, option.id) && (
                <Check size={18} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
        <div>
          {right.map((option) => (
            <button
              type="button"
              key={option.id}
              className={styles.tile}
              data-paired={Object.values(pairs).includes(option.id)}
              disabled={
                disabled ||
                !selected ||
                Object.values(pairs).includes(option.id)
              }
              onClick={() => onPair(option.id)}
            >
              {option.text}
              {Object.values(pairs).includes(option.id) && (
                <Check size={18} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
      <ul className={styles.pairs}>
        {Object.entries(pairs).map(([a, b]) => (
          <li key={a}>
            <span>
              {left.find((item) => item.id === a)?.text}{' '}
              <Link2 size={15} aria-hidden="true" />{' '}
              {right.find((item) => item.id === b)?.text}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(a)}
              aria-label={
                removeLabel + ': ' + left.find((item) => item.id === a)?.text
              }
            >
              {removeLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
