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
