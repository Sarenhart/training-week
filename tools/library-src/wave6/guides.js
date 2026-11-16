const GUIDES = {
  "Barbell bench press": {
    steps: ["Lie with eyes under the bar, feet flat on the floor.", "Pull shoulder blades back and down, keep a small arch in the upper back.", "Grip slightly wider than shoulders, wrists stacked over elbows.", "Lower the bar under control to the lower chest, elbows about 45° from the body.", "Press up and slightly back toward the rack until arms are straight."],
    avoid: ["Flaring elbows straight out to the sides (hard on the shoulders).", "Bouncing the bar off the chest.", "Lifting hips off the bench or feet off the floor.", "Bending wrists backwards. Keep them straight over the forearm."],
    tip: "Use safety arms or a spotter when sets get heavy."
  },
  "Barbell overhead press": {
    steps: ["Bar on the front of the shoulders, grip just outside shoulder width.", "Feet hip-width, squeeze glutes and brace the stomach.", "Move the head slightly back and press the bar straight up.", "Once the bar passes the forehead, move the head forward under it.", "Finish with arms locked, bar over the middle of the feet."],
    avoid: ["Leaning back to push the weight up. That loads the lower back.", "Pressing the bar out in front of you instead of straight up.", "Using the legs to bounce it (that's a push press)."]
  },
  "Incline dumbbell press": {
    steps: ["Bench at 30–45°. Sit with dumbbells on your thighs, then lie back and bring them up.", "Shoulder blades back and down, feet planted.", "Lower the dumbbells to the sides of the upper chest, elbows about 45° from the body.", "Press up and slightly in until arms are straight over the shoulders."],
    avoid: ["A bench angle so steep it turns into a shoulder press.", "Letting the dumbbells drift far apart at the bottom.", "Dropping the dumbbells to the sides when finishing. Bring them back to the thighs."]
  },
  "Seated dumbbell shoulder press": {
    steps: ["Bench upright, back against the pad, feet planted.", "Dumbbells at shoulder height, palms forward or slightly in.", "Press straight up until the arms are straight.", "Lower to the shoulders under control."],
    avoid: ["Arching the lower back off the pad.", "Clanking the dumbbells together at the top.", "Cutting the range short at the bottom."]
  },
  "Standing dumbbell shoulder press": {
    steps: ["Stand with dumbbells at shoulder height, palms forward or slightly in.", "Brace the stomach and squeeze the glutes.", "Press straight up until the arms are straight.", "Lower to the shoulders under control."],
    avoid: ["Leaning back to finish the rep.", "Bouncing from the legs.", "Dumbbells drifting out wide."]
  },
  "Dumbbell lateral raise": {
    steps: ["Stand tall, dumbbells at your sides, slight bend in the elbows.", "Raise the arms out to the sides until they are level with the shoulders.", "Lead with the elbows, thumbs level or slightly down.", "Lower slowly, about 2 seconds."],
    avoid: ["Swinging the body to get the weight up. Go lighter instead.", "Shrugging the shoulders toward the ears.", "Lifting higher than shoulder height."],
    tip: "This is a light exercise. Small weights with clean form work best."
  },
  "Rear-delt dumbbell fly": {
    steps: ["Hinge forward (or lie chest-down on an incline bench), dumbbells hanging.", "Soft bend in the elbows.", "Raise the arms out to the sides until level with the body.", "Lower slowly."],
    avoid: ["Squeezing the shoulder blades hard together. Lead with the back of the shoulders.", "Swinging the body.", "Going too heavy."]
  },
  "Overhead dumbbell triceps extension": {
    steps: ["Sit or stand tall, hold one dumbbell with both hands overhead.", "Keep upper arms close to the head and pointing up.", "Bend only at the elbows and lower the dumbbell behind the head.", "Straighten the arms back to the top."],
    avoid: ["Elbows flaring wide.", "Arching the lower back. Brace the stomach.", "Going deeper than your shoulders comfortably allow."]
  },
  "EZ-bar skull crusher": {
    steps: ["Lie on a bench and hold the EZ bar over the chest with arms straight.", "Tilt the arms slightly back toward the head.", "Bend only the elbows and lower the bar toward the forehead or just behind it.", "Straighten the arms back up."],
    avoid: ["Elbows flaring out.", "Moving the upper arms. They should stay still.", "Going heavy without control. The bar is near your head."]
  },
  "Barbell curl": {
    steps: ["Shoulder-width grip, palms up, arms straight.", "Keep the elbows at your sides and curl the bar up.", "Squeeze at the top, then lower slowly."],
    avoid: ["Swinging the body.", "Elbows drifting forward.", "Bending the wrists back."]
  },
  "EZ-bar curl": {
    steps: ["Hold the bar on the angled grips, palms up, arms straight.", "Keep the elbows at your sides and curl the bar up.", "Squeeze at the top, then lower slowly to straight arms."],
    avoid: ["Swinging the hips or leaning back.", "Elbows moving forward.", "Stopping short of straight arms at the bottom."]
  },
  "Dumbbell curl": {
    steps: ["Stand tall, dumbbells at your sides, palms facing forward.", "Keep the elbows at your sides and curl the weights up.", "Squeeze at the top, then lower slowly."],
    avoid: ["Swinging the body.", "Elbows drifting forward.", "Dropping the weight on the way down."]
  },
  "Dumbbell hammer curl": {
    steps: ["Stand tall, dumbbells at your sides, palms facing each other.", "Keep the elbows at your sides and curl the weights up.", "Squeeze at the top, then lower slowly."],
    avoid: ["Swinging the body.", "Elbows drifting forward.", "Dropping the weight on the way down."]
  },
  "Barbell bent-over row": {
    steps: ["Grip just outside the knees, feet hip-width.", "Hinge forward to about 45° with knees slightly bent and back flat.", "Pull the bar to the lower ribs or belly button, elbows going back.", "Lower under control until the arms are straight."],
    avoid: ["Rounding the back.", "Standing up more with each rep to swing the weight.", "Jerking the bar up with the hips."]
  },
  "One-arm dumbbell row": {
    steps: ["One hand and knee on a bench, the other foot on the floor. Back flat.", "Let the dumbbell hang straight down.", "Pull it toward the hip, elbow close to the body.", "Lower until the arm is fully straight."],
    avoid: ["Twisting the torso to lift the weight.", "Pulling to the shoulder instead of the hip.", "Shrugging."]
  },
  "Chest-supported dumbbell row": {
    steps: ["Bench at about 30°. Lie chest-down with dumbbells hanging.", "Pull the dumbbells up toward the hips, squeezing the shoulder blades together.", "Lower until the arms are straight."],
    avoid: ["Lifting the chest off the pad.", "Shrugging the shoulders toward the ears."]
  },
  "Barbell hip thrust": {
    steps: ["Sit with your upper back against a bench, bar over the hip crease (use a pad).", "Feet flat, hip-width, far enough out that shins are vertical at the top.", "Tuck the chin slightly and drive through the heels to lift the hips.", "At the top, squeeze the glutes hard with ribs down and body flat from shoulders to knees.", "Lower under control."],
    avoid: ["Arching the lower back at the top instead of using the glutes.", "Feet too close, which moves the work to the knees and quads.", "Pushing through the toes."],
    knee: "Knees stay at a fixed angle and take little load. Move the feet further out if the knee feels it."
  },
  "Kettlebell swing": {
    steps: ["Feet slightly wider than hips, bell a step in front of you.", "Hinge at the hips (as in a Romanian deadlift) and hike the bell back between the legs.", "Snap the hips forward hard, squeezing the glutes. The bell floats up to chest height.", "Let the bell fall and hinge again as it comes back.", "Arms stay loose like ropes. The hips do the work."],
    avoid: ["Squatting down instead of hinging.", "Lifting the bell with the arms or shoulders.", "Leaning back at the top.", "Rounding the back at the bottom."],
    knee: "Knees bend only a little, so this is usually fine. Stop if it hurts."
  },
  "Farmer's carry": {
    steps: ["Pick up heavy dumbbells or kettlebells as in a deadlift, back flat.", "Stand tall, shoulders back and down, stomach braced.", "Walk with short, steady steps for the distance.", "Set the weights down with a flat back."],
    avoid: ["Leaning to one side.", "Shrugging or rounding the shoulders.", "Rushing with long strides."]
  },
  "Machine row": {
    steps: ["Set the seat so the handles are at lower-chest height, chest against the pad.", "Sit tall and pull the handles toward the ribs.", "Squeeze the shoulder blades together at the end.", "Let the arms stretch fully forward on the way back."],
    avoid: ["Leaning back to move the weight.", "Shrugging the shoulders up.", "Letting the weight stack slam between reps."]
  },
  "Lying hamstring curl": {
    steps: ["Line the knee up with the machine's pivot point, pad just above the heels.", "Hold the handles and keep the hips pressed into the bench.", "Curl the heels toward the glutes.", "Lower slowly, about 2–3 seconds."],
    avoid: ["Lifting the hips off the bench.", "Letting the weight drop at the bottom.", "Going through pain in the knee. Shorten the range or go lighter."],
    knee: "If the knee complains, stop and skip it for now. Romanian deadlifts cover the hamstrings too."
  },
  "Standing calf raise": {
    steps: ["Balls of the feet on a step or plate, heels free.", "Stand tall with knees straight but not locked.", "Lower the heels as far as is comfortable for a stretch.", "Rise as high as possible onto the toes and pause 1 second."],
    avoid: ["Bouncing at the bottom.", "Rolling onto the outside of the feet.", "Short, fast reps. Use the full range."]
  },
  "Seated calf raise": {
    steps: ["Pad on the lower thighs, balls of the feet on the platform.", "Lower the heels for a full stretch.", "Push up as high as you can and pause 1 second at the top.", "Lower slowly."],
    avoid: ["Bouncing out of the bottom.", "Using the hands to push the pad up."]
  },
  "Cable pull-through": {
    steps: ["Rope on the lowest cable setting. Face away from the machine with the rope between your legs.", "Walk forward until there is tension. Feet slightly wider than hips.", "Hinge at the hips with a small knee bend, letting the rope go back through the legs.", "Drive the hips forward and squeeze the glutes to stand tall."],
    avoid: ["Squatting down instead of hinging.", "Pulling with the arms.", "Leaning back at the top."],
    knee: "A hip movement with very little knee load."
  },
  "Pull-up": {
    steps: ["Grip just outside shoulder width, palms facing away.", "Start from a full hang with arms straight.", "Pull the shoulder blades down first, then drive the elbows toward the ribs.", "Pull until the chin is over the bar.", "Lower under control to a full hang."],
    avoid: ["Kicking or swinging the legs for momentum.", "Half reps that stop short at the bottom.", "Reaching the chin forward to clear the bar."],
    tip: "Can't do the reps yet? Use the assisted pull-up machine and tap − under the sets until it shows the help you need (e.g. 20 kg). The help moves in 0,25 kg steps so you can match your machine's numbers. When it feels light, set the next lower setting on the machine."
  },
  "Parallel bar dips": {
    steps: ["Support yourself on straight arms, shoulders down.", "Lean slightly forward and lower until the upper arms are about parallel to the floor.", "Push back up to straight arms."],
    avoid: ["Going deeper than your shoulders allow. Stop at any pinching at the front of the shoulder.", "Shrugging the shoulders to the ears.", "Swinging the legs."],
    tip: "Use an assisted dip machine if bodyweight reps are too hard."
  },
  "Close-grip push-up": {
    steps: ["Hands just under the shoulders, slightly narrower than a normal push-up.", "Body in a straight line from head to heels.", "Lower the chest to the floor with elbows tucked close to the ribs.", "Push back up to straight arms."],
    avoid: ["Hips sagging or sticking up.", "Elbows flaring out.", "Half reps."],
    tip: "Too hard? Do them with hands on a bench."
  },
  "Hanging knee raise": {
    steps: ["Hang from a bar with straight arms and shoulders slightly engaged.", "Raise the knees toward the chest, curling the pelvis up at the top.", "Lower slowly without swinging."],
    avoid: ["Swinging the whole body.", "Only lifting the thighs without curling the pelvis. The stomach should do the work."]
  },
  "Ab wheel rollout": {
    steps: ["Kneel on a pad and hold the wheel under the shoulders.", "Brace the stomach and tuck the pelvis slightly.", "Roll forward slowly as far as you can while keeping the back flat.", "Pull back with the stomach to the start."],
    avoid: ["The lower back sagging. Only roll as far as you can control.", "Pushing the hips back to return instead of using the stomach."],
    knee: "Use a thick pad under the knees."
  },
  "Dead bug": {
    steps: ["Lie on your back, arms straight up, knees bent at 90° over the hips.", "Press the lower back flat into the floor and keep it there.", "Slowly stretch one arm back and the opposite leg out, just above the floor.", "Return and switch sides. Breathe out as you stretch."],
    avoid: ["The lower back lifting off the floor. Shorten the movement if it does.", "Rushing. Slow reps make it harder, and that's the point."]
  },
  "Side plank": {
    steps: ["Lie on your side, elbow under the shoulder, legs stacked.", "Lift the hips so the body is straight from head to feet.", "Hold for the time, breathing normally. Then switch sides."],
    avoid: ["Hips sagging toward the floor.", "Rolling the chest forward or back."],
    tip: "Too hard? Bend the knees and rest them on the floor."
  },
  "Bike or rower": {
    steps: ["Easy pace for most of the session, where you can still talk.", "Pick up the pace a little for the last 5 minutes."],
    avoid: ["On the rower: pulling with the arms first. The order is legs, then body, then arms.", "Seat too low on the bike (bends the knee too much)."]
  }
};
