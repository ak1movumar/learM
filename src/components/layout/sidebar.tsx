'use client';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/surface';
import { IconButton } from '@/components/ui/button';
import { LanguageSwitcher, ThemeSwitcher } from '@/components/ui/preferences';
import { navigation, type NavigationKey } from './navigation';
import { Logo } from './logo';
import styles from './layout.module.scss';
export type SidebarProps = {
  active: NavigationKey;
  collapsed: boolean;
  onCollapse: () => void;
  onNavigate?: (key: NavigationKey) => void;
  identity?: { name: string; description: string };
};
export function Sidebar({
  active,
  collapsed,
  onCollapse,
  onNavigate,
  identity,
}: SidebarProps) {
  const {
    messages: { nav },
  } = useI18n();
  return (
    <aside className={cn(styles.sidebar, collapsed && styles.collapsed)}>
      <div className={styles.brand}>
        <Logo compact={collapsed} />
        <IconButton
          label={collapsed ? nav.expand : nav.collapse}
          onClick={onCollapse}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} />
          ) : (
            <PanelLeftClose size={17} />
          )}
        </IconButton>
      </div>
      <nav aria-label={nav.navigation} className={styles.navigation}>
        {(['learning', 'connect', 'account'] as const).map((group, index) => (
          <div className={styles.navGroup} key={group}>
            <p className={styles.groupLabel}>{nav[group]}</p>
            {navigation
              .filter((item) => item.group === group)
              .map(({ key, href, icon: Icon }) => (
                <Link
                  key={key}
                  href={href}
                  data-tone={index}
                  title={nav[key]}
                  aria-label={nav[key]}
                  aria-current={
                    !onNavigate && key === active ? 'page' : undefined
                  }
                  className={cn(
                    styles.navLink,
                    key === active && styles.navActive,
                  )}
                  onClick={(event) => {
                    if (onNavigate) {
                      event.preventDefault();
                      onNavigate(key);
                    }
                  }}
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    <Icon size={19} strokeWidth={1.75} />
                  </span>
                  <span className={styles.navLabel}>{nav[key]}</span>
                  {key === active && <i aria-hidden="true" />}
                </Link>
              ))}
          </div>
        ))}
      </nav>
      <div className={styles.sidebarBottom}>
        <div className={styles.preferences}>
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className={styles.user}>
          <Avatar name={identity?.name ?? 'LearM'} />
          <div>
            <strong>{identity?.name ?? nav.guest}</strong>
            <span>{identity?.description ?? nav.guestHint}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}