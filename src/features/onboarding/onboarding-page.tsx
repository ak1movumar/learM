'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { Button, IconButton } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/surface';
import { Modal } from '@/components/ui/modal';
import { ThemeSwitcher, LanguageSwitcher } from '@/components/ui/preferences';
import { useI18n } from '@/providers/i18n-provider';
import { useAuth } from '@/features/auth/auth-provider';
import { sessionStore } from '@/features/auth/session';
import { languagesOptions, coursesOptions } from '@/features/learning/queries';
import { getLearningPath } from '@/features/placement/api';
import {
  availableLanguages,
  canContinue,
  firstBeginnerLesson,
  type OnboardingDraft,
} from './model';
import { readOnboarding, saveOnboarding } from './storage';
import { onboardingCopy } from './copy';
import styles from './onboarding.module.scss';

export function OnboardingPage() {
  const { user } = useAuth();
  return user ? <Wizard key={user.id} userId={user.id} /> : null;
}
function Wizard({ userId }: { userId: string }) {
  const { locale } = useI18n();
  const t = onboardingCopy[locale];
  const router = useRouter();
  const client = useQueryClient();
  const languages = useQuery(languagesOptions());
  const courses = useQuery(coursesOptions());
  const [draft, setDraft] = useState(() => readOnboarding(userId));
  const [preferences, setPreferences] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const running = useRef(false);
  const choices = availableLanguages(languages.data ?? [], courses.data ?? []);
  const valid = canContinue(
    draft,
    choices.map((l) => l.id),
  );
  const selected = choices.find((l) => l.id === draft.language);
  const experience = ['new', 'some', 'conversation', 'unsure'] as const;
  const purposes = ['travel', 'work', 'study', 'personal'] as const;
  function update(change: Partial<OnboardingDraft>) {
    const next = { ...draft, ...change, completed: false };
    setDraft(next);
    saveOnboarding(userId, next);
    setError('');
  }
  function move(step: number) {
    update({ step });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function finish(destination: string) {
    saveOnboarding(userId, { ...draft, completed: true });
    router.replace(destination);
  }
  async function basics() {
    if (!valid || !draft.language || running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    const generation = sessionStore.getSnapshot().generation;
    try {
      const path = await getLearningPath(draft.language);
      if (generation !== sessionStore.getSnapshot().generation) return;
      const lesson = firstBeginnerLesson(path.courses);
      if (!lesson) {
        setError(t.unavailable);
        return;
      }
      await client.invalidateQueries({ queryKey: ['learning-path'] });
      if (generation === sessionStore.getSnapshot().generation)
        finish('/lessons/' + lesson);
    } catch {
      setError(t.error);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  const loading = languages.isPending || courses.isPending;
  const failed = languages.isError || courses.isError;
  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <IconButton label={t.preferences} onClick={() => setPreferences(true)}>
          <SlidersHorizontal size={20} />
        </IconButton>
      </header>
      <section className={styles.panel}>
        <div className={styles.progress}>
          <span>
            {t.step} {draft.step + 1} / 4
          </span>
          <ProgressBar label={t.step} value={(draft.step + 1) * 25} />
        </div>
        <div className={styles.icon} aria-hidden="true">
          {draft.step === 3 ? <BookOpen size={34} /> : <Compass size={34} />}
        </div>
        <p className={styles.eyebrow}>{t.intro}</p>
        <h1 ref={heading} tabIndex={-1}>
          {t.steps[draft.step]}
        </h1>
        <p className={styles.hint}>{t.hints[draft.step]}</p>
        {loading ? (
          <p role="status">{t.loading}</p>
        ) : failed ? (
          <div role="alert">
            <p>{t.error}</p>
            <Button
              onClick={() => {
                void languages.refetch();
                void courses.refetch();
              }}
            >
              {t.retry}
            </Button>
          </div>
        ) : !choices.length ? (
          <p role="status">{t.empty}</p>
        ) : (
          <>
            {draft.step === 0 && (
              <fieldset className={styles.options}>
                <legend className="sr-only">{t.steps[0]}</legend>
                {choices.map((l) => (
                  <label key={l.id} className={styles.option}>
                    <input
                      type="radio"
                      name="language"
                      checked={draft.language === l.id}
                      onChange={() => update({ language: l.id })}
                    />
                    <span className={styles.code}>{l.code.toUpperCase()}</span>
                    <strong>{l.name}</strong>
                    <Check className={styles.check} size={20} />
                  </label>
                ))}
              </fieldset>
            )}
            {draft.step === 1 && (
              <fieldset className={styles.options}>
                <legend className="sr-only">{t.steps[1]}</legend>
                {experience.map((value, i) => (
                  <label key={value} className={styles.option}>
                    <input
                      type="radio"
                      name="experience"
                      checked={draft.experience === value}
                      onChange={() => update({ experience: value })}
                    />
                    <span className={styles.code}>
                      {['01', '02', '03', '?'][i]}
                    </span>
                    <strong>{t.experience[i]}</strong>
                    <Check className={styles.check} size={20} />
                  </label>
                ))}
              </fieldset>
            )}
            {draft.step === 2 && (
              <>
                <fieldset className={styles.options}>
                  <legend className="sr-only">{t.steps[2]}</legend>
                  {purposes.map((value, i) => (
                    <label key={value} className={styles.option}>
                      <input
                        type="radio"
                        name="purpose"
                        checked={draft.purpose === value}
                        onChange={() => update({ purpose: value })}
                      />
                      <strong>{t.purposes[i]}</strong>
                      <Check className={styles.check} size={20} />
                    </label>
                  ))}
                </fieldset>
                <fieldset className={styles.minutes}>
                  <legend>{t.daily}</legend>
                  {([5, 10, 15] as const).map((value) => (
                    <label key={value} className={styles.option}>
                      <input
                        type="radio"
                        name="minutes"
                        checked={draft.minutes === value}
                        onChange={() => update({ minutes: value })}
                      />
                      <strong>
                        {value} {t.minutes}
                      </strong>
                    </label>
                  ))}
                </fieldset>
              </>
            )}
            {draft.step === 3 && (
              <>
                <div className={styles.summary}>
                  <span>{t.summary}</span>
                  <strong>
                    {selected?.name ?? '—'} · {draft.minutes} {t.minutes}
                  </strong>
                  <p>
                    {draft.purpose &&
                      t.purposes[purposes.indexOf(draft.purpose)]}
                  </p>
                </div>
                <div className={styles.finish}>
                  <p>
                    {draft.experience === 'new' ? t.basicsHint : t.testHint}
                  </p>
                  {draft.experience === 'new' ? (
                    <>
                      <Button
                        size="lg"
                        loading={busy}
                        disabled={!valid}
                        onClick={() => void basics()}
                      >
                        {t.basics}
                        <ArrowRight size={18} />
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!valid || busy}
                        onClick={() => finish('/level-tests/' + draft.language)}
                      >
                        {t.test}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        disabled={!valid || busy}
                        onClick={() => finish('/level-tests/' + draft.language)}
                      >
                        {t.test}
                        <ArrowRight size={18} />
                      </Button>
                      <Button
                        variant="secondary"
                        loading={busy}
                        disabled={!valid}
                        onClick={() => void basics()}
                      >
                        {t.skip}
                      </Button>
                    </>
                  )}
                </div>
                <small className={styles.hint}>{t.storage}</small>
              </>
            )}
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <footer className={styles.controls}>
              <Button
                variant="ghost"
                disabled={draft.step === 0 || busy}
                onClick={() => move(draft.step - 1)}
              >
                <ArrowLeft size={18} />
                {t.back}
              </Button>
              {draft.step < 3 && (
                <Button disabled={!valid} onClick={() => move(draft.step + 1)}>
                  {t.next}
                  <ArrowRight size={18} />
                </Button>
              )}
            </footer>
          </>
        )}
      </section>
      <Modal
        open={preferences}
        onClose={() => setPreferences(false)}
        title={t.preferences}
      >
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Modal>
    </main>
  );
}
