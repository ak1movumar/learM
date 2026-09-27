import Link from 'next/link';
import styles from './layout.module.scss';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="LearM" className={styles.logo}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={compact ? 42 : 58}
        height={compact ? 42 : 58}
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M14 20 32 13l18 7-18 7-18-7Z"
          fill="#25c998"
        />

        <path
          d="M20 27v12c0 5 5 9 12 9s12-4 12-9V27l-12 5-12-5Z"
          fill="#25c998"
          opacity="0.85"
        />

        <path
          d="M27 40V28l5 7 5-7v12"
          className={styles.logoM}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!compact && <span className={styles.logoText}>LearM</span>}
    </Link>
  );
}