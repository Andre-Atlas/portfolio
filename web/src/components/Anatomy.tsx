// Scenes 3 and 4 share one pinned stage, cut as a sequence of camera shots in two stretches of
// film. First: the face pulls back to the whole robot, which opens up as its parts drift off the
// endoskeleton, and the camera orbits the exploded machine. A break (How I work) takes the film
// off screen. Second: the whole robot takes the Vitruvian pose; a second break (Stack); the
// camera orbits the Vitruvian machine to three quarters for the projects. Every clip starts and
// ends still, so no seam needs patching. Each shot ends on a rest: the frame and the copy settle
// there, scrolling snaps to it and the arrow keys step from one rest to the next.
// See docs/arquitetura.md.
import { useEffect, useRef, useState } from 'react'
import KeyedFilm, { type FilmSource, type FilmView } from './KeyedFilm'
import { about, breaks, projects, ui } from '../content'
import { useT } from '../lib/prefs'
import { asset } from '../lib/asset'
import Figure, { type FigureName } from '../figures/Figure'
import { ScrollTrigger, getLenis, reducedMotion, scrollToY, settleEase } from '../lib/scroll'

// Timeline: face→body, opening, orbit to the diagonal | body→Vitruvian pose | orbit to 3/4.
const CLIPS = [1, 2, 3, 4, 5].map((n) => asset(`video/anatomy-${n}.mp4`))
// One still per shot, used until the clips are deployed (the breaks hide theirs).
const STILLS = ['corpo-inteiro', 'explodido', 'lateral', 'vitruviano', 'vitruviano', 'vitruviano', 'vitruviano-34'].map((n) => asset(`img/anatomy/${n}.png`))

// Shots, one per rest. `f` is the film position at the rest (clip index + fraction; a rest at the
// end of a clip sits just before the integer, which belongs to the next clip); `view` frames the
// film there; `dir`/`rot` say where the copy drifts as the camera moves on. A break hides the
// film; its view is the next shot's, so nothing pans while it is away.
type Shot = { f: number; view: FilmView; dir: [number, number]; rot: number; brk?: boolean }
const END = 0.995
const SHOTS: Shot[] = [
  { f: END, view: { zoom: 1, x: 0.17, y: 0, blur: 0 }, dir: [0, -70], rot: 0 },               // intro: whole robot, front
  { f: 1 + END, view: { zoom: 1, x: -0.17, y: 0, blur: 0 }, dir: [-140, 0], rot: 12 },        // LLM: opened up, front
  { f: 2 + END, view: { zoom: 1, x: 0.17, y: 0, blur: 0 }, dir: [140, 0], rot: -12 },         // ML: exploded, diagonal
  { f: 3, view: { zoom: 1, x: -0.17, y: 0, blur: 0 }, dir: [0, -60], rot: 0, brk: true },     // break: how I work
  { f: 3 + END, view: { zoom: 1, x: -0.17, y: 0, blur: 0 }, dir: [0, -90], rot: 8 },          // </>: Vitruvian, front
  { f: 4, view: { zoom: 1, x: -0.17, y: 0, blur: 0 }, dir: [0, -60], rot: 0, brk: true },     // break: stack
  { f: 5, view: { zoom: 1.04, x: -0.2, y: 0, blur: 0 }, dir: [160, 0], rot: -14 },            // projects: three quarters
]
// Scroll budget, in vh per shot: the move into it, then the hold at it. A clip gets ~130vh; the
// move into a break only fades the film, and the move out of one holds the next clip's first
// frame until the film is back, then plays it.
const BUDGET: [number, number][] = [[60, 40], [130, 40], [130, 40], [90, 50], [170, 40], [90, 50], [150, 40]]
const RUN = BUDGET.reduce((a, [m, h]) => a + m + h, 0)
const HEIGHT_VH = RUN + 100
// Scroll progress → shot space s (rest i at s = i); the flat stretches are the holds.
const KEYS: [number, number][] = [[0, -1]]
const RESTS: number[] = []
BUDGET.reduce((y, [m, h], i) => {
  KEYS.push([(y + m) / RUN, i])
  RESTS.push((y + m + h / 2) / RUN)
  KEYS.push([(y + m + h) / RUN, i])
  return y + m + h
}, 0)
const PROJECTS = SHOTS.length - 1
// Where the robot's centre sits horizontally at the end of the last clip (fraction of width).
const ORBIT_END_X = -0.24
const ORBIT_TURN = -12
// With the list open the camera pulls back so the plate clears the cover panel.
const LIST_ZOOM = 0.64
const LIST_X = -0.27
const NARROW_ZOOM = 1.9
const NARROW_Y = 0.2
const PLATE_RATIO = 1.111
// Snap after free scrolling: waits this long after the last scroll, and only within this many
// screen heights of a shot.
const SNAP_DELAY = 420
const SNAP_REACH = 0.6

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function piecewise(keys: [number, number][], x: number) {
  if (x <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i]
    const [x0, y0] = keys[i - 1]
    if (x <= x1) return lerp(y0, y1, sstep(0, 1, (x - x0) / (x1 - x0 || 1)))
  }
  return keys[keys.length - 1][1]
}
// How far the film is on screen: gone at a break, back once the move out of it is under way.
const filmFade = (s: number) => SHOTS.reduce((a, sh, j) => (sh.brk ? a * sstep(0.12, s < j ? 0.55 : 0.42, Math.abs(s - j)) : a), 1)
// Film position for shot space s: before the first rest the first clip runs from its start. Out
// of a break the next clip waits on its first frame until the film has faded back in.
function filmAt(s: number) {
  if (s < 0) return SHOTS[0].f * (s + 1)
  const i = clamp(Math.floor(s), 0, SHOTS.length - 2)
  const k = s - i
  const a = SHOTS[i]
  const b = SHOTS[i + 1]
  return lerp(a.f, b.f, sstep(a.brk ? 0.42 : 0, 1, k))
}

