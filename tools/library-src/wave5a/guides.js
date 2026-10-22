const GUIDES = {
  "Push-up ladder": {
    steps: ["Place the hands a bit wider than the shoulders on the wall, table, chair or floor.", "Walk the feet back until the body is one straight line from head to heels (or knees).", "Lower the chest toward the hands, elbows about 45° from the body.", "Push back up until the arms are long."],
    levels: ["Wall.", "Hands on a heavy table.", "Hands on a sturdy chair pushed against the wall.", "On the knees.", "Full push-up.", "Feet on a chair.", "Full push-up, 3 seconds down."],
    avoid: ["Hips sagging or sticking up.", "Elbows flaring straight out to the sides.", "Using a chair or table that can slide or tip."],
    tip: "When you reach the top of the rep range with reps to spare, the app moves you one step up the ladder."
  },
  "Pike push-up": {
    steps: ["Start in a push-up, then walk the feet in and lift the hips high – the body forms an upside-down V.", "Hands a bit wider than the shoulders, arms long.", "Bend the elbows and lower the top of the head toward the floor, just in front of the hands.", "Push back up to long arms."],
    levels: ["Feet on the floor.", "Feet on a chair pushed against the wall – hips over the shoulders."],
    avoid: ["Letting the hips drop – that turns it into a push-up.", "Elbows flaring straight out.", "Landing on the head – stop a few cm above the floor."],
    tip: "Bend the knees slightly if the backs of the legs are tight."
  },
  "Chair dip": {
    steps: ["Sit on the front edge of a sturdy chair pushed against the wall, hands on the edge beside the hips.", "Slide the hips forward off the seat, arms long.", "Bend the elbows straight back and lower until the upper arms are about level with the floor.", "Press back up."],
    levels: ["Knees bent, feet close.", "Legs straight, heels on the floor."],
    avoid: ["Going deeper than upper arms level – it strains the front of the shoulders.", "Elbows flaring out to the sides.", "Shoulders creeping up to the ears."],
    tip: "Keep the hips close to the chair the whole way. Not used if you chose \"go easy on shoulders\" – you get close-grip push-ups instead."
  },
  "Table row": {
    steps: ["Lie on your back under a heavy, stable table, chest under the edge.", "Hold the edge with both hands, shoulder-width apart.", "Lift the hips so the body is straight, then pull the chest up to the table.", "Lower slowly to long arms."],
    levels: ["Knees bent, feet flat.", "Legs straight, heels on the floor."],
    avoid: ["Light or folding tables, or tables with a loose top – test it first.", "Hips sagging.", "Jerking up with the legs."],
    tip: "Feet further forward = harder. Test the table first by leaning on the edge with your full weight."
  },
  "Prone towel pulldown": {
    steps: ["Lie face down, forehead on a folded towel, arms overhead holding a towel at both ends.", "Pull the towel apart hard so it stays tight, and lift the arms a few cm off the floor.", "Pull the elbows down and back toward the ribs, squeezing the shoulder blades together.", "Reach back out overhead, still pulling the towel apart. Keep the arms off the floor the whole set."],
    avoid: ["Letting the towel go slack.", "Arching the lower back to lift higher.", "Shrugging the shoulders up to the ears."],
    tip: "Pause for a second with the elbows at the ribs. No anchor or furniture needed – safe in any room."
  },
  "Backpack row": {
    steps: ["Fill a backpack with books or water bottles and hold a strap in each hand.", "Soften the knees and hinge forward with a flat back until the chest points at the floor.", "Pull the pack up toward the lower ribs, elbows back toward the hips.", "Lower slowly to long arms."],
    avoid: ["Rounding the back.", "Standing up as you pull.", "Swinging the pack."],
    tip: "Add more books as you get stronger – weigh the pack once so the app can track it."
  },
  "Pull-up negative": {
    steps: ["Put a sturdy chair under a pull-up bar.", "Step up and hold the bar, hands a bit wider than the shoulders. Step or jump so the chin is over the bar.", "Take the feet off the chair and lower yourself slowly – about 4 seconds – to long arms.", "Put the feet back on the chair and step up for the next rep."],
    avoid: ["Dropping through the last part.", "A chair that can tip or a bar that isn't fixed properly.", "Jumping down from the bar."],
    tip: "When 5 slow negatives feel easy, try one full pull-up at the start of the set."
  },
  "Prone Y-T-W raises": {
    steps: ["Lie face down, forehead on a folded towel.", "Put the arms in a Y (forward and out), a T (straight out) or a W (elbows bent toward the ribs).", "Squeeze the shoulder blades together and lift the arms a few cm off the floor, thumbs up.", "Hold for 2 seconds, then lower."],
    levels: ["Y.", "T.", "W.", "All three in a row = one rep."],
    avoid: ["Arching the lower back to lift higher.", "Shrugging the shoulders up to the ears.", "Rushing."],
    tip: "Small lifts are fine – feel it between the shoulder blades."
  },
  "Wall slide": {
    steps: ["Stand with the back, head and backside against a wall, heels a foot away.", "Put the arms up like a goalpost, backs of the elbows and hands on the wall.", "Slide the arms up into a Y, keeping them on the wall.", "Slide back down to the goalpost."],
    avoid: ["The lower back arching off the wall.", "Hands or elbows leaving the wall – only go as high as you can keep contact.", "Shrugging."],
    tip: "A good warm-up before pushing exercises."
  },
  "Squat ladder": {
    steps: ["Feet about shoulder-width, toes slightly out.", "Push the hips back and bend the knees, arms forward for balance.", "Go as deep as the step says, heels down and back straight.", "Stand up by pushing the floor away."],
    levels: ["Sit back to a chair and touch it lightly.", "Full squat, thighs at least level with the floor.", "Pause squat – hold 2 seconds at the bottom.", "Split squat – one foot forward, back heel up.", "Back foot on a chair (Bulgarian split squat)."],
    avoid: ["Knees caving inward.", "Heels lifting.", "Dropping fast to the bottom."],
    knee: "With \"go easy on knees\" the ladder stops at the pause squat and you only go as deep as feels fine.",
    tip: "Hands on the hips for the split-squat steps – hold on to a wall if balance is what stops you."
  },
  "Prone superman": {
    steps: ["Lie face down, arms overhead, legs straight.", "Squeeze the glutes.", "Lift the arms, chest and legs a few cm off the floor.", "Hold for 2 seconds, then lower."],
    levels: ["Arms only.", "Legs only.", "Arms and legs together."],
    avoid: ["Lifting as high as you can – a few cm is enough.", "Throwing the head back – look at the floor.", "Holding your breath."],
    tip: "Easier option: lift the opposite arm and leg, one pair at a time."
  },
  "Reverse hyper on a bed": {
    steps: ["Lie face down on a firm bed with the hips at the edge, legs hanging down.", "Hold on to the sides of the mattress.", "Squeeze the glutes and lift straight legs until they're level with the body.", "Lower slowly."],
    avoid: ["Lifting the legs above body level – it pinches the lower back.", "Swinging the legs up.", "A soft bed where the hips sink."],
    tip: "Pause for a second at the top for more glute work."
  },
  "Sliding leg curl": {
    steps: ["Lie on your back on a smooth floor, heels on socks or a small towel.", "Lift the hips into a bridge.", "Slide the heels in toward the backside, keeping the hips up.", "Slide them out slowly to almost straight, then repeat."],
    avoid: ["Hips dropping as the heels slide out.", "Rugs or carpets – the heels must glide.", "Going so fast that you lose control on the way out."],
    tip: "Too hard? Slide in with both legs and out with one, or go only part of the way."
  },
  "Stability-ball leg curl": {
    steps: ["Lie on your back with the heels on top of a stability ball.", "Lift the hips so the body is straight from shoulders to heels.", "Roll the ball in toward the backside, keeping the hips up.", "Roll it out slowly."],
    avoid: ["Hips dropping.", "Arching the lower back at the top.", "Letting the ball roll to the side – arms on the floor help with balance."],
    tip: "Harder: one leg on the ball, the other in the air."
  },
  "Towel isometric curl": {
    steps: ["Stand on the middle of a towel, feet hip-width.", "Hold one end in each hand, palms up, elbows at the sides.", "Curl up to 90° at the elbows so the towel is tight.", "Pull up hard for 10–20 seconds – nothing moves. Rest and repeat."],
    avoid: ["Leaning back.", "Holding your breath – breathe calmly through the hold.", "Elbows drifting forward."],
    tip: "Holds instead of reps: the app counts seconds and asks how hard the last hold felt."
  },
  "Backpack curl and RDL": {
    steps: ["Curl: hold a strap in each hand, palms up, elbows at the sides. Curl the pack up and lower slowly.", "RDL: stand tall, pack in front. Push the hips back with a flat back and soft knees, pack close to the legs.", "Stop when you feel a stretch in the back of the thighs, then stand up by squeezing the glutes."],
    avoid: ["Curl: swinging the body.", "RDL: rounding the back.", "RDL: bending the knees into a squat."],
    tip: "Weigh the packed backpack on a bathroom scale once so the app can track the weight."
  }
};
