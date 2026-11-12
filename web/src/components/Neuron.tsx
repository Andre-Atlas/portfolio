// The "thinking" neuron, modelled on a holographic AI core: nested spherical shells made of
// circuit-trace fragments, each shell turning on its own axis like a gyroscope, a few dense
// equatorial bands, and a bright nucleus with electrons orbiting it. Pulses of light run along
// the traces. Dark theme: glowing gold with bloom. Light theme: dark amber ink, no bloom.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { reducedMotion } from '../lib/scroll'

const GOLD = new THREE.Color('#ff9a2e')
const AMBER = new THREE.Color('#6b3f06')

const traceVert = /* glsl */ `
attribute float aSeed;
attribute float aT;
varying float vSeed;
varying float vT;
void main() {
  vSeed = aSeed;
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const traceFrag = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uBase;
uniform float uBuild;
uniform float uGain;
varying float vSeed;
varying float vT;
void main() {
  // Traces switch on in a random order while the core boots.
  if (vSeed > uBuild) discard;
  float flicker = 0.55 + 0.45 * sin(uTime * (1.5 + vSeed * 4.0) + vSeed * 60.0);
  float head = fract(uTime * (0.25 + vSeed * 0.5) + vSeed * 7.0);
  float pulse = smoothstep(0.12, 0.0, abs(vT - head)) * step(0.7, fract(vSeed * 13.7));
  gl_FragColor = vec4(uColor * (1.0 + pulse * 1.5), min(1.0, (uBase * flicker + pulse * 0.35) * uGain));
}
`

type Rng = () => number
function rng(seed: number): Rng {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

const onSphere = (r: number, lat: number, lon: number) =>
  new THREE.Vector3(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(lon))

// Circuit-style paths on a sphere: short Manhattan walks in latitude/longitude, with patchy
// coverage so the shell reads as fragments rather than a mesh.
function shellTraces(r: number, count: number, rand: Rng, ends: number[], band = 1.4) {
  const pos: number[] = []
  const seed: number[] = []
  const tt: number[] = []
  for (let i = 0; i < count; i++) {
    let lat = (rand() * 2 - 1) * band
    let lon = rand() * Math.PI * 2
    // Holes: skip whole regions of the shell.
    if (Math.sin(lat * 3.1 + r * 5) * Math.cos(lon * 2.3 - r * 3) > 0.35) continue
    const steps = 8 + Math.floor(rand() * 22)
    const s = rand()
    let p = onSphere(r, lat, lon)
    let horizontal = rand() > 0.35
    for (let k = 0; k < steps; k++) {
      const d = 0.018 + rand() * 0.03
      if (rand() < 0.22) horizontal = !horizontal
      if (horizontal) lon += d * (rand() > 0.15 ? 1 : -1) / Math.max(0.3, Math.cos(lat))
      else lat += d * (rand() > 0.5 ? 1 : -1)
      const q = onSphere(r, lat, lon)
      pos.push(p.x, p.y, p.z, q.x, q.y, q.z)
      seed.push(s, s)
      tt.push(k / steps, (k + 1) / steps)
      p = q
    }
    ends.push(p.x, p.y, p.z)
  }
  return { pos, seed, tt }
}

// A dense band of near-parallel arcs around an axis (the bright "equator" strokes).
function bandArcs(r: number, count: number, rand: Rng, width: number) {
  const pos: number[] = []
  const seed: number[] = []
  const tt: number[] = []
  for (let i = 0; i < count; i++) {
    const rr = r + (rand() - 0.5) * width * 0.6
    const y = (rand() - 0.5) * width
    const a0 = rand() * Math.PI * 2
    const span = 0.2 + rand() * 1.4
    const n = Math.ceil(span / 0.04)
    const s = rand()
    let prev: THREE.Vector3 | null = null
    let yy = y
    for (let k = 0; k <= n; k++) {
      const a = a0 + (k / n) * span
      if (rand() < 0.06) yy += (rand() - 0.5) * 0.05
      const q = new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr)
      if (prev) {
        pos.push(prev.x, prev.y, prev.z, q.x, q.y, q.z)
        seed.push(s, s)
        tt.push((k - 1) / n, k / n)
      }
      prev = q
    }
  }
  return { pos, seed, tt }
}

function lines(data: { pos: number[]; seed: number[]; tt: number[] }, mat: THREE.ShaderMaterial) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3))
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(data.seed, 1))
  g.setAttribute('aT', new THREE.Float32BufferAttribute(data.tt, 1))
  return new THREE.LineSegments(g, mat)
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.18)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const isDark = () => document.documentElement.dataset.theme !== 'light'
const bgColor = () => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0b0b0c')

