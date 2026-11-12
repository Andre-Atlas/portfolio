// Scene 2: robot (left) and André (right) stacked and aligned; a vertical seam follows the
// pointer. Pointer far left reveals the whole machine, far right the whole person. The seam has
// a thin light line and a short glitch whenever it moves fast. The pointer on the left side
// pushes the seam right (more machine); on the right side it pulls it left (more human).
import { useEffect, useRef } from 'react'
import { ui } from '../content'
import { useT } from '../lib/prefs'
import { reducedMotion } from '../lib/scroll'

export default function Duality() {
  const t = useT()
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    let target = 0.504
    let x = target
    let v = 0
    let id = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      if (e.clientY < r.top || e.clientY > r.bottom) return
      const u = (e.clientX - r.left) / r.width
      // Ease toward the edges so the centre stays half and half for a while.
      target = u < 0.38 ? 0.504 - (u - 0.38) * 3.2 : u > 0.62 ? 0.504 - (u - 0.62) * 3.2 : 0.504
      target = Math.min(1.02, Math.max(-0.02, target))
    }
    const onLeave = () => (target = 0.504)
    const loop = () => {
      const nx = x + (target - x) * (reducedMotion ? 1 : 0.08)
      v = Math.abs(nx - x)
      x = nx
      el.style.setProperty('--seam', String(x))
      el.style.setProperty('--glitch', String(Math.min(1, v * 40)))
      el.style.setProperty('--ai', String(Math.min(1, Math.max(0, (x - 0.504) * 4 + 0.35))))
      el.style.setProperty('--dev', String(Math.min(1, Math.max(0, (0.504 - x) * 4 + 0.35))))
      id = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    id = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <section id="start" ref={root} className="duality">
      <div className="duality__stage" aria-hidden="true">
        <img className="duality__robot" src="/img/duality/robot.png" alt="" width={1024} height={1024} />
        <img className="duality__human" src="/img/duality/andre.png" alt="" width={1024} height={1024} />
        <span className="duality__seam" />
      </div>
      <h2 className="sr-only">André Acioli — AI Engineer & Software Developer</h2>
      <div className="duality__label duality__label--ai">
        <p className="serif duality__title">
          <svg viewBox="0 0 24 24" className="duality__icon" aria-hidden="true">
            <circle cx="12" cy="12" r="2.2" />
            <ellipse cx="12" cy="12" rx="9.5" ry="3.6" />
            <ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(-60 12 12)" />
          </svg>
          {t(ui.aiTitle)}
        </p>
        <p className="duality__line">{t(ui.aiLine)}</p>
      </div>
      <div className="duality__label duality__label--dev">
        <p className="mono duality__code">&lt; {t(ui.devTitle)} /&gt;</p>
        <p className="duality__line">{t(ui.devLine)}</p>
      </div>
      <p className="mono duality__hint" aria-hidden="true">{t(ui.hint)}</p>
    </section>
  )
}
