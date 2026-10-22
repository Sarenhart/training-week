// ---- Wave 1 samples: same rig, same helpers as the live app
// straight arm resting on the floor: shoulder → hand, elbow on the line between
function floorArm(J, sd, dx, dz) {
  const s = J["sho" + sd], h = [s[0] + dx, 3, s[2] + dz], e = V.lerp(s, h, 32 / 62);
  J["elb" + sd] = e; J["wri" + sd] = h;
}
const blk = (x, z, y, w = 7, cls = "an3bench") => ({ type: "poly", pts: [[x - w, y, z - w], [x + w, y, z - w], [x + w, y, z + w], [x - w, y, z + w]], cls, z: -999 });
// weight stack: plates rest at the bottom and rise by "lift" as the cable is pulled
function stack(x, z, lift) {
  const y0 = 2 + Math.max(0, lift);
  return { top: [x, y0 + 26, z], items: [L3([x - 9, 0, z], [x - 9, 120, z], "an3eq"), L3([x + 9, 0, z], [x + 9, 120, z], "an3eq"),
    { type: "poly", pts: [[x - 7, y0, z], [x + 7, y0, z], [x + 7, y0 + 26, z], [x - 7, y0 + 26, z]], cls: "an3plate" }] };
}
const slerpDir = (a, b, u, r) => V.mul(V.norm(V.lerp(V.norm(a), V.norm(b), u)), r);

// flat bench, lying (same geometry as the app's barbell bench press)
function flatBench(u, A, B, pole) {
  const J = {}, by = 44;
  J.pelvis = [0, by + 5, 0]; J.chest = [50, by + 5, 0]; J.head = [67, by + 8, 0];
  for (const [sd, zz] of SIDES)
    limbs(J, sd, [50, by + 5, 17 * zz], V.lerp(A(zz), B(zz), u), pole(zz), [0, by + 5, 9 * zz], [-62, 2, 22 * zz], [0.3, 1, 0.3 * zz], [-12, 0, 0]);
  const items = [...floor3(-80, 100, 45), box3(-55, 78, by, 12), L3([-40, 0, 0], [-40, by, 0], "an3eq"), L3([60, 0, 0], [60, by, 0], "an3eq"), ...body3(J, "R")];
  return { items, J };
}

// push-up with the hands on a raised surface (incline) or on blocks (deficit)
function pushOn(u, o) {
  const J = {}, P = [-92, 8, 0], L = 136, hy = o.hy;
  const hA = hy + o.top, hB = hy + o.bottom, h = lerpN(hA, hB, u);
  const b = Math.asin((h - P[1]) / L), bA = Math.asin((hA - P[1]) / L), d = [Math.cos(b), Math.sin(b), 0];
  const pelvis = V.add(P, V.mul(d, 86));
  trunk(J, pelvis, d, [0, 0, 1], [d[0], d[1] - 0.25, 0]);
  const xs = P[0] + L * Math.cos(bA);
  for (const [sd, zz] of SIDES) {
    leg(J, sd, [P[0], P[1], 8 * zz], [0, -1, 0], [2, -8, 0]);
    arm(J, sd, [xs, hy + 1, 24 * zz], [-0.6, 0.3, 0.9 * zz]);
  }
  return { J, xs };
}

// 45° leg press seat, shared by leg press and calf raise on the leg press
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

// standing between two cable columns
function cableFly(u, o) {
  const J = {};
  trunk(J, [0, 86, 0], sag(8));
  leg(J, "L", [14, 1, -13], [1, 0, 0]); leg(J, "R", [-16, 1, 13], [1, 0, 0]);
  const ay = o.ay, items = [...floor3(-50, 70, 96)];
  for (const [sd, zz] of SIDES) {
    const s = J["sho" + sd], dA = [o.A[0], o.A[1], o.A[2] * zz], dB = [o.B[0], o.B[1], o.B[2] * zz];
    arm(J, sd, V.add(s, slerpDir(dA, dB, u, 60.5)), [-0.4, -0.3, 1 * zz]);   // ~20° bend, held the whole rep
    items.push(post(-14, 90 * zz, 0, 200), D3([-14, ay, 86 * zz], 4, "an3eqf"));
  }
  items.push(...body3(J, "R"));
  for (const [sd, zz] of SIDES) items.push(L3([-14, ay, 86 * zz], J["wri" + sd], "an3cable"), D3(J["wri" + sd], 4, "an3grip"));
  return { items, J };
}
const FLY_CAM = camera(-62, 12, 120, 206, 0.78);

