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
