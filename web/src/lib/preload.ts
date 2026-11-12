// Everything the scenes after the entry need, fetched while the entry plays so the robot film,
// the duality portraits and the covers are in the browser cache before the visitor gets in.
// Progress is by bytes.
import { asset } from './asset'
import { projects } from '../content'

export const CLIP_COUNT = 5
export const PRELOAD = [
  ...Array.from({ length: CLIP_COUNT }, (_, i) => asset(`video/anatomy-${i + 1}.mp4`)),
  asset('img/duality/robot.png'),
  asset('img/duality/andre.png'),
  ...projects.map((p) => asset(`img/covers/${p.slug}.webp`)),
]

export function preload(urls: string[], onProgress: (p: number) => void): Promise<void> {
  // Until a file's size arrives it is guessed, so the bar never jumps backwards much.
  const GUESS = 3e6
  const done = new Array(urls.length).fill(0)
  const size = new Array(urls.length).fill(GUESS)
  const report = () => onProgress(Math.min(1, done.reduce((a, b) => a + b, 0) / size.reduce((a, b) => a + b, 0)))
  return Promise.all(
    urls.map(async (url, i) => {
      try {
        const res = await fetch(url, { cache: 'force-cache' })
        size[i] = Number(res.headers.get('content-length')) || GUESS
        if (res.body) {
          const reader = res.body.getReader()
          for (;;) {
            const { done: end, value } = await reader.read()
            if (end) break
            done[i] += value.length
            report()
          }
        } else await res.arrayBuffer()
      } catch {
        // A missing file must not hold the door shut: count it as settled.
      }
      size[i] = done[i] = Math.max(done[i], 1)
      report()
    }),
  ).then(() => onProgress(1))
}
