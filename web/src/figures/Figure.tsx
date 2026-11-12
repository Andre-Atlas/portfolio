// The site's own Hairline figures, drawn case by case with the hairline-create skill
// (github.com/lucasmarkes/hairline, MIT) on the package's engine. kernel.js is the engine as the
// skill ships it, and each figure file is exactly what the skill's checks passed; both are
// evaluated as written, the way the skill's page does, and mounted the way the package mounts.
import { useEffect, useRef } from 'react'
import kernel from './kernel.js?raw'
import binders from './binders.js?raw'
import weights from './weights.js?raw'
import containers from './containers.js?raw'
import caliper from './caliper.js?raw'
import trays from './trays.js?raw'

type Read = { textContent: string | null }
type Handle = { set: (v: number) => void; destroy: () => void }
type Def = {
  name: string
  means: string
  range: [number, number, number]
  tour: ([number, number] | null)[] | null
  mount: (host: { stage: HTMLElement; svg: SVGSVGElement; read: Read }, value: number) => Handle
}
type Kernel = {
  inject: (root: Document) => void
  mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGSVGElement
  tour: (stage: HTMLElement, stops: ([number, number] | null)[], onStop?: (i: number) => void) => { stop: () => void }
  LAP: ([number, number] | null)[]
}

const HL = new Function(`${kernel}\nreturn HL`)() as Kernel
const define = (src: string) => {
  let def: Def | null = null
  new Function('HL', 'hairline', src)(HL, (d: Def) => (def = d))
  return def as unknown as Def
}
const FIGURES = { binders, weights, containers, caliper, trays }
export type FigureName = keyof typeof FIGURES
const defs = new Map<FigureName, Def>()
const get = (name: FigureName) => {
  if (!defs.has(name)) defs.set(name, define(FIGURES[name]))
  return defs.get(name)!
}

// Intensity (0..1) to the figure's own number: two straight lines meeting at 0.5, as in the package.
const at = ([lo, mid, hi]: [number, number, number], i: number) => (i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid))

export default function Figure({ name, play = false, intensity = 0.5, label, className }: { name: FigureName; play?: boolean; intensity?: number; label?: string; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const handle = useRef<Handle | null>(null)
  const def = get(name)

  useEffect(() => {
    const stage = host.current!
    HL.inject(document)
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage)
    const read: Read = { textContent: 'rest' }
    handle.current = def.mount({ stage, svg, read }, at(def.range, intensity))
    return () => {
      handle.current?.destroy()
      handle.current = null
      svg.remove()
    }
    // intensity is applied by the effect below without remounting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def])

  useEffect(() => {
    handle.current?.set(at(def.range, intensity))
  }, [def, intensity])

  // play: an unseen pointer walks the figure's tour until a hand arrives, as the package does
  useEffect(() => {
    if (!play || !host.current) return
    const t = HL.tour(host.current, def.tour ?? HL.LAP)
    return () => t.stop()
  }, [def, play])

  return <div ref={host} className={className} data-hairline={def.name} role="img" aria-label={label ?? def.means} />
}
