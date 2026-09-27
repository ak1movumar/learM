'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { isLocale, localeNames, locales } from '@/i18n/config';
import { cn } from '@/lib/cn';
import styles from './header-preferences.module.scss';

const subscribe = () => () => {};

export function HeaderPreferences() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();
  const {
    locale,
    setLocale,
    messages: { ui },
  } = useI18n();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div className={styles.pill}>
      <div className={styles.langWrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.langButton}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ui.language}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{locale.toUpperCase()}</span>
          <ChevronDown
            size={14}
            className={cn(styles.chevron, open && styles.chevronOpen)}
            aria-hidden="true"
          />
        </button>
        {open && (
          <ul className={styles.menu} role="listbox" aria-label={ui.language}>
            {locales.map((value) => (
              <li key={value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === locale}
                  className={cn(
                    styles.menuItem,
                    value === locale && styles.menuItemActive,
                  )}
                  onClick={() => {
                    if (isLocale(value)) setLocale(value);
                    setOpen(false);
                  }}
                >
                  {localeNames[value]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.themeButton}
        disabled={!mounted}
        aria-label={isDark ? ui.light : ui.dark}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  );
}