const SAMPLES = {
  "dumbbell bench press": {
    fam: "Press · flat bench",
    cap: ["Top: dumbbells over the shoulders", "Bottom: beside the chest, elbows ~45°"],
    cam: camera(-28, 22, 118, 150), dur: 2800,
    frame: u => {
      const r = flatBench(u, zz => [52, 106, 15 * zz], zz => [40, 57, 28 * zz], zz => [-0.3, -1, 1.1 * zz]);
      for (const sd of ["L", "R"]) r.items.push(...db3(r.J["wri" + sd], [0, 0, 1]));
      return r;
    },
    cues: [{ when: "B", pt: J => J.elbR, text: "Elbows ~45°" }, { when: "all", pt: J => J.toeR, text: "Feet planted" }, { when: "A", pt: J => J.wriL, text: "Over the shoulders" }]
  },
  "goblet squat": {
    fam: "Squat · to a bench",
    cap: ["Start: stand tall, dumbbell at the chest", "Bottom: sit back until you touch the bench"],
    cam: camera(-30, 10, 120, 212, 0.86), dur: 3000,
    frame(u) {
      const J = {}, lean = lerpN(3, 28, u), pelvis = V.lerp([0, 86, 0], [-30, 49, 0], u);
      trunk(J, pelvis, sag(lean), [0, 0, 1], sag(lean - 22));
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [8, 1, 17 * zz], [1, 0, 0.35 * zz], [12, 0, 2 * zz]);
        arm(J, sd, V.add(J.chest, V.add(V.mul(sag(lean + 90), 15), [0, -10, 5 * zz])), [0.2, -1, 0.5 * zz]);
      }
      const bell = V.add(mid3(J.wriL, J.wriR), [2, 4, 0]);
      return { items: [...floor3(-60, 60, 40), box3(-62, -16, 40, 14), ...benchLegs([-56, -22], 40), ...body3(J, "R"), ...db3(bell, [0, 1, 0], 8)], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Sit back to the bench" }, { when: "all", pt: J => J.kneR, text: "Knees follow the toes" }, { when: "B", pt: J => J.chest, text: "Chest up" }]
  },
  "dumbbell romanian deadlift": {
    fam: "Hinge · dumbbells",
    cap: ["Top: stand tall, soft knees", "Bottom: hips back, flat back, weights close"],
    cam: camera(-18, 8, 116, 206, 0.95), dur: 3000,
    frame(u) {
      const J = hingeFrame(u, { leanA: 2, leanB: 64, pA: [0, 86, 0], pB: [-24, 81, 0] });
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] - 4, s[1] - 60, 14 * zz], [-1, 0, 0]); }
      return { items: [...floor3(-60, 80, 40), ...body3(J, "R"), ...db3(J.wriL, [0, 0, 1]), ...db3(J.wriR, [0, 0, 1])], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.pelvis, J.chest), text: "Flat back" }, { when: "B", pt: J => J.pelvis, text: "Hips back" }, { when: "all", pt: J => J.kneR, text: "Soft knees" }]
  },
  "lat pulldown": {
    fam: "Vertical pull · cable",
    cap: ["Start: arms straight up, wide grip", "End: bar to the upper chest"],
    cam: camera(-30, 10, 116, 220, 0.78), dur: 3000,
    frame(u) {
      const pose = u => {
        const J = {};
        trunk(J, [0, 50, 0], sag(lerpN(-6, -14, u)));
        for (const [sd, zz] of SIDES) {
          leg(J, sd, [42, 1, 16 * zz], [0.3, 1, 0]);
          arm(J, sd, V.lerp([6, 160, 34 * zz], [12, 104, 32 * zz], u), [-0.3, -0.6, 1 * zz]);
        }
        return J;
      };
      const J = pose(u), P = [9, 222, 0], bm = mid3(J.wriL, J.wriR), bm0 = mid3(pose(0).wriL, pose(0).wriR);
      const st = stack(-22, 0, V.len(V.sub(bm, P)) - V.len(V.sub(bm0, P)));
      const pad = V.add(mid3(J.kneL, J.kneR), [-2, 9, 0]);
      return { items: [...floor3(-50, 80, 50), box3(-18, 18, 44, 14), ...benchLegs([-12, 12], 44), post(-34, 0, 0, 226), L3([-34, 226, 0], [12, 226, 0], "an3col"),
        ...st.items, L3([-22, 222, 0], st.top, "an3cable"), D3(P, 4, "an3eqf"), D3([-22, 222, 0], 4, "an3eqf"),
        L3([6, 0, 0], [6, pad[1], 0], "an3eq"), ...body3(J, "R"), L3(V.add(pad, [0, 0, -20]), V.add(pad, [0, 0, 20]), "an3pad"),
        L3(bm, P, "an3cable"), L3(V.add(bm, [0, 0, -40]), V.add(bm, [0, 0, 40]), "an3bar"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Bar to upper chest" }, { when: "B", pt: J => J.elbR, text: "Elbows down to your sides" }, { when: "A", pt: J => J.chest, text: "Lean back a little" }]
  },
  "seated cable row": {
    fam: "Horizontal pull · cable",
    cap: ["Start: arms long, small lean forward", "End: handle to the belly, chest tall"],
    cam: camera(-24, 10, 92, 196, 0.95), dur: 2800,
    frame(u) {
      const pose = u => {
        const J = {}, lean = lerpN(16, -2, u);
        trunk(J, [0, 32, 0], sag(lean));
        for (const [sd, zz] of SIDES) {
          leg(J, sd, [70, 18, 11 * zz], [0, 1, 0], [2, 11, 0]);
          const s = J["sho" + sd];
          arm(J, sd, V.lerp([s[0] + 58, 68, 7 * zz], [18, 62, 11 * zz], u), [-1, 0, 0.3 * zz]);
        }
        return J;
      };
      const J = pose(u), J0 = pose(0), A = [118, 64, 0], hm = mid3(J.wriL, J.wriR), hm0 = mid3(J0.wriL, J0.wriR);
      const st = stack(136, 0, V.len(V.sub(hm, A)) - V.len(V.sub(hm0, A)));
      return { items: [...floor3(-40, 150, 36), box3(-24, 18, 28, 14), ...benchLegs([-16, 10], 28), L3([82, 0, 0], [82, 36, 0], "an3pad"),
        post(122, 0, 0, 170), L3([122, 170, 0], [136, 170, 0], "an3col"), ...st.items, L3([136, 168, 0], st.top, "an3cable"), D3(A, 4, "an3eqf"), D3([136, 168, 0], 4, "an3eqf"),
        ...body3(J, "R"), L3(A, hm, "an3cable"), L3(hm, J.wriL, "an3cable"), L3(hm, J.wriR, "an3cable"), D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.shoL, J.shoR), text: "Squeeze shoulder blades" }, { when: "all", pt: J => J.pelvis, text: "No rocking" }, { when: "B", pt: J => J.wriR, text: "Pull to the belly" }]
  },
  "incline y-raise": {
    fam: "Shoulders · chest on the bench",
    cap: ["Start: arms hanging, chest on the pad", "Top: arms up and out in a Y"],
    cam: camera(-30, 16, 112, 192, 1), dur: 3000,
    frame(u) {
      const J = {}, d = [Math.cos(rad(30)), Math.sin(rad(30)), 0];
      trunk(J, [0, 52, 0], d);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [-34, 1, 14 * zz], [1, -1, 0], [-4, 0, 0]);
        const s = J["sho" + sd];
        arm(J, sd, V.add(s, slerpDir([0.05, -1, 0.06 * zz], [d[0] * 0.85, d[1] * 0.85, 0.52 * zz], u, 59)), [0.4, -1, 0]);   // elbows point to the floor
      }
      const t = V.add(J.chest, V.mul(d, 10)), tx = t[0] + 4, ty = t[1] - 8;
      const items = [...floor3(-70, 110, 50),
        { type: "poly", pts: [[0, 44, -12], [tx, ty, -12], [tx, ty, 12], [0, 44, 12]], cls: "an3pad2", z: -999 },
        { type: "poly", pts: [[0, 44, 12], [tx, ty, 12], [tx, ty - 6, 12], [0, 38, 12]], cls: "an3side", z: -998 },
        { type: "poly", pts: [[-22, 36, -12], [2, 36, -12], [2, 36, 12], [-22, 36, 12]], cls: "an3pad2", z: -999 },
        { type: "poly", pts: [[-22, 36, 12], [2, 36, 12], [2, 31, 12], [-22, 31, 12]], cls: "an3side", z: -998 },
        L3([-10, 0, 0], [-10, 31, 0], "an3eq"), L3([40, 0, 0], [tx - 6, ty - 14, 0], "an3eq"), ...body3(J, "R")];
      for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], [0, 1, 0], 7));
      return { items, J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Thumbs up, arms in a Y" }, { when: "all", pt: J => J.chest, text: "Chest stays on the pad" }]
  },
  "cable fly (mid)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: arms open, slight bend", "End: hands meet at chest height"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 136, A: [0.05, -0.05, 1], B: [1, -0.08, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Hug a big tree" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable fly (low-to-high)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: hands low and wide", "End: scoop up to chest height"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 18, A: [0.1, -0.8, 0.6], B: [1, 0.12, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Scoop up to chest height" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable fly (high-to-low)": {
    fam: "Fly · cable, three heights",
    cap: ["Start: hands high and wide", "End: sweep down toward the hips"],
    cam: FLY_CAM, dur: 3000,
    frame: u => cableFly(u, { ay: 196, A: [0.05, 0.55, 0.85], B: [0.85, -0.55, 0.12] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), text: "Sweep down and in" }, { when: "all", pt: J => J.elbR, text: "Elbows stay slightly bent" }]
  },
  "cable lateral raise": {
    fam: "Lateral raise · cable, one arm",
    cap: ["Start: hand by the opposite hip", "Top: arm out to shoulder height"],
    cam: camera(-60, 10, 126, 210, 0.86), dur: 3000,
    frame(u) {
      const J = {}, t = rad(lerpN(-12, 84, u)), A = [4, 12, -56];
      trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
      const s = J.shoR;
      arm(J, "R", [s[0] + 6, s[1] - 59 * Math.cos(t), s[2] + 5 + 54 * Math.sin(t)], [-0.5, 0.3, 0.6]);
      arm(J, "L", [6, 100, -50], [0, -1, -0.5]);
      return { items: [...floor3(-40, 60, 70), post(4, -62, 0, 180), D3(A, 4, "an3eqf"), ...body3(J, "R"), L3(A, J.wriR, "an3cable"), D3(J.wriR, 4, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }, { when: "A", pt: J => J.shoR, text: "No shrugging" }]
  },
  "lean-away lateral raise": {
    fam: "Lateral raise · dumbbell, one arm",
    cap: ["Start: hold the post, lean away", "Top: arm out to shoulder height"],
    cam: camera(-60, 10, 130, 210, 0.86), dur: 3000,
    frame(u) {
      const J = {}, k = rad(14), up = [0, Math.cos(k), Math.sin(k)], lat = [0, -Math.sin(k), Math.cos(k)];
      trunk(J, [0, 83, -2], up, lat);
      leg(J, "L", [0, 1, -30], [1, 0, 0]); leg(J, "R", [0, 1, -12], [1, 0, 0]);
      arm(J, "L", [4, 112, -56], [0, -1, -0.4]);
      const t = rad(lerpN(2, 84, u)), s = J.shoR;
      arm(J, "R", V.add(V.add(s, [4, 0, 0]), V.add(V.mul(up, -59 * Math.cos(t)), V.mul(lat, 5 + 54 * Math.sin(t)))), V.add(V.add([-0.5, 0, 0], V.mul(up, 0.3)), V.mul(lat, 0.6)));
      return { items: [...floor3(-40, 60, 70), post(4, -62, 0, 180), ...body3(J, "R"), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Stop at shoulder height" }, { when: "all", pt: J => J.wriL, text: "Hold on, lean away" }]
  },
  "side-lying lateral raise": {
    fam: "Lateral raise · lying on the side",
    cap: ["Start: dumbbell resting on the hip", "Top: arm raised to just short of vertical"],
    cam: camera(-14, 22, 120, 176, 1), dur: 3000,
    frame(u) {
      const J = {}, by = 44, dir = [1, 0, 0], lat = [0, 1, 0], front = [0, 0, 1];
      trunk(J, [0, by + 10, 0], dir, lat, [1, 0.1, 0]);
      leg(J, "L", V.add(J.hipL, [-78, 0, 14]), [0, 0, 1], [0, 0, 11]);
      leg(J, "R", V.add(J.hipR, [-80, -8, 6]), [0, 0, 1], [0, 0, 11]);
      arm(J, "L", [J.shoL[0] + 26, by + 3, 16], [0, 0.3, -1]);
      const t = rad(lerpN(6, 78, u)), s = J.shoR;
      arm(J, "R", V.add(s, V.add(V.add(V.mul(dir, -57 * Math.cos(t)), V.mul(lat, 57 * Math.sin(t))), V.mul(front, 6))), [0, 0.2, 1]);
      return { items: [...floor3(-110, 110, 30), box3(-70, 76, by, 14), ...benchLegs([-56, 62], by), ...body3(J, "R"), ...db3(J.wriR, [0, 0, 1], 7)], J };
    },
    cues: [{ when: "A", pt: J => J.wriR, text: "Start at the hip" }, { when: "B", pt: J => J.wriR, text: "Lift slowly, lower slower" }]
  },
  "incline push-up": {
    fam: "Push-up · hands raised",
    cap: ["Top: hands on the bench, body in a line", "Bottom: chest to the bench edge"],
    cam: camera(-35, 16, 140, 186, 0.95), dur: 2600,
    frame(u) {
      const { J, xs } = pushOn(u, { hy: 44, top: 58, bottom: 14 });
      return { items: [...floor3(-110, 80, 40), box3(xs - 10, xs + 16, 44, 34), L3([xs + 3, 0, -28], [xs + 3, 44, -28], "an3eq"), L3([xs + 3, 0, 28], [xs + 3, 44, 28], "an3eq"), ...body3(J, "R")], J };
    },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Straight body line" }, { when: "B", pt: J => J.elbR, text: "Elbows ~45°" }]
  },
  "deficit push-up": {
    fam: "Push-up · hands on blocks",
    cap: ["Top: hands on blocks, body in a line", "Bottom: chest below the hands"],
    cam: camera(-35, 16, 140, 172, 0.95), dur: 2800,
    frame(u) {
      const { J, xs } = pushOn(u, { hy: 14, top: 58, bottom: 2 });
      return { items: [...floor3(-110, 80, 40), blk(xs, -24, 14, 10), blk(xs, 24, 14, 10), ...[-1, 1].flatMap(zz => [{ type: "poly", pts: [[xs - 10, 0, 24 * zz + 10], [xs + 10, 0, 24 * zz + 10], [xs + 10, 14, 24 * zz + 10], [xs - 10, 14, 24 * zz + 10]], cls: "an3bench", z: -998 }, { type: "poly", pts: [[xs - 10, 0, 24 * zz - 10], [xs - 10, 0, 24 * zz + 10], [xs - 10, 14, 24 * zz + 10], [xs - 10, 14, 24 * zz - 10]], cls: "an3bench", z: -998 }]), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.chest, text: "Go below the hands" }, { when: "all", pt: J => J.pelvis, text: "Hips in line" }]
  },
  "dumbbell hip thrust": {
    fam: "Hip thrust · dumbbell",
    cap: ["Bottom: hips low, upper back on the bench", "Top: flat from shoulders to knees"],
    cam: camera(-18, 10, 108, 190, 1), dur: 2800,
    frame(u) {
      const J = {}, S = [-8, 46, 0], a = rad(lerpN(38, -2, u));
      const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
      trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], V.add(V.norm(V.sub(S, pelvis)), [0, 0.7, 0]));
      for (const [sd, zz] of SIDES) { leg(J, sd, [84, 1, 14 * zz], [0, 1, 0]); arm(J, sd, V.add(pelvis, [2, 10, 10 * zz]), [0, 1, 0.6 * zz]); }
      return { items: [...floor3(-80, 110, 44), box3(-72, -10, 40, 16), ...benchLegs([-62, -20], 40), ...body3(J, "R"), ...db3(V.add(pelvis, [2, 12, 0]), [0, 0, 1], 11)], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.kneR, J.ankR), text: "Shins vertical" }, { when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }]
  },
  "glute bridge": {
    fam: "Hip thrust · on the floor",
    cap: ["Bottom: lying, knees bent, feet flat", "Top: hips up, straight from shoulders to knees"],
    cam: camera(-20, 16, 118, 170, 1.1), dur: 2800,
    frame(u) {
      const J = {}, S = [-44, 8, 0], a = rad(lerpN(-2, -32, u));
      const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
      trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], [-1, 0.22, 0]);
      for (const [sd, zz] of SIDES) { leg(J, sd, [46, 1, 14 * zz], [0, 1, 0]); floorArm(J, sd, 60, 9 * zz); }
      return { items: [...floor3(-80, 80, 40), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Squeeze glutes" }, { when: "all", pt: J => J.ankR, text: "Push through the heels" }]
  },
  "back extension (45°)": {
    fam: "Hinge · back-extension bench",
    cap: ["Bottom: hinge down over the pad", "Top: one straight line, no arching"],
    cam: camera(-22, 10, 110, 196, 0.92), dur: 3000,
    frame(u) {
      const J = {}, F = [-40, 10, 0], ld = [Math.cos(rad(45)), Math.sin(rad(45)), 0], pelvis = V.add(F, V.mul(ld, 86));
      const lean = lerpN(126, 45, u), d = sag(lean), front = sag(lean + 90);
      trunk(J, pelvis, d, [0, 0, 1], sag(lean + 8));
      for (const [sd, zz] of SIDES) {
        J["ank" + sd] = [F[0], F[1], 9 * zz]; J["kne" + sd] = V.add(J["ank" + sd], V.mul(ld, 42)); J["toe" + sd] = V.add(J["ank" + sd], [10, -6, 0]);
        arm(J, sd, V.add(V.add(J.chest, V.mul(d, -10)), V.add(V.mul(front, 9), [0, 0, -7 * zz])), V.add(front, [0, 0, 1.2 * zz]));
      }
      const hp = V.add(pelvis, [8, -9, 0]);
      return { items: [...floor3(-70, 90, 36), L3([-50, 0, 0], [-44, 6, 0], "an3eq"), L3([-44, 6, 0], [hp[0], hp[1] - 4, 0], "an3eq"), L3([hp[0], 0, 0], [hp[0], hp[1] - 4, 0], "an3eq"),
        L3([-46, 4, -18], [-46, 4, 18], "an3pad"), L3([-34, 19, -18], [-34, 19, 18], "an3pad"), L3(V.add(hp, [0, 0, -18]), V.add(hp, [0, 0, 18]), "an3pad"), ...body3(J, "R")], J };
    },
    cues: [{ when: "A", pt: J => J.pelvis, text: "Hinge at the hips" }, { when: "B", pt: J => J.chest, text: "Stop in a straight line" }]
  },
  "bird dog": {
    fam: "Core · on hands and knees",
    cap: ["Start: hands under shoulders, knees under hips", "Reach: opposite arm and leg out long"],
    cam: camera(-32, 18, 122, 190, 1), dur: 3400,
    frame(u) {
      const J = {}, d = V.norm([1, 0.35, 0]);
      trunk(J, [0, 48, 0], d, [0, 0, 1], [1, 0.15, 0]);
      for (const [sd, zz] of SIDES) {
        const s = J["sho" + sd], h = J["hip" + sd];
        const handA = [s[0], 2, 16 * zz], handB = V.add(s, [60, 6, -2 * zz]);
        const ankA = [h[0] - 42, 4, 9 * zz], ankB = V.add(h, [-84, 6, 0]);
        arm(J, sd, sd === "R" ? V.lerp(handA, handB, u) : handA, [-1, -1, 0]);   // pole never lines up with the arm, so the elbow can't flip
        leg(J, sd, sd === "L" ? V.lerp(ankA, ankB, u) : ankA, [1, -1, 0], sd === "L" ? V.lerp([-10, 0, 0], [2, -10, 0], u) : [-10, 0, 0]);
      }
      return { items: [...floor3(-110, 110, 36), ...body3(J, "all")], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, text: "Opposite arm & leg" }, { when: "all", pt: J => mid3(J.pelvis, J.chest), text: "Back flat, hips level" }]
  },
  "reverse crunch": {
    fam: "Core · lying on the back",
    cap: ["Start: knees over hips, back on the floor", "Top: curl the hips up toward the chest"],
    cam: camera(-20, 16, 124, 176, 1.1), dur: 2800,
    frame(u) {
      const J = {}, C = [44, 8, 0], a = rad(lerpN(0, 24, u));
      const pelvis = V.add(C, [-50 * Math.cos(a), 50 * Math.sin(a), 0]);
      trunk(J, pelvis, V.sub(C, pelvis), [0, 0, 1], [1, 0.2, 0]);
      const th = rad(lerpN(4, 44, u));
      for (const [sd, zz] of SIDES) {
        const h = J["hip" + sd], kne = V.add(h, [44 * Math.sin(th), 44 * Math.cos(th), 0]), ank = V.add(kne, [-42 * Math.cos(th), 42 * Math.sin(th), 0]);
        J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, [-10 * Math.cos(th), 10 * Math.sin(th), 0]);
        floorArm(J, sd, -60, 9 * zz);
      }
      return { items: [...floor3(-80, 90, 40), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, text: "Curl the hips up" }, { when: "all", pt: J => J.wriR, text: "Slow, no swinging" }]
  },
  "step-up": {
    fam: "Single leg · box",
    cap: ["Start: whole foot on the box", "Top: stand tall on the box"],
    cam: camera(-30, 10, 116, 218, 0.78), dur: 3200,
    frame(u) {
      // The top leg does the work: the body rises first, the back leg leaves the floor only when it has to,
      // trails behind and below the hips, and is set down on the box at the very end.
      const J = {}, bh = 30, sm = t => t * t * (3 - 2 * t), p = sm(clamp01(u / 0.8));
      const pelvis = V.lerp([-4, 84, 0], [16, bh + 85, 0], p);
      trunk(J, pelvis, sag(lerpN(18, 2, p)));
      leg(J, "R", [18, bh + 1, 10], [1, 0, 0]);
      const F = [-14, 1, -10], v = V.sub(F, J.hipL), reach = Math.min(V.len(v), 84 - 12 * p);
      const hang = V.add(J.hipL, V.mul(V.norm(v), reach)), lifted = clamp01((V.len(v) - reach) / 20);
      const k = sm(clamp01((u - 0.8) / 0.2));
      const ankL = V.add(V.lerp(hang, [16, bh + 1, -10], k), [0, 8 * Math.sin(Math.PI * k), 0]);
      leg(J, "L", ankL, [1, 0, 0], V.lerp([12, 0, 0], [4, -10, 0], lifted * (1 - k)));
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, V.add(s, [2, -60, 3 * zz]), [-1, 0, 0]); }
      return { items: [...floor3(-50, 70, 40), box3(0, 40, bh, 22), { type: "poly", pts: [[0, 0, -22], [0, bh, -22], [0, bh, 22], [0, 0, 22]], cls: "an3bench", z: -998 }, { type: "poly", pts: [[0, 0, 22], [40, 0, 22], [40, bh, 22], [0, bh, 22]], cls: "an3bench", z: -998 },
        ...body3(J, "R"), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "A", pt: J => J.ankR, text: "Whole foot on the box" }, { when: "B", pt: J => J.pelvis, text: "Push through the top leg" }]
  },
  "leg press": {
    fam: "Squat pattern · machine",
    cap: ["Bottom: knees bent, lower back on the pad", "Top: legs long, knees still soft"],
    cam: camera(-24, 12, 100, 182, 1), dur: 3000,
    frame(u) {
      const J = {}, items = pressSeat(J), reach = lerpN(50, 80, u);
      for (const [sd, zz] of SIDES) leg(J, sd, V.add(V.add(J["hip" + sd], V.mul(SLED, reach)), [0, 0, 5 * zz]), [0, 1, 0.3 * zz], V.mul(SPERP, 12));
      const c = V.add(mid3(J.ankL, J.ankR), V.mul(SLED, 4));
      return { items: [...items, sledPlate(c), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.kneR, text: "Don't lock the knees" }, { when: "A", pt: J => J.pelvis, text: "Lower back stays down" }]
  },
  "seated hamstring curl": {
    fam: "Knee curl · seated machine",
    cap: ["Start: legs straight, pad behind the ankles", "End: heels pulled down and under"],
    cam: camera(-20, 12, 104, 190, 1), dur: 2800,
    frame(u) {
      const J = {};
      trunk(J, [0, 52, 0], sag(-10));
      const phi = rad(lerpN(-4, -104, u));
      for (const [sd, zz] of SIDES) {
        const kne = V.add(J["hip" + sd], [44, 0, 0]), ank = V.add(kne, [42 * Math.cos(phi), 42 * Math.sin(phi), 0]);
        J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, [12 * Math.cos(phi + Math.PI / 2), 12 * Math.sin(phi + Math.PI / 2), 0]);
        arm(J, sd, [22, 50, 24 * zz], [0, -1, 0.4 * zz]);
      }
      const pad = V.add(mid3(J.ankL, J.ankR), [7 * Math.cos(phi - Math.PI / 2), 7 * Math.sin(phi - Math.PI / 2), 0]), tp = [34, 63, 0];
      return { items: [...floor3(-50, 110, 40), box3(-20, 46, 44, 14), ...benchLegs([-12, 36], 44),
        { type: "poly", pts: [[-18, 44, -14], [-26, 118, -14], [-26, 118, 14], [-18, 44, 14]], cls: "an3bench", z: -998 },
        L3([44, 52, 0], pad, "an3eq"), ...body3(J, "R"), L3(V.add(tp, [0, 0, -18]), V.add(tp, [0, 0, 18]), "an3pad"), L3(V.add(pad, [0, 0, -16]), V.add(pad, [0, 0, 16]), "an3pad")], J };
    },
    cues: [{ when: "all", pt: J => J.pelvis, text: "Hips back in the seat" }, { when: "B", pt: J => J.ankR, text: "Heels down and under" }]
  },
  "single-leg dumbbell calf raise": {
    fam: "Calves · one leg on a step",
    cap: ["Bottom: heel below the step", "Top: high on the toes, pause"],
    cam: camera(-25, 10, 112, 212, 0.9), dur: 2600,
    frame(u) {
      const J = {}, al = rad(lerpN(198, 126, u)), aR = [14 + 16 * Math.cos(al), 12 + 16 * Math.sin(al), 12];
      trunk(J, [aR[0] + 1, aR[1] + 85.5, 3], [0, 1, 0]);
      leg(J, "R", aR, [1, 0, 0], [0, 0, 0]); J.toeR = [14, 12, 12];
      leg(J, "L", [-26, aR[1] + 36, -8], [1, 0, 0], [2, -11, 0]);
      arm(J, "R", V.add(J.shoR, [2, -60, 4]), [-1, 0, 0]);
      arm(J, "L", [42, 124, -24], [0, -1, -0.5]);
      const step = { type: "poly", pts: [[-10, 12, -24], [22, 12, -24], [22, 12, 24], [-10, 12, 24]], cls: "an3bench", z: -999 };
      return { items: [...floor3(-40, 60, 40), step, L3([22, 0, 24], [22, 12, 24], "an3eq"), post(48, -30, 0, 175), ...body3(J, "R"), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.ankR, text: "Rise high, pause" }, { when: "A", pt: J => J.ankR, text: "Full stretch" }, { when: "all", pt: J => J.wriL, text: "Light hand for balance" }]
  },
  "calf raise on the leg press": {
    fam: "Calves · machine",
    cap: ["Bottom: toes on the edge, heels toward you", "Top: push with the toes, pause"],
    cam: camera(-24, 12, 100, 182, 1), dur: 2600,
    frame(u) {
      const J = {}, items = pressSeat(J), th = rad(lerpN(-22, 34, u));
      let tc;
      for (const [sd, zz] of SIDES) {
        leg(J, sd, V.add(V.add(J["hip" + sd], V.mul(SLED, 84)), [0, 0, 5 * zz]), [0, 1, 0.3 * zz]);
        J["toe" + sd] = V.add(J["ank" + sd], V.add(V.mul(SPERP, 13 * Math.cos(th)), V.mul(SLED, 13 * Math.sin(th))));
        tc = J["toe" + sd];
      }
      const c = V.add(mid3(J.toeL, J.toeR), V.add(V.mul(SLED, 3), V.mul(SPERP, -2)));
      return { items: [...items, sledPlate(c), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.toeR, text: "Push with the toes" }, { when: "all", pt: J => J.kneR, text: "Knees straight, not locked" }]
  }
};
