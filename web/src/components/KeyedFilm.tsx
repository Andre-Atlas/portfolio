// Scroll-scrubbed film of the robot on green screen. A shader keys out the green (by chroma
// direction, so shadowed green goes too), erodes the matte edge by a pixel and turns the metal
// grey, so one clip sits on both themes. `position` runs from 0 to the number of clips: clip i
// plays as it goes from i to i + 1, so each integer is a keyframe where two clips meet.
// Every clip starts and ends on a still frame, and clips that do not continue each other are
// separated by a break, where `fade` takes the film off screen while the position crosses over.
// Without clips it falls back to keyed stills (one per integer) with a blur dissolve: the
// outgoing frame blurs away before the next one resolves, never a sharp double exposure.
// Textures stay in sRGB on purpose: the shader writes straight to the sRGB canvas.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`
const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uAlphaA;
uniform float uAlphaB;
uniform float uBlurA;    // blur radius in pixels of the source
uniform float uBlurB;
uniform float uKey;      // 1 for green-screen video, 0 for already-keyed PNG stills
uniform vec2 uRes;
uniform vec2 uSrc;
uniform float uZoom;
uniform vec2 uShift;
uniform float uInk;      // 0 dark theme (metal as is), 1 light theme (slightly deepened)
uniform float uFade;     // 1 on screen, 0 gone (breaks)

