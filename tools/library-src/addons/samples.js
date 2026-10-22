// ---- Strength review add-ons: incline dumbbell fly, cable lateral raise (+ behind the back), preacher curls.

// incline bench ~30°: back on the pad, feet on the floor
function inclineSeat(J, lean) {
  trunk(J, [0, 50, 0], sag(lean), [0, 0, 1], sag(lean + 12));
  for (const [sd, zz] of SIDES) leg(J, sd, [46, 1, 16 * zz], [0.2, 1, 0]);
  const nb = sag(lean - 90), p1 = V.add(J.pelvis, V.mul(nb, 7)), p2 = V.add(V.add(J.pelvis, V.mul(sag(lean), 74)), V.mul(nb, 7));
  return [box3(-16, 22, 44, 14), ...benchLegs([-10, 14], 44),
    { type: "poly", pts: [[p1[0], p1[1], -14], [p2[0], p2[1], -14], [p2[0], p2[1], 14], [p1[0], p1[1], 14]], cls: "an3pad2", z: -998 },
    L3([p2[0], p2[1] - 4, 0], [p2[0] - 8, 0, 0], "an3eq")];
}
// incline dumbbell fly: soft fixed elbows, arms open in an arc until the chest is stretched, palms facing
function inclineFly(u) {
  const J = {}, lean = -60, front = sag(lean + 90), dir = sag(lean);
  const gear = inclineSeat(J, lean);
  for (const [sd, zz] of SIDES) {
    const Z = [0, 0, zz];
    armDir(J, sd, V.lerp(V.add(front, V.mul(Z, 0.08)), V.add(V.mul(Z, 1), V.mul(front, -0.2)), u),
      V.lerp(V.add(front, V.mul(Z, -0.38)), V.add(V.mul(Z, 1), V.mul(front, 0.35)), u));
  }
  return { items: [...floor3(-70, 80, 70), ...gear, ...body(J), ...db3(J.wriL, dir), ...db3(J.wriR, dir)], J };
}

