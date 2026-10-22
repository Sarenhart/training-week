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
