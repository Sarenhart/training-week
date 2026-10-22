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
