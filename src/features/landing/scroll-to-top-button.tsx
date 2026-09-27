'use client';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import styles from './scroll-to-top-button.module.scss';

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={styles.button}
      data-visible={visible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}