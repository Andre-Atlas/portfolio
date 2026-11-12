/**
 * Caliper: a vernier caliper lying on a plate, its jaws closed on a test
 * piece: nothing is claimed before it is measured. The pointer slides the
 * moving jaw along the graduated beam; the jaw follows on a spring and stops
 * against the piece, never through it. The read-out gives the opening in
 * millimetres. The slider is how far the jaw can travel.
 */
const {
  Cam, circ, clamp, facing, fit, open, prism, proj, rings, ringAt, run, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const L = 140, BW = 8, BH = 4, JAW = 42, JW = 9, SL = 20, PR = 10, PX = JW + PR, PY = BW + 4 + PR;
const MIN = PX + PR, Y0 = -12, Y1 = BW + JAW + 8;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let travel = value;

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[-10, Y0, -4], [L + 10, Y1, -4], [L + 10, Y0, -4], [-10, Y1, -4], [0, 0, 14], [L, 0, 8]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const make = (parent) => solid(parent);
  const block = (el, x0, y0, x1, y1, z0, z1, r = 1.6, b = 0.7) => {
    const [ring, inner] = rings(x0, y0, x1, y1, r, b);
    put(el, prism(P, front, ring, inner, z0, z1));
  };

  // the plate, then the parts back to front
  const [pr, pi] = rings(-10, Y0, L + 10, Y1, 6, 1.8);
  put(make(g), prism(P, front, pr, pi, -4, 0));
  mk("path", { d: open(ringAt(P, run(pi, front), -2.4)), class: "nf lo" }, g);
  const beamL = make(g), ticksL = mk("path", { class: "nf lo" }, g);
  const fixed = make(g);
  block(fixed, 0, BW, JW, BW + JAW, 0, BH, 1.6, 0.7);
  // the test piece: a short round bar standing on the plate, with a chamfer line
  const piece = make(g);
  const ring = circ(PR, 20).map((q) => ({ ...q, u: q.u + PX, v: q.v + PY }));
  const inner = circ(PR - 1.2, 20).map((q) => ({ ...q, u: q.u + PX, v: q.v + PY }));
  put(piece, prism(P, front, ring, inner, 0, 12));
  piece.sil.classList.add("hi");
  const slider = make(g), wheel = make(g), jaw = make(g);
  const beamR = make(g), ticksR = mk("path", { class: "nf lo" }, g);

  const ticks = (x0, x1) => {
    let d = "";
    for (let k = 0; k * 4 <= L; k++) {
      const x = k * 4 + 2;
      if (x < x0 + 1 || x > x1 - 1) continue;
      d += seg(P(x, 0.8, BH), P(x, k % 5 === 0 ? 4.6 : 2.6, BH));
    }
    return d;
  };
  const sp = spring(MIN);
  let drawn = NaN;
  function draw() {
    const s = sp.x;
    if (s === drawn) return;
    drawn = s;
    block(beamL, 0, 0, s, BW, 0, BH, 1.2, 0.6);
    ticksL.setAttribute("d", ticks(JW, s));
    block(slider, s, -3, s + SL, BW + 2, 0, BH + 3, 2, 0.8);
    const wr = circ(2.6, 12).map((q) => ({ ...q, u: q.u + s + SL - 5, v: q.v - 6.2 }));
    const wi = circ(1.6, 12).map((q) => ({ ...q, u: q.u + s + SL - 5, v: q.v - 6.2 }));
    put(wheel, prism(P, front, wr, wi, 0, 3.4));
    block(jaw, s, BW + 2, s + JW, BW + JAW, 0, BH, 1.6, 0.7);
    block(beamR, s + SL, 0, L, BW, 0, BH, 1.2, 0.6);
    ticksR.setAttribute("d", ticks(s + SL, L));
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);
  draw();

  let over = null;
  function retarget() {
    // the jaw opens to the pointer, but it stops against the piece and at the end of its travel
    if (over) sp.t = clamp(over[0] - JW / 2, MIN, MIN + travel);
    else sp.t = MIN;
    const touching = sp.t <= MIN + 0.01;
    jaw.sil.classList.toggle("hi", !!over && !touching);
    piece.sil.classList.toggle("hi", !over || touching);
    read.textContent = over ? `${(sp.t - JW).toFixed(1)} mm` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { travel = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "caliper",
  means: "A caliper closed on a test piece: the pointer opens the jaw along the beam, and it stops against the piece.",
  rules: [1, 3, 5, 8],
  range: [50, 78, 100],
  tour: [[250, 200], [190, 175], [300, 225], null],
  mount,
});