// cable lateral raise, one arm; behind = cable runs behind the body
function cableLateral(u, behind) {
  const J = {}, t = rad(lerpN(-12, 84, u)), A = [behind ? -16 : 4, 12, -56];
  trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
  const s = J.shoR, dx = behind ? lerpN(-9, 2, u) : 6;
  arm(J, "R", [s[0] + dx, s[1] - 59 * Math.cos(t), s[2] + 5 + 54 * Math.sin(t)], [-0.5, 0.3, 0.6]);
  arm(J, "L", [6, 100, -50], [0, -1, -0.5]);
  return { items: [...floor3(-40, 60, 70), post(A[0], -62, 0, 180), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
}

// preacher curl on a preacher bench: seated, upper arms on the sloped pad, EZ bar
function preacher(u) {
  const J = {}, lean = 14;
  trunk(J, [0, 52, 0], sag(lean), [0, 0, 1], sag(lean - 10));
  for (const [sd, zz] of SIDES) leg(J, sd, [40, 1, 15 * zz], [0.3, 1, 0]);
  const pd = V.norm([0.72, -0.7, 0]), nrm = V.norm([-0.7, -0.72, 0]);
  const ph = lerpN(132, -8, u);
  for (const [sd, zz] of SIDES) {
    const e = V.add(J["sho" + sd], V.add(V.mul(pd, 31), [0, 0, 2 * zz]));
    J["elb" + sd] = e; J["wri" + sd] = V.add(e, V.mul(sag(ph), 30));
  }
  const sm_ = mid3(J.shoL, J.shoR), a = V.add(V.add(sm_, V.mul(pd, 2)), V.mul(nrm, 5)), b = V.add(V.add(sm_, V.mul(pd, 34)), V.mul(nrm, 5));
  const pad = { type: "poly", pts: [[a[0], a[1], -24], [b[0], b[1], -24], [b[0], b[1], 24], [a[0], a[1], 24]], cls: "an3pad2", z: -998 };
  const bar = mid3(J.wriL, J.wriR);
  return { items: [...floor3(-50, 80, 44), box3(-16, 18, 44, 14), ...benchLegs([-10, 12], 44), pad, L3([b[0] - 4, b[1] - 4, 0], [b[0] - 10, 0, 0], "an3col"),
    ...body(J), ...barZ(bar, 22, 6, 19)], J };
}
// incline bench preacher curl: stand behind an incline bench, chest on the top, one arm over the backrest
function inclinePreacher(u) {
  const J = {}, lean = 34;
  trunk(J, [-26, 84, 0], sag(lean), [0, 0, 1], sag(lean - 20));
  standLegs(J, 12, [1, 0, 0], -24);
  const pd = V.norm([0.5, -0.86, 0]);
  const ph = lerpN(150, 8, u);
  const e = V.add(J.shoR, V.add(V.mul(pd, 31), [0, 0, -2]));
  J.elbR = e; J.wriR = V.add(e, V.mul(sag(ph), 30));
  arm(J, "L", V.add(J.chest, [14, -14, -16]), [-0.5, -1, -0.4]);              // free hand holds the top of the bench
  // bench back: top edge at the armpit, sloping down and away (~60°), seat on the far side
  const top = V.add(J.shoR, [2, -4, -12]), bot = [top[0] + 44, 44, 0];
  const pad = { type: "poly", pts: [[top[0], top[1], -16], [bot[0], bot[1], -16], [bot[0], bot[1], 16], [top[0], top[1], 16]], cls: "an3pad2", z: -998 };
  return { items: [...floor3(-70, 110, 44), pad, box3(bot[0], bot[0] + 40, 44, 14), ...benchLegs([bot[0] + 4, bot[0] + 34], 44),
    ...body(J), ...db3(J.wriR, [0, 0, 1])], J };
}

// standing calf raise with a bar on the back (barbell or Smith machine), balls of the feet on a plate/step
function barCalf(u, smith) {
  const J = {}, a = rad(lerpN(-22, 48, u)), toe = 14, stepY = 7;
  const ank = [toe - 12 * Math.cos(a), stepY + 12 * Math.sin(a), 0];
  trunk(J, [ank[0] - 2, ank[1] + 85, 0], sag(2), [0, 0, 1], sag(0));
  for (const [sd, zz] of SIDES) { const A = [ank[0], ank[1], 12 * zz]; leg(J, sd, A, [1, 0, 0], [toe - A[0], stepY - A[1], 0]); }
  const bar = V.add(V.add(J.chest, V.mul(sag(2 - 90), 6)), V.mul(sag(2), -3));
  for (const [sd, zz] of SIDES) arm(J, sd, [bar[0], bar[1], 26 * zz], [-0.4, -1, 0.3 * zz]);
  const items = [...floor3(-50, 60, 56), box3(-4, 18, stepY, 24), { type: "poly", pts: [[18, 0, -24], [18, stepY, -24], [18, stepY, 24], [18, 0, 24]], cls: "an3bench", z: -998 }];
  if (smith) items.push(L3([bar[0] - 14, 0, -50], [bar[0] - 14, 210, -50], "an3eq"), L3([bar[0] - 14, 0, 50], [bar[0] - 14, 210, 50], "an3eq"), L3([bar[0] - 14, bar[1], -50], [bar[0], bar[1], -50], "an3eq"), L3([bar[0] - 14, bar[1], 50], [bar[0], bar[1], 50], "an3eq"));
  return { items: [...items, ...body(J), ...barZ(bar, smith ? 50 : 46, 11, 40)], J };
}


// face-away (Bayesian) cable curl: back to a low pulley, working arm behind the body, upper arm stays put, curl up
function bayesCurl(u) {
  const J = {}, A = [-56, 12, 14];
  trunk(J, [0, 86, 0], sag(6), [0, 0, 1], sag(2));
  for (const [sd, zz] of SIDES) leg(J, sd, [sd === "R" ? -16 : 18, 1, 12 * zz], [1, 0, 0]);
  const ua = V.norm([-0.38, -1, 0.06]), base = Math.atan2(ua[1], ua[0]), bend = rad(lerpN(4, 132, sm(u)));
  J.elbR = V.add(J.shoR, V.mul(ua, 32));
  J.wriR = V.add(J.elbR, [30 * Math.cos(base + bend), 30 * Math.sin(base + bend), 1]);
  arm(J, "L", V.add(J.hipL, [6, -2, -8]), [-0.6, 0, -0.6]);
  return { items: [...floor3(-80, 60, 50), post(A[0], A[2], 0, 190), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
}

// stability-ball crunch: lie back over the ball (abs stretched), curl the ribs toward the hips, lower back over the ball
function ballCrunch(u) {
  const J = {}, pelvis = [12, 59, 0];
  const d = V.norm(V.lerp([-1, -0.1, 0], [-0.75, 0.66, 0], sm(u)));
  trunk(J, pelvis, d, [0, 0, 1], V.norm(V.lerp([-1, 0.15, 0], [-0.5, 0.86, 0], sm(u))));
  for (const [sd, zz] of SIDES) leg(J, sd, [52, 1, 15 * zz], [0, 1, 0]);
  const up = [d[1], -d[0], 0];                        // chest-side normal of the trunk
  for (const [sd, zz] of SIDES) {                       // arms reach toward the knees
    const s0 = J["sho" + sd], k = J["kne" + sd], dir = V.norm([k[0] - s0[0], k[1] - s0[1], 0]);
    arm(J, sd, V.add(s0, V.add(V.mul(dir, 60.5), [0, 0, 2 * zz])), [up[0], up[1], 0.5 * zz]);
  }
  return { items: [...floor3(-60, 80, 44), D3([2, 30, 0], 30, "an3ball"), ...body(J)], J };
}

const SAMPLES = {
  "bcalfs": { cap: ["Smith machine, balls of the feet on a plate", "Heels down for a stretch, then up high"], cam: camera(-22, 12, 112, 208, 0.9), dur: 2600,
    frame: u => barCalf(u, true), cues: [{ when: "A", pt: J => J.ankR, text: "Heels below the toes" }, { when: "B", pt: J => J.ankR, text: "Up on the toes, pause" }] },
  "bcalfb": { cap: ["Barbell on the back, balls of the feet on a plate", "Heels down for a stretch, then up high"], cam: camera(-22, 12, 112, 208, 0.9), dur: 2600,
    frame: u => barCalf(u, false), cues: [{ when: "A", pt: J => J.ankR, text: "Heels below the toes" }, { when: "B", pt: J => J.ankR, text: "Up on the toes, pause" }] },
  "ifly":  { cap: ["Start: dumbbells together over the chest", "Bottom: arms wide, chest stretched"], cam: camera(64, 26, 122, 176, 0.95), dur: 3000,
    frame: inclineFly, cues: [{ when: "all", pt: J => J.elbR, text: "Soft, fixed elbows" }, { when: "B", pt: J => J.chest, text: "Feel the stretch" }] },
  "clat":  { cap: ["Cable in front of the body", "Arm out to shoulder height"], cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame: u => cableLateral(u, false), cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }] },
  "clatb": { cap: ["Cable behind the body, hand behind the hip", "Arm out to shoulder height"], cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame: u => cableLateral(u, true), cues: [{ when: "A", pt: J => J.wriR, text: "Start behind the hip" }] },
  "prch":  { cap: ["Upper arms flat on the pad", "Curl up, lower slowly to almost straight"], cam: camera(-30, 12, 110, 200, 0.95), dur: 3000,
    frame: preacher, cues: [{ when: "all", pt: J => J.elbR, text: "Elbows stay on the pad" }] },
  "iprch": { cap: ["Chest on the top of an incline bench", "Upper arm over the backrest, curl up"], cam: camera(-28, 10, 112, 206, 0.9), dur: 3000,
    frame: inclinePreacher, cues: [{ when: "all", pt: J => J.elbR, text: "Upper arm stays on the pad" }] },
  "bayes": { cap: ["Back to a low pulley, arm behind the body", "Curl up – the upper arm stays still"], cam: camera(-34, 10, 116, 206, 0.88), dur: 2800,
    frame: bayesCurl, cues: [{ when: "A", pt: J => J.elbR, text: "Arm behind you" }, { when: "B", pt: J => J.wriR, text: "Squeeze" }] },
  "bcrunch": { cap: ["Lie back over the ball, abs stretched", "Curl the ribs toward the hips"], cam: camera(-22, 12, 122, 190, 1.0), dur: 2800,
    frame: ballCrunch, cues: [{ when: "A", pt: J => J.chest, text: "Stretch over the ball" }, { when: "B", pt: J => J.chest, text: "Ribs to hips" }] }
};
const CARDS = [
  { title: "Incline dumbbell fly", fam: "Chest · S-01 · stretch-focused", keys: [["Incline fly", "ifly"]] },
  { title: "Cable lateral raise", fam: "Side shoulders · S-03 · two versions", keys: [["Cable in front", "clat"], ["Behind the back", "clatb"]] },
  { title: "Standing calf raise with a bar", fam: "Calves · S-08 · Swap option when the calf machine is busy", keys: [["Smith machine", "bcalfs"], ["Barbell", "bcalfb"]] },
  { title: "Preacher curl", fam: "Biceps · S-05 · new", keys: [["Preacher bench", "prch"], ["Incline bench preacher", "iprch"]] },
  { title: "Face-away cable curl", fam: "Biceps · priority partner to the preacher curl · new", keys: [["Face-away curl", "bayes"]] },
  { title: "Stability-ball crunch", fam: "Abs · priority, phases 1–2 · new", keys: [["Ball crunch", "bcrunch"]] }
];
