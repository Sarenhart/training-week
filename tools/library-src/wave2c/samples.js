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
