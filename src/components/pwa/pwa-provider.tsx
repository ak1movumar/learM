'use client';
import Image from 'next/image';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useTheme } from 'next-themes';
import styles from './pwa.module.scss';

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const InstallContext = createContext<{
  installed: boolean;
  install: (() => Promise<void>) | null;
}>({ installed: false, install: null });
export const usePwaInstall = () => useContext(InstallContext);

export function PwaProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [splash, setSplash] = useState(true);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSplash(false), 1100);
    const mode = matchMedia('(display-mode: standalone)');
    const update = () =>
      setInstalled(
        mode.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    const initial = window.setTimeout(update, 0);
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const completed = () => {
      setInstalled(true);
      setPrompt(null);
    };
    mode.addEventListener('change', update);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', completed);
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator &&
      window.isSecureContext
    ) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .catch(() => {
          /* Installation remains available without offline fallback. */
        });
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(initial);
      mode.removeEventListener('change', update);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', completed);
    };
  }, []);
  useEffect(() => {
    if (!resolvedTheme) return;
    const dark = resolvedTheme === 'dark';
    const manifest = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );
    if (manifest)
      manifest.href = `/manifest.webmanifest?theme=${dark ? 'dark' : 'light'}`;
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = dark ? '#0c1020' : '#ffffff';
      });
  }, [resolvedTheme]);
  const install = prompt
    ? async () => {
        try {
          await prompt.prompt();
          await prompt.userChoice;
        } finally {
          setPrompt(null);
        }
      }
    : null;
  return (
    <InstallContext.Provider value={{ installed, install }}>
      {children}
      {splash && (
        <div className={styles.splash} aria-hidden="true">
          <div className={styles.brand}>
            <Image
              src="/icon.svg"
              alt=""
              width={112}
              height={112}
              priority
              unoptimized
            />
            <div className={styles.name}>
              Lear<span>M</span>
            </div>
          </div>
          <Image
            className={styles.community}
            src="/community-logo.jpg"
            alt=""
            width={100}
            height={100}
            priority
          />
        </div>
      )}
    </InstallContext.Provider>
  );
}
