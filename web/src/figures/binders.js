/**
 * Binders: a shelf of seven binders of different heights, the sources a model
 * answers from. The binder under the pointer slides out of the row toward the
 * reader, the way a source is pulled to back an answer; its neighbours part a
 * little, staggered outwards. Each spine has a finger hole and a label slot;
 * the binder's number is a column of dots on the slot. The slider is how far
 * the binder comes out.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, rings, ringAt, rrect, run,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 7, GAP = 15, W = 11, D = 44, SH = 6, LIP = 7;
const HS = [50, 44, 57, 48, 42, 54, 46];
const X0 = -LIP, X1 = (N - 1) * GAP + W + LIP, Y0 = -LIP, Y1 = D + LIP;
const REST_I = 3, REST_PULL = 9, PART = 2.2;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pull = value;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[X0, Y0, -SH], [X1, Y1 + 34, -SH], [X1, Y0, -SH], [X0, Y1 + 34, 0], [X0, Y0, 57], [X1, Y0, 57]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the shelf: one plate, painted first
  const [sr, si] = rings(X0, Y0, X1, Y1, 4, 1.4);
  put(solid(g), prism(P, front, sr, si, -SH, 0));
  mk("path", { d: open(ringAt(P, run(si, front), -SH + 1.6)), class: "nf lo" }, g);

  // Binders, by ascending x: they never overlap in x, so that is always back to front.
  const bs = [];
  for (let i = 0; i < N; i++) {
    const el = solid(g), spine = mk("path", { class: "nf" }, g), slot = mk("path", { class: "nf lo" }, g);
    const dots = [];
    for (let k = 0; k <= i; k++) dots.push(mk("circle", { r: 0.75, class: "dot off" }, g));
    bs.push({ i, h: HS[i], el, spine, slot, dots, y: tween(i === REST_I ? REST_PULL : 0), x: tween(0), drawn: "" });
  }
  bs[REST_I].el.sil.classList.add("hi");

  function draw(b, now) {
    const y = tval(b.y, now), dx = tval(b.x, now), key = y.toFixed(2) + "," + dx.toFixed(2);
    if (key === b.drawn) return;
    b.drawn = key;
    const x0 = b.i * GAP + dx, y0 = y, y1 = y + D;
    const [r, inner] = rings(x0, y0, x0 + W, y1, 2.2, 0.9);
    put(b.el, prism(P, front, r, inner, 0, b.h));
    // the spine faces the reader at y1: a finger hole near the foot, a label slot above it
    const onSpine = (ring) => ring.map((q) => P(q.u, y1, q.v));
    const cx = x0 + W / 2;
    b.spine.setAttribute("d", poly(onSpine(rrect(cx - 2.6, 6, cx + 2.6, 11.2, 2.6, 4))));
    b.slot.setAttribute("d", poly(onSpine(rrect(cx - 3.2, b.h - 24, cx + 3.2, b.h - 8, 1.4, 4))));
    b.dots.forEach((el, k) => place(el, P(cx, y1, b.h - 11 - k * 2)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const b of bs) {
      draw(b, now);
      if (!tdone(b.y, now) || !tdone(b.x, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  // Hit test on the rest pose: the binder whose resting spine centre is nearest on screen.
  const centres = bs.map((b) => P(b.i * GAP + W / 2, D, b.h / 2));
  const shelfTop = P(X0, Y0, 70)[1], shelfFoot = P(X1, Y1 + 40, -SH)[1];
  function hit([x, y]) {
    if (y < shelfTop || y > shelfFoot) return -1;
    let best = -1, d = Infinity;
    centres.forEach((c, i) => {
      const e = Math.abs(c[0] - x);
      if (e < d) { d = e; best = i; }
    });
    return d < GAP * 1.4 ? best : -1;
  }

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : REST_I;
    act = a;
    bs.forEach((b, i) => {
      const delay = Math.abs(i - from) * 40;
      const out = a < 0 ? (i === REST_I ? REST_PULL : 0) : i === a ? pull : 0;
      const side = a < 0 || i === a ? 0 : clamp((i - a) * PART, -PART * 2, PART * 2) / Math.max(1, Math.abs(i - a));
      tset(b.y, out, now, delay);
      tset(b.x, side, now, delay);
      const lit = a < 0 ? i === REST_I : i === a;
      b.el.sil.classList.toggle("hi", lit);
      b.dots.forEach((el) => { el.classList.toggle("off", !lit); });
    });
    read.textContent = a < 0 ? "rest" : "ref " + String(a + 1).padStart(2, "0");
    B.wake();
  }
  bs[REST_I].dots.forEach((el) => el.classList.remove("off"));

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      pull = v;
      if (act >= 0) { const a = act; act = -1; setActive(a); }
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "binders",
  means: "A shelf of sources: the binder under the pointer slides out, as a source is pulled to back an answer.",
  rules: [1, 2, 5, 10],
  range: [16, 26, 34],
  tour: [[150, 150], [250, 140], [205, 150], null],
  mount,
});
