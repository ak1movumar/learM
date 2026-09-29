'use client';
import Link from 'next/link';
import { useI18n } from '@/providers/i18n-provider';
import { cn } from '@/lib/cn';
import { mobileKeys, navigation, type NavigationKey } from './navigation';
import styles from './layout.module.scss';

const tones: Record<string, number> = { learning: 0, connect: 1, account: 2 };

export function MobileBottomNav({
  active,
  onNavigate,
}: {
  active: NavigationKey;
  onNavigate?: (key: NavigationKey) => void;
}) {
  const {
    messages: { nav },
  } = useI18n();
  return (
    <nav aria-label={nav.navigation} className={styles.bottomNav}>
      {mobileKeys.map((key) => {
        const item = navigation.find((item) => item.key === key)!;
        const Icon = item.icon;
        return (
          <Link
            key={key}
            href={item.href}
            data-tone={tones[item.group] ?? 0}
            aria-current={!onNavigate && active === key ? 'page' : undefined}
            className={cn(
              styles.bottomLink,
              active === key && styles.bottomActive,
            )}
            onClick={(event) => {
              if (onNavigate) {
                event.preventDefault();
                onNavigate(key);
              }
            }}
          >
            <i className={styles.bottomIcon} aria-hidden="true">
              <Icon size={20} strokeWidth={1.75} />
            </i>
            <span>{nav[key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}