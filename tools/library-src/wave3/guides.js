const GUIDES = {
  "Single-leg stand": {
    steps: ["Stand next to a support (rack, wall or bench) on the side of the lifted leg.", "Shift your weight onto one foot and lift the other foot beside the standing calf.", "Keep the standing knee soft, hips level and chest tall.", "Hold for the set time, then switch legs."],
    levels: ["Level 1: feet together (or one foot in front of the other).", "Level 2: one leg, fingertips on the support.", "Level 3: one leg, no support.", "Level 4: one leg with slow head turns, or eyes closed with a hand right by the support.", "Level 5: one leg on the balance pad.", "Level 6: on the pad, slow reaches with the free foot.", "Level 7: on the pad, eyes closed, hand right by the support.", "Level 8: on the pad, catching a ball off the wall."],
    avoid: ["Locking the standing knee.", "Letting the hip of the lifted leg drop.", "Holding your breath."],
    tip: "Look at one fixed spot ahead – it makes holding much easier. Eyes closed is the hardest step, so always keep a hand right by the support for it."
  },
  "Tandem stand & heel-to-toe walk": {
    steps: ["Stand with one foot directly in front of the other, front heel touching the back toes.", "Arms crossed or slightly out, weight evenly on both feet.", "Hold for the set time, then switch which foot is in front.", "For the walk: step so each heel lands right at the other foot's toes, along a straight line."],
    levels: ["Tandem stand on the floor.", "Tandem stand with eyes closed, hand right by the support.", "Tandem stand on the balance pad.", "Heel-to-toe walk forwards, then backwards, then with slow head turns."],
    avoid: ["Leaving a gap between heel and toes.", "Looking down at your feet the whole time.", "Rushing the walk."],
    tip: "A strip of tape on the floor gives you a line to follow."
  },
  "Toe stand & calf-raise hold": {
    steps: ["Stand tall, feet hip-width, hands on the hips or a hand on the support.", "Rise slowly as high as you can onto the balls of the feet.", "Hold the top position for the set time.", "Lower slowly."],
    levels: ["Both feet.", "One leg, hand on the support.", "Both feet with slow arm reaches.", "Both feet on the balance pad."],
    avoid: ["Rolling out onto the little toes.", "Bending the knees to stay up.", "Dropping down fast."],
    tip: "Press through the big toe – it keeps the ankle straight."
  },
  "Split-stance hold": {
    steps: ["Take one normal step forward and keep both feet flat, hip-width apart.", "Weight in the middle, hips and shoulders facing forward.", "Knees soft, chest tall.", "Hold for the set time, then switch which foot is in front."],
    levels: ["Floor.", "Eyes closed, hand right by the support.", "On the balance pad."],
    avoid: ["Feet on one line (that's the tandem stand).", "Twisting the hips toward the back leg.", "Leaning on the front leg."]
  },
  "Single-leg star reach": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Reach the free foot forward and tap the floor lightly with the toes.", "Bring it back, then tap to the side, then behind you.", "Keep going for the set time, then switch legs."],
    levels: ["Floor, small reaches.", "Floor, longer reaches.", "On the balance pad."],
    avoid: ["Putting weight on the tapping foot.", "Locking the standing knee.", "Twisting the hips to reach further."],
    tip: "Reach only as far as you can come back without wobbling."
  },
  "Step and hold": {
    steps: ["Stand in front of a low box or step, next to a support.", "Step up with one foot and drive the other knee up to hip height.", "Hold on one leg for 3 seconds.", "Step back down with control. Do all reps, then switch legs."],
    levels: ["Step forward on the floor and hold.", "Step up onto a low box and hold.", "Step forward and back and hold each time."],
    avoid: ["A box so high that you need to swing up.", "Letting the standing knee cave inward.", "Rushing the hold."],
    knee: "Keep the box low (ankle to mid-shin height) and stop if the knee complains."
  },
  "Lateral step and hold": {
    steps: ["Stand with feet together next to a support.", "Take a step out to the side and land softly on that foot.", "Lift the other foot and hold on one leg for 3 seconds.", "Step back to the start. Do all reps, then switch sides."],
    levels: ["Step out on the floor.", "Step onto the balance pad."],
    avoid: ["Landing stiff-legged.", "Letting the knee fall inward on landing.", "Stepping so far that you can't hold still."]
  },
  "Single-leg stand with a weight": {
    steps: ["Stand on one leg next to a support, holding a light dumbbell (1–4 kg).", "Hold it still, pass it slowly from hand to hand in front of you, or pass it around the body.", "Keep the hips level and chest tall the whole time.", "Hold for the set time, then switch legs."],
    levels: ["Hold the weight in one hand.", "Pass it hand to hand in front.", "Pass it around the body."],
    avoid: ["Leaning toward the weight.", "Going heavy – the point is control, not strength.", "Twisting the hips as the weight goes behind you."],
    tip: "At home: body weight only for beginners – swap the weight for slow arm reaches."
  },
  "Ball toss to a wall": {
    steps: ["Stand on one leg about 1–2 m from a wall, next to a support.", "Toss a light ball against the wall at chest height.", "Catch it with soft arms and a soft standing knee.", "Keep tossing for the set time, then switch legs."],
    levels: ["On the floor, gentle tosses.", "On the balance pad."],
    avoid: ["Throwing hard – soft tosses are enough.", "Stiff arms on the catch.", "Standing too close to the wall."],
    tip: "No ball at home? A rolled-up pair of socks works fine."
  },
  "Small hop and stick": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Make a small hop – a few centimetres is enough.", "Land softly on the ball of the foot, knee bending over the toes.", "Hold the landing still for 3 seconds. Do all reps, then switch legs."],
    levels: ["Small hop in place.", "Hop forward and stick, small hop back.", "Hop sideways and stick, small hop back."],
    avoid: ["Landing on a straight knee.", "Letting the knee fall inward.", "Hopping higher than you can control."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the lateral step and hold instead."
  },
  "Single-leg Romanian deadlift reach": {
    steps: ["Stand on one leg next to a support, standing knee soft.", "Hinge forward from the hips and let the free leg rise straight behind you.", "Keep the body in one line from head to back heel, hips level, arms hanging toward the floor.", "Go until the body is close to level, then stand back up slowly. Do all reps, then switch legs."],
    levels: ["Body weight, fingertips on the support.", "Body weight, no support.", "Light dumbbell in the hand opposite the standing leg."],
    avoid: ["Opening the hip so the back leg turns out.", "Rounding the back to reach lower.", "Locking the standing knee."],
    tip: "For Some and Experienced users. Think \"long line from head to heel\" rather than \"touch the floor\"."
  },
  "Reverse lunge to knee drive": {
    steps: ["Stand tall next to a support.", "Step one foot back into a lunge, back knee close to the floor.", "Push through the front foot and drive the back knee up to hip height in one move.", "Hold on one leg for 3 seconds, then step back into the next lunge. Do all reps, then switch legs."],
    levels: ["Hand on the support.", "No support.", "Holding a light dumbbell in each hand."],
    avoid: ["Letting the front knee cave inward.", "Leaning far forward as you come up.", "Rushing the hold at the top."],
    knee: "Short lunge and only to a comfortable depth. Skipped if you chose \"go easy on knees\".",
    tip: "For Some and Experienced users."
  },
  "Skater bound and stick": {
    steps: ["Stand on one leg, knee and hip slightly bent.", "Jump sideways and land on the other foot, the free leg crossing behind.", "Land softly and hold still for 2 seconds.", "Jump back. Keep going for the set number of reps."],
    levels: ["Small jumps, hold 2 s.", "Longer jumps, hold 2 s.", "Longer jumps, landing on the balance pad."],
    avoid: ["Landing on a straight knee.", "Letting the knee fall inward on landing.", "Jumping further than you can stick."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the lateral step and hold instead.",
    tip: "For Experienced users, from phase 3."
  },
  "March or skip in place": {
    steps: ["Stand tall next to a support, feet hip-width.", "Drive one knee up to hip height while the opposite arm swings forward.", "Put it down and switch – march (step) or skip (small hop on the standing foot each time).", "Keep going for the set time, landing softly on the balls of the feet."],
    levels: ["High-knee march, slow.", "High-knee march, quick.", "Skipping in place.", "Skipping in place, longer sets."],
    avoid: ["Leaning back to get the knee higher.", "Stomping – land quietly.", "Holding your breath."],
    knee: "With \"go easy on knees\": march only, no skipping.",
    tip: "Gets the heart going as well. New: march from phase 2, skipping from phase 4 · Some: skipping from phase 3 · Experienced: skipping from phase 2."
  },
  "Jump lunge": {
    steps: ["Start halfway down in a lunge, one foot forward, back heel up, chest tall.", "Jump straight up explosively and swap the legs in the air.", "Land softly in a lunge with the other foot in front, knees bending to absorb.", "Go straight into the next jump. Keep going for the set time or reps."],
    levels: ["Step switch: stand up, swap feet, lower back into the lunge (no jump).", "Jump lunge with a short pause after each landing.", "Jump lunge, continuous."],
    avoid: ["Landing on straight legs.", "Front knee falling inward.", "Going so fast that the landings get loud."],
    knee: "Skipped if you chose \"go easy on knees\" – you get the step switch at a shallow depth, or the high-knee march.",
    tip: "Gets the heart going and trains landing on one leg under control."
  },
  "Wall sit": {
    steps: ["Stand with your back against a wall, feet about a foot length in front of you.", "Slide down until the thighs are level and the knees are over the ankles.", "Back flat on the wall, arms crossed, breathe calmly.", "Hold for the set time, then slide back up."],
    levels: ["Higher position (thighs not quite level), 20 s.", "Thighs level, 30–45 s.", "One leg straight out (switch legs), 15–20 s."],
    avoid: ["Knees going past the toes.", "Pushing the hands on the thighs.", "Holding your breath."],
    knee: "Stay higher on the wall, where the knee feels fine.",
    tip: "A static hold for the thighs – part of the \"static holds\" block you suggested, together with plank-type core holds."
  },
  "Single-leg Pallof press": {
    steps: ["Set a cable at chest height and stand side-on to it on the leg furthest from the machine.", "Hold the handle at the chest with both hands.", "Press it straight out and hold – the cable tries to turn you, don't let it.", "Bring it back slowly. Do all reps, then turn around and switch legs."],
    levels: ["Light weight, short hold.", "Heavier weight or longer hold.", "On the balance pad."],
    avoid: ["Twisting toward the machine.", "Letting the hip of the lifted leg drop.", "Going so heavy that the standing foot moves."],
    tip: "For Some and Experienced users. Pressure from the side is closer to real life than standing still."
  }
};
