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
