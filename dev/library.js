const TWLIB = (() => {
'use strict';
const clamp01 = x => Math.max(0, Math.min(1, x));
function cueSvg(c, P, u) {
  const o = c.when === "B" ? clamp01((u - .55) / .3) : c.when === "A" ? clamp01((.45 - u) / .3) : 1;
  if (o <= 0) return "";
  const [px, py] = c.pt(P), [fx, fy] = c.from, a = Math.atan2(py - fy, px - fx);
  const tip = [px - Math.cos(a) * 3, py - Math.sin(a) * 3];
  const h1 = [tip[0] - Math.cos(a - .45) * 8, tip[1] - Math.sin(a - .45) * 8], h2 = [tip[0] - Math.cos(a + .45) * 8, tip[1] - Math.sin(a + .45) * 8];
  const f = n => n.toFixed(1);
  return `<g class="an-cue" opacity="${o.toFixed(2)}"><line x1="${fx}" y1="${fy}" x2="${f(tip[0])}" y2="${f(tip[1])}"/><path d="M${f(tip[0])} ${f(tip[1])}L${f(h1[0])} ${f(h1[1])}L${f(h2[0])} ${f(h2[1])}Z"/><text x="${c.lx}" y="${c.ly}" text-anchor="middle">${c.text}</text></g>`;
}

const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function phaseAt(ms, dur) {
  const t = (ms % dur) / dur;
  if (t < .15) return 0;
  if (t < .45) return ease((t - .15) / .3);
  if (t < .6) return 1;
  return 1 - ease((t - .6) / .4);
}

// ---- 3/4-view figures: 3D joints, orthographic camera, two-bone IK
// world: x = forward (where the figure faces), y = up, z = the figure's right side
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
};
function ik3(root, target, u, f, pole) {
  const dv = V.sub(target, root), d = Math.min(V.len(dv), u + f - 0.01), e = V.norm(dv);
  const along = (u * u - f * f + d * d) / (2 * d), off = Math.sqrt(Math.max(0, u * u - along * along));
  const n = V.norm(V.sub(pole, V.mul(e, V.dot(pole, e))));
  return { mid: V.add(V.add(root, V.mul(e, along)), V.mul(n, off)), end: V.add(root, V.mul(e, d)) };
}
function camera(yaw, pitch, cx, cy, sc = 1) {
  const cy_ = Math.cos(yaw * Math.PI / 180), sy = Math.sin(yaw * Math.PI / 180), cp = Math.cos(pitch * Math.PI / 180), sp = Math.sin(pitch * Math.PI / 180);
  return p => { const x = p[0] * cy_ - p[2] * sy, depth = p[0] * sy + p[2] * cy_; return [cx + x * sc, cy + (-p[1] * cp + depth * sp) * sc, depth]; };
}
// draw list: items sorted far → near; far-side limbs lighter
function draw3(items, cam) {
  const out = items.map(it => {
    const pts = it.pts.map(cam), depth = it.z ?? pts.reduce((a, p) => a + p[2], 0) / pts.length;
    return { it, pts, depth };
  }).sort((a, b) => a.depth - b.depth);
  const f = n => n.toFixed(1);
  return out.map(({ it, pts }) => {
    const c = it.cls;
    if (it.type === "dot") return `<circle class="${c}" cx="${f(pts[0][0])}" cy="${f(pts[0][1])}" r="${it.r}"/>`;
    if (it.type === "poly") return `<path class="${c}" d="M${pts.map(p => f(p[0]) + " " + f(p[1])).join("L")}Z"/>`;
    return `<line class="${c}" x1="${f(pts[0][0])}" y1="${f(pts[0][1])}" x2="${f(pts[1][0])}" y2="${f(pts[1][1])}"/>`;
  }).join("");
}
const L3 = (a, b, cls) => ({ type: "line", pts: [a, b], cls });
const D3 = (p, r, cls) => ({ type: "dot", pts: [p], r, cls });
function body3(J, nearSide) {
  // J: joints with L/R variants; nearSide: "R" or "L" (drawn darker)
  const s = side => side === nearSide || nearSide === "all" ? "an3" : "an3 far";
  const it = [
    L3(J.pelvis, J.chest, "an3"), L3(J.shoL, J.shoR, "an3"), L3(J.hipL, J.hipR, "an3"), D3(J.head, 9, "an3h")
  ];
  for (const sd of ["L", "R"]) {
    it.push(L3(J["hip" + sd], J["kne" + sd], s(sd)), L3(J["kne" + sd], J["ank" + sd], s(sd)), L3(J["ank" + sd], J["toe" + sd], s(sd)),
      L3(J["sho" + sd], J["elb" + sd], s(sd)), L3(J["elb" + sd], J["wri" + sd], s(sd)));
  }
  return it;
}
function limbs(J, sd, sho, hand, pole, hip, ank, kpole, toeDir) {
  const a = ik3(sho, hand, 32, 30, pole); J["sho" + sd] = sho; J["elb" + sd] = a.mid; J["wri" + sd] = a.end;
  const l = ik3(hip, ank, 44, 42, kpole); J["hip" + sd] = hip; J["kne" + sd] = l.mid; J["ank" + sd] = l.end; J["toe" + sd] = V.add(l.end, toeDir);
}
const floor3 = (x0, x1, z) => [L3([x0, 0, -z], [x1, 0, -z], "an3eq"), L3([x0, 0, z], [x1, 0, z], "an3eq"), L3([x0, 0, -z], [x0, 0, z], "an3eq"), L3([x1, 0, -z], [x1, 0, z], "an3eq")];


function anim3Frame(key, u) {
  const a = SAMPLES[key], { items, J } = a.frame(u), cam = a.cam;
  const cues = (a.cues || []).map(c => {
    const p = cam(c.pt(J));
    if (!c.off) return cueSvg({ ...c, pt: () => [p[0], p[1]] }, null, u);
    const w = c.text.length * 7.4, cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const lx = cl(p[0] + c.off[0] + (c.off[0] > 8 ? w / 2 - 8 : c.off[0] < -8 ? -w / 2 + 8 : 0), w / 2 + 3, 237 - w / 2), ly = cl(p[1] + c.off[1], 14, 222);
    const fx = cl(p[0], lx - w / 2 + 6, lx + w / 2 - 6), fy = p[1] < ly ? ly - 13 : ly + 5;
    return cueSvg({ when: c.when, pt: () => [p[0], p[1]], lx: +lx.toFixed(1), ly: +ly.toFixed(1), from: [+fx.toFixed(1), fy], text: c.text }, null, u);
  }).join("");
  return draw3(items, cam) + cues;
}


// ---- programme exercise animations (3D rig, side or 3/4 camera per exercise)
const SIDES = [["L", -1], ["R", 1]];
const rad = a => a * Math.PI / 180;
const sag = a => [Math.sin(rad(a)), Math.cos(rad(a)), 0];          // angle from vertical toward +x
const mid3 = (a, b) => V.lerp(a, b, .5);
const lerpN = (a, b, t) => a + (b - a) * t;
function trunk(J, pelvis, dir, lat = [0, 0, 1], headDir) {
  const d = V.norm(dir);
  J.pelvis = pelvis; J.chest = V.add(pelvis, V.mul(d, 50));
  J.head = V.add(J.chest, V.mul(V.norm(headDir || d), 17));
  J.shoL = V.add(J.chest, V.mul(lat, -18)); J.shoR = V.add(J.chest, V.mul(lat, 18));
  J.hipL = V.add(pelvis, V.mul(lat, -9)); J.hipR = V.add(pelvis, V.mul(lat, 9));
}
function arm(J, sd, hand, pole) { const r = ik3(J["sho" + sd], hand, 32, 30, pole); J["elb" + sd] = r.mid; J["wri" + sd] = r.end; }
function leg(J, sd, ank, pole, toe = [12, 0, 0]) { const r = ik3(J["hip" + sd], ank, 44, 42, pole); J["kne" + sd] = r.mid; J["ank" + sd] = r.end; J["toe" + sd] = V.add(r.end, toe); }
function standLegs(J, feetZ = 13, pole = [1, 0, 0], ax = 0) { for (const [sd, zz] of SIDES) leg(J, sd, [ax, 1, feetZ * zz], pole); }
// equipment
function barZ(c, half = 44, plateR = 12, plateAt = 40) {
  const a = [c[0], c[1], c[2] - half], b = [c[0], c[1], c[2] + half];
  const it = [L3(a, b, "an3bar")];
  if (plateR) it.push(D3([c[0], c[1], c[2] - plateAt], plateR, "an3plate"), D3([c[0], c[1], c[2] + plateAt], plateR, "an3plate"));
  return it;
}
function db3(p, axis, len = 9) { const a = V.add(p, V.mul(axis, -len)), b = V.add(p, V.mul(axis, len)); return [L3(a, b, "an3db"), D3(a, 5, "an3plate"), D3(b, 5, "an3plate")]; }
function box3(x0, x1, y, z, cls = "an3bench") { return { type: "poly", pts: [[x0, y, -z], [x1, y, -z], [x1, y, z], [x0, y, z]], cls, z: -999 }; }
function benchLegs(xs, y) { return xs.map(x => L3([x, 0, 0], [x, y, 0], "an3eq")); }
const post = (x, z, y0, y1) => L3([x, y0, z], [x, y1, z], "an3col");

// shared builders
function curlFrame(u, o) {
  const J = {};
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const phi = lerpN(178, 34, u);
  for (const [sd, zz] of SIDES) {
    const elb = V.add(J["sho" + sd], [2, -32, (o.hz - 18) * zz * 0.4]);
    J["elb" + sd] = elb; J["wri" + sd] = V.add(elb, V.add(V.mul(sag(phi), 30), [0, 0, (o.hz - 18) * zz * 0.6]));
  }
  const items = [...floor3(-40, 60, 34), ...body3(J, "R")];
  if (o.db) for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], sag(phi - 90)));
  else items.push(...barZ(mid3(J.wriL, J.wriR), o.half, o.plate, o.half - 4));
  return { items, J };
}
function pressFrame(u, o) {
  const J = {};
  if (o.seated) {
    trunk(J, [0, 50, 0], [0, 1, 0]);
    for (const [sd, zz] of SIDES) leg(J, sd, [42, 1, 16 * zz], [0.3, 1, 0]);
  } else { trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J); }
  const sy = J.chest[1];
  for (const [sd, zz] of SIDES) {
    const hand = V.lerp(o.A(sy, zz), o.B(sy, zz), u);
    arm(J, sd, hand, o.pole(zz));
  }
  const items = [...floor3(-50, 70, 40)];
  if (o.seated) items.push(box3(-18, 18, 44, 14), { type: "poly", pts: [[-16, 44, -14], [-16, 118, -14], [-16, 118, 14], [-16, 44, 14]], cls: "an3bench", z: -998 }, ...benchLegs([-12, 12], 44));
  items.push(...body3(J, "R"));
  if (o.db) for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], [0, 0, 1]));
  else items.push(...barZ(mid3(J.wriL, J.wriR)));
  return { items, J };
}
function hingeFrame(u, o) {
  const J = {}, lean = lerpN(o.leanA, o.leanB, u), pelvis = V.lerp(o.pA, o.pB, u);
  trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0]);
  return J;
}
function pushupFrame(u, o) {
  const J = {}, P = [-92, 8, 0], L = 136;
  const hA = 64, hB = 17, h = lerpN(hA, hB, u);
  const b = Math.asin((h - P[1]) / L), bA = Math.asin((hA - P[1]) / L), d = [Math.cos(b), Math.sin(b), 0];
  const pelvis = V.add(P, V.mul(d, 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.25, 0]);
  const xs = P[0] + L * Math.cos(bA);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [P[0], P[1], 8 * zz], [0, -1, 0], [2, -8, 0]);
    arm(J, sd, [xs, 1, o.hz * zz], o.pole(zz));
  }
  return { items: [...floor3(-110, 70, 40), ...body3(J, "R")], J };
}
function pullupFrame(u, o) {
  const J = {}, by = 214, cy = lerpN(by - 60, by - 16, u);
  trunk(J, [0, cy - 50, 0], [0, 1, 0]);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [5, cy - 50 - 84, 9 * zz], [1, 0, 0], [8, -6, 0]);
    arm(J, sd, [0, by, 26 * zz], [0.2, -1, 1.2 * zz]);
  }
  const items = [L3([0, by, -56], [0, by, 56], "an3col"), ...body3(J, "R")];
  if (o.weight) { const w = V.add(J.pelvis, [4, -20, 0]); items.push(L3(J.pelvis, w, "an3cable"), D3(w, 10, "an3plate")); }
  return { items, J };
}
function bikeFrame(u) {
  const J = {}, C = [30, 30, 0], th = u * Math.PI * 2;
  trunk(J, [0, 98, 0], sag(28), [0, 0, 1], sag(50));
  const items = [L3([-18, 0, 0], [72, 0, 0], "an3eq"), D3([58, 24, 0], 16, "an3fly"), L3([-2, 90, 0], [8, 40, 0], "an3col"), L3([8, 40, 0], [58, 22, 0], "an3col"),
    L3([58, 22, 0], [46, 110, 0], "an3col"), L3([8, 40, 0], [-10, 0, 0], "an3col"), L3([58, 22, 0], [62, 0, 0], "an3col"),
    L3([-14, 93, 0], [8, 94, 0], "an3pad"), L3([46, 112, -18], [48, 114, 18], "an3eq"), D3(C, 3, "an3eqf")];
  for (const [sd, zz] of SIDES) {
    const a = th + (sd === "R" ? 0 : Math.PI), ank = [C[0] + 16 * Math.cos(a), C[1] + 16 * Math.sin(a), 12 * zz];
    leg(J, sd, ank, [1, 0.6, 0]);
    arm(J, sd, [48, 114, 16 * zz], [0, -1, 0.3 * zz]);
  }
  return { items: [...items, ...body3(J, "R")], J };
}

// ---- Wave 2a samples: lower body and hip machines. Same rig and helpers as the app and Waves 1/3.
const sm = t => t * t * (3 - 2 * t);
const seg = (u, a, b) => sm(clamp01((u - a) / (b - a)));
const TAU = Math.PI * 2;
const body = J => body3(J, "R");
function armTarget(J, sd, zz, mode) {
  const s = J["sho" + sd];
  if (mode === "cross") return [V.add(J.chest, [9, -7, -7 * zz]), [0.2, -1, 0.8 * zz]];
  if (mode === "db") return [V.add(s, [2, -60, 4 * zz]), [-1, 0, 0.1 * zz]];
  return [V.add(s, [3, -58, 8 * zz]), [-1, -0.1, 0.2 * zz]];
}
const arms = (J, mode) => { for (const [sd, zz] of SIDES) { const t = armTarget(J, sd, zz, mode); arm(J, sd, t[0], t[1]); } };
const dbs = J => [...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])];
function floorArm(J, sd, dx, dz) {
  const s = J["sho" + sd], h = [s[0] + dx, 3, s[2] + dz], e = V.lerp(s, h, 32 / 62);
  J["elb" + sd] = e; J["wri" + sd] = h;
}
function stack(x, z, lift) {
  const y0 = 2 + Math.max(0, lift);
  return { top: [x, y0 + 26, z], items: [L3([x - 9, 0, z], [x - 9, 120, z], "an3eq"), L3([x + 9, 0, z], [x + 9, 120, z], "an3eq"),
    { type: "poly", pts: [[x - 7, y0, z], [x + 7, y0, z], [x + 7, y0 + 26, z], [x - 7, y0 + 26, z]], cls: "an3plate" }] };
}
const SLED = [Math.cos(rad(40)), Math.sin(rad(40)), 0], SPERP = [-Math.sin(rad(40)), Math.cos(rad(40)), 0];
function pressSeat(J) {
  const lean = -50, d = sag(lean);
  trunk(J, [0, 40, 0], d, [0, 0, 1], sag(-20));
  for (const [sd, zz] of SIDES) arm(J, sd, [8, 38, 26 * zz], [0, -1, 0.4 * zz]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(d, 60)), V.mul(nb, 7));
  return [...floor3(-70, 120, 44), box3(-22, 18, 34, 16), ...benchLegs([-14, 10], 34),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3bench", z: -998 },
    L3([18, 6, 0], [104, 78, 0], "an3eq"), L3([104, 0, 0], [104, 78, 0], "an3eq")];
}
function sledPlate(c) {
  const a = V.sub(c, V.mul(SPERP, 8)), b = V.add(c, V.mul(SPERP, 26));
  return { type: "poly", pts: [[a[0], a[1], -26], [b[0], b[1], -26], [b[0], b[1], 26], [a[0], a[1], 26]], cls: "an3bench", z: -997 };
}
const BENCH = (x0, x1, y = 40, w = 14) => [box3(x0, x1, y, w), ...benchLegs([x0 + 6, x1 - 6], y)];

// ---- squat patterns

// ---- shared from Waves 5a/5b
// ---- Wave 5a samples: home exercises with body weight and household items (chair, table, towel, backpack).
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };
const ang = b => [Math.cos(b), Math.sin(b), 0];
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// timeline helper for loops: [[u, value], ...] → smooth steps between the points
const tl = (u, pts) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) return lerpN(pts[i - 1][1], pts[i][1], sm(clamp01((u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])))); return pts[pts.length - 1][1]; };

// ---- household furniture
function chair(x0, x1, y = 44, w = 16, back = "x0") {
  const bx = back === "x0" ? x0 : x1, it = [box3(x0, x1, y, w)];
  for (const x of [x0 + 3, x1 - 3]) for (const z of [-w + 3, w - 3]) it.push(L3([x, 0, z], [x, y, z], "an3eq"));
  if (back) it.push({ type: "poly", pts: [[bx, y, -w], [bx, y + 44, -w], [bx, y + 44, w], [bx, y, w]], cls: "an3bench", z: -998 });
  return it;
}
function table(x0, x1, y = 74, w = 46) {
  const it = [box3(x0, x1, y, w)];
  for (const x of [x0 + 4, x1 - 4]) for (const z of [-w + 4, w - 4]) it.push(L3([x, 0, z], [x, y, z], "an3eq"));
  return it;
}
const wallX = (x, y1 = 175, w = 44) => ({ type: "poly", pts: [[x, 0, -w], [x, y1, -w], [x, y1, w], [x, 0, w]], cls: "an3pad2", z: -999 });
const wallZ = (z, x0, x1, y1 = 175) => ({ type: "poly", pts: [[x0, 0, z], [x0, y1, z], [x1, y1, z], [x1, 0, z]], cls: "an3pad2", z: -999 });
function backpack(c, w = 12, h = 30, t = 9) {                       // c = middle of the top edge; hangs straight down
  const p = (dx, dy, dz) => [c[0] + dx, c[1] + dy, c[2] + dz];
  return [{ type: "poly", pts: [p(t, 0, -w), p(t, 0, w), p(t, -h, w + 1), p(t, -h, -w - 1)], cls: "an3plate" },
    { type: "poly", pts: [p(-t, 0, w), p(t, 0, w), p(t, -h, w + 1), p(-t, -h, w + 1)], cls: "an3plate" }];
}
function curve(a, b, sagV, cls = "an3rope", n = 6) {                // a soft line (towel, strap) from a to b, bowed by sagV
  const out = []; let prev = a;
  for (let k = 1; k <= n; k++) { const t = k / n, p = V.add(V.lerp(a, b, t), V.mul(sagV, 4 * t * (1 - t))); out.push(L3(prev, p, cls)); prev = p; }
  return out;
}

// ======================= PUSH =======================
// Push-up ladder. The body is a straight line turning around the feet (or knees); the hands stay put.
// Bottom: chest just above the surface (or 20 from the wall). Top: arms long.
function pushRig(o) {
  const L = o.knees ? 94 : 136, P = o.P, ch = b => [P[0] + L * Math.cos(b), P[1] + L * Math.sin(b)];
  let bB, H;
  if (o.wall !== undefined) { bB = Math.acos((o.wall - 20 - P[0]) / L); const c = ch(bB); H = [o.wall - 1, c[1] - 4]; }
  else { bB = Math.asin((o.hy + 14 - P[1]) / L); const c = ch(bB); H = [c[0] + 4, o.hy + 1]; }
  let bT = bB; while (Math.hypot(d2(ch(bT), H), 6) < 57.5 && bT < bB + 1.2) bT += 0.003;
  return { L, P, bB, bT, H };
}
const RIGS = {};
function pushLadder(u, o) {
  const R = RIGS[o.id] || (RIGS[o.id] = pushRig(o)), J = {}, b = lerpN(R.bT, R.bB, u), d = ang(b), P = R.P;
  const pelvis = V.add([P[0], P[1], 0], V.mul(d, o.knees ? 44 : 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.25, 0]);
  for (const [sd, zz] of SIDES) {
    if (o.knees) { const k = [P[0], P[1], 8 * zz]; setLeg(J, sd, k, V.add(k, [-36, 21, 0]), [-5, -9, 0]); }
    else { const a = [P[0], P[1], 8 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, o.toe || [2, -8, 0]); }
    const hz = o.wall !== undefined ? 22 : 24;
    arm(J, sd, [R.H[0], R.H[1], hz * zz], o.wall !== undefined ? [-0.4, -0.8, 0.9 * zz] : [-0.6, 0.3, 0.9 * zz]);
  }
  const items = [...floor3(o.f0 ?? -110, o.f1 ?? 80, 40), ...(o.gear ? o.gear(R.H) : [])];
  return { items: [...items, ...body(J)], J };
}
const PUSH = {
  wall:  { id: "wall", P: [-30, 6], wall: 66, toe: [10, -3, 0], f0: -60, f1: 80, gear: () => [wallX(66)] },
  table: { id: "table", P: [-92, 8], hy: 72, gear: H => table(H[0] - 4, H[0] + 76) },
  chair: { id: "chair", P: [-92, 8], hy: 45, gear: H => chair(H[0] - 5, H[0] + 33, 44, 16, "x1") },
  knees: { id: "knees", P: [-40, 4], knees: true, hy: 0, f0: -95 },
  full:  { id: "full", P: [-92, 8], hy: 0 },
  feet:  { id: "feet", P: [-96, 47], hy: 0, f0: -130, gear: () => chair(-118, -78, 44, 16, "x0") }
};
// slow lowering: 3 s down, 1 s up
const slowU = u => tl(u, [[0, 0], [.06, 0], [.64, 1], [.72, 1], [.9, 0], [1, 0]]);

// pike push-up: hips high, body like an upside-down V; the head lowers toward the floor just in front of the hands
function pikeRig(F, H) {
  const dv = V.sub(H, F), d = V.len(dv), e = V.mul(dv, 1 / d), n = [-e[1], e[0], 0];
  const a = (86 * 86 - 108 * 108 + d * d) / (2 * d), h = Math.sqrt(86 * 86 - a * a), pT = V.add(V.add(F, V.mul(e, a)), V.mul(n, h));
  const aT = Math.atan2(pT[1] - F[1], pT[0] - F[0]), aB = aT - rad(20), pB = V.add(F, V.mul(ang(aB), 85.5));
  return { aT, aB, dT: V.norm(V.sub(H, pT)), dB: V.norm(V.sub([H[0] + 4, 15, 0], pB)) };
}
function pike(u, o) {
  const R = RIGS["pike" + o.id] || (RIGS["pike" + o.id] = pikeRig(o.F, o.H)), J = {};
  const pelvis = V.add(o.F, V.mul(ang(lerpN(R.aT, R.aB, u)), 85.5)), d = V.norm(V.lerp(R.dT, R.dB, u));
  trunk(J, pelvis, d, [0, 0, 1], d);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [o.F[0], o.F[1], 10 * zz], [1, 0.2, 0], o.toe || [9, -5, 0]);
    arm(J, sd, [o.H[0], 1, 23 * zz], [-1, 0.5, 0.7 * zz]);
  }
  return { items: [...floor3(-100, 90, 40), ...(o.gear || []), ...body(J)], J };
}

// chair dip: hands on the front edge of the seat behind you, lower until the upper arms are about level
function chairDip(u, o) {
  const J = {}, chest = V.lerp([3, 105, 0], [9, 76, 0], u), d = sag(9);
  trunk(J, V.sub(chest, V.mul(d, 50)), d, [0, 0, 1], sag(2));
  for (const [sd, zz] of SIDES) {
    if (o.straight) leg(J, sd, [64, 5, 12 * zz], [0.3, 1, 0], [3, 11, 0]);
    else leg(J, sd, [52, 1, 12 * zz], [0.4, 1, 0]);
    arm(J, sd, [0, 46, 20 * zz], [-1, 0, 0.15 * zz]);
  }
  return { items: [...floor3(-60, 90, 40), ...chair(-38, 2, 44, 18, "x0"), ...body(J)], J };
}

// ======================= PULL =======================
// table row: lying under a sturdy table, hands on the edge, pull the chest up to the table; body stays straight
function tableRow(u, o) {
  const J = {}, P = o.knees ? [-30, 38, 0] : [-100, 4, 0], L = o.knees ? 94 : 136, G = o.knees ? [68, 73] : [44, 73];
  const b = rad(lerpN(o.knees ? -14.5 : 4.3, o.knees ? 6 : 25, u)), d = ang(b);
  const pelvis = V.add(P, V.mul(d, o.knees ? 44 : 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] + 0.25, 0]);
  for (const [sd, zz] of SIDES) {
    if (o.knees) leg(J, sd, [-50, 1, 11 * zz], [0, 1, 0], [-12, 0, 0]);
    else { const a = [P[0], P[1], 8 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [-4, 10, 0]); }
    arm(J, sd, [G[0], G[1], 22 * zz], [-0.3, -1, 0.6 * zz]);
  }
  return { items: [...floor3(-115, 120, 50), ...table(G[0] - 2, G[0] + 70, 75, 50), ...body(J)], J };
}

// prone towel pulldown: face down, towel held tight overhead, pull the elbows down to the ribs, reach back out
function towelPulldown(u) {
  const J = {}, k = hold(u, .1, .42, .6, .9);
  proneBody(J, 0.05);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd];
    const over = V.add(s, V.mul(V.norm([1, 0.2, 0.3 * zz]), 61.6)), pulled = V.add(s, [27, 12, 24 * zz]);
    arm(J, sd, V.lerp(over, pulled, k), [-0.6, 0.35, 1 * zz]);
  }
  return { items: [...floor3(-110, 110, 60), { type: "poly", pts: [[60, 1, -12], [84, 1, -12], [84, 1, 12], [60, 1, 12]], cls: "an3pad2", z: -999 }, ...body(J), L3(J.wriL, J.wriR, "an3rope")], J };
}

// backpack row: hinge forward, pack hangs from both hands, pull it to the lower ribs
function backpackRow(u) {
  const J = {}, lean = 58;
  trunk(J, [-18, 80, 0], sag(lean), [0, 0, 1], sag(lean - 20));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0.2 * zz]);
  const down = V.mul(sag(lean + 90), -1);                                   // toward the floor, from the chest
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], low = [s[0] + 2, s[1] - 58, 12 * zz];
    const e = V.add(V.add(s, V.mul(V.norm(V.sub(J.pelvis, J.chest)), 29)), [0, 9, -4 * zz]), top = V.add(e, [2, -29, 0]);
    arm(J, sd, V.lerp(low, top, u), [-0.6, 1, 0.3 * zz]);
  }
  const c = mid3(J.wriL, J.wriR);
  return { items: [...floor3(-60, 70, 40), ...body(J), ...backpack(V.add(c, [0, -3, 0])), L3(J.wriL, V.add(c, [0, -3, -10]), "an3rope"), L3(J.wriR, V.add(c, [0, -3, 10]), "an3rope")], J };
}

// pull-up negative: step up from a chair, start at the top, lower slowly (≈4 s), feet back on the chair, stand up
function negative(u) {
  const J = {}, by = 214;
  const up = tl(u, [[0, 0], [.08, 0], [.16, 1], [.2, 1], [.76, 0], [.84, 0], [1, 0]]);     // 0 = hang/stand height, 1 = chin over
  const onChair = 1 - seg(u, .14, .19) + seg(u, .82, .9), standK = seg(u, .88, 1) + (u < .14 ? 1 : 0) * (1 - seg(u, .08, .14));
  // chest height: standing on the chair 180, top 198, dead hang 156
  const hangY = 156, chestY = u < .16 ? lerpN(180, 198, seg(u, .08, .16)) : u < .82 ? lerpN(hangY, 198, up) : lerpN(hangY, 180, seg(u, .84, 1));
  trunk(J, [-2, chestY - 50, 0], sag(-3));
  const C = [-30, 44];
  for (const [sd, zz] of SIDES) {
    const free = V.add(J["hip" + sd], [-34, -62, 0]), onC = [C[0] + 18, C[1] + 1, 10 * zz];
    const feetDown = u < .16 ? 1 - seg(u, .1, .16) : u > .8 ? seg(u, .8, .88) : 0;
    leg(J, sd, V.lerp(free, onC, feetDown), [1, 0.1, 0], feetDown > .5 ? [12, 0, 0] : [6, -9, 0]);
    arm(J, sd, [0, by, 26 * zz], [0.2, -1, 1.2 * zz]);
  }
  return { items: [L3([0, by, -56], [0, by, 56], "an3col"), ...floor3(-80, 60, 40), ...chair(-34, 6, 44, 16, "x0"), ...body(J)], J };
}

// ======================= SHOULDERS / UPPER BACK =======================
// prone Y, T, W: face down, forehead on a towel, lift the arms a few cm, thumbs up
function proneBody(J, lift = 0, legLift = 0) {
  const d = V.norm([1, lift, 0]);
  trunk(J, [0, 9, 0], d, [0, 0, 1], [1, -0.35 + lift, 0]);
  for (const [sd, zz] of SIDES) {
    const a = V.add(J["hip" + sd], V.mul(V.norm([-1, legLift, 0.04 * zz]), 86));
    setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [-4, -8, 0]);
  }
}
function ytw(u, shape) {
  const J = {}, k = hold(u, .08, .3, .7, .92);
  proneBody(J, 0.04 * k);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], y = lerpN(-0.1, 0.3, k);
    if (shape === "W") {
      const e = V.add(s, V.mul(V.norm([-0.35, y, 0.95 * zz]), 32)); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(V.norm([1, y, 0.35 * zz]), 30));
    } else {
      const dir = shape === "Y" ? [0.8, y, 0.6 * zz] : [0.05, y, 1 * zz], n = V.norm(dir);
      J["elb" + sd] = V.add(s, V.mul(n, 32)); J["wri" + sd] = V.add(s, V.mul(n, 61));
    }
  }
  return { items: [...floor3(-110, 90, 70), { type: "poly", pts: [[60, 1, -12], [84, 1, -12], [84, 1, 12], [60, 1, 12]], cls: "an3pad2", z: -999 }, ...body(J)], J };
}

// wall slide: back, head and arms against the wall; slide from "goalpost" up into a Y
function wallSlide(u) {
  const J = {}, k = wave(u);
  trunk(J, [-6, 84, 0], sag(-3), [0, 0, 1], sag(0));
  for (const [sd, zz] of SIDES) leg(J, sd, [10, 1, 13 * zz], [1, 0, 0]);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], a = rad(lerpN(0, 52, k));                                     // upper arm angle up from sideways
    const e = V.add(s, [-5, 32 * Math.sin(a), 32 * Math.cos(a) * zz]);
    const f = rad(lerpN(90, 64, k)), w = V.add(e, [-1, 30 * Math.sin(f), 30 * Math.cos(f) * zz]);
    J["elb" + sd] = e; J["wri" + sd] = w;
  }
  return { items: [...floor3(-30, 60, 60), wallX(-14, 190, 60), ...body(J)], J };
}
const wave = (u, n = 1) => 0.5 - 0.5 * Math.cos(TAU * n * u);

// ======================= LEGS =======================
function squatPose(t, deep, armsFwd = true) {
  const J = {}, lean = lerpN(3, deep ? 32 : 28, t);
  trunk(J, V.lerp([0, 86, 0], deep ? [-28, 46, 0] : [-24, 52, 0], t), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [8, 1, 16 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]);
    if (armsFwd) arm(J, sd, V.add(J["sho" + sd], V.mul(V.norm(V.lerp([0.1, -1, 0.1 * zz], [1, 0.1, 0.12 * zz], t)), 58)), [-0.2, -1, 0.3 * zz]);
  }
  return J;
}
const pauseU = u => tl(u, [[0, 0], [.05, 0], [.25, 1], [.62, 1], [.8, 0], [1, 0]]);
const handsOnHips = J => { for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["hip" + sd], [1, 6, 8 * zz]), [-0.6, 0.1, 1 * zz]); };
function splitSq(t, bulgarian) {
  const J = {};
  if (bulgarian) {
    trunk(J, V.lerp([-6, 84, 0], [-12, 50, 0], t), sag(lerpN(4, 14, t)));
    leg(J, "R", [22, 1, 9], [1, 0, 0]);
    leg(J, "L", [-46, 47, -9], [0.4, -1, 0], [-9, -3, 0]);
  } else {
    trunk(J, V.lerp([-10, 82, 0], [-12, 54, 0], t), sag(lerpN(3, 8, t)));
    leg(J, "R", [24, 1, 9], [1, 0, 0]);
    leg(J, "L", [-44, 8, -9], [1, 0, 0], [10, -7, 0]);
  }
  handsOnHips(J);
  return J;
}

// ======================= BACK OF THE BODY =======================
function superman(u) {
  const J = {}, k = hold(u, .08, .28, .72, .9);
  proneBody(J, 0.1 * k, 0.12 * k);
  for (const [sd, zz] of SIDES) {
    const n = V.norm([1, lerpN(-0.06, 0.13, k), 0.22 * zz]);
    J["elb" + sd] = V.add(J["sho" + sd], V.mul(n, 32)); J["wri" + sd] = V.add(J["sho" + sd], V.mul(n, 61));
  }
  return { items: [...floor3(-110, 110, 50), ...body(J)], J };
}
// reverse hyper on the edge of a bed: chest on the bed, hips at the edge, lift straight legs up to body level
function reverseHyper(u) {
  const J = {}, k = wave(u), bedY = 50;
  trunk(J, [2, bedY + 7, 0], [1, 0, 0], [0, 0, 1], [1, -0.25, 0]);
  const a = rad(lerpN(-40, -2, k));
  for (const [sd, zz] of SIDES) {
    const dir = [-Math.cos(a), Math.sin(a), 0.02 * zz], ank = V.add(J["hip" + sd], V.mul(dir, 85));
    const kn = V.add(V.lerp(J["hip" + sd], ank, 44 / 85), [0, 0, 0]);
    setLeg(J, sd, kn, ank, V.mul(V.norm([-dir[1], -dir[0] * -1, 0]), -9));
    arm(J, sd, V.add(J["sho" + sd], [14, -10, 16 * zz]), [-1, -0.2, 0.5 * zz]);
    J["toe" + sd] = V.add(ank, V.mul(V.norm([Math.sin(a) * -1, -Math.cos(a), 0]), 9));
  }
  return { items: [...floor3(-80, 130, 46), box3(-2, 126, bedY, 46), { type: "poly", pts: [[-2, 0, 46], [-2, bedY, 46], [126, bedY, 46], [126, 0, 46]], cls: "an3bench", z: -998 }, ...body(J)], J };
}
// sliding leg curl: on the back, heels on socks or a towel on a smooth floor, hips up, slide the heels in and out
function legCurlFloor(u, ball) {
  const J = {}, k = wave(u), C = [44, 10, 0];
  const py = ball ? lerpN(38, 50, k) : lerpN(22, 42, k), pelvis = [C[0] - Math.sqrt(50 * 50 - (py - C[1]) ** 2), py, 0];
  trunk(J, pelvis, V.norm(V.sub(C, pelvis)), [0, 0, 1], [1, 0, 0]);
  const ax = ball ? lerpN(-84, -48, k) : lerpN(-90, -30, k), ay = ball ? 55 : 3;
  const items = [...floor3(-120, 90, 44)];
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [ax, ay, 9 * zz], [0, 1, 0], ball ? [2, 11, 0] : [3, 11, 0]);
    floorArm(J, sd, -52, 10 * zz);
    if (!ball) items.push(L3([ax - 7, 1, 9 * zz], [ax + 6, 1, 9 * zz], "an3pad"));
  }
  if (ball) items.push(D3([ax + 3, 27, 0], 27, "an3ball"));
  return { items: [...items, ...body(J)], J };
}

// ======================= ARMS =======================
// towel isometric curl: stand on the middle of a towel, curl up to 90° and pull hard – nothing moves
function towelCurl(u) {
  const J = {}, k = hold(u, .06, .22, .82, .95), shake = k > .99 ? 0.6 * Math.sin(u * 140) : 0;
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J, 12);
  const phi = lerpN(176, 88, k);
  const items = [...floor3(-40, 60, 34)];
  for (const [sd, zz] of SIDES) {
    const e = V.add(J["sho" + sd], [2, -32, 2 * zz]); J["elb" + sd] = e;
    J["wri" + sd] = V.add(e, V.add(V.mul(sag(phi), 30), [0, shake, 0]));
    const A = [4, 1, 6 * zz], taut = Math.hypot(30, 52), dd = V.len(V.sub(J["wri" + sd], A));
    items.push(...curve(A, J["wri" + sd], [Math.max(0, taut - dd) * 0.7, 0, 0], "an3rope"));
  }
  items.push(L3([-6, 1, -16], [16, 1, -16], "an3rope"), L3([-6, 1, 16], [16, 1, 16], "an3rope"), L3([4, 0.6, -16], [4, 0.6, 16], "an3pad"));
  return { items: [...items, ...body(J)], J };
}
// backpack curl: a strap in each hand, palms up, elbows still
function backpackCurl(u) {
  const J = {};
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const phi = lerpN(176, 36, u);
  for (const [sd, zz] of SIDES) { const e = V.add(J["sho" + sd], [2, -32, -3 * zz]); J["elb" + sd] = e; J["wri" + sd] = V.add(V.add(e, V.mul(sag(phi), 30)), [0, 0, -4 * zz]); }
  const c = mid3(J.wriL, J.wriR), top = V.add(c, [0, -10, 0]);
  return { items: [...floor3(-40, 60, 34), ...body(J), ...backpack(top), L3(J.wriL, V.add(top, [0, 0, -10]), "an3rope"), L3(J.wriR, V.add(top, [0, 0, 10]), "an3rope")], J };
}
function backpackRdl(u) {
  const J = {}, lean = lerpN(4, 68, u);
  trunk(J, V.lerp([0, 86, 0], [-24, 80, 0], u), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0]);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] + 2, s[1] - 59, 11 * zz], [-1, 0, 0]); }
  const c = mid3(J.wriL, J.wriR), top = V.add(c, [0, -8, 0]);
  return { items: [...floor3(-60, 70, 40), ...body(J), ...backpack(top), L3(J.wriL, V.add(top, [0, 0, -10]), "an3rope"), L3(J.wriR, V.add(top, [0, 0, 10]), "an3rope")], J };
}


function armDir(J, sd, ua, fa) { const e = V.add(J["sho" + sd], V.mul(V.norm(ua), 32)); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(V.norm(fa), 30)); }

// lying DB hamstring curl: face down, a dumbbell held between the feet, curl the heels up, lower slowly
function lyingCurl(u) {
  const J = {}, a = rad(lerpN(4, 82, u));
  trunk(J, [0, 9, 0], [1, 0, 0], [0, 0, 1], [1, -0.45, 0]);
  for (const [sd, zz] of SIDES) {
    const kn = V.add(J["hip" + sd], [-44, -4, 0]), an = V.add(kn, [-42 * Math.cos(a), 42 * Math.sin(a), -3 * zz]);
    setLeg(J, sd, kn, an, V.mul(V.norm([-Math.sin(a), -Math.cos(a), 0]), 10));
    armDir(J, sd, [0.25, -0.17, 0.95 * zz], [0.85, 0, -0.55 * zz]);
  }
  const m = mid3(J.ankL, J.ankR), up = [-Math.sin(a), -Math.cos(a), 0];                  // along the soles
  const c = V.add(m, V.mul(up, 6));
  return { items: [...floor3(-110, 90, 46), ...body(J), L3(V.add(c, V.mul(up, -9)), V.add(c, V.mul(up, 9)), "an3db"), D3(V.add(c, V.mul(up, 9)), 6, "an3plate"), D3(V.add(c, V.mul(up, -9)), 6, "an3plate")], J };
}

const SAMPLES = {}, GUIDES = {}, CARDS = [];
function addWave(tag, label, f) {
  const r = f(); let section = label;
  const cards = (r.CARDS && r.CARDS !== CARDS) ? r.CARDS : Object.keys(r.SAMPLES).map(k => ({ title: k.charAt(0).toUpperCase() + k.slice(1), fam: r.SAMPLES[k].fam || "", keys: [[k, k]], gkey: k }));
  for (const k in r.SAMPLES) SAMPLES[tag + ":" + k] = r.SAMPLES[k];
  for (const c of cards) {
    if (c.section) { section = c.section; continue; }
    const g = r.GUIDES[c.title] || r.GUIDES[c.gkey] || r.GUIDES[c.keys[0][1]] || null;
    const card = { id: tag + ":" + c.keys[0][1], title: c.title, fam: c.fam || "", wave: tag, waveLabel: label, section,
      keys: c.keys.map(([l, k]) => [l, tag + ":" + k]) };
    const old = CARDS.findIndex(x => x.title.toLowerCase() === card.title.toLowerCase());
    if (old >= 0) CARDS.splice(old, 1);
    CARDS.push(card); if (g) GUIDES[card.id] = g;
  }
}
addWave("W1", "Gym basics", () => {
// ---- Wave 1 samples: same rig, same helpers as the live app
// straight arm resting on the floor: shoulder → hand, elbow on the line between
function floorArm(J, sd, dx, dz) {
  const s = J["sho" + sd], h = [s[0] + dx, 3, s[2] + dz], e = V.lerp(s, h, 32 / 62);
  J["elb" + sd] = e; J["wri" + sd] = h;
}
const blk = (x, z, y, w = 7, cls = "an3bench") => ({ type: "poly", pts: [[x - w, y, z - w], [x + w, y, z - w], [x + w, y, z + w], [x - w, y, z + w]], cls, z: -999 });
// weight stack: plates rest at the bottom and rise by "lift" as the cable is pulled
function stack(x, z, lift) {
  const y0 = 2 + Math.max(0, lift);
  return { top: [x, y0 + 26, z], items: [L3([x - 9, 0, z], [x - 9, 120, z], "an3eq"), L3([x + 9, 0, z], [x + 9, 120, z], "an3eq"),
    { type: "poly", pts: [[x - 7, y0, z], [x + 7, y0, z], [x + 7, y0 + 26, z], [x - 7, y0 + 26, z]], cls: "an3plate" }] };
}
const slerpDir = (a, b, u, r) => V.mul(V.norm(V.lerp(V.norm(a), V.norm(b), u)), r);

// flat bench, lying (same geometry as the app's barbell bench press)
function flatBench(u, A, B, pole) {
  const J = {}, by = 44;
  J.pelvis = [0, by + 5, 0]; J.chest = [50, by + 5, 0]; J.head = [67, by + 8, 0];
  for (const [sd, zz] of SIDES)
    limbs(J, sd, [50, by + 5, 17 * zz], V.lerp(A(zz), B(zz), u), pole(zz), [0, by + 5, 9 * zz], [-62, 2, 22 * zz], [0.3, 1, 0.3 * zz], [-12, 0, 0]);
  const items = [...floor3(-80, 100, 45), box3(-55, 78, by, 12), L3([-40, 0, 0], [-40, by, 0], "an3eq"), L3([60, 0, 0], [60, by, 0], "an3eq"), ...body3(J, "R")];
  return { items, J };
}

// push-up with the hands on a raised surface (incline) or on blocks (deficit)
function pushOn(u, o) {
  const J = {}, P = [-92, 8, 0], L = 136, hy = o.hy;
  const hA = hy + o.top, hB = hy + o.bottom, h = lerpN(hA, hB, u);
  const b = Math.asin((h - P[1]) / L), bA = Math.asin((hA - P[1]) / L), d = [Math.cos(b), Math.sin(b), 0];
  const pelvis = V.add(P, V.mul(d, 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.25, 0]);
  const xs = P[0] + L * Math.cos(bA);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [P[0], P[1], 8 * zz], [0, -1, 0], [2, -8, 0]);
    arm(J, sd, [xs, hy + 1, 24 * zz], [-0.6, 0.3, 0.9 * zz]);
  }
  return { J, xs };
}

// 45° leg press seat, shared by leg press and calf raise on the leg press
const SLED = [Math.cos(rad(40)), Math.sin(rad(40)), 0], SPERP = [-Math.sin(rad(40)), Math.cos(rad(40)), 0];
function pressSeat(J) {
  const lean = -50, d = sag(lean);
  trunk(J, [0, 40, 0], d, [0, 0, 1], sag(-20));
  for (const [sd, zz] of SIDES) arm(J, sd, [8, 38, 26 * zz], [0, -1, 0.4 * zz]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(d, 60)), V.mul(nb, 7));
  return [...floor3(-70, 120, 44), box3(-22, 18, 34, 16), ...benchLegs([-14, 10], 34),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3bench", z: -998 },
    L3([18, 6, 0], [104, 78, 0], "an3eq"), L3([104, 0, 0], [104, 78, 0], "an3eq")];
}
function sledPlate(c) {
  const a = V.sub(c, V.mul(SPERP, 8)), b = V.add(c, V.mul(SPERP, 26));
  return { type: "poly", pts: [[a[0], a[1], -26], [b[0], b[1], -26], [b[0], b[1], 26], [a[0], a[1], 26]], cls: "an3bench", z: -997 };
}

// standing between two cable columns
function cableFly(u, o) {
  const J = {};
  trunk(J, [0, 86, 0], sag(8));
  leg(J, "L", [14, 1, -13], [1, 0, 0]); leg(J, "R", [-16, 1, 13], [1, 0, 0]);
  const ay = o.ay, items = [...floor3(-50, 70, 96)];
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], dA = [o.A[0], o.A[1], o.A[2] * zz], dB = [o.B[0], o.B[1], o.B[2] * zz];
    arm(J, sd, V.add(s, slerpDir(dA, dB, u, 60.5)), [-0.4, -0.3, 1 * zz]);   // ~20° bend, held the whole rep
    items.push(post(-14, 90 * zz, 0, 200), D3([-14, ay, 86 * zz], 4, "an3eqf"));
  }
  items.push(...body3(J, "R"));
  for (const [sd, zz] of SIDES) items.push(L3([-14, ay, 86 * zz], J["wri" + sd], "an3cable"), D3(J["wri" + sd], 4, "an3grip"));
  return { items, J };
}
const FLY_CAM = camera(-62, 12, 120, 206, 0.78);

const SAMPLES = {
  "dumbbell bench press": {
    fam: "Press · flat bench",
    cap: ["Top: dumbbells over the shoulders", "Bottom: beside the chest, elbows ~45°"],
    cam: camera(-28, 22, 118, 150), dur: 2800,
    frame: u => {
      const r = flatBench(u, zz => [52, 106, 15 * zz], zz => [40, 57, 28 * zz], zz => [-0.3, -1, 1.1 * zz]);
      for (const sd of ["L", "R"]) r.items.push(...db3(r.J["wri" + sd], [0, 0, 1]));
      return r;
    },
    cues: [{ when: "B", pt: J => J.elbR, text: "Elbows ~45°" }, { when: "all", pt: J => J.toeR, text: "Feet planted" }, { when: "A", pt: J => J.wriL, text: "Over the shoulders" }]
  },
  "goblet squat": {
    fam: "Squat · to a bench",
    cap: ["Start: stand tall, dumbbell at the chest", "Bottom: sit back until you touch the bench"],
    cam: camera(-30, 10, 120, 212, 0.86), dur: 3000,
    frame(u) {
      const J = {}, lean = lerpN(3, 28, u), pelvis = V.lerp([0, 86, 0], [-30, 49, 0], u);
      trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 22));
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [8, 1, 17 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]);
        arm(J, sd, V.add(J.chest, V.add(V.mul(sag(lean + 90), 15), [0, -10, 5 * zz])), [0.2, -1, 0.5 * zz]);
      }
      const bell = V.add(mid3(J.wriL, J.wriR), [2, 4, 0]);
      return { items: [...floor3(-60, 60, 40), box3(-62, -16, 40, 14), ...benchLegs([-56, -22], 40), ...body3(J, "R"), ...db3(bell, [0, 1, 0], 8)], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Sit back to the bench" }, { when: "all", pt: J => J.kneR, text: "Knees follow the toes" }, { when: "B", pt: J => J.chest, text: "Chest up" }]
  },
  "dumbbell romanian deadlift": {
    fam: "Hinge · dumbbells",
    cap: ["Top: stand tall, soft knees", "Bottom: hips back, flat back, weights close"],
    cam: camera(-18, 8, 116, 206, 0.95), dur: 3000,
    frame(u) {
      const J = hingeFrame(u, { leanA: 2, leanB: 64, pA: [0, 86, 0], pB: [-24, 81, 0] });
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] - 4, s[1] - 60, 14 * zz], [-1, 0, 0]); }
      return { items: [...floor3(-60, 80, 40), ...body3(J, "R"), ...db3(J.wriL, [0, 0, 1]), ...db3(J.wriR, [0, 0, 1])], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.pelvis, J.chest), text: "Flat back" }, { when: "B", pt: J => J.pelvis, text: "Hips back" }, { when: "all", pt: J => J.kneR, text: "Soft knees" }]
  },
  "lat pulldown": {
    fam: "Vertical pull · cable",
    cap: ["Start: arms straight up, wide grip", "End: bar to the upper chest"],
    cam: camera(-30, 10, 116, 220, 0.78), dur: 3000,
    frame(u) {
      const pose = u => {
        const J = {};
        trunk(J, [0, 50, 0], sag(lerpN(-6, -14, u)));
        for (const [sd, zz] of SIDES) {
          leg(J, sd, [42, 1, 16 * zz], [0.3, 1, 0]);
          arm(J, sd, V.lerp([6, 160, 34 * zz], [12, 104, 32 * zz], u), [-0.3, -0.6, 1 * zz]);
        }
        return J;
      };
      const J = pose(u), P = [9, 222, 0], bm = mid3(J.wriL, J.wriR), bm0 = mid3(pose(0).wriL, pose(0).wriR);
      const st = stack(-22, 0, V.len(V.sub(bm, P)) - V.len(V.sub(bm0, P)));
      const pad = V.add(mid3(J.kneL, J.kneR), [-2, 9, 0]);
      return { items: [...floor3(-50, 80, 50), box3(-18, 18, 44, 14), ...benchLegs([-12, 12], 44), post(-34, 0, 0, 226), L3([-34, 226, 0], [12, 226, 0], "an3col"),
        ...st.items, L3([-22, 222, 0], st.top, "an3cable"), D3(P, 4, "an3eqf"), D3([-22, 222, 0], 4, "an3eqf"),
        L3([6, 0, 0], [6, pad[1], 0], "an3eq"), ...body3(J, "R"), L3(V.add(pad, [0, 0, -20]), V.add(pad, [0, 0, 20]), "an3pad"),
        L3(bm, P, "an3cable"), L3(V.add(bm, [0, 0, -40]), V.add(bm, [0, 0, 40]), "an3bar"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Bar to upper chest" }, { when: "B", pt: J => J.elbR, text: "Elbows down to your sides" }, { when: "A", pt: J => J.chest, text: "Lean back a little" }]
  },
  "seated cable row": {
    fam: "Horizontal pull · cable",
    cap: ["Start: arms long, small lean forward", "End: handle to the belly, chest tall"],
    cam: camera(-24, 10, 92, 196, 0.95), dur: 2800,
    frame(u) {
      const pose = u => {
        const J = {}, lean = lerpN(16, -2, u);
        trunk(J, [0, 32, 0], sag(lean));
        for (const [sd, zz] of SIDES) {
          leg(J, sd, [70, 18, 11 * zz], [0, 1, 0], [2, 11, 0]);
          const s = J["sho" + sd];
          arm(J, sd, V.lerp([s[0] + 58, 68, 7 * zz], [18, 62, 11 * zz], u), [-1, 0, 0.3 * zz]);
        }
        return J;
      };
      const J = pose(u), J0 = pose(0), A = [118, 64, 0], hm = mid3(J.wriL, J.wriR), hm0 = mid3(J0.wriL, J0.wriR);
      const st = stack(136, 0, V.len(V.sub(hm, A)) - V.len(V.sub(hm0, A)));
      return { items: [...floor3(-40, 150, 36), box3(-24, 18, 28, 14), ...benchLegs([-16, 10], 28), L3([82, 0, 0], [82, 36, 0], "an3pad"),
        post(122, 0, 0, 170), L3([122, 170, 0], [136, 170, 0], "an3col"), ...st.items, L3([136, 168, 0], st.top, "an3cable"), D3(A, 4, "an3eqf"), D3([136, 168, 0], 4, "an3eqf"),
        ...body3(J, "R"), L3(A, hm, "an3cable"), L3(hm, J.wriL, "an3cable"), L3(hm, J.wriR, "an3cable"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.shoL, J.shoR), text: "Squeeze shoulder blades" }, { when: "all", pt: J => J.pelvis, text: "No rocking" }, { when: "B", pt: J => J.wriR, text: "Pull to the belly" }]
  },
  "incline y-raise": {
    fam: "Shoulders · chest on the bench",
    cap: ["Start: arms hanging, chest on the pad", "Top: arms up and out in a Y"],
    cam: camera(-30, 16, 112, 192, 1), dur: 3000,
    frame(u) {
      const J = {}, d = [Math.cos(rad(30)), Math.sin(rad(30)), 0];
      trunk(J, [0, 52, 0], d);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [-34, 1, 14 * zz], [1, -1, 0], [-4, 0, 0]);
        const s = J["sho" + sd];
        arm(J, sd, V.add(s, slerpDir([0.05, -1, 0.06 * zz], [d[0] * 0.85, d[1] * 0.85, 0.52 * zz], u, 59)), [0.4, -1, 0]);   // elbows point to the floor
      }
      const t = V.add(J.chest, V.mul(d, 10)), tx = t[0] + 4, ty = t[1] - 8;
      const items = [...floor3(-70, 110, 50),
        { type: "poly", pts: [[0, 44, -12], [tx, ty, -12], [tx, ty, 12], [0, 44, 12]], cls: "an3pad2", z: -999 },
        { type: "poly", pts: [[0, 44, 12], [tx, ty, 12], [tx, ty - 6, 12], [0, 38, 12]], cls: "an3side", z: -998 },
        { type: "poly", pts: [[-22, 36, -12], [2, 36, -12], [2, 36, 12], [-22, 36, 12]], cls: "an3pad2", z: -999 },
        { type: "poly", pts: [[-22, 36, 12], [2, 36, 12], [2, 31, 12], [-22, 31, 12]], cls: "an3side", z: -998 },
        L3([-10, 0, 0], [-10, 31, 0], "an3eq"), L3([40, 0, 0], [tx - 6, ty - 14, 0], "an3eq"), ...body3(J, "R")];
      for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], [0, 1, 0], 7));
      return { items, J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Thumbs up, arms in a Y" }, { when: "all", pt: J => J.chest, text: "Chest stays on the pad" }]
  },
  "cable fly (mid)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: arms open, slight bend", "End: hands meet at chest height"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 136, A: [0.05, -0.05, 1], B: [1, -0.08, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Hug a big tree" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable fly (low-to-high)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: hands low and wide", "End: scoop up to chest height"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 18, A: [0.1, -0.8, 0.6], B: [1, 0.12, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Scoop up to chest height" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable fly (high-to-low)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: hands high and wide", "End: sweep down toward the hips"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 196, A: [0.05, 0.55, 0.85], B: [0.85, -0.55, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Sweep down and in" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable lateral raise": {
    fam: "Lateral raise · cable, one arm",
    cap: ["Start: hand by the opposite hip", "Top: arm out to shoulder height"],
    cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame(u) {
      const J = {}, t = rad(lerpN(-12, 84, u)), A = [4, 12, -56];
      trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
      const s = J.shoR;
      arm(J, "R", [s[0] + 6, s[1] - 59 * Math.cos(t), s[2] + 5 + 54 * Math.sin(t)], [-0.5, 0.3, 0.6]);
      arm(J, "L", [6, 100, -50], [0, -1, -0.5]);
      return { items: [...floor3(-40, 60, 70), post(4, -62, 0, 180), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }, { when: "A", pt: J => J.shoR, text: "No shrugging" }]
  },
  "lean-away lateral raise": {
    fam: "Lateral raise · dumbbell, one arm",
    cap: ["Start: hold the post, lean away", "Top: arm out to shoulder height"],
    cam: camera(-60, 10, 130, 210, 0.86), dur: 3000,
    frame(u) {
      const J = {}, k = rad(14), up = [0, Math.cos(k), Math.sin(k)], lat = [0, -Math.sin(k), Math.cos(k)];
      trunk(J, [0, 83, -2], up, lat);
      leg(J, "L", [0, 1, -30], [1, 0, 0]); leg(J, "R", [0, 1, -12], [1, 0, 0]);
      arm(J, "L", [4, 112, -56], [0, -1, -0.4]);
      const t = rad(lerpN(2, 84, u)), s = J.shoR;
      arm(J, "R", V.add(V.add(s, [4, 0, 0]), V.add(V.mul(up, -59 * Math.cos(t)), V.mul(lat, 5 + 54 * Math.sin(t)))), V.add(V.add([-0.5, 0, 0], V.mul(up, 0.3)), V.mul(lat, 0.6)));
      return { items: [...floor3(-40, 60, 70), post(4, -62, 0, 180), ...body3(J, "R"), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }, { when: "all", pt: J => J.wriL, text: "Hold on, lean away" }]
  },
  "side-lying lateral raise": {
    fam: "Lateral raise · lying on the side",
    cap: ["Start: dumbbell resting on the hip", "Top: arm raised to just short of vertical"],
    cam: camera(-14, 22, 120, 176, 1), dur: 3000,
    frame(u) {
      const J = {}, by = 44, dir = [1, 0, 0], lat = [0, 1, 0], front = [0, 0, 1];
      trunk(J, [0, by + 10, 0], dir, lat, [1, 0.1, 0]);
      leg(J, "L", V.add(J.hipL, [-78, 0, 14]), [0, 0, 1], [0, 0, 11]);
      leg(J, "R", V.add(J.hipR, [-80, -8, 6]), [0, 0, 1], [0, 0, 11]);
      arm(J, "L", [J.shoL[0] + 26, by + 3, 16], [0, 0.3, -1]);
      const t = rad(lerpN(6, 78, u)), s = J.shoR;
      arm(J, "R", V.add(s, V.add(V.add(V.mul(dir, -57 * Math.cos(t)), V.mul(lat, 57 * Math.sin(t))), V.mul(front, 6))), [0, 0.2, 1]);
      return { items: [...floor3(-110, 110, 30), box3(-70, 76, by, 14), ...benchLegs([-56, 62], by), ...body3(J, "R"), ...db3(J.wriR, [0, 0, 1], 7)], J };
    },
    cues: [{ when: "A", pt: J => J.wriR, text: "Start at the hip" }, { when: "B", pt: J => J.wriR, text: "Lift slowly, lower slower" }]
  },
  "incline push-up": {
    fam: "Push-up · hands raised",
    cap: ["Top: hands on the bench, body in a line", "Bottom: chest to the bench edge"],
    cam: camera(-35, 16, 140, 186, 0.95), dur: 2600,
    frame(u) {
      const { J, xs } = pushOn(u, { hy: 44, top: 58, bottom: 14 });
      return { items: [...floor3(-110, 80, 40), box3(xs - 10, xs + 16, 44, 34), L3([xs + 3, 0, -28], [xs + 3, 44, -28], "an3eq"), L3([xs + 3, 0, 28], [xs + 3, 44, 28], "an3eq"), ...body3(J, "R")], J };
    },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Straight body line" }, { when: "B", pt: J => J.elbR, text: "Elbows ~45°" }]
  },
  "deficit push-up": {
    fam: "Push-up · hands on blocks",
    cap: ["Top: hands on blocks, body in a line", "Bottom: chest below the hands"],
    cam: camera(-35, 16, 140, 172, 0.95), dur: 2800,
    frame(u) {
      const { J, xs } = pushOn(u, { hy: 14, top: 58, bottom: 2 });
      return { items: [...floor3(-110, 80, 40), blk(xs, -24, 14, 10), blk(xs, 24, 14, 10), ...[-1, 1].flatMap(zz => [{ type: "poly", pts: [[xs - 10, 0, 24 * zz + 10], [xs + 10, 0, 24 * zz + 10], [xs + 10, 14, 24 * zz + 10], [xs - 10, 14, 24 * zz + 10]], cls: "an3bench", z: -998 }, { type: "poly", pts: [[xs - 10, 0, 24 * zz - 10], [xs - 10, 0, 24 * zz + 10], [xs - 10, 14, 24 * zz + 10], [xs - 10, 14, 24 * zz - 10]], cls: "an3bench", z: -998 }]), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.chest, text: "Go below the hands" }, { when: "all", pt: J => J.pelvis, text: "Hips in line" }]
  },
  "dumbbell hip thrust": {
    fam: "Hip thrust · dumbbell",
    cap: ["Bottom: hips low, upper back on the bench", "Top: flat from shoulders to knees"],
    cam: camera(-18, 10, 108, 190, 1), dur: 2800,
    frame(u) {
      const J = {}, S = [-8, 46, 0], a = rad(lerpN(38, -2, u));
      const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
      trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], V.add(V.norm(V.sub(S, pelvis)), [0, 0.7, 0]));
      for (const [sd, zz] of SIDES) { leg(J, sd, [84, 1, 14 * zz], [0, 1, 0]); arm(J, sd, V.add(pelvis, [2, 10, 10 * zz]), [0, 1, 0.6 * zz]); }
      return { items: [...floor3(-80, 110, 44), box3(-72, -10, 40, 16), ...benchLegs([-62, -20], 40), ...body3(J, "R"), ...db3(V.add(pelvis, [2, 12, 0]), [0, 0, 1], 11)], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.kneR, J.ankR), text: "Shins vertical" }, { when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }]
  },
  "glute bridge": {
    fam: "Hip thrust · on the floor",
    cap: ["Bottom: lying, knees bent, feet flat", "Top: hips up, straight from shoulders to knees"],
    cam: camera(-20, 16, 118, 170, 1.1), dur: 2800,
    frame(u) {
      const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, u));
      const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
      trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
      for (const [sd, zz] of SIDES) { leg(J, sd, [46, 1, 14 * zz], [0, 1, 0]); floorArm(J, sd, 60, 9 * zz); }
      return { items: [...floor3(-80, 80, 40), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }, { when: "all", pt: J => J.ankR, text: "Push through the heels" }]
  },
  "back extension (45°)": {
    fam: "Hinge · back-extension bench",
    cap: ["Bottom: hinge down over the pad", "Top: one straight line, no arching"],
    cam: camera(-22, 10, 110, 196, 0.92), dur: 3000,
    frame(u) {
      const J = {}, F = [-40, 10, 0], ld = [Math.cos(rad(45)), Math.sin(rad(45)), 0], pelvis = V.add(F, V.mul(ld, 86));
      const lean = lerpN(126, 45, u), d = sag(lean), front = sag(lean + 90);
      trunk(J, pelvis, d, [0, 0, 1], sag(lean + 8));
      for (const [sd, zz] of SIDES) {
        J["ank" + sd] = [F[0], F[1], 9 * zz]; J["kne" + sd] = V.add(J["ank" + sd], V.mul(ld, 42)); J["toe" + sd] = V.add(J["ank" + sd], [10, -6, 0]);
        arm(J, sd, V.add(V.add(J.chest, V.mul(d, -10)), V.add(V.mul(front, 9), [0, 0, -7 * zz])), V.add(front, [0, 0, 1.2 * zz]));
      }
      const hp = V.add(pelvis, [8, -9, 0]);
      return { items: [...floor3(-70, 90, 36), L3([-50, 0, 0], [-44, 6, 0], "an3eq"), L3([-44, 6, 0], [hp[0], hp[1] - 4, 0], "an3eq"), L3([hp[0], 0, 0], [hp[0], hp[1] - 4, 0], "an3eq"),
        L3([-46, 4, -18], [-46, 4, 18], "an3pad"), L3([-34, 19, -18], [-34, 19, 18], "an3pad"), L3(V.add(hp, [0, 0, -18]), V.add(hp, [0, 0, 18]), "an3pad"), ...body3(J, "R")], J };
    },
    cues: [{ when: "A", pt: J => J.pelvis, text: "Hinge at the hips" }, { when: "B", pt: J => J.chest, text: "Stop in a straight line" }]
  },
  "bird dog": {
    fam: "Core · on hands and knees",
    cap: ["Start: hands under shoulders, knees under hips", "Reach: opposite arm and leg out long"],
    cam: camera(-32, 18, 122, 190, 1), dur: 3400,
    frame(u) {
      const J = {}, d = V.norm([1, 0.35, 0]);
      trunk(J, [0, 48, 0], d, [0, 0, 1], [1, 0.15, 0]);
      for (const [sd, zz] of SIDES) {
        const s = J["sho" + sd], h = J["hip" + sd];
        const handA = [s[0], 2, 16 * zz], handB = V.add(s, [60, 6, -2 * zz]);
        const ankA = [h[0] - 42, 4, 9 * zz], ankB = V.add(h, [-84, 6, 0]);
        arm(J, sd, sd === "R" ? V.lerp(handA, handB, u) : handA, [-1, -1, 0]);   // pole never lines up with the arm, so the elbow can't flip
        leg(J, sd, sd === "L" ? V.lerp(ankA, ankB, u) : ankA, [1, -1, 0], sd === "L" ? V.lerp([-10, 0, 0], [2, -10, 0], u) : [-10, 0, 0]);
      }
      return { items: [...floor3(-110, 110, 36), ...body3(J, "all")], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Opposite arm & leg" }, { when: "all", pt: J => mid3(J.pelvis, J.chest), text: "Back flat, hips level" }]
  },
  "reverse crunch": {
    fam: "Core · lying on the back",
    cap: ["Start: knees over hips, back on the floor", "Top: curl the hips up toward the chest"],
    cam: camera(-20, 16, 124, 176, 1.1), dur: 2800,
    frame(u) {
      const J = {}, C = [44, 8, 0], a = rad(lerpN(0, 24, u));
      const pelvis = V.add(C, [-50 * Math.cos(a), 50 * Math.sin(a), 0]);
      trunk(J, pelvis, V.sub(C, pelvis), [0, 0, 1], [1, 0.2, 0]);
      const th = rad(lerpN(4, 44, u));
      for (const [sd, zz] of SIDES) {
        const h = J["hip" + sd], kne = V.add(h, [44 * Math.sin(th), 44 * Math.cos(th), 0]), ank = V.add(kne, [-42 * Math.cos(th), 42 * Math.sin(th), 0]);
        J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, [-10 * Math.cos(th), 10 * Math.sin(th), 0]);
        floorArm(J, sd, -60, 9 * zz);
      }
      return { items: [...floor3(-80, 90, 40), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Curl the hips up" }, { when: "all", pt: J => J.wriR, text: "Slow, no swinging" }]
  },
  "step-up": {
    fam: "Single leg · box",
    cap: ["Start: whole foot on the box", "Top: stand tall on the box"],
    cam: camera(-30, 10, 116, 218, 0.78), dur: 3200,
    frame(u) {
      // The top leg does the work: the body rises first, the back leg leaves the floor only when it has to,
      // trails behind and below the hips, and is set down on the box at the very end.
      const J = {}, bh = 30, sm = t => t * t * (3 - 2 * t), p = sm(clamp01(u / 0.8));
      const pelvis = V.lerp([-4, 84, 0], [16, bh + 85, 0], p);
      trunk(J, pelvis, sag(lerpN(18, 2, p)));
      leg(J, "R", [18, bh + 1, 10], [1, 0, 0]);
      const F = [-14, 1, -10], v = V.sub(F, J.hipL), reach = Math.min(V.len(v), 84 - 12 * p);
      const hang = V.add(J.hipL, V.mul(V.norm(v), reach)), lifted = clamp01((V.len(v) - reach) / 20);
      const k = sm(clamp01((u - 0.8) / 0.2));
      const ankL = V.add(V.lerp(hang, [16, bh + 1, -10], k), [0, 8 * Math.sin(Math.PI * k), 0]);
      leg(J, "L", ankL, [1, 0, 0], V.lerp([12, 0, 0], [4, -10, 0], lifted * (1 - k)));
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.add(s, [2, -60, 3 * zz]), [-1, 0, 0]); }
      return { items: [...floor3(-50, 70, 40), box3(0, 40, bh, 22), { type: "poly", pts: [[0, 0, -22], [0, bh, -22], [0, bh, 22], [0, 0, 22]], cls: "an3bench", z: -998 }, { type: "poly", pts: [[0, 0, 22], [40, 0, 22], [40, bh, 22], [0, bh, 22]], cls: "an3bench", z: -998 },
        ...body3(J, "R"), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "A", pt: J => J.ankR, text: "Whole foot on the box" }, { when: "B", pt: J => J.pelvis, text: "Push through the top leg" }]
  },
  "leg press": {
    fam: "Squat pattern · machine",
    cap: ["Bottom: knees bent, lower back on the pad", "Top: legs long, knees still soft"],
    cam: camera(-24, 12, 100, 182, 1), dur: 3000,
    frame(u) {
      const J = {}, items = pressSeat(J), reach = lerpN(50, 80, u);
      for (const [sd, zz] of SIDES) leg(J, sd, V.add(V.add(J["hip" + sd], V.mul(SLED, reach)), [0, 0, 5 * zz]), [0, 1, 0.3 * zz], V.mul(SPERP, 12));
      const c = V.add(mid3(J.ankL, J.ankR), V.mul(SLED, 4));
      return { items: [...items, sledPlate(c), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.kneR, text: "Don't lock the knees" }, { when: "A", pt: J => J.pelvis, text: "Lower back stays down" }]
  },
  "seated hamstring curl": {
    fam: "Knee curl · seated machine",
    cap: ["Start: legs straight, pad behind the ankles", "End: heels pulled down and under"],
    cam: camera(-20, 12, 104, 190, 1), dur: 2800,
    frame(u) {
      const J = {};
      trunk(J, [0, 52, 0], sag(-10));
      const phi = rad(lerpN(-4, -104, u));
      for (const [sd, zz] of SIDES) {
        const kne = V.add(J["hip" + sd], [44, 0, 0]), ank = V.add(kne, [42 * Math.cos(phi), 42 * Math.sin(phi), 0]);
        J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, [12 * Math.cos(phi + Math.PI / 2), 12 * Math.sin(phi + Math.PI / 2), 0]);
        arm(J, sd, [22, 50, 24 * zz], [0, -1, 0.4 * zz]);
      }
      const pad = V.add(mid3(J.ankL, J.ankR), [7 * Math.cos(phi - Math.PI / 2), 7 * Math.sin(phi - Math.PI / 2), 0]), tp = [34, 63, 0];
      return { items: [...floor3(-50, 110, 40), box3(-20, 46, 44, 14), ...benchLegs([-12, 36], 44),
        { type: "poly", pts: [[-18, 44, -14], [-26, 118, -14], [-26, 118, 14], [-18, 44, 14]], cls: "an3bench", z: -998 },
        L3([44, 52, 0], pad, "an3eq"), ...body3(J, "R"), L3(V.add(tp, [0, 0, -18]), V.add(tp, [0, 0, 18]), "an3pad"), L3(V.add(pad, [0, 0, -16]), V.add(pad, [0, 0, 16]), "an3pad")], J };
    },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Hips back in the seat" }, { when: "B", pt: J => J.ankR, text: "Heels down and under" }]
  },
  "single-leg dumbbell calf raise": {
    fam: "Calves · one leg on a step",
    cap: ["Bottom: heel below the step", "Top: high on the toes, pause"],
    cam: camera(-25, 10, 112, 212, 0.9), dur: 2600,
    frame(u) {
      const J = {}, al = rad(lerpN(198, 126, u)), aR = [14 + 16 * Math.cos(al), 12 + 16 * Math.sin(al), 12];
      trunk(J, [aR[0] + 1, aR[1] + 85.5, 3], [0, 1, 0]);
      leg(J, "R", aR, [1, 0, 0], [0, 0, 0]); J.toeR = [14, 12, 12];
      leg(J, "L", [-26, aR[1] + 36, -8], [1, 0, 0], [2, -11, 0]);
      arm(J, "R", V.add(J.shoR, [2, -60, 4]), [-1, 0, 0]);
      arm(J, "L", [42, 124, -24], [0, -1, -0.5]);
      const step = { type: "poly", pts: [[-10, 12, -24], [22, 12, -24], [22, 12, 24], [-10, 12, 24]], cls: "an3bench", z: -999 };
      return { items: [...floor3(-40, 60, 40), step, L3([22, 0, 24], [22, 12, 24], "an3eq"), post(48, -30, 0, 175), ...body3(J, "R"), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.ankR, text: "Rise high, pause" }, { when: "A", pt: J => J.ankR, text: "Full stretch" }, { when: "all", pt: J => J.wriL, text: "Light hand for balance" }]
  },
  "calf raise on the leg press": {
    fam: "Calves · machine",
    cap: ["Bottom: toes on the edge, heels toward you", "Top: push with the toes, pause"],
    cam: camera(-24, 12, 100, 182, 1), dur: 2600,
    frame(u) {
      const J = {}, items = pressSeat(J), th = rad(lerpN(-22, 34, u));
      let tc;
      for (const [sd, zz] of SIDES) {
        leg(J, sd, V.add(V.add(J["hip" + sd], V.mul(SLED, 84)), [0, 0, 5 * zz]), [0, 1, 0.3 * zz]);
        J["toe" + sd] = V.add(J["ank" + sd], V.add(V.mul(SPERP, 13 * Math.cos(th)), V.mul(SLED, 13 * Math.sin(th))));
        tc = J["toe" + sd];
      }
      const c = V.add(mid3(J.toeL, J.toeR), V.add(V.mul(SLED, 3), V.mul(SPERP, -2)));
      return { items: [...items, sledPlate(c), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.toeR, text: "Push with the toes" }, { when: "all", pt: J => J.kneR, text: "Knees straight, not locked" }]
  }
};

const GUIDES = {
  "dumbbell bench press": {
    steps: ["Sit on the end of the bench with the dumbbells on your thighs, then lie back and bring them up over the chest.", "Feet flat on the floor, shoulder blades pulled back and down.", "Lower the dumbbells beside the chest, elbows about 45° from the body.", "Press up until the arms are straight and the dumbbells are over the shoulders."],
    avoid: ["Flaring the elbows straight out to the sides.", "Letting the dumbbells drift toward the face.", "Dropping the dumbbells to the floor from the top. Bring them back to the thighs and sit up."],
    tip: "Each side works on its own, so a weaker side can't hide. Expect a lighter weight than on the barbell."
  },
  "goblet squat": {
    steps: ["Hold one dumbbell upright against the chest, both hands under the top end.", "Stand in front of a bench, feet a little wider than the hips, toes slightly out.", "Sit the hips back and down until you lightly touch the bench.", "Keep the chest up and push the floor away to stand."],
    avoid: ["Dropping onto the bench and relaxing. Just touch it.", "Knees falling inward. Push them out over the toes.", "Rounding the back to reach the bench."],
    knee: "The bench sets the depth, so you never go deeper than you planned. Use a higher bench if the knee complains.",
    tip: "As it gets easy, use a lower bench, and later squat without one."
  },
  "dumbbell romanian deadlift": {
    steps: ["Stand tall with a dumbbell in each hand in front of the thighs, feet hip-width.", "Unlock the knees slightly and keep that small bend the whole set.", "Push the hips back and let the dumbbells slide down close to the legs, back flat.", "Stop at a strong stretch in the hamstrings, usually just below the knees.", "Squeeze the glutes and push the hips forward to stand."],
    avoid: ["Rounding the back. Stop where you can keep it flat.", "Bending the knees more as you go down (turns it into a squat).", "Letting the dumbbells swing away from the legs."],
    knee: "Knees stay nearly still, so this is a good lift while a knee recovers."
  },
  "lat pulldown": {
    steps: ["Set the thigh pad so your legs are locked in snugly.", "Grip the bar a little wider than the shoulders and sit down with arms straight.", "Lean back a little, chest up.", "Pull the bar to the upper chest, driving the elbows down to your sides.", "Let the bar go back up slowly until the arms are straight."],
    avoid: ["Pulling the bar behind the neck.", "Leaning far back and turning it into a row.", "Letting the weight yank the arms up at the top."]
  },
  "seated cable row": {
    steps: ["Sit with feet on the platform, knees slightly bent.", "Grab the handle and sit tall with arms straight, leaning only a little forward.", "Pull the handle to the belly, squeezing the shoulder blades together.", "Let the arms go long again slowly, without rounding the back."],
    avoid: ["Rocking back and forth to move the weight.", "Shrugging the shoulders up to the ears.", "Rounding the lower back at the start of each rep."]
  },
  "incline y-raise": {
    steps: ["Set a bench to a low incline and lie face down with the chest on the pad.", "Let light dumbbells hang straight down, thumbs pointing up.", "Raise the arms forward and out in a Y, in line with the body.", "Pause at the top, then lower slowly."],
    avoid: ["Going heavy. This is a small muscle, light weights are the point.", "Lifting the chest off the pad to get the weights up.", "Shrugging the shoulders toward the ears."],
    tip: "Start with the lightest dumbbells. Even 1–2 kg is plenty at first."
  },
  "cable fly (mid)": {
    steps: ["Set both pulleys to shoulder height and take a handle in each hand.", "Step forward into a split stance, slight bend in the elbows.", "Bring the hands together in front of the chest in a wide arc, like hugging a big tree.", "Open the arms back slowly until you feel a stretch across the chest."],
    avoid: ["Bending and straightening the elbows (turns it into a press).", "Letting the cables pull the arms too far back.", "Leaning far forward to move more weight."],
    tip: "Same height on both sides is recommended, but a small difference is fine."
  },
  "cable fly (low-to-high)": {
    steps: ["Set both pulleys low and take a handle in each hand.", "Step forward into a split stance, palms facing forward, slight bend in the elbows.", "Scoop the hands up and in until they meet at chest height.", "Lower back slowly along the same arc."],
    avoid: ["Lifting the hands above the chin.", "Bending and straightening the elbows.", "Shrugging the shoulders up."],
    tip: "Hits the upper chest most. Same height on both sides is recommended, but a small difference is fine."
  },
  "cable fly (high-to-low)": {
    steps: ["Set both pulleys high and take a handle in each hand.", "Step forward into a split stance, slight bend in the elbows.", "Sweep the hands down and in until they meet in front of the hips.", "Let the arms rise back slowly along the same arc."],
    avoid: ["Pushing the hands down like a press.", "Rounding the shoulders forward at the bottom.", "Letting the cables yank the arms up."],
    tip: "Hits the lower chest most. Same height on both sides is recommended, but a small difference is fine."
  },
  "cable lateral raise": {
    steps: ["Set the pulley at its lowest point and stand side-on to it.", "Hold the handle with the far hand, in front of the opposite hip.", "Raise the arm out to the side until it reaches shoulder height.", "Lower slowly back across the body. Then swap sides."],
    avoid: ["Swinging the body to start the movement.", "Lifting above shoulder height.", "Shrugging the shoulder up."],
    tip: "The cable keeps tension at the bottom, where a dumbbell feels like nothing."
  },
  "lean-away lateral raise": {
    steps: ["Hold a post or rack with one hand, feet close to it.", "Lean away until the arm holding on is straight.", "With a dumbbell in the free hand, raise the arm out to the side to shoulder height.", "Lower slowly. Then swap sides."],
    avoid: ["Letting go of the lean during the set.", "Swinging the dumbbell up.", "Bending the elbow more as you lift."],
    tip: "The lean makes the start of the movement harder, which is where a normal lateral raise is easy."
  },
  "side-lying lateral raise": {
    steps: ["Lie on your side on a bench, bottom arm supporting the head.", "Hold a light dumbbell in the top hand, resting on the hip.", "Raise the arm up and out until it's almost pointing at the ceiling.", "Lower slowly back to the hip. Then swap sides."],
    avoid: ["Going heavy. A light weight feels heavy here.", "Rolling the body back to help the lift.", "Letting the dumbbell drop at the end."],
    tip: "This one is hardest at the bottom. Use about half the weight of a normal lateral raise."
  },
  "incline push-up": {
    steps: ["Put your hands on a bench or sturdy table edge, a little wider than the shoulders.", "Walk the feet back until the body is one straight line.", "Lower the chest to the edge, elbows about 45° from the body.", "Push back up until the arms are straight."],
    avoid: ["Letting the hips sag or stick up.", "Flaring the elbows straight out.", "Using something that can slide or tip."],
    tip: "The higher the hands, the easier it is. Lower the surface as you get stronger, until you reach the floor."
  },
  "deficit push-up": {
    steps: ["Put your hands on two blocks, plates or push-up handles, a little wider than the shoulders.", "Body in one straight line from head to heels.", "Lower the chest below the level of the hands.", "Push back up until the arms are straight."],
    avoid: ["Going deeper than the shoulders allow. Stop if it pinches.", "Letting the hips sag.", "Blocks that can roll or slide."],
    tip: "The extra depth gives the chest a bigger stretch. Only use it once normal push-ups are easy."
  },
  "dumbbell hip thrust": {
    steps: ["Sit with the upper back against a bench and a dumbbell across the hips.", "Feet flat, hip-width, far enough out that shins are vertical at the top.", "Hold the dumbbell in place and drive through the heels to lift the hips.", "Squeeze the glutes at the top, body flat from shoulders to knees.", "Lower under control."],
    avoid: ["Arching the lower back at the top instead of using the glutes.", "Feet too close, which moves the work to the knees.", "Pushing through the toes."],
    knee: "Knees stay at a fixed angle and take little load. Move the feet further out if the knee feels it.",
    tip: "Put a folded towel under the dumbbell if it presses on the hip bones."
  },
  "glute bridge": {
    steps: ["Lie on your back, knees bent, feet flat and hip-width.", "Arms on the floor by your sides.", "Push through the heels and lift the hips until the body is straight from shoulders to knees.", "Squeeze the glutes at the top for a second, then lower slowly."],
    avoid: ["Arching the lower back to get higher.", "Pushing through the toes.", "Letting the knees fall in or out."],
    knee: "Very little knee load. A good glute exercise on days the knee needs rest.",
    tip: "Too easy? Hold a dumbbell on the hips, or do it with one leg."
  },
  "back extension (45°)": {
    steps: ["Set the pad just below the hip bones so you can bend freely at the hips.", "Hook the heels under the foot pads, arms crossed on the chest.", "Hinge down over the pad with a flat back.", "Rise until the body is one straight line, then lower slowly."],
    avoid: ["Arching back past straight at the top.", "Swinging up fast.", "Pad too high, which stops you hinging at the hips."],
    tip: "Hold a weight plate against the chest when body weight gets easy."
  },
  "bird dog": {
    steps: ["Start on hands and knees: hands under the shoulders, knees under the hips.", "Brace the stomach and keep the back flat.", "Reach one arm forward and the opposite leg back until both are long.", "Pause, return slowly, and switch sides."],
    avoid: ["Twisting the hips as the leg goes back.", "Arching the lower back to lift the leg higher.", "Rushing. Slow is the point."],
    tip: "Imagine a glass of water on your lower back. Don't spill it."
  },
  "reverse crunch": {
    steps: ["Lie on your back, arms by your sides, knees bent over the hips.", "Press the lower back into the floor.", "Curl the hips up off the floor, bringing the knees toward the chest.", "Lower the hips slowly back down."],
    avoid: ["Swinging the legs to get momentum.", "Pushing hard with the hands.", "Letting the lower back arch as the legs come down."],
    tip: "The movement is small. It's the hips curling up, not the legs swinging."
  },
  "step-up": {
    steps: ["Stand facing a box or bench, a dumbbell in each hand.", "Put one whole foot on the box.", "Push through that foot to stand up tall on the box.", "Step back down slowly with the same leg each time. Do all reps, then swap."],
    avoid: ["Pushing off with the back foot to bounce up.", "Box so high the knee goes above the hip.", "Letting the knee collapse inward."],
    knee: "Start with a low step. Raise it as the knee tolerates more.",
    tip: "Start without dumbbells to find your balance."
  },
  "leg press": {
    steps: ["Sit with the lower back flat on the pad, feet hip-width in the middle of the platform.", "Release the safety handles and hold them.", "Lower the platform until the knees are bent about 90°, lower back still on the pad.", "Push the platform away until the legs are long but the knees are not locked."],
    avoid: ["Locking the knees straight at the top.", "Going so deep that the lower back lifts off the pad.", "Pushing through the toes."],
    knee: "Easy to control the depth. Stop where the knee feels fine and go deeper over the weeks.",
    tip: "Feet higher on the platform: more glutes. Feet lower: more front of the thighs."
  },
  "seated hamstring curl": {
    steps: ["Line the knee up with the machine's pivot point.", "Lower the thigh pad so it holds the legs snugly, ankle pad behind the heels.", "Sit back with the hips in the seat and curl the heels down and under.", "Let the legs go back up slowly, about 2–3 seconds."],
    avoid: ["Lifting the hips out of the seat.", "Letting the weight fly up at the end.", "Going through pain in the knee. Shorten the range or go lighter."],
    knee: "If the knee complains, stop and skip it for now. Romanian deadlifts cover the hamstrings too."
  },
  "single-leg dumbbell calf raise": {
    steps: ["Stand on one foot on a step, heel hanging off, dumbbell in the same hand.", "Hold a wall or rail lightly with the other hand for balance.", "Lower the heel below the step for a full stretch.", "Rise as high as you can, pause, then lower slowly. Then swap."],
    avoid: ["Bouncing at the bottom.", "Bending the knee to help.", "Pulling yourself up with the hand on the wall."],
    tip: "Doing one leg at a time doubles the load without needing heavy weights."
  },
  "calf raise on the leg press": {
    steps: ["Sit in the leg press and put the balls of your feet on the bottom edge of the platform.", "Press the platform up, release the safety handles and hold them. Legs straight, knees soft.", "Let the heels come toward you for a stretch.", "Push with the toes as far as you can, pause, then lower slowly."],
    avoid: ["Bending the knees to move the weight.", "Feet too high, which can let them slip off.", "Short bouncy reps."],
    tip: "Keep your hands on the safety handles so you can lock the platform if a foot slips."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W2a", "Lower body and hip machines", () => {
// ---- Wave 2a samples: lower body and hip machines. Same rig and helpers as the app and Waves 1/3.
const sm = t => t * t * (3 - 2 * t);
const seg = (u, a, b) => sm(clamp01((u - a) / (b - a)));
const TAU = Math.PI * 2;
const body = J => body3(J, "R");
function armTarget(J, sd, zz, mode) {
  const s = J["sho" + sd];
  if (mode === "cross") return [V.add(J.chest, [9, -7, -7 * zz]), [0.2, -1, 0.8 * zz]];
  if (mode === "db") return [V.add(s, [2, -60, 4 * zz]), [-1, 0, 0.1 * zz]];
  return [V.add(s, [3, -58, 8 * zz]), [-1, -0.1, 0.2 * zz]];
}
const arms = (J, mode) => { for (const [sd, zz] of SIDES) { const t = armTarget(J, sd, zz, mode); arm(J, sd, t[0], t[1]); } };
const dbs = J => [...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])];
function floorArm(J, sd, dx, dz) {
  const s = J["sho" + sd], h = [s[0] + dx, 3, s[2] + dz], e = V.lerp(s, h, 32 / 62);
  J["elb" + sd] = e; J["wri" + sd] = h;
}
function stack(x, z, lift) {
  const y0 = 2 + Math.max(0, lift);
  return { top: [x, y0 + 26, z], items: [L3([x - 9, 0, z], [x - 9, 120, z], "an3eq"), L3([x + 9, 0, z], [x + 9, 120, z], "an3eq"),
    { type: "poly", pts: [[x - 7, y0, z], [x + 7, y0, z], [x + 7, y0 + 26, z], [x - 7, y0 + 26, z]], cls: "an3plate" }] };
}
const SLED = [Math.cos(rad(40)), Math.sin(rad(40)), 0], SPERP = [-Math.sin(rad(40)), Math.cos(rad(40)), 0];
function pressSeat(J) {
  const lean = -50, d = sag(lean);
  trunk(J, [0, 40, 0], d, [0, 0, 1], sag(-20));
  for (const [sd, zz] of SIDES) arm(J, sd, [8, 38, 26 * zz], [0, -1, 0.4 * zz]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(d, 60)), V.mul(nb, 7));
  return [...floor3(-70, 120, 44), box3(-22, 18, 34, 16), ...benchLegs([-14, 10], 34),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3bench", z: -998 },
    L3([18, 6, 0], [104, 78, 0], "an3eq"), L3([104, 0, 0], [104, 78, 0], "an3eq")];
}
function sledPlate(c) {
  const a = V.sub(c, V.mul(SPERP, 8)), b = V.add(c, V.mul(SPERP, 26));
  return { type: "poly", pts: [[a[0], a[1], -26], [b[0], b[1], -26], [b[0], b[1], 26], [a[0], a[1], 26]], cls: "an3bench", z: -997 };
}
const BENCH = (x0, x1, y = 40, w = 14) => [box3(x0, x1, y, w), ...benchLegs([x0 + 6, x1 - 6], y)];

// ---- squat patterns
function backSquat(t) {
  const J = {}, lean = lerpN(8, 38, t), pelvis = V.lerp([0, 86, 0], [-34, 46, 0], t);
  trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 30));
  for (const [sd, zz] of SIDES) leg(J, sd, [8, 1, 17 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]);
  const bar = V.add(V.add(J.chest, V.mul(sag(lean - 90), 6)), V.mul(sag(lean), -3));     // on the upper back, below the neck
  for (const [sd, zz] of SIDES) arm(J, sd, [bar[0], bar[1], 25 * zz], [-0.4, -1, 0.3 * zz]);
  return { items: [...floor3(-70, 60, 50), ...body(J), ...barZ(bar, 44, 10, 40)], J };
}
function splitSquat(t) {                                                   // rear foot on a bench behind
  const J = {}, pelvis = V.lerp([-6, 84, 0], [-12, 50, 0], t);
  trunk(J, pelvis, sag(lerpN(4, 14, t)));
  leg(J, "R", [22, 1, 9], [1, 0, 0]);
  leg(J, "L", [-46, 41, -9], [0.4, -1, 0], [-9, -3, 0]);
  arms(J, "db");
  return { items: [...floor3(-80, 60, 44), ...BENCH(-62, -30), ...body(J), ...dbs(J)], J };
}
function reverseLunge(t) {
  const J = {};
  trunk(J, [-14 * t, 84 - 34 * t, 0], sag(4 + 6 * t));
  leg(J, "R", [8, 1, 9], [1, 0, 0]);
  leg(J, "L", V.add(V.lerp([0, 1, -9], [-50, 8, -9], t), [0, 8 * Math.sin(Math.PI * t), 0]), [1, 0.2, 0], V.lerp([12, 0, 0], [10, -7, 0], t));
  arms(J, "db");
  return { items: [...floor3(-80, 60, 44), ...body(J), ...dbs(J)], J };
}
function sitToStand(t) {
  const J = {}, r = seg(t, .22, 1), lean = t < .3 ? lerpN(12, 40, t / .3) : lerpN(40, 3, sm((t - .3) / .7));
  trunk(J, V.lerp([-22, 47, 0], [0, 86, 0], r), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) leg(J, sd, [16, 1, 12 * zz], [1, 0, 0.2 * zz]);
  arms(J, "cross");
  return { items: [...floor3(-60, 60, 44), ...BENCH(-44, -6, 44, 16), ...body(J)], J };
}

// ---- hinge
function bStanceRdl(t) {
  const J = {}, lean = lerpN(4, 64, t);
  trunk(J, V.lerp([0, 86, 0], [-22, 81, 0], t), sag(lean), [0, 0, 1], sag(lean - 25));
  leg(J, "R", [0, 1, 10], [1, 0, 0]);
  leg(J, "L", [-16, 5, -9], [1, 0, 0], [11, -4, 0]);                       // kickstand: back toes by the front heel
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] - 4, s[1] - 60, 12 * zz], [-1, 0, 0]); }
  return { items: [...floor3(-60, 70, 40), ...body(J), ...db3(J.wriL, [0, 0, 1]), ...db3(J.wriR, [0, 0, 1])], J };
}

// ---- hip extension, one leg
function slHipThrust(t) {
  const J = {}, S = [-8, 46, 0], a = rad(lerpN(38, -2, t)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], V.add(V.norm(V.sub(S, pelvis)), [0, 0.7, 0]));
  leg(J, "R", [84, 1, 12], [0, 1, 0]);
  const up = V.norm(V.add(V.norm(V.sub(pelvis, S)), [0, 0.45, 0]));
  leg(J, "L", V.add(J.hipL, V.mul(up, 82)), [0, 1, 0], [2, 10, 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, [-26, 47, 24 * zz], [0, 1, 0.3 * zz]);
  return { items: [...floor3(-80, 110, 44), ...BENCH(-72, -10), ...body(J)], J };
}
function slBridge(t) {
  const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, t)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  leg(J, "R", [46, 1, 12], [0, 1, 0]);
  const up = V.norm(V.add(V.norm(V.sub(pelvis, S)), [0, 0.5, 0]));
  leg(J, "L", V.add(J.hipL, V.mul(up, 82)), [0, 1, 0], [2, 10, 0]);
  for (const [sd, zz] of SIDES) floorArm(J, sd, 60, 9 * zz);
  return { items: [...floor3(-80, 80, 40), ...body(J)], J };
}

// ---- side hips
function sideLyingRaise(t) {                                               // lying on the left side, propped on the forearm
  const J = {}, dir = V.norm([1, 0.3, 0]), lat = V.norm([-0.3, 1, 0]);
  trunk(J, [0, 10, 0], dir, lat, [1, 0.5, 0]);
  const sL = J.shoL; J.elbL = [sL[0], 2, sL[2] + 6]; J.wriL = [sL[0] + 28, 2, sL[2] + 10];
  arm(J, "R", [J.chest[0] - 4, 2, 24], [0, 1, 0.3]);
  leg(J, "L", V.add(J.hipL, [-84, 0, 4]), [0, 0, 1], [0, 0, 11]);
  const a = rad(lerpN(4, 36, t));
  leg(J, "R", V.add(J.hipR, [-84 * Math.cos(a), 84 * Math.sin(a), 0]), [0, 0, 1], [0, 0, 11]);
  return { items: [...floor3(-110, 90, 36), ...body(J)], J };
}
function hipMachine(t, abd) {                                              // seated hip abduction / adduction
  const J = {}, a = rad(abd ? lerpN(6, 36, t) : lerpN(36, 6, t));
  trunk(J, [0, 50, 0], sag(-10));
  const items = [...floor3(-50, 80, 50), box3(-18, 26, 44, 16), ...benchLegs([-12, 18], 44),
    { type: "poly", pts: [[-16, 44, -14], [-28, 116, -14], [-28, 116, 14], [-16, 44, 14]], cls: "an3bench", z: -998 }];
  for (const [sd, zz] of SIDES) {
    const h = J["hip" + sd], k = V.add(h, [44 * Math.cos(a), 0, zz * 44 * Math.sin(a)]), an = V.add(k, [4, -38, 0]);
    J["kne" + sd] = k; J["ank" + sd] = an; J["toe" + sd] = V.add(an, [11, 0, 0]);
    arm(J, sd, [6, 46, 24 * zz], [0, -1, 0.4 * zz]);
    const c = V.add(k, [-4, 7, zz * (abd ? 8 : -8)]);
    items.push(L3(V.add(c, [-12, 0, 0]), V.add(c, [10, 0, 0]), "an3pad"));
  }
  return { items: [...items, ...body(J)], J };
}
function cableAbduction(t) {                                               // standing side-on to a low pulley, strap on the outer ankle
  const J = {}, a = rad(lerpN(3, 34, t));
  trunk(J, [0, 84, -4], V.norm([0, 1, -0.06 * t]));
  leg(J, "L", [0, 1, -10], [1, 0, 0]);
  leg(J, "R", V.add(J.hipR, [2, -84 * Math.cos(a), 84 * Math.sin(a)]), [1, 0, 0], [12, 0, 0]);
  arm(J, "L", [-2, 104, -58], [0, -1, -0.4]);
  arm(J, "R", V.add(J.hipR, [2, 8, 9]), [-0.3, 0, 1]);
  const A = [0, 8, -66], st = stack(-18, -66, 0.6 * (V.len(V.sub(J.ankR, A)) - 76));
  return { items: [...floor3(-40, 60, 90), post(0, -70, 0, 170), ...st.items, L3([-18, 168, -66], st.top, "an3cable"), L3([0, 168, -70], [-18, 168, -66], "an3col"), D3(A, 4, "an3eqf"),
    ...body(J), L3(A, J.ankR, "an3cable"), D3(J.ankR, 4, "an3grip")], J };
}
function slLegPress(t) {
  const J = {}, items = pressSeat(J), reach = lerpN(50, 80, t);
  leg(J, "R", V.add(V.add(J.hipR, V.mul(SLED, reach)), [0, 0, 2]), [0, 1, 0.3], V.mul(SPERP, 12));
  leg(J, "L", [22, 18, -16], [0, 1, -0.2], [10, -2, 0]);                   // other foot resting on the frame
  return { items: [...items, sledPlate(V.add(J.ankR, V.mul(SLED, 4))), ...body(J)], J };
}

const SAMPLES = {
  "bsq": { cap: ["Top: bar on the upper back", "Bottom: hips back and down, thighs about level"], cam: camera(-52, 10, 126, 212, 0.86), dur: 3200,
    frame: backSquat, cues: [{ when: "B", pt: J => J.chest, text: "Chest up" }, { when: "all", pt: J => J.kneR, text: "Knees follow the toes" }] },
  "rfess": { cap: ["Top: back foot on the bench", "Bottom: drop straight down"], cam: camera(-24, 10, 132, 212, 0.86), dur: 3000,
    frame: splitSquat, cues: [{ when: "B", pt: J => J.kneR, text: "Front knee over the foot" }, { when: "all", pt: J => J.chest, text: "Chest tall" }] },
  "rl": { cap: ["Start: stand tall", "Bottom: step back, back knee near the floor"], cam: camera(-24, 10, 128, 212, 0.86), dur: 3000,
    frame: reverseLunge, cues: [{ when: "B", pt: J => J.kneR, text: "Front knee over the foot" }] },
  "sts": { cap: ["Start: seated, feet under the knees", "Top: stand all the way up"], cam: camera(-26, 10, 120, 212, 0.86), dur: 3200,
    frame: sitToStand, cues: [{ when: "A", pt: J => J.head, text: "Nose over the toes" }, { when: "B", pt: J => J.pelvis, text: "Squeeze glutes at the top" }] },
  "slp": { cap: ["Bottom: one foot on the platform, knee bent", "Top: leg long, knee still soft"], cam: camera(-24, 12, 100, 182, 1), dur: 3000,
    frame: slLegPress, cues: [{ when: "B", pt: J => J.kneR, text: "Don't lock the knee" }, { when: "A", pt: J => J.pelvis, text: "Lower back stays down" }] },
  "bsr": { cap: ["Top: back toes by the front heel", "Bottom: hinge, most weight on the front leg"], cam: camera(-20, 8, 118, 206, 0.95), dur: 3000,
    frame: bStanceRdl, cues: [{ when: "B", pt: J => mid3(J.pelvis, J.chest), text: "Flat back" }, { when: "all", pt: J => J.ankL, text: "Back foot just for balance" }] },
  "slht": { cap: ["Bottom: hips low, one leg up", "Top: hips level, flat from shoulders to knee"], cam: camera(-18, 10, 108, 190, 1), dur: 2800,
    frame: slHipThrust, cues: [{ when: "B", pt: J => J.pelvis, text: "Hips level" }, { when: "B", pt: J => mid3(J.kneR, J.ankR), text: "Shin vertical" }] },
  "slgb": { cap: ["Bottom: lying, one foot planted", "Top: hips up, level"], cam: camera(-20, 16, 118, 170, 1.1), dur: 2800,
    frame: slBridge, cues: [{ when: "B", pt: J => J.pelvis, text: "Hips level" }, { when: "all", pt: J => J.ankR, text: "Push through the heel" }] },
  "slr": { cap: ["Start: legs stacked", "Top: lift the top leg, toes forward"], cam: camera(-14, 22, 124, 168, 1.05), dur: 2800,
    frame: sideLyingRaise, cues: [{ when: "B", pt: J => J.ankR, text: "Lead with the heel" }, { when: "all", pt: J => J.pelvis, text: "Don't roll back" }] },
  "habd": { cap: ["Start: knees together, pads outside", "End: push the knees out"], cam: camera(65, 22, 118, 170, 1), dur: 2800,
    frame: t => hipMachine(t, true), cues: [{ when: "B", pt: J => J.kneR, text: "Push out, pause" }, { when: "all", pt: J => J.chest, text: "Back on the pad" }] },
  "hadd": { cap: ["Start: knees apart, pads inside", "End: squeeze the knees together"], cam: camera(65, 22, 118, 170, 1), dur: 2800,
    frame: t => hipMachine(t, false), cues: [{ when: "B", pt: J => J.kneR, text: "Squeeze, pause" }, { when: "all", pt: J => J.chest, text: "Back on the pad" }] },
  "cabd": { cap: ["Start: strap on the outer ankle", "End: leg out to the side"], cam: camera(-62, 10, 136, 212, 0.86), dur: 2800,
    frame: cableAbduction, cues: [{ when: "B", pt: J => J.ankR, text: "Lead with the heel" }, { when: "all", pt: J => J.chest, text: "Stand tall" }] }
};

const CARDS = [
  { title: "Barbell back squat", fam: "Squat · barbell", keys: [["Barbell", "bsq"]] },
  { title: "Rear-foot-elevated split squat", fam: "Single leg · bench", keys: [["Dumbbells", "rfess"]] },
  { title: "Reverse lunge", fam: "Single leg · floor", keys: [["Dumbbells", "rl"]] },
  { title: "Sit-to-stand", fam: "Squat · bench", keys: [["Body weight", "sts"]] },
  { title: "Single-leg leg press", fam: "Squat pattern · machine", keys: [["One leg", "slp"]] },
  { title: "B-stance Romanian deadlift", fam: "Hinge · dumbbells", keys: [["Dumbbells", "bsr"]] },
  { title: "Single-leg hip thrust", fam: "Hip thrust · bench", keys: [["Body weight", "slht"]] },
  { title: "Single-leg glute bridge", fam: "Hip thrust · floor", keys: [["Body weight", "slgb"]] },
  { title: "Side-lying leg raise", fam: "Side hips · floor", keys: [["Body weight", "slr"]] },
  { title: "Hip abduction machine", fam: "Side hips · machine", keys: [["Machine", "habd"]] },
  { title: "Hip adduction machine", fam: "Inner thighs · machine", keys: [["Machine", "hadd"]] },
  { title: "Standing cable hip abduction", fam: "Side hips · cable", keys: [["Cable", "cabd"]] }
];

const GUIDES = {
  "Barbell back squat": {
    steps: ["Set the bar in the rack at chest height. Step under it so it rests on the upper back, not the neck.", "Grip just outside the shoulders, elbows pointing down. Stand up and take two small steps back.", "Feet shoulder-width, toes slightly out. Brace the stomach.", "Sit the hips back and down until the thighs are about level, knees following the toes.", "Push the floor away to stand up, chest staying up."],
    avoid: ["Bar on the neck.", "Knees caving inward.", "Heels lifting off the floor.", "Rounding the lower back at the bottom."],
    knee: "Not used if you chose \"go easy on knees\" – the leg press covers the thighs instead (G2b).",
    tip: "Always squat inside the rack with the safety arms set just below your lowest point."
  },
  "Rear-foot-elevated split squat": {
    steps: ["Stand about a big step in front of a bench, a dumbbell in each hand.", "Put the top of your back foot on the bench.", "Drop straight down until the back knee is close to the floor.", "Push through the front foot to come up. Do all reps, then switch legs."],
    avoid: ["Front foot too close to the bench (knee shoots forward).", "Leaning far forward.", "Bouncing at the bottom."],
    knee: "Go only as deep as the front knee is comfortable.",
    tip: "Find your foot position without weights first."
  },
  "Reverse lunge": {
    steps: ["Stand tall with a dumbbell in each hand.", "Take a long step back and lower until the back knee is close to the floor.", "Front knee stays over the foot, chest tall.", "Push through the front foot to step back to standing. Alternate legs or do all reps on one side."],
    avoid: ["Front knee falling inward.", "Short steps that push the front knee past the toes.", "Slamming the back knee down."],
    knee: "Easier on the knees than forward lunges. Shorten the depth if needed."
  },
  "Sit-to-stand": {
    steps: ["Sit near the front of a bench or chair, feet flat under the knees.", "Arms crossed on the chest.", "Lean forward until your nose is over your toes, then stand all the way up.", "Sit back down slowly, with control."],
    avoid: ["Pushing off with the hands.", "Dropping into the seat.", "Knees falling inward."],
    tip: "A lower seat makes it harder; holding a dumbbell at the chest makes it harder still."
  },
  "Single-leg leg press": {
    steps: ["Sit in the leg press with one foot in the middle of the platform.", "Rest the other foot on the frame or floor.", "Lower the platform until the knee is bent about 90°, lower back still on the pad.", "Push back up until the leg is long but the knee isn't locked. Do all reps, then switch."],
    avoid: ["Locking the knee at the top.", "Going so deep that the lower back lifts.", "Letting the knee drift inward."],
    knee: "Easy to control the depth. Stop where the knee feels fine.",
    tip: "Use a little more than half of your two-leg weight to start."
  },
  "B-stance Romanian deadlift": {
    steps: ["Stand with one foot planted and the other a little behind, toes beside the front heel.", "Hold a dumbbell in each hand, most of the weight on the front leg.", "Push the hips back and lower the dumbbells along the front leg, back flat.", "Squeeze the glute to stand up. Do all reps, then switch."],
    avoid: ["Pushing through the back foot – it's only for balance.", "Rounding the back.", "Bending the front knee more as you go down."],
    knee: "Knees stay nearly still – a good choice while a knee recovers.",
    tip: "A step between a normal RDL and a single-leg RDL."
  },
  "Single-leg hip thrust": {
    steps: ["Sit with the upper back against a bench, one foot flat, the other leg lifted.", "Drive through the heel to lift the hips until they're level with the shoulders.", "Keep both hips level at the top and squeeze the glute.", "Lower under control. Do all reps, then switch."],
    avoid: ["Letting the hip of the lifted leg drop.", "Arching the lower back.", "Pushing through the toes."],
    knee: "Little knee load. Move the foot further out if the knee feels it."
  },
  "Single-leg glute bridge": {
    steps: ["Lie on your back, one knee bent with the foot flat, the other leg straight up at an angle.", "Arms on the floor by your sides.", "Push through the heel and lift the hips until they're level.", "Lower slowly. Do all reps, then switch."],
    avoid: ["Hips tilting to one side.", "Arching the lower back.", "Pushing with the arms."],
    knee: "Very little knee load."
  },
  "Side-lying leg raise": {
    steps: ["Lie on your side, propped on the forearm, legs straight and stacked.", "Turn the top foot slightly so the toes point forward or a little down.", "Lift the top leg to about 30–40°, leading with the heel.", "Lower slowly. Do all reps, then switch sides."],
    avoid: ["Rolling the hips back.", "Swinging the leg up.", "Toes turning up toward the ceiling."],
    tip: "This is the side-hip (glute med) exercise the plan calls \"side-lying hip raise\". Add a mini band above the knees to make it harder."
  },
  "Hip abduction machine": {
    steps: ["Sit with your back against the pad, pads on the outside of the knees.", "Hold the handles and keep the back on the pad.", "Push the knees out as far as is comfortable and pause.", "Let them come back slowly."],
    avoid: ["Leaning forward to move more weight.", "Letting the weight slam back.", "Bouncing at the end."],
    tip: "The side hips are key for standing steady on one leg."
  },
  "Hip adduction machine": {
    steps: ["Sit with your back against the pad, pads on the inside of the knees.", "Start with the knees as wide as is comfortable.", "Squeeze the knees together and pause.", "Let them open slowly."],
    avoid: ["Starting wider than is comfortable.", "Letting the weight snap the legs open.", "Leaning forward."]
  },
  "Standing cable hip abduction": {
    steps: ["Put an ankle strap on, attach it to the low pulley and stand side-on with the strap on the outer leg.", "Hold the machine with the near hand, stand tall.", "Lift the leg out to the side, leading with the heel.", "Bring it back slowly. Do all reps, then switch."],
    avoid: ["Leaning the body away to lift higher.", "Turning the toes up.", "Swinging."],
    tip: "The standing leg works too – it's a balance exercise as well."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W2b", "Core and static holds", () => {
// ---- Wave 2b samples: core and static holds.
const breathe = u => 0.7 * Math.sin(TAU * 2 * u);
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));   // 0 → 1, hold, → 0
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };

// ---- Pallof press from the knees: cable at the left side, press out and hold
function kneelPallof(u, half) {
  const J = {}, e = hold(u, .1, .3, .76, .95);
  trunk(J, [2, 47, 0], [0, 1, 0]);
  setLeg(J, "R", [2, 3, 9], [-40, 3, 9], [-4, -2, 0]);                     // right knee down, shin back
  if (half) { leg(J, "L", [42, 1, -10], [1, 0, 0]); }                      // left foot forward
  else setLeg(J, "L", [2, 3, -9], [-40, 3, -9], [-4, -2, 0]);
  const anchor = [4, 86, -120], hand = V.lerp([16, 86, 4], [58, 86, 4], e);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(hand, [0, 0, 3 * zz]), [0, -1, 0.4 * zz]);
  return { items: [...floor3(-60, 80, 130), post(4, -126, 0, 175), D3(anchor, 4, "an3eqf"), ...body(J), L3(anchor, hand, "an3cable"), D3(hand, 5, "an3grip")], J };
}

// ---- planks: straight line from shoulders to ankles (or knees)
function plankBody(J, chestY, endY, len, chestX = 40) {
  const s = Math.asin((chestY - endY) / len), d = [Math.cos(s), Math.sin(s), 0];
  const chest = [chestX, chestY, 0], pelvis = V.sub(chest, V.mul(d, 50));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.3, 0]);
  return d;
}
function forearms(J) { for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; J["elb" + sd] = [s[0], 3, s[2]]; J["wri" + sd] = [s[0] + 28, 3, s[2] - 4 * zz]; } }
function frontPlank(u, lvl) {
  const J = {}, b = breathe(u);
  if (lvl === "knees") {
    const d = plankBody(J, 34 + b, 3, 94);
    for (const [sd, zz] of SIDES) { const k = V.sub(J["hip" + sd], V.mul(d, 44)); setLeg(J, sd, k, V.add(k, [-42, 2, 0]), [-4, -3, 0]); }
    forearms(J);
  } else {
    const d = plankBody(J, 34 + b, 6, 136);
    for (const [sd] of SIDES) { const a = V.sub(J["hip" + sd], V.mul(d, 86)); setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [4, -5, 0]); }
    forearms(J);
    if (lvl === "lift") {                                                   // right arm forward and left leg up, slowly, then down
      const k = hold(u, .1, .32, .72, .92);
      const s = J.shoR, h = V.lerp(J.wriR, V.add(s, [60, 2, 4]), k);
      const r = ik3(s, h, 32, 30, V.lerp([0, -1, 0], [0, 1, 0], k)); J.elbR = V.lerp([s[0], 3, s[2]], r.mid, k); J.wriR = V.lerp(J.wriR, r.end, k);
      const aL = V.add(V.sub(J.hipL, V.mul(d, 86)), [0, 16 * k, 0]); setLeg(J, "L", V.lerp(J.hipL, aL, 44 / 86), aL, [4, -5, 0]);
    }
  }
  return { items: [...floor3(-110, 80, 36), ...body3(J, "all")], J };
}
function inclinePlank(u) {                                                 // hands on a bench, body in a straight line
  const J = {}, b = breathe(u), hy = 44, d = plankBody(J, hy + 58 + b, 8, 136, 30);
  for (const [sd, zz] of SIDES) {
    const a = V.sub(J["hip" + sd], V.mul(d, 86)); setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [4, -5, 0]);
    arm(J, sd, [J.chest[0] + 2, hy + 1, 22 * zz], [-0.6, 0.3, 0.9 * zz]);
  }
  const x = J.chest[0] + 2;
  return { items: [...floor3(-120, 70, 40), box3(x - 12, x + 14, hy, 34), L3([x + 1, 0, -28], [x + 1, hy, -28], "an3eq"), L3([x + 1, 0, 28], [x + 1, hy, 28], "an3eq"), ...body(J)], J };
}

// ---- seated knee lift (knee tuck) on the end of a bench
function kneeLift(t) {
  const J = {};
  trunk(J, [0, 50, 0], sag(lerpN(-30, -18, t)));
  for (const [sd, zz] of SIDES) {
    const h = J["hip" + sd];
    leg(J, sd, V.lerp(V.add(h, [82, -16, 0]), V.add(h, [38, 6, 0]), t), [0, 1, 0], [6, 10, 0]);
    arm(J, sd, [-14, 46, 22 * zz], [-0.2, 1, 0.4 * zz]);
  }
  return { items: [...floor3(-60, 110, 40), ...BENCH(-60, 8, 44), ...body(J)], J };
}

// ---- hollow hold: lying on the back, shoulders and legs off the floor, lower back down
function hollow(u, tucked) {
  const J = {}, b = breathe(u), c = hold(u, .08, .3, .8, .95);
  const a = rad(lerpN(4, 15, c) + b), d = [Math.cos(a), Math.sin(a), 0];
  trunk(J, [0, 7, 0], d, [0, 0, 1], [d[0], d[1] + 0.25, 0]);
  for (const [sd, zz] of SIDES) {
    const h = J["hip" + sd], s = J["sho" + sd];
    if (tucked) {
      leg(J, sd, V.lerp(V.add(h, [-44, 1, 0]), V.add(h, [-40, 30, 0]), c), [0, 1, 0], [-8, 6, 0]);
      arm(J, sd, V.add(s, V.mul(V.norm(V.lerp([-1, -0.05, 0], [-1, 0.3, 0], c)), 58)), [0, 1, 0]);
    } else {
      const la = rad(lerpN(2, 17, c)); leg(J, sd, V.add(h, [-84 * Math.cos(la), 84 * Math.sin(la), 0]), [0, 1, 0], [-4, 10, 0]);
      arm(J, sd, V.add(s, V.mul(V.norm(V.lerp([1, -0.05, 0], [1, 0.22, 0], c)), 59)), [0, 1, 0]);
    }
  }
  return { items: [...floor3(-110, 110, 36), ...body3(J, "all")], J };
}

// ---- Copenhagen side plank: forearm on the floor, top leg on a bench
function copenhagen(t, knee) {
  const J = {}, lat = [0, -1, 0], chest = [40, lerpN(36, 50, t), 0], P = [-12, lerpN(30, 50, t), 0];
  trunk(J, P, V.sub(chest, P), lat, V.add(V.norm(V.sub(chest, P)), [0, 0.2, 0]));
  const s = J.shoR; J.elbR = [s[0], 3, 0]; J.wriR = [s[0], 3, 28];
  arm(J, "L", V.add(J.hipL, [6, 3, 5]), [0, 0, 1]);
  const benchY = 44;
  if (knee) {                                                               // short lever: inside of the knee on the bench
    const k = [-52, benchY + 3, -2]; setLeg(J, "L", k, [-92, benchY + 3, -2], [-4, 0, 10]);
  } else leg(J, "L", [-96, benchY + 4, -2], [1, 0, 0], [0, 0, 11]);
  leg(J, "R", V.lerp([-90, 3, 4], [-84, 30, 4], t), [1, 0, 0], [0, 0, 11]);  // bottom leg lifts toward the bench
  return { items: [...floor3(-130, 70, 30), ...BENCH(-130, -40, benchY, 14), ...body3(J, "all")], J };
}

// ---- glute bridge hold (two legs / one leg)
function bridgeHold(u, one) {
  const J = {}, S = [-44, 8, 0], c = hold(u, .08, .28, .82, .96), a = rad(lerpN(-2, -32, c) + breathe(u) * 0.6);
  const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  leg(J, "R", [46, 1, 12], [0, 1, 0]);
  if (one) { const up = V.norm(V.add(V.norm(V.sub(pelvis, S)), [0, 0.5, 0])); leg(J, "L", V.add(J.hipL, V.mul(up, 82)), [0, 1, 0], [2, 10, 0]); }
  else leg(J, "L", [46, 1, -12], [0, 1, 0]);
  for (const [sd, zz] of SIDES) floorArm(J, sd, 60, 9 * zz);
  return { items: [...floor3(-80, 80, 40), ...body(J)], J };
}

// ---- cable woodchop: rotate through the trunk, arms long, handle on a diagonal.
// kneel = half-kneeling (Some): hips locked, smaller turn from the upper back, lighter and slower.
function woodchop(t, high, kneel) {
  const J = {}, psi = rad(kneel ? lerpN(-25, 20, t) : lerpN(-45, 35, t)), lat = [-Math.sin(psi), 0, Math.cos(psi)];
  if (kneel) {
    trunk(J, [2, 47, 0], [0, 1, 0], lat);
    setLeg(J, "L", [2, 3, -9], [-40, 3, -9], [-4, -2, 0]);                  // knee nearest the cable down
    leg(J, "R", [42, 1, 10], [1, 0, 0]);
    J.hipL = [2 - 9 * lat[0], 47, -9 * lat[2]]; J.hipR = [2 + 9 * lat[0], 47, 9 * lat[2]];
    J.hipL = [2, 47, -9]; J.hipR = [2, 47, 9];                               // hips stay square
    leg(J, "R", [42, 1, 10], [1, 0, 0]);
  } else {
    trunk(J, [0, 82, 0], [0, 1, 0], lat);
    for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 19 * zz], [1, 0, 0.3 * zz], [12, 0, 0]);
  }
  const dS = high ? [0.35, 0.75, -0.6] : [0.35, -0.65, -0.65], dE = high ? [0.5, -0.6, 0.6] : [0.45, 0.7, 0.55];
  const cm = mid3(J.shoL, J.shoR), H = V.add(cm, V.mul(V.norm(V.lerp(V.norm(dS), V.norm(dE), t)), 56));
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(H, [0, 0, 3 * zz]), [-0.3, -1, 0.2 * zz]);
  const A = kneel ? (high ? [0, 150, -92] : [0, 14, -92]) : high ? [0, 196, -92] : [0, 14, -92];
  return { items: [...floor3(-40, 60, 100), post(0, -96, 0, 205), D3(A, 4, "an3eqf"), ...body(J), L3(A, H, "an3cable"), D3(H, 5, "an3grip")], J };
}

// ---- ab crunch machine: hold the handles by the shoulders, curl the chest down toward the hips
function crunchMachine(t) {
  const J = {}, lean = lerpN(-6, 34, t), d = sag(lean), f = sag(lean + 90);
  trunk(J, [0, 50, 0], d, [0, 0, 1], sag(lean + 20));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [36, 9, 10 * zz], [1, 0, 0], [10, -2, 0]);
    arm(J, sd, V.add(J["sho" + sd], V.add(V.mul(d, 18), V.add(V.mul(f, 3), [0, 0, 2 * zz]))), V.add(V.mul(f, 1), [0, 0, 0.8 * zz]));
  }
  const hm = mid3(J.wriL, J.wriR), P = [-30, 168, 0], knot = V.add(hm, V.mul(V.norm(V.sub(P, hm)), 9)), st = stack(-44, 0, 26 * t);   // rope: a straight extension of the cable, splitting only at the hands
  return { items: [...floor3(-60, 70, 44), box3(-18, 22, 44, 16), ...benchLegs([-12, 16], 44),
    { type: "poly", pts: [[-16, 44, -14], [-24, 100, -14], [-24, 100, 14], [-16, 44, 14]], cls: "an3bench", z: -998 },
    ...st.items, L3([-44, 168, 0], st.top, "an3cable"), post(-30, 0, 0, 170), L3([-30, 168, 0], [-44, 168, 0], "an3col"), D3([-30, 168, 0], 4, "an3eqf"),
    L3([36, 16, -16], [36, 16, 16], "an3pad"), ...body(J),
    L3(P, knot, "an3cable"), L3(knot, J.wriL, "an3cable"), L3(knot, J.wriR, "an3cable"), D3(knot, 3, "an3eqf"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
}

const SAMPLES = {
  "pal-h": { cap: ["Half-kneeling, side-on to the cable", "Press out and hold – don't let it turn you"], cam: camera(-58, 10, 140, 200, 0.95), dur: 4000, loop: true,
    frame: u => kneelPallof(u, true), cues: [{ when: "all", pt: J => J.chest, text: "Stay square" }, { when: "all", pt: J => J.pelvis, text: "Squeeze the glute of the down knee" }] },
  "pal-t": { cap: ["Tall-kneeling, both knees down", "Press out and hold"], cam: camera(-58, 10, 140, 200, 0.95), dur: 4000, loop: true,
    frame: u => kneelPallof(u, false), cues: [{ when: "all", pt: J => J.chest, text: "Stay square" }, { when: "all", pt: J => J.pelvis, text: "Hips forward, tall" }] },
  "ipl": { cap: ["Hands on a bench", "Straight line from head to heels"], cam: camera(-35, 16, 140, 186, 0.95), dur: 4000, loop: true,
    frame: inclinePlank, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }] },
  "fpl-k": { cap: ["Level 1 · on the knees", "Forearms under the shoulders"], cam: camera(-32, 16, 132, 176, 1), dur: 4000, loop: true,
    frame: u => frontPlank(u, "knees"), cues: [{ when: "all", pt: J => J.pelvis, text: "Straight line to the knees" }] },
  "fpl-t": { cap: ["Level 2 · on the toes", "Squeeze glutes, ribs down"], cam: camera(-32, 16, 140, 176, 0.95), dur: 4000, loop: true,
    frame: u => frontPlank(u, "toes"), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }, { when: "all", pt: J => J.elbR, text: "Elbows under shoulders" }] },
  "fpl-l": { cap: ["Level 3 · lift an arm and the opposite leg", "Slowly, hips stay level"], cam: camera(-32, 16, 140, 176, 0.95), dur: 4400, loop: true,
    frame: u => frontPlank(u, "lift"), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay level" }] },
  "skl": { cap: ["Start: legs long, feet off the floor", "End: knees pulled in toward the chest"], cam: camera(-22, 12, 112, 196, 1), dur: 2800,
    frame: kneeLift, cues: [{ when: "all", pt: J => J.wriR, text: "Hands on the bench" }, { when: "B", pt: J => J.kneR, text: "Knees to the chest" }] },
  "hol-t": { cap: ["Tucked: knees bent, arms toward the feet", "Lower back pressed down"], cam: camera(-22, 16, 120, 176, 1.05), dur: 4200, loop: true,
    frame: u => hollow(u, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Lower back down" }] },
  "hol-l": { cap: ["Long: legs straight, arms overhead", "Shoulders and legs just off the floor"], cam: camera(-22, 16, 120, 176, 1.05), dur: 4200, loop: true,
    frame: u => hollow(u, false), cues: [{ when: "all", pt: J => J.pelvis, text: "Lower back down" }] },
  "cph-k": { cap: ["Short lever: knee on the bench", "Lift the hips into a straight line"], cam: camera(-12, 12, 150, 176, 0.95), dur: 3600,
    frame: t => copenhagen(t, true), cues: [{ when: "B", pt: J => J.pelvis, text: "Straight line" }, { when: "all", pt: J => J.elbR, text: "Elbow under shoulder" }] },
  "cph-f": { cap: ["Long lever: foot on the bench", "Bottom leg lifts toward the bench"], cam: camera(-12, 12, 150, 176, 0.95), dur: 3600,
    frame: t => copenhagen(t, false), cues: [{ when: "B", pt: J => J.pelvis, text: "Straight line" }, { when: "all", pt: J => J.elbR, text: "Elbow under shoulder" }] },
  "gbh-2": { cap: ["Two legs", "Lift, hold the top, breathe"], cam: camera(-20, 16, 118, 170, 1.1), dur: 4200, loop: true,
    frame: u => bridgeHold(u, false), cues: [{ when: "all", pt: J => J.pelvis, text: "Squeeze glutes" }] },
  "gbh-1": { cap: ["One leg", "Hips stay level while you hold"], cam: camera(-20, 16, 118, 170, 1.1), dur: 4200, loop: true,
    frame: u => bridgeHold(u, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips level" }] },
  "wch-kh": { cap: ["Half-kneeling, high to low", "Hips stay square, turn from the upper back"], cam: camera(-52, 10, 132, 204, 0.86), dur: 3600,
    frame: t => woodchop(t, true, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay square" }] },
  "wch-kl": { cap: ["Half-kneeling, low to high", "Hips stay square, turn from the upper back"], cam: camera(-52, 10, 132, 204, 0.86), dur: 3600,
    frame: t => woodchop(t, false, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay square" }] },
  "wch-h": { cap: ["High-to-low: start high by the cable", "Chop down across the body"], cam: camera(-52, 10, 130, 214, 0.82), dur: 3000,
    frame: t => woodchop(t, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Turn through the chest" }] },
  "wch-l": { cap: ["Low-to-high: start low by the cable", "Lift up across the body"], cam: camera(-52, 10, 130, 214, 0.82), dur: 3000,
    frame: t => woodchop(t, false), cues: [{ when: "all", pt: J => J.pelvis, text: "Turn through the chest" }] },
  "acm": { cap: ["Start: sit tall, rope by the ears", "End: curl the chest toward the hips"], cam: camera(-16, 10, 112, 200, 0.92), dur: 2800,
    frame: crunchMachine, cues: [{ when: "B", pt: J => J.chest, text: "Curl, don't pull with the arms" }] }
};

const CARDS = [
  { title: "Kneeling Pallof press", fam: "Anti-rotation · cable", keys: [["Half-kneeling", "pal-h"], ["Tall-kneeling", "pal-t"]] },
  { title: "Incline plank", fam: "Plank · hands on a bench", keys: [["Bench", "ipl"]] },
  { title: "Front plank", fam: "Plank · forearms · levels", keys: [["Knees", "fpl-k"], ["Toes", "fpl-t"], ["Arm + leg lift", "fpl-l"]] },
  { title: "Seated knee lift", fam: "Front core · bench", keys: [["Bench", "skl"]] },
  { title: "Hollow hold", fam: "Front core · floor", keys: [["Tucked", "hol-t"], ["Long", "hol-l"]] },
  { title: "Copenhagen side plank", fam: "Inner thighs + side core · Experienced", keys: [["Knee", "cph-k"], ["Foot", "cph-f"]] },
  { title: "Glute bridge hold", fam: "Static hold · glutes", keys: [["Two legs", "gbh-2"], ["One leg", "gbh-1"]] },
  { title: "Cable woodchop", fam: "Rotation · cable · kneeling: Some · standing: Experienced", keys: [["Kneeling, high→low", "wch-kh"], ["Kneeling, low→high", "wch-kl"], ["Standing, high→low", "wch-h"], ["Standing, low→high", "wch-l"]] },
  { title: "Ab crunch machine", fam: "Front core · machine", keys: [["Machine", "acm"]] }
];

const GUIDES = {
  "Kneeling Pallof press": {
    steps: ["Set a cable at chest height and kneel side-on to it – one knee down and the other foot forward (half-kneeling), or both knees down (tall-kneeling).", "Hold the handle at the chest with both hands, hips tall and glutes squeezed.", "Press the handle straight out and hold – the cable tries to turn you, don't let it.", "Bring it back slowly. Do all reps, then turn around."],
    levels: ["Tall-kneeling.", "Half-kneeling (knee nearest the cable down).", "Longer holds or more weight."],
    avoid: ["Twisting toward the machine.", "Sitting back on the heels.", "Arching the lower back."],
    tip: "Kneeling takes the legs out, so the core has to do all the work."
  },
  "Incline plank": {
    steps: ["Put your forearms or hands on a bench, walk the feet back.", "Body in one straight line from head to heels.", "Squeeze the glutes and brace the stomach.", "Hold for the set time, breathing calmly."],
    avoid: ["Hips sagging toward the floor.", "Hips piking up high.", "Holding your breath."],
    tip: "The step before the floor plank – the higher the hands, the easier."
  },
  "Front plank": {
    steps: ["Forearms on the floor, elbows under the shoulders.", "Knees or toes on the floor, body in a straight line.", "Squeeze the glutes, pull the ribs down, breathe.", "Hold for the set time."],
    levels: ["Level 1: on the knees.", "Level 2: on the toes.", "Level 3: on the toes, lift one arm and the opposite leg slowly, alternate."],
    avoid: ["Hips sagging (lower back hurts).", "Hips high up in the air.", "Shoulders creeping past the elbows."],
    tip: "Short, perfect holds beat long, sagging ones."
  },
  "Seated knee lift": {
    steps: ["Sit on the end of a bench, hands holding the sides behind you.", "Lean back a little and straighten the legs, feet off the floor.", "Pull the knees in toward the chest.", "Push the legs back out slowly without touching the floor."],
    avoid: ["Rounding the shoulders forward.", "Letting the feet drop to the floor between reps.", "Swinging the legs."],
    tip: "Bend the knees more on the way out to make it easier."
  },
  "Hollow hold": {
    steps: ["Lie on your back and press the lower back into the floor.", "Lift the shoulders and the legs a little off the floor.", "Tucked: knees bent, arms toward the feet. Long: legs straight, arms overhead.", "Hold for the set time while the lower back stays down."],
    levels: ["Tucked.", "One leg long.", "Long."],
    avoid: ["Lower back lifting off the floor – go back to tucked.", "Holding your breath.", "Pulling the head forward with the neck."]
  },
  "Copenhagen side plank": {
    steps: ["Lie on your side next to a bench, forearm on the floor under the shoulder.", "Put the inside of the top knee (or foot) on the bench.", "Lift the hips until the body is in a straight line; the bottom leg lifts toward the bench.", "Hold, or lift and lower slowly. Switch sides."],
    levels: ["Knee on the bench (short lever).", "Foot on the bench (long lever).", "Longer holds."],
    avoid: ["Hips sagging.", "Elbow not under the shoulder.", "Starting with the foot before the knee version is easy."],
    tip: "For Experienced users. Strong inner thighs protect the knees and hips."
  },
  "Glute bridge hold": {
    steps: ["Lie on your back, knees bent, feet flat and hip-width.", "Push through the heels and lift the hips to a straight line.", "Squeeze the glutes and hold, breathing calmly.", "Lower slowly at the end."],
    levels: ["Two legs.", "One leg (the other straight up at an angle)."],
    avoid: ["Arching the lower back to get higher.", "Hips dropping during the hold.", "Pushing through the toes."],
    knee: "Very little knee load."
  },
  "Cable woodchop": {
    steps: ["Set the cable high (or low) and kneel or stand side-on to it.", "Hold the handle with both hands, arms long.", "Turn through the chest and pull the handle diagonally across the body – down for high-to-low, up for low-to-high.", "Let it come back slowly. Do all reps, then switch sides."],
    levels: ["Some: half-kneeling (knee nearest the cable down), light weight, slow – the hips stay square and the turn comes from the upper back.", "Experienced: standing, back foot pivots as you turn."],
    avoid: ["Twisting and bending the lower back at the same time.", "Fast, heavy chops – slow and controlled is the point.", "Bending the arms to pull.", "Letting the cable yank you back."],
    tip: "Not for New users. If the lower back complains, go back to the Pallof press."
  },
  "Ab crunch machine": {
    steps: ["Sit with the feet under the pads and hold the rope ends beside your ears.", "Brace and curl the chest down toward the hips.", "Pause, then come back up slowly.", "Keep the movement in the stomach, not the arms."],
    avoid: ["Pulling with the arms.", "Bouncing the weight.", "Going so heavy that the hips do the work."],
    tip: "An easier start than floor crunches for new users."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W2c", "Upper body and carries", () => {
// ---- Wave 2c samples: upper body and carries.
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };
const rope = (P, J) => {                                                    // rope = straight extension of the cable, splits at the hands
  const hm = mid3(J.wriL, J.wriR), knot = V.add(hm, V.mul(V.norm(V.sub(P, hm)), 9));
  return [L3(P, knot, "an3cable"), L3(knot, J.wriL, "an3cable"), L3(knot, J.wriR, "an3cable"), D3(knot, 3, "an3eqf"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")];
};

// ---- lying on a flat bench (same geometry as the bench press)
function lyingJ() {
  const J = {}, by = 44;
  trunk(J, [0, by + 5, 0], [1, 0, 0], [0, 0, 1], [1, 0.2, 0]);
  for (const [sd, zz] of SIDES) leg(J, sd, [-62, 2, 22 * zz], [0.3, 1, 0.3 * zz], [-12, 0, 0]);
  return J;
}
const lyingItems = () => [...floor3(-80, 100, 45), box3(-55, 78, 44, 12), L3([-40, 0, 0], [-40, 44, 0], "an3eq"), L3([60, 0, 0], [60, 44, 0], "an3eq")];
function pullover(t) {
  const J = lyingJ(), th = rad(lerpN(4, 108, t)), mid = mid3(J.shoL, J.shoR), h = V.add(mid, [57 * Math.sin(th), 57 * Math.cos(th), 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(h, [0, 0, 5 * zz]), [0, 0.3, 1 * zz]);
  return { items: [...lyingItems(), ...body(J), ...db3(V.add(h, [0, 2, 0]), [0, 0, 1], 8)], J };
}
function skullCrusher(t) {
  const J = lyingJ(), ph = rad(lerpN(16, 128, t));
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], e = V.add(s, [32 * Math.sin(rad(14)), 32 * Math.cos(rad(14)), 2 * zz]);
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, [30 * Math.sin(ph), 30 * Math.cos(ph), 0]);
  }
  return { items: [...lyingItems(), ...body(J), ...db3(J.wriL, [0, 0, 1], 7), ...db3(J.wriR, [0, 0, 1], 7)], J };
}

// ---- decline push-up: feet on a bench, hands on the floor
function declinePush(t) {
  const J = {}, F = [-96, 47, 0], L = 136, top = 66, bot = 18;
  const h = lerpN(top, bot, t), b = Math.asin((h - F[1]) / L), bA = Math.asin((top - F[1]) / L), d = [Math.cos(b), Math.sin(b), 0];
  trunk(J, V.add(F, V.mul(d, 86)), d, [0, 0, 1], [d[0], d[1] - 0.3, 0]);
  const xs = F[0] + L * Math.cos(bA);
  for (const [sd, zz] of SIDES) {
    const a = [F[0], F[1], 8 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [2, -8, 0]);
    arm(J, sd, [xs, 1, 24 * zz], [-0.6, 0.3, 0.9 * zz]);
  }
  return { items: [...floor3(-130, 70, 40), ...BENCH(-120, -76, 44, 16), ...body(J)], J };
}

// ---- machine chest press (seated)
function chestPress(t) {
  const J = {};
  trunk(J, [0, 50, 0], sag(-4));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [44, 1, 12 * zz], [1, 0, 0]);
    arm(J, sd, V.lerp([14, 98, 24 * zz], [62, 102, 18 * zz], t), [-0.5, -0.6, 1 * zz]);
  }
  const items = [...floor3(-40, 90, 44), box3(-18, 18, 44, 14), ...benchLegs([-12, 12], 44),
    { type: "poly", pts: [[-16, 44, -14], [-20, 128, -14], [-20, 128, 14], [-16, 44, 14]], cls: "an3bench", z: -998 }, post(-26, -30, 0, 150), post(-26, 30, 0, 150)];
  for (const [sd, zz] of SIDES) items.push(L3([-24, 140, 30 * zz], J["wri" + sd], "an3eq"), D3(J["wri" + sd], 4, "an3grip"));
  return { items: [...items, ...body(J)], J };
}

// ---- single-arm cable row, split stance: left foot forward, right arm rows
function splitRow(t) {
  const J = {};
  trunk(J, [-2, 82, 0], sag(lerpN(14, 8, t)), V.norm([lerpN(0.12, -0.1, t), 0, 1]));
  leg(J, "L", [24, 1, -10], [1, 0, 0]); leg(J, "R", [-26, 1, 10], [1, 0, 0], [12, -2, 0]);
  arm(J, "L", V.add(J.hipL, [10, 4, -2]), [-0.3, 0, -1]);
  const s = J.shoR; arm(J, "R", V.lerp([s[0] + 58, 100, 10], [s[0] + 6, 104, 22], t), [-1, 0, 0.6]);
  const A = [118, 104, 10];
  return { items: [...floor3(-60, 130, 44), post(124, 10, 0, 170), D3(A, 4, "an3eqf"), ...body(J), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
}

// ---- rope overhead triceps extension: facing away from a high pulley, lean forward
function ropeOverhead(t) {
  const J = {};
  trunk(J, [0, 82, 0], sag(24), [0, 0, 1], sag(10));
  leg(J, "L", [22, 1, -10], [1, 0, 0]); leg(J, "R", [-22, 1, 10], [1, 0, 0], [12, -2, 0]);
  const ch = J.chest, f = sag(24 + 90), up = sag(24);
  for (const [sd, zz] of SIDES) {
    const e = V.add(J["sho" + sd], V.add(V.mul(up, 30), V.add(V.mul(f, 5), [0, 0, -5 * zz])));       // elbows up beside the head
    const ph = rad(lerpN(155, 8, t)), dir = V.sub(V.mul(up, Math.cos(ph)), V.mul(f, Math.sin(ph)));   // bent: hands behind the head
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(V.norm(dir), 30));
  }
  const P = [-70, 150, 0];
  return { items: [...floor3(-80, 70, 44), post(-76, 0, 0, 170), D3(P, 4, "an3eqf"), ...body(J), ...rope(P, J)], J };
}
// ---- rope pushdown: facing a high pulley, elbows at the sides
function pushdown(t) {
  const J = {};
  trunk(J, [0, 84, 0], sag(8));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [2, 1, 12 * zz], [1, 0, 0]);
    const e = V.add(J["sho" + sd], [2, -31, 4 * zz]), ph = rad(lerpN(40, 172, t));
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, [30 * Math.sin(ph), 30 * Math.cos(ph), 2 * zz]);
  }
  const P = [40, 190, 0];
  return { items: [...floor3(-40, 70, 44), post(46, 0, 0, 200), D3(P, 4, "an3eqf"), ...body(J), ...rope(P, J)], J };
}

// ---- curls with the elbow fixed
function inclineCurl(t) {                                                   // sitting back on an incline bench, arms hanging behind the body
  const J = {}, lean = -32;
  trunk(J, [0, 50, 0], sag(lean), [0, 0, 1], sag(lean + 30));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [44, 1, 14 * zz], [0.2, 1, 0]);
    const e = V.add(J["sho" + sd], [0, -32, 2 * zz]), ph = lerpN(178, 40, t);
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(ph), 30));
  }
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(sag(lean), 62)), V.mul(nb, 7));
  return { items: [...floor3(-60, 70, 44), box3(-16, 18, 44, 14), ...benchLegs([-10, 12], 44),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3pad2", z: -998 },
    ...body(J), ...db3(J.wriL, sag(lerpN(178, 40, t) - 90)), ...db3(J.wriR, sag(lerpN(178, 40, t) - 90))], J };
}
function spiderCurl(t) {                                                    // chest on an incline bench, arms hanging straight down
  const J = {}, d = [Math.cos(rad(40)), Math.sin(rad(40)), 0];
  trunk(J, [0, 52, 0], d);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [-34, 1, 14 * zz], [1, -1, 0], [-4, 0, 0]);
    const e = V.add(J["sho" + sd], [2, -32, 2 * zz]), ph = lerpN(178, 42, t);
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(ph), 30));
  }
  const top = V.add(J.chest, V.mul(d, 8)), tx = top[0] + 2, ty = top[1] - 8;
  return { items: [...floor3(-70, 110, 44),
    { type: "poly", pts: [[0, 44, -12], [tx, ty, -12], [tx, ty, 12], [0, 44, 12]], cls: "an3pad2", z: -999 },
    { type: "poly", pts: [[0, 44, 12], [tx, ty, 12], [tx, ty - 6, 12], [0, 38, 12]], cls: "an3side", z: -998 },
    L3([6, 0, 0], [6, 40, 0], "an3eq"), L3([40, 0, 0], [tx - 6, ty - 14, 0], "an3eq"), ...body(J),
    ...db3(J.wriL, sag(lerpN(178, 42, t) - 90)), ...db3(J.wriR, sag(lerpN(178, 42, t) - 90))], J };
}
function cableCurl(t) {                                                     // facing a low pulley, short straight bar
  const J = {};
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const ph = lerpN(178, 34, t);   // degrees (sag takes degrees)
  for (const [sd, zz] of SIDES) { const e = V.add(J["sho" + sd], [2, -32, 0]); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(ph), 30)); }
  const bm = mid3(J.wriL, J.wriR), A = [70, 12, 0];
  return { items: [...floor3(-40, 90, 40), post(76, 0, 0, 150), D3(A, 4, "an3eqf"), ...body(J), L3(A, bm, "an3cable"), L3(V.add(bm, [0, 0, -24]), V.add(bm, [0, 0, 24]), "an3bar")], J };
}

// ---- cable rear-delt fly: cables crossed, pull the arms out to a T
function rearFly(t) {
  const J = {};
  trunk(J, [0, 86, 0], sag(4)); standLegs(J, 14);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd];
    arm(J, sd, V.add(s, V.mul(V.norm(V.lerp(V.norm([0.85, -0.05, -0.45 * zz]), V.norm([0.08, 0, 1 * zz]), t)), 59)), [-0.4, 0.3, 0]);
  }
  const AL = [70, 136, -80], AR = [70, 136, 80];
  return { items: [...floor3(-40, 90, 96), post(76, -84, 0, 190), post(76, 84, 0, 190), D3(AL, 4, "an3eqf"), D3(AR, 4, "an3eqf"), ...body(J),
    L3(AL, J.wriR, "an3cable"), L3(AR, J.wriL, "an3cable"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
}

// ---- carries: walking in place on a floor that slides under the feet
function walk(u, o = {}) {
  const J = {}, S = 28, ph = (u * 2) % 1, first = u < .5, off = (u * 2 * S) % S;
  trunk(J, [0, 85 + 1.2 * Math.cos(TAU * 2 * u), 0], V.norm([0, 1, o.lean || 0]));
  const st = lerpN(S / 2, -S / 2, ph), sw = lerpN(-S / 2, S / 2, sm(ph)), lift = 7 * Math.sin(Math.PI * ph);
  const L = first ? [sw, 1 + lift, -9] : [st, 1, -9], R = first ? [st, 1, 9] : [sw, 1 + lift, 9];
  leg(J, "L", L, [1, 0, 0]); leg(J, "R", R, [1, 0, 0]);
  const items = [...floor3(-70, 70, 44)];
  for (let k = -3; k <= 3; k++) { const x = k * S - off; if (x > -70 && x < 70) items.push(L3([x, 0.3, -30], [x, 0.3, 30], "an3eq")); }
  return { J, items, swing: Math.sin(TAU * u) };
}
function carry(u, mode) {
  const w = walk(u), J = w.J, items = w.items;
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], holdIt = mode === "farmer" || (mode === "suitcase" && sd === "R");
    if (mode === "overhead" && sd === "R") arm(J, sd, V.add(s, [0, 61, 2]), [-1, 0, 0]);
    else if (holdIt) arm(J, sd, V.add(s, [2, -60, 6 * zz]), [-1, 0, 0.1 * zz]);
    else arm(J, sd, V.add(s, [(sd === "L" ? 1 : -1) * 14 * w.swing, -57, 8 * zz]), [-1, -0.1, 0.2 * zz]);
  }
  items.push(...body(J));
  if (mode === "farmer") items.push(...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0]));
  else if (mode === "overhead") items.push(...db3(V.add(J.wriR, [0, 3, 0]), [1, 0, 0]));
  else items.push(...db3(J.wriR, [1, 0, 0]));
  return { items, J };
}
function suitcaseHold(u) {
  const J = {}, b = 0.6 * Math.sin(TAU * 2 * u);
  trunk(J, [0, 86 + b * 0.2, 0], [0, 1, 0]); standLegs(J);
  arm(J, "R", V.add(J.shoR, [2, -60, 6]), [-1, 0, 0.1]); arm(J, "L", V.add(J.hipL, [2, 8, -9]), [-0.3, 0, -1]);
  return { items: [...floor3(-40, 60, 44), ...body(J), ...db3(J.wriR, [1, 0, 0])], J };
}
function farmerMarch(u) {
  const J = {}, half = u < .5, s = (u % .5) / .5, k = Math.sin(Math.PI * s);
  trunk(J, [0, 84 - 1.5 * k, half ? 3 : -3], [0, 1, 0]);
  const up = half ? "L" : "R", st = half ? "R" : "L", zz = up === "L" ? -1 : 1;
  leg(J, st, [0, 1, -zz * 10], [1, 0, 0]);
  leg(J, up, V.lerp([0, 1, zz * 10], V.add(J["hip" + up], [42, -54, 0]), k), [1, 0.3, 0], V.lerp([12, 0, 0], [8, -8, 0], k));
  for (const [sd, z2] of SIDES) arm(J, sd, V.add(J["sho" + sd], [2, -60, 6 * z2]), [-1, 0, 0.1 * z2]);
  return { items: [...floor3(-50, 70, 44), ...body(J), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
}

// ---- Turkish get-up: key positions; in between, the targets (hips, chest direction, hands, feet) are blended
// and the body is rebuilt with the rig every frame, so limbs keep their length. Right arm holds the bell straight up.
const TGU_LAT = [0, 0, -1];                                                 // lying head toward +x facing up; after sitting up, facing -x
const RF = [-36, 1, -14], HAND = [10, 2, 50];                               // planted right foot, planted left hand
const TGU_KEYS = [
  { pelvis: [0, 8, 0], dir: [1, 0, 0], hd: [1, 0.3, 0], ankL: [-84, 4, 13], poleL: [0, 1, 0], toeL: [0, 10, 0], handL: [35, 3, 77], poleH: [0, 1, 0] },          // lying, left arm straight out on the floor
  { pelvis: [2, 8, 0], dir: [Math.cos(rad(32)), Math.sin(rad(32)), 0], hd: [1, 0.6, 0], ankL: [-84, 4, 13], poleL: [0, 1, 0], toeL: [0, 10, 0], handL: [64, 3, 38], poleH: [-0.3, -1, 0.3] }, // on the elbow
  { pelvis: [2, 8, 0], dir: [Math.cos(rad(58)), Math.sin(rad(58)), 0], hd: [1, 1.2, 0], ankL: [-84, 4, 13], poleL: [0, 1, 0], toeL: [0, 10, 0], handL: HAND, poleH: [-1, 0, 0] },  // on the hand
  { pelvis: [-28, 40, 18], dir: [0.75, 0.42, 0.5], hd: [0.4, 1, 0.3], ankL: [-108, 6, 29], poleL: [0, 1, 0], toeL: [0, 10, 0], handL: HAND, poleH: [-1, 0, 0] },      // high bridge
  { pelvis: [-10, 38, 6], dir: [0.6, 0.4, 0.45], hd: [0, 1, 0.2], ankL: [30, 3, 22], poleL: [0, -1, 0], toeL: [6, -3, 0], handL: HAND, poleH: [-1, 0, 0] },          // leg swept under, knee down
  { pelvis: [4, 47, 4], dir: [0, 1, 0], hd: [0, 1, 0], ankL: [42, 3, 13], poleL: [0, -1, 0], toeL: [6, -3, 0], handL: [2, 40, 30], poleH: [1, 0, 0.3] },            // half-kneeling
  { pelvis: [-26, 86, -5], dir: [0, 1, 0], hd: [0, 1, 0], ankL: [-34, 1, 4], poleL: [-1, 0, 0], toeL: [-12, 0, 0], handL: [-28, 78, 24], poleH: [1, 0, 0.3] }       // standing
];
function tgu(t) {
  const x = t * 6, i = Math.min(5, Math.floor(x)), f = sm(x - i), A = TGU_KEYS[i], B = TGU_KEYS[i + 1], m = k => V.lerp(A[k], B[k], f), J = {};
  trunk(J, m("pelvis"), V.norm(m("dir")), TGU_LAT, V.norm(m("hd")));
  leg(J, "R", RF, V.lerp([0, 1, 0], [-1, 0.3, 0], seg(x, 3, 5)), [-12, 0, 0]);   // right toes always point forward
  leg(J, "L", m("ankL"), V.norm(m("poleL")), m("toeL"));
  arm(J, "L", m("handL"), V.norm(m("poleH")));
  const s = J.shoR; J.elbR = V.add(s, [0, 31, 0]); J.wriR = V.add(s, [0, 61, 0]);
  const kb = V.add(J.wriR, [0, 9, 0]);
  return { items: [...floor3(-120, 80, 70), ...body3(J, "R"), L3(J.wriR, kb, "an3db"), D3(kb, 8, "an3plate")], J };
}

const SAMPLES = {
  "pov": { cap: ["Start: dumbbell over the chest", "Bottom: arms back behind the head"], cam: camera(-28, 22, 118, 150), dur: 3200,
    frame: pullover, cues: [{ when: "B", pt: J => J.elbR, text: "Slight bend, keep it" }, { when: "all", pt: J => J.pelvis, text: "Hips down" }] },
  "dpu": { cap: ["Top: feet on the bench, body in a line", "Bottom: chest near the floor"], cam: camera(-35, 16, 150, 176, 0.9), dur: 2800,
    frame: declinePush, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }, { when: "B", pt: J => J.elbR, text: "Elbows ~45°" }] },
  "srow": { cap: ["Start: arm long toward the cable", "End: elbow back, hand to the ribs"], cam: camera(-30, 10, 96, 212, 0.86), dur: 2800,
    frame: splitRow, cues: [{ when: "B", pt: J => J.elbR, text: "Elbow past the body" }, { when: "all", pt: J => J.pelvis, text: "Hips face forward" }] },
  "mcp": { cap: ["Start: handles by the chest", "End: arms long, not locked"], cam: camera(-28, 10, 104, 200, 0.92), dur: 2800,
    frame: chestPress, cues: [{ when: "all", pt: J => J.chest, text: "Back on the pad" }, { when: "B", pt: J => J.elbR, text: "Don't lock the elbows" }] },
  "rote": { cap: ["Start: rope behind the head, elbows up", "End: arms straight forward and up"], cam: camera(-24, 10, 120, 210, 0.86), dur: 2800,
    frame: ropeOverhead, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows stay up" }] },
  "push": { cap: ["Start: hands at chest height", "End: arms straight, rope apart at the bottom"], cam: camera(-26, 10, 112, 214, 0.86), dur: 2600,
    frame: pushdown, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows pinned to the sides" }] },
  "dsk": { cap: ["Top: arms angled slightly back", "Bottom: dumbbells beside the head"], cam: camera(-28, 22, 118, 150), dur: 2800,
    frame: skullCrusher, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows still" }] },
  "icu": { cap: ["Start: arms hanging behind the body", "Top: curled up, elbows still"], cam: camera(-24, 10, 110, 196, 1), dur: 2800,
    frame: inclineCurl, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows stay back" }] },
  "scu": { cap: ["Start: chest on the pad, arms hanging", "Top: curled up, upper arms still"], cam: camera(-30, 16, 112, 192, 1), dur: 2800,
    frame: spiderCurl, cues: [{ when: "all", pt: J => J.chest, text: "Chest stays on the pad" }] },
  "ccu": { cap: ["Start: arms straight, facing the cable", "Top: curled up, elbows at the sides"], cam: camera(-30, 10, 110, 210, 0.92), dur: 2600,
    frame: cableCurl, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows at the sides" }] },
  "rfly": { cap: ["Start: hands crossed in front", "End: arms out in a T"], cam: camera(-62, 12, 126, 206, 0.78), dur: 2800,
    frame: rearFly, cues: [{ when: "B", pt: J => J.wriR, text: "Arms out to a T" }, { when: "all", pt: J => J.chest, text: "No shrugging" }] },
  "suh": { cap: ["Suitcase hold", "One dumbbell, stand tall – don't lean"], cam: camera(-58, 10, 130, 212, 0.86), dur: 4000, loop: true,
    frame: suitcaseHold, cues: [{ when: "all", pt: J => J.chest, text: "Stay level" }] },
  "suc": { cap: ["Suitcase carry", "Walk tall, one dumbbell"], cam: camera(-50, 10, 126, 212, 0.86), dur: 1600, loop: true,
    frame: u => carry(u, "suitcase"), cues: [{ when: "all", pt: J => J.chest, text: "Don't lean" }] },
  "fac": { cap: ["Farmer carry", "Walk tall, a dumbbell in each hand"], cam: camera(-50, 10, 126, 212, 0.86), dur: 1600, loop: true,
    frame: u => carry(u, "farmer"), cues: [{ when: "all", pt: J => J.chest, text: "Chest tall" }] },
  "fam": { cap: ["Farmer march", "Knee to hip height, slowly"], cam: camera(-30, 10, 116, 214, 0.86), dur: 2200, loop: true,
    frame: farmerMarch, cues: [{ when: "all", pt: J => J.chest, text: "Stand tall" }] },
  "ohc": { cap: ["Overhead carry", "Arm locked straight up, walk"], cam: camera(-50, 10, 126, 216, 0.8), dur: 1600, loop: true,
    frame: u => carry(u, "overhead"), cues: [{ when: "all", pt: J => J.chest, text: "Ribs down" }] },
  "tgu": { cap: ["Lying → elbow → hand → bridge → kneel → stand", "Eyes on the bell, arm straight up all the way"], cam: camera(-30, 14, 128, 196, 0.86), dur: 9000,
    frame: tgu, cues: [{ when: "all", pt: J => J.wriR, text: "Arm stays straight up" }] }
};

const CARDS = [
  { title: "Dumbbell pullover", fam: "Chest and back · bench", keys: [["Dumbbell", "pov"]] },
  { title: "Decline push-up", fam: "Push-up · feet raised", keys: [["Feet on bench", "dpu"]] },
  { title: "Single-arm cable row, split stance", fam: "Row · cable", keys: [["Cable", "srow"]] },
  { title: "Machine chest press", fam: "Press · machine", keys: [["Machine", "mcp"]] },
  { title: "Rope overhead triceps extension", fam: "Triceps · cable", keys: [["Rope", "rote"]] },
  { title: "Rope pushdown", fam: "Triceps · cable", keys: [["Rope", "push"]] },
  { title: "Dumbbell skull crusher", fam: "Triceps · bench", keys: [["Dumbbells", "dsk"]] },
  { title: "Incline dumbbell curl", fam: "Biceps · incline bench", keys: [["Dumbbells", "icu"]] },
  { title: "Spider curl", fam: "Biceps · incline bench, face down", keys: [["Dumbbells", "scu"]] },
  { title: "Cable curl", fam: "Biceps · cable", keys: [["Bar", "ccu"]] },
  { title: "Cable rear-delt fly", fam: "Rear shoulders · cable", keys: [["Crossed cables", "rfly"]] },
  { title: "Suitcase hold & carry", fam: "Carry · one side", keys: [["Hold", "suh"], ["Carry", "suc"]] },
  { title: "Farmer carry & march", fam: "Carry · both hands", keys: [["Carry", "fac"], ["March", "fam"]] },
  { title: "Overhead carry", fam: "Carry · overhead", keys: [["One arm", "ohc"]] },
  { title: "Turkish get-up", fam: "Full body · kettlebell · Experienced", keys: [["Kettlebell", "tgu"]] }
];

const GUIDES = {
  "Dumbbell pullover": {
    steps: ["Lie on a bench, holding one dumbbell with both hands over the chest.", "Keep a slight bend in the elbows.", "Lower the dumbbell in an arc behind the head until you feel a stretch in the chest and armpits.", "Pull it back over the chest along the same arc."],
    avoid: ["Bending and straightening the elbows (turns it into a triceps exercise).", "Going further back than the shoulders allow.", "Arching the lower back – keep the hips down."]
  },
  "Decline push-up": {
    steps: ["Put your feet on a bench and your hands on the floor, a little wider than the shoulders.", "Body in one straight line.", "Lower the chest toward the floor, elbows about 45°.", "Push back up."],
    avoid: ["Hips sagging or piking up.", "Head dropping toward the floor.", "Elbows flaring straight out."],
    tip: "Harder than a normal push-up and works the upper chest more. Lower the feet to make it easier."
  },
  "Single-arm cable row, split stance": {
    steps: ["Set a cable at chest height. Stand in a split stance with the opposite foot forward.", "Hold the handle with one arm long, slight lean forward.", "Pull the elbow back past the body, hand to the ribs.", "Let the arm go long again slowly. Do all reps, then switch."],
    avoid: ["Twisting the whole body to pull.", "Shrugging the shoulder.", "Letting the weight yank the arm forward."],
    tip: "The split stance makes the hips and core work to keep you square."
  },
  "Machine chest press": {
    steps: ["Set the seat so the handles are at mid-chest height.", "Back flat on the pad, feet on the floor.", "Press the handles forward until the arms are long, without locking the elbows.", "Come back slowly until you feel a stretch in the chest."],
    avoid: ["Lifting the back off the pad.", "Locking the elbows hard at the end.", "Letting the weight crash back."],
    tip: "A safe way to train the chest heavy without a spotter."
  },
  "Rope overhead triceps extension": {
    steps: ["Attach a rope to a high pulley and stand facing away from it, in a split stance.", "Hold the rope behind the head, elbows up by the head, lean slightly forward.", "Straighten the arms forward and up.", "Let the hands come back behind the head slowly."],
    avoid: ["Elbows dropping or flaring wide.", "Arching the lower back.", "Moving the upper arms – only the forearms move."],
    tip: "Trains the long head of the triceps in a stretched position."
  },
  "Rope pushdown": {
    steps: ["Attach a rope to a high pulley and stand facing it.", "Elbows tight at your sides, hands at chest height.", "Push the rope down until the arms are straight, spreading the ends apart at the bottom.", "Let it come back up slowly, elbows still at the sides."],
    avoid: ["Elbows drifting forward.", "Leaning over the rope to push with body weight.", "Letting the rope snap back up."]
  },
  "Dumbbell skull crusher": {
    steps: ["Lie on a bench with a dumbbell in each hand, arms angled slightly back over the head.", "Keep the upper arms still.", "Bend the elbows and lower the dumbbells beside the head.", "Straighten the arms back to the start."],
    avoid: ["Elbows flaring out.", "Moving the upper arms.", "Lowering too fast."]
  },
  "Incline dumbbell curl": {
    steps: ["Set a bench to about 60° and sit back with a dumbbell in each hand.", "Let the arms hang straight down behind the body.", "Curl the dumbbells up without moving the elbows forward.", "Lower slowly to full stretch."],
    avoid: ["Lifting the shoulders off the bench.", "Elbows swinging forward.", "Going too heavy – this one is hard."],
    tip: "The stretch at the bottom makes it very effective for the biceps."
  },
  "Spider curl": {
    steps: ["Lie face down on an incline bench, chest on the pad.", "Let the arms hang straight down with a dumbbell in each hand.", "Curl up while the upper arms stay still.", "Lower slowly."],
    avoid: ["Lifting the chest off the pad.", "Swinging the elbows back.", "Dropping the weights at the bottom."]
  },
  "Cable curl": {
    steps: ["Attach a short bar to a low pulley and stand facing it.", "Arms straight, elbows at your sides.", "Curl the bar up toward the shoulders.", "Lower slowly."],
    avoid: ["Leaning back to swing the weight.", "Elbows drifting forward.", "Letting the cable pull the arms straight fast."],
    tip: "The cable keeps tension on the biceps through the whole movement."
  },
  "Cable rear-delt fly": {
    steps: ["Set both pulleys at shoulder height and stand between them.", "Cross the cables: the left hand holds the right cable and the right hand holds the left.", "Arms nearly straight, pull the hands out and back to a T.", "Let them cross back in front slowly."],
    avoid: ["Shrugging the shoulders up.", "Bending the elbows to row.", "Leaning back."],
    tip: "No crossing pulleys? Do one arm at a time."
  },
  "Suitcase hold & carry": {
    steps: ["Hold one heavy dumbbell at your side, like a suitcase.", "Stand tall – shoulders level, no leaning toward or away from the weight.", "Hold still for the set time, or walk the set distance with short, controlled steps.", "Switch hands."],
    levels: ["Hold.", "Carry."],
    avoid: ["Leaning toward the weight.", "Shrugging the shoulder.", "Rushing the steps."],
    tip: "One side loaded means the core has to keep you straight – great for balance and the side hips."
  },
  "Farmer carry & march": {
    steps: ["Hold a heavy dumbbell in each hand at your sides.", "Stand tall, shoulders back and down.", "Walk the set distance with short, quick steps – or march in place, knees to hip height.", "Put the weights down with a straight back."],
    levels: ["Carry.", "March in place (slower, more balance)."],
    avoid: ["Rounding the shoulders forward.", "Looking down at your feet.", "Picking the weights up with a round back."]
  },
  "Overhead carry": {
    steps: ["Press one dumbbell or kettlebell overhead and lock the arm straight.", "Biceps by the ear, ribs down, stomach braced.", "Walk the set distance with short steps.", "Lower the weight with control and switch arms."],
    avoid: ["Arching the lower back.", "Letting the arm drift forward.", "Going heavy before the shoulder is stable."],
    tip: "Start light – this is about control, not load."
  },
  "Turkish get-up": {
    steps: ["Lie on your back, right knee bent, right arm holding a light kettlebell straight up.", "Roll up onto the left elbow, then the left hand.", "Lift the hips into a bridge, sweep the left leg under you and put the knee down.", "Lift the chest to half-kneeling, then stand up. Reverse every step to get back down."],
    avoid: ["Taking your eyes off the bell.", "Bending the arm that holds the bell.", "Rushing – each step is a small pause."],
    tip: "For Experienced users. Learn it with a shoe balanced on the fist before using a weight."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W3", "Balance", () => {
// ---- Wave 3 samples: the balance ladder. Same rig and helpers as the app.
const sm = t => t * t * (3 - 2 * t);
const seg = (u, a, b) => sm(clamp01((u - a) / (b - a)));               // 0 before a, eases to 1 at b
const TAU = Math.PI * 2;
// small, slow wobble of a body holding its balance (loops seamlessly)
const sway = (u, amp = 1) => [amp * 1.3 * Math.sin(TAU * 2 * u + 0.4), amp * 2.2 * Math.sin(TAU * 3 * u)];

// equipment
function foam(x0, x1, z0, z1, h = 7) {                                     // balance pad: soft, thick, slightly blue
  return [{ type: "poly", pts: [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], cls: "an3foam", z: -999 },
    { type: "poly", pts: [[x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]], cls: "an3foamside", z: -998 },
    { type: "poly", pts: [[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], cls: "an3foamside", z: -998 }];
}
const RAIL = { x: -30, z: -56, y: 104 };   // a step back and to the side, so it never hides the body                                     // support: rack upright with a bar at hip height
const support = () => [post(RAIL.x, RAIL.z - 4, 0, 170), L3([RAIL.x - 16, RAIL.y, RAIL.z - 4], [RAIL.x + 18, RAIL.y, RAIL.z - 4], "an3col")];
const railHand = (touch) => [RAIL.x + 2, RAIL.y + (touch ? 5 : 13), RAIL.z + 2];
const wall = x => ({ type: "poly", pts: [[x, 0, -46], [x, 160, -46], [x, 160, 46], [x, 0, 46]], cls: "an3pad2", z: -999 });

// arms: hand target + elbow direction per mode, and a smooth blend between two modes (no snapping)
function armTarget(J, sd, zz, mode, u) {
  const s = J["sho" + sd];
  if (mode === "out") return [V.add(s, [4, -40 + 2 * Math.sin(TAU * 2 * u + zz), 40 * zz]), [-1, -0.2, 0.1 * zz]];
  if (mode === "hips") return [V.add(J["hip" + sd], [2, 8, 9 * zz]), [-0.3, 0, zz]];
  if (mode === "cross") return [V.add(J.chest, [9, -7, -7 * zz]), [0.2, -1, 0.8 * zz]];
  return [V.add(s, [3, -58, 8 * zz]), [-1, -0.1, 0.2 * zz]];              // "side"
}
function armsMix(J, m1, m2, w, u = 0) {
  for (const [sd, zz] of SIDES) {
    const a = armTarget(J, sd, zz, m1, u), b = armTarget(J, sd, zz, m2, u);
    arm(J, sd, V.lerp(a[0], b[0], w), V.lerp(a[1], b[1], w));
  }
}
const arms = (J, mode, u = 0) => armsMix(J, mode, mode, 0, u);
// facing line on the head (shows head turns)
const nose = (J, yawDeg) => ({ ...L3(J.head, V.add(J.head, [15 * Math.cos(rad(yawDeg)), -1, 15 * Math.sin(rad(yawDeg))]), "an3nose"), z: 9999 });

// "turn the head" mark above the head: a curved two-way arrow
const headTurn = (J, cam) => { const p = cam(J.head); return `<g class="an-eye" transform="translate(${p[0].toFixed(1)},${(p[1] - 20).toFixed(1)})"><path d="M-12 2Q0 -6 12 2"/><path d="M-12 2l1-6M-12 2l5 3M12 2l-1-6M12 2l-5 3"/></g>`; };
// "eyes closed" mark next to the head
const markSpot = (J, cam) => { const p = cam(J.head); return [[p[0], p[1] - 20, 14], [p[0] + 17, p[1] - 15, 10]]; };
const eyesClosed = (J, cam) => { const p = cam(J.head); return `<g class="an-eye" transform="translate(${(p[0] + 17).toFixed(1)},${(p[1] - 15).toFixed(1)})"><path d="M-7 0Q0 6 7 0"/><path d="M-5 3.2l-2 3M0 4.5v3.6M5 3.2l2 3"/></g>`; };

// ---- one-leg stand: stand on the right leg, left foot lifted beside the calf
function oneLeg(u, o = {}) {
  const J = {}, fy = o.fy || 0, [sx, sz] = sway(u, o.amp ?? 1);
  trunk(J, [sx, fy + 84, 6 + sz], V.norm([-sx * 0.012, 1, -sz * 0.012]));
  leg(J, "R", [0, fy + 1, 12], [1, 0, 0]);
  leg(J, "L", o.free || [-8, fy + 32, -4], [1, 0, 0], o.freeToe || [8, -7, 0]);
  arms(J, o.arms || "side", u);
  if (o.rail) arm(J, "L", railHand(o.rail === "touch"), [0, -1, -0.4]);
  return J;
}
function feetStand(u, o = {}) {                                            // two feet: together, tandem or split stance
  const J = {}, fy = o.fy || 0, [sx, sz] = sway(u, o.amp ?? 0.7), f = o.feet;
  const px = (f.L[0] + f.R[0]) / 2, pz = (f.L[2] + f.R[2]) / 2;
  trunk(J, [px + sx, fy + 84.5, pz + sz], V.norm([-sx * 0.012, 1, -sz * 0.012]));
  leg(J, "L", [f.L[0], fy + 1, f.L[2]], [1, 0, 0]); leg(J, "R", [f.R[0], fy + 1, f.R[2]], [1, 0, 0]);
  arms(J, o.arms || "side", u);
  if (o.rail) arm(J, "L", railHand(o.rail === "touch"), [0, -1, -0.4]);
  return J;
}
const TANDEM = { L: [-6, 0, -1], R: [6, 0, 1] }, TOGETHER = { L: [0, 0, -5], R: [0, 0, 5] }, SPLIT = { L: [-20, 0, -7], R: [18, 0, 7] };
const STAND_CAM = camera(-58, 10, 136, 212, 0.86);
const body = J => body3(J, "R");

// ---- heel-to-toe walk on a taped line: the figure stays in place, the line slides under it.
// Steps are exactly one foot long, so each heel lands right at the other foot's toes.
function walkFrame(u, o = {}) {
  const F = 12, J = {}, t = o.back ? 1 - u : u, ph = (t * 2) % 1, swingL = t * 2 < 1;
  const off = (t * 2 * F) % F, [sx, sz] = sway(u, 0.6);
  trunk(J, [-F / 2 + sx, 84 + 1.2 * Math.cos(TAU * ph), sz], [0, 1, 0]);
  const stanceX = lerpN(0, -F, ph), swingX = lerpN(-F, 0, sm(ph)), lift = 6 * Math.sin(Math.PI * ph);
  const sL = swingL ? [swingX, 1 + lift, -1] : [stanceX, 1, -1], sR = swingL ? [stanceX, 1, 1] : [swingX, 1 + lift, 1];
  leg(J, "L", sL, [1, 0, 0]); leg(J, "R", sR, [1, 0, 0]);
  arms(J, "out", u);
  const items = [...floor3(-70, 60, 40), L3([-70, 0.3, 0], [60, 0.3, 0], "an3tape")];
  for (let k = -6; k <= 6; k++) { const x = k * F - off; if (x > -70 && x < 60) items.push(L3([x, 0.3, -4], [x, 0.3, 4], "an3eq")); }
  items.push(...body(J));
  if (ph < 0.12 || ph > 0.9) {                                           // both feet down: mark where heel meets toes
    const backA = swingL ? (ph > 0.9 ? sR : sL) : (ph > 0.9 ? sL : sR), frontA = backA === sL ? sR : sL;
    const touch = V.lerp(V.add(backA, [12, 0, 0]), frontA, 0.5);
    items.push({ ...D3([touch[0], 1, 0], 3.2, "an3touch"), z: 9999 });
  }
  if (o.turn) items.push(nose(J, 55 * Math.sin(TAU * 2 * u)));
  return { items, J };
}
const SIDE_CAM = camera(-36, 32, 128, 192, 0.84);                        // from the front-side and above: the line runs away from you, feet one behind the other

// ---- rise onto the toes and hold
function toeFrame(u, o = {}) {
  const J = {}, fy = o.fy || 0, h = seg(u, .08, .28) * (1 - seg(u, .82, .97)), a = rad(38 * h), [sx, sz] = sway(u, 0.6 * h);
  const ank = zz => [12 - 12 * Math.cos(a), fy + 1 + 12 * Math.sin(a), zz];
  if (o.one) {
    const aR = ank(12);
    trunk(J, [aR[0] + 1 + sx, aR[1] + 84, 6 + sz], [0, 1, 0]);
    leg(J, "R", aR, [1, 0, 0], [12 * Math.cos(a), -12 * Math.sin(a), 0]);
    leg(J, "L", [-8 + aR[0], aR[1] + 30, -4], [1, 0, 0], [8, -7, 0]);
  } else {
    const aL = ank(-6), aR = ank(6);
    trunk(J, [aL[0] + 1 + sx, aL[1] + 84.5, sz], [0, 1, 0]);
    for (const [sd, A] of [["L", aL], ["R", aR]]) leg(J, sd, A, [1, 0, 0], [12 * Math.cos(a), -12 * Math.sin(a), 0]);
  }
  if (o.reach) {                                                           // slow arm reaches while holding
    arms(J, "side", u);
    const r = h * Math.max(0, Math.sin(TAU * u * 1.5)), sd = Math.sin(TAU * u * 0.75) > 0 ? "R" : "L", zz = sd === "R" ? 1 : -1;
    arm(J, sd, V.add(J["sho" + sd], slerpDir([0.05, -1, 0.1 * zz], [0.8, 0.55, 0.15 * zz], r, 60)), [-0.3, -1, 0]);
  } else if (o.rail) { arms(J, "side", u); arm(J, "L", railHand(true), [0, -1, -0.4]); }
  else arms(J, o.arms || "hips", u);
  return J;
}
const slerpDir = (a, b, u, r) => V.mul(V.norm(V.lerp(V.norm(a), V.norm(b), u)), r);

// ---- star reach: stand on the right leg, tap the left foot forward, to the side, back
function starFrame(u, o = {}) {
  const J = {}, fy = o.fy || 0, s = (u * 3) % 1, i = Math.min(2, Math.floor(u * 3)), k = Math.sin(Math.PI * s);
  const T = [[40, fy + 3, 4], [2, fy + 3, -38], [-36, fy + 3, 2]][i], H = [-4, fy + 16, -4];
  const lean = [[-6, 0], [0, 6], [10, 0]][i];
  trunk(J, [0, fy + 84 - 9 * k, 6], V.norm([Math.sin(rad(lean[0] * k)), 1, Math.sin(rad(lean[1] * k))]));
  leg(J, "R", [0, fy + 1, 12], [1, 0, 0]);
  leg(J, "L", V.lerp(H, T, k), [1, 0, 0], [10, -4, 0]);
  arms(J, "out", u);
  return J;
}

// ---- step and hold: step onto a low box (or forward on the floor), hold on one leg with the knee up, step back.
// The body leans and travels forward together with the lead foot; the back leg is pulled along, then drives the knee up.
function stepHold(u, o) {
  const J = {}, bh = o.bh, fx = o.fx, P = seg(u, .04, .46) * (1 - seg(u, .76, .98));
  const a = seg(P, 0, .45), b = seg(P, .2, 1);
  const ankR = V.add(V.lerp([0, 1, 10], [fx, bh + 1, 10], a), [0, 12 * Math.sin(Math.PI * a), 0]);
  const pelvis = [lerpN(0, fx * 0.3, a) + lerpN(0, fx * 0.7 - 2, b), lerpN(84, bh + 84, b) - 4 * a * (1 - b), lerpN(0, 6, b)];
  trunk(J, pelvis, sag(3 + 16 * a * (1 - b * b)));
  leg(J, "R", ankR, [1, 0, 0]);
  const F0 = [0, 1, -10], v = V.sub(F0, J.hipL), reach = Math.min(V.len(v), 84 - 10 * b);
  const hang = V.add(J.hipL, V.mul(V.norm(v), reach)), k = seg(b, .6, 1);
  leg(J, "L", V.lerp(hang, V.add(pelvis, [36, -52, -6]), k), [1, 0.4, 0], V.lerp([12, 0, 0], [8, -8, 0], clamp01((V.len(v) - reach) / 15)));
  for (const [sd, zz] of SIDES) {                                         // easy counter-swing of the arms
    const sw = (sd === "L" ? 1 : -1) * 12 * a * (1 - b);
    arm(J, sd, V.add(J["sho" + sd], [3 + sw, -58, 8 * zz]), [-1, -0.1, 0.2 * zz]);
  }
  const items = [...floor3(-50, 80, 44)];
  if (bh) items.push(box3(fx - 18, fx + 18, bh, 22), { type: "poly", pts: [[fx - 18, 0, -22], [fx - 18, bh, -22], [fx - 18, bh, 22], [fx - 18, 0, 22]], cls: "an3bench", z: -998 }, { type: "poly", pts: [[fx - 18, 0, 22], [fx + 18, 0, 22], [fx + 18, bh, 22], [fx - 18, bh, 22]], cls: "an3bench", z: -998 });
  return { items: [...items, ...body(J)], J };
}
// ---- lateral step and hold: step out to the side onto the right foot, hold on one leg, step back
function latStep(u, o = {}) {
  const J = {}, fy = o.pad ? 7 : 0, P = seg(u, .04, .4) * (1 - seg(u, .78, .98)), a = seg(P, 0, .45), b = seg(P, .35, 1);
  const ankR = V.add(V.lerp([0, 1, 9], [2, fy + 1, 44], a), [0, 10 * Math.sin(Math.PI * a), 0]);
  const [sx, sz] = sway(u, 0.5 * b);
  trunk(J, V.lerp([0, 84.5, 0], [sx, fy + 84, 38 + sz], b), V.norm([0, 1, -0.08 * b]));
  leg(J, "R", ankR, [1, 0, 0]);
  leg(J, "L", V.lerp([0, 1, -9], [-6, fy + 30, 30], b), [1, 0, 0], V.lerp([12, 0, 0], [8, -7, 0], b));
  armsMix(J, "side", "out", b, u);
  const items = [...floor3(-40, 60, 70)];
  if (o.pad) items.push(...foam(-16, 22, 28, 60));
  return { items: [...items, ...body(J)], J };
}

// ---- weight pass while standing on one leg
function passFrame(u, mode) {
  const J = oneLeg(u, { amp: 0.6, arms: "side" }), items = [...floor3(-50, 60, 44), ...support()];
  let db;
  if (mode === "hold") { arm(J, "L", V.add(J.shoL, [3, -58, -8]), [-1, 0, -0.2]); db = J.wriL; arms; }
  else {
    const th = TAU * u, r = mode === "around" ? 26 : 0;
    db = mode === "around" ? V.add(J.pelvis, [r * Math.cos(th) + 2, 22, r * Math.sin(th) + 6])
      : V.add(J.chest, [24 - 8 * Math.abs(Math.cos(th)), -26, 30 * Math.cos(th)]);
    for (const [sd, zz] of SIDES) {
      const z = db[2] - J.pelvis[2], w = clamp01((zz * z + 10) / 12), rest = V.add(J["sho" + sd], [3, -58, 9 * zz]);
      arm(J, sd, V.lerp(rest, V.add(db, [0, 0, -2 * zz]), w), [-0.6, -0.4, 0.6 * zz]);
    }
  }
  return { items: [...items, ...body(J), ...db3(db, [0, 1, 0], 7)], J };
}

// ---- ball toss to a wall on one leg: push the ball off the chest, arms stay out while it travels,
// catch it at arm's length and bring it back to the chest. The ball never stops mid-air.
function tossFrame(u, o = {}) {
  const fy = o.fy || 0, J = oneLeg(u, { fy, amp: 0.5, arms: "side" }), W = 112;
  const ext = u < .14 ? sm(u / .14) : u < .8 ? 1 : 1 - sm((u - .8) / .2);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J.chest, V.lerp([18, -16, 7 * zz], [46, -6, 6 * zz], ext)), [-0.3, -1, 0.5 * zz]);
  const hands = V.add(mid3(J.wriL, J.wriR), [5, 0, 0]), hit = [W - 5, fy + 138, 6];
  let ball = hands;
  if (u >= .14 && u < .47) { const t = (u - .14) / .33; ball = V.add(V.lerp(hands, hit, t), [0, 16 * Math.sin(Math.PI * t), 0]); }
  else if (u >= .47 && u < .8) { const t = (u - .47) / .33; ball = V.add(V.lerp(hit, hands, t), [0, 12 * Math.sin(Math.PI * t), 0]); }
  const items = [...floor3(-50, W, 44), wall(W)];
  if (fy) items.push(...foam(-16, 22, -6, 30));
  return { items: [...items, ...body(J), D3(ball, 6, "an3ball")], J };
}

// ---- small hop on one leg and stick the landing (in place, forward, or sideways and back)
function hopFrame(u, o = {}) {
  const J = {}, D = o.d || [0, 0, 0];
  const dip = seg(u, .1, .2) * (1 - seg(u, .2, .26)), fly = Math.sin(Math.PI * clamp01((u - .24) / .14));
  const land = seg(u, .36, .44) * (1 - seg(u, .48, .82));
  const back = o.d ? Math.sin(Math.PI * clamp01((u - .84) / .1)) : 0, out = seg(u, .24, .38) * (1 - seg(u, .84, .94));
  const off = V.mul(D, out), yAnk = 1 + 12 * fly + 7 * back, py = 84 - 7 * dip + 12 * fly + 7 * back - 12 * land;
  trunk(J, V.add([0, py, 6], off), sag(4 + 10 * land + 6 * dip));
  leg(J, "R", V.add([0, yAnk, 12], off), [1, 0, 0], [12 - 4 * fly, -4 * fly, 0]);
  leg(J, "L", V.add([-8, py - 52, -4], off), [1, 0, 0], [8, -7, 0]);
  armsMix(J, "side", "out", clamp01(Math.max(land * 1.2, fly, dip * 0.6, back)), u);
  return J;
}

// ---- single-leg Romanian deadlift reach: hinge on one leg, back leg rises in line with the body
function slRdl(u, o = {}) {
  const J = {}, h = seg(u, .08, .44) * (1 - seg(u, .62, .96)), lean = lerpN(4, 70, h);
  const pelvis = [-8 * h, 84 - 5 * h, 6];
  trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 22));
  leg(J, "R", [0, 1, 12], [1, 0, 0]);
  const back = V.norm(V.lerp([-0.12, -1, 0], V.mul(sag(lean), -1), h));
  leg(J, "L", V.add(J.hipL, V.mul(back, 82)), [1, 0, 0], V.lerp([10, -3, 0], [2, -10, 0], h));
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["sho" + sd], [4, -58, 6 * zz]), [-1, 0, 0]);
  const items = [...floor3(-90, 70, 44), ...support(), ...body(J)];
  if (o.db) items.push(...db3(J.wriL, [0, 0, 1]));
  return { items, J };
}

// ---- reverse lunge to knee drive and hold
function lungeDrive(u) {
  const J = {}, d = seg(u, .06, .34) * (1 - seg(u, .36, .54)), k = seg(u, .38, .56) * (1 - seg(u, .86, .99));
  const pelvis = [-12 * d + 4 * k, 84 - 34 * d, 3 * k];
  trunk(J, pelvis, sag(4 + 6 * d + 3 * k));
  leg(J, "R", [8, 1, 10], [1, 0, 0]);
  const base = V.add(V.lerp([0, 1, -9], [-50, 8, -9], d), [0, 6 * Math.sin(Math.PI * d), 0]);
  leg(J, "L", V.lerp(base, V.add(pelvis, [36, -52, -6]), k), [1, 0.2, 0], V.lerp(V.lerp([12, 0, 0], [10, -7, 0], d), [8, -8, 0], k));
  for (const [sd, zz] of SIDES) {                                         // opposite arm swings forward on the drive
    const sw = (sd === "R" ? 1 : -1) * 16 * k;
    arm(J, sd, V.add(J["sho" + sd], [3 + sw, -56 + Math.abs(sw) * 0.5, 8 * zz]), [-1, -0.1, 0.2 * zz]);
  }
  return { items: [...floor3(-80, 70, 44), ...support(), ...body(J)], J };
}

// ---- skater bound: jump sideways from one leg to the other, stick the landing, and back
function skater(u) {
  const J = {}, half = u < .5 ? 0 : 1, s = (u % .5) / .5, dir = half ? -1 : 1;    // first half: right foot to left foot
  const f = seg(s, .33, .62), crouch = 0.5 + 0.5 * Math.max(seg(s, .22, .33) * (1 - seg(s, .33, .4)), seg(s, .58, .68) * (1 - seg(s, .72, .95)));
  const z = dir * lerpN(26, -26, f), py = 84 - 12 * crouch + 12 * Math.sin(Math.PI * f);
  trunk(J, [-4, py, z], V.norm([Math.sin(rad(20)), 1, -0.15 * Math.sign(z || 1) * (1 - Math.sin(Math.PI * f))]));
  const stanceA = [0, 1, dir * 32], freeA = [-26, 16, dir * -10], stanceB = [0, 1, dir * -32], freeB = [-26, 16, dir * 10];
  const lift = [0, 10 * Math.sin(Math.PI * f), 0];
  const a1 = V.add(V.lerp(stanceA, freeB, f), lift), a2 = V.add(V.lerp(freeA, stanceB, f), lift);
  const [ankR, ankL] = dir > 0 ? [a1, a2] : [a2, a1];
  leg(J, "R", ankR, [1, 0, 0]); leg(J, "L", ankL, [1, 0, 0]);
  for (const [sd, zz] of SIDES) {                                         // arms swing across in the direction of travel
    const sw = -dir * 24 * Math.sin(Math.PI * f) + 10 * zz;
    arm(J, sd, V.add(J["sho" + sd], [16, -46, sw]), [-1, -0.2, 0.2 * zz]);
  }
  return { items: [...floor3(-50, 60, 70), ...body(J)], J };
}

// ---- single-leg Pallof press: the cable pulls sideways while you stand on one leg
function slPallof(u) {
  const J = oneLeg(u, { amp: 0.6 }), anchor = [4, 122, -120], e = seg(u, .1, .3) * (1 - seg(u, .76, .95));
  const hand = V.lerp([16, 121, 4], [58, 121, 4], e);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(hand, [0, 0, 3 * zz]), [0, -1, 0.4 * zz]);
  return { items: [...floor3(-40, 80, 130), post(4, -126, 0, 175), D3(anchor, 4, "an3eqf"), ...body(J), L3(anchor, hand, "an3cable"), D3(hand, 5, "an3grip")], J };
}

// ---- march / skip in place: knee up to hip height, opposite arm swings. Skip = a small hop on the standing foot.
function stepInPlace(u, o = {}) {
  const J = {}, half = u < .5, s = (u % .5) / .5, k = Math.sin(Math.PI * s);       // k: how high the knee is
  const hop = o.skip ? Math.max(0, Math.sin(Math.PI * clamp01((s - 0.15) / 0.55))) * 7 : 0;
  trunk(J, [0, 84 + hop - 1.5 * k, half ? 3 : -3], sag(2));
  const up = half ? "L" : "R", st = half ? "R" : "L", zz = up === "L" ? -1 : 1;
  leg(J, st, [0, 1 + hop, -zz * 10], [1, 0, 0], [12, -hop * 0.6, 0]);
  const hipU = J["hip" + up], down = [0, 1, zz * 10], knee = V.add(hipU, [40, -16, 0]);
  leg(J, up, V.lerp(down, V.add(knee, [2, -40, 0]), k), [1, 0.3, 0], V.lerp([12, 0, 0], [8, -8, 0], k));
  for (const [sd, z2] of SIDES) {                                           // opposite arm forward
    const f = (sd === up ? -1 : 1) * k;
    arm(J, sd, V.add(J["sho" + sd], [3 + 26 * f, -54 + 18 * Math.max(0, f), 8 * z2]), [-1, -0.2, 0.15 * z2]);
  }
  return { items: [...floor3(-50, 70, 44), ...body(J)], J };
}

// ---- wall sit: back flat on the wall, thighs level, hold (optionally one leg straight out)
function wallSit(u, o = {}) {
  const J = {}, b = 0.6 * Math.sin(TAU * 2 * u);                            // breathing
  trunk(J, [-14, 46 + b * 0.3, 0], [0, 1, 0]);
  leg(J, "R", [30, 1, 11], [1, 0, 0]);
  if (o.one) leg(J, "L", V.add(J.hipL, [83, 6 + b, -2]), [0, 1, 0], [0, 11, 0]);
  else leg(J, "L", [30, 1, -11], [1, 0, 0]);
  arms(J, "cross", u);
  const w = { type: "poly", pts: [[-24, 0, -40], [-24, 165, -40], [-24, 165, 40], [-24, 0, 40]], cls: "an3pad2", z: -999 };
  return { items: [...floor3(-24, 80, 44), w, ...body(J)], J };
}

// ---- switch lunge: from a half lunge, swap the legs. Jump = explosive jump, legs scissor in the air.
// Step = no jump: stand up, bring the back foot forward, step the other foot back into the lunge.
function switchLunge(u, o = {}) {
  const J = {}, half = u < .5, s = (u % .5) / .5, dir = half ? 1 : -1;      // first half: right foot in front → left foot in front
  const FRONT = 24, BACK = -34;
  let py, px = -4, fA, bA, k;                                              // k: 0 = start split, 1 = switched
  if (o.jump) {
    const dip = seg(s, .1, .22) * (1 - seg(s, .22, .3)), f = seg(s, .26, .56), land = seg(s, .52, .64) * (1 - seg(s, .66, .95));
    k = f; py = 64 - 5 * dip + 30 * Math.sin(Math.PI * f) - 6 * land;
    const lift = 16 * Math.sin(Math.PI * f);
    fA = V.add(V.lerp([FRONT, 1, 0], [BACK, 7, 0], f), [0, lift, 0]); bA = V.add(V.lerp([BACK, 7, 0], [FRONT, 1, 0], f), [0, lift, 0]);
  } else {
    const up = seg(s, .1, .35), f1 = seg(s, .3, .55), f2 = seg(s, .55, .8), down = seg(s, .7, .95);
    const stand = up * (1 - down);                                        // standing up = body over the front foot
    k = f2; py = 64 + 20 * stand; px = -4 + 24 * stand;
    bA = V.add(V.lerp([BACK, 7, 0], [FRONT, 1, 0], f1), [0, 10 * Math.sin(Math.PI * f1), 0]);
    fA = V.add(V.lerp([FRONT, 1, 0], [BACK, 7, 0], f2), [0, 8 * Math.sin(Math.PI * f2), 0]);
  }
  trunk(J, [px, py, 0], sag(6 * (1 - (o.jump ? 0 : 0.5))));
  const toeF = V.lerp([12, 0, 0], [10, -6, 0], k), toeB = V.lerp([10, -6, 0], [12, 0, 0], k);
  const [ankR, ankL, toeR, toeL] = dir > 0 ? [fA, bA, toeF, toeB] : [bA, fA, toeB, toeF];
  leg(J, "R", V.add(ankR, [0, 0, 9]), [1, 0.1, 0], toeR); leg(J, "L", V.add(ankL, [0, 0, -9]), [1, 0.1, 0], toeL);
  for (const [sd, zz] of SIDES) {                                           // arm opposite the front leg swings forward – follows the legs smoothly
    const other = sd === "R" ? J.ankL : J.ankR, own = sd === "R" ? J.ankR : J.ankL;
    const w = clamp01((other[0] - own[0]) / (FRONT - BACK) * 0.5 + 0.5);
    arm(J, sd, V.add(J["sho" + sd], [lerpN(-12, 20, w), -52, 9 * zz]), [-1, -0.2, 0.15 * zz]);
  }
  return { items: [...floor3(-60, 60, 44), ...body(J)], J };
}

const SAMPLES = {
  // 1. single-leg stand, levels 1-6
  "sls-1": { cap: ["Level 1", "Feet together, stand tall"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => { const J = feetStand(u, { feet: TOGETHER, amp: 0.5 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "Feet together" }] },
  "sls-2": { cap: ["Level 2", "One leg, light touch on the support"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => { const J = oneLeg(u, { rail: "touch", amp: 0.7 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.wriL, text: "Fingertips only" }, { when: "all", pt: J => J.kneR, text: "Soft knee" }] },
  "sls-3": { cap: ["Level 3", "One leg, no support"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => { const J = oneLeg(u, { arms: "side" }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.head, text: "Eyes on one spot" }, { when: "all", pt: J => J.kneR, text: "Soft knee" }] },
  "sls-4a": { cap: ["Level 4", "One leg, slow head turns"], cam: STAND_CAM, dur: 4800, loop: true,
    frame: u => { const J = oneLeg(u, { amp: 1.2 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J), nose(J, 60 * Math.sin(TAU * 2 * u))], J }; },
    overlay: headTurn, reserve: markSpot, cues: [{ when: "all", pt: J => J.head, text: "Turn the head slowly" }] },
  "sls-4b": { cap: ["Level 4", "One leg, eyes closed, hand by the support"], cam: STAND_CAM, dur: 4800, loop: true,
    frame: u => { const J = oneLeg(u, { rail: "near", amp: 1.3 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    overlay: eyesClosed, reserve: markSpot, cues: [{ when: "all", pt: J => J.wriL, text: "Hand ready by the support" }] },
  "sls-5": { cap: ["Level 5", "One leg on the balance pad"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => { const J = oneLeg(u, { fy: 7, amp: 1.3, arms: "out" }); return { items: [...floor3(-50, 60, 44), ...support(), ...foam(-18, 22, -10, 30), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "Soft pad underfoot" }] },
  "sls-6": { cap: ["Level 6", "On the pad, slow reach with the free foot"], cam: STAND_CAM, dur: 4800, loop: true,
    frame: u => { const J = starFrame(u, { fy: 7 }); return { items: [...floor3(-60, 70, 50), ...support(), ...foam(-18, 22, -10, 30), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.kneR, text: "Standing knee soft" }] },

  "sls-7": { cap: ["Level 7", "On the pad, eyes closed, hand by the support"], cam: STAND_CAM, dur: 4800, loop: true,
    frame: u => { const J = oneLeg(u, { fy: 7, rail: "near", amp: 1.5 }); return { items: [...floor3(-50, 60, 44), ...support(), ...foam(-18, 22, -10, 30), ...body(J)], J }; },
    overlay: eyesClosed, reserve: markSpot, cues: [{ when: "all", pt: J => J.wriL, text: "Hand ready by the support" }] },

  // 2. tandem stand and heel-to-toe walk
  "tan-1": { cap: ["Tandem stand", "Heel touching the other foot's toes"], cam: SIDE_CAM, dur: 4200, loop: true,
    frame: u => { const J = feetStand(u, { feet: TANDEM, arms: "cross", amp: 1 }); return { items: [...floor3(-50, 60, 44), ...support(), L3([-70, 0.3, 0], [60, 0.3, 0], "an3tape"), ...body(J), { ...D3([6, 1, 0], 3.2, "an3touch"), z: 9999 }], J }; },
    cues: [{ when: "all", pt: J => J.toeL, text: "Heel to toe, in one line" }] },
  "tan-2": { cap: ["Tandem stand", "Eyes closed, hand by the support"], cam: SIDE_CAM, dur: 4800, loop: true,
    frame: u => { const J = feetStand(u, { feet: TANDEM, rail: "near", amp: 1.3 }); return { items: [...floor3(-50, 60, 44), ...support(), L3([-70, 0.3, 0], [60, 0.3, 0], "an3tape"), ...body(J), { ...D3([6, 1, 0], 3.2, "an3touch"), z: 9999 }], J }; },
    overlay: eyesClosed, reserve: markSpot, cues: [{ when: "all", pt: J => J.wriL, text: "Hand ready by the support" }] },
  "tan-3": { cap: ["Tandem stand", "On the balance pad"], cam: SIDE_CAM, dur: 4200, loop: true,
    frame: u => { const J = feetStand(u, { feet: TANDEM, fy: 7, arms: "out", amp: 1.3 }); return { items: [...floor3(-50, 60, 44), ...support(), ...foam(-22, 30, -16, 16), L3([-22, 7.3, 0], [30, 7.3, 0], "an3tape"), ...body(J), { ...D3([6, 8, 0], 3.2, "an3touch"), z: 9999 }], J }; },
    cues: [{ when: "all", pt: J => J.toeL, text: "Heel to toe on the pad" }] },
  "tan-4": { cap: ["Heel-to-toe walk", "Each heel lands at the other foot's toes"], cam: SIDE_CAM, dur: 2400, loop: true,
    frame: u => walkFrame(u), cues: [{ when: "all", pt: J => J.ankR, text: "Walk on a line" }] },
  "tan-5": { cap: ["Heel-to-toe walk", "Backwards: toes land at the other heel"], cam: SIDE_CAM, dur: 2800, loop: true,
    frame: u => walkFrame(u, { back: true }), cues: [{ when: "all", pt: J => J.ankR, text: "Small steps back" }] },
  "tan-6": { cap: ["Heel-to-toe walk", "With slow head turns"], cam: SIDE_CAM, dur: 2800, loop: true,
    frame: u => walkFrame(u, { turn: true }), overlay: headTurn, reserve: markSpot, cues: [{ when: "all", pt: J => J.head, text: "Look left, look right" }] },

  // 3. toe stand and calf-raise hold
  "toe-1": { cap: ["Toe stand", "Rise high on both feet and hold"], cam: camera(-25, 10, 112, 212, 0.9), dur: 4200, loop: true,
    frame: u => { const J = toeFrame(u); return { items: [...floor3(-40, 60, 40), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "High on the toes" }] },
  "toe-2": { cap: ["Calf-raise hold", "One leg, hand on the support"], cam: camera(-25, 10, 112, 212, 0.9), dur: 4200, loop: true,
    frame: u => { const J = toeFrame(u, { one: true, rail: true }); return { items: [...floor3(-40, 60, 40), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "Hold at the top" }] },
  "toe-3": { cap: ["Toe stand", "Slow arm reaches while you hold"], cam: camera(-25, 10, 112, 212, 0.9), dur: 5200, loop: true,
    frame: u => { const J = toeFrame(u, { reach: true }); return { items: [...floor3(-40, 60, 40), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "Stay high on the toes" }] },
  "toe-4": { cap: ["Toe stand", "On the balance pad"], cam: camera(-25, 10, 112, 212, 0.9), dur: 4200, loop: true,
    frame: u => { const J = toeFrame(u, { fy: 7, arms: "out" }); return { items: [...floor3(-40, 60, 40), ...support(), ...foam(-14, 28, -20, 20), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.ankR, text: "Rise slowly on the pad" }] },

  // 4. split-stance hold
  "spl-1": { cap: ["Split-stance hold", "One foot forward, weight in the middle"], cam: camera(-35, 10, 122, 212, 0.86), dur: 4200, loop: true,
    frame: u => { const J = feetStand(u, { feet: SPLIT, arms: "hips", amp: 0.8 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Hips square" }] },
  "spl-2": { cap: ["Split-stance hold", "Eyes closed, hand by the support"], cam: camera(-35, 10, 122, 212, 0.86), dur: 4800, loop: true,
    frame: u => { const J = feetStand(u, { feet: SPLIT, rail: "near", amp: 1.2 }); return { items: [...floor3(-50, 60, 44), ...support(), ...body(J)], J }; },
    overlay: eyesClosed, reserve: markSpot, cues: [{ when: "all", pt: J => J.wriL, text: "Hand ready by the support" }] },
  "spl-3": { cap: ["Split-stance hold", "On the balance pad"], cam: camera(-35, 10, 122, 212, 0.86), dur: 4200, loop: true,
    frame: u => { const J = feetStand(u, { feet: SPLIT, fy: 7, arms: "out", amp: 1.2 }); return { items: [...floor3(-50, 60, 44), ...support(), ...foam(-34, 34, -20, 20), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Hips square" }] },

  // 5. star reach
  "star-1": { cap: ["Star reach", "Tap forward, to the side, then back"], cam: camera(-40, 14, 122, 212, 0.86), dur: 4800, loop: true,
    frame: u => { const J = starFrame(u); return { items: [...floor3(-60, 70, 50), ...support(), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.kneR, text: "Standing knee soft" }, { when: "all", pt: J => J.ankL, text: "Light toe tap" }] },

  // 6. step and hold
  "stp-1": { cap: ["Step-up and hold", "Low box, hold 3 s with the knee up"], cam: camera(-18, 10, 104, 216, 0.8), dur: 4800, loop: true,
    frame: u => stepHold(u, { bh: 22, fx: 20 }), cues: [{ when: "all", pt: J => J.kneL, text: "Hold 3 seconds" }] },
  "stp-2": { cap: ["Step and hold", "Step forward, hold 3 s, step back"], cam: camera(-18, 10, 104, 216, 0.8), dur: 4800, loop: true,
    frame: u => stepHold(u, { bh: 0, fx: 30 }), cues: [{ when: "all", pt: J => J.kneL, text: "Hold 3 seconds" }] },

  // 7. lateral step and hold
  "lat-1": { cap: ["Lateral step and hold", "Step out, hold on one leg, step back"], cam: camera(-62, 10, 130, 212, 0.84), dur: 4800, loop: true,
    frame: u => latStep(u), cues: [{ when: "all", pt: J => J.kneR, text: "Land soft, hold 3 s" }] },
  "lat-2": { cap: ["Lateral step and hold", "Step onto the balance pad"], cam: camera(-62, 10, 130, 212, 0.84), dur: 4800, loop: true,
    frame: u => latStep(u, { pad: true }), cues: [{ when: "all", pt: J => J.kneR, text: "Land soft, hold 3 s" }] },

  // 8. weight pass on one leg
  "wp-1": { cap: ["Hold a light dumbbell", "In the hand on the lifted-leg side"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => passFrame(u, "hold"), cues: [{ when: "all", pt: J => J.wriL, text: "Don't lean toward it" }] },
  "wp-2": { cap: ["Pass hand to hand", "In front of the body, slowly"], cam: STAND_CAM, dur: 3600, loop: true,
    frame: u => passFrame(u, "hands"), cues: [{ when: "all", pt: J => J.kneR, text: "Soft knee" }] },
  "wp-3": { cap: ["Pass around the body", "Hand it over in front and behind"], cam: STAND_CAM, dur: 4200, loop: true,
    frame: u => passFrame(u, "around"), cues: [{ when: "all", pt: J => J.head, text: "Chest tall" }] },

  // 9. ball toss to a wall
  "ball-1": { cap: ["Ball toss to a wall", "On one leg, soft catch"], cam: camera(-30, 10, 96, 214, 0.8), dur: 2600, loop: true,
    frame: u => tossFrame(u), cues: [{ when: "all", pt: J => J.kneR, text: "Soft knee on the catch" }] },
  "ball-2": { cap: ["Ball toss to a wall", "On the balance pad"], cam: camera(-30, 10, 96, 214, 0.8), dur: 2600, loop: true,
    frame: u => tossFrame(u, { fy: 7 }), cues: [{ when: "all", pt: J => J.kneR, text: "Soft knee on the catch" }] },

  // 10. small hop and stick
  "hop-1": { cap: ["Small hop and stick", "Land soft and hold 3 s"], cam: camera(-35, 10, 120, 214, 0.86), dur: 3600, loop: true,
    frame: u => { const J = hopFrame(u); return { items: [...floor3(-50, 60, 44), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.kneR, text: "Knee over the toes" }] },
  "hop-2": { cap: ["Hop forward and stick", "Hold 3 s, small hop back"], cam: camera(-28, 10, 110, 214, 0.86), dur: 4000, loop: true,
    frame: u => { const J = hopFrame(u, { d: [30, 0, 0] }); return { items: [...floor3(-50, 80, 44), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.kneR, text: "Knee over the toes" }] },
  "hop-3": { cap: ["Hop sideways and stick", "Hold 3 s, small hop back"], cam: camera(-62, 10, 128, 214, 0.84), dur: 4000, loop: true,
    frame: u => { const J = hopFrame(u, { d: [0, 0, 30] }); return { items: [...floor3(-50, 60, 70), ...body(J)], J }; },
    cues: [{ when: "all", pt: J => J.kneR, text: "Knee over the toes" }] },

  // 15-16. Christian's suggestions: stepping / skipping in place, static holds
  "mar-1": { cap: ["High-knee march", "Knee to hip height, opposite arm forward"], cam: camera(-30, 10, 116, 214, 0.86), dur: 1600, loop: true,
    frame: u => stepInPlace(u), cues: [{ when: "all", pt: J => J.chest, text: "Tall, don't lean back" }] },
  "skp-1": { cap: ["Skipping in place", "Small hop on the standing foot each time"], cam: camera(-30, 10, 116, 214, 0.86), dur: 1000, loop: true,
    frame: u => stepInPlace(u, { skip: true }), cues: [{ when: "all", pt: J => J.chest, text: "Light and quick" }] },
  "jl-1": { cap: ["Step switch lunge", "Stand up, swap feet, back into the lunge"], cam: camera(-24, 10, 120, 214, 0.86), dur: 3600, loop: true,
    frame: u => switchLunge(u), cues: [{ when: "all", pt: J => J.chest, text: "Chest tall" }] },
  "jl-2": { cap: ["Jump lunge", "Jump, swap legs in the air, land soft"], cam: camera(-24, 10, 120, 214, 0.86), dur: 2200, loop: true,
    frame: u => switchLunge(u, { jump: true }), cues: [{ when: "all", pt: J => J.chest, text: "Land soft, chest tall" }] },
  "wal-1": { cap: ["Wall sit", "Thighs level, knees over the ankles"], cam: camera(-24, 10, 110, 196, 1), dur: 4000, loop: true,
    frame: u => wallSit(u), cues: [{ when: "all", pt: J => J.kneR, text: "Knees over ankles" }, { when: "all", pt: J => J.chest, text: "Back flat on the wall" }] },
  "wal-2": { cap: ["Single-leg wall sit", "One leg straight out, hold"], cam: camera(-24, 10, 110, 196, 1), dur: 4000, loop: true,
    frame: u => wallSit(u, { one: true }), cues: [{ when: "all", pt: J => J.kneR, text: "Knee over the ankle" }] },

  // 11-14. harder balance work for Some / Experienced
  "rdl-1": { cap: ["Single-leg RDL reach", "Hinge on one leg, back leg in line with the body"], cam: camera(-22, 10, 124, 212, 0.86), dur: 4200, loop: true,
    frame: u => slRdl(u), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips level" }, { when: "all", pt: J => J.kneR, text: "Soft knee" }] },
  "rdl-2": { cap: ["Single-leg RDL reach", "Light dumbbell in the opposite hand"], cam: camera(-22, 10, 124, 212, 0.86), dur: 4200, loop: true,
    frame: u => slRdl(u, { db: true }), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips level" }, { when: "all", pt: J => J.kneR, text: "Soft knee" }] },
  "lng-1": { cap: ["Reverse lunge to knee drive", "Step back, drive the knee up, hold 3 s"], cam: camera(-22, 10, 128, 214, 0.84), dur: 4400, loop: true,
    frame: u => lungeDrive(u), cues: [{ when: "all", pt: J => J.kneL, text: "Drive the knee up" }] },
  "ska-1": { cap: ["Skater bound and stick", "Jump sideways onto one leg, hold 2 s"], cam: camera(-64, 12, 122, 212, 0.84), dur: 3600, loop: true,
    frame: u => skater(u), cues: [{ when: "all", pt: J => J.pelvis, text: "Land soft and stick it" }] },
  "pal-1": { cap: ["Single-leg Pallof press", "Press out and hold, don't let it turn you"], cam: camera(-58, 10, 150, 210, 0.9), dur: 4000, loop: true,
    frame: u => slPallof(u), cues: [{ when: "all", pt: J => J.chest, text: "Stay square" }] }
};

// cards: one per exercise, levels / variations as chips
const CARDS = [
  { title: "Single-leg stand", fam: "Balance ladder · levels 1–6", keys: [["1", "sls-1"], ["2", "sls-2"], ["3", "sls-3"], ["4 · head", "sls-4a"], ["4 · eyes", "sls-4b"], ["5", "sls-5"], ["6", "sls-6"], ["7", "sls-7"], ["8", "ball-2"]] },
  { title: "Tandem stand & heel-to-toe walk", fam: "Narrow base", keys: [["Stand", "tan-1"], ["Eyes closed", "tan-2"], ["Pad", "tan-3"], ["Walk", "tan-4"], ["Backwards", "tan-5"], ["Head turns", "tan-6"]] },
  { title: "Toe stand & calf-raise hold", fam: "Ankles and feet", keys: [["Both feet", "toe-1"], ["One leg", "toe-2"], ["Arm reaches", "toe-3"], ["Pad", "toe-4"]] },
  { title: "Split-stance hold", fam: "Staggered stance", keys: [["Floor", "spl-1"], ["Eyes closed", "spl-2"], ["Pad", "spl-3"]] },
  { title: "Single-leg star reach", fam: "Dynamic · one leg", keys: [["Floor", "star-1"], ["Pad", "sls-6"]] },
  { title: "Step and hold", fam: "Dynamic · step", keys: [["Onto a box", "stp-1"], ["Forward", "stp-2"]] },
  { title: "Lateral step and hold", fam: "Dynamic · sideways", keys: [["Floor", "lat-1"], ["Onto the pad", "lat-2"]] },
  { title: "Single-leg stand with a weight", fam: "Reactive · weight", keys: [["Hold", "wp-1"], ["Hand to hand", "wp-2"], ["Around the body", "wp-3"]] },
  { title: "Ball toss to a wall", fam: "Reactive · catch", keys: [["Floor", "ball-1"], ["Pad", "ball-2"]] },
  { title: "Small hop and stick", fam: "Reactive · landing", keys: [["In place", "hop-1"], ["Forward", "hop-2"], ["Sideways", "hop-3"]] },
  { title: "Single-leg Romanian deadlift reach", fam: "Harder · Some & Experienced", keys: [["Body weight", "rdl-1"], ["Dumbbell", "rdl-2"]] },
  { title: "Reverse lunge to knee drive", fam: "Harder · Some & Experienced", keys: [["Floor", "lng-1"]] },
  { title: "Skater bound and stick", fam: "Harder · Experienced", keys: [["Floor", "ska-1"]] },
  { title: "Single-leg Pallof press", fam: "Harder · Some & Experienced", keys: [["Cable", "pal-1"]] },
  { title: "March or skip in place", fam: "Heart rate + balance · your idea", keys: [["Step (New)", "mar-1"], ["Skip", "skp-1"]] },
  { title: "Jump lunge", fam: "Power + balance · your idea", keys: [["Step switch", "jl-1"], ["Jump", "jl-2"]] },
  { title: "Wall sit", fam: "Static hold · quads · your idea", keys: [["Two legs", "wal-1"], ["One leg", "wal-2"]] }
];

const GUIDES = {
  "Single-leg stand": {
    steps: ["Stand next to a support (rack, wall or bench) on the side of the lifted leg.", "Shift your weight onto one foot and lift the other foot beside the standing calf.", "Keep the standing knee soft, hips level and chest tall.", "Hold for the set time, then switch legs."],
    levels: ["Level 1: feet together (or one foot in front of the other).", "Level 2: one leg, fingertips on the support.", "Level 3: one leg, no support.", "Level 4: one leg with slow head turns, or eyes closed with a hand right by the support.", "Level 5: one leg on the balance pad.", "Level 6: on the pad, slow reaches with the free foot.", "Level 7: on the pad, eyes closed, hand right by the support.", "Level 8: on the pad, catching a ball off the wall."],
    avoid: ["Locking the standing knee.", "Letting the hip of the lifted leg drop.", "Holding your breath."],
    tip: "Look at one fixed spot ahead – it makes holding much easier. Eyes closed is the hardest step, so always keep a hand right by the support for it."
  },
  "Tandem stand & heel-to-toe walk": {
    steps: ["Stand with one foot directly in front of the other, front heel touching the back toes.", "Arms crossed or slightly out, weight evenly on both feet.", "Hold for the set time, then switch which foot is in front.", "For the walk: step so each heel lands right at the other foot's toes, along a straight line."],
    levels: ["Tandem stand on the floor.", "Tandem stand with eyes closed, hand right by the support.", "Tandem stand on the balance pad.", "Heel-to-toe walk forwards, then backwards, then with slow head turns."],
    avoid: ["Leaving a gap between heel and toes.", "Looking down at your feet the whole time.", "Rushing the walk."],
    tip: "A strip of tape on the floor gives you a line to follow."
  },
  "Toe stand & calf-raise hold": {
    steps: ["Stand tall, feet hip-width, hands on the hips or a hand on the support.", "Rise slowly as high as you can onto the balls of the feet.", "Hold the top position for the set time.", "Lower slowly."],
    levels: ["Both feet.", "One leg, hand on the support.", "Both feet with slow arm reaches.", "Both feet on the balance pad."],
    avoid: ["Rolling out onto the little toes.", "Bending the knees to stay up.", "Dropping down fast."],
    tip: "Press through the big toe – it keeps the ankle straight."
  },
  "Split-stance hold": {
    steps: ["Take one normal step forward and keep both feet flat, hip-width apart.", "Weight in the middle, hips and shoulders facing forward.", "Knees soft, chest tall.", "Hold for the set time, then switch which foot is in front."],
    levels: ["Floor.", "Eyes closed, hand right by the support.", "On the balance pad."],
    avoid: ["Feet on one line (that's the tandem stand).", "Twisting the hips toward the back leg.", "Leaning on the front leg."]
  },
  "Single-leg star reach": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Reach the free foot forward and tap the floor lightly with the toes.", "Bring it back, then tap to the side, then behind you.", "Keep going for the set time, then switch legs."],
    levels: ["Floor, small reaches.", "Floor, longer reaches.", "On the balance pad."],
    avoid: ["Putting weight on the tapping foot.", "Locking the standing knee.", "Twisting the hips to reach further."],
    tip: "Reach only as far as you can come back without wobbling."
  },
  "Step and hold": {
    steps: ["Stand in front of a low box or step, next to a support.", "Step up with one foot and drive the other knee up to hip height.", "Hold on one leg for 3 seconds.", "Step back down with control. Do all reps, then switch legs."],
    levels: ["Step forward on the floor and hold.", "Step up onto a low box and hold.", "Step forward and back and hold each time."],
    avoid: ["A box so high that you need to swing up.", "Letting the standing knee cave inward.", "Rushing the hold."],
    knee: "Keep the box low (ankle to mid-shin height) and stop if the knee complains."
  },
  "Lateral step and hold": {
    steps: ["Stand with feet together next to a support.", "Take a step out to the side and land softly on that foot.", "Lift the other foot and hold on one leg for 3 seconds.", "Step back to the start. Do all reps, then switch sides."],
    levels: ["Step out on the floor.", "Step onto the balance pad."],
    avoid: ["Landing stiff-legged.", "Letting the knee fall inward on landing.", "Stepping so far that you can't hold still."]
  },
  "Single-leg stand with a weight": {
    steps: ["Stand on one leg next to a support, holding a light dumbbell (1–4 kg).", "Hold it still, pass it slowly from hand to hand in front of you, or pass it around the body.", "Keep the hips level and chest tall the whole time.", "Hold for the set time, then switch legs."],
    levels: ["Hold the weight in one hand.", "Pass it hand to hand in front.", "Pass it around the body."],
    avoid: ["Leaning toward the weight.", "Going heavy – the point is control, not strength.", "Twisting the hips as the weight goes behind you."],
    tip: "At home: body weight only for beginners – swap the weight for slow arm reaches."
  },
  "Ball toss to a wall": {
    steps: ["Stand on one leg about 1–2 m from a wall, next to a support.", "Toss a light ball against the wall at chest height.", "Catch it with soft arms and a soft standing knee.", "Keep tossing for the set time, then switch legs."],
    levels: ["On the floor, gentle tosses.", "On the balance pad."],
    avoid: ["Throwing hard – soft tosses are enough.", "Stiff arms on the catch.", "Standing too close to the wall."],
    tip: "No ball at home? A rolled-up pair of socks works fine."
  },
  "Small hop and stick": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Make a small hop – a few centimetres is enough.", "Land softly on the ball of the foot, knee bending over the toes.", "Hold the landing still for 3 seconds. Do all reps, then switch legs."],
    levels: ["Small hop in place.", "Hop forward and stick, small hop back.", "Hop sideways and stick, small hop back."],
    avoid: ["Landing on a straight knee.", "Letting the knee fall inward.", "Hopping higher than you can control."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the lateral step and hold instead."
  },
  "Single-leg Romanian deadlift reach": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Hinge forward from the hips and let the free leg rise straight behind you.", "Keep the body in one line from head to back heel, hips level, arms hanging toward the floor.", "Go until the body is close to level, then stand back up slowly. Do all reps, then switch legs."],
    levels: ["Body weight, fingertips on the support.", "Body weight, no support.", "Light dumbbell in the hand opposite the standing leg."],
    avoid: ["Opening the hip so the back leg turns out.", "Rounding the back to reach lower.", "Locking the standing knee."],
    tip: "For Some and Experienced users. Think \"long line from head to heel\" rather than \"touch the floor\"."
  },
  "Reverse lunge to knee drive": {
    steps: ["Stand tall next to a support.", "Step one foot back into a lunge, back knee close to the floor.", "Push through the front foot and drive the back knee up to hip height in one move.", "Hold on one leg for 3 seconds, then step back into the next lunge. Do all reps, then switch legs."],
    levels: ["Hand on the support.", "No support.", "Holding a light dumbbell in each hand."],
    avoid: ["Letting the front knee cave inward.", "Leaning far forward as you come up.", "Rushing the hold at the top."],
    knee: "Short lunge and only to a comfortable depth. Skipped if you chose \"go easy on knees\".",
    tip: "For Some and Experienced users."
  },
  "Skater bound and stick": {
    steps: ["Stand on one leg, knee and hip slightly bent.", "Jump sideways and land on the other foot, the free leg crossing behind.", "Land softly and hold still for 2 seconds.", "Jump back. Keep going for the set number of reps."],
    levels: ["Small jumps, hold 2 s.", "Longer jumps, hold 2 s.", "Longer jumps, landing on the balance pad."],
    avoid: ["Landing on a straight knee.", "Letting the knee fall inward on landing.", "Jumping further than you can stick."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the lateral step and hold instead.",
    tip: "For Experienced users, from phase 3."
  },
  "March or skip in place": {
    steps: ["Stand tall next to a support, feet hip-width.", "Drive one knee up to hip height while the opposite arm swings forward.", "Put it down and switch – march (step) or skip (small hop on the standing foot each time).", "Keep going for the set time, landing softly on the balls of the feet."],
    levels: ["High-knee march, slow.", "High-knee march, quick.", "Skipping in place.", "Skipping in place, longer sets."],
    avoid: ["Leaning back to get the knee higher.", "Stomping – land quietly.", "Holding your breath."],
    knee: "With \"go easy on knees\": march only, no skipping.",
    tip: "Gets the heart going as well. New: march from phase 2, skipping from phase 4 · Some: skipping from phase 3 · Experienced: skipping from phase 2."
  },
  "Jump lunge": {
    steps: ["Start halfway down in a lunge, one foot forward, back heel up, chest tall.", "Jump straight up explosively and swap the legs in the air.", "Land softly in a lunge with the other foot in front, knees bending to absorb.", "Go straight into the next jump. Keep going for the set time or reps."],
    levels: ["Step switch: stand up, swap feet, lower back into the lunge (no jump).", "Jump lunge with a short pause after each landing.", "Jump lunge, continuous."],
    avoid: ["Landing on straight legs.", "Front knee falling inward.", "Going so fast that the landings get loud."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the step switch at a shallow depth, or the high-knee march.",
    tip: "Gets the heart going and trains landing on one leg under control."
  },
  "Wall sit": {
    steps: ["Stand with your back against a wall, feet about a foot length in front of you.", "Slide down until the thighs are level and the knees are over the ankles.", "Back flat on the wall, arms crossed, breathe calmly.", "Hold for the set time, then slide back up."],
    levels: ["Higher position (thighs not quite level), 20 s.", "Thighs level, 30–45 s.", "One leg straight out (switch legs), 15–20 s."],
    avoid: ["Knees going past the toes.", "Pushing the hands on the thighs.", "Holding your breath."],
    knee: "Stay higher on the wall, where the knee feels fine.",
    tip: "A static hold for the thighs – part of the \"static holds\" block you suggested, together with plank-type core holds."
  },
  "Single-leg Pallof press": {
    steps: ["Set a cable at chest height and stand side-on to it on the leg furthest from the machine.", "Hold the handle at the chest with both hands.", "Press it straight out and hold – the cable tries to turn you, don't let it.", "Bring it back slowly. Do all reps, then turn around and switch legs."],
    levels: ["Light weight, short hold.", "Heavier weight or longer hold.", "On the balance pad."],
    avoid: ["Twisting toward the machine.", "Letting the hip of the lifted leg drop.", "Going so heavy that the standing foot moves."],
    tip: "For Some and Experienced users. Pressure from the side is closer to real life than standing still."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W4", "Mobility and cardio", () => {
// ---- Wave 4 samples: mobility (follow-along) and cardio.
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };
const wave = (u, n = 1) => 0.5 - 0.5 * Math.cos(TAU * n * u);                  // 0 → 1 → 0, smooth

// ======================= MOBILITY =======================
// half-kneeling hip-flexor stretch: right knee down behind, tuck the pelvis, shift forward, right arm reaches up
function hipFlexor(u) {
  const J = {}, k = hold(u, .22, .45, .72, .92), ak = hold(u, .04, .42, .7, .94), aa = rad(lerpN(-88, 100, sm(ak)));
  trunk(J, [4 + 10 * k, 47 - 2 * k, 0], V.norm([0.02, 1, 0.08 * k]));
  leg(J, "L", [40, 1, -10], [1, 0, 0]);
  setLeg(J, "R", [-4, 3, 9], [-44, 3, 9], [-4, -2, 0]);
  J.kneR = [-4 + 4 * k, 3, 9];
  arm(J, "L", V.add(J.hipL, [6, 8, -8]), [0, 0, -1]);
  arm(J, "R", V.add(J.shoR, V.mul(V.norm([Math.cos(aa), Math.sin(aa), 0.12]), 58)), [0, 0, 1]);
  return { items: [...floor3(-70, 70, 40), ...foamMat(-14, 8, 0, 20), ...body(J)], J };
}
const foamMat = (x0, x1, z0, z1) => [{ type: "poly", pts: [[x0, 1, z0], [x1, 1, z0], [x1, 1, z1], [x0, 1, z1]], cls: "an3pad2", z: -999 }];

// 90/90 hip switches: sitting, feet wide, both knees drop to one side, then the other
function ninety(u) {
  const J = {}, b = rad(70 * Math.sin(TAU * u));
  trunk(J, [-6, 9, 0], sag(-6));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [34, 2, 34 * zz], [0, Math.cos(b), Math.sin(b)], [10, 4, 0]);
    arm(J, sd, [-30, 2, 22 * zz], [0.3, 1, 0]);
  }
  return { items: [...floor3(-60, 80, 60), ...body(J)], J };
}

// ankle rocks: half-kneeling facing a wall, drive the front knee forward over the toes, heel stays down
function ankleRock(u) {
  const J = {}, k = wave(u, 2), ank = [40, 1, -10], kne = [40 + 20 * k, 44 - 4 * k, -10];
  trunk(J, V.lerp([-4, 47, 0], [16, 42, 0], k), sag(4 + 8 * k));          // hips travel with the knee so the thigh keeps its length
  setLeg(J, "R", [-4, 3, 9], [-44, 3, 9], [-4, -2, 0]);
  setLeg(J, "L", kne, ank, [12, 0, 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, [92, 70 + (sd === "L" ? 0 : 6), 14 * zz], [-0.4, -1, 0.3 * zz]);
  return { items: [...floor3(-70, 100, 40), { type: "poly", pts: [[100, 0, -40], [100, 150, -40], [100, 150, 40], [100, 0, 40]], cls: "an3pad2", z: -999 }, ...body(J)], J };
}

// open book: lying on the left side, knees bent and stacked, the top arm sweeps open and the chest follows
function openBook(u) {
  const J = {}, g = rad(180 * hold(u, .08, .4, .62, .95)), lat = [0, Math.cos(g / 2), -Math.sin(g / 2)];
  const pelvis = [0, 10, 0], chest = [50, 12, 0];
  J.pelvis = pelvis; J.chest = chest; J.head = [67, 13, 0];
  J.hipL = V.add(pelvis, [0, -8, 0]); J.hipR = V.add(pelvis, [0, 8, 0]);
  J.shoL = V.sub(chest, V.mul(lat, 16)); J.shoR = V.add(chest, V.mul(lat, 16));
  for (const sd of ["L", "R"]) { const h = J["hip" + sd], kn = V.add(h, [0, 0, 44]); setLeg(J, sd, kn, V.add(kn, [-40, 0, 0]), [-8, 0, 4]); }
  J.elbL = V.add(J.shoL, [0, 0, 30]); J.wriL = V.add(J.shoL, [0, 0, 58]);
  const dir = [0, Math.sin(g), Math.cos(g)]; J.elbR = V.add(J.shoR, V.mul(dir, 31)); J.wriR = V.add(J.shoR, V.mul(dir, 60));
  return { items: [...floor3(-60, 90, 70), ...body3(J, "all")], J };
}

// deep squat hold: heels down, elbows pushing the knees out, small side-to-side shift
function deepSquat(u) {
  const J = {}, s = 4 * Math.sin(TAU * u), lean = 26;
  trunk(J, [-12, 24, s], sag(lean), [0, 0, 1], sag(lean - 30));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [8, 1, 20 * zz], [1, 0.1, 0.6 * zz], [11, 0, 4 * zz]);
    arm(J, sd, V.add(J.chest, V.add(V.mul(sag(lean + 90), 16), [0, -8, 2 * zz])), [0.2, -1, 1 * zz]);
  }
  return { items: [...floor3(-60, 60, 44), ...body(J)], J };
}

// calf stretch: hands on a wall, back leg straight with the heel down, lean in
function calfStretch(u) {
  const J = {}, k = hold(u, .08, .3, .75, .95);
  const pelvis = [-6 + 10 * k, 84 - 2 * k, 0];
  trunk(J, pelvis, sag(12 + 10 * k));
  leg(J, "L", [22, 1, -9], [1, 0, 0]);
  leg(J, "R", [-44, 1, 9], [1, 0, 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, [72, 128, 16 * zz], [-0.5, -1, 0.2 * zz]);
  return { items: [...floor3(-70, 90, 40), { type: "poly", pts: [[80, 0, -40], [80, 170, -40], [80, 170, 40], [80, 0, 40]], cls: "an3pad2", z: -999 }, ...body(J)], J };
}

// ======================= CARDIO =======================
function bike(u) {
  const J = {}, C = [30, 30, 0], th = -u * TAU;
  trunk(J, [0, 90, 0], sag(28), [0, 0, 1], sag(50));
  const items = [...floor3(-40, 90, 36), L3([-18, 0, 0], [72, 0, 0], "an3eq"), D3([58, 24, 0], 16, "an3fly"), L3([-2, 84, 0], [8, 40, 0], "an3col"), L3([8, 40, 0], [58, 22, 0], "an3col"),
    L3([58, 22, 0], [46, 110, 0], "an3col"), L3([8, 40, 0], [-10, 0, 0], "an3col"), L3([58, 22, 0], [62, 0, 0], "an3col"),
    L3([-14, 86, 0], [8, 87, 0], "an3pad"), L3([46, 112, -18], [48, 114, 18], "an3eq"), D3(C, 3, "an3eqf")];
  for (const [sd, zz] of SIDES) {
    const a = th + (sd === "R" ? 0 : Math.PI), ank = [C[0] + 16 * Math.cos(a), C[1] + 16 * Math.sin(a), 12 * zz];
    items.push(L3(C, [ank[0], ank[1], 6 * zz], "an3eq"));
    leg(J, sd, ank, [1, 0.6, 0]);
    arm(J, sd, [48, 114, 16 * zz], [0, -1, 0.3 * zz]);
  }
  return { items: [...items, ...body(J)], J };
}
function crossTrainer(u) {
  const J = {}, th = -TAU * u;
  trunk(J, [-6 + 2 * Math.sin(th), 98, 0], sag(6));
  const items = [...floor3(-60, 90, 40), L3([-40, 0, 0], [70, 0, 0], "an3col"), L3([70, 0, 0], [76, 120, 0], "an3col"), D3([66, 30, 0], 14, "an3fly")];
  for (const [sd, zz] of SIDES) {
    const a = th + (sd === "R" ? 0 : Math.PI), ped = [8 + 22 * Math.cos(a), 16 + 7 * Math.sin(a), 12 * zz];
    leg(J, sd, V.add(ped, [0, 1, 0]), [1, 0, 0]);
    const hand = [34 - 12 * Math.cos(a), 112, 22 * zz];
    arm(J, sd, hand, [-1, -0.3, 0.2 * zz]);
    items.push(L3([ped[0] - 8, ped[1], ped[2]], [ped[0] + 12, ped[1], ped[2]], "an3pad"), L3([66, 30, 18 * zz], ped, "an3eq"), L3([hand[0] + 4, 40, 20 * zz], hand, "an3eq"), D3(hand, 4, "an3grip"));
  }
  return { items: [...items, ...body(J)], J };
}

// treadmill: deck rising toward the front (incline), belt marks slide back.
// Walk: one foot always down. Jog: short ground contact, then a flight phase with both feet off the belt.
function treadmill(u, o = {}) {
  const J = {}, inc = o.incline ? 0.08 : 0.015, deckY = x => 6 + (x + 60) * inc, run = !!o.run;
  const duty = run ? 0.34 : 0.62, L = run ? 34 : 40, speed = L / duty;              // belt travel per stride
  const bob = run ? 2.5 - 3.5 * Math.cos(TAU * 2 * (u - duty / 2 + 0.25)) : -1.4 * Math.cos(TAU * 2 * (u - duty / 4));
  const lean = run ? 9 : (o.incline ? 7 : 3);
  trunk(J, [run ? 2 : 0, deckY(0) + (run ? 79 : 83) + bob, 0], sag(lean));
  const foot = p => {                                                                   // p = this foot's phase, 0 = touch-down
    if (p < duty) { const x = lerpN(L / 2, -L / 2, p / duty); return [x, 0, 0]; }
    const q = (p - duty) / (1 - duty), x = lerpN(-L / 2, L / 2, sm(q));
    const lift = run ? 22 * Math.sin(Math.PI * q) ** 1.5 * (1.2 - q) : 9 * Math.sin(Math.PI * q);
    return [x - (run ? 10 * Math.sin(Math.PI * q) : 0), lift, 1];
  };
  for (const [sd, zz, ph] of [["R", 1, 0], ["L", -1, 0.5]]) {
    const [x, lift, sw] = foot((u + ph) % 1), heel = !sw && !run, toeUp = sw ? 0 : 0;
    leg(J, sd, [x, deckY(x) + 2 + lift, 9 * zz], [1, 0, 0], run && sw ? [11, -3, 0] : [12, toeUp, 0]);
  }
  const sw2 = Math.cos(TAU * u);                                                       // arms opposite to the legs
  for (const [sd, zz] of SIDES) {
    const f = (sd === "L" ? 1 : -1) * sw2;
    if (run) arm(J, sd, V.add(J["sho" + sd], [8 + 20 * f, -38 + 6 * f, 6 * zz]), [-1, -0.4, 0]);
    else arm(J, sd, V.add(J["sho" + sd], [4 + 24 * f, -55 + 3 * Math.abs(f), 8 * zz]), [-1, -0.1, 0.2 * zz]);
  }
  const off = (u * speed) % 40;
  const items = [...floor3(-70, 80, 40), { type: "poly", pts: [[-60, deckY(-60), -22], [62, deckY(62), -22], [62, deckY(62), 22], [-60, deckY(-60), 22]], cls: "an3pad2", z: -999 },
    L3([62, deckY(62), -22], [66, 128, -22], "an3eq"), L3([62, deckY(62), 22], [66, 128, 22], "an3eq"), L3([66, 128, -24], [66, 128, 24], "an3col")];
  for (let k = -3; k <= 4; k++) { const x = k * 40 - off; if (x > -60 && x < 62) items.push(L3([x, deckY(x) + 0.4, -20], [x, deckY(x) + 0.4, 20], "an3eq")); }
  return { items: [...items, ...body(J)], J };
}

// rower: drive = legs → body → arms; recovery = arms → body → legs.
// The handle travels in a straight, level line from arms' length to the solar plexus.
function rower(u) {
  const J = {};
  const legs = u < .5 ? seg(u, .02, .22) : 1 - seg(u, .7, .96), torso = u < .5 ? seg(u, .14, .3) : 1 - seg(u, .58, .76), armsK = u < .5 ? seg(u, .24, .42) : 1 - seg(u, .46, .62);
  const px = lerpN(14, -32, legs), lean = lerpN(26, -14, torso), d = sag(lean);
  trunk(J, [px, 22, 0], d, [0, 0, 1], sag(lean - 10));
  for (const [sd, zz] of SIDES) leg(J, sd, [56, 16, 10 * zz], [0.3, 1, 0], [6, 10, 0]);
  const hy = 58, sh = mid3(J.shoL, J.shoR), reachX = sh[0] + Math.sqrt(Math.max(0, 60 * 60 - (sh[1] - hy) ** 2));
  const finX = J.chest[0] + 14;
  const h = [lerpN(reachX, finX, sm(armsK)), hy, 0];
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(h, [0, 0, 10 * zz]), [-0.6, -1, 0.9 * zz]);
  const F = [112, 30, 0];
  return { items: [...floor3(-80, 130, 36), L3([-80, 6, 0], [116, 6, 0], "an3col"), L3([112, 6, 0], [112, 62, 0], "an3col"), D3(F, 14, "an3fly"), L3([62, 6, -16], [62, 30, -16], "an3eq"), L3([62, 6, 16], [62, 30, 16], "an3eq"),
    L3([px - 10, 20, 0], [px + 10, 20, 0], "an3pad"), ...body(J), L3([F[0], hy, 0], h, "an3cable"), L3(V.add(h, [0, 0, -12]), V.add(h, [0, 0, 12]), "an3bar")], J };
}

// jump rope: small hops, the rope swings round from behind, over the head and under the feet
function jumpRope(u) {
  const J = {}, phi = TAU * u, hop = Math.max(0, Math.sin(TAU * u - Math.PI / 2 - 0.3)) ** 2 * 7;
  trunk(J, [0, 85 + hop, 0], sag(3));
  for (const [sd, zz] of SIDES) leg(J, sd, [4, 1 + hop, 8 * zz], [1, 0, 0], [12, -hop * 0.7, 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["hip" + sd], [10 + 3 * Math.cos(phi), 14 + 3 * Math.sin(phi), 14 * zz]), [-1, -0.3, 0.3 * zz]);
  const c = [4, 92, 0], R = 98, b = [c[0] + R * 0.75 * Math.sin(phi), c[1] + R * Math.cos(phi), 0];      // the far point of the rope loop
  const items = [...floor3(-50, 60, 44), ...body(J)];
  for (const w of [J.wriL, J.wriR]) {
    let prev = w;
    for (let k = 1; k <= 6; k++) {
      const t = k / 6, mid = V.add(V.lerp(w, b, 0.5), V.mul(V.norm(V.sub(b, c)), 22));
      const p = V.add(V.add(V.mul(w, (1 - t) * (1 - t)), V.mul(mid, 2 * t * (1 - t))), V.mul(b, t * t));
      items.push(L3(prev, p, "an3rope")); prev = p;
    }
  }
  return { items, J };
}

// body-weight circuit moves
function stepJack(u, jump) {
  const J = {}, k = wave(u), hop = jump ? Math.sin(Math.PI * ((u * 2) % 1)) * 5 : 0;
  trunk(J, [0, 85 + hop - 2 * k, 0], [0, 1, 0]);
  const wide = 10 + 20 * k;
  for (const [sd, zz] of SIDES) leg(J, sd, [2, 1 + hop, wide * zz], [1, 0, 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["sho" + sd], V.mul(V.norm(V.lerp([0.05, -1, 0.15 * zz], [0.05, 1, 0.5 * zz], k)), 59)), [-1, 0, 0]);
  return { items: [...floor3(-50, 60, 60), ...body(J)], J };
}
function airSquat(u) {
  const J = {}, t = wave(u), lean = lerpN(3, 30, t);
  trunk(J, V.lerp([0, 86, 0], [-28, 50, 0], t), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) { leg(J, sd, [8, 1, 16 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]); arm(J, sd, V.add(J["sho" + sd], V.mul(V.norm(V.lerp([0.1, -1, 0.1 * zz], [1, 0.1, 0.12 * zz], t)), 58)), [-0.2, -1, 0.3 * zz]); }
  return { items: [...floor3(-60, 60, 44), ...body(J)], J };
}
function climber(u) {
  const J = {}, F = [-92, 8, 0], L = 136, b = Math.asin((64 - F[1]) / L), d = [Math.cos(b), Math.sin(b), 0];
  trunk(J, V.add(F, V.mul(d, 86)), d, [0, 0, 1], [d[0], d[1] - 0.3, 0]);
  const xs = F[0] + L * Math.cos(b);
  for (const [sd, zz] of SIDES) {
    arm(J, sd, [xs, 1, 20 * zz], [-0.6, 0.3, 0.9 * zz]);
    const k = Math.max(0, Math.sin(TAU * u + (sd === "R" ? 0 : Math.PI)));
    leg(J, sd, V.lerp([F[0], F[1], 8 * zz], V.add(J["hip" + sd], [26, -34, 0]), k), [1, -0.2, 0], V.lerp([2, -8, 0], [6, -6, 0], k));
  }
  return { items: [...floor3(-110, 70, 40), ...body(J)], J };
}

const SAMPLES = {
  "mob-hf": { cap: ["Right knee down, tuck the pelvis", "Shift forward, reach up, hold"], cam: camera(-36, 12, 120, 206, 0.9), dur: 8000, loop: true,
    frame: hipFlexor, cues: [{ when: "all", pt: J => J.pelvis, text: "Tuck the tailbone" }, { when: "all", pt: J => J.wriR, text: "Reach up" }] },
  "mob-90": { cap: ["Sit tall, feet wide", "Knees drop to one side, then the other"], cam: camera(62, 36, 120, 150, 1.05), dur: 5000, loop: true,
    frame: ninety, cues: [{ when: "all", pt: J => J.chest, text: "Sit tall" }] },
  "mob-an": { cap: ["Half-kneeling, facing a wall", "Knee forward over the toes, heel down"], cam: camera(-28, 12, 112, 196, 0.95), dur: 4000, loop: true,
    frame: ankleRock, cues: [{ when: "all", pt: J => J.ankL, text: "Heel stays down" }] },
  "mob-ob": { cap: ["Lying on the side, knees stacked", "Open the top arm like a book, eyes follow"], cam: camera(-20, 40, 118, 168, 1.05), dur: 6000, loop: true,
    frame: openBook, cues: [{ when: "all", pt: J => J.kneR, text: "Knees stay together" }] },
  "mob-sq": { cap: ["Deep squat, heels down", "Elbows push the knees out, breathe"], cam: camera(-34, 10, 118, 200, 0.95), dur: 5000, loop: true,
    frame: deepSquat, cues: [{ when: "all", pt: J => J.ankR, text: "Heels down" }] },
  "mob-ca": { cap: ["Hands on the wall, back leg straight", "Lean in, heel stays down, hold"], cam: camera(-26, 10, 112, 212, 0.86), dur: 6000, loop: true,
    frame: calfStretch, cues: [{ when: "all", pt: J => J.ankR, text: "Back heel down" }] },
  "car-bk": { cap: ["Saddle at hip height", "Soft knee at the bottom of the pedal"], cam: camera(-18, 10, 95, 200, 1), dur: 1400, loop: true,
    frame: bike, cues: [{ when: "all", pt: J => J.ankR, text: "Soft knee at the bottom" }] },
  "car-xt": { cap: ["Stand tall, light grip", "Push and pull with arms and legs"], cam: camera(-26, 10, 112, 214, 0.86), dur: 1500, loop: true,
    frame: crossTrainer, cues: [{ when: "all", pt: J => J.chest, text: "Stand tall" }] },
  "car-tw": { cap: ["Incline walk", "Don't hold the rails"], cam: camera(-30, 10, 112, 212, 0.84), dur: 1150, loop: true,
    frame: u => treadmill(u, { incline: true }), cues: [{ when: "all", pt: J => J.chest, text: "Walk tall, hands free" }] },
  "car-wr1": { cap: ["Walk", "Brisk walk between the jogs"], cam: camera(-30, 10, 112, 212, 0.84), dur: 1050, loop: true,
    frame: u => treadmill(u), cues: [{ when: "all", pt: J => J.chest, text: "Brisk walk" }] },
  "car-wr2": { cap: ["Jog", "Short contact, both feet off for a moment"], cam: camera(-30, 10, 112, 212, 0.84), dur: 760, loop: true,
    frame: u => treadmill(u, { run: true }), cues: [{ when: "all", pt: J => J.chest, text: "Short, light steps" }] },
  "car-row": { cap: ["Drive: legs → body → arms", "Return: arms → body → legs"], cam: camera(-18, 10, 104, 186, 0.86), dur: 3200, loop: true,
    frame: rower, cues: [{ when: "all", pt: J => J.kneR, text: "Legs first" }] },
  "car-jr": { cap: ["Small hops on the balls of the feet", "Turn the rope with the wrists"], cam: camera(-30, 6, 116, 196, 0.72), dur: 800, loop: true,
    frame: jumpRope, cues: [{ when: "all", pt: J => J.wriR, text: "Wrists turn the rope" }] },
  "car-sj": { cap: ["Step jack (New)", "Step out, arms up – no jump"], cam: camera(-58, 10, 124, 212, 0.86), dur: 1600, loop: true,
    frame: u => stepJack(u, false), cues: [{ when: "all", pt: J => J.chest, text: "Stand tall" }] },
  "car-jj": { cap: ["Jumping jack", "Jump out, arms up, jump in"], cam: camera(-58, 10, 124, 212, 0.86), dur: 1000, loop: true,
    frame: u => stepJack(u, true), cues: [{ when: "all", pt: J => J.chest, text: "Land soft" }] },
  "car-as": { cap: ["Air squat", "Arms forward as you sit back"], cam: camera(-30, 10, 118, 212, 0.86), dur: 2000, loop: true,
    frame: airSquat, cues: [{ when: "all", pt: J => J.kneR, text: "Knees follow the toes" }] },
  "car-mc": { cap: ["Mountain climber", "Drive the knees in, one at a time"], cam: camera(-35, 16, 140, 178, 0.95), dur: 1000, loop: true,
    frame: climber, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips low" }] }
};

const CARDS = [
  { section: "Mobility – follow along" },
  { title: "Half-kneeling hip-flexor stretch", fam: "Hips · 30–45 s per side", keys: [["Follow along", "mob-hf"]] },
  { title: "90/90 hip switches", fam: "Hips · 6–10 slow switches", keys: [["Follow along", "mob-90"]] },
  { title: "Ankle rocks", fam: "Ankles · 10 per side", keys: [["Follow along", "mob-an"]] },
  { title: "Open-book upper-back rotation", fam: "Upper back · 6–8 per side", keys: [["Follow along", "mob-ob"]] },
  { title: "Deep squat hold", fam: "Hips and ankles · 30–60 s", keys: [["Follow along", "mob-sq"]] },
  { title: "Calf stretch", fam: "Calves · 30–45 s per side", keys: [["Follow along", "mob-ca"]] },
  { section: "Cardio – how to and how hard" },
  { title: "Bike", fam: "Low impact · default machine", keys: [["Bike", "car-bk"]] },
  { title: "Cross-trainer", fam: "Low impact · arms and legs", keys: [["Cross-trainer", "car-xt"]] },
  { title: "Incline treadmill walk", fam: "Low impact · walking", keys: [["Incline walk", "car-tw"]] },
  { title: "Walk–run", fam: "New from phase 2 · treadmill or outdoors", keys: [["Walk", "car-wr1"], ["Jog", "car-wr2"]] },
  { title: "Rower", fam: "Low impact · technique first · Some phase 2, New phase 3", keys: [["Stroke", "car-row"]] },
  { title: "Jump rope", fam: "Higher impact · not with knees on \"go easy\"", keys: [["Jump rope", "car-jr"]] },
  { title: "Body-weight cardio circuit", fam: "Home or gym · no machine", keys: [["Step jack", "car-sj"], ["Jumping jack", "car-jj"], ["Air squat", "car-as"], ["Mountain climber", "car-mc"]] }
];

const TALK = { easy: "Easy – you can talk in full sentences.", steady: "Steady – you can talk in short sentences.", hard: "Hard – only a few words at a time." };
const GUIDES = {
  "Half-kneeling hip-flexor stretch": {
    steps: ["Kneel on one knee (on a mat), the other foot flat in front.", "Tuck the tailbone under and squeeze the glute of the back leg.", "Shift the hips gently forward until you feel a stretch at the front of the back hip.", "Reach the arm on the same side up. Hold and breathe, then switch."],
    avoid: ["Arching the lower back to go further.", "Letting the front knee cave inward.", "Bouncing."],
    tip: "The glute squeeze does most of the work – you need less forward shift than you think."
  },
  "90/90 hip switches": {
    steps: ["Sit on the floor, feet flat and wider than the hips, hands behind you.", "Sit tall.", "Let both knees drop slowly to one side toward the floor.", "Bring them up and over to the other side. Keep it slow and controlled."],
    avoid: ["Rounding the back – lean on the hands if needed.", "Forcing the knees down.", "Rushing."],
    tip: "As it gets easier, take the hands off the floor."
  },
  "Ankle rocks": {
    steps: ["Half-kneel facing a wall, front foot a hand's width from it.", "Keep the front heel on the floor.", "Drive the front knee forward over the toes toward the wall.", "Rock back and repeat. Then switch legs."],
    avoid: ["Lifting the heel.", "Letting the knee drift inward.", "Pushing into pain at the front of the ankle."],
    tip: "Good for: squatting deeper with the heels down, lunges, step-ups, stairs and running. Stiff ankles make the knees and lower back make up for it. Move the foot further from the wall as the ankle loosens up."
  },
  "Open-book upper-back rotation": {
    steps: ["Lie on your side, knees bent and stacked, arms straight out in front.", "Keep the knees together on the floor.", "Sweep the top arm up and over to the other side, letting the chest turn – eyes follow the hand.", "Breathe out at the end, then return. Do all reps, then switch sides."],
    avoid: ["Letting the knees come apart.", "Forcing the arm to the floor.", "Holding your breath."],
    tip: "Great after desk work or before pressing."
  },
  "Deep squat hold": {
    steps: ["Stand with feet a little wider than the hips, toes slightly out.", "Sit down as deep as you can with the heels on the floor.", "Hands together in front, elbows pushing the knees out.", "Breathe calmly and shift gently from side to side."],
    avoid: ["Heels lifting off the floor.", "Collapsing the back completely.", "Pushing through knee pain."],
    knee: "Hold on to a rack or door frame, or sit back onto a low step, to take weight off the knees.",
    tip: "Heels lifting? Put a small plate or book under them for now."
  },
  "Calf stretch": {
    steps: ["Put your hands on a wall, one foot forward and one back.", "Back leg straight, heel pressed to the floor, toes pointing forward.", "Lean in until you feel a stretch in the back calf.", "Hold and breathe, then switch."],
    avoid: ["Back heel lifting.", "Back foot turning out.", "Arching the lower back."],
    tip: "Bend the back knee slightly to stretch the lower calf too."
  },
  "Bike": {
    steps: ["Set the saddle so the knee is slightly bent at the bottom of the pedal stroke.", "Sit tall, light hands on the handlebars.", "Pedal smoothly at a steady cadence (about 70–90 rpm).", "Change the resistance to match the target effort."],
    avoid: ["Saddle so low that the knees come up high.", "Rocking the hips side to side (saddle too high).", "Gripping the bars hard."],
    talk: true, tip: "The app remembers your resistance level for next time."
  },
  "Cross-trainer": {
    steps: ["Step on and stand tall over the pedals.", "Hold the moving handles lightly.", "Push and pull with arms and legs together in a smooth rhythm.", "Change the resistance to match the target effort."],
    avoid: ["Leaning on the handles.", "Going on the toes – keep the whole foot on the pedal.", "Hunching forward."],
    talk: true
  },
  "Incline treadmill walk": {
    steps: ["Start walking at an easy speed, then raise the incline to 5–12. The incline number is the slope in % – most treadmills go from 0 to 15.", "Walk tall with the arms swinging naturally.", "Adjust speed and incline to match the target effort.", "Lower the incline before stopping."],
    avoid: ["Holding the rails – it takes away most of the work.", "Leaning far forward.", "Raising the incline faster than you can handle."],
    talk: true, tip: "Low impact but surprisingly hard – a great choice for knees and for fat loss."
  },
  "Walk–run": {
    steps: ["Warm up with 5 minutes of brisk walking.", "Jog easily for the set time, then walk briskly for the set time. In a jog both feet leave the ground for a moment – in a walk one foot is always down.", "Repeat for the set number of rounds.", "Over the weeks the jogs get longer and the walks shorter, until you jog continuously."],
    avoid: ["Jogging too fast – you should still be able to talk.", "Long strides that land on the heel far in front.", "Adding too much time at once."],
    knee: "Not used if you chose \"go easy on knees\" – you get the bike, cross-trainer or incline walk instead.",
    talk: true, tip: "New users start this in phase 2, e.g. 1 min jog / 2 min walk."
  },
  "Rower": {
    steps: ["Strap the feet in, sit tall, arms straight toward the handle.", "Drive: push with the legs first, then lean back slightly, then pull the handle to the lower ribs.", "Return: arms out first, then lean forward, then bend the legs.", "Keep a smooth rhythm – about twice as long on the return as on the drive."],
    avoid: ["Pulling with the arms before the legs have pushed.", "Rounding the back at the front.", "Lifting the knees before the handle has passed them on the way back."],
    talk: true, tip: "Learn the order before going hard: legs, body, arms – then arms, body, legs."
  },
  "Jump rope": {
    steps: ["Hold the handles at hip height, elbows close to the body.", "Turn the rope with the wrists, not the whole arm.", "Jump just high enough for the rope to pass – a few centimetres.", "Land softly on the balls of the feet."],
    avoid: ["Jumping high.", "Landing on the heels.", "Big arm circles."],
    knee: "Not used if you chose \"go easy on knees\".",
    talk: true, tip: "No rope? Do the same small hops without one."
  },
  "Body-weight cardio circuit": {
    steps: ["Do each move for the set time (e.g. 30 s), one after another.", "Rest briefly after the last move, then start the next round.", "Pick the version that fits your level – step jacks instead of jumping jacks, for example.", "Keep moving at the target effort."],
    levels: ["New: step jack · air squat · slow mountain climber.", "Some: jumping jack · air squat · mountain climber.", "Experienced: longer rounds or shorter rests."],
    avoid: ["Losing form to go faster.", "Landing hard.", "Holding your breath."],
    knee: "With \"go easy on knees\": step jacks and shallow squats, no jumping.",
    talk: true
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W5a", "Home \u2013 body weight, towel, backpack", () => {
// ---- Wave 5a samples: home exercises with body weight and household items (chair, table, towel, backpack).
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };
const ang = b => [Math.cos(b), Math.sin(b), 0];
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// timeline helper for loops: [[u, value], ...] → smooth steps between the points
const tl = (u, pts) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) return lerpN(pts[i - 1][1], pts[i][1], sm(clamp01((u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])))); return pts[pts.length - 1][1]; };

// ---- household furniture
function chair(x0, x1, y = 44, w = 16, back = "x0") {
  const bx = back === "x0" ? x0 : x1, it = [box3(x0, x1, y, w)];
  for (const x of [x0 + 3, x1 - 3]) for (const z of [-w + 3, w - 3]) it.push(L3([x, 0, z], [x, y, z], "an3eq"));
  if (back) it.push({ type: "poly", pts: [[bx, y, -w], [bx, y + 44, -w], [bx, y + 44, w], [bx, y, w]], cls: "an3bench", z: -998 });
  return it;
}
function table(x0, x1, y = 74, w = 46) {
  const it = [box3(x0, x1, y, w)];
  for (const x of [x0 + 4, x1 - 4]) for (const z of [-w + 4, w - 4]) it.push(L3([x, 0, z], [x, y, z], "an3eq"));
  return it;
}
const wallX = (x, y1 = 175, w = 44) => ({ type: "poly", pts: [[x, 0, -w], [x, y1, -w], [x, y1, w], [x, 0, w]], cls: "an3pad2", z: -999 });
const wallZ = (z, x0, x1, y1 = 175) => ({ type: "poly", pts: [[x0, 0, z], [x0, y1, z], [x1, y1, z], [x1, 0, z]], cls: "an3pad2", z: -999 });
function backpack(c, w = 12, h = 30, t = 9) {                       // c = middle of the top edge; hangs straight down
  const p = (dx, dy, dz) => [c[0] + dx, c[1] + dy, c[2] + dz];
  return [{ type: "poly", pts: [p(t, 0, -w), p(t, 0, w), p(t, -h, w + 1), p(t, -h, -w - 1)], cls: "an3plate" },
    { type: "poly", pts: [p(-t, 0, w), p(t, 0, w), p(t, -h, w + 1), p(-t, -h, w + 1)], cls: "an3plate" }];
}
function curve(a, b, sagV, cls = "an3rope", n = 6) {                // a soft line (towel, strap) from a to b, bowed by sagV
  const out = []; let prev = a;
  for (let k = 1; k <= n; k++) { const t = k / n, p = V.add(V.lerp(a, b, t), V.mul(sagV, 4 * t * (1 - t))); out.push(L3(prev, p, cls)); prev = p; }
  return out;
}

// ======================= PUSH =======================
// Push-up ladder. The body is a straight line turning around the feet (or knees); the hands stay put.
// Bottom: chest just above the surface (or 20 from the wall). Top: arms long.
function pushRig(o) {
  const L = o.knees ? 94 : 136, P = o.P, ch = b => [P[0] + L * Math.cos(b), P[1] + L * Math.sin(b)];
  let bB, H;
  if (o.wall !== undefined) { bB = Math.acos((o.wall - 20 - P[0]) / L); const c = ch(bB); H = [o.wall - 1, c[1] - 4]; }
  else { bB = Math.asin((o.hy + 14 - P[1]) / L); const c = ch(bB); H = [c[0] + 4, o.hy + 1]; }
  let bT = bB; while (Math.hypot(d2(ch(bT), H), 6) < 57.5 && bT < bB + 1.2) bT += 0.003;
  return { L, P, bB, bT, H };
}
const RIGS = {};
function pushLadder(u, o) {
  const R = RIGS[o.id] || (RIGS[o.id] = pushRig(o)), J = {}, b = lerpN(R.bT, R.bB, u), d = ang(b), P = R.P;
  const pelvis = V.add([P[0], P[1], 0], V.mul(d, o.knees ? 44 : 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.25, 0]);
  for (const [sd, zz] of SIDES) {
    if (o.knees) { const k = [P[0], P[1], 8 * zz]; setLeg(J, sd, k, V.add(k, [-36, 21, 0]), [-5, -9, 0]); }
    else { const a = [P[0], P[1], 8 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, o.toe || [2, -8, 0]); }
    const hz = o.wall !== undefined ? 22 : 24;
    arm(J, sd, [R.H[0], R.H[1], hz * zz], o.wall !== undefined ? [-0.4, -0.8, 0.9 * zz] : [-0.6, 0.3, 0.9 * zz]);
  }
  const items = [...floor3(o.f0 ?? -110, o.f1 ?? 80, 40), ...(o.gear ? o.gear(R.H) : [])];
  return { items: [...items, ...body(J)], J };
}
const PUSH = {
  wall:  { id: "wall", P: [-30, 6], wall: 66, toe: [10, -3, 0], f0: -60, f1: 80, gear: () => [wallX(66)] },
  table: { id: "table", P: [-92, 8], hy: 72, gear: H => table(H[0] - 4, H[0] + 76) },
  chair: { id: "chair", P: [-92, 8], hy: 45, gear: H => chair(H[0] - 5, H[0] + 33, 44, 16, "x1") },
  knees: { id: "knees", P: [-40, 4], knees: true, hy: 0, f0: -95 },
  full:  { id: "full", P: [-92, 8], hy: 0 },
  feet:  { id: "feet", P: [-96, 47], hy: 0, f0: -130, gear: () => chair(-118, -78, 44, 16, "x0") }
};
// slow lowering: 3 s down, 1 s up
const slowU = u => tl(u, [[0, 0], [.06, 0], [.64, 1], [.72, 1], [.9, 0], [1, 0]]);

// pike push-up: hips high, body like an upside-down V; the head lowers toward the floor just in front of the hands
function pikeRig(F, H) {
  const dv = V.sub(H, F), d = V.len(dv), e = V.mul(dv, 1 / d), n = [-e[1], e[0], 0];
  const a = (86 * 86 - 108 * 108 + d * d) / (2 * d), h = Math.sqrt(86 * 86 - a * a), pT = V.add(V.add(F, V.mul(e, a)), V.mul(n, h));
  const aT = Math.atan2(pT[1] - F[1], pT[0] - F[0]), aB = aT - rad(20), pB = V.add(F, V.mul(ang(aB), 85.5));
  return { aT, aB, dT: V.norm(V.sub(H, pT)), dB: V.norm(V.sub([H[0] + 4, 15, 0], pB)) };
}
function pike(u, o) {
  const R = RIGS["pike" + o.id] || (RIGS["pike" + o.id] = pikeRig(o.F, o.H)), J = {};
  const pelvis = V.add(o.F, V.mul(ang(lerpN(R.aT, R.aB, u)), 85.5)), d = V.norm(V.lerp(R.dT, R.dB, u));
  trunk(J, pelvis, d, [0, 0, 1], d);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [o.F[0], o.F[1], 10 * zz], [1, 0.2, 0], o.toe || [9, -5, 0]);
    arm(J, sd, [o.H[0], 1, 23 * zz], [-1, 0.5, 0.7 * zz]);
  }
  return { items: [...floor3(-100, 90, 40), ...(o.gear || []), ...body(J)], J };
}

// chair dip: hands on the front edge of the seat behind you, lower until the upper arms are about level
function chairDip(u, o) {
  const J = {}, chest = V.lerp([3, 105, 0], [9, 76, 0], u), d = sag(9);
  trunk(J, V.sub(chest, V.mul(d, 50)), d, [0, 0, 1], sag(2));
  for (const [sd, zz] of SIDES) {
    if (o.straight) leg(J, sd, [64, 5, 12 * zz], [0.3, 1, 0], [3, 11, 0]);
    else leg(J, sd, [52, 1, 12 * zz], [0.4, 1, 0]);
    arm(J, sd, [0, 46, 20 * zz], [-1, 0, 0.15 * zz]);
  }
  return { items: [...floor3(-60, 90, 40), ...chair(-38, 2, 44, 18, "x0"), ...body(J)], J };
}

// ======================= PULL =======================
// table row: lying under a sturdy table, hands on the edge, pull the chest up to the table; body stays straight
function tableRow(u, o) {
  const J = {}, P = o.knees ? [-30, 38, 0] : [-100, 4, 0], L = o.knees ? 94 : 136, G = o.knees ? [68, 73] : [44, 73];
  const b = rad(lerpN(o.knees ? -14.5 : 4.3, o.knees ? 6 : 25, u)), d = ang(b);
  const pelvis = V.add(P, V.mul(d, o.knees ? 44 : 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] + 0.25, 0]);
  for (const [sd, zz] of SIDES) {
    if (o.knees) leg(J, sd, [-50, 1, 11 * zz], [0, 1, 0], [-12, 0, 0]);
    else { const a = [P[0], P[1], 8 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [-4, 10, 0]); }
    arm(J, sd, [G[0], G[1], 22 * zz], [-0.3, -1, 0.6 * zz]);
  }
  return { items: [...floor3(-115, 120, 50), ...table(G[0] - 2, G[0] + 70, 75, 50), ...body(J)], J };
}

// prone towel pulldown: face down, towel held tight overhead, pull the elbows down to the ribs, reach back out
function towelPulldown(u) {
  const J = {}, k = hold(u, .1, .42, .6, .9);
  proneBody(J, 0.05);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd];
    const over = V.add(s, V.mul(V.norm([1, 0.2, 0.3 * zz]), 61.6)), pulled = V.add(s, [27, 12, 24 * zz]);
    arm(J, sd, V.lerp(over, pulled, k), [-0.6, 0.35, 1 * zz]);
  }
  return { items: [...floor3(-110, 110, 60), { type: "poly", pts: [[60, 1, -12], [84, 1, -12], [84, 1, 12], [60, 1, 12]], cls: "an3pad2", z: -999 }, ...body(J), L3(J.wriL, J.wriR, "an3rope")], J };
}

// backpack row: hinge forward, pack hangs from both hands, pull it to the lower ribs
function backpackRow(u) {
  const J = {}, lean = 58;
  trunk(J, [-18, 80, 0], sag(lean), [0, 0, 1], sag(lean - 20));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0.2 * zz]);
  const down = V.mul(sag(lean + 90), -1);                                   // toward the floor, from the chest
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], low = [s[0] + 2, s[1] - 58, 12 * zz];
    const e = V.add(V.add(s, V.mul(V.norm(V.sub(J.pelvis, J.chest)), 29)), [0, 9, -4 * zz]), top = V.add(e, [2, -29, 0]);
    arm(J, sd, V.lerp(low, top, u), [-0.6, 1, 0.3 * zz]);
  }
  const c = mid3(J.wriL, J.wriR);
  return { items: [...floor3(-60, 70, 40), ...body(J), ...backpack(V.add(c, [0, -3, 0])), L3(J.wriL, V.add(c, [0, -3, -10]), "an3rope"), L3(J.wriR, V.add(c, [0, -3, 10]), "an3rope")], J };
}

// pull-up negative: step up from a chair, start at the top, lower slowly (≈4 s), feet back on the chair, stand up
function negative(u) {
  const J = {}, by = 214;
  const up = tl(u, [[0, 0], [.08, 0], [.16, 1], [.2, 1], [.76, 0], [.84, 0], [1, 0]]);     // 0 = hang/stand height, 1 = chin over
  const onChair = 1 - seg(u, .14, .19) + seg(u, .82, .9), standK = seg(u, .88, 1) + (u < .14 ? 1 : 0) * (1 - seg(u, .08, .14));
  // chest height: standing on the chair 180, top 198, dead hang 156
  const hangY = 156, chestY = u < .16 ? lerpN(180, 198, seg(u, .08, .16)) : u < .82 ? lerpN(hangY, 198, up) : lerpN(hangY, 180, seg(u, .84, 1));
  trunk(J, [-2, chestY - 50, 0], sag(-3));
  const C = [-30, 44];
  for (const [sd, zz] of SIDES) {
    const free = V.add(J["hip" + sd], [-34, -62, 0]), onC = [C[0] + 18, C[1] + 1, 10 * zz];
    const feetDown = u < .16 ? 1 - seg(u, .1, .16) : u > .8 ? seg(u, .8, .88) : 0;
    leg(J, sd, V.lerp(free, onC, feetDown), [1, 0.1, 0], feetDown > .5 ? [12, 0, 0] : [6, -9, 0]);
    arm(J, sd, [0, by, 26 * zz], [0.2, -1, 1.2 * zz]);
  }
  return { items: [L3([0, by, -56], [0, by, 56], "an3col"), ...floor3(-80, 60, 40), ...chair(-34, 6, 44, 16, "x0"), ...body(J)], J };
}

// ======================= SHOULDERS / UPPER BACK =======================
// prone Y, T, W: face down, forehead on a towel, lift the arms a few cm, thumbs up
function proneBody(J, lift = 0, legLift = 0) {
  const d = V.norm([1, lift, 0]);
  trunk(J, [0, 9, 0], d, [0, 0, 1], [1, -0.35 + lift, 0]);
  for (const [sd, zz] of SIDES) {
    const a = V.add(J["hip" + sd], V.mul(V.norm([-1, legLift, 0.04 * zz]), 86));
    setLeg(J, sd, V.lerp(J["hip" + sd], a, 44 / 86), a, [-4, -8, 0]);
  }
}
function ytw(u, shape) {
  const J = {}, k = hold(u, .08, .3, .7, .92);
  proneBody(J, 0.04 * k);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], y = lerpN(-0.1, 0.3, k);
    if (shape === "W") {
      const e = V.add(s, V.mul(V.norm([-0.35, y, 0.95 * zz]), 32)); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(V.norm([1, y, 0.35 * zz]), 30));
    } else {
      const dir = shape === "Y" ? [0.8, y, 0.6 * zz] : [0.05, y, 1 * zz], n = V.norm(dir);
      J["elb" + sd] = V.add(s, V.mul(n, 32)); J["wri" + sd] = V.add(s, V.mul(n, 61));
    }
  }
  return { items: [...floor3(-110, 90, 70), { type: "poly", pts: [[60, 1, -12], [84, 1, -12], [84, 1, 12], [60, 1, 12]], cls: "an3pad2", z: -999 }, ...body(J)], J };
}

// wall slide: back, head and arms against the wall; slide from "goalpost" up into a Y
function wallSlide(u) {
  const J = {}, k = wave(u);
  trunk(J, [-6, 84, 0], sag(-3), [0, 0, 1], sag(0));
  for (const [sd, zz] of SIDES) leg(J, sd, [10, 1, 13 * zz], [1, 0, 0]);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], a = rad(lerpN(0, 52, k));                                     // upper arm angle up from sideways
    const e = V.add(s, [-5, 32 * Math.sin(a), 32 * Math.cos(a) * zz]);
    const f = rad(lerpN(90, 64, k)), w = V.add(e, [-1, 30 * Math.sin(f), 30 * Math.cos(f) * zz]);
    J["elb" + sd] = e; J["wri" + sd] = w;
  }
  return { items: [...floor3(-30, 60, 60), wallX(-14, 190, 60), ...body(J)], J };
}
const wave = (u, n = 1) => 0.5 - 0.5 * Math.cos(TAU * n * u);

// ======================= LEGS =======================
function squatPose(t, deep, armsFwd = true) {
  const J = {}, lean = lerpN(3, deep ? 32 : 28, t);
  trunk(J, V.lerp([0, 86, 0], deep ? [-28, 46, 0] : [-24, 52, 0], t), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [8, 1, 16 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]);
    if (armsFwd) arm(J, sd, V.add(J["sho" + sd], V.mul(V.norm(V.lerp([0.1, -1, 0.1 * zz], [1, 0.1, 0.12 * zz], t)), 58)), [-0.2, -1, 0.3 * zz]);
  }
  return J;
}
const pauseU = u => tl(u, [[0, 0], [.05, 0], [.25, 1], [.62, 1], [.8, 0], [1, 0]]);
const handsOnHips = J => { for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["hip" + sd], [1, 6, 8 * zz]), [-0.6, 0.1, 1 * zz]); };
function splitSq(t, bulgarian) {
  const J = {};
  if (bulgarian) {
    trunk(J, V.lerp([-6, 84, 0], [-12, 50, 0], t), sag(lerpN(4, 14, t)));
    leg(J, "R", [22, 1, 9], [1, 0, 0]);
    leg(J, "L", [-46, 47, -9], [0.4, -1, 0], [-9, -3, 0]);
  } else {
    trunk(J, V.lerp([-10, 82, 0], [-12, 54, 0], t), sag(lerpN(3, 8, t)));
    leg(J, "R", [24, 1, 9], [1, 0, 0]);
    leg(J, "L", [-44, 8, -9], [1, 0, 0], [10, -7, 0]);
  }
  handsOnHips(J);
  return J;
}

// ======================= BACK OF THE BODY =======================
function superman(u) {
  const J = {}, k = hold(u, .08, .28, .72, .9);
  proneBody(J, 0.1 * k, 0.12 * k);
  for (const [sd, zz] of SIDES) {
    const n = V.norm([1, lerpN(-0.06, 0.13, k), 0.22 * zz]);
    J["elb" + sd] = V.add(J["sho" + sd], V.mul(n, 32)); J["wri" + sd] = V.add(J["sho" + sd], V.mul(n, 61));
  }
  return { items: [...floor3(-110, 110, 50), ...body(J)], J };
}
// reverse hyper on the edge of a bed: chest on the bed, hips at the edge, lift straight legs up to body level
function reverseHyper(u) {
  const J = {}, k = wave(u), bedY = 50;
  trunk(J, [2, bedY + 7, 0], [1, 0, 0], [0, 0, 1], [1, -0.25, 0]);
  const a = rad(lerpN(-40, -2, k));
  for (const [sd, zz] of SIDES) {
    const dir = [-Math.cos(a), Math.sin(a), 0.02 * zz], ank = V.add(J["hip" + sd], V.mul(dir, 85));
    const kn = V.add(V.lerp(J["hip" + sd], ank, 44 / 85), [0, 0, 0]);
    setLeg(J, sd, kn, ank, V.mul(V.norm([-dir[1], -dir[0] * -1, 0]), -9));
    arm(J, sd, V.add(J["sho" + sd], [14, -10, 16 * zz]), [-1, -0.2, 0.5 * zz]);
    J["toe" + sd] = V.add(ank, V.mul(V.norm([Math.sin(a) * -1, -Math.cos(a), 0]), 9));
  }
  return { items: [...floor3(-80, 130, 46), box3(-2, 126, bedY, 46), { type: "poly", pts: [[-2, 0, 46], [-2, bedY, 46], [126, bedY, 46], [126, 0, 46]], cls: "an3bench", z: -998 }, ...body(J)], J };
}
// sliding leg curl: on the back, heels on socks or a towel on a smooth floor, hips up, slide the heels in and out
function legCurlFloor(u, ball) {
  const J = {}, k = wave(u), C = [44, 10, 0];
  const py = ball ? lerpN(38, 50, k) : lerpN(22, 42, k), pelvis = [C[0] - Math.sqrt(50 * 50 - (py - C[1]) ** 2), py, 0];
  trunk(J, pelvis, V.norm(V.sub(C, pelvis)), [0, 0, 1], [1, 0, 0]);
  const ax = ball ? lerpN(-84, -48, k) : lerpN(-90, -30, k), ay = ball ? 55 : 3;
  const items = [...floor3(-120, 90, 44)];
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [ax, ay, 9 * zz], [0, 1, 0], ball ? [2, 11, 0] : [3, 11, 0]);
    floorArm(J, sd, -52, 10 * zz);
    if (!ball) items.push(L3([ax - 7, 1, 9 * zz], [ax + 6, 1, 9 * zz], "an3pad"));
  }
  if (ball) items.push(D3([ax + 3, 27, 0], 27, "an3ball"));
  return { items: [...items, ...body(J)], J };
}

// ======================= ARMS =======================
// towel isometric curl: stand on the middle of a towel, curl up to 90° and pull hard – nothing moves
function towelCurl(u) {
  const J = {}, k = hold(u, .06, .22, .82, .95), shake = k > .99 ? 0.6 * Math.sin(u * 140) : 0;
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J, 12);
  const phi = lerpN(176, 88, k);
  const items = [...floor3(-40, 60, 34)];
  for (const [sd, zz] of SIDES) {
    const e = V.add(J["sho" + sd], [2, -32, 2 * zz]); J["elb" + sd] = e;
    J["wri" + sd] = V.add(e, V.add(V.mul(sag(phi), 30), [0, shake, 0]));
    const A = [4, 1, 6 * zz], taut = Math.hypot(30, 52), dd = V.len(V.sub(J["wri" + sd], A));
    items.push(...curve(A, J["wri" + sd], [Math.max(0, taut - dd) * 0.7, 0, 0], "an3rope"));
  }
  items.push(L3([-6, 1, -16], [16, 1, -16], "an3rope"), L3([-6, 1, 16], [16, 1, 16], "an3rope"), L3([4, 0.6, -16], [4, 0.6, 16], "an3pad"));
  return { items: [...items, ...body(J)], J };
}
// backpack curl: a strap in each hand, palms up, elbows still
function backpackCurl(u) {
  const J = {};
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const phi = lerpN(176, 36, u);
  for (const [sd, zz] of SIDES) { const e = V.add(J["sho" + sd], [2, -32, -3 * zz]); J["elb" + sd] = e; J["wri" + sd] = V.add(V.add(e, V.mul(sag(phi), 30)), [0, 0, -4 * zz]); }
  const c = mid3(J.wriL, J.wriR), top = V.add(c, [0, -10, 0]);
  return { items: [...floor3(-40, 60, 34), ...body(J), ...backpack(top), L3(J.wriL, V.add(top, [0, 0, -10]), "an3rope"), L3(J.wriR, V.add(top, [0, 0, 10]), "an3rope")], J };
}
function backpackRdl(u) {
  const J = {}, lean = lerpN(4, 68, u);
  trunk(J, V.lerp([0, 86, 0], [-24, 80, 0], u), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0]);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] + 2, s[1] - 59, 11 * zz], [-1, 0, 0]); }
  const c = mid3(J.wriL, J.wriR), top = V.add(c, [0, -8, 0]);
  return { items: [...floor3(-60, 70, 40), ...body(J), ...backpack(top), L3(J.wriL, V.add(top, [0, 0, -10]), "an3rope"), L3(J.wriR, V.add(top, [0, 0, 10]), "an3rope")], J };
}

// ======================= SAMPLES =======================
const PCAM = camera(-35, 16, 140, 186, 0.95);
const SAMPLES = {
  "pu-wall":  { cap: ["Hands on the wall, body in a line", "Chest toward the wall"], cam: camera(-32, 10, 112, 204, 0.84), dur: 2600,
    frame: u => pushLadder(u, PUSH.wall), cues: [{ when: "all", pt: J => J.pelvis, text: "Body in a line" }] },
  "pu-table": { cap: ["Hands on a heavy table", "Chest to the table edge"], cam: camera(-35, 14, 132, 196, 0.86), dur: 2600,
    frame: u => pushLadder(u, PUSH.table), cues: [{ when: "all", pt: J => J.pelvis, text: "Body in a line" }] },
  "pu-chair": { cap: ["Hands on a chair against the wall", "Chest to the seat edge"], cam: camera(-35, 16, 136, 190, 0.92), dur: 2600,
    frame: u => pushLadder(u, PUSH.chair), cues: [{ when: "all", pt: J => J.pelvis, text: "Body in a line" }] },
  "pu-knee":  { cap: ["On the knees, body in a line", "Chest toward the floor"], cam: camera(-35, 16, 132, 182, 1), dur: 2600,
    frame: u => pushLadder(u, PUSH.knees), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }, { when: "B", pt: J => J.elbR, text: "Elbows ~45°" }] },
  "pu-full":  { cap: ["Full push-up, body in a line", "Chest toward the floor"], cam: PCAM, dur: 2600,
    frame: u => pushLadder(u, PUSH.full), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }, { when: "B", pt: J => J.elbR, text: "Elbows ~45°" }] },
  "pu-feet":  { cap: ["Feet on a chair against the wall", "Chest toward the floor"], cam: camera(-35, 16, 146, 182, 0.9), dur: 2800,
    frame: u => pushLadder(u, PUSH.feet), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips in line" }] },
  "pu-slow":  { cap: ["3 seconds down", "1 second up"], cam: PCAM, dur: 5200, loop: true,
    frame: u => pushLadder(slowU(u), PUSH.full), cues: [{ when: "all", pt: J => J.pelvis, text: "Slow on the way down" }] },
  "pike-f":   { cap: ["Hips high, arms long", "Top of the head toward the floor"], cam: camera(-30, 12, 120, 196, 0.95), dur: 2800,
    frame: u => pike(u, { id: "f", F: [-50, 1, 0], H: [50, 1, 0] }), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips high" }, { when: "B", pt: J => J.head, text: "Head in front of the hands" }] },
  "pike-c":   { cap: ["Feet on a chair, hips over the shoulders", "Top of the head toward the floor"], cam: camera(-30, 12, 124, 196, 0.9), dur: 2800,
    frame: u => pike(u, { id: "c", F: [-56, 47, 0], H: [40, 1, 0], toe: [9, -4, 0], gear: chair(-80, -40, 44, 16, "x0") }), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips high" }] },
  "dip-b":    { cap: ["Hands on the seat edge, knees bent", "Lower until the upper arms are level"], cam: camera(-30, 10, 104, 204, 0.92), dur: 2600,
    frame: u => chairDip(u, {}), cues: [{ when: "all", pt: J => J.elbR, text: "Elbows point back" }, { when: "all", pt: J => J.pelvis, text: "Hips close to the chair" }] },
  "dip-s":    { cap: ["Legs straight, heels on the floor", "Lower until the upper arms are level"], cam: camera(-30, 10, 100, 204, 0.92), dur: 2600,
    frame: u => chairDip(u, { straight: true }), cues: [{ when: "all", pt: J => J.elbR, text: "Elbows point back" }] },
  "trow-k":   { cap: ["Under a heavy table, knees bent", "Pull the chest to the table edge"], cam: camera(-30, 3, 118, 186, 0.86), dur: 2600,
    frame: u => tableRow(u, { knees: true }), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips up, body straight" }] },
  "trow-s":   { cap: ["Legs straight, heels on the floor", "Pull the chest to the table edge"], cam: camera(-30, 3, 128, 186, 0.84), dur: 2600,
    frame: u => tableRow(u, { knees: false }), cues: [{ when: "all", pt: J => J.pelvis, text: "Body straight" }] },
  "tpull":    { cap: ["Face down, towel tight overhead", "Pull the elbows down to the ribs"], cam: camera(-62, 52, 126, 118, 0.9), dur: 3600, loop: true,
    frame: towelPulldown, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows to the ribs" }, { when: "all", pt: J => mid3(J.wriL, J.wriR), text: "Pull the towel apart" }] },
  "bprow":    { cap: ["Hinge forward, pack hanging", "Pull the pack to the lower ribs"], cam: camera(-26, 10, 112, 210, 0.9), dur: 2600,
    frame: backpackRow, cues: [{ when: "all", pt: J => J.chest, text: "Flat back" }, { when: "B", pt: J => J.elbR, text: "Elbows to the hips" }] },
  "neg":      { cap: ["Step up from a chair, chin over the bar", "Lower slowly – about 4 seconds"], cam: camera(-28, 8, 118, 214, 0.78), dur: 7200, loop: true,
    frame: negative, cues: [{ when: "all", pt: J => J.wriR, text: "Lower slowly" }] },
  "ytw-y":    { cap: ["Y – arms forward and out", "Lift a few cm, thumbs up, hold 2 s"], cam: camera(-62, 52, 126, 118, 0.9), dur: 4000, loop: true,
    frame: u => ytw(u, "Y"), cues: [{ when: "all", pt: J => J.wriR, text: "Thumbs up" }] },
  "ytw-t":    { cap: ["T – arms straight out to the sides", "Lift a few cm, squeeze the shoulder blades"], cam: camera(-62, 52, 126, 118, 0.9), dur: 4000, loop: true,
    frame: u => ytw(u, "T"), cues: [{ when: "all", pt: J => J.wriR, text: "Thumbs up" }] },
  "ytw-w":    { cap: ["W – elbows bent, pulled toward the ribs", "Lift a few cm, squeeze the shoulder blades"], cam: camera(-62, 52, 126, 118, 0.9), dur: 4000, loop: true,
    frame: u => ytw(u, "W"), cues: [{ when: "all", pt: J => J.elbR, text: "Elbows down and back" }] },
  "wslide":   { cap: ["Back, head and arms on the wall", "Slide up into a Y, then back down"], cam: camera(58, 10, 120, 208, 0.9), dur: 3600, loop: true,
    frame: wallSlide, cues: [{ when: "all", pt: J => J.wriR, text: "Hands stay on the wall" }, { when: "all", pt: J => J.pelvis, text: "Lower back on the wall" }] },
  "sq-box":   { cap: ["Sit back to the chair", "Touch lightly, stand up"], cam: camera(-30, 10, 118, 210, 0.86), dur: 2600,
    frame: u => ({ items: [...floor3(-70, 60, 44), ...chair(-46, -8, 44, 16, "x0"), ...body(squatPose(u, false))], J: squatPose(u, false) }),
    cues: [{ when: "all", pt: J => J.kneR, text: "Knees follow the toes" }] },
  "sq-full":  { cap: ["Full squat", "Thighs at least level with the floor"], cam: camera(-30, 10, 118, 210, 0.86), dur: 2600,
    frame: u => ({ items: [...floor3(-60, 60, 44), ...body(squatPose(u, true))], J: squatPose(u, true) }), cues: [{ when: "all", pt: J => J.kneR, text: "Knees follow the toes" }] },
  "sq-pause": { cap: ["Down in 1 second", "Hold 2 seconds at the bottom, stand up"], cam: camera(-30, 10, 118, 210, 0.86), dur: 5000, loop: true,
    frame: u => { const J = squatPose(pauseU(u), true); return { items: [...floor3(-60, 60, 44), ...body(J)], J }; }, cues: [{ when: "all", pt: J => J.pelvis, text: "Pause at the bottom" }] },
  "sq-split": { cap: ["Split stance, back heel up", "Back knee toward the floor"], cam: camera(-30, 10, 112, 212, 0.86), dur: 2600,
    frame: u => { const J = splitSq(u, false); return { items: [...floor3(-70, 60, 44), ...body(J)], J }; }, cues: [{ when: "all", pt: J => J.kneL, text: "Straight down" }] },
  "sq-bulg":  { cap: ["Back foot on a chair", "Back knee toward the floor"], cam: camera(-30, 10, 116, 212, 0.86), dur: 2800,
    frame: u => { const J = splitSq(u, true); return { items: [...floor3(-90, 60, 44), ...chair(-72, -34, 44, 16, "x0"), ...body(J)], J }; }, cues: [{ when: "all", pt: J => J.kneR, text: "Front knee over the foot" }] },
  "super":    { cap: ["Face down, arms overhead", "Lift arms and legs a few cm, hold 2 s"], cam: camera(-40, 26, 120, 160, 0.9), dur: 4200, loop: true,
    frame: superman, cues: [{ when: "all", pt: J => J.head, text: "Look at the floor" }] },
  "rhyp":     { cap: ["Chest on the bed, hips at the edge", "Lift straight legs to body height – no higher"], cam: camera(-26, 14, 104, 196, 0.84), dur: 3200, loop: true,
    frame: reverseHyper, cues: [{ when: "all", pt: J => J.ankR, text: "Stop at body height" }] },
  "slide":    { cap: ["Hips up, heels on socks or a towel", "Slide the heels in, then out slowly"], cam: camera(-30, 14, 132, 190, 0.92), dur: 3600, loop: true,
    frame: u => legCurlFloor(u, false), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay up" }] },
  "ball":     { cap: ["Heels on the ball, hips up", "Roll the ball in, then out slowly"], cam: camera(-30, 14, 132, 190, 0.92), dur: 3600, loop: true,
    frame: u => legCurlFloor(u, true), cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay up" }] },
  "tcurl":    { cap: ["Stand on the towel, curl up to 90°", "Pull up hard for 10–20 s"], cam: camera(-26, 8, 112, 210, 0.92), dur: 5200, loop: true,
    frame: towelCurl, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows at the sides" }] },
  "bpcurl":   { cap: ["A strap in each hand, palms up", "Curl up, elbows still"], cam: camera(-26, 8, 112, 210, 0.92), dur: 2600,
    frame: backpackCurl, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows still" }] },
  "bprdl":    { cap: ["Stand tall, pack in front", "Push the hips back, flat back"], cam: camera(-28, 10, 112, 210, 0.9), dur: 2800,
    frame: backpackRdl, cues: [{ when: "all", pt: J => J.chest, text: "Flat back" }, { when: "B", pt: J => J.pelvis, text: "Hips back" }] }
};

const CARDS = [
  { section: "Push" },
  { title: "Push-up ladder", fam: "Chest · 7 steps, easiest first", keys: [["Wall", "pu-wall"], ["Table", "pu-table"], ["Chair", "pu-chair"], ["Knees", "pu-knee"], ["Full", "pu-full"], ["Feet on chair", "pu-feet"], ["Slow lowering", "pu-slow"]] },
  { title: "Pike push-up", fam: "Shoulders · replaces the shoulder press", keys: [["Feet on floor", "pike-f"], ["Feet on chair", "pike-c"]] },
  { title: "Chair dip", fam: "Triceps · not with shoulders on \"go easy\"", keys: [["Knees bent", "dip-b"], ["Legs straight", "dip-s"]] },
  { section: "Pull" },
  { title: "Table row", fam: "Back · replaces the cable row and pulldown", keys: [["Knees bent", "trow-k"], ["Legs straight", "trow-s"]] },
  { title: "Prone towel pulldown", fam: "Back · replaces the lat pulldown when there's no table or bar", keys: [["Towel pulldown", "tpull"]] },
  { title: "Backpack row", fam: "Back · fill the pack with books or bottles", keys: [["Backpack row", "bprow"]] },
  { title: "Pull-up negative", fam: "Back · needs a pull-up bar", keys: [["Negative", "neg"]] },
  { section: "Shoulders and upper back" },
  { title: "Prone Y-T-W raises", fam: "Upper back · replaces face pull and rear-delt fly", keys: [["Y", "ytw-y"], ["T", "ytw-t"], ["W", "ytw-w"]] },
  { title: "Wall slide", fam: "Shoulders · posture and shoulder health", keys: [["Wall slide", "wslide"]] },
  { section: "Legs" },
  { title: "Squat ladder", fam: "Legs · 5 steps, easiest first", keys: [["To a chair", "sq-box"], ["Full", "sq-full"], ["Pause", "sq-pause"], ["Split squat", "sq-split"], ["Back foot on chair", "sq-bulg"]] },
  { section: "Back of the body" },
  { title: "Prone superman", fam: "Lower back · replaces the back extension", keys: [["Superman", "super"]] },
  { title: "Reverse hyper on a bed", fam: "Lower back and glutes · replaces the back extension", keys: [["Reverse hyper", "rhyp"]] },
  { title: "Sliding leg curl", fam: "Hamstrings · needs a smooth floor", keys: [["Sliding", "slide"]] },
  { title: "Stability-ball leg curl", fam: "Hamstrings · needs a stability ball", keys: [["Ball curl", "ball"]] },
  { section: "Arms and hinge with a backpack or towel" },
  { title: "Towel isometric curl", fam: "Biceps · holds instead of reps", keys: [["Towel curl", "tcurl"]] },
  { title: "Backpack curl and RDL", fam: "Biceps / hamstrings and glutes · fill the pack", keys: [["Curl", "bpcurl"], ["Romanian deadlift", "bprdl"]] }
];

const GUIDES = {
  "Push-up ladder": {
    steps: ["Place the hands a bit wider than the shoulders on the wall, table, chair or floor.", "Walk the feet back until the body is one straight line from head to heels (or knees).", "Lower the chest toward the hands, elbows about 45° from the body.", "Push back up until the arms are long."],
    levels: ["Wall.", "Hands on a heavy table.", "Hands on a sturdy chair pushed against the wall.", "On the knees.", "Full push-up.", "Feet on a chair.", "Full push-up, 3 seconds down."],
    avoid: ["Hips sagging or sticking up.", "Elbows flaring straight out to the sides.", "Using a chair or table that can slide or tip."],
    tip: "When you reach the top of the rep range with reps to spare, the app moves you one step up the ladder."
  },
  "Pike push-up": {
    steps: ["Start in a push-up, then walk the feet in and lift the hips high – the body forms an upside-down V.", "Hands a bit wider than the shoulders, arms long.", "Bend the elbows and lower the top of the head toward the floor, just in front of the hands.", "Push back up to long arms."],
    levels: ["Feet on the floor.", "Feet on a chair pushed against the wall – hips over the shoulders."],
    avoid: ["Letting the hips drop – that turns it into a push-up.", "Elbows flaring straight out.", "Landing on the head – stop a few cm above the floor."],
    tip: "Bend the knees slightly if the backs of the legs are tight."
  },
  "Chair dip": {
    steps: ["Sit on the front edge of a sturdy chair pushed against the wall, hands on the edge beside the hips.", "Slide the hips forward off the seat, arms long.", "Bend the elbows straight back and lower until the upper arms are about level with the floor.", "Press back up."],
    levels: ["Knees bent, feet close.", "Legs straight, heels on the floor."],
    avoid: ["Going deeper than upper arms level – it strains the front of the shoulders.", "Elbows flaring out to the sides.", "Shoulders creeping up to the ears."],
    tip: "Keep the hips close to the chair the whole way. Not used if you chose \"go easy on shoulders\" – you get close-grip push-ups instead."
  },
  "Table row": {
    steps: ["Lie on your back under a heavy, stable table, chest under the edge.", "Hold the edge with both hands, shoulder-width apart.", "Lift the hips so the body is straight, then pull the chest up to the table.", "Lower slowly to long arms."],
    levels: ["Knees bent, feet flat.", "Legs straight, heels on the floor."],
    avoid: ["Light or folding tables, or tables with a loose top – test it first.", "Hips sagging.", "Jerking up with the legs."],
    tip: "Feet further forward = harder. Test the table first by leaning on the edge with your full weight."
  },
  "Prone towel pulldown": {
    steps: ["Lie face down, forehead on a folded towel, arms overhead holding a towel at both ends.", "Pull the towel apart hard so it stays tight, and lift the arms a few cm off the floor.", "Pull the elbows down and back toward the ribs, squeezing the shoulder blades together.", "Reach back out overhead, still pulling the towel apart. Keep the arms off the floor the whole set."],
    avoid: ["Letting the towel go slack.", "Arching the lower back to lift higher.", "Shrugging the shoulders up to the ears."],
    tip: "Pause for a second with the elbows at the ribs. No anchor or furniture needed – safe in any room."
  },
  "Backpack row": {
    steps: ["Fill a backpack with books or water bottles and hold a strap in each hand.", "Soften the knees and hinge forward with a flat back until the chest points at the floor.", "Pull the pack up toward the lower ribs, elbows back toward the hips.", "Lower slowly to long arms."],
    avoid: ["Rounding the back.", "Standing up as you pull.", "Swinging the pack."],
    tip: "Add more books as you get stronger – weigh the pack once so the app can track it."
  },
  "Pull-up negative": {
    steps: ["Put a sturdy chair under a pull-up bar.", "Step up and hold the bar, hands a bit wider than the shoulders. Step or jump so the chin is over the bar.", "Take the feet off the chair and lower yourself slowly – about 4 seconds – to long arms.", "Put the feet back on the chair and step up for the next rep."],
    avoid: ["Dropping through the last part.", "A chair that can tip or a bar that isn't fixed properly.", "Jumping down from the bar."],
    tip: "When 5 slow negatives feel easy, try one full pull-up at the start of the set."
  },
  "Prone Y-T-W raises": {
    steps: ["Lie face down, forehead on a folded towel.", "Put the arms in a Y (forward and out), a T (straight out) or a W (elbows bent toward the ribs).", "Squeeze the shoulder blades together and lift the arms a few cm off the floor, thumbs up.", "Hold for 2 seconds, then lower."],
    levels: ["Y.", "T.", "W.", "All three in a row = one rep."],
    avoid: ["Arching the lower back to lift higher.", "Shrugging the shoulders up to the ears.", "Rushing."],
    tip: "Small lifts are fine – feel it between the shoulder blades."
  },
  "Wall slide": {
    steps: ["Stand with the back, head and backside against a wall, heels a foot away.", "Put the arms up like a goalpost, backs of the elbows and hands on the wall.", "Slide the arms up into a Y, keeping them on the wall.", "Slide back down to the goalpost."],
    avoid: ["The lower back arching off the wall.", "Hands or elbows leaving the wall – only go as high as you can keep contact.", "Shrugging."],
    tip: "A good warm-up before pushing exercises."
  },
  "Squat ladder": {
    steps: ["Feet about shoulder-width, toes slightly out.", "Push the hips back and bend the knees, arms forward for balance.", "Go as deep as the step says, heels down and back straight.", "Stand up by pushing the floor away."],
    levels: ["Sit back to a chair and touch it lightly.", "Full squat, thighs at least level with the floor.", "Pause squat – hold 2 seconds at the bottom.", "Split squat – one foot forward, back heel up.", "Back foot on a chair (Bulgarian split squat)."],
    avoid: ["Knees caving inward.", "Heels lifting.", "Dropping fast to the bottom."],
    knee: "With \"go easy on knees\" the ladder stops at the pause squat and you only go as deep as feels fine.",
    tip: "Hands on the hips for the split-squat steps – hold on to a wall if balance is what stops you."
  },
  "Prone superman": {
    steps: ["Lie face down, arms overhead, legs straight.", "Squeeze the glutes.", "Lift the arms, chest and legs a few cm off the floor.", "Hold for 2 seconds, then lower."],
    levels: ["Arms only.", "Legs only.", "Arms and legs together."],
    avoid: ["Lifting as high as you can – a few cm is enough.", "Throwing the head back – look at the floor.", "Holding your breath."],
    tip: "Easier option: lift the opposite arm and leg, one pair at a time."
  },
  "Reverse hyper on a bed": {
    steps: ["Lie face down on a firm bed with the hips at the edge, legs hanging down.", "Hold on to the sides of the mattress.", "Squeeze the glutes and lift straight legs until they're level with the body.", "Lower slowly."],
    avoid: ["Lifting the legs above body level – it pinches the lower back.", "Swinging the legs up.", "A soft bed where the hips sink."],
    tip: "Pause for a second at the top for more glute work."
  },
  "Sliding leg curl": {
    steps: ["Lie on your back on a smooth floor, heels on socks or a small towel.", "Lift the hips into a bridge.", "Slide the heels in toward the backside, keeping the hips up.", "Slide them out slowly to almost straight, then repeat."],
    avoid: ["Hips dropping as the heels slide out.", "Rugs or carpets – the heels must glide.", "Going so fast that you lose control on the way out."],
    tip: "Too hard? Slide in with both legs and out with one, or go only part of the way."
  },
  "Stability-ball leg curl": {
    steps: ["Lie on your back with the heels on top of a stability ball.", "Lift the hips so the body is straight from shoulders to heels.", "Roll the ball in toward the backside, keeping the hips up.", "Roll it out slowly."],
    avoid: ["Hips dropping.", "Arching the lower back at the top.", "Letting the ball roll to the side – arms on the floor help with balance."],
    tip: "Harder: one leg on the ball, the other in the air."
  },
  "Towel isometric curl": {
    steps: ["Stand on the middle of a towel, feet hip-width.", "Hold one end in each hand, palms up, elbows at the sides.", "Curl up to 90° at the elbows so the towel is tight.", "Pull up hard for 10–20 seconds – nothing moves. Rest and repeat."],
    avoid: ["Leaning back.", "Holding your breath – breathe calmly through the hold.", "Elbows drifting forward."],
    tip: "Holds instead of reps: the app counts seconds and asks how hard the last hold felt."
  },
  "Backpack curl and RDL": {
    steps: ["Curl: hold a strap in each hand, palms up, elbows at the sides. Curl the pack up and lower slowly.", "RDL: stand tall, pack in front. Push the hips back with a flat back and soft knees, pack close to the legs.", "Stop when you feel a stretch in the back of the thighs, then stand up by squeezing the glutes."],
    avoid: ["Curl: swinging the body.", "RDL: rounding the back.", "RDL: bending the knees into a squat."],
    tip: "Weigh the packed backpack on a bathroom scale once so the app can track the weight."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W5b", "Home \u2013 dumbbells on the floor", () => {
// ---- Wave 5b samples: dumbbells at home, no bench or machine.
const hold = (u, a = .1, b = .3, c = .8, d = .95) => seg(u, a, b) * (1 - seg(u, c, d));
const setLeg = (J, sd, kne, ank, toe) => { J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, toe); };

// on the back on the floor, knees bent, feet flat; head toward +x
function supine(J) {
  trunk(J, [0, 9, 0], [1, 0, 0], [0, 0, 1], [1, 0, 0]);
  for (const [sd, zz] of SIDES) leg(J, sd, [-44, 1, 15 * zz], [0, 1, 0], [-12, 0, 0]);
}
// place an arm from directions (upper arm, forearm) so the lengths stay exact
function armDir(J, sd, ua, fa) { const e = V.add(J["sho" + sd], V.mul(V.norm(ua), 32)); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(V.norm(fa), 30)); }

// DB floor press: elbows stop on the floor at about 45°, brief pause, press up over the shoulders
function floorPress(u) {
  const J = {}; supine(J);
  for (const [sd, zz] of SIDES) armDir(J, sd, V.lerp([0, 1, -0.02 * zz], [-0.45, -0.19, 0.87 * zz], u), V.lerp([0, 1, -0.02 * zz], [0.12, 1, 0], u));
  return { items: [...floor3(-80, 90, 46), ...body(J), ...db3(J.wriL, [0, 0, 1]), ...db3(J.wriR, [0, 0, 1])], J };
}
// DB floor fly: soft elbows, arms open wide until the upper arms touch the floor
function floorFly(u) {
  const J = {}; supine(J);
  for (const [sd, zz] of SIDES) armDir(J, sd, V.lerp([0, 1, 0.08 * zz], [0, -0.17, 1 * zz], u), V.lerp([0, 1, -0.38 * zz], [0, 0.35, 1 * zz], u));
  return { items: [...floor3(-80, 90, 60), ...body(J), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
}
// lying DB hamstring curl: face down, a dumbbell held between the feet, curl the heels up, lower slowly
function lyingCurl(u) {
  const J = {}, a = rad(lerpN(4, 82, u));
  trunk(J, [0, 9, 0], [1, 0, 0], [0, 0, 1], [1, -0.45, 0]);
  for (const [sd, zz] of SIDES) {
    const kn = V.add(J["hip" + sd], [-44, -4, 0]), an = V.add(kn, [-42 * Math.cos(a), 42 * Math.sin(a), -3 * zz]);
    setLeg(J, sd, kn, an, V.mul(V.norm([-Math.sin(a), -Math.cos(a), 0]), 10));
    armDir(J, sd, [0.25, -0.17, 0.95 * zz], [0.85, 0, -0.55 * zz]);
  }
  const m = mid3(J.ankL, J.ankR), up = [-Math.sin(a), -Math.cos(a), 0];                  // along the soles
  const c = V.add(m, V.mul(up, 6));
  return { items: [...floor3(-110, 90, 46), ...body(J), L3(V.add(c, V.mul(up, -9)), V.add(c, V.mul(up, 9)), "an3db"), D3(V.add(c, V.mul(up, 9)), 6, "an3plate"), D3(V.add(c, V.mul(up, -9)), 6, "an3plate")], J };
}
// hip thrust on a sofa (upper back on the seat edge) or glute bridge on the floor, dumbbell across the hips
function sofaThrust(u) {
  const J = {}, S = [-8, 44, 0], a = rad(lerpN(38, -2, u)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], V.add(V.norm(V.sub(S, pelvis)), [0, 0.7, 0]));
  for (const [sd, zz] of SIDES) { leg(J, sd, [84, 1, 14 * zz], [0, 1, 0]); arm(J, sd, V.add(pelvis, [2, 10, 10 * zz]), [0, 1, 0.6 * zz]); }
  const sofa = [box3(-80, -8, 42, 40, "an3pad2"), { type: "poly", pts: [[-8, 0, -40], [-8, 42, -40], [-8, 42, 40], [-8, 0, 40]], cls: "an3pad2", z: -998 },
    { type: "poly", pts: [[-80, 42, -40], [-80, 84, -40], [-80, 84, 40], [-80, 42, 40]], cls: "an3pad2", z: -999 }];
  return { items: [...floor3(-90, 110, 44), ...sofa, ...body(J), ...db3(V.add(pelvis, [2, 12, 0]), [0, 0, 1], 11)], J };
}
function floorBridge(u) {
  const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, u)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  for (const [sd, zz] of SIDES) { leg(J, sd, [46, 1, 14 * zz], [0, 1, 0]); arm(J, sd, V.add(pelvis, [2, 10, 10 * zz]), [0, 1, 0.6 * zz]); }
  return { items: [...floor3(-80, 80, 40), ...body(J), ...db3(V.add(pelvis, [2, 12, 0]), [0, 0, 1], 11)], J };
}

const SAMPLES = {
  "fpress": { cap: ["Top: dumbbells over the shoulders", "Bottom: elbows touch the floor, pause"], cam: camera(-30, 24, 112, 150, 1), dur: 2800,
    frame: floorPress, cues: [{ when: "B", pt: J => J.elbR, text: "Elbows ~45°, pause" }, { when: "all", pt: J => J.kneR, text: "Knees bent" }] },
  "ffly":   { cap: ["Top: dumbbells together over the chest", "Bottom: upper arms touch the floor"], cam: camera(-58, 30, 118, 150, 0.95), dur: 3000,
    frame: floorFly, cues: [{ when: "all", pt: J => J.elbR, text: "Soft, fixed elbows" }] },
  "lcurl":  { cap: ["Face down, dumbbell between the feet", "Curl the heels up, lower slowly"], cam: camera(-24, 16, 132, 176, 0.95), dur: 3000,
    frame: lyingCurl, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips on the floor" }, { when: "all", pt: J => mid3(J.ankL, J.ankR), text: "Squeeze the dumbbell" }] },
  "sofa":   { cap: ["Upper back on the sofa edge", "Hips up: flat from shoulders to knees"], cam: camera(-18, 10, 108, 190, 1), dur: 2800,
    frame: sofaThrust, cues: [{ when: "B", pt: J => mid3(J.kneR, J.ankR), text: "Shins vertical" }, { when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }] },
  "fbridge": { cap: ["On the floor, dumbbell on the hips", "Hips up: straight from shoulders to knees"], cam: camera(-20, 16, 118, 170, 1.1), dur: 2800,
    frame: floorBridge, cues: [{ when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }, { when: "all", pt: J => J.ankR, text: "Push through the heels" }] }
};

const CARDS = [
  { title: "Dumbbell floor press", fam: "Chest · replaces the bench press without a bench", keys: [["Floor press", "fpress"]] },
  { title: "Dumbbell floor fly", fam: "Chest · replaces the cable / bench fly", keys: [["Floor fly", "ffly"]] },
  { title: "Lying dumbbell hamstring curl", fam: "Hamstrings · replaces the leg-curl machine", keys: [["Lying curl", "lcurl"]] },
  { title: "Dumbbell hip thrust at home", fam: "Glutes · replaces the barbell hip thrust", keys: [["On the floor", "fbridge"], ["On a sofa", "sofa"]] }
];

const GUIDES = {
  "Dumbbell floor press": {
    steps: ["Sit on the floor with a dumbbell on each thigh, then lie back with the knees bent and feet flat, bringing the dumbbells to the chest.", "Press the dumbbells up over the shoulders.", "Lower until the upper arms touch the floor, elbows about 45° from the body. Pause for a moment.", "Press back up without bouncing the elbows off the floor."],
    avoid: ["Dropping the elbows onto the floor.", "Elbows flaring straight out to the sides.", "Arching the back off the floor."],
    tip: "The floor stops the elbows a little early, which is easy on the shoulders. Weights go up in 0.5 kg steps up to your heaviest dumbbell, then the app adds a pause or slower lowering."
  },
  "Dumbbell floor fly": {
    steps: ["Lie on your back, knees bent, dumbbells together over the chest, palms facing each other.", "Soften the elbows and keep that bend the whole time.", "Open the arms wide in an arc until the upper arms touch the floor.", "Bring the dumbbells back together over the chest, squeezing the chest."],
    avoid: ["Bending and straightening the elbows – that turns it into a press.", "Dropping the arms fast onto the floor.", "Going heavy – this is a lighter exercise than the press."],
    tip: "Think \"hug a big tree\"."
  },
  "Lying dumbbell hamstring curl": {
    steps: ["Lie face down, forehead on your hands.", "Hold a light dumbbell upright between the feet – get someone to place it, or roll it in with the feet.", "Squeeze the feet together and curl the heels up toward the backside.", "Lower slowly until the legs are almost straight."],
    avoid: ["Going heavy – the dumbbell can slip.", "Hips lifting off the floor.", "Letting the legs drop on the way down."],
    tip: "Start very light. If the dumbbell feels unsafe, use the sliding leg curl (W5-13) instead."
  },
  "Dumbbell hip thrust at home": {
    steps: ["Sofa: sit on the floor with the upper back against the front edge of a sofa that doesn't slide. Floor: lie on your back, knees bent.", "Place a dumbbell across the hips and hold it with both hands.", "Feet flat, about hip-width. Push through the heels and lift the hips.", "At the top: straight line from shoulders to knees, squeeze the glutes, then lower."],
    levels: ["On the floor (glute bridge).", "Upper back on a sofa (hip thrust)."],
    avoid: ["Arching the lower back at the top.", "Knees caving in.", "A sofa that slides – put its back against a wall."],
    tip: "A folded towel under the dumbbell makes it more comfortable on the hips."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("W5c", "Home \u2013 bands and suspension trainer", () => {
// ---- Wave 5c samples: long band (door anchor or under the feet), mini band, suspension trainer.
const band = (a, b) => L3(a, b, "an3band");
const door = (x, w = 36) => ({ type: "poly", pts: [[x, 0, -w], [x, 200, -w], [x, 200, w], [x, 0, w]], cls: "an3door", z: -999 });
const doorZ = (z, x0 = -36, x1 = 36) => ({ type: "poly", pts: [[x0, 0, z], [x0, 200, z], [x1, 200, z], [x1, 0, z]], cls: "an3door", z: -999 });
const knot = p => D3(p, 3.5, "an3grip");
const bandTo = (A, J) => [band(A, J.wriL), band(A, J.wriR), knot(A)];
const underFeet = J => [band(V.add(J.ankL, [5, -1, 0]), J.wriL), band(V.add(J.ankR, [5, -1, 0]), J.wriR)];
function splitStance(J) { leg(J, "L", [22, 1, -11], [1, 0, 0]); leg(J, "R", [-22, 1, 11], [1, 0, 0], [11, -4, 0]); }

// ======================= DOOR ANCHOR =======================
// chest press / fly: anchor behind at chest height, facing away, split stance
function bandPress(u, fly) {
  const J = {}, A = [-62, 128, 0];
  trunk(J, [0, 86, 0], sag(6)); splitStance(J);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd];
    if (fly) { const t = rad(lerpN(8, 84, u)); arm(J, sd, V.add(s, V.mul(V.norm([Math.sin(t), -0.1, (Math.cos(t) - 0.28 * Math.sin(t)) * zz]), 58)), [-0.5, -1, 0.1 * zz]); }
    else arm(J, sd, V.lerp(V.add(s, [8, -10, 5 * zz]), V.add(J.chest, [58, -6, 10 * zz]), u), [-1, -0.6, 0.8 * zz]);
  }
  return { items: [...floor3(-70, 80, 40), door(-64), ...body(J), ...bandTo(A, J)], J };
}
// row: anchor in front at chest height, pull the hands to the ribs
function bandRow(u) {
  const J = {}, A = [76, 112, 0];
  trunk(J, [-4, 84, 0], sag(-3)); standLegs(J, 13, [1, 0, 0]);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.lerp(V.add(s, [59, -14, -5 * zz]), V.add(s, [4, -30, 3 * zz]), u), [-1, 0, 0.5 * zz]); }
  return { items: [...floor3(-60, 90, 40), door(78), ...body(J), ...bandTo(A, J)], J };
}
// pulldown: anchor at the top of the door, tall kneeling, pull to the upper chest
function bandPulldown(u) {
  const J = {}, A = [52, 198, 0];
  trunk(J, [0, 47, 0], sag(-8), [0, 0, 1], sag(-4));
  for (const [sd, zz] of SIDES) setLeg(J, sd, [2, 3, 10 * zz], [-40, 4, 10 * zz], [-6, -8, 0]);
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], up = V.add(s, V.mul(V.norm(V.add(V.sub(A, s), [0, 0, 22 * zz])), 60));
    arm(J, sd, V.lerp(up, V.add(s, [12, -14, 8 * zz]), u), [-0.4, -1, 0.9 * zz]);
  }
  return { items: [...floor3(-60, 80, 40), door(54), ...body(J), ...bandTo(A, J)], J };
}
// face pull: anchor at face height, pull to the face, elbows high and wide
function bandFacePull(u) {
  const J = {}, A = [76, 150, 0];
  trunk(J, [-4, 84, 0], sag(-3)); standLegs(J, 13, [1, 0, 0]);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.lerp(V.add(s, [59, 8, -8 * zz]), V.add(s, [8, 20, 16 * zz]), u), [-0.4, 0.4, 1 * zz]); }
  return { items: [...floor3(-60, 90, 40), door(78), ...body(J), ...bandTo(A, J)], J };
}
// Pallof press: anchor to the side at chest height, press straight out, don't let the band turn you
function bandPallof(u) {
  const J = {}, A = [0, 116, -84];
  trunk(J, [0, 84, 0], sag(2)); standLegs(J, 17, [1, 0, 0.2]);
  const h = V.lerp(V.add(J.chest, [12, -20, 0]), V.add(J.chest, [58, -18, 0]), u);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(h, [0, 0, 2 * zz]), [-0.6, -1, 0.5 * zz]);
  return { items: [...floor3(-60, 80, 90), doorZ(-86), ...body(J), band(A, h), knot(A)], J };
}
// pushdown: anchor high in front, elbows pinned to the sides, push the hands to the thighs
function bandPushdown(u) {
  const J = {}, A = [64, 196, 0];
  trunk(J, [-2, 85, 0], sag(8)); standLegs(J, 13, [1, 0, 0]);
  const phi = lerpN(48, 172, u);
  for (const [sd, zz] of SIDES) { const e = V.add(J["sho" + sd], [3, -32, 2 * zz]); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(phi), 30)); }
  return { items: [...floor3(-60, 90, 40), door(66), ...body(J), ...bandTo(A, J)], J };
}
// leg curl: anchor low in the door behind the feet, band round the ankles, face down, curl
function bandLegCurl(u) {
  const J = {}, a = rad(lerpN(4, 82, u)), A = [-150, 8, 0];
  trunk(J, [0, 9, 0], [1, 0, 0], [0, 0, 1], [1, -0.45, 0]);
  for (const [sd, zz] of SIDES) {
    const kn = V.add(J["hip" + sd], [-44, -4, 0]), an = V.add(kn, [-42 * Math.cos(a), 42 * Math.sin(a), -3 * zz]);
    setLeg(J, sd, kn, an, V.mul(V.norm([-Math.sin(a), -Math.cos(a), 0]), 10));
    armDir(J, sd, [0.25, -0.17, 0.95 * zz], [0.85, 0, -0.55 * zz]);
  }
  const m = mid3(J.ankL, J.ankR);
  return { items: [...floor3(-150, 90, 46), door(-152), ...body(J), band(A, m), band(V.add(J.ankL, [0, 0, -2]), V.add(J.ankR, [0, 0, 2])), knot(A)], J };
}

// ======================= STAND ON THE BAND =======================
function bandOverhead(u) {
  const J = {}; trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J, 12);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.lerp(V.add(s, [8, 2, 5 * zz]), V.add(s, [2, 60, -3 * zz]), u), [0.3, -1, 1 * zz]); }
  return { items: [...floor3(-40, 60, 40), ...body(J), ...underFeet(J)], J };
}
function bandLateral(u) {
  const J = {}; trunk(J, [0, 86, 0], sag(3)); standLegs(J, 12);
  for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.add(s, V.mul(V.norm(V.lerp([0.12, -1, 0.15 * zz], [0.15, 0.02, 1 * zz], u)), 58)), [-0.3, -0.4, 0.1 * zz]); }
  return { items: [...floor3(-40, 60, 50), ...body(J), ...underFeet(J)], J };
}
function bandCurl(u) {
  const J = {}; trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J, 12);
  const phi = lerpN(176, 34, u);
  for (const [sd, zz] of SIDES) { const e = V.add(J["sho" + sd], [2, -32, 1 * zz]); J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(phi), 30)); }
  return { items: [...floor3(-40, 60, 34), ...body(J), ...underFeet(J)], J };
}
// good-morning: band under the feet and round the back of the shoulders, hinge with a flat back
function bandGoodMorning(u) {
  const J = {}, lean = lerpN(4, 62, u);
  trunk(J, V.lerp([0, 86, 0], [-22, 81, 0], u), sag(lean), [0, 0, 1], sag(lean - 25));
  for (const [sd, zz] of SIDES) leg(J, sd, [0, 1, 14 * zz], [1, 0, 0]);
  const back = V.mul(sag(lean + 90), -1);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["sho" + sd], V.add(V.mul(sag(lean + 90), 6), V.add(V.mul(sag(lean), -8), [0, 0, 6 * zz]))), [-0.5, -1, 0.6 * zz]);
  const items = [...floor3(-60, 70, 40), ...body(J)];
  for (const [sd, zz] of SIDES) { const top = V.add(J["sho" + sd], V.add(V.mul(back, 4), [0, 0, 3 * zz])); items.push(band(V.add(J["ank" + sd], [5, -1, 0]), top)); }
  items.push(band(V.add(J.shoL, V.mul(back, 4)), V.add(J.shoR, V.mul(back, 4))));
  return { items, J };
}
// glute bridge with the band over the hips, ends held down by the hands
function bandBridge(u) {
  const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, u)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  for (const [sd, zz] of SIDES) { leg(J, sd, [46, 1, 14 * zz], [0, 1, 0]); arm(J, sd, [4, 3, 30 * zz], [0, 1, 0.3 * zz]); }
  const tL = V.add(pelvis, [0, 7, -11]), tR = V.add(pelvis, [0, 7, 11]);
  return { items: [...floor3(-80, 80, 44), ...body(J), band(J.wriL, tL), band(tL, tR), band(tR, J.wriR)], J };
}

// ======================= MINI BAND =======================
const thighPt = (J, sd, t = .82) => V.lerp(J["hip" + sd], J["kne" + sd], t);
const miniLoop = J => { const a = thighPt(J, "L"), b = thighPt(J, "R"); return [band(V.add(a, [3, 0, 0]), V.add(b, [3, 0, 0])), band(V.add(a, [-3, 0, 0]), V.add(b, [-3, 0, 0]))]; };
// lateral walk: half squat, two steps right, two steps left
function miniWalk(u) {
  const J = {};
  const zR = tl(u, [[0, 14], [.12, 30], [.25, 30], [.37, 46], [.5, 46], [.62, 46], [.75, 30], [.87, 30], [1, 14]]);
  const zL = tl(u, [[0, -14], [.12, -14], [.25, 2], [.37, 2], [.5, 18], [.62, 2], [.75, 2], [.87, -14], [1, -14]]);
  const liftR = Math.max(0, Math.sin(Math.PI * clamp01(u / .12))) + Math.max(0, Math.sin(Math.PI * clamp01((u - .25) / .12))) + Math.max(0, Math.sin(Math.PI * clamp01((u - .75) / .12)));
  const liftL = Math.max(0, Math.sin(Math.PI * clamp01((u - .12) / .13))) + Math.max(0, Math.sin(Math.PI * clamp01((u - .37) / .13))) + Math.max(0, Math.sin(Math.PI * clamp01((u - .5) / .12))) + Math.max(0, Math.sin(Math.PI * clamp01((u - .62) / .13))) * 0;
  const pz = (zR + zL) / 2 - 16;
  trunk(J, [-10, 74, pz], sag(14), [0, 0, 1], sag(6));
  leg(J, "R", [6, 1 + 5 * liftR, zR - 16], [1, 0, 0.4]); leg(J, "L", [6, 1 + 5 * liftL, zL - 16], [1, 0, -0.4]);
  handsOnHips(J);
  return { items: [...floor3(-50, 60, 64), ...body(J), ...miniLoop(J)], J };
}
// clamshell: lying on the left side, knees bent, feet together, open the top knee
function clamshell(u) {
  const J = {}, k = hold(u, .1, .38, .62, .9);
  trunk(J, [0, 10, 0], [1, 0, 0], [0, 1, 0], [1, 0.05, 0]);
  J.hipL = [0, 1.5, 0]; J.hipR = [0, 18.5, 0]; J.shoL = V.add(J.chest, [0, -9, 0]); J.shoR = V.add(J.chest, [0, 9, 0]);
  leg(J, "L", [-52, 2, 22], [0.2, 0, 1], [-4, 0, -11]);
  leg(J, "R", [-52, 12, 22], V.norm(V.lerp([0.2, 0, 1], [0.1, 1.1, 0.5], k)), [-4, 0, -11]);
  armDir(J, "L", [1, 0, 0.12], [1, 0, 0.05]);
  arm(J, "R", V.add(J.chest, [2, -6, 30]), [-1, 0.6, 0]);
  J.head = V.add(J.chest, [17, 6, 0]);
  return { items: [...floor3(-80, 100, 50), ...body(J), ...miniLoop(J)], J };
}
// glute bridge with the mini band: push the knees out against the band the whole time
function miniBridge(u) {
  const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, u)), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  for (const [sd, zz] of SIDES) { leg(J, sd, [46, 1, 12 * zz], [0, 1, 0.45 * zz]); floorArm(J, sd, 60, 9 * zz); }
  return { items: [...floor3(-80, 80, 40), ...body(J), ...miniLoop(J)], J };
}

// ======================= SUSPENSION TRAINER =======================
// strap anchor over the top of a closed door; stand on the side the door opens away from, so pulling presses it shut
const mount = (A, dx) => [door(dx), knot(A)];
// row: strap anchor over the top of the door in front; lean back with straight arms, pull the chest to the handles
function trxRow(u) {
  const J = {}, F = [30, 1, 0], A = [96, 200, 0], b = rad(lerpN(118, 100, u)), d = ang(b);
  trunk(J, V.add(F, V.mul(d, 86)), d, [0, 0, 1], [d[0] + 0.25, d[1], 0]);
  const bott = V.add(F, V.mul(ang(rad(118)), 136)), Ls = V.len(V.sub(A, bott)) - 58;
  const items = [...floor3(-80, 100, 40), ...mount(A, 98)];
  for (const [sd, zz] of SIDES) {
    const a2 = [F[0], F[1], 10 * zz]; setLeg(J, sd, V.lerp(J["hip" + sd], a2, 44 / 86), a2, [8, 8, 0]);
    const Az = V.add(A, [0, 0, 4 * zz]), h = V.add(Az, V.mul(V.norm(V.sub(V.add(J["sho" + sd], [0, 0, 4 * zz]), Az)), Ls));
    arm(J, sd, h, [-1, -0.6, 0.6 * zz]);
    items.push(L3(Az, J["wri" + sd], "an3strap"), D3(J["wri" + sd], 3.5, "an3grip"));
  }
  return { items: [...items, ...body(J)], J };
}
// push-up: facing away from the door, anchor over the top of it, hands on the handles, body in a line
const TRXP = { id: "trxp", P: [-56, 6], hy: 64, f0: -80, f1: 120 };
function trxPush(u) {
  const r = pushLadder(u, TRXP), J = r.J, A = [-70, 200, 0];
  const items = [...mount(A, -72)];
  for (const [sd, zz] of SIDES) items.push(L3(V.add(A, [0, 0, 4 * zz]), J["wri" + sd], "an3strap"), D3(J["wri" + sd], 3.5, "an3grip"));
  return { items: [...items, ...r.items], J };
}

const SAMPLES = {
  "b-press": { cap: ["Facing away from the door, split stance", "Press the hands forward"], cam: camera(-30, 10, 118, 206, 0.84), dur: 2600,
    frame: u => bandPress(u, false), cues: [{ when: "all", pt: J => J.pelvis, text: "Brace, don't lean" }] },
  "b-fly":   { cap: ["Arms out wide, soft elbows", "Hug forward until the hands meet"], cam: camera(-42, 14, 118, 206, 0.84), dur: 2800,
    frame: u => bandPress(u, true), cues: [{ when: "all", pt: J => J.elbR, text: "Soft, fixed elbows" }] },
  "b-row":   { cap: ["Facing the door, arms long", "Pull the hands to the ribs"], cam: camera(-30, 10, 104, 206, 0.84), dur: 2600,
    frame: bandRow, cues: [{ when: "B", pt: J => J.elbR, text: "Elbows past the body" }] },
  "b-pull":  { cap: ["Kneel tall, band from the top of the door", "Pull the hands to the upper chest"], cam: camera(-30, 8, 108, 214, 0.86), dur: 2600,
    frame: bandPulldown, cues: [{ when: "B", pt: J => J.elbR, text: "Elbows down to the sides" }] },
  "b-face":  { cap: ["Band at face height, arms long", "Pull to the face, elbows high"], cam: camera(-36, 12, 104, 206, 0.84), dur: 2600,
    frame: bandFacePull, cues: [{ when: "B", pt: J => J.elbR, text: "Elbows high and wide" }] },
  "b-pall":  { cap: ["Side-on to the door, hands at the chest", "Press straight out, don't turn"], cam: camera(-60, 16, 120, 204, 0.82), dur: 3200,
    frame: bandPallof, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips face forward" }] },
  "b-push":  { cap: ["Band from the top of the door", "Push down, elbows pinned"], cam: camera(-30, 10, 104, 206, 0.84), dur: 2600,
    frame: bandPushdown, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows at the sides" }] },
  "b-curlL": { cap: ["Face down, band round the ankles", "Curl the heels up, lower slowly"], cam: camera(-24, 16, 140, 176, 0.86), dur: 3000,
    frame: bandLegCurl, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips on the floor" }] },
  "b-ohp":   { cap: ["Stand on the band, hands at the shoulders", "Press overhead"], cam: camera(40, 8, 118, 210, 0.9), dur: 2600,
    frame: bandOverhead, cues: [{ when: "all", pt: J => J.pelvis, text: "Ribs down, no arching" }] },
  "b-lat":   { cap: ["Stand on the band, arms at the sides", "Raise out to shoulder height"], cam: camera(56, 8, 120, 210, 0.9), dur: 2600,
    frame: bandLateral, cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }] },
  "b-curl":  { cap: ["Stand on the band, palms up", "Curl up, elbows still"], cam: camera(-26, 8, 112, 210, 0.92), dur: 2600,
    frame: bandCurl, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows still" }] },
  "b-gm":    { cap: ["Band under the feet and behind the shoulders", "Hips back, flat back, stand up"], cam: camera(-28, 10, 112, 210, 0.9), dur: 2800,
    frame: bandGoodMorning, cues: [{ when: "all", pt: J => J.chest, text: "Flat back" }, { when: "B", pt: J => J.pelvis, text: "Hips back" }] },
  "b-bridge": { cap: ["Band over the hips, hands hold it down", "Hips up, squeeze the glutes"], cam: camera(-20, 16, 118, 170, 1.1), dur: 2800,
    frame: bandBridge, cues: [{ when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }] },
  "m-walk":  { cap: ["Mini band above the knees, half squat", "Small steps sideways, knees out"], cam: camera(70, 12, 120, 206, 0.9), dur: 3600, loop: true,
    frame: miniWalk, cues: [{ when: "all", pt: J => J.kneR, text: "Knees push out" }] },
  "m-clam":  { cap: ["On the side, knees bent, feet together", "Open the top knee, hold, close"], cam: camera(-62, 40, 118, 150, 1), dur: 3600, loop: true,
    frame: clamshell, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay stacked" }] },
  "m-bridge": { cap: ["Mini band above the knees", "Bridge up, knees pushing out"], cam: camera(80, 34, 120, 150, 1.05), dur: 2800,
    frame: miniBridge, cues: [{ when: "all", pt: J => J.kneR, text: "Knees out" }] },
  "t-row":   { cap: ["Lean back, arms long, body straight", "Pull the chest to the handles"], cam: camera(-30, 8, 118, 210, 0.82), dur: 2600,
    frame: trxRow, cues: [{ when: "all", pt: J => J.pelvis, text: "Body straight" }] },
  "t-push":  { cap: ["Facing away, hands on the handles", "Lower the chest between the handles"], cam: camera(-35, 14, 126, 196, 0.84), dur: 2800,
    frame: trxPush, cues: [{ when: "all", pt: J => J.pelvis, text: "Body in a line" }] }
};

const CARDS = [
  { section: "Long band – anchored in a door" },
  { title: "Band chest press and fly", fam: "Chest · replaces the bench press and cable fly", keys: [["Press", "b-press"], ["Fly", "b-fly"]] },
  { title: "Band row", fam: "Back · replaces the cable row", keys: [["Row", "b-row"]] },
  { title: "Band pulldown", fam: "Back · replaces the lat pulldown", keys: [["Pulldown", "b-pull"]] },
  { title: "Band face pull", fam: "Upper back · replaces the cable face pull", keys: [["Face pull", "b-face"]] },
  { title: "Band Pallof press", fam: "Core · replaces the cable Pallof press", keys: [["Pallof press", "b-pall"]] },
  { title: "Band pushdown", fam: "Triceps · replaces the rope pushdown", keys: [["Pushdown", "b-push"]] },
  { title: "Band leg curl", fam: "Hamstrings · replaces the leg-curl machine", keys: [["Leg curl", "b-curlL"]] },
  { section: "Long band – stand on it" },
  { title: "Band overhead press", fam: "Shoulders · replaces the shoulder press", keys: [["Press", "b-ohp"]] },
  { title: "Band lateral raise", fam: "Shoulders · replaces the lateral raise", keys: [["Lateral raise", "b-lat"]] },
  { title: "Band curl", fam: "Biceps · replaces the cable curl", keys: [["Curl", "b-curl"]] },
  { title: "Band good-morning", fam: "Hamstrings and glutes · replaces the Romanian deadlift", keys: [["Good-morning", "b-gm"]] },
  { title: "Band glute bridge", fam: "Glutes · replaces the hip thrust", keys: [["Glute bridge", "b-bridge"]] },
  { section: "Mini band" },
  { title: "Mini-band glute moves", fam: "Side of the hips · warm-up or finisher", keys: [["Lateral walk", "m-walk"], ["Clamshell", "m-clam"], ["Bridge, knees out", "m-bridge"]] },
  { section: "Suspension trainer" },
  { title: "Suspension row", fam: "Back · replaces the cable row", keys: [["Row", "t-row"]] },
  { title: "Suspension push-up", fam: "Chest · harder than a floor push-up", keys: [["Push-up", "t-push"]] }
];

const ANCHOR = "Anchor: put the door anchor on the hinge side of a closed door (never the handle side), and lock the door or tell people at home.";
const GUIDES = {
  "Band chest press and fly": {
    steps: [ANCHOR + " Anchor at chest height.", "Stand facing away from the door, a step or two out so the band is tight, one foot in front.", "Press: hands start beside the chest – press forward until the arms are long. Fly: arms start out wide with soft elbows – hug forward until the hands meet.", "Return slowly against the band."],
    avoid: ["Leaning forward to make it easier.", "Letting the band snap the arms back.", "Elbows flaring straight out on the press."],
    tip: "Step further from the door to make it harder."
  },
  "Band row": {
    steps: [ANCHOR + " Anchor at chest height.", "Face the door, step back until the band is tight with arms long.", "Pull the hands to the ribs, elbows close to the body and back past the body.", "Squeeze the shoulder blades, then let the arms go long slowly."],
    avoid: ["Leaning back to pull.", "Shrugging.", "Letting the band pull you forward on the way back."],
    tip: "Step further from the door to make it harder."
  },
  "Band pulldown": {
    steps: [ANCHOR + " Anchor at the top of the door.", "Kneel tall facing the door, arms reaching up toward the anchor.", "Pull the hands down to the upper chest, elbows down to the sides.", "Let the arms go back up slowly."],
    avoid: ["Leaning far back.", "Pulling behind the head.", "Shrugging the shoulders up."],
    tip: "Kneel further from the door to make it harder."
  },
  "Band face pull": {
    steps: [ANCHOR + " Anchor at face height.", "Face the door, arms long, thumbs pointing back toward you.", "Pull toward the face, elbows high and wide, hands ending beside the ears.", "Return slowly."],
    avoid: ["Elbows dropping below the shoulders.", "Leaning back.", "Going heavy – this is a posture exercise."],
    tip: "Squeeze the shoulder blades together for a second at the end."
  },
  "Band Pallof press": {
    steps: [ANCHOR + " Anchor at chest height.", "Stand side-on to the door, feet a bit wider than the hips, hands together at the chest.", "Press the hands straight out from the chest and hold for 2 seconds – don't let the band turn you.", "Bring the hands back to the chest. Do all reps, then turn around."],
    avoid: ["Letting the hips or shoulders turn toward the door.", "Leaning away from the door.", "Holding your breath."],
    tip: "Step further from the door to make it harder."
  },
  "Band pushdown": {
    steps: [ANCHOR + " Anchor at the top of the door.", "Face the door, lean slightly forward, elbows at the sides.", "Push the hands down until the arms are straight.", "Let the hands come back up to chest height slowly – elbows stay put."],
    avoid: ["Elbows moving forward or out.", "Leaning over the hands to push.", "Letting the band snap up."],
    tip: "Step back from the door to make it harder."
  },
  "Band leg curl": {
    steps: [ANCHOR + " Anchor at the bottom of the door.", "Loop the band around both ankles and lie face down, feet toward the door, far enough away that the band is tight.", "Curl the heels up toward the backside.", "Lower slowly."],
    avoid: ["Hips lifting off the floor.", "Letting the legs drop.", "A band that slides up the leg – keep it around the ankles."],
    tip: "Move further from the door to make it harder."
  },
  "Band overhead press": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand at the front of the shoulders.", "Press straight up until the arms are long.", "Lower back to the shoulders slowly."],
    avoid: ["Arching the lower back – keep the ribs down.", "Pressing forward instead of up.", "The band slipping under the feet – check the footing before every set."],
    tip: "Feet wider = tighter band = harder."
  },
  "Band lateral raise": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand at the sides, soft elbows.", "Raise the arms out to the sides to shoulder height.", "Lower slowly."],
    avoid: ["Raising above shoulder height.", "Shrugging.", "Swinging."],
    tip: "Cross the band in front of you for more tension at the top."
  },
  "Band curl": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand, palms up, elbows at the sides.", "Curl the hands up toward the shoulders.", "Lower slowly to straight arms."],
    avoid: ["Elbows moving forward.", "Leaning back.", "Letting the band pull the hands down fast."],
    tip: "Feet wider = harder."
  },
  "Band good-morning": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Loop the top of the band behind the shoulders (not on the neck) and hold it at the front of the shoulders.", "Push the hips back with a flat back and soft knees until you feel a stretch in the back of the thighs.", "Stand up by squeezing the glutes."],
    avoid: ["Rounding the back.", "The band sitting on the neck.", "Bending the knees into a squat."],
    tip: "Use a thick band – a light band gives almost no resistance here."
  },
  "Band glute bridge": {
    steps: ["Lie on your back, knees bent, feet flat.", "Lay the band across the hips and hold the ends down on the floor beside you.", "Push through the heels and lift the hips until the body is straight from shoulders to knees.", "Squeeze the glutes at the top, then lower."],
    avoid: ["Arching the lower back at the top.", "Letting the hands come off the floor.", "Knees caving in."],
    tip: "Hold the band closer to the hips to make it tighter."
  },
  "Mini-band glute moves": {
    steps: ["Put the mini band just above the knees.", "Lateral walk: half squat, small steps to the side, knees pushing out against the band. Go one way, then back.", "Clamshell: lie on the side, knees bent, feet together. Open the top knee without rolling back, hold, close.", "Bridge, knees out: glute bridge while pushing the knees out against the band the whole time."],
    levels: ["Lateral walk.", "Clamshell.", "Bridge, knees out."],
    avoid: ["Knees caving in.", "Rolling the hips back in the clamshell.", "Long steps in the lateral walk – keep them small."],
    tip: "Great as a warm-up before squats and lunges."
  },
  "Suspension row": {
    steps: ["Hang the strap anchor over the top of a closed door. Stand on the side the door opens away from you, so pulling presses it shut against the frame. Lock it or tell people at home.", "Hold the handles, walk the feet toward the door and lean back with straight arms and a straight body.", "Pull the chest up to the handles, elbows back.", "Lower slowly."],
    avoid: ["Hips sagging.", "Standing on the side the door opens toward you – it can swing open.", "Letting go of the handles at the bottom."],
    tip: "Feet closer to the door = more body weight = harder."
  },
  "Suspension push-up": {
    steps: ["Anchor as for the row, straps at about mid-shin length.", "Face away from the door, hands on the handles, walk the feet back and lean forward with a straight body.", "Lower the chest between the handles, elbows about 45°.", "Press back up, keeping the handles steady."],
    avoid: ["Hips sagging.", "Handles drifting apart.", "Going too low – stop with the hands beside the chest."],
    tip: "Harder than a floor push-up because the handles move. Stand more upright to make it easier."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("P", "Pistol squat ladder", () => {
// ---- Pistol squat ladder (H9f): standing on the right leg (near side), left leg reaches forward.
// Levels 1–3 sit lightly to a box behind (50 / 40 / 30 cm); 4 = full depth holding the rack; 5 = full pistol, free.
const BOXH = { 1: 50, 2: 40, 3: 30 };
function pistol(u, lvl) {
  const J = {}, box = BOXH[lvl], full = !box, hold = lvl <= 2 || lvl === 4, goblet = lvl === 6;
  const bot = full ? [-14, 24, 0] : [-22, box + 7, 0];
  const t = sm(u), pelvis = V.lerp([0, 86, 0], bot, t);
  const lean = lerpN(3, full ? 42 : 30, t);
  trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 30));
  // standing leg: heel down, knee forward over the toes
  leg(J, "R", [8, 1, 10], [1, 0, 0.15], [12, 0, 1]);
  // free leg: hovers just in front at the top, reaches straight forward at the bottom
  const fwd = V.norm(V.lerp([0.35, -1, 0], [1, full ? 0.08 : -0.12, 0], t));
  leg(J, "L", V.add(J.hipL, V.mul(fwd, 84)), [0.2, 1, 0], V.lerp([10, -3, 0], [3, 10, 0], t));
  const items = [...floor3(-70, 120, 46)];
  if (box) items.push(box3(-52, -12, box, 18), { type: "poly", pts: [[-12, 0, -18], [-12, box, -18], [-12, box, 18], [-12, 0, 18]], cls: "an3bench", z: -998 });
  if (goblet) {                                                            // dumbbell held upright at the chest, both hands
    const g = V.add(J.chest, V.add(V.mul(sag(lean + 90), 12), V.mul(sag(lean), -10)));
    for (const [sd, zz] of SIDES) arm(J, sd, V.add(g, [0, 4, 5 * zz]), [-0.2, -1, 0.6 * zz]);
    items.push(...db3(g, V.norm(sag(lean)), 9));
    return { items: [...items, ...body(J)], J };
  }
  if (hold) {
    items.push(L3([16, 0, -42], [16, 190, -42], "an3col"));
    arm(J, "L", [16, J.chest[1] - 30, -38], [-0.2, -1, -0.4]);
  } else arm(J, "L", V.add(J.shoL, V.mul(V.norm(V.lerp([0.1, -1, -0.1], [1, 0.05, 0.12], t)), 58)), [-0.3, -1, -0.3]);
  arm(J, "R", V.add(J.shoR, V.mul(V.norm(V.lerp([0.1, -1, 0.1], [1, 0.05, -0.12], t)), 58)), [-0.3, -1, 0.3]);
  return { items: [...items, ...body(J)], J };
}
const PCAM = camera(-30, 10, 108, 208, 0.84);
const SAMPLES = {};
const CAPS = {
  1: ["High box (~50 cm), hand on the rack", "Sit back lightly, stand up on one leg"],
  2: ["Lower box (~40 cm), hand on the rack", "Sit back lightly, stand up on one leg"],
  3: ["Low box (~30 cm), hands free", "Arms forward, touch the box, stand up"],
  4: ["Full depth, hand on the rack", "All the way down, stand up on one leg"],
  5: ["Full pistol, hands free", "All the way down, free leg off the floor"],
  6: ["Weighted pistol – dumbbell at the chest", "All the way down, stand up on one leg"]
};
for (const l of [1, 2, 3, 4, 5, 6]) SAMPLES["p" + l] = { cap: CAPS[l], cam: PCAM, dur: 3400, frame: u => pistol(u, l),
  cues: [{ when: "all", pt: J => J.ankR, text: "Heel stays down" }, { when: "B", pt: J => J.ankL, text: "Free leg forward" }] };

const CARDS = [
  { title: "Pistol squat ladder", fam: "Balance · dynamic · Some phase 4 (steps 1–3), Experienced phase 3", keys: [["1 · High box", "p1"], ["2 · Lower box", "p2"], ["3 · Low box", "p3"], ["4 · Assisted", "p4"], ["5 · Pistol", "p5"], ["6 · Weighted", "p6"]] }
];

const GUIDES = {
  "Pistol squat ladder": {
    steps: ["Stand on one leg with the other foot just off the floor in front. Use the rack for the steps that say so.", "Push the hips back and bend the standing knee, letting it travel forward over the toes. Reach the free leg forward as you go down.", "Box steps: sit back until you touch the box lightly – don't drop or rest. Full steps: go all the way down with the heel flat.", "Stand up on the same leg by pushing the floor away. Do all reps, then switch legs."],
    levels: ["Single-leg sit to a high box or bench (~50 cm), hand on the rack.", "Same, to a lower box (~40 cm).", "To a low box (~30 cm), hands free, arms forward.", "Assisted pistol – full depth, holding the rack or a suspension strap.", "Full pistol squat.", "Weighted pistol – a dumbbell or kettlebell held upright at the chest. The weight then goes up in the normal steps with the feather and kettlebell."],
    avoid: ["The standing heel lifting.", "The knee caving inward.", "Falling onto the box – touch it and stand up."],
    knee: "Not used if you chose \"go easy on knees\" – you get the lateral step and hold instead. Not for 65+.",
    tip: "Step 6 starts when 5 clean reps per leg at step 5 feel easy. A light weight held out in front can also make the deep steps easier to balance before that. At home, a chair or sofa is the box."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("A", "Strength add-ons", () => {
// ---- Strength review add-ons: incline dumbbell fly, cable lateral raise (+ behind the back), preacher curls.

// incline bench ~30°: back on the pad, feet on the floor
function inclineSeat(J, lean) {
  trunk(J, [0, 50, 0], sag(lean), [0, 0, 1], sag(lean + 12));
  for (const [sd, zz] of SIDES) leg(J, sd, [46, 1, 16 * zz], [0.2, 1, 0]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(sag(lean), 74)), V.mul(nb, 7));
  return [box3(-16, 22, 44, 14), ...benchLegs([-10, 14], 44),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3pad2", z: -998 },
    L3([p2[0], p2[1] - 4, 0], [p2[0] - 8, 0, 0], "an3eq")];
}
// incline dumbbell fly: soft fixed elbows, arms open in an arc until the chest is stretched, palms facing
function inclineFly(u) {
  const J = {}, lean = -60, front = sag(lean + 90), dir = sag(lean);
  const gear = inclineSeat(J, lean);
  for (const [sd, zz] of SIDES) {
    const Z = [0, 0, zz];
    armDir(J, sd, V.lerp(V.add(front, V.mul(Z, 0.08)), V.add(V.mul(Z, 1), V.mul(front, -0.2)), u),
      V.lerp(V.add(front, V.mul(Z, -0.38)), V.add(V.mul(Z, 1), V.mul(front, 0.35)), u));
  }
  return { items: [...floor3(-70, 80, 70), ...gear, ...body(J), ...db3(J.wriL, dir), ...db3(J.wriR, dir)], J };
}

// cable lateral raise, one arm; behind = cable runs behind the body
function cableLateral(u, behind) {
  const J = {}, t = rad(lerpN(-12, 84, u)), A = [behind ? -16 : 4, 12, -56];
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const s = J.shoR, dx = behind ? lerpN(-9, 2, u) : 6;
  arm(J, "R", [s[0] + dx, s[1] - 59 * Math.cos(t), s[2] + 5 + 54 * Math.sin(t)], [-0.5, 0.3, 0.6]);
  arm(J, "L", [6, 100, -50], [0, -1, -0.5]);
  return { items: [...floor3(-40, 60, 70), post(A[0], -62, 0, 180), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
}

// preacher curl on a preacher bench: seated, upper arms on the sloped pad, EZ bar
function preacher(u) {
  const J = {}, lean = 14;
  trunk(J, [0, 52, 0], sag(lean), [0, 0, 1], sag(lean - 10));
  for (const [sd, zz] of SIDES) leg(J, sd, [40, 1, 15 * zz], [0.3, 1, 0]);
  const pd = V.norm([0.72, -0.7, 0]), nrm = V.norm([-0.7, -0.72, 0]);
  const ph = lerpN(132, -8, u);
  for (const [sd, zz] of SIDES) {
    const e = V.add(J["sho" + sd], V.add(V.mul(pd, 31), [0, 0, 2 * zz]));
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(ph), 30));
  }
  const sm_ = mid3(J.shoL, J.shoR), a = V.add(V.add(sm_, V.mul(pd, 2)), V.mul(nrm, 5)), b = V.add(V.add(sm_, V.mul(pd, 34)), V.mul(nrm, 5));
  const pad = { type: "poly", pts: [[a[0], a[1], -24], [b[0], b[1], -24], [b[0], b[1], 24], [a[0], a[1], 24]], cls: "an3pad2", z: -998 };
  const bar = mid3(J.wriL, J.wriR);
  return { items: [...floor3(-50, 80, 44), box3(-16, 18, 44, 14), ...benchLegs([-10, 12], 44), pad, L3([b[0] - 4, b[1] - 4, 0], [b[0] - 10, 0, 0], "an3col"),
    ...body(J), ...barZ(bar, 22, 6, 19)], J };
}
// incline bench preacher curl: stand behind an incline bench, chest on the top, one arm over the backrest
function inclinePreacher(u) {
  const J = {}, lean = 34;
  trunk(J, [-26, 84, 0], sag(lean), [0, 0, 1], sag(lean - 20));
  standLegs(J, 12, [1, 0, 0], -24);
  const pd = V.norm([0.5, -0.86, 0]);
  const ph = lerpN(150, 8, u);
  const e = V.add(J.shoR, V.add(V.mul(pd, 31), [0, 0, -2]));
  J.elbR = e; J.wriR = V.add(e, V.mul(sag(ph), 30));
  arm(J, "L", V.add(J.chest, [14, -14, -16]), [-0.5, -1, -0.4]);              // free hand holds the top of the bench
  // bench back: top edge at the armpit, sloping down and away (~60°), seat on the far side
  const top = V.add(J.shoR, [2, -4, -12]), bot = [top[0] + 44, 44, 0];
  const pad = { type: "poly", pts: [[top[0], top[1], -16], [bot[0], bot[1], -16], [bot[0], bot[1], 16], [top[0], top[1], 16]], cls: "an3pad2", z: -998 };
  return { items: [...floor3(-70, 110, 44), pad, box3(bot[0], bot[0] + 40, 44, 14), ...benchLegs([bot[0] + 4, bot[0] + 34], 44),
    ...body(J), ...db3(J.wriR, [0, 0, 1])], J };
}

// standing calf raise with a bar on the back (barbell or Smith machine), balls of the feet on a plate/step
function barCalf(u, smith) {
  const J = {}, a = rad(lerpN(-22, 48, u)), toe = 14, stepY = 7;
  const ank = [toe - 12 * Math.cos(a), stepY + 12 * Math.sin(a), 0];
  trunk(J, [ank[0] - 2, ank[1] + 85, 0], sag(2), [0, 0, 1], sag(0));
  for (const [sd, zz] of SIDES) { const A = [ank[0], ank[1], 12 * zz]; leg(J, sd, A, [1, 0, 0], [toe - A[0], stepY - A[1], 0]); }
  const bar = V.add(V.add(J.chest, V.mul(sag(2 - 90), 6)), V.mul(sag(2), -3));
  for (const [sd, zz] of SIDES) arm(J, sd, [bar[0], bar[1], 26 * zz], [-0.4, -1, 0.3 * zz]);
  const items = [...floor3(-50, 60, 56), box3(-4, 18, stepY, 24), { type: "poly", pts: [[18, 0, -24], [18, stepY, -24], [18, stepY, 24], [18, 0, 24]], cls: "an3bench", z: -998 }];
  if (smith) items.push(L3([bar[0] - 14, 0, -50], [bar[0] - 14, 210, -50], "an3eq"), L3([bar[0] - 14, 0, 50], [bar[0] - 14, 210, 50], "an3eq"), L3([bar[0] - 14, bar[1], -50], [bar[0], bar[1], -50], "an3eq"), L3([bar[0] - 14, bar[1], 50], [bar[0], bar[1], 50], "an3eq"));
  return { items: [...items, ...body(J), ...barZ(bar, smith ? 50 : 46, 11, 40)], J };
}


// face-away (Bayesian) cable curl: back to a low pulley, working arm behind the body, upper arm stays put, curl up
function bayesCurl(u) {
  const J = {}, A = [-56, 12, 14];
  trunk(J, [0, 86, 0], sag(6), [0, 0, 1], sag(2));
  for (const [sd, zz] of SIDES) leg(J, sd, [sd === "R" ? -16 : 18, 1, 12 * zz], [1, 0, 0]);
  const ua = V.norm([-0.38, -1, 0.06]), base = Math.atan2(ua[1], ua[0]), bend = rad(lerpN(4, 132, sm(u)));
  J.elbR = V.add(J.shoR, V.mul(ua, 32));
  J.wriR = V.add(J.elbR, [30 * Math.cos(base + bend), 30 * Math.sin(base + bend), 1]);
  arm(J, "L", V.add(J.hipL, [6, -2, -8]), [-0.6, 0, -0.6]);
  return { items: [...floor3(-80, 60, 50), post(A[0], A[2], 0, 190), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
}

// stability-ball crunch: lie back over the ball (abs stretched), curl the ribs toward the hips, lower back over the ball
function ballCrunch(u) {
  const J = {}, pelvis = [12, 59, 0];
  const d = V.norm(V.lerp([-1, -0.1, 0], [-0.75, 0.66, 0], sm(u)));
  trunk(J, pelvis, d, [0, 0, 1], V.norm(V.lerp([-1, 0.15, 0], [-0.5, 0.86, 0], sm(u))));
  for (const [sd, zz] of SIDES) leg(J, sd, [52, 1, 15 * zz], [0, 1, 0]);
  const up = [d[1], -d[0], 0];                        // chest-side normal of the trunk
  for (const [sd, zz] of SIDES) {                       // arms reach toward the knees
    const s0 = J["sho" + sd], k = J["kne" + sd], dir = V.norm([k[0] - s0[0], k[1] - s0[1], 0]);
    arm(J, sd, V.add(s0, V.add(V.mul(dir, 60.5), [0, 0, 2 * zz])), [up[0], up[1], 0.5 * zz]);
  }
  return { items: [...floor3(-60, 80, 44), D3([2, 30, 0], 30, "an3ball"), ...body(J)], J };
}

const SAMPLES = {
  "bcalfs": { cap: ["Smith machine, balls of the feet on a plate", "Heels down for a stretch, then up high"], cam: camera(-22, 12, 112, 208, 0.9), dur: 2600,
    frame: u => barCalf(u, true), cues: [{ when: "A", pt: J => J.ankR, text: "Heels below the toes" }, { when: "B", pt: J => J.ankR, text: "Up on the toes, pause" }] },
  "bcalfb": { cap: ["Barbell on the back, balls of the feet on a plate", "Heels down for a stretch, then up high"], cam: camera(-22, 12, 112, 208, 0.9), dur: 2600,
    frame: u => barCalf(u, false), cues: [{ when: "A", pt: J => J.ankR, text: "Heels below the toes" }, { when: "B", pt: J => J.ankR, text: "Up on the toes, pause" }] },
  "ifly":  { cap: ["Start: dumbbells together over the chest", "Bottom: arms wide, chest stretched"], cam: camera(64, 26, 122, 176, 0.95), dur: 3000,
    frame: inclineFly, cues: [{ when: "all", pt: J => J.elbR, text: "Soft, fixed elbows" }, { when: "B", pt: J => J.chest, text: "Feel the stretch" }] },
  "clat":  { cap: ["Cable in front of the body", "Arm out to shoulder height"], cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame: u => cableLateral(u, false), cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }] },
  "clatb": { cap: ["Cable behind the body, hand behind the hip", "Arm out to shoulder height"], cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame: u => cableLateral(u, true), cues: [{ when: "A", pt: J => J.wriR, text: "Start behind the hip" }] },
  "prch":  { cap: ["Upper arms flat on the pad", "Curl up, lower slowly to almost straight"], cam: camera(-30, 12, 110, 200, 0.95), dur: 3000,
    frame: preacher, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows stay on the pad" }] },
  "iprch": { cap: ["Chest on the top of an incline bench", "Upper arm over the backrest, curl up"], cam: camera(-28, 10, 112, 206, 0.9), dur: 3000,
    frame: inclinePreacher, cues: [{ when: "all", pt: J => J.elbR, text: "Upper arm stays on the pad" }] },
  "bayes": { cap: ["Back to a low pulley, arm behind the body", "Curl up – the upper arm stays still"], cam: camera(-34, 10, 116, 206, 0.88), dur: 2800,
    frame: bayesCurl, cues: [{ when: "A", pt: J => J.elbR, text: "Arm behind you" }, { when: "B", pt: J => J.wriR, text: "Squeeze" }] },
  "bcrunch": { cap: ["Lie back over the ball, abs stretched", "Curl the ribs toward the hips"], cam: camera(-22, 12, 122, 190, 1.0), dur: 2800,
    frame: ballCrunch, cues: [{ when: "A", pt: J => J.chest, text: "Stretch over the ball" }, { when: "B", pt: J => J.chest, text: "Ribs to hips" }] }
};
const CARDS = [
  { title: "Incline dumbbell fly", fam: "Chest · S-01 · stretch-focused", keys: [["Incline fly", "ifly"]] },
  { title: "Cable lateral raise", fam: "Side shoulders · S-03 · two versions", keys: [["Cable in front", "clat"], ["Behind the back", "clatb"]] },
  { title: "Standing calf raise with a bar", fam: "Calves · S-08 · Swap option when the calf machine is busy", keys: [["Smith machine", "bcalfs"], ["Barbell", "bcalfb"]] },
  { title: "Preacher curl", fam: "Biceps · S-05 · new", keys: [["Preacher bench", "prch"], ["Incline bench preacher", "iprch"]] },
  { title: "Face-away cable curl", fam: "Biceps · priority partner to the preacher curl · new", keys: [["Face-away curl", "bayes"]] },
  { title: "Stability-ball crunch", fam: "Abs · priority, phases 1–2 · new", keys: [["Ball crunch", "bcrunch"]] }
];

const GUIDES = {
  "Incline dumbbell fly": {
    steps: ["Set the bench to about 30°. Lie back with a dumbbell in each hand above the chest, palms facing each other.", "Soften the elbows a little and keep that bend the whole time.", "Open the arms wide in an arc until you feel a good stretch across the chest.", "Bring the dumbbells back together over the upper chest."],
    avoid: ["Bending and straightening the elbows – that turns it into a press.", "Going so deep that the shoulders hurt.", "Going heavy – lighter than the incline press."],
    tip: "The load is highest at the bottom, where the chest is stretched – lower slowly. With a bench at home it works the same."
  },
  "Cable lateral raise": {
    steps: ["Stand side-on to a low pulley and take the handle in the far hand.", "In front: the cable runs across the front of the body. Behind the back: step so the cable runs behind you and start with the hand just behind the hip.", "Raise the arm out to the side to shoulder height, elbow soft.", "Lower slowly."],
    levels: ["Cable in front.", "Behind the back – a little more stretch at the start."],
    avoid: ["Raising above shoulder height.", "Shrugging.", "Leaning far away to swing the weight up."],
    tip: "Both versions train the same muscle – pick the one that feels smoother on your shoulder."
  },
  "Standing calf raise with a bar": {
    steps: ["Put a weight plate or low step under the bar. Smith machine: set the bar at shoulder height; barbell: take it from a rack at shoulder height, with the safety bars set.", "Bar on the upper back, balls of the feet on the edge of the plate, heels free.", "Lower the heels below the toes for a stretch, pause 1 second.", "Rise as high as you can onto the toes, pause, then lower slowly."],
    levels: ["Smith machine – the bar runs on rails, easiest to balance.", "Barbell – needs more balance; keep the weight moderate."],
    avoid: ["Bouncing at the bottom.", "Bending the knees to help.", "Going heavy on the barbell version – balance is the limit, not the calves."],
    tip: "Swap option only – the calf machines and the single-leg dumbbell calf raise stay first."
  },
  "Preacher curl": {
    steps: ["Preacher bench: sit with the backs of the upper arms flat on the pad, armpits at the top edge. Incline bench version: stand behind a bench set to 45–60°, chest against the top, one upper arm over the backrest.", "Hold an EZ bar (or a dumbbell) with the palms up.", "Curl up until the forearms are about upright.", "Lower slowly until the arms are almost straight."],
    levels: ["Preacher bench, EZ bar or dumbbells.", "Incline bench preacher curl, one dumbbell – no preacher bench needed."],
    avoid: ["Lifting the elbows off the pad.", "Dropping fast into a locked elbow at the bottom.", "Swinging the body to lift."],
    tip: "The bottom of the curl is where the biceps is stretched – go slow there. Wrists on \"go easy\": EZ bar or dumbbells."
  },
  "Face-away cable curl": {
    steps: ["Set a cable at the lowest height with a single handle. Stand with your back to the machine and take the handle.", "Step forward until the arm is pulled slightly behind the body. Stagger the feet for balance.", "Curl the handle up without letting the upper arm move forward.", "Lower slowly until the arm is long behind you again."],
    avoid: ["Letting the elbow swing forward as you curl.", "Going heavy – the stretch at the bottom is the point.", "Leaning forward to cheat the weight up."],
    tip: "Pairs with the preacher curl: one in each session, so the biceps are trained hard at the long end twice a week."
  },
  "Stability-ball crunch": {
    steps: ["Sit on a large exercise ball and walk the feet forward until the lower back rests on the ball.", "Lean back so the abs stretch over the ball. Reach the hands toward the knees.", "Curl the ribs toward the hips – lift the shoulders, not the whole body.", "Lower slowly back over the ball."],
    avoid: ["Sitting all the way up – it turns into a hip exercise.", "Pulling on the neck.", "Feet too close together – keep them wide for balance."],
    tip: "Used in phases 1–2. Later phases move to the cable crunch or ab crunch machine, which can be loaded heavier."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
addWave("K", "Cardio add-ons", () => {
// ---- Cardio review add-ons: stair climber, air bike, ski machine, glute-bridge march.

// stair climber: steps roll down and back; each foot rides a step down, then lifts to the next one
function stairs(u) {
  const J = {}, T = [12, 46], d = V.norm([-0.6, -0.8, 0]), L = 22, duty = 0.5;
  trunk(J, [-4, 110 + 1.2 * Math.cos(TAU * 2 * u), 0], sag(10), [0, 0, 1], sag(4));
  const foot = p => {
    if (p < duty) { const t = p / duty; return [T[0] + d[0] * L * t, T[1] + d[1] * L * t]; }
    const q = sm((p - duty) / (1 - duty)), b = [T[0] + d[0] * L, T[1] + d[1] * L];
    return [lerpN(b[0], T[0], q), lerpN(b[1], T[1], q) + 10 * Math.sin(Math.PI * q)];
  };
  for (const [sd, zz, ph] of [["R", 1, 0], ["L", -1, 0.5]]) { const f = foot((u + ph) % 1); leg(J, sd, [f[0], f[1], 9 * zz], [1, 0, 0], [12, 0, 0]); }
  for (const [sd, zz] of SIDES) arm(J, sd, [26, 104, 24 * zz], [-0.3, -1, 0.4 * zz]);
  const items = [...floor3(-50, 90, 40)];
  const off = (u * 2 * L) % 11;                                                  // step edges roll down
  for (let k = -1; k < 6; k++) { const s = k * 11 + off; const p = [T[0] + 8 + d[0] * s, T[1] - 1 + d[1] * s]; if (p[1] > 4 && p[1] < 60) items.push(L3([p[0] - 6, p[1], -18], [p[0] - 6, p[1], 18], "an3eq"), L3([p[0] - 6, p[1], 0], [p[0] + 14, p[1], 0], "an3eq")); }
  items.push(L3([40, 0, 0], [40, 110, 0], "an3col"), L3([26, 104, -26], [40, 106, -26], "an3eq"), L3([26, 104, 26], [40, 106, 26], "an3eq"), L3([26, 104, -26], [26, 104, 26], "an3col"));
  return { items: [...items, ...body(J)], J };
}

// air bike: pedals forward, handles push and pull with the legs, big fan in front
function airBike(u) {
  const J = {}, C = [30, 30, 0], th = -u * TAU;
  trunk(J, [0, 90, 0], sag(24), [0, 0, 1], sag(40));
  const items = [...floor3(-40, 110, 36), L3([-18, 0, 0], [92, 0, 0], "an3eq"), D3([70, 40, 0], 30, "an3fly"), L3([-2, 84, 0], [8, 40, 0], "an3col"), L3([8, 40, 0], [70, 40, 0], "an3col"),
    L3([8, 40, 0], [-10, 0, 0], "an3col"), L3([70, 40, 0], [80, 0, 0], "an3col"), L3([-14, 86, 0], [8, 87, 0], "an3pad"), D3(C, 3, "an3eqf")];
  for (const [sd, zz] of SIDES) {
    const a = th + (sd === "R" ? 0 : Math.PI), ank = [C[0] + 16 * Math.cos(a), C[1] + 16 * Math.sin(a), 12 * zz];
    items.push(L3(C, [ank[0], ank[1], 6 * zz], "an3eq"));
    leg(J, sd, ank, [1, 0.6, 0]);
    const h = [46 + 13 * Math.cos(a), 108, 20 * zz];                             // handle moves opposite to the same-side pedal
    arm(J, sd, h, [-0.2, -1, 0.5 * zz]);
    items.push(L3([46, 46, 20 * zz], h, "an3eq"), D3(h, 4, "an3grip"));
  }
  return { items: [...items, ...body(J)], J };
}

// ski machine: hands start at head level (arms slightly bent), pull straight down while the upper body follows,
// finish next to the hips; the upper body rises first, the hands come back up just before standing tall
function ski(u) {
  const J = {}, cl = x => Math.max(0, Math.min(1, x));
  const ez = x => (1 - Math.cos(Math.PI * cl(x))) / 2;
  let lean, hp, back;                                 // hp: 0 = hands up, 1 = hands at the hips
  if (u < 0.45) { hp = ez(u / 0.42); lean = 48 * ez((u - 0.04) / 0.41); }
  else { lean = 48 * (1 - ez((u - 0.45) / 0.5)); hp = 1 - ez((u - 0.55) / 0.42); }
  back = lean / 48;
  trunk(J, [lerpN(0, -18, back), lerpN(86, 74, back), 0], sag(lean), [0, 0, 1], sag(lean - 15));
  for (const [sd, zz] of SIDES) leg(J, sd, [4, 1, 13 * zz], [1, 0, 0]);
  const P = [66, 196];
  const th = lerpN(5, -132, hp), BEND = 30;           // fixed elbow bend; only the shoulder rotates
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], e = V.add(s, [32 * Math.cos(rad(th)), 32 * Math.sin(rad(th)), 5 * zz]);
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, [30 * Math.cos(rad(th + BEND)), 30 * Math.sin(rad(th + BEND)), 3 * zz]);
  }
  const items = [...floor3(-50, 80, 40), L3([70, 0, 0], [70, 200, 0], "an3col"), L3([60, 200, -12], [72, 200, 12], "an3eq")];
  for (const [sd, zz] of SIDES) items.push(L3([P[0], P[1], 8 * zz], J["wri" + sd], "an3cable"), D3(J["wri" + sd], 4, "an3grip"));
  return { items: [...items, ...body(J)], J };
}

// glute-bridge march: hold the bridge, lift one foot a little, put it down, then the other – hips stay level
function bridgeMarch(u) {
  const J = {}, S = [-44, 8, 0], a = rad(-30), pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
  trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
  const up = sd => { const p = sd === "R" ? u : (u + 0.5) % 1; return Math.max(0, Math.sin(TAU * p)) ** 1.5; };
  for (const [sd, zz] of SIDES) {
    const k = up(sd), ank = V.lerp([46, 1, 14 * zz], [30, 44, 14 * zz], k);
    leg(J, sd, ank, [0, 1, 0], V.lerp([12, 0, 0], [8, 6, 0], k));
    floorArm(J, sd, 60, 9 * zz);
  }
  return { items: [...floor3(-80, 80, 40), ...body(J)], J };
}


// Nordic hamstring curl: kneel on a pad, heels held under a padded roller; lower forward slowly with straight hips, catch with the hands, push back up
function nordic(u) {
  const J = {}, cl = x => Math.max(0, Math.min(1, x)), ez = x => (1 - Math.cos(Math.PI * cl(x))) / 2;
  let th;
  if (u < 0.62) th = 68 * ez(u / 0.62);
  else if (u < 0.72) th = 68 + 10 * ez((u - 0.62) / 0.1);
  else th = 78 * (1 - ez((u - 0.72) / 0.28));
  const d = [Math.sin(rad(th)), Math.cos(rad(th)), 0], K = [0, 5, 0], pelvis = V.add(K, V.mul(d, 44));
  trunk(J, pelvis, d, [0, 0, 1], d);
  for (const [sd, zz] of SIDES) leg(J, sd, [-42, 7, 10 * zz], [1, -0.4, 0], [-4, -6, 0]);
  const reach = ez((th - 52) / 20);                    // hands come forward to catch near the bottom
  for (const [sd, zz] of SIDES) {
    const chestHand = V.add(J.chest, V.add(V.mul(d, -6), [14 * d[1], -14 * d[0], 5 * zz]));
    const fh = [J["sho" + sd][0] + 14, 2, 16 * zz];
    arm(J, sd, V.lerp(chestHand, fh, reach), [-0.3, -0.2, zz]);
  }
  const items = [...floor3(-70, 100, 40), box3(-10, 12, 3, 20), L3([-42, 11, -22], [-42, 11, 22], "an3pad"), L3([-42, 11, -22], [-48, 0, -22], "an3col"), L3([-42, 11, 22], [-48, 0, 22], "an3col")];
  return { items: [...items, ...body(J)], J };
}

// tibialis raise: back against a wall, heels ~30 cm out, lift the toes, lower slowly
function tibRaise(u) {
  const J = {}, a = rad(lerpN(0, 40, Math.sin(Math.PI * u)));
  trunk(J, [-24, 86, 0], V.norm([-0.08, 1, 0]), [0, 0, 1], V.norm([-0.04, 1, 0]));
  for (const [sd, zz] of SIDES) leg(J, sd, [6, 7, 11 * zz], [1, 0, 0], [12 * Math.cos(a), 12 * Math.sin(a), 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["hip" + sd], [16, -12, 10 * zz]), [-1, 0, 0.4 * zz]);
  const items = [...floor3(-40, 60, 40), { type: "poly", pts: [[-36, 0, -40], [-36, 190, -40], [-36, 190, 40], [-36, 0, 40]], cls: "an3bench", z: -998 }];
  return { items: [...items, ...body(J)], J };
}

// pogo hops: short, springy hops on the balls of the feet, knees almost straight
function pogo(u) {
  const J = {}, p = (u * 2) % 1, air = 0.62;
  let h, dip;
  if (p < air) { h = 11 * Math.sin(Math.PI * p / air); dip = 0; }
  else { h = 0; dip = Math.sin(Math.PI * (p - air) / (1 - air)); }
  const a = rad(lerpN(30, 16, dip)), toeX = 14;
  const ankY = 1 + h + 12 * Math.sin(a), ankX = toeX - 12 * Math.cos(a);
  trunk(J, [ankX - 2, ankY + 84 - 3 * dip, 0], sag(3), [0, 0, 1], sag(0));
  for (const [sd, zz] of SIDES) leg(J, sd, [ankX, ankY, 11 * zz], [1, 0, 0], [12 * Math.cos(a), -12 * Math.sin(a), 0]);
  for (const [sd, zz] of SIDES) arm(J, sd, V.add(J["hip" + sd], [14, 4 + 3 * dip, 12 * zz]), [-1, -0.2, 0.5 * zz]);
  return { items: [...floor3(-50, 60, 40), ...body(J)], J };
}

const SAMPLES = {
  "stair": { cap: ["Light hands on the rails, stand tall", "Whole foot on each step, steady rhythm"], cam: camera(-30, 10, 110, 206, 0.86), dur: 1500, loop: true,
    frame: stairs, cues: [{ when: "all", pt: J => J.chest, text: "Stand tall" }] },
  "abike": { cap: ["Push and pull the handles", "Arms and legs together"], cam: camera(-22, 10, 92, 200, 0.92), dur: 1300, loop: true,
    frame: airBike, cues: [{ when: "all", pt: J => J.wriR, text: "Push and pull" }] },
  "ski":   { cap: ["Hands at head level, arms slightly bent", "Pull down to the hips as the upper body follows"], cam: camera(-12, 8, 100, 214, 0.8), dur: 2600, loop: true,
    frame: ski, cues: [{ when: "all", pt: J => J.kneR, text: "Hips back, knees soft" }] },
  "bmarch": { cap: ["Hold the bridge, hips up", "Lift one foot, then the other – hips level"], cam: camera(-20, 16, 118, 170, 1.1), dur: 2400, loop: true,
    frame: bridgeMarch, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips stay level" }] },
  "nordic": { cap: ["Kneel tall, heels held down", "Lower slowly, catch with the hands, push back up"], cam: camera(-24, 12, 120, 196, 0.95), dur: 4200, loop: true,
    frame: nordic, cues: [{ when: "all", pt: J => J.pelvis, text: "Hips straight" }] },
  "tib": { cap: ["Back to the wall, heels out in front", "Lift the toes high, lower slowly"], cam: camera(-26, 10, 108, 206, 0.9), dur: 2200, loop: true,
    frame: tibRaise, cues: [{ when: "all", pt: J => J.toeR, text: "Toes up" }] },
  "pogo": { cap: ["Stand tall, knees almost straight", "Quick, small hops on the balls of the feet"], cam: camera(-26, 10, 104, 206, 0.9), dur: 1000, loop: true,
    frame: pogo, cues: [{ when: "all", pt: J => J.ankR, text: "Springy ankles" }] }
};
const CARDS = [
  { title: "Stair climber", fam: "Cardio machine · low impact · new choice", keys: [["Stair climber", "stair"]] },
  { title: "Air bike", fam: "Cardio machine · arms and legs · new choice", keys: [["Air bike", "abike"]] },
  { title: "Ski machine", fam: "Cardio machine · upper body and hips · new choice", keys: [["Ski machine", "ski"]] },
  { title: "Glute-bridge march", fam: "Core · Steady endurance, phase 3", keys: [["Bridge march", "bmarch"]] },
  { title: "Nordic hamstring curl", fam: "Hamstrings · new · Some / Experienced", keys: [["Nordic curl", "nordic"]] },
  { title: "Tibialis raise", fam: "Shins · new · all levels", keys: [["Tibialis raise", "tib"]] },
  { title: "Pogo hops", fam: "Ankles and calves · new · Experienced, phase 3+", keys: [["Pogo hops", "pogo"]] }
];

const GUIDES = {
  "Stair climber": {
    steps: ["Step on and hold the rails lightly. Start the machine at a slow speed.", "Stand tall, chest up, and put the whole foot on each step.", "Find a steady rhythm, then raise the speed to match the effort in your plan."],
    levels: ["Easy and Steady: a calm pace, hands resting on the rails.", "Hard: faster steps – still upright, still whole foot."],
    avoid: ["Leaning on the rails and carrying your weight with the arms.", "Hunching forward over the console.", "Only the toes on the step."],
    tip: "Low impact, so it suits knees on \"go easy\" when the pace is calm. If the knees complain, use the bike instead.",
    talk: true
  },
  "Air bike": {
    steps: ["Set the seat so the knee is slightly bent at the bottom of the pedal stroke.", "Hold the handles and pedal forward. Push one handle and pull the other at the same time as the legs.", "The harder you go, the more the fan pushes back – you set the effort yourself."],
    levels: ["Easy and Steady: smooth, even strokes.", "Hard: short bursts – the fan makes them very hard very fast."],
    avoid: ["Starting the Hard blocks flat out – build up over the first seconds.", "Only using the legs and letting the arms go along for the ride."],
    tip: "One of the hardest machines for intervals. Good for Hard blocks, and kind to the knees.",
    talk: true
  },
  "Ski machine": {
    steps: ["Stand facing the machine, feet hip-width apart. Hold the handles at head level, arms slightly bent.", "Pull straight down. The upper body follows: hips go back, knees soften, arms keep bending.", "Finish with the hands next to the hips.", "Raise the upper body first. Just before you stand tall, let the hands follow back up to head level."],
    levels: ["Easy and Steady: smooth, long pulls.", "Hard: quicker, stronger pulls – the drive comes from the hips."],
    avoid: ["Pulling with the arms only.", "Rounding the back at the bottom.", "Squatting deep – it's a hip hinge with soft knees."],
    tip: "Trains the upper body and the hips together. Good when the legs are tired or the knees need a break from running.",
    talk: true
  },
  "Glute-bridge march": {
    steps: ["Lie on your back, knees bent, feet flat. Lift into a glute bridge.", "Keep the hips up and level. Lift one foot a little, knee toward the chest.", "Put it down and lift the other. Keep the hips still the whole time."],
    levels: ["Shorter: 4–6 steps per leg.", "Longer: 8–10 steps per leg, slow and controlled."],
    avoid: ["Hips dropping or tilting when a foot lifts.", "Arching the lower back to stay up."],
    tip: "If the hips drop, take smaller steps or go back to the two-foot bridge."
  },
  "Nordic hamstring curl": {
    steps: ["Kneel on a pad with the heels held down – under a padded roller, a low bar, or by a partner.", "Hands ready in front of the chest. Keep a straight line from knees to head.", "Lower forward as slowly as you can, hips straight.", "Catch yourself with the hands, then push gently back up to kneeling."],
    levels: ["Start: lower only partway, or hold a band from behind for help.", "Harder: lower all the way with control before the hands catch you."],
    avoid: ["Bending at the hips to make it easier.", "Dropping fast at the end – control is the point.", "Doing many reps at first – start with 2 sets of 3–5."],
    tip: "Hamstrings are often sore for a few days after the first sessions. Start small."
  },
  "Tibialis raise": {
    steps: ["Lean your back against a wall with the heels about 30 cm out in front.", "Keep the legs straight and lift the toes as high as you can.", "Lower slowly and repeat."],
    levels: ["Easier: heels closer to the wall.", "Harder: heels further out, or one leg at a time."],
    avoid: ["Bending the knees.", "Bouncing the toes on the floor."],
    tip: "Strengthens the front of the shins – a common sore spot when you start running."
  },
  "Pogo hops": {
    steps: ["Stand tall, feet hip-width, knees almost straight.", "Hop quickly and lightly on the balls of the feet.", "Spend as little time on the floor as you can – like a spring."],
    levels: ["Start: 2–3 sets of 10–15 hops.", "Harder: 20–30 hops, or a little higher."],
    avoid: ["Landing on the heels.", "Bending the knees deeply – the bounce comes from the ankles.", "Doing it with knees on \"go easy\"."],
    tip: "Short and springy. A good warm-up before Hard intervals."
  }
};

return { SAMPLES, GUIDES, CARDS: typeof CARDS === 'undefined' ? null : CARDS };
});
// ---- Cue labels find their own open space.
// For each exercise: draw every frame of the movement into a coarse occupancy grid (figure = expensive,
// equipment = cheaper, floor lines = almost free), then put each label where it covers the least,
// as close to its body part as possible, without crossing other labels or drawing its arrow through the body.
const NO_ARROWS = true;
const CELL = 2, GW = 120, GH = 113, LINEH = 14;
let measureCtx = null;
function textW(t) {                       // real width in the font the page is using (falls back to an estimate)
  try { measureCtx = measureCtx || document.createElement("canvas").getContext("2d"); measureCtx.font = '700 12px Barlow, system-ui, sans-serif'; return measureCtx.measureText(t).width + 2; }
  catch (e) { return t.length * 7.2; }
}
function splitTwo(t) {                     // best two-line break: the space closest to the middle
  const sp = [...t.matchAll(/ /g)].map(m => m.index);
  if (!sp.length) return null;
  const k = sp.reduce((a, b) => Math.abs(b - t.length / 2) < Math.abs(a - t.length / 2) ? b : a);
  return [t.slice(0, k), t.slice(k + 1)];
}
const LAYOUT = {};
function occGrid(a, us) {
  const g = new Float32Array(GW * GH);
  const put = (cx, cy, w) => { if (cx >= 0 && cy >= 0 && cx < GW && cy < GH) { const i = cy * GW + cx; if (g[i] < w) g[i] = w; } };
  const disc = (x, y, r, w) => { for (let cy = Math.floor((y - r) / CELL); cy <= Math.floor((y + r) / CELL); cy++) for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++) put(cx, cy, w); };
  for (const u of us) {
    if (a.overlay && a.reserve) for (const [x, y, r] of a.reserve(a.frame(u).J, a.cam)) disc(x, y, r, 30);   // keep labels off the head marks
    for (const it of a.frame(u).items) {
      const pts = it.pts.map(a.cam), c = it.cls || "", fig = c === "an3" || c === "an3 far" || c === "an3h";
      const w = fig ? 30 : c === "an3eq" ? 0.5 : 5;
      if (it.type === "dot") disc(pts[0][0], pts[0][1], it.r + 3, w);
      else if (it.type === "line") {
        const r = fig || c === "an3col" || c === "an3pad" ? 6 : 3, [p, q] = pts, n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 1.5) + 1;
        for (let k = 0; k <= n; k++) disc(p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n, r, w);
      } else {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        for (let cy = Math.floor(Math.min(...ys) / CELL); cy <= Math.ceil(Math.max(...ys) / CELL); cy++)
          for (let cx = Math.floor(Math.min(...xs) / CELL); cx <= Math.ceil(Math.max(...xs) / CELL); cx++) {
            const x = cx * CELL + 1, y = cy * CELL + 1; let inside = false;
            for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
              const [xi, yi] = pts[i], [xj, yj] = pts[j];
              if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
            }
            if (inside) put(cx, cy, c === "an3plate" ? 5 : 3);
          }
      }
    }
  }
  const S = new Float32Array((GW + 1) * (GH + 1));            // prefix sums for fast rectangle cost
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) S[(y + 1) * (GW + 1) + x + 1] = g[y * GW + x] + S[y * (GW + 1) + x + 1] + S[(y + 1) * (GW + 1) + x] - S[y * (GW + 1) + x];
  const rect = (x0, y0, x1, y1) => {
    const a0 = Math.max(0, Math.floor(x0 / CELL)), b0 = Math.max(0, Math.floor(y0 / CELL)), a1 = Math.min(GW, Math.ceil(x1 / CELL)), b1 = Math.min(GH, Math.ceil(y1 / CELL));
    if (a1 <= a0 || b1 <= b0) return 0;
    return S[b1 * (GW + 1) + a1] - S[b0 * (GW + 1) + a1] - S[b1 * (GW + 1) + a0] + S[b0 * (GW + 1) + a0];
  };
  const at = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx >= 0 && cy >= 0 && cx < GW && cy < GH ? g[cy * GW + cx] : 0; };
  return { rect, at };
}
const PHASE = { A: [0, .1, .2, .3, .4], B: [.6, .7, .8, .9, 1], all: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] };
const REP = { A: 0, B: 1, all: .5 };
const clash = (a, b) => a === "all" || b === "all" || a === b;
const rectDist = (r, p) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
function layoutFor(key) {
  if (LAYOUT[key]) return LAYOUT[key];
  const a = SAMPLES[key], grids = {}, placed = [];
  const grid = w => grids[w] || (grids[w] = occGrid(a, PHASE[w]));
  const order = (a.cues || []).map((c, i) => i).sort((i, j) => (a.cues[i].when === "all" ? 0 : 1) - (a.cues[j].when === "all" ? 0 : 1));
  const out = [];
  for (const ci of order) {
    const c = a.cues[ci], G = grid(c.when), two = splitTwo(c.text);
    const variants = [[c.text]].concat(two && c.text.length > 12 ? [two] : []);
    const tgt = a.cam(c.pt(a.frame(REP[c.when]).J));
    const tracks = PHASE[c.when].map(u => a.cam(c.pt(a.frame(u).J)));
    let best = null;
    for (const lines of variants) {
    const w = Math.max(...lines.map(textW)), hh = (lines.length - 1) * LINEH;
    for (let ly = 16; ly <= 220 - hh; ly += 3) for (let lx = w / 2 + 3; lx <= 237 - w / 2; lx += 3) {
      const r = [lx - w / 2 - 3, ly - 12, lx + w / 2 + 3, ly + 4 + hh];
      let cost = G.rect(...r) + (lines.length > 1 ? 8 : 0);
      for (const p of placed) if (clash(p.when, c.when)) {
        if (!(r[2] < p.r[0] || r[0] > p.r[2] || r[3] < p.r[1] || r[1] > p.r[3])) cost += 5000;
        for (const q of p.path) if (q[0] > r[0] && q[0] < r[2] && q[1] > r[1] && q[1] < r[3]) cost += 150;   // don't sit on another label's arrow
      }
      const d = rectDist(r, tgt);
      cost += d * 2.5 + (d < 3 ? 40 : 0);                   // no arrows: sit right beside the part
      if (NO_ARROWS) {} else if (d > 12) {                                          // the arrow should not cut through the body
        const fx = Math.min(Math.max(tgt[0], lx - w / 2 + 6), lx + w / 2 - 6), fy = tgt[1] < ly ? ly - 13 : ly + 5 + hh;
        const L = Math.hypot(tgt[0] - fx, tgt[1] - fy), n = Math.floor(L / 2);
        for (let k = 0; k < n; k++) {
          const t = k / n, x = fx + (tgt[0] - fx) * t, y = fy + (tgt[1] - fy) * t;
          for (const p of placed) if (clash(p.when, c.when) && x > p.r[0] && x < p.r[2] && y > p.r[1] && y < p.r[3]) cost += 150;   // don't cross another label
          if (L * (1 - t) < 10) break; cost += G.at(x, y) * 1.2;
        }
      }
      if (!best || cost < best.cost) best = { cost, lx, ly, r, w, hh, lines };
    }
    }
    const arrow = !NO_ARROWS && tracks.some(p => rectDist(best.r, p) > 10);
    const path = [];
    if (arrow) {
      const fx = Math.min(Math.max(tgt[0], best.lx - best.w / 2 + 6), best.lx + best.w / 2 - 6), fy = tgt[1] < best.ly ? best.ly - 13 : best.ly + 5 + best.hh;
      for (let k = 0; k <= 20; k++) path.push([fx + (tgt[0] - fx) * k / 20, fy + (tgt[1] - fy) * k / 20]);
    }
    placed.push({ when: c.when, r: best.r, path });
    out[ci] = { lx: +best.lx.toFixed(1), ly: best.ly, w: best.w, hh: best.hh, lines: best.lines, arrow };
  }
  return (LAYOUT[key] = out);
}
function sampleFrame(key, u) {
  const a = SAMPLES[key], { items, J } = a.frame(u), cam = a.cam, L = layoutFor(key), f = n => n.toFixed(1);
  const cues = (a.cues || []).map((c, i) => {
    const o = c.when === "B" ? clamp01((u - .55) / .3) : c.when === "A" ? clamp01((.45 - u) / .3) : 1;
    if (o <= 0) return "";
    const p = cam(c.pt(J)), l = L[i];
    const text = `<text x="${l.lx}" y="${l.ly}" text-anchor="middle">${l.lines.map((t, k) => `<tspan x="${l.lx}" dy="${k ? LINEH : 0}">${t}</tspan>`).join("")}</text>`;
    let arrow = "";
    if (l.arrow) {
      const fx = Math.min(Math.max(p[0], l.lx - l.w / 2 + 6), l.lx + l.w / 2 - 6), fy = p[1] < l.ly ? l.ly - 13 : l.ly + 5 + l.hh;
      const ang = Math.atan2(p[1] - fy, p[0] - fx), tip = [p[0] - Math.cos(ang) * 3, p[1] - Math.sin(ang) * 3];
      const h1 = [tip[0] - Math.cos(ang - .45) * 8, tip[1] - Math.sin(ang - .45) * 8], h2 = [tip[0] - Math.cos(ang + .45) * 8, tip[1] - Math.sin(ang + .45) * 8];
      arrow = `<line x1="${f(fx)}" y1="${f(fy)}" x2="${f(tip[0])}" y2="${f(tip[1])}"/><path d="M${f(tip[0])} ${f(tip[1])}L${f(h1[0])} ${f(h1[1])}L${f(h2[0])} ${f(h2[1])}Z"/>`;
    }
    return `<g class="an-cue" opacity="${o.toFixed(2)}">${arrow}${text}</g>`;
  }).join("");
  return draw3(items, cam) + (a.overlay ? a.overlay(J, cam, u) : "") + cues;
}
// once the app font has loaded, measure again so labels fit the real text
if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { for (const k in LAYOUT) delete LAYOUT[k]; });

const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function find(name) {
  const n = norm(name); if (!n) return null;
  let c = CARDS.find(x => norm(x.title) === n); if (c) return c;
  for (const x of CARDS) for (const [l] of x.keys) if (norm(l) === n) return x;
  return null;
}
if (typeof document !== 'undefined') { const st = document.createElement('style'); st.textContent = ".lib .anim-wrap{background:var(--bg);border-radius:10px;padding:8px 10px 10px}.lib svg.anim{width:100%;max-width:300px;height:auto;display:block;margin:0 auto}.lib .an-cue line{stroke:var(--warn);stroke-width:2}.lib .an-cue path{fill:var(--warn)}.lib .an-cue text{fill:var(--warn);font-size:12px;font-weight:700;font-family:var(--body);paint-order:stroke;stroke:var(--bg);stroke-width:3px;stroke-linejoin:round}.lib .an3{stroke:var(--ink);stroke-width:7;stroke-linecap:round}.lib .an3.far{stroke:var(--muted);opacity:.7}.lib .an3h{fill:var(--ink)}.lib .an3eq{stroke:var(--muted);stroke-width:1.5;opacity:.6}.lib .an3bench{fill:var(--muted);opacity:.5}.lib .an3bar{stroke:var(--accent);stroke-width:4}.lib .an3plate{fill:var(--accent)}.lib .an3grip{fill:var(--accent)}.lib .an3col{stroke:var(--muted);stroke-width:8}.lib .an3eqf{fill:var(--muted)}.lib .an3cable{stroke:var(--muted);stroke-width:2}.lib .an3db{stroke:var(--muted);stroke-width:3}.lib .an3pad{stroke:var(--muted);stroke-width:9;stroke-linecap:round}.lib .an3fly{fill:var(--muted);opacity:.35}.lib .an3pad2{fill:var(--muted);opacity:.55}.lib .an3side{fill:var(--muted);opacity:.85}.lib .an-cap{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;color:var(--muted);margin-top:4px}.lib .an-cap span:last-child{text-align:right}.lib svg.anim\")]{ plays[i].textContent = st.held[i] ? \"\u25b6\" : \"\u275a\u275a\"; }.lib .an3foam{fill:var(--accent);opacity:.22}.lib .an3foamside{fill:var(--accent);opacity:.38}.lib .an3nose{stroke:var(--ink);stroke-width:4;stroke-linecap:round}.lib .an3tape{stroke:var(--warn);stroke-width:3;opacity:.55}.lib .an3ball{fill:var(--warn)}.lib .an3touch{fill:var(--warn)}.lib .an-eye path{fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round}.lib svg.anim\")){ const a = SAMPLES[keyOf(i)]; cards[i].querySelector(\"[data-cap0]\").textContent = a.cap[0]; cards[i].querySelector(\"[data-cap1]\").textContent = a.cap[1]; }.lib .an3rope{stroke:var(--accent);stroke-width:2.5;stroke-linecap:round}.lib .an3band{stroke:var(--done);stroke-width:3.5;stroke-linecap:round}.lib .an3strap{stroke:var(--ink);stroke-width:2;opacity:.75}.lib .an3door{fill:var(--muted);opacity:.32}.lib svg.anim{width:100%;max-width:320px;height:auto;display:block;margin:0 auto}"; document.head.appendChild(st); }
return {
  cards: CARDS,
  guide: c => GUIDES[c.id] || null,
  frame: (k, u) => sampleFrame(k, u),
  anim: k => { const a = SAMPLES[k]; return a ? { cap: a.cap || ["", ""], dur: a.dur || 3000, loop: !!a.loop } : null; },
  phaseAt, find
};
})();