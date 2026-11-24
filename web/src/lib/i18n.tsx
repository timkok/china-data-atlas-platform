"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";
import type { Locale } from "./types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (zh: string, en: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "zh",
  setLocale: () => {},
  toggleLocale: () => {},
  t: (zh) => zh,
});

const STORAGE_KEY = "cda-locale";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientSnapshot(): Locale {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function getServerSnapshot(): Locale {
  return "zh";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setLocale = (next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
    listeners.forEach((fn) => fn());
  };

  const toggleLocale = () => setLocale(locale === "zh" ? "en" : "zh");
  const t = (zh: string, en: string) => (locale === "zh" ? zh : en);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
