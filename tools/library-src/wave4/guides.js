const TALK = { easy: "Easy – you can talk in full sentences.", steady: "Steady – you can talk in short sentences.", hard: "Hard – only a few words at a time." };
const GUIDES = {
  "Half-kneeling hip-flexor stretch": {
    steps: ["Kneel on one knee (on a mat), the other foot flat in front.", "Tuck the tailbone under and squeeze the glute of the back leg.", "Shift the hips gently forward until you feel a stretch at the front of the back hip.", "Reach the arm on the same side up. Hold and breathe, then switch."],
    avoid: ["Arching the lower back to go further.", "Letting the front knee cave inward.", "Bouncing."],
    tip: "The glute squeeze does most of the work – you need less forward shift than you think."
  },
  "90/90 hip switches": {
    steps: ["Sit on the floor, feet flat and wider than the hips, hands behind you.", "Sit tall.", "Let both knees drop slowly to one side toward the floor.", "Bring them up and over to the other side. Keep it slow and controlled."],
    avoid: ["Rounding the back – lean on the hands if needed.", "Forcing the knees down.", "Rushing."],
    tip: "As it gets easier, take the hands off the floor."
  },
  "Ankle rocks": {
    steps: ["Half-kneel facing a wall, front foot a hand's width from it.", "Keep the front heel on the floor.", "Drive the front knee forward over the toes toward the wall.", "Rock back and repeat. Then switch legs."],
    avoid: ["Lifting the heel.", "Letting the knee drift inward.", "Pushing into pain at the front of the ankle."],
    tip: "Good for: squatting deeper with the heels down, lunges, step-ups, stairs and running. Stiff ankles make the knees and lower back make up for it. Move the foot further from the wall as the ankle loosens up."
  },
  "Open-book upper-back rotation": {
    steps: ["Lie on your side, knees bent and stacked, arms straight out in front.", "Keep the knees together on the floor.", "Sweep the top arm up and over to the other side, letting the chest turn – eyes follow the hand.", "Breathe out at the end, then return. Do all reps, then switch sides."],
    avoid: ["Letting the knees come apart.", "Forcing the arm to the floor.", "Holding your breath."],
    tip: "Great after desk work or before pressing."
  },
  "Deep squat hold": {
    steps: ["Stand with feet a little wider than the hips, toes slightly out.", "Sit down as deep as you can with the heels on the floor.", "Hands together in front, elbows pushing the knees out.", "Breathe calmly and shift gently from side to side."],
    avoid: ["Heels lifting off the floor.", "Collapsing the back completely.", "Pushing through knee pain."],
    knee: "Hold on to a rack or door frame, or sit back onto a low step, to take weight off the knees.",
    tip: "Heels lifting? Put a small plate or book under them for now."
  },
  "Calf stretch": {
    steps: ["Put your hands on a wall, one foot forward and one back.", "Back leg straight, heel pressed to the floor, toes pointing forward.", "Lean in until you feel a stretch in the back calf.", "Hold and breathe, then switch."],
    avoid: ["Back heel lifting.", "Back foot turning out.", "Arching the lower back."],
    tip: "Bend the back knee slightly to stretch the lower calf too."
  },
  "Bike": {
    steps: ["Set the saddle so the knee is slightly bent at the bottom of the pedal stroke.", "Sit tall, light hands on the handlebars.", "Pedal smoothly at a steady cadence (about 70–90 rpm).", "Change the resistance to match the target effort."],
    avoid: ["Saddle so low that the knees come up high.", "Rocking the hips side to side (saddle too high).", "Gripping the bars hard."],
    talk: true, tip: "The app remembers your resistance level for next time."
  },
  "Cross-trainer": {
    steps: ["Step on and stand tall over the pedals.", "Hold the moving handles lightly.", "Push and pull with arms and legs together in a smooth rhythm.", "Change the resistance to match the target effort."],
    avoid: ["Leaning on the handles.", "Going on the toes – keep the whole foot on the pedal.", "Hunching forward."],
    talk: true
  },
  "Incline treadmill walk": {
    steps: ["Start walking at an easy speed, then raise the incline to 5–12. The incline number is the slope in % – most treadmills go from 0 to 15.", "Walk tall with the arms swinging naturally.", "Adjust speed and incline to match the target effort.", "Lower the incline before stopping."],
    avoid: ["Holding the rails – it takes away most of the work.", "Leaning far forward.", "Raising the incline faster than you can handle."],
    talk: true, tip: "Low impact but surprisingly hard – a great choice for knees and for fat loss."
  },
  "Walk–run": {
    steps: ["Warm up with 5 minutes of brisk walking.", "Jog easily for the set time, then walk briskly for the set time. In a jog both feet leave the ground for a moment – in a walk one foot is always down.", "Repeat for the set number of rounds.", "Over the weeks the jogs get longer and the walks shorter, until you jog continuously."],
    avoid: ["Jogging too fast – you should still be able to talk.", "Long strides that land on the heel far in front.", "Adding too much time at once."],
    knee: "Not used if you chose \"go easy on knees\" – you get the bike, cross-trainer or incline walk instead.",
    talk: true, tip: "New users start this in phase 2, e.g. 1 min jog / 2 min walk."
  },
  "Rower": {
    steps: ["Strap the feet in, sit tall, arms straight toward the handle.", "Drive: push with the legs first, then lean back slightly, then pull the handle to the lower ribs.", "Return: arms out first, then lean forward, then bend the legs.", "Keep a smooth rhythm – about twice as long on the return as on the drive."],
    avoid: ["Pulling with the arms before the legs have pushed.", "Rounding the back at the front.", "Lifting the knees before the handle has passed them on the way back."],
    talk: true, tip: "Learn the order before going hard: legs, body, arms – then arms, body, legs."
  },
  "Jump rope": {
    steps: ["Hold the handles at hip height, elbows close to the body.", "Turn the rope with the wrists, not the whole arm.", "Jump just high enough for the rope to pass – a few centimetres.", "Land softly on the balls of the feet."],
    avoid: ["Jumping high.", "Landing on the heels.", "Big arm circles."],
    knee: "Not used if you chose \"go easy on knees\".",
    talk: true, tip: "No rope? Do the same small hops without one."
  },
  "Body-weight cardio circuit": {
    steps: ["Do each move for the set time (e.g. 30 s), one after another.", "Rest briefly after the last move, then start the next round.", "Pick the version that fits your level – step jacks instead of jumping jacks, for example.", "Keep moving at the target effort."],
    levels: ["New: step jack · air squat · slow mountain climber.", "Some: jumping jack · air squat · mountain climber.", "Experienced: longer rounds or shorter rests."],
    avoid: ["Losing form to go faster.", "Landing hard.", "Holding your breath."],
    knee: "With \"go easy on knees\": step jacks and shallow squats, no jumping.",
    talk: true
  }
};
