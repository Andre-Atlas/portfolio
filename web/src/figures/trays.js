/**
 * Trays: a stack of four trays, a tech stack from the ground up: infra at the
 * bottom, then data, then models, then languages on top. Each tray carries
 * one chip per tool. The pointer's height picks a tray; the trays above it
 * lift away, staggered from the pick, to show what it holds. The picked tray
 * takes the bright edge and the read-out names the layer and its count. The
 * slider is how far the trays above lift.
 */
const {
  Cam, circ, fit, open, prism, proj, rings, ringAt, run, facing,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const NAMES = ["infra", "data", "ml", "lang"], COUNT = [2, 5, 3, 4];
const X = 84, Y = 56, T = 4, CH = 6, CR = 5.2, PITCH = T + CH + 1.6, REST_A = 1, REST_OPEN = 9;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 2.1);
  fit(C, [[-4, -4, -5], [X + 4, Y + 4, -5], [X + 4, -4, -5], [-4, Y + 4, -5], [0, 0, 4 * PITCH + 34], [X, 0, 4 * PITCH + 34]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [br, bi] = rings(-4, -4, X + 4, Y + 4, 7, 1.8);
  put(solid(g), prism(P, front, br, bi, -5, 0));
  mk("path", { d: open(ringAt(P, run(bi, front), -3)), class: "nf lo" }, g);

  // chips sit in a row across each tray, paired off when there are many
  const spots = (n) => Array.from({ length: n }, (_, k) => {
    const cols = Math.ceil(n / 2), row = n > 3 ? k % 2 : 0, col = n > 3 ? Math.floor(k / 2) : k;
    const span = n > 3 ? cols : n;
    return [X / 2 + (col - (span - 1) / 2) * 15, Y / 2 + (n > 3 ? (row - 0.5) * 16 : 0)];
  }).sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

  // bottom to top, and inside a tray its plate before its chips by ascending x + y
  const trays = NAMES.map((name, i) => {
    const el = solid(g);
    const chips = spots(COUNT[i]).map(([cx, cy]) => ({ cx, cy, el: solid(g) }));
    return { i, name, el, chips, z: tween(i > REST_A ? REST_OPEN : 0), drawn: NaN };
  });
  const [ring, inner] = rings(0, 0, X, Y, 5, 1.4);
  const chipRing = (cx, cy, r) => circ(r, 14).map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

  function draw(t, now) {
    const z = tval(t.z, now);
    if (z === t.drawn) return;
    t.drawn = z;
    const z0 = t.i * PITCH + z;
    put(t.el, prism(P, front, ring, inner, z0, z0 + T));
    for (const c of t.chips) put(c.el, prism(P, front, chipRing(c.cx, c.cy, CR), chipRing(c.cx, c.cy, CR - 1.3), z0 + T, z0 + T + CH));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const t of trays) { draw(t, now); if (!tdone(t.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // hit test on the rest pose: the tray whose resting front corner is nearest the pointer's height
  const marks = trays.map((t) => P(X, Y, t.i * PITCH + T)[1]);
  const left = P(0, Y, 0)[0] - 20, right = P(X, 0, 0)[0] + 20;
  function hit([x, y]) {
    if (x < left || x > right) return -1;
    let best = -1, d = Infinity;
    marks.forEach((m, i) => { const e = Math.abs(m - y); if (e < d) { d = e; best = i; } });
    return d < PITCH * 2.2 ? best : -1;
  }

  let act = -1;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), pick = a < 0 ? REST_A : a, from = act < 0 ? REST_A : act;
    act = a;
    trays.forEach((t, i) => {
      const to = i > pick ? (a < 0 ? REST_OPEN : lift) : 0;
      tset(t.z, to, now, Math.abs(i - (a < 0 ? from : a)) * 45);
      t.el.sil.classList.toggle("hi", i === pick);
    });
    read.textContent = a < 0 ? "rest" : `${trays[a].name} · ${COUNT[a]}`;
    B.wake();
  }
  trays[REST_A].el.sil.classList.add("hi");

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = v; if (act >= 0) { const a = act; act = -1; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "trays",
  means: "A tech stack as trays: the pointer picks a layer, and the trays above lift to show the tools it holds.",
  rules: [1, 2, 5, 6],
  range: [18, 26, 34],
  tour: [[200, 215], [200, 165], [200, 190], null],
  mount,
});
