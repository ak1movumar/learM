'use client';
import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'sidebar-collapsed';
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  window.addEventListener('storage', callback); // синхронизация между вкладками
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
};

const getSnapshot = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const getServerSnapshot = () => false;

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const setCollapsed = useCallback((value: boolean) => {
    try {
      localStorage.setItem(KEY, value ? '1' : '0');
    } catch {
      // localStorage может быть недоступен (приватный режим)
    }
    listeners.forEach((listener) => listener());
  }, []);
  return [collapsed, setCollapsed] as const;
}