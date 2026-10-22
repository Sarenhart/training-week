const GUIDES = {
  "Barbell back squat": {
    steps: ["Set the bar in the rack at chest height. Step under it so it rests on the upper back, not the neck.", "Grip just outside the shoulders, elbows pointing down. Stand up and take two small steps back.", "Feet shoulder-width, toes slightly out. Brace the stomach.", "Sit the hips back and down until the thighs are about level, knees following the toes.", "Push the floor away to stand up, chest staying up."],
    avoid: ["Bar on the neck.", "Knees caving inward.", "Heels lifting off the floor.", "Rounding the lower back at the bottom."],
    knee: "Not used if you chose \"go easy on knees\" – the leg press covers the thighs instead (G2b).",
    tip: "Always squat inside the rack with the safety arms set just below your lowest point."
  },
  "Rear-foot-elevated split squat": {
    steps: ["Stand about a big step in front of a bench, a dumbbell in each hand.", "Put the top of your back foot on the bench.", "Drop straight down until the back knee is close to the floor.", "Push through the front foot to come up. Do all reps, then switch legs."],
    avoid: ["Front foot too close to the bench (knee shoots forward).", "Leaning far forward.", "Bouncing at the bottom."],
    knee: "Go only as deep as the front knee is comfortable.",
    tip: "Find your foot position without weights first."
  },
  "Reverse lunge": {
    steps: ["Stand tall with a dumbbell in each hand.", "Take a long step back and lower until the back knee is close to the floor.", "Front knee stays over the foot, chest tall.", "Push through the front foot to step back to standing. Alternate legs or do all reps on one side."],
    avoid: ["Front knee falling inward.", "Short steps that push the front knee past the toes.", "Slamming the back knee down."],
    knee: "Easier on the knees than forward lunges. Shorten the depth if needed."
  },
  "Sit-to-stand": {
    steps: ["Sit near the front of a bench or chair, feet flat under the knees.", "Arms crossed on the chest.", "Lean forward until your nose is over your toes, then stand all the way up.", "Sit back down slowly, with control."],
    avoid: ["Pushing off with the hands.", "Dropping into the seat.", "Knees falling inward."],
    tip: "A lower seat makes it harder; holding a dumbbell at the chest makes it harder still."
  },
  "Single-leg leg press": {
    steps: ["Sit in the leg press with one foot in the middle of the platform.", "Rest the other foot on the frame or floor.", "Lower the platform until the knee is bent about 90°, lower back still on the pad.", "Push back up until the leg is long but the knee isn't locked. Do all reps, then switch."],
    avoid: ["Locking the knee at the top.", "Going so deep that the lower back lifts.", "Letting the knee drift inward."],
    knee: "Easy to control the depth. Stop where the knee feels fine.",
    tip: "Use a little more than half of your two-leg weight to start."
  },
  "B-stance Romanian deadlift": {
    steps: ["Stand with one foot planted and the other a little behind, toes beside the front heel.", "Hold a dumbbell in each hand, most of the weight on the front leg.", "Push the hips back and lower the dumbbells along the front leg, back flat.", "Squeeze the glute to stand up. Do all reps, then switch."],
    avoid: ["Pushing through the back foot – it's only for balance.", "Rounding the back.", "Bending the front knee more as you go down."],
    knee: "Knees stay nearly still – a good choice while a knee recovers.",
    tip: "A step between a normal RDL and a single-leg RDL."
  },
  "Single-leg hip thrust": {
    steps: ["Sit with the upper back against a bench, one foot flat, the other leg lifted.", "Drive through the heel to lift the hips until they're level with the shoulders.", "Keep both hips level at the top and squeeze the glute.", "Lower under control. Do all reps, then switch."],
    avoid: ["Letting the hip of the lifted leg drop.", "Arching the lower back.", "Pushing through the toes."],
    knee: "Little knee load. Move the foot further out if the knee feels it."
  },
  "Single-leg glute bridge": {
    steps: ["Lie on your back, one knee bent with the foot flat, the other leg straight up at an angle.", "Arms on the floor by your sides.", "Push through the heel and lift the hips until they're level.", "Lower slowly. Do all reps, then switch."],
    avoid: ["Hips tilting to one side.", "Arching the lower back.", "Pushing with the arms."],
    knee: "Very little knee load."
  },
  "Side-lying leg raise": {
    steps: ["Lie on your side, propped on the forearm, legs straight and stacked.", "Turn the top foot slightly so the toes point forward or a little down.", "Lift the top leg to about 30–40°, leading with the heel.", "Lower slowly. Do all reps, then switch sides."],
    avoid: ["Rolling the hips back.", "Swinging the leg up.", "Toes turning up toward the ceiling."],
    tip: "This is the side-hip (glute med) exercise the plan calls \"side-lying hip raise\". Add a mini band above the knees to make it harder."
  },
  "Hip abduction machine": {
    steps: ["Sit with your back against the pad, pads on the outside of the knees.", "Hold the handles and keep the back on the pad.", "Push the knees out as far as is comfortable and pause.", "Let them come back slowly."],
    avoid: ["Leaning forward to move more weight.", "Letting the weight slam back.", "Bouncing at the end."],
    tip: "The side hips are key for standing steady on one leg."
  },
  "Hip adduction machine": {
    steps: ["Sit with your back against the pad, pads on the inside of the knees.", "Start with the knees as wide as is comfortable.", "Squeeze the knees together and pause.", "Let them open slowly."],
    avoid: ["Starting wider than is comfortable.", "Letting the weight snap the legs open.", "Leaning forward."]
  },
  "Standing cable hip abduction": {
    steps: ["Put an ankle strap on, attach it to the low pulley and stand side-on with the strap on the outer leg.", "Hold the machine with the near hand, stand tall.", "Lift the leg out to the side, leading with the heel.", "Bring it back slowly. Do all reps, then switch."],
    avoid: ["Leaning the body away to lift higher.", "Turning the toes up.", "Swinging."],
    tip: "The standing leg works too – it's a balance exercise as well."
  }
};
