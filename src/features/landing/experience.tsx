'use client';
import { useState } from 'react';
import { BookOpen, Check, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { Card } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import styles from './experience.module.scss';
export function LearningExperience() {
  const {
    messages: { landing: t },
  } = useI18n();
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  return (
    <section className={styles.experience}>
      <div>
        <p className={styles.eyebrow}>{t.experienceLabel}</p>
        <h2>{t.experienceTitle}</h2>
        <p>{t.experienceBody}</p>
        <div className={styles.experienceTags}>
          <span>
            <BookOpen size={17} />
            {t.progressOne}
          </span>
          <span>
            <Sparkles size={17} />
            {t.progressTwo}
          </span>
        </div>
      </div>
      <Card className={styles.exercise}>
        <p className={styles.eyebrow}>{t.exerciseLabel}</p>
        <fieldset>
          <legend>{t.exerciseQuestion}</legend>
          {['hello', 'goodbye'].map((value, index) => (
            <label key={value} className={styles.answer}>
              <input
                type="radio"
                name="landing-exercise"
                value={value}
                checked={answer === value}
                onChange={() => {
                  setAnswer(value);
                  setChecked(false);
                }}
              />
              <span>{index === 0 ? t.exerciseAnswer : t.exerciseOther}</span>
              {checked && value === answer && value === 'hello' && (
                <Check size={18} />
              )}
            </label>
          ))}
        </fieldset>
        {checked && (
          <p
            role="status"
            className={answer === 'hello' ? styles.correct : styles.incorrect}
          >
            {answer === 'hello' ? t.exerciseCorrect : t.exerciseWrong}
          </p>
        )}
        <Button disabled={!answer} onClick={() => setChecked(true)}>
          {t.exerciseCheck}
        </Button>
        <small>{t.exerciseDemo}</small>
      </Card>
    </section>
  );
}
export function ProgressPreview() {
  const {
    messages: { landing: t },
  } = useI18n();
  return (
    <section className={styles.progressSection}>
      <div className={styles.progressArt} aria-hidden="true">
        <div>
          <BookOpen />
          <span />
          <i />
        </div>
        <b />
        <div>
          <Sparkles />
          <span />
          <i />
        </div>
        <b />
        <div>
          <Trophy />
          <span />
          <CheckCircle2 />
        </div>
      </div>
      <div>
        <p className={styles.eyebrow}>{t.progressLabel}</p>
        <h2>{t.progressTitle}</h2>
        <p>{t.progressBody}</p>
        <div className={styles.progressLabels}>
          <span>{t.progressOne}</span>
          <span>{t.progressTwo}</span>
          <span>{t.progressThree}</span>
        </div>
      </div>
    </section>
  );
}