export default function Neuron({ className = '', build = 1 }: { className?: string; build?: number }) {
  const host = useRef<HTMLDivElement>(null)
  const buildRef = useRef(build)
  buildRef.current = build

  useEffect(() => {
    const el = host.current!
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0, 10.4)

    const rand = rng(23)
    const uniforms = { uColor: { value: GOLD.clone() }, uTime: { value: 0 }, uBuild: { value: 0 }, uGain: { value: 1 } }
    const traceMats: THREE.ShaderMaterial[] = []
    const traceMat = (base: number) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: traceVert,
        fragmentShader: traceFrag,
        uniforms: { ...uniforms, uBase: { value: base } },
        transparent: true,
        depthWrite: false,
      })
      traceMats.push(m)
      return m
    }

    const rig = new THREE.Group()
    rig.position.y = 0.66
    scene.add(rig)

    // Gyroscope: each shell spins on its own tilted axis.
    type Spinner = { obj: THREE.Object3D; axis: THREE.Vector3; speed: number }
    const spinners: Spinner[] = []
    const spin = (obj: THREE.Object3D, speed: number) => {
      const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize()
      obj.quaternion.setFromAxisAngle(axis.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), rand() * Math.PI)
      spinners.push({ obj, axis, speed })
      rig.add(obj)
    }
    const shells: [number, number, number][] = [
      [0.42, 90, 0.2],
      [0.68, 200, 0.16],
      [0.95, 330, 0.13],
      [1.22, 440, 0.11],
      [1.5, 520, 0.1],
    ]
    const nodeEnds: number[][] = []
    shells.forEach(([r, n, base], i) => {
      const ends: number[] = []
      const shell = lines(shellTraces(r, n, rand, ends), traceMat(base))
      nodeEnds.push(ends)
      spin(shell, (i % 2 ? -1 : 1) * (0.08 + rand() * 0.18))
    })
    // Bright bands: one wide equator plus two tilted rings.
    const bands: [number, number, number, number][] = [
      [1.62, 300, 0.12, 0.13],
      [1.38, 140, 0.05, 0.07],
      [1.78, 120, 0.04, 0.06],
    ]
    bands.forEach(([r, n, w, base], i) => {
      const b = lines(bandArcs(r, n, rand, w), traceMat(base))
      const g = new THREE.Group()
      g.add(b)
      g.rotation.x = i === 0 ? 0.25 : 0.25 + i * 0.9
      g.rotation.z = i * 0.6
      const holder = new THREE.Group()
      holder.add(g)
      rig.add(holder)
      spinners.push({ obj: b, axis: new THREE.Vector3(0, 1, 0), speed: (i % 2 ? -1 : 1) * (0.25 + i * 0.12) })
    })
    // A long diagonal streak through the core, like the reference.
    const streak = lines(bandArcs(0.001, 0, rand, 0), traceMat(0.12))
    {
      const pos: number[] = []
      const seed: number[] = []
      const tt: number[] = []
      for (let i = 0; i < 18; i++) {
        const o = (rand() - 0.5) * 0.05
        const s = rand()
        pos.push(-1.1 + o, 1.2, o, 0.9 + o, -1.25, o * 2)
        seed.push(s * 0.3, s * 0.3)
        tt.push(0, 1)
      }
      streak.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
      streak.geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
      streak.geometry.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1))
      rig.add(streak)
    }

    // Nucleus: glowing core, two small rings, and electrons with fading trails.
    const tex = glowTexture()
    const glowMats: THREE.SpriteMaterial[] = []
    const glow = (size: number, opacity: number) => {
      const m = new THREE.SpriteMaterial({ map: tex, color: GOLD.clone(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })
      glowMats.push(m)
      const sp = new THREE.Sprite(m)
      sp.scale.setScalar(size)
      return sp
    }
    const core = new THREE.Group()
    rig.add(core)
    const halo = glow(0.8, 0.12)
    const heart = glow(0.3, 0.9)
    core.add(halo, heart)
    const ringMats: THREE.MeshBasicMaterial[] = []
    for (const [r, t] of [[0.18, 0.006], [0.26, 0.004]] as const) {
      const m = new THREE.MeshBasicMaterial({ color: GOLD.clone(), transparent: true, opacity: 0.9 })
      ringMats.push(m)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 6, 96), m)
      ring.rotation.x = rand() * Math.PI
      spinners.push({ obj: ring, axis: new THREE.Vector3(rand(), rand(), rand()).normalize(), speed: 1.2 })
      core.add(ring)
    }
    type Electron = { orbit: THREE.Quaternion; r: number; speed: number; phase: number; dot: THREE.Sprite; trail: THREE.Line; hist: THREE.Vector3[] }
    const electrons: Electron[] = []
    const TRAIL = 24
    for (let i = 0; i < 7; i++) {
      const orbit = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * Math.PI, rand() * Math.PI, 0))
      const dot = glow(0.09, 0.9)
      const tg = new THREE.BufferGeometry()
      tg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TRAIL * 3), 3))
      const alpha = new Float32Array(TRAIL).map((_, k) => 1 - k / TRAIL)
      tg.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Float32Array(TRAIL).fill(0), 1))
      tg.setAttribute('aT', new THREE.Float32BufferAttribute(alpha, 1))
      const trail = new THREE.Line(tg, traceMat(0.3))
      core.add(dot, trail)
      electrons.push({ orbit, r: 0.3 + rand() * 0.25, speed: 1.6 + rand() * 1.8, phase: rand() * 6.28, dot, trail, hist: [] })
    }

    // Sparks: flickering points scattered over the shells.
    const sp = new Float32Array(900 * 3)
    for (let i = 0; i < 900; i++) {
      const v = onSphere(0.5 + rand() * 1.2, (rand() * 2 - 1) * 1.4, rand() * 6.28)
      sp.set([v.x, v.y, v.z], i * 3)
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
    const sparkMat = new THREE.PointsMaterial({ color: GOLD.clone(), size: 0.018, transparent: true, opacity: 0.55, depthWrite: false })
    rig.add(new THREE.Points(sparkGeo, sparkMat))
    // Pad nodes at the end of every trace, riding with their shell.
    nodeEnds.forEach((ends, i) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(ends, 3))
      spinners[i].obj.add(new THREE.Points(g, sparkMat))
    })

    // Bloom (dark theme only).
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.4, 0.18)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    const applyTheme = () => {
      const dark = isDark()
      const c = dark ? GOLD : AMBER
      scene.background = bgColor()
      uniforms.uColor.value.copy(c)
      const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
      for (const m of [...traceMats, sparkMat, ...ringMats]) {
        m.blending = blending
        m.needsUpdate = true
      }
      sparkMat.color.copy(c)
      ringMats.forEach((m) => m.color.copy(c))
      glowMats.forEach((m) => {
        m.color.copy(c)
        m.blending = blending
        m.needsUpdate = true
      })
      uniforms.uGain.value = dark ? 1 : 3.2
      sparkMat.opacity = dark ? 0.55 : 0.9
      halo.visible = dark
      bloom.enabled = dark
    }
    applyTheme()
    const mo = new MutationObserver(applyTheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    const mouse = new THREE.Vector2()
    const onMove = (e: PointerEvent) => mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    window.addEventListener('pointermove', onMove)
    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h)
      composer.setSize(w, h)
      bloom.resolution.set(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const clock = new THREE.Clock()
    const rate = reducedMotion ? 0.2 : 1
    const q = new THREE.Quaternion()
    const v = new THREE.Vector3()
    let shown = 0
    renderer.setAnimationLoop(() => {
      const dt = Math.min(0.05, clock.getDelta()) * rate
      const t = clock.elapsedTime * rate
      uniforms.uTime.value = t
      shown += (buildRef.current - shown) * Math.min(1, dt * 1.5)
      uniforms.uBuild.value = shown
      for (const s of spinners) s.obj.quaternion.premultiply(q.setFromAxisAngle(s.axis, s.speed * dt))
      heart.scale.setScalar(0.3 + Math.sin(t * 3) * 0.04)
      halo.material.opacity = 0.16 + Math.sin(t * 1.7) * 0.05
      for (const e of electrons) {
        const a = e.phase + t * e.speed
        v.set(Math.cos(a) * e.r, 0, Math.sin(a) * e.r).applyQuaternion(e.orbit)
        e.dot.position.copy(v)
        e.hist.unshift(v.clone())
        if (e.hist.length > TRAIL) e.hist.pop()
        const arr = e.trail.geometry.getAttribute('position') as THREE.BufferAttribute
        for (let k = 0; k < TRAIL; k++) {
          const p = e.hist[Math.min(k, e.hist.length - 1)]
          arr.setXYZ(k, p.x, p.y, p.z)
        }
        arr.needsUpdate = true
      }
      rig.rotation.y += (mouse.x * 0.4 + t * 0.04 - rig.rotation.y) * 0.03
      rig.rotation.x += (mouse.y * 0.3 - rig.rotation.x) * 0.03
      if (bloom.enabled) composer.render()
      else renderer.render(scene, camera)
    })

    return () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      mo.disconnect()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={host} className={`neuron ${className}`} aria-hidden="true" />
}
