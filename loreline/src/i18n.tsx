import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translations } from './data/translations'

export type Locale = 'en' | 'ko' | 'es'

export const localeOptions = [
  { code: 'en' as const, shortLabel: 'EN', nativeLabel: 'English' },
  { code: 'ko' as const, shortLabel: 'KO', nativeLabel: '한국어' },
  { code: 'es' as const, shortLabel: 'ES', nativeLabel: 'Español' },
]

const LOCALE_STORAGE_KEY = 'loreline-locale'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (text: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function resolveLocale(rawLocale: string | null | undefined): Locale | null {
  if (!rawLocale) {
    return null
  }

  const normalized = rawLocale.toLowerCase()

  if (normalized.startsWith('ko')) {
    return 'ko'
  }

  if (normalized.startsWith('es')) {
    return 'es'
  }

  if (normalized.startsWith('en')) {
    return 'en'
  }

  return null
}

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const queryLocale = resolveLocale(new URLSearchParams(window.location.search).get('lang'))

  if (queryLocale) {
    return queryLocale
  }

  const storedLocale = resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))

  if (storedLocale) {
    return storedLocale
  }

  return resolveLocale(window.navigator.language) ?? 'en'
}

function translate(locale: Locale, text: string) {
  if (locale === 'en') {
    return text
  }

  return translations[text]?.[locale] ?? text
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectInitialLocale)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale

    const url = new URL(window.location.href)
    url.searchParams.set('lang', locale)
    window.history.replaceState({}, '', url)
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (text: string) => translate(locale, text),
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)

  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }

  return context
}
