import { useEffect, useState } from 'react'
import Neuron from './components/Neuron'
import Menu from './components/Menu'
import Duality from './components/Duality'
import Anatomy from './components/Anatomy'
import Contact from './components/Contact'
import { person, ui } from './content'
import { useT } from './lib/prefs'
import { ScrollTrigger, scrollToId, startScroll } from './lib/scroll'
import { PRELOAD, preload } from './lib/preload'

function Entry({ onEnter, entered }: { onEnter: () => void; entered: boolean }) {
  const t = useT()
  // The bar is the slower of the neuron's build (at least 2.6 s) and the real download of the
  // film, portraits and covers, so the door only opens once the next scenes can play.
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let loaded = 0
    let id = 0
    preload(PRELOAD, (p) => (loaded = p))
    const tick = () => {
      const p = Math.min((performance.now() - t0) / 2600, loaded, 1)
      setPct((q) => Math.max(q, p))
      if (p < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  const ready = pct >= 1
  return (
    <section id="home" className={`entry ${entered ? 'is-entered' : ''}`}>
      <Neuron className="entry__neuron" build={pct} />
      <div className="entry__copy">
        <h1 className="serif entry__name" aria-label={person.name}>
          {Array.from(person.name).map((ch, i) => (
            <span key={i} aria-hidden="true" style={{ animationDelay: `${0.6 + i * 0.05}s` }}>{ch === ' ' ? ' ' : ch}</span>
          ))}
        </h1>
        <p className="mono entry__status">
          {t(ui.loading)} · {String(Math.round(pct * 100)).padStart(3, '0')}%
        </p>
        <button type="button" className={`enter ${ready ? 'is-ready' : ''}`} onClick={onEnter} disabled={!ready}>
          <span className="serif">{t(ui.enter)}</span>
          <span className="mono" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

export default function App() {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !entered)
    if (!entered) {
      // The entry is a gate: no wheel, touch or keyboard scrolling past it, only the button.
      const stop = (e: Event) => e.preventDefault()
      const keys = (e: KeyboardEvent) => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key) && !(e.target as HTMLElement)?.closest?.('button')) e.preventDefault()
      }
      window.scrollTo(0, 0)
      window.addEventListener('wheel', stop, { passive: false })
      window.addEventListener('touchmove', stop, { passive: false })
      window.addEventListener('keydown', keys)
      return () => {
        window.removeEventListener('wheel', stop)
        window.removeEventListener('touchmove', stop)
        window.removeEventListener('keydown', keys)
      }
    }
    startScroll()
    ScrollTrigger.refresh()
    requestAnimationFrame(() => scrollToId('start'))
  }, [entered])
  return (
    <>
      <Menu visible={entered} />
      <main>
        <Entry entered={entered} onEnter={() => setEntered(true)} />
        {entered && (
          <>
            <Duality />
            <Anatomy />
            <Contact />
          </>
        )}
      </main>
    </>
  )
}
