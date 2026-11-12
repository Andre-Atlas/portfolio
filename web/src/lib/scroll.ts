// Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger and Lenis share one clock.
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

export function startScroll() {
  if (lenis || reducedMotion) return lenis
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export const getLenis = () => lenis

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
// Out-only ease for snapping: starts at the speed the scroll already had, then settles.
export const settleEase = (t: number) => 1 - Math.pow(1 - t, 3)

export function scrollToY(y: number, duration = 1.6, onComplete?: () => void, easing = inOut) {
  if (lenis) lenis.scrollTo(y, { duration, easing, onComplete: () => onComplete?.() })
  else {
    window.scrollTo({ top: y, behavior: 'auto' })
    onComplete?.()
  }
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.6 })
  else el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
}

export { gsap, ScrollTrigger }
