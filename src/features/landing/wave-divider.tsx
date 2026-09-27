import styles from './wave-divider.module.scss';

export function WaveDivider() {
  return (
    <div className={styles.wave} aria-hidden="true">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path d="M0,0 L1440,0 L1440,35 C1200,85 960,5 720,45 C480,85 240,5 0,55 Z" />
      </svg>
    </div>
  );
}