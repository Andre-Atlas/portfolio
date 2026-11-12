/**
 * Weights: a board of 7 × 7 round pins, a weight matrix at full precision.
 * At rest the pins stand at heights that vary smoothly. Near the pointer they
 * are quantized: each one snaps to the nearest of a few fixed levels, so the
 * smooth field turns into flat terraces, the way a model is cut down to run
 * on the edge. Pins that sit exactly on a level take the bright stroke. The
 * slider is the number of levels: fewer levels, coarser terraces.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const N = 7, CELL = 15, FOOT = 10, HMAX = 46, EXT = N * CELL, PB = 5, REACH = 2.9 * CELL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.92);
  fit(C, [[-6, -6, -PB], [EXT + 6, EXT + 6, -PB], [EXT + 6, -6, -PB], [-6, EXT + 6, -PB], [0, 0, HMAX]], 200, 166);
  const P = proj(C), front = facing(C);
  let count = value, over = null;

  const g = mk("g", {}, svg), pins = [];
  const [pr, pi] = rings(-6, -6, EXT + 6, EXT + 6, 9, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  // diagonal by diagonal from the back corner: appending is painting back to front
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i;
    if (j < 0 || j >= N) continue;
    const u = i / (N - 1), v = j / (N - 1);
    // full precision: a smooth swell with a ripple across it, never on a level
    const h0 = 7 + 30 * Math.exp(-((u - 0.62) ** 2 + (v - 0.4) ** 2) / 0.1) + 6 * Math.sin(u * 5.1 + v * 3.3) + 3.7;
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, FOOT / 2, 0.9);
    pins.push({ i, j, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN, lit: false });
  }

  // the rest mark: a dot on the lid of the tallest pin, moved in paint order to just after it
  const mark = flatDot(mk("g", {}, g), C, 0.9, "dot");
  const peak = pins.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  peak.el.g.after(mark.parentNode);

  const levels = () => {
    const n = Math.max(2, Math.round(count));
    return Array.from({ length: n }, (_, k) => 4 + (k * (HMAX - 4)) / (n - 1));
  };
  const snap = (h, ls) => ls.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));

  function drawPin(p) {
    const h = Math.max(0.6, p.sp.x);
    if (h === p.drawn) return;
    p.drawn = h;
    put(p.el, prism(P, front, p.ring, p.inner, 0, h));
  }
  function drawMark() {
    place(mark, P((peak.i + 0.5) * CELL, (peak.j + 0.5) * CELL, Math.max(0.6, peak.sp.x)));
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const p of pins) { if (stepS(p.sp, dt)) m = true; drawPin(p); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    const ls = levels();
    let snapped = 0;
    for (const p of pins) {
      let q = false;
      if (over) {
        const dx = (p.i + 0.5) * CELL - over[0], dy = (p.j + 0.5) * CELL - over[1];
        q = Math.hypot(dx, dy) <= REACH;
      }
      p.sp.t = q ? snap(p.h0, ls) : p.h0;
      if (q) snapped++;
      if (q !== p.lit) { p.lit = q; p.el.sil.classList.toggle("hi", q); }
    }
    mark.classList.toggle("off", !!over);
    if (over) {
      const i = clamp(Math.floor(over[0] / CELL), 0, N - 1), j = clamp(Math.floor(over[1] / CELL), 0, N - 1);
      read.textContent = snapped ? `w ${i}·${j} · ${Math.round(count)}lv` : `w ${i}·${j}`;
    } else read.textContent = "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { count = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "weights",
  means: "A board of weights: near the pointer each pin snaps to a few fixed levels, as a model is quantized to run on the edge.",
  rules: [1, 3, 5, 9],
  range: [5, 3, 2],
  tour: [[200, 150], [150, 190], [255, 175], null],
  mount,
});
