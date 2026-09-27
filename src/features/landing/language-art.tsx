import Image from 'next/image';
import { cn } from '@/lib/cn';
import styles from './language-art.module.scss';

export function LanguageArt({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(styles.art, compact && styles.compactArt)}
      aria-hidden="true"
    >
      <Image
        src="/learm-travelers-community.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(styles.heroImage, styles.darkImage)}
      />
      <Image
        src="/learm-travelers-community-light.png"
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn(styles.heroImage, styles.lightImage)}
      />
      {!compact && (
        <>
          <span className={styles.greetingOne}>
            Hello! <small>English</small>
          </span>
          <span className={styles.greetingTwo}>
            Салам! <small>Кыргызча</small>
          </span>
          <span className={styles.greetingThree}>
            Bonjour! <small>Français</small>
          </span>
        </>
      )}
    </div>
  );
}