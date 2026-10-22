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
