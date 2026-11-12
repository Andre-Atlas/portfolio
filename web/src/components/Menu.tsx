// Top-right menu: a 3×3 dot grid that folds into an X, opening a translucent panel with the
// scene shortcuts, the PT/EN switch and the animated sun/moon theme toggle.
import { useEffect, useState } from 'react'
import { ui, person } from '../content'
import { setLang, setTheme, useLang, useT, useTheme } from '../lib/prefs'
import { scrollToId } from '../lib/scroll'

const LINKS = [
  { id: 'home', label: ui.nav.home },
  { id: 'start', label: ui.nav.start },
  { id: 'about', label: ui.nav.about },
  { id: 'projects', label: ui.nav.projects },
  { id: 'contact', label: ui.nav.contact },
] as const

export default function Menu({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const lang = useLang()
  const theme = useTheme()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <div className={`menu ${visible ? 'is-visible' : ''} ${open ? 'is-open' : ''}`}>
      <div className="menu__bar">
        <div className="menu__prefs">
          <button type="button" className="lang" onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} aria-label={t(ui.language)}>
            <span className={lang === 'pt' ? 'on' : ''}>PT</span>
            <span className={lang === 'en' ? 'on' : ''}>EN</span>
          </button>
          <button type="button" className={`theme theme--${theme}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t(ui.theme)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <mask id="moon-cut">
                <rect width="24" height="24" fill="#fff" />
                <circle className="theme__cut" cx="17" cy="7" r="7" fill="#000" />
              </mask>
              <circle className="theme__core" cx="12" cy="12" r="5" mask="url(#moon-cut)" />
              <g className="theme__rays">
                {Array.from({ length: 8 }, (_, i) => (
                  <line key={i} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${i * 45} 12 12)`} />
                ))}
              </g>
            </svg>
          </button>
        </div>
        <button type="button" className="menu__toggle" aria-expanded={open} aria-controls="menu-panel" aria-label={t(open ? ui.close : ui.menu)} onClick={() => setOpen((o) => !o)}>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} />
          ))}
        </button>
      </div>
      <nav id="menu-panel" className="menu__panel" aria-label={t(ui.menu)} hidden={!open}>
        <ol>
          {LINKS.map((l, i) => (
            <li key={l.id} style={{ transitionDelay: `${open ? 80 + i * 45 : 0}ms` }}>
              <a href={`#${l.id}`} onClick={(e) => (e.preventDefault(), go(l.id))}>
                <span className="mono">0{i + 1}</span>
                <span className="serif">{t(l.label)}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="menu__foot mono">
          <a href={person.links.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={person.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={`mailto:${person.email}`}>E-mail</a>
        </p>
      </nav>
    </div>
  )
}
