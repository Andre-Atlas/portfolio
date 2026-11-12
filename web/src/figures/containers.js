/**
 * Containers: six shipping containers in a row under a gantry crane, the
 * services of a system. The pointer picks a container; the crane's trolley
 * runs along the beam to it and its spreader lifts it out of the row, the
 * way one service is shipped without touching the others. Each container has
 * a corrugated side and locking bars on its doors; its number is a row of
 * dots on the doors. The slider is how high the crane lifts.
 */
const {
  Cam, facing, fit, open, prism, proj, rings, ringAt, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const N = 6, GAP = 16, W = 12, D = 42, H = 14, PAD = 7, TOP = 64, LEG = 4;
const X0 = -PAD - 8, X1 = (N - 1) * GAP + W + PAD + 8, REST_I = 2, REST_LIFT = 7;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 1.72);
  fit(C, [[X0, -PAD, -4], [X1, D + PAD, -4], [X1, -PAD, -4], [X0, D + PAD, -4], [X0, D / 2, TOP + 5], [X1, D / 2, TOP + 5]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const box = (parent, x0, y0, x1, y1, z0, z1, r = 2, b = 0.9) => {
    const el = solid(parent), [ring, inner] = rings(x0, y0, x1, y1, r, b);
    put(el, prism(P, front, ring, inner, z0, z1));
    return el;
  };

  // the quay, then the far leg of the gantry
  box(g, X0, -PAD, X1, D + PAD, -4, 0, 5, 1.6);
  const [, qi] = rings(X0, -PAD, X1, D + PAD, 5, 1.6);
  mk("path", { d: open(ringAt(P, run(qi, front), -2.6)), class: "nf lo" }, g);
  box(g, X0 + 1, D / 2 - LEG / 2, X0 + 1 + LEG, D / 2 + LEG / 2, 0, TOP, 1.4, 0.6);

  // containers by ascending x: they never overlap in x, so that is back to front
  const cs = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g), el = solid(grp), marks = mk("path", { class: "nf lo" }, grp), dots = [];
    for (let k = 0; k <= i; k++) dots.push(mk("circle", { r: 0.7, class: "dot off" }, grp));
    cs.push({ i, grp, el, marks, dots, z: tween(i === REST_I ? REST_LIFT : 0), drawn: NaN, above: false });
  }
  // the spreader and its cables, the beam, the trolley, the near leg
  const cables = mk("path", { class: "nf lo" }, g);
  const spreader = solid(g);
  box(g, X0 + 1, D / 2 - 3, X1 - 1, D / 2 + 3, TOP, TOP + 5, 2, 0.8);
  const trolley = solid(g);
  box(g, X1 - 1 - LEG, D / 2 - LEG / 2, X1 - 1, D / 2 + LEG / 2, 0, TOP, 1.4, 0.6);

  const cx = (i) => i * GAP + W / 2;
  const tx = tween(cx(REST_I));
  let held = REST_I;

  // A container lifted clear of the row's roofs is in front of all of them; otherwise x order holds.
  function order() {
    cs.slice().sort((a, b) => (a.above - b.above) || a.i - b.i).forEach((c) => cables.before(c.grp));
  }
  function drawContainer(c, z) {
    if (z === c.drawn) return;
    c.drawn = z;
    const above = z >= H;
    if (above !== c.above) { c.above = above; order(); }
    const x0 = c.i * GAP, x1 = x0 + W;
    const [ring, inner] = rings(x0, 0, x1, D, 1.6, 0.8);
    put(c.el, prism(P, front, ring, inner, z, z + H));
    // corrugation on the long side, locking bars on the doors
    let d = "";
    for (let k = 1; k < 9; k++) d += seg(P(x1, (k * D) / 9, z + 2), P(x1, (k * D) / 9, z + H - 2));
    for (const u of [x0 + 3.5, x1 - 3.5]) d += seg(P(u, D, z + 2), P(u, D, z + H - 2));
    c.marks.setAttribute("d", d);
    c.dots.forEach((el, k) => place(el, P(x0 + W / 2, D, z + H - 3 - k * 1.7)));
  }
  function drawCrane(x, z) {
    const s0 = x - W / 2 - 1, s1 = x + W / 2 + 1, sz = z + H + 0.6;
    const [sr, si] = rings(s0, 4, s1, D - 4, 1.4, 0.6);
    put(spreader, prism(P, front, sr, si, sz, sz + 2));
    const [tr, ti] = rings(x - 5, D / 2 - 5, x + 5, D / 2 + 5, 1.8, 0.7);
    put(trolley, prism(P, front, tr, ti, TOP + 5, TOP + 9));
    cables.setAttribute("d", [[x - 3, D / 2 - 3, s0 + 2, 6], [x + 3, D / 2 + 3, s1 - 2, D - 6]]
      .map(([a, b, c2, d2]) => seg(P(a, b, TOP), P(c2, d2, sz + 2))).join(""));
  }

  let lastX = NaN, lastZ = NaN;
  const B = register(stage, (_dt, now) => {
    let moving = !tdone(tx, now);
    for (const c of cs) { drawContainer(c, tval(c.z, now)); if (!tdone(c.z, now)) moving = true; }
    const x = tval(tx, now), z = tval(cs[held].z, now);
    if (x !== lastX || z !== lastZ) { lastX = x; lastZ = z; drawCrane(x, z); }
    return moving;
  });
  bag.add(B.unregister);

  // hit test on the rest pose: the container whose resting door centre is nearest on screen
  const centres = cs.map((c) => P(cx(c.i), D, H / 2));
  const yTop = P(X0, -PAD, TOP + 10)[1], yFoot = P(X1, D + PAD, -4)[1];
  function hit([x, y]) {
    if (y < yTop || y > yFoot) return -1;
    let best = -1, d = Infinity;
    centres.forEach((c, i) => { const e = Math.abs(c[0] - x); if (e < d) { d = e; best = i; } });
    return d < GAP * 1.5 ? best : -1;
  }

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), pick = a < 0 ? REST_I : a;
    act = a;
    // the crane travels first; the lift waits for it, longer the farther it went
    const travel = Math.abs(pick - held) * 60;
    held = pick;
    tset(tx, cx(pick), now, 0);
    cs.forEach((c, i) => {
      tset(c.z, i === pick ? (a < 0 ? REST_LIFT : lift) : 0, now, i === pick ? travel : Math.abs(i - pick) * 40);
      c.el.sil.classList.toggle("hi", i === pick);
      c.dots.forEach((el) => el.classList.toggle("off", i !== pick));
    });
    read.textContent = a < 0 ? "rest" : "svc " + String(a + 1).padStart(2, "0");
    B.wake();
  }
  cs[REST_I].el.sil.classList.add("hi");
  cs[REST_I].dots.forEach((el) => el.classList.remove("off"));

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = v; if (act >= 0) { const a = act; act = -1; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "containers",
  means: "Services as containers under a crane: the one under the pointer is lifted out, and the rest of the row stays put.",
  rules: [1, 2, 5, 8],
  range: [16, 24, 32],
  tour: [[150, 190], [250, 175], [200, 180], null],
  mount,
});