export default function Anatomy() {
  const t = useT()
  const position = useRef({ current: 0 })
  const fade = useRef({ current: 1 })
  const view = useRef({ current: { ...SHOTS[0].view } as FilmView })
  const root = useRef<HTMLElement>(null)
  const texts = useRef<(HTMLElement | null)[]>([])
  const vitru = useRef<SVGSVGElement>(null)
  const circle = useRef<SVGCircleElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const listShift = useRef(0)
  const openRef = useRef(false)
  const autoOpened = useRef(false)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(0)
  const [active, setActive] = useState(-1) // shot whose copy is fully set
  const [film, setFilm] = useState<FilmSource | null>(null)
  const stillMode = useRef(true)
  const reframe = useRef<() => void>(() => {})

  // Use the clips when all are deployed; otherwise the stills.
  useEffect(() => {
    Promise.all(CLIPS.map((c) => fetch(c, { method: 'HEAD' }).then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith('video'))))
      .then((ok) => {
        stillMode.current = !ok.every(Boolean)
        setFilm(stillMode.current ? { clips: [], stills: STILLS } : { clips: CLIPS, stills: STILLS })
      })
      .catch(() => setFilm({ clips: [], stills: STILLS }))
  }, [])

  useEffect(() => {
    openRef.current = open
    const measure = () => {
      listShift.current = 0
      reframe.current()
      if (!open || !circle.current || !panel.current || window.innerWidth < 860) return
      const over = circle.current.getBoundingClientRect().right + 28 - panel.current.getBoundingClientRect().left
      listShift.current = Math.max(0, over) / window.innerWidth
      reframe.current()
    }
    const id = window.setTimeout(measure, 40)
    return () => window.clearTimeout(id)
  }, [open])

  // Scrub: scroll → shot space → film position, framing, copy and the Vitruvian plate.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: '#anatomy',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => apply(self.progress),
    })
    function apply(progress: number) {
        const s = piecewise(KEYS, progress)
        const narrow = window.innerWidth < 860
        position.current.current = stillMode.current ? clamp(s, 0, SHOTS.length - 1) : filmAt(s)
        const shown = filmFade(s)
        fade.current.current = shown
        const i = clamp(Math.floor(s), 0, SHOTS.length - 2)
        const k = clamp(s - i)
        const a = SHOTS[i].view
        const b = SHOTS[i + 1].view
        const listing = openRef.current ? 1 : 0
        const baseX = lerp(a.x, b.x, k)
        // Phones: closer camera, robot in the upper half, copy card below it.
        const v: FilmView = {
          zoom: lerp(a.zoom, b.zoom, k) * lerp(1, narrow ? 0.86 : LIST_ZOOM, listing) * (narrow ? NARROW_ZOOM : 1),
          x: narrow ? 0 : lerp(baseX, LIST_X, listing) - listShift.current,
          y: narrow ? NARROW_Y : lerp(a.y, b.y, k),
          blur: listing * 1.5,
        }
        view.current.current = v

        // Copy: fully set at its rest, drifting with the camera and blurring as it leaves.
        texts.current.forEach((el, j) => {
          if (!el) return
          const d = s - j
          const far = Math.abs(d)
          const o = 1 - sstep(0.12, 0.55, far)
          const [dx, dy] = SHOTS[j].dir
          el.style.opacity = String(o)
          el.style.setProperty('--in', String(sstep(0.5, 0.95, o)))
          el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
          el.style.filter = far > 0.02 ? `blur(${(sstep(0.15, 0.55, far) * 3).toFixed(2)}px)` : 'none'
          el.style.transform = narrow
            ? `translateY(${d * 40}px)`
            : `perspective(1200px) translate(${d * dx}px, ${d * dy}px) rotateY(${d * SHOTS[j].rot}deg)`
          el.style.pointerEvents = o > 0.6 ? 'auto' : 'none'
        })
        // The list opens by itself once the projects shot arrives (scrolling, the arrow keys or the
        // menu's Projetos link) and closes again on the way back; the head button still toggles it.
        if (s >= PROJECTS - 0.08 && !autoOpened.current) {
          autoOpened.current = true
          setOpen(true)
        } else if (s < PROJECTS - 0.6) {
          autoOpened.current = false
          if (openRef.current) setOpen(false)
        }
        const near = Math.round(s)
        setActive(Math.abs(s - near) < 0.06 ? near : -1)

        // Vitruvian plate: drawn as the robot reassembles, then turns with the orbit.
        const svg = vitru.current
        if (svg) {
          const draw = sstep(3.75, 4, s)
          const orbit = sstep(5.42, 6, s)
          const x0 = narrow ? 0 : SHOTS[4].view.x
          const x = narrow ? 0 : lerp(lerp(x0, ORBIT_END_X, orbit), LIST_X, listing) - listShift.current
          svg.style.setProperty('--draw', String(draw))
          svg.style.opacity = String(draw * shown)
          // The plate is sized against the film frame: 1.111 × the frame height at zoom 1 (calibrated
          // on the last Vitruvian frame), whatever the viewport's shape.
          const W = window.innerWidth
          const H = window.innerHeight
          const frameH = W / H > 16 / 9 ? H : (W * 9) / 16
          const plate = (PLATE_RATIO * frameH * v.zoom) / Math.min(W, H)
          svg.style.transform = `perspective(1600px) translate(${x * 100}%, ${-v.y * 100}%) rotateY(${ORBIT_TURN * orbit}deg) scale(${plate})`
        }
    }
    reframe.current = () => apply(st.progress)
    apply(st.progress)
    return () => st.kill()
  }, [])

  // Rests: snap after scrolling stops, and step between them with the keyboard.
  useEffect(() => {
    const section = root.current!
    const stops = () => {
      const top = section.offsetTop
      const run = section.offsetHeight - window.innerHeight
      const start = document.getElementById('start')
      return [start ? start.offsetTop : top - window.innerHeight, ...RESTS.map((r) => top + r * run), top + section.offsetHeight]
    }
    let moving = false
    let queued = 0
    let target = window.scrollY
    let guard = 0
    let pending: number | null = null // target of a move that has not arrived yet
    let touched = 0 // last time the user scrolled by hand
    const onHand = () => {
      touched = performance.now()
      pending = null
    }
    // `gentle` is the snap after free scrolling: slower and eased out, so it reads as the page
    // coming to rest rather than being pulled.
    const go = (y: number, gentle = false) => {
      moving = true
      target = y
      pending = y
      const dist = Math.abs(y - window.scrollY) / window.innerHeight
      const dur = reducedMotion ? 0 : gentle ? clamp(0.9 + dist * 0.9, 0.9, 1.6) : clamp(0.7 + dist * 0.28, 0.7, 2.4)
      window.clearTimeout(guard)
      // If the user takes over mid-move the tween never completes; release after its length.
      guard = window.setTimeout(() => {
        moving = false
        settle()
      }, dur * 1000 + 300)
      scrollToY(y, dur, () => {
        window.clearTimeout(guard)
        moving = false
        pending = null
        if (queued) {
          const q = Math.sign(queued)
          queued -= q
          if (!step(q)) queued = 0
        }
      }, gentle ? settleEase : undefined)
    }
    const step = (dir: number) => {
      const ys = stops()
      const y = moving ? target : window.scrollY
      const next = dir > 0 ? ys.find((s) => s > y + 4) : [...ys].reverse().find((s) => s < y - 4)
      if (next === undefined) return false
      go(next)
      return true
    }
    const inRange = (y: number) => {
      const ys = stops()
      return y >= ys[0] - 4 && y <= ys[ys.length - 1] + 4
    }
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.querySelector('.menu.is-open')) return
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)
      if (!down && !up) return
      const y = moving ? target : window.scrollY
      if (!inRange(y)) return
      const ys = stops()
      // Leave the sequence with the browser's own scrolling at both ends.
      if (down && y >= ys[ys.length - 1] - 4) return
      if (up && y <= ys[0] + 4) return
      e.preventDefault()
      if (moving) {
        // Each press is one shot; presses against the current direction cancel queued ones.
        queued = clamp(queued + (down ? 1 : -1), -4, 4)
        return
      }
      step(down ? 1 : -1)
    }
    // Snap to the nearest stop once the wheel or trackpad settles inside the sequence.
    let timer = 0
    const settle = () => {
      if (moving) return
      const y = window.scrollY
      const ys = stops()
      // A step that stalled on its way (no hand scrolling since) resumes toward its target.
      if (pending !== null && Math.abs(pending - y) > 2 && performance.now() - touched > 400) return go(pending)
      if (y <= ys[0] + 2 || y >= ys[ys.length - 1] - 2) return
      const nearest = ys.reduce((m, s) => (Math.abs(s - y) < Math.abs(m - y) ? s : m), ys[0])
      // Only settle when the reader stopped close to a shot; farther away the page stays put.
      const d = Math.abs(nearest - y)
      if (d > 2 && d < window.innerHeight * SNAP_REACH) go(nearest, true)
    }
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, SNAP_DELAY)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onHand, { passive: true })
    window.addEventListener('touchstart', onHand, { passive: true })
    const lenis = getLenis()
    if (lenis) lenis.on('scroll', onScroll)
    else window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onHand)
      window.removeEventListener('touchstart', onHand)
      if (lenis) lenis.off('scroll', onScroll)
      else window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  const anchor = (r: number) => `${((r * (HEIGHT_VH - 100)) / HEIGHT_VH) * 100}%`
  const setText = (j: number) => (n: HTMLElement | null) => {
    texts.current[j] = n
  }
  const layouts = ['shot--right', 'shot--left', 'shot--right']
  // The about blocks sit on shots 1, 2 and 4 (3 and 5 are the breaks).
  const BLOCK_SHOTS = [1, 2, 4]

  return (
    <section id="anatomy" ref={root} className="anatomy" style={{ height: `${HEIGHT_VH}vh` }}>
      <span id="about" className="anchor" style={{ top: anchor(RESTS[0]) }} />
      <span id="projects" className="anchor" style={{ top: anchor(RESTS[PROJECTS]) }} />
      <div className={`anatomy__stage ${open ? 'is-listing' : ''}`}>
        {film && <KeyedFilm source={film} position={position.current} view={view.current} fade={fade.current} />}
        <svg ref={vitru} className="vitru" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <circle ref={circle} cx="50" cy="54" r="43" pathLength={1} />
          <rect x="11" y="15" width="78" height="81" pathLength={1} />
          <text x="50" y="99.5" textAnchor="middle">Machina Vitruviana</text>
        </svg>

        <div className="about">
          <div ref={setText(0)} className="shot shot--left about__intro">
            <p className="mono about__kicker">{t(about.kicker)} · 01</p>
            <h2 className="serif about__title">{t(about.title)}</h2>
            <p className="about__text">{t(about.intro)}</p>
          </div>
          {about.blocks.map((b, i) => (
            <div key={b.tag} ref={setText(BLOCK_SHOTS[i])} className={`shot ${layouts[i]} about__block`}>
              <div>
                <Figure name={b.figure as FigureName} className="about__figure" intensity={0.6} play={active === BLOCK_SHOTS[i]} label={t(b.title)} />
                <p className="mono about__tag">{b.tag}</p>
                <h3 className="serif">{t(b.title)}</h3>
                <p>{t(b.body)}</p>
              </div>
            </div>
          ))}

          <section ref={setText(3)} className="shot brk" aria-labelledby="brk-work">
            <Figure name={breaks.work.figure} className="brk__figure" intensity={0.6} play={active === 3} label={t(breaks.work.title)} />
            <div className="brk__copy">
              <p className="mono about__kicker">{t(breaks.work.kicker)}</p>
              <h3 id="brk-work" className="serif brk__title">{t(breaks.work.title)}</h3>
              <ol className="brk__points">
                {breaks.work.points.map((pt, i) => (
                  <li key={i}>
                    <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h4 className="serif">{t(pt.title)}</h4>
                      <p>{t(pt.body)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section ref={setText(5)} className="shot brk" aria-labelledby="brk-stack">
            <Figure name={breaks.stack.figure} className="brk__figure" intensity={0.6} play={active === 5} label={t(breaks.stack.title)} />
            <div className="brk__copy">
              <p className="mono about__kicker">{t(breaks.stack.kicker)}</p>
              <h3 id="brk-stack" className="serif brk__title">{t(breaks.stack.title)}</h3>
              <dl className="brk__groups">
                {breaks.stack.groups.map((gr, i) => (
                  <div key={i}>
                    <dt className="mono">{t(gr.name)}</dt>
                    <dd>{gr.items.join('  ·  ')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </div>

        <div ref={setText(PROJECTS)} className="projects">
          <button type="button" className="projects__head" aria-expanded={open} aria-controls="project-list" onClick={() => setOpen((o) => !o)}>
            <span className="serif">{t(ui.projects)}</span>
            <span className="mono">{String(projects.length).padStart(2, '0')}</span>
          </button>
          <div id="project-list" className={`projects__list ${open ? 'is-open' : ''}`}>
            <div className="projects__inner">
              <ul>
                {projects.map((pr, i) => (
                  <li key={pr.slug} onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} className={hover === i ? 'is-active' : ''}>
                    <a href={pr.repoUrl} target="_blank" rel="noreferrer">
                      <span className="serif projects__name"><i aria-hidden="true">→</i>{pr.title}</span>
                      <span className="mono projects__kind">{t(pr.kind)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!open && <p className="mono projects__cta">{t(ui.openProjects)} ↓</p>}
          {/* Cover panel: always left of the list, outside its flow, so hovering never moves the list. */}
          <div ref={panel} className={`projects__panel ${open ? 'is-open' : ''}`} aria-live="polite">
            {projects.map((pr, i) => (
              <figure key={pr.slug} className={`projects__card ${hover === i ? 'is-on' : ''}`} aria-hidden={hover !== i}>
                <img src={asset(`img/covers/${pr.slug}.webp`)} alt="" loading="lazy" />
                <figcaption>
                  <p className="projects__summary">{t(pr.summary)}</p>
                  <p className="mono projects__stack">{pr.stack.join(' · ')}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
