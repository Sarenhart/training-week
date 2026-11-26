// ---- Wave 6 (2026-11-16): the 34 exercises that only had the app's own built-in animation – moved into the library unchanged (same 3D engine)
const BIKE = { cam: camera(-18, 10, 95, 200, 1), frame: bikeFrame, loop: true,
  cues: [{ when: "all", pt: J => J.ankR, off: [0, 44], text: "Soft knee at the bottom" }] };
const SAMPLES = {
  "barbell-bench-press": {
    cap: ["Top: arms straight, bar over shoulders", "Bottom: bar to lower chest, elbows ~45°"],
    cam: camera(-28, 22, 118, 150),
    frame(u) {
      const J = {}, by = 44;                          // bench top height
      J.pelvis = [0, by + 5, 0]; J.chest = [50, by + 5, 0]; J.head = [67, by + 8, 0];
      for (const [sd, zz] of [["L", -1], ["R", 1]]) {
        const hand = V.lerp([52, by + 64, 24 * zz], [36, by + 13, 24 * zz], u);        // straight bar path
        limbs(J, sd, [50, by + 5, 17 * zz], hand, [-0.3, -1, 1.1 * zz],               // elbows down and ~45° out
          [0, by + 5, 9 * zz], [-62, 2, 22 * zz], [0.3, 1, 0.3 * zz], [-12, 0, 0]);     // feet planted, toes away from the head
      }
      const bar = [J.wriL, J.wriR], ext = z => [bar[0][0], bar[0][1], z];
      const items = [
        ...floor3(-80, 100, 45),
        { type: "poly", pts: [[-55, by, -12], [78, by, -12], [78, by, 12], [-55, by, 12]], cls: "an3bench", z: -999 },
        L3([-40, 0, 0], [-40, by, 0], "an3eq"), L3([60, 0, 0], [60, by, 0], "an3eq"),
        ...body3(J, "R"),
        L3(ext(-44), ext(44), "an3bar"), D3(ext(-40), 12, "an3plate"), D3(ext(40), 12, "an3plate")
      ];
      return { items, J };
    },
    cues: [
      { when: "B", pt: J => J.elbR, lx: 196, ly: 200, from: [196, 188], text: "Elbows ~45°" },
      { when: "B", pt: J => J.wriL, lx: 60, ly: 40, from: [66, 46], text: "Bar to lower chest" },
      { when: "all", pt: J => J.toeR, lx: 54, ly: 214, from: [46, 204], text: "Feet planted" }
    ],
    dur: 2800
  },
  "barbell-overhead-press": {
    cap: ["Start: bar on the front of the shoulders", "Top: arms locked, bar over mid-foot"],
    cam: camera(-30, 10, 118, 212, 0.84), dur: 3000,
    frame: u => pressFrame(u, { A: (sy, zz) => [13, sy + 5, 22 * zz], B: (sy, zz) => [1, sy + 60, 22 * zz], pole: zz => [1, -1, 0.3 * zz] }),
    cues: [{ when: "B", pt: J => mid3(J.wriL, J.wriR), off: [60, 10], text: "Press straight up" }, { when: "all", pt: J => J.pelvis, off: [62, 16], text: "Squeeze glutes" }]
  },
  "incline-dumbbell-press": {
    cap: ["Top: dumbbells over the shoulders", "Bottom: beside the upper chest, elbows ~45°"],
    cam: camera(-30, 18, 120, 180, 1), dur: 2800,
    frame(u) {
      const J = {}, d = [Math.cos(rad(35)), Math.sin(rad(35)), 0];
      trunk(J, [0, 50, 0], d);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [-40, 1, 20 * zz], [0.2, 1, 0], [-12, 0, 0]);
        const s = J["sho" + sd], hand = V.lerp([s[0] - 2, s[1] + 58, 13 * zz], [s[0] - 6, s[1] + 7, 27 * zz], u);
        arm(J, sd, hand, [-0.3, -1, 1 * zz]);
      }
      const back = V.add(J.chest, V.mul(d, 22));
      const items = [...floor3(-70, 90, 40), box3(-22, 10, 44, 13),
        { type: "poly", pts: [[4, 44, -13], [back[0], back[1] - 7, -13], [back[0], back[1] - 7, 13], [4, 44, 13]], cls: "an3bench", z: -998 },
        ...benchLegs([-14, 30], 44), ...body3(J, "R")];
      for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], [0, 0, 1]));
      return { items, J };
    },
    cues: [{ when: "B", pt: J => J.elbR, off: [50, 34], text: "Elbows ~45°" }, { when: "all", pt: J => J.shoR, off: [-40, -70], text: "Shoulder blades back" }]
  },
  "seated-dumbbell-shoulder-press": {
    cap: ["Start: dumbbells at shoulder height", "Top: arms straight overhead"],
    cam: camera(-30, 10, 112, 206, 0.95), dur: 3000,
    frame: u => pressFrame(u, { seated: true, db: true, A: (sy, zz) => [6, sy + 4, 27 * zz], B: (sy, zz) => [0, sy + 59, 15 * zz], pole: zz => [0.3, -1, 0.9 * zz] }),
    cues: [{ when: "B", pt: J => J.wriR, off: [50, 10], text: "Press straight up" }, { when: "all", pt: J => J.chest, off: [-30, -56], text: "Back on the pad" }]
  },
  "standing-dumbbell-shoulder-press": {
    cap: ["Start: dumbbells at shoulder height", "Top: arms straight overhead"],
    cam: camera(-30, 10, 118, 212, 0.84), dur: 3000,
    frame: u => pressFrame(u, { db: true, A: (sy, zz) => [6, sy + 4, 27 * zz], B: (sy, zz) => [0, sy + 59, 15 * zz], pole: zz => [0.3, -1, 0.9 * zz] }),
    cues: [{ when: "B", pt: J => J.wriR, off: [50, 10], text: "Press straight up" }, { when: "all", pt: J => J.pelvis, off: [-60, 16], text: "Brace, don't lean back" }]
  },
  "dumbbell-lateral-raise": {
    cap: ["Start: arms at your sides", "Top: arms out to shoulder height"],
    cam: camera(-58, 10, 120, 210, 0.9), dur: 3000,
    frame(u) {
      const J = {}, t = rad(lerpN(2, 84, u));
      trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
      for (const [sd, zz] of SIDES) {
        const s = J["sho" + sd];
        arm(J, sd, [s[0] + 4, s[1] - 59 * Math.cos(t), s[2] + zz * (5 + 54 * Math.sin(t))], [0.1, -1, 0]);
      }
      return { items: [...floor3(-40, 60, 60), ...body3(J, "R"), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, off: [-10, -40], text: "Stop at shoulder height" }, { when: "A", pt: J => J.shoL, off: [-50, -30], text: "No shrugging" }]
  },
  "rear-delt-dumbbell-fly": {
    cap: ["Start: hinged, arms hanging", "Top: arms out to the sides"],
    cam: camera(-62, 14, 120, 204, 0.92), dur: 2800,
    frame(u) {
      const J = hingeFrame(0, { leanA: 70, leanB: 70, pA: [-24, 74, 0], pB: [-24, 74, 0] }), t = rad(lerpN(4, 80, u));
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0], s[1] - 58 * Math.cos(t), s[2] + zz * (4 + 54 * Math.sin(t))], [0, 0.3, zz]); }
      return { items: [...floor3(-60, 80, 70), ...body3(J, "R"), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, off: [10, -40], text: "Arms out to the sides" }, { when: "all", pt: J => mid3(J.pelvis, J.chest), off: [-40, -50], text: "Flat back" }]
  },
  "overhead-dumbbell-triceps-extension": {
    cap: ["Bottom: dumbbell behind the head", "Top: arms straight, elbows by the head"],
    cam: camera(-32, 10, 118, 212, 0.86), dur: 2800,
    frame(u) {
      const J = {};
      trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J);
      for (const [sd, zz] of SIDES) arm(J, sd, V.lerp([-12, 152, 5 * zz], [2, 196, 6 * zz], u), [0.3, 1, 0.25 * zz]);
      return { items: [...floor3(-40, 60, 34), ...body3(J, "R"), ...db3(V.add(mid3(J.wriL, J.wriR), [0, 4, 0]), [0, 1, 0])], J };
    },
    cues: [{ when: "all", pt: J => J.elbR, off: [60, 0], text: "Elbows point up" }, { when: "B", pt: J => J.chest, off: [66, 36], text: "Ribs down, no arch" }]
  },
  "ez-bar-skull-crusher": {
    cap: ["Top: arms straight over the chest", "Bottom: bar lowered toward the forehead"],
    cam: camera(-25, 14, 118, 172, 1), dur: 2800,
    frame(u) {
      const J = {}, by = 44, phi = lerpN(14, 146, u);
      trunk(J, [0, by + 5, 0], [1, 0, 0], [0, 0, 1], [1, 0.1, 0]);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [-62, 2, 22 * zz], [0.3, 1, 0.3 * zz], [-12, 0, 0]);
        const s = J["sho" + sd], elb = V.add(s, V.add(V.mul(sag(14), 32), [0, 0, -3 * zz]));
        J["elb" + sd] = elb; J["wri" + sd] = V.add(elb, V.add(V.mul(sag(phi), 30), [0, 0, -2 * zz]));
      }
      return { items: [...floor3(-80, 100, 45), box3(-55, 78, by, 12), ...benchLegs([-40, 60], by), ...body3(J, "R"), ...barZ(mid3(J.wriL, J.wriR), 30, 9, 26)], J };
    },
    cues: [{ when: "A", pt: J => J.elbR, off: [40, -30], text: "Upper arms still" }, { when: "B", pt: J => J.wriR, off: [40, -50], text: "Lower toward forehead" }]
  },
  "barbell-curl": {
    cap: ["Start: arms straight", "Top: curled up, elbows at your sides"],
    cam: camera(-30, 10, 116, 210, 0.92), dur: 2600,
    frame: u => curlFrame(u, { hz: 19, half: 44, plate: 12 }),
    cues: [{ when: "all", pt: J => J.elbR, off: [50, -10], text: "Elbows at sides" }, { when: "all", pt: J => J.pelvis, off: [-50, 20], text: "No swinging" }]
  },
  "ez-bar-curl": {
    cap: ["Start: arms straight", "Top: curled up, elbows at your sides"],
    cam: camera(-30, 10, 116, 210, 0.92), dur: 2600,
    frame: u => curlFrame(u, { hz: 14, half: 30, plate: 9 }),
    cues: [{ when: "all", pt: J => J.elbR, off: [50, -10], text: "Elbows at sides" }, { when: "all", pt: J => J.pelvis, off: [-50, 20], text: "No swinging" }]
  },
  "dumbbell-curl": {
    cap: ["Start: arms straight, palms forward", "Top: curled up, elbows still"],
    cam: camera(-30, 10, 116, 210, 0.92), dur: 2600,
    frame: u => curlFrame(u, { db: true, hz: 20 }),
    cues: [{ when: "all", pt: J => J.elbR, off: [60, 10], text: "Elbows still" }, { when: "B", pt: J => J.wriR, off: [60, -24], text: "Squeeze at the top" }]
  },
  "dumbbell-hammer-curl": {
    cap: ["Start: arms straight, palms facing in", "Top: curled up, elbows still"],
    cam: camera(-30, 10, 116, 210, 0.92), dur: 2600,
    frame: u => curlFrame(u, { db: true, hz: 20 }),
    cues: [{ when: "all", pt: J => J.elbR, off: [60, 10], text: "Elbows still" }, { when: "B", pt: J => J.wriR, off: [60, -24], text: "Squeeze at the top" }]
  },
  "barbell-bent-over-row": {
    cap: ["Start: hinged ~45°, arms hanging", "End: bar pulled to the belly button"],
    cam: camera(-18, 8, 118, 206, 0.95), dur: 2800,
    frame(u) {
      const J = hingeFrame(0, { leanA: 52, leanB: 52, pA: [-20, 78, 0], pB: [-20, 78, 0] });
      const mt = mid3(J.pelvis, J.chest);
      for (const [sd, zz] of SIDES) {
        const s = J["sho" + sd], A = [s[0] + 2, s[1] - 59, 21 * zz], B = [s[0] + 2, mt[1] - 8, 21 * zz];
        arm(J, sd, V.lerp(A, B, u), [-1, 0.8, 0.3 * zz]);
      }
      return { items: [...floor3(-60, 80, 50), ...body3(J, "R"), ...barZ(mid3(J.wriL, J.wriR))], J };
    },
    cues: [{ when: "all", pt: J => mid3(J.pelvis, J.chest), off: [-30, -60], text: "Flat back" }, { when: "B", pt: J => mid3(J.wriL, J.wriR), off: [50, 44], text: "Pull to the belly button" }]
  },
  "one-arm-dumbbell-row": {
    cap: ["Start: arm hanging straight", "End: dumbbell pulled to the hip"],
    cam: camera(-40, 16, 112, 192, 0.95), dur: 2800,
    frame(u) {
      const J = {};
      trunk(J, [0, 72, 0], [Math.cos(rad(22)), Math.sin(rad(22)), 0], [0, 0, 1], [1, 0.2, 0]);
      leg(J, "L", [-40, 48, -9], [0, -1, 0], [-8, 0, 0]);
      leg(J, "R", [-6, 1, 26], [1, 0, 0]);
      arm(J, "L", [J.shoL[0] + 3, 46, -18], [-1, 0, 0]);
      const s = J.shoR;
      arm(J, "R", V.lerp([s[0], s[1] - 58, s[2] + 2], [s[0] - 16, s[1] - 12, s[2] + 4], u), [-0.5, 1, 0.3]);
      return { items: [...floor3(-80, 90, 40), { type: "poly", pts: [[-50, 44, -24], [64, 44, -24], [64, 44, -2], [-50, 44, -2]], cls: "an3bench", z: -999 }, L3([-40, 0, -13], [-40, 44, -13], "an3eq"), L3([50, 0, -13], [50, 44, -13], "an3eq"), ...body3(J, "R"), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "B", pt: J => J.wriR, off: [50, 30], text: "Pull toward the hip" }, { when: "all", pt: J => J.chest, off: [-10, -70], text: "Flat back, no twisting" }]
  },
  "chest-supported-dumbbell-row": {
    cap: ["Start: arms hanging from the pad", "End: dumbbells pulled up, blades squeezed"],
    cam: camera(-38, 16, 112, 192, 1), dur: 2800,
    frame(u) {
      const J = {}, d = [Math.cos(rad(30)), Math.sin(rad(30)), 0];
      trunk(J, [0, 52, 0], d);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [-34, 1, 14 * zz], [1, -1, 0], [-4, 0, 0]);
        const s = J["sho" + sd];
        arm(J, sd, V.lerp([s[0] + 2, s[1] - 58, s[2] + 3 * zz], [s[0] - 18, s[1] - 12, s[2] + 7 * zz], u), [-0.6, 1, 0.4 * zz]);
      }
      const top = V.add(J.chest, V.mul(d, 10));
      const items = [...floor3(-70, 100, 40), { type: "poly", pts: [[0, 44, -12], [top[0] + 4, top[1] - 8, -12], [top[0] + 4, top[1] - 8, 12], [0, 44, 12]], cls: "an3bench", z: -999 },
        L3([6, 0, 0], [6, 44, 0], "an3eq"), L3([40, 0, 0], [top[0] - 4, top[1] - 14, 0], "an3eq"), ...body3(J, "R")];
      for (const sd of ["L", "R"]) items.push(...db3(J["wri" + sd], [0, 0, 1]));
      return { items, J };
    },
    cues: [{ when: "A", pt: J => J.chest, off: [30, -60], text: "Chest stays on the pad" }, { when: "B", pt: J => mid3(J.shoL, J.shoR), off: [-50, -50], text: "Squeeze blades" }]
  },
  "barbell-hip-thrust": {
    cap: ["Bottom: hips low, upper back on the bench", "Top: flat from shoulders to knees"],
    cam: camera(-18, 10, 108, 190, 1), dur: 2800,
    frame(u) {
      const J = {}, S = [-8, 46, 0], a = rad(lerpN(38, -2, u));
      const pelvis = [S[0] + 50 * Math.cos(a), S[1] - 50 * Math.sin(a), 0];
      trunk(J, pelvis, V.sub(S, pelvis), [0, 0, 1], V.add(V.norm(V.sub(S, pelvis)), [0, 0.7, 0]));
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [84, 1, 14 * zz], [0, 1, 0]);
        arm(J, sd, V.add(pelvis, [2, 9, 22 * zz]), [0, 1, 0.3 * zz]);
      }
      return { items: [...floor3(-80, 110, 44), box3(-72, -10, 40, 16), ...benchLegs([-62, -20], 40), ...body3(J, "R"), ...barZ(V.add(pelvis, [2, 10, 0]))], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.kneR, J.ankR), off: [44, -10], text: "Shins vertical" }, { when: "B", pt: J => J.pelvis, off: [-20, -64], text: "Squeeze glutes" }]
  },
  "kettlebell-swing": {
    cap: ["Bottom: hinge, bell between the legs", "Top: hips snap forward, bell to chest height"],
    cam: camera(-15, 8, 112, 208, 0.92), dur: 2000,
    frame(u) {
      const J = hingeFrame(u, { leanA: 62, leanB: -3, pA: [-24, 79, 0], pB: [0, 86, 0] });
      const P0 = [-14, 44, 0], P1 = [48, 50, 0], P2 = [60, 124, 0], k = u;
      const hand = V.add(V.add(V.mul(P0, (1 - k) * (1 - k)), V.mul(P1, 2 * k * (1 - k))), V.mul(P2, k * k));
      for (const [sd, zz] of SIDES) arm(J, sd, V.add(hand, [0, 0, 3 * zz]), [0, -1, 0]);
      const hm = mid3(J.wriL, J.wriR), dirv = V.norm(V.sub(hm, mid3(J.shoL, J.shoR))), bell = V.add(hm, V.mul(dirv, 12));
      return { items: [...floor3(-60, 90, 34), ...body3(J, "R"), L3(hm, bell, "an3db"), D3(bell, 9, "an3plate")], J };
    },
    cues: [{ when: "A", pt: J => J.pelvis, off: [-40, -50], text: "Hinge, don't squat" }, { when: "B", pt: J => J.pelvis, off: [-50, 10], text: "Snap the hips" }]
  },
  "farmer-s-carry": {
    cap: ["Walk tall with heavy weights", "Short, steady steps"],
    cam: camera(-35, 10, 112, 208, 0.92), dur: 1400, loop: true,
    frame(u) {
      const J = {}, ph = u * Math.PI * 2;
      trunk(J, [0, 86 - 1.5 * Math.abs(Math.sin(ph)), 0], [0, 1, 0]);
      for (const [sd, zz] of SIDES) {
        const s = sd === "L" ? 1 : -1;
        leg(J, sd, [14 * s * Math.sin(ph), 1 + 6 * Math.max(0, s * Math.cos(ph)), 12 * zz], [1, 0, 0]);
        arm(J, sd, V.add(J["sho" + sd], [2, -59, 6 * zz]), [-1, 0, 0]);
      }
      return { items: [...floor3(-50, 60, 34), ...body3(J, "R"), ...db3(J.wriL, [1, 0, 0]), ...db3(J.wriR, [1, 0, 0])], J };
    },
    cues: [{ when: "all", pt: J => J.head, off: [60, 0], text: "Stand tall" }, { when: "all", pt: J => J.shoR, off: [66, 30], text: "Shoulders back" }]
  },
  "machine-row": {
    cap: ["Start: arms stretched forward", "End: handles to the ribs, shoulder blades squeezed"],
    cam: camera(-22, 10, 92, 196, 1), dur: 2800,
    frame(u) {
      const J = {};
      trunk(J, [0, 50, 0], [0.05, 1, 0]);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, [48, 16, 12 * zz], [0.3, 1, 0], [4, 10, 0]);
        arm(J, sd, V.lerp([64, 104, 15 * zz], [16, 100, 23 * zz], u), [-1, 0.2, 0.5 * zz]);
      }
      const items = [...floor3(-30, 110, 36), box3(-20, 16, 44, 14), ...benchLegs([-12, 8], 44),
        { type: "poly", pts: [[20, 72, -10], [20, 114, -10], [20, 114, 10], [20, 72, 10]], cls: "an3bench", z: -998 },
        L3([56, 0, 0], [56, 26, 0], "an3eq"), ...body3(J, "R")];
      for (const sd of ["L", "R"]) items.push(L3(J["wri" + sd], [J["wri" + sd][0] + 8, 160, J["wri" + sd][2]], "an3eq"), D3(J["wri" + sd], 4, "an3grip"));
      return { items, J };
    },
    cues: [{ when: "B", pt: J => mid3(J.shoL, J.shoR), off: [-20, -60], text: "Squeeze shoulder blades" }, { when: "A", pt: J => J.chest, off: [60, -40], text: "Chest on the pad" }]
  },
  "lying-hamstring-curl": {
    cap: ["Start: legs straight", "Top: heels curled toward the glutes"],
    cam: camera(-20, 14, 122, 182, 1), dur: 2800,
    frame(u) {
      const J = {}, phi = rad(lerpN(180, 68, u));
      trunk(J, [0, 50, 0], [1, 0, 0], [0, 0, 1], [1, 0.4, 0]);
      const items = [...floor3(-100, 100, 40), box3(-40, 88, 44, 13), ...benchLegs([-26, 70], 44)];
      for (const [sd, zz] of SIDES) {
        const kne = V.add(J["hip" + sd], [-44, 0, 0]), ank = V.add(kne, [42 * Math.cos(phi), 42 * Math.sin(phi), 0]);
        J["kne" + sd] = kne; J["ank" + sd] = ank; J["toe" + sd] = V.add(ank, [12 * Math.cos(phi + Math.PI / 2), 12 * Math.sin(phi + Math.PI / 2), 0]);
        arm(J, sd, [74, 44, 20 * zz], [0, -1, 0.3 * zz]);
      }
      const pad = V.add(mid3(J.ankL, J.ankR), [7 * Math.cos(phi - Math.PI / 2), 7 * Math.sin(phi - Math.PI / 2), 0]);
      items.push(L3(V.add(J.kneL, [0, -6, -16]), V.add(pad, [0, 0, -16]), "an3eq"), ...body3(J, "R"), L3(V.add(pad, [0, 0, -14]), V.add(pad, [0, 0, 14]), "an3pad"));
      return { items, J };
    },
    cues: [{ when: "all", pt: J => J.pelvis, off: [30, -60], text: "Hips stay down" }, { when: "B", pt: J => J.ankR, off: [-10, -40], text: "Heels to glutes" }]
  },
  "standing-calf-raise": {
    cap: ["Bottom: heels below the step", "Top: high on the toes, pause"],
    cam: camera(-25, 10, 112, 212, 0.9), dur: 2600,
    frame(u) {
      const J = {}, al = rad(lerpN(198, 126, u));
      const ank = zz => [14 + 16 * Math.cos(al), 12 + 16 * Math.sin(al), 12 * zz];
      const a0 = ank(0);
      trunk(J, [a0[0] + 1, a0[1] + 85.5, 0], [0, 1, 0]);
      for (const [sd, zz] of SIDES) {
        leg(J, sd, ank(zz), [1, 0, 0], [0, 0, 0]); J["toe" + sd] = [14, 12, 12 * zz];
        arm(J, sd, V.add(J["sho" + sd], [-4, 5, 11 * zz]), [-0.5, -1, 0.6 * zz]);
      }
      const step = { type: "poly", pts: [[-10, 12, -24], [22, 12, -24], [22, 12, 24], [-10, 12, 24]], cls: "an3bench", z: -999 };
      return { items: [...floor3(-40, 60, 40), step, L3([22, 0, 24], [22, 12, 24], "an3eq"), ...body3(J, "R"), ...barZ(V.add(J.chest, [-8, -3, 0]))], J };
    },
    cues: [{ when: "B", pt: J => J.ankR, off: [60, -10], text: "Rise high, pause" }, { when: "A", pt: J => J.ankR, off: [60, -10], text: "Full stretch" }]
  },
  "seated-calf-raise": {
    cap: ["Bottom: heels low for a stretch", "Top: up on the toes, pause"],
    cam: camera(-25, 10, 100, 190, 1), dur: 2600,
    frame(u) {
      const J = {}, al = rad(lerpN(200, 128, u));
      trunk(J, [-8, 50, 0], [0, 1, 0]);
      for (const [sd, zz] of SIDES) {
        const ank = [48 + 15 * Math.cos(al), 10 + 15 * Math.sin(al), 12 * zz];
        leg(J, sd, ank, [0, 1, 0], [0, 0, 0]); J["toe" + sd] = [48, 10, 12 * zz];
        arm(J, sd, V.add(J["kne" + sd], [-2, 12, 4 * zz]), [-0.5, -1, 0.3 * zz]);
      }
      const pad = V.add(mid3(J.kneL, J.kneR), [0, 8, 0]);
      return { items: [...floor3(-50, 80, 36), box3(-32, 10, 44, 14), ...benchLegs([-24, 2], 44), box3(38, 62, 10, 20), ...body3(J, "R"), L3(V.add(pad, [0, 0, -18]), V.add(pad, [0, 0, 18]), "an3pad")], J };
    },
    cues: [{ when: "B", pt: J => J.ankR, off: [60, -30], text: "Pause at the top" }, { when: "A", pt: J => J.ankR, off: [60, -30], text: "Full stretch" }]
  },
  "cable-pull-through": {
    cap: ["Bottom: hinge, rope between the legs", "Top: stand tall, squeeze the glutes"],
    cam: camera(-15, 8, 140, 208, 0.9), dur: 2800,
    frame(u) {
      const J = hingeFrame(u, { leanA: 62, leanB: -2, pA: [-22, 72, 0], pB: [0, 86, 0] }), anchor = [-112, 10, 0];
      const hand = V.lerp([-8, 40, 0], [10, 80, 0], u);
      for (const [sd, zz] of SIDES) arm(J, sd, V.add(hand, [0, 0, 3 * zz]), [0, -1, 0]);
      return { items: [...floor3(-120, 60, 34), post(-116, 0, 0, 150), D3(anchor, 4, "an3eqf"), L3(anchor, hand, "an3cable"), ...body3(J, "R"), D3(hand, 5, "an3grip")], J };
    },
    cues: [{ when: "A", pt: J => J.pelvis, off: [-30, -60], text: "Hinge at the hips" }, { when: "B", pt: J => J.pelvis, off: [60, 10], text: "Squeeze glutes" }]
  },
  "pull-up": {
    cap: ["Start: full hang, arms straight", "Top: chin over the bar"],
    cam: camera(-30, 10, 112, 214, 0.8), dur: 3000,
    frame: u => pullupFrame(u, {}),
    cues: [{ when: "B", pt: J => J.head, off: [60, 20], text: "Chin over the bar" }, { when: "A", pt: J => J.elbR, off: [60, 20], text: "Full hang" }]
  },
  "weighted-pull-up": {
    cap: ["Start: full hang, weight on a belt", "Top: chin over the bar"],
    cam: camera(-30, 10, 112, 214, 0.8), dur: 3000,
    frame: u => pullupFrame(u, { weight: true }),
    cues: [{ when: "B", pt: J => J.head, off: [60, 20], text: "Chin over the bar" }, { when: "all", pt: J => J.ankR, off: [60, 0], text: "Legs still" }]
  },
  "parallel-bar-dips": {
    cap: ["Top: arms straight, shoulders down", "Bottom: upper arms parallel to the floor"],
    cam: camera(-35, 10, 110, 208, 0.88), dur: 2800,
    frame(u) {
      const J = {}, lean = lerpN(6, 22, u), chest = V.lerp([4, 180, 0], [14, 151, 0], u), d = sag(lean);
      trunk(J, V.sub(chest, V.mul(d, 50)), d);
      for (const [sd, zz] of SIDES) {
        arm(J, sd, [4, 120, 22 * zz], [-1, 0, 0.2 * zz]);
        leg(J, sd, V.add(J.pelvis, [-26, -68, 5 * zz]), [1, 0, 0], [4, -10, 0]);
      }
      const bars = [];
      for (const zz of [-1, 1]) bars.push(L3([-24, 120, 22 * zz], [44, 120, 22 * zz], "an3col"), post(36, 22 * zz, 0, 120));
      return { items: [...floor3(-40, 70, 40), ...bars, ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.elbR, off: [40, 44], text: "Upper arms parallel" }, { when: "all", pt: J => J.shoR, off: [60, -30], text: "Shoulders down" }]
  },
  "close-grip-push-up": {
    cap: ["Top: arms straight, body in a line", "Bottom: chest to the floor, elbows tucked"],
    cam: camera(-35, 16, 140, 170, 0.95), dur: 2600,
    frame: u => pushupFrame(u, { hz: 12, pole: zz => [-1, 0.2, 0.2 * zz] }),
    cues: [{ when: "B", pt: J => J.elbR, off: [30, 40], text: "Elbows tucked in" }, { when: "all", pt: J => J.pelvis, off: [0, -60], text: "Straight body line" }]
  },
  "hanging-knee-raise": {
    cap: ["Start: hanging still", "Top: knees up, pelvis curled"],
    cam: camera(-25, 10, 110, 214, 0.8), dur: 2800,
    frame(u) {
      const J = {}, by = 214, chest = [0, by - 60, 0], tilt = lerpN(0, -14, u), d = sag(tilt);
      trunk(J, V.sub(chest, V.mul(d, 50)), d);
      for (const [sd, zz] of SIDES) {
        arm(J, sd, [0, by, 24 * zz], [0, -1, 0.5 * zz]);
        leg(J, sd, V.lerp([3, J.pelvis[1] - 85, 8 * zz], [44, J.pelvis[1] - 10, 8 * zz], u), [1, 0.4, 0], [10, -5, 0]);
      }
      return { items: [L3([0, by, -56], [0, by, 56], "an3col"), ...body3(J, "R")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, off: [-60, 20], text: "Curl the pelvis up" }, { when: "all", pt: J => J.ankR, off: [50, 10], text: "No swinging" }]
  },
  "ab-wheel-rollout": {
    cap: ["Start: kneeling, wheel under the shoulders", "Out: roll forward, back stays flat"],
    cam: camera(-15, 14, 70, 188, 0.95), dur: 3200,
    frame(u) {
      const J = {}, pelvis = V.lerp([15, 45, 0], [40, 23, 0], u), chest = V.lerp([60, 66, 0], [90, 24, 0], u), wheel = V.lerp([60, 9, 0], [146, 9, 0], u);
      trunk(J, pelvis, V.sub(chest, pelvis), [0, 0, 1], V.add(V.norm(V.sub(chest, pelvis)), [0, -0.4, 0]));
      for (const [sd, zz] of SIDES) {
        J["kne" + sd] = [0, 4, 9 * zz]; J["ank" + sd] = [-42, 4, 9 * zz]; J["toe" + sd] = [-48, 1, 9 * zz];
        arm(J, sd, V.add(wheel, [0, 0, 8 * zz]), [0, 1, 0]);
      }
      return { items: [...floor3(-60, 170, 30), ...body3(J, "R"), L3(V.add(wheel, [0, 0, -12]), V.add(wheel, [0, 0, 12]), "an3db"), D3(wheel, 9, "an3plate")], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.pelvis, J.chest), off: [-20, -60], text: "Don't let the back sag" }, { when: "all", pt: J => J.kneR, off: [30, 30], text: "Pad under the knees" }]
  },
  "dead-bug": {
    cap: ["Start: arms up, knees over hips", "Reach: opposite arm and leg out low"],
    cam: camera(-32, 26, 118, 170, 1), dur: 3200,
    frame(u) {
      const J = {};
      trunk(J, [0, 6, 0], [1, 0, 0], [0, 0, 1], [1, 0.35, 0]);
      for (const [sd, zz] of SIDES) {
        const s = J["sho" + sd], h = J["hip" + sd];
        const handA = V.add(s, [0, 58, 0]), handB = V.add(s, [58, 8, 0]);
        const ankA = V.add(h, [-42, 44, 0]), ankB = V.add(h, [-84, 8, 0]);
        arm(J, sd, sd === "R" ? V.lerp(handA, handB, u) : handA, [-1, 0, 0]);
        leg(J, sd, sd === "L" ? V.lerp(ankA, ankB, u) : ankA, [1, 1, 0], [0, 8, 0]);
      }
      return { items: [...floor3(-110, 110, 36), ...body3(J, "all")], J };
    },
    cues: [{ when: "all", pt: J => mid3(J.pelvis, J.chest), off: [0, 40], text: "Low back pressed down" }, { when: "B", pt: J => J.wriR, off: [10, -44], text: "Opposite arm & leg" }]
  },
  "side-plank": {
    cap: ["Start: hips down, forearm under the shoulder", "Hold: lift the hips to one straight line"],
    cam: camera(-30, 20, 160, 176, 1.15), dur: 3400,
    frame(u) {
      const J = {}, lat = [0, -1, 0], sx = 40;
      const elbR = [sx, 3, 0], shoR = [sx, 35, 0], chest = V.sub(shoR, V.mul(lat, 18));
      const fx = sx - 128.5, ank = [lerpN(fx + 12, fx, u), 8.5, 0];
      const pelvis = ik3(chest, ank, 50, 86, [0, -1, 0]).mid;
      trunk(J, pelvis, V.sub(chest, pelvis), lat, V.add(V.norm(V.sub(chest, pelvis)), [0, 0.2, 0]));
      J.elbR = elbR; J.wriR = [sx, 3, 28];
      arm(J, "L", V.add(J.shoL, [1, 60, 2]), [1, 0, 0]);
      for (const sd of ["L", "R"]) {
        const a = V.add(ank, V.mul(lat, sd === "R" ? 4.5 : -4.5));
        J["ank" + sd] = a; J["kne" + sd] = V.lerp(J["hip" + sd], a, 44 / 86); J["toe" + sd] = V.add(a, [0, 0, 12]);
      }
      return { items: [...floor3(-110, 70, 30), ...body3(J, "all")], J };
    },
    cues: [{ when: "B", pt: J => J.pelvis, off: [-30, -50], text: "Straight line" }, { when: "A", pt: J => J.pelvis, off: [-30, -50], text: "Don't let hips sag" }, { when: "all", pt: J => J.elbR, off: [20, 30], text: "Elbow under shoulder" }]
  },
  "bike-or-rower": { ...BIKE, cap: ["Easy pace for most of it", "Last 5 minutes a bit harder"], dur: 1300 },
  "bike-rower-or-incline-walk": { ...BIKE, cap: ["Easy pace on the bike, rower or treadmill", "You should still be able to talk"], dur: 1400 },
  "bike-intervals": { ...BIKE, cap: ["Hard: spin fast for 30 s", "Easy: 60 s to recover"], dur: 800 },
  "push-up": {
    cap: ["Top: arms straight, body in a line", "Bottom: chest near the floor, elbows ~45°"],
    cam: camera(-35, 16, 140, 170, 0.95), dur: 2600,
    frame: u => pushupFrame(u, { hz: 24, pole: zz => [-0.6, 0.3, 0.9 * zz] }),
    cues: [{ when: "B", pt: J => J.elbR, off: [30, 40], text: "Elbows ~45°" }, { when: "all", pt: J => J.pelvis, off: [0, -60], text: "Hips in line" }]
  },
  "face-pull": {
    cap: ["Start: arms straight toward the cable", "End: pull to the forehead, elbows high and wide"],
    cam: camera(-34, 16, 96, 196),
    frame(u) {
      const J = {}, ay = 140;                         // cable anchor height
      J.pelvis = [0, 86, 0]; J.chest = [-3, 136, 0]; J.head = [-2, 153, 0];
      for (const [sd, zz] of [["L", -1], ["R", 1]]) {
        const hand = V.lerp([57, 138, 5 * zz], [7, 151, 17 * zz], u);                  // straight path to the forehead
        limbs(J, sd, [-3, 136, 18 * zz], hand, [-0.4, 0.7, 1.2 * zz],                  // elbows up and out
          [0, 86, 9 * zz], [1, 2, 12 * zz], [1, 0, 0], [12, 0, 0]);
      }
      const A = [118, ay, 0];
      const items = [
        ...floor3(-40, 140, 40),
        L3([124, 0, 0], [124, 170, 0], "an3col"), D3(A, 4, "an3eqf"),
        ...body3(J, "R"),
        L3(A, V.lerp(J.wriL, J.wriR, .5), "an3cable"), L3(V.lerp(J.wriL, J.wriR, .5), J.wriL, "an3cable"), L3(V.lerp(J.wriL, J.wriR, .5), J.wriR, "an3cable"),
        D3(J.wriL, 4, "an3grip"), D3(J.wriR, 4, "an3grip")
      ];
      return { items, J };
    },
    cues: [
      { when: "B", pt: J => J.elbR, lx: 152, ly: 100, from: [140, 90], text: "Elbows high" },
      { when: "B", pt: J => J.wriL, lx: 66, ly: 20, from: [70, 26], text: "Hands to forehead" },
      { when: "all", pt: J => J.pelvis, lx: 164, ly: 204, from: [132, 196], text: "Don't lean back" }
    ],
    dur: 2600
  },
  "pallof-press": {
    cap: ["Start: handle at the chest", "Press out and hold, no twisting"],
    cam: camera(-58, 10, 150, 210, 0.9), dur: 3200,
    frame(u) {
      const J = {}, anchor = [4, 122, -120];
      trunk(J, [0, 86, 0], [0, 1, 0]); standLegs(J, 17);
      const hand = V.lerp([16, 121, 0], [60, 121, 0], u);
      for (const [sd, zz] of SIDES) arm(J, sd, V.add(hand, [0, 0, 3 * zz]), [0, -1, 0.4 * zz]);
      return { items: [...floor3(-40, 80, 130), post(4, -126, 0, 175), D3(anchor, 4, "an3eqf"), ...body3(J, "R"), L3(anchor, hand, "an3cable"), D3(hand, 5, "an3grip")], J };
    },
    cues: [{ when: "B", pt: J => J.chest, off: [30, -50], text: "Don't let it twist you" }, { when: "all", pt: J => J.pelvis, off: [-60, 20], text: "Stomach braced" }]
  },
  "romanian-deadlift": {
    cap: ["Top: stand tall, bar at the thighs", "Bottom: hips back, flat back, bar close to the legs"],
    cam: camera(-18, 8, 116, 206, 0.95), dur: 3000,
    frame(u) {
      const J = hingeFrame(u, { leanA: 2, leanB: 64, pA: [0, 86, 0], pB: [-24, 81, 0] });
      for (const [sd, zz] of SIDES) { const s = J["sho" + sd]; arm(J, sd, [s[0] - 4, s[1] - 60, 20 * zz], [-1, 0, 0]); }
      return { items: [...floor3(-60, 80, 50), ...body3(J, "R"), ...barZ(mid3(J.wriL, J.wriR), 46, 13, 38)], J };
    },
    cues: [{ when: "B", pt: J => mid3(J.pelvis, J.chest), text: "Flat back" }, { when: "B", pt: J => J.pelvis, text: "Hips back" }, { when: "all", pt: J => J.kneR, text: "Soft knees" }]
  }
};
const CARDS = [
  { section: "Free weights" },
  { title: "Barbell bench press", fam: "Free weights", keys: [["Barbell bench press", "barbell-bench-press"]] },
  { title: "Barbell overhead press", fam: "Free weights", keys: [["Barbell overhead press", "barbell-overhead-press"]] },
  { title: "Incline dumbbell press", fam: "Free weights", keys: [["Incline dumbbell press", "incline-dumbbell-press"]] },
  { title: "Seated dumbbell shoulder press", fam: "Free weights", keys: [["Seated", "seated-dumbbell-shoulder-press"]] },
  { title: "Standing dumbbell shoulder press", fam: "Free weights", keys: [["Standing", "standing-dumbbell-shoulder-press"]] },
  { title: "Dumbbell lateral raise", fam: "Free weights", keys: [["Lateral raise", "dumbbell-lateral-raise"]] },
  { title: "Rear-delt dumbbell fly", fam: "Free weights", keys: [["Rear-delt fly", "rear-delt-dumbbell-fly"]] },
  { title: "Overhead dumbbell triceps extension", fam: "Free weights", keys: [["Overhead extension", "overhead-dumbbell-triceps-extension"]] },
  { title: "EZ-bar skull crusher", fam: "Free weights", keys: [["Skull crusher", "ez-bar-skull-crusher"]] },
  { title: "Barbell curl", fam: "Free weights", keys: [["Barbell", "barbell-curl"]] },
  { title: "EZ-bar curl", fam: "Free weights", keys: [["EZ-bar", "ez-bar-curl"]] },
  { title: "Dumbbell curl", fam: "Free weights", keys: [["Dumbbells", "dumbbell-curl"]] },
  { title: "Dumbbell hammer curl", fam: "Free weights", keys: [["Hammer curl", "dumbbell-hammer-curl"]] },
  { title: "Barbell bent-over row", fam: "Free weights", keys: [["Bent-over row", "barbell-bent-over-row"]] },
  { title: "One-arm dumbbell row", fam: "Free weights", keys: [["One-arm row", "one-arm-dumbbell-row"]] },
  { title: "Chest-supported dumbbell row", fam: "Free weights", keys: [["Chest-supported row", "chest-supported-dumbbell-row"]] },
  { title: "Barbell hip thrust", fam: "Free weights", keys: [["Hip thrust", "barbell-hip-thrust"]] },
  { title: "Kettlebell swing", fam: "Free weights", keys: [["Swing", "kettlebell-swing"]] },
  { title: "Romanian deadlift", fam: "Free weights", keys: [["Romanian deadlift","romanian-deadlift"]] },
  { section: "Machines and cables" },
  { title: "Machine row", fam: "Machine / cable", keys: [["Machine row", "machine-row"]] },
  { title: "Lying hamstring curl", fam: "Machine / cable", keys: [["Lying curl", "lying-hamstring-curl"]] },
  { title: "Standing calf raise", fam: "Machine / cable", keys: [["Standing", "standing-calf-raise"]] },
  { title: "Seated calf raise", fam: "Machine / cable", keys: [["Seated", "seated-calf-raise"]] },
  { title: "Cable pull-through", fam: "Machine / cable", keys: [["Pull-through", "cable-pull-through"]] },
  { title: "Face pull", fam: "Machine / cable", keys: [["Face pull","face-pull"]] },
  { title: "Pallof press", fam: "Machine / cable", keys: [["Pallof press","pallof-press"]] },
  { section: "Body weight" },
  { title: "Pull-up", fam: "Body weight", keys: [["Pull-up", "pull-up"], ["Weighted pull-up", "weighted-pull-up"]] },
  { title: "Parallel bar dips", fam: "Body weight", keys: [["Parallel bar dips", "parallel-bar-dips"], ["Assisted parallel bar dips", "parallel-bar-dips"]] },
  { title: "Push-up", fam: "Body weight", keys: [["Push-up","push-up"]] },
  { title: "Close-grip push-up", fam: "Body weight", keys: [["Close-grip push-up", "close-grip-push-up"]] },
  { title: "Hanging knee raise", fam: "Body weight", keys: [["Knee raise", "hanging-knee-raise"]] },
  { title: "Ab wheel rollout", fam: "Body weight", keys: [["Rollout", "ab-wheel-rollout"]] },
  { title: "Dead bug", fam: "Body weight", keys: [["Dead bug", "dead-bug"]] },
  { title: "Side plank", fam: "Body weight", keys: [["Side plank", "side-plank"]] },
  { section: "Cardio" },
  { title: "Bike or rower", fam: "Cardio", keys: [["Bike or rower", "bike-or-rower"], ["Bike, rower or incline walk", "bike-rower-or-incline-walk"], ["Bike intervals", "bike-intervals"]] }
];
