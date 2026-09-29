'use client';
import { useEffect, useRef } from 'react';
import { useI18n } from '@/providers/i18n-provider';
import { experienceCopy } from '@/i18n/experience';
import { practiceFeedback } from './practice-feedback';
import type { Exercise } from './contracts';
import styles from './lesson.module.scss';
export function LessonQuestion({ item }: { item: Exercise }) {
  const { locale } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  const rule = practiceFeedback(item)?.explanation;
  const question =
    rule && item.question.startsWith(rule + '\n\n')
      ? item.question.slice(rule.length + 2)
      : item.question;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <>
      {rule && (
        <details className={styles.rule}>
          <summary>{experienceCopy[locale].rule}</summary>
          <p>{rule}</p>
        </details>
      )}
      <h1 id="exercise-title" ref={heading} tabIndex={-1}>
        {question}
      </h1>
    </>
  );
}