const vec2 KEY = vec2(-0.104, -0.311); // CbCr of the Flow chroma green #00B140
vec2 contain(vec2 uv) {
  float rs = uRes.x / uRes.y, rv = uSrc.x / uSrc.y;
  vec2 s = rs > rv ? vec2(rs / rv, 1.0) : vec2(1.0, rv / rs);
  return (uv - 0.5 - uShift) * s / uZoom + 0.5;
}
float matte(vec3 c) {
  vec2 cbcr = vec2(dot(c, vec3(-0.1687, -0.3313, 0.5)), dot(c, vec3(0.5, -0.4187, -0.0813)));
  vec2 k = normalize(KEY);
  float along = dot(cbcr, k);
  float side = abs(cbcr.x * k.y - cbcr.y * k.x);
  return 1.0 - smoothstep(0.035, 0.09, along - side * 0.8);
}
vec4 keyed(sampler2D t, vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  vec4 c = texture2D(t, uv);
  float a = c.a;
  if (uKey > 0.5) {
    vec2 px = 1.0 / uSrc;
    a = matte(c.rgb);
    // one-pixel erosion: the edge takes the weakest of its neighbours
    a = min(a, matte(texture2D(t, uv + vec2(px.x, 0.0)).rgb));
    a = min(a, matte(texture2D(t, uv - vec2(px.x, 0.0)).rgb));
    a = min(a, matte(texture2D(t, uv + vec2(0.0, px.y)).rgb));
    a = min(a, matte(texture2D(t, uv - vec2(0.0, px.y)).rgb));
    c.g = min(c.g, (c.r + c.b) * 0.5 + 0.02);
  }
  float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  l = mix(l, pow(l, 1.25), uInk);
  return vec4(vec3(l) * a, a); // premultiplied
}
vec4 sharpOrBlur(sampler2D t, vec2 uv, float r) {
  if (r < 0.5) return keyed(t, uv);
  vec2 px = r / uSrc;
  vec4 s = keyed(t, uv) * 0.2;
  for (int i = 0; i < 8; i++) {
    float an = float(i) * 0.785398;
    vec2 o = vec2(cos(an), sin(an));
    s += keyed(t, uv + o * px) * 0.07 + keyed(t, uv + o * px * 0.5) * 0.03;
  }
  return s;
}
void main() {
  vec2 uv = contain(vUv);
  vec4 c = vec4(0.0);
  if (uAlphaA > 0.001) c += sharpOrBlur(uA, uv, uBlurA) * uAlphaA;
  if (uAlphaB > 0.001) c = c * (1.0 - uAlphaB) + sharpOrBlur(uB, uv, uBlurB) * uAlphaB;
  gl_FragColor = c * uFade;
}
`

export type FilmSource = { clips: string[]; stills: string[] }
export type FilmView = { zoom: number; x: number; y: number; blur: number }

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function KeyedFilm({ source, position, view, fade }: { source: FilmSource; position: { current: number }; view: { current: FilmView }; fade: { current: number } }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    const empty = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
    empty.needsUpdate = true
    const u = {
      uA: { value: empty as THREE.Texture },
      uB: { value: empty as THREE.Texture },
      uAlphaA: { value: 1 },
      uAlphaB: { value: 0 },
      uBlurA: { value: 0 },
      uBlurB: { value: 0 },
      uKey: { value: source.clips.length ? 1 : 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSrc: { value: new THREE.Vector2(1, 1) },
      uZoom: { value: 1 },
      uShift: { value: new THREE.Vector2() },
      uInk: { value: 0 },
      uFade: { value: 1 },
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, depthTest: false, premultipliedAlpha: true })
    const scene = new THREE.Scene()
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))
    const camera = new THREE.Camera()

    // Video mode: every clip preloaded; the position picks the clip and its time. Each clip
    // records the media time of the frame it last presented, so a texture is only shown once it
    // holds the frame that was asked for; until then the previous good frame stays on screen.
    // (Showing a clip mid-seek is what flashes past or future frames.)
    type Clip = { v: HTMLVideoElement; tex: THREE.VideoTexture; shown: number }
    const videos: Clip[] = source.clips.map((src) => {
      const v = document.createElement('video')
      v.src = src
      v.muted = true
      v.playsInline = true
      v.preload = 'auto'
      v.crossOrigin = 'anonymous'
      const tex = new THREE.VideoTexture(v)
      tex.minFilter = THREE.LinearFilter
      const clip: Clip = { v, tex, shown: -1 }
      const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number }).requestVideoFrameCallback?.bind(v)
      if (rvfc) {
        const watch = (_: number, meta: { mediaTime: number }) => {
          clip.shown = meta.mediaTime
          rvfc(watch)
        }
        rvfc(watch)
      }
      // A finished seek means the frame at currentTime is decoded and ready to upload. (Frame
      // callbacks do not fire reliably for a video that is not in the page, so this is the
      // main signal; the callback only refines it when it does fire.)
      v.addEventListener('seeked', () => {
        clip.shown = v.currentTime
      })
      v.addEventListener('loadeddata', () => {
        clip.shown = v.currentTime
        // Decode the first frame so the texture has something real.
        v.currentTime = 0.001
      }, { once: true })
      return clip
    })
    const FRAME = 1 / 24
    const timeOf = (c: Clip, t: number) => {
      const d = c.v.duration || 8
      return Math.min(d - 0.03, Math.max(0, t * d))
    }
    // Ask a clip for a time; seeks are issued one at a time, the newest target wins.
    const seek = (c: Clip, want: number) => {
      if (c.v.readyState < 1 || c.v.seeking) return
      if (Math.abs(c.v.currentTime - want) > FRAME / 2) c.v.currentTime = want
    }
    // Is the clip showing (close to) this time? Tight when switching to it, looser for the
    // clip already on screen, where a frame or two behind reads as motion, not a glitch.
    const holds = (c: Clip, want: number, onScreen: boolean) =>
      c.v.readyState >= 2 && !c.v.seeking && c.shown >= 0 && Math.abs(c.shown - want) <= (onScreen ? 0.25 : FRAME * 1.5)
    let shownA: Clip | null = null
    const show = (c: Clip, want: number) => {
      seek(c, want)
      if (holds(c, want, shownA === c)) {
        shownA = c
        u.uA.value = c.tex
        if (c.v.videoWidth) u.uSrc.value.set(c.v.videoWidth, c.v.videoHeight)
      }
    }
    // Park the neighbours at the frames they will be entered on, never touching the clip on screen.
    const park = (i: number) => {
      const prev = videos[i - 1]
      const next = videos[i + 1]
      if (prev && prev !== shownA) seek(prev, timeOf(prev, 1))
      if (next && next !== shownA) seek(next, timeOf(next, 0))
    }
    // Still mode: one texture per keyframe.
    const loader = new THREE.TextureLoader()
    const stills = source.clips.length
      ? []
      : source.stills.map((src) => loader.load(src, (tx) => u.uSrc.value.set((tx.image as HTMLImageElement).width, (tx.image as HTMLImageElement).height)))

    const themeInk = () => (u.uInk.value = document.documentElement.dataset.theme === 'light' ? 1 : 0)
    themeInk()
    const mo = new MutationObserver(themeInk)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false)
      u.uRes.value.set(el.clientWidth, el.clientHeight)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let p = position.current
    let blur = 0
    renderer.setAnimationLoop(() => {
      p += (position.current - p) * 0.14
      if (Math.abs(position.current - p) < 0.0005) p = position.current
      const vw = view.current
      u.uZoom.value += (vw.zoom - u.uZoom.value) * 0.09
      u.uShift.value.x += (vw.x - u.uShift.value.x) * 0.09
      u.uShift.value.y += (vw.y - u.uShift.value.y) * 0.09
      blur += (vw.blur - blur) * 0.09
      u.uFade.value += (fade.current - u.uFade.value) * 0.14
      const fadeBlur = (1 - u.uFade.value) * 6
      if (videos.length) {
        // An integer position belongs to the clip that starts there, except the very end.
        const i = Math.min(videos.length - 1, Math.max(0, Math.floor(p)))
        const c = videos[i]
        show(c, timeOf(c, p - i))
        u.uAlphaA.value = 1
        u.uAlphaB.value = 0
        u.uBlurA.value = blur + fadeBlur
        park(i)
      } else if (stills.length) {
        const f = Math.min(stills.length - 1, Math.max(0, p))
        const i = Math.min(stills.length - 2, Math.floor(f))
        const m = f - i
        u.uA.value = stills[i]
        u.uB.value = stills[i + 1]
        // Blur dissolve: out fades over 0..0.55 while blurring; in resolves over 0.45..1.
        u.uAlphaA.value = 1 - sstep(0.05, 0.55, m)
        u.uAlphaB.value = sstep(0.45, 0.95, m)
        u.uBlurA.value = blur + fadeBlur + sstep(0, 0.55, m) * 18
        u.uBlurB.value = blur + fadeBlur + (1 - sstep(0.45, 1, m)) * 18
      }
      // Dev only: log the timeline position of the frame actually on screen (clip index + fraction).
      if (import.meta.env.DEV && videos.length && shownA) {
        const w = window as unknown as { __filmLog?: number[] }
        if (w.__filmLog) w.__filmLog.push(videos.indexOf(shownA) + shownA.shown / (shownA.v.duration || 8))
      }
      renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      mo.disconnect()
      videos.forEach((c) => c.v.removeAttribute('src'))
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [source, position, view, fade])

  return <div ref={host} className="film" aria-hidden="true" />
}
