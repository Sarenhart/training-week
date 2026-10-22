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
