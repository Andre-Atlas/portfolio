// Theme (light/dark) and language (pt/en). Both live on <html> (data-theme, lang) so CSS and
// WebGL can read them; the first visit follows the system theme and the browser language.
import { useSyncExternalStore } from 'react'
import type { Lang } from '../content'

export type Theme = 'light' | 'dark'

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    // storage blocked; the choice just won't persist
  }
}

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
let theme: Theme = (read('grid-theme') as Theme) || (systemDark.matches ? 'dark' : 'light')
let lang: Lang = (read('grid-lang') as Lang) || (navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en')

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l))

function apply() {
  document.documentElement.dataset.theme = theme
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
}
apply()

systemDark.addEventListener('change', (e) => {
  if (read('grid-theme')) return
  theme = e.matches ? 'dark' : 'light'
  apply()
  emit()
})

export function setTheme(t: Theme) {
  theme = t
  write('grid-theme', t)
  apply()
  emit()
}

export function setLang(l: Lang) {
  lang = l
  write('grid-lang', l)
  apply()
  emit()
}

export const useTheme = () => useSyncExternalStore(subscribe, () => theme)
export const useLang = () => useSyncExternalStore(subscribe, () => lang)

/** Pick the current language's string. */
export function useT() {
  const l = useLang()
  return (s: Record<Lang, string>) => s[l]
}
