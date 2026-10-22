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
