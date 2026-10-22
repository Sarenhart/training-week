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
