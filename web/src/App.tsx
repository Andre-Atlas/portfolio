import { useEffect, useState } from 'react'
import Neuron from './components/Neuron'
import Menu from './components/Menu'
import Duality from './components/Duality'
import Anatomy from './components/Anatomy'
import Contact from './components/Contact'
import { person, ui } from './content'
import { useT } from './lib/prefs'
import { ScrollTrigger, scrollToId, startScroll } from './lib/scroll'

function Entry({ onEnter, entered }: { onEnter: () => void; entered: boolean }) {
  const t = useT()
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let id = 0
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 2600)
      setPct(p)
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
    if (!entered) return
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
