const ANCHOR = "Anchor: put the door anchor on the hinge side of a closed door (never the handle side), and lock the door or tell people at home.";
const GUIDES = {
  "Band chest press and fly": {
    steps: [ANCHOR + " Anchor at chest height.", "Stand facing away from the door, a step or two out so the band is tight, one foot in front.", "Press: hands start beside the chest – press forward until the arms are long. Fly: arms start out wide with soft elbows – hug forward until the hands meet.", "Return slowly against the band."],
    avoid: ["Leaning forward to make it easier.", "Letting the band snap the arms back.", "Elbows flaring straight out on the press."],
    tip: "Step further from the door to make it harder."
  },
  "Band row": {
    steps: [ANCHOR + " Anchor at chest height.", "Face the door, step back until the band is tight with arms long.", "Pull the hands to the ribs, elbows close to the body and back past the body.", "Squeeze the shoulder blades, then let the arms go long slowly."],
    avoid: ["Leaning back to pull.", "Shrugging.", "Letting the band pull you forward on the way back."],
    tip: "Step further from the door to make it harder."
  },
  "Band pulldown": {
    steps: [ANCHOR + " Anchor at the top of the door.", "Kneel tall facing the door, arms reaching up toward the anchor.", "Pull the hands down to the upper chest, elbows down to the sides.", "Let the arms go back up slowly."],
    avoid: ["Leaning far back.", "Pulling behind the head.", "Shrugging the shoulders up."],
    tip: "Kneel further from the door to make it harder."
  },
  "Band face pull": {
    steps: [ANCHOR + " Anchor at face height.", "Face the door, arms long, thumbs pointing back toward you.", "Pull toward the face, elbows high and wide, hands ending beside the ears.", "Return slowly."],
    avoid: ["Elbows dropping below the shoulders.", "Leaning back.", "Going heavy – this is a posture exercise."],
    tip: "Squeeze the shoulder blades together for a second at the end."
  },
  "Band Pallof press": {
    steps: [ANCHOR + " Anchor at chest height.", "Stand side-on to the door, feet a bit wider than the hips, hands together at the chest.", "Press the hands straight out from the chest and hold for 2 seconds – don't let the band turn you.", "Bring the hands back to the chest. Do all reps, then turn around."],
    avoid: ["Letting the hips or shoulders turn toward the door.", "Leaning away from the door.", "Holding your breath."],
    tip: "Step further from the door to make it harder."
  },
  "Band pushdown": {
    steps: [ANCHOR + " Anchor at the top of the door.", "Face the door, lean slightly forward, elbows at the sides.", "Push the hands down until the arms are straight.", "Let the hands come back up to chest height slowly – elbows stay put."],
    avoid: ["Elbows moving forward or out.", "Leaning over the hands to push.", "Letting the band snap up."],
    tip: "Step back from the door to make it harder."
  },
  "Band leg curl": {
    steps: [ANCHOR + " Anchor at the bottom of the door.", "Loop the band around both ankles and lie face down, feet toward the door, far enough away that the band is tight.", "Curl the heels up toward the backside.", "Lower slowly."],
    avoid: ["Hips lifting off the floor.", "Letting the legs drop.", "A band that slides up the leg – keep it around the ankles."],
    tip: "Move further from the door to make it harder."
  },
  "Band overhead press": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand at the front of the shoulders.", "Press straight up until the arms are long.", "Lower back to the shoulders slowly."],
    avoid: ["Arching the lower back – keep the ribs down.", "Pressing forward instead of up.", "The band slipping under the feet – check the footing before every set."],
    tip: "Feet wider = tighter band = harder."
  },
  "Band lateral raise": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand at the sides, soft elbows.", "Raise the arms out to the sides to shoulder height.", "Lower slowly."],
    avoid: ["Raising above shoulder height.", "Shrugging.", "Swinging."],
    tip: "Cross the band in front of you for more tension at the top."
  },
  "Band curl": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Hold an end in each hand, palms up, elbows at the sides.", "Curl the hands up toward the shoulders.", "Lower slowly to straight arms."],
    avoid: ["Elbows moving forward.", "Leaning back.", "Letting the band pull the hands down fast."],
    tip: "Feet wider = harder."
  },
  "Band good-morning": {
    steps: ["Stand on the middle of the band, feet hip-width.", "Loop the top of the band behind the shoulders (not on the neck) and hold it at the front of the shoulders.", "Push the hips back with a flat back and soft knees until you feel a stretch in the back of the thighs.", "Stand up by squeezing the glutes."],
    avoid: ["Rounding the back.", "The band sitting on the neck.", "Bending the knees into a squat."],
    tip: "Use a thick band – a light band gives almost no resistance here."
  },
  "Band glute bridge": {
    steps: ["Lie on your back, knees bent, feet flat.", "Lay the band across the hips and hold the ends down on the floor beside you.", "Push through the heels and lift the hips until the body is straight from shoulders to knees.", "Squeeze the glutes at the top, then lower."],
    avoid: ["Arching the lower back at the top.", "Letting the hands come off the floor.", "Knees caving in."],
    tip: "Hold the band closer to the hips to make it tighter."
  },
  "Mini-band glute moves": {
    steps: ["Put the mini band just above the knees.", "Lateral walk: half squat, small steps to the side, knees pushing out against the band. Go one way, then back.", "Clamshell: lie on the side, knees bent, feet together. Open the top knee without rolling back, hold, close.", "Bridge, knees out: glute bridge while pushing the knees out against the band the whole time."],
    levels: ["Lateral walk.", "Clamshell.", "Bridge, knees out."],
    avoid: ["Knees caving in.", "Rolling the hips back in the clamshell.", "Long steps in the lateral walk – keep them small."],
    tip: "Great as a warm-up before squats and lunges."
  },
  "Suspension row": {
    steps: ["Hang the strap anchor over the top of a closed door. Stand on the side the door opens away from you, so pulling presses it shut against the frame. Lock it or tell people at home.", "Hold the handles, walk the feet toward the door and lean back with straight arms and a straight body.", "Pull the chest up to the handles, elbows back.", "Lower slowly."],
    avoid: ["Hips sagging.", "Standing on the side the door opens toward you – it can swing open.", "Letting go of the handles at the bottom."],
    tip: "Feet closer to the door = more body weight = harder."
  },
  "Suspension push-up": {
    steps: ["Anchor as for the row, straps at about mid-shin length.", "Face away from the door, hands on the handles, walk the feet back and lean forward with a straight body.", "Lower the chest between the handles, elbows about 45°.", "Press back up, keeping the handles steady."],
    avoid: ["Hips sagging.", "Handles drifting apart.", "Going too low – stop with the hands beside the chest."],
    tip: "Harder than a floor push-up because the handles move. Stand more upright to make it easier."
  }
};
