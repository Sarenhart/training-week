const GUIDES = {
  "dumbbell bench press": {
    steps: ["Sit on the end of the bench with the dumbbells on your thighs, then lie back and bring them up over the chest.", "Feet flat on the floor, shoulder blades pulled back and down.", "Lower the dumbbells beside the chest, elbows about 45° from the body.", "Press up until the arms are straight and the dumbbells are over the shoulders."],
    avoid: ["Flaring the elbows straight out to the sides.", "Letting the dumbbells drift toward the face.", "Dropping the dumbbells to the floor from the top. Bring them back to the thighs and sit up."],
    tip: "Each side works on its own, so a weaker side can't hide. Expect a lighter weight than on the barbell."
  },
  "goblet squat": {
    steps: ["Hold one dumbbell upright against the chest, both hands under the top end.", "Stand in front of a bench, feet a little wider than the hips, toes slightly out.", "Sit the hips back and down until you lightly touch the bench.", "Keep the chest up and push the floor away to stand."],
    avoid: ["Dropping onto the bench and relaxing. Just touch it.", "Knees falling inward. Push them out over the toes.", "Rounding the back to reach the bench."],
    knee: "The bench sets the depth, so you never go deeper than you planned. Use a higher bench if the knee complains.",
    tip: "As it gets easy, use a lower bench, and later squat without one."
  },
  "dumbbell romanian deadlift": {
    steps: ["Stand tall with a dumbbell in each hand in front of the thighs, feet hip-width.", "Unlock the knees slightly and keep that small bend the whole set.", "Push the hips back and let the dumbbells slide down close to the legs, back flat.", "Stop at a strong stretch in the hamstrings, usually just below the knees.", "Squeeze the glutes and push the hips forward to stand."],
    avoid: ["Rounding the back. Stop where you can keep it flat.", "Bending the knees more as you go down (turns it into a squat).", "Letting the dumbbells swing away from the legs."],
    knee: "Knees stay nearly still, so this is a good lift while a knee recovers."
  },
  "lat pulldown": {
    steps: ["Set the thigh pad so your legs are locked in snugly.", "Grip the bar a little wider than the shoulders and sit down with arms straight.", "Lean back a little, chest up.", "Pull the bar to the upper chest, driving the elbows down to your sides.", "Let the bar go back up slowly until the arms are straight."],
    avoid: ["Pulling the bar behind the neck.", "Leaning far back and turning it into a row.", "Letting the weight yank the arms up at the top."]
  },
  "seated cable row": {
    steps: ["Sit with feet on the platform, knees slightly bent.", "Grab the handle and sit tall with arms straight, leaning only a little forward.", "Pull the handle to the belly, squeezing the shoulder blades together.", "Let the arms go long again slowly, without rounding the back."],
    avoid: ["Rocking back and forth to move the weight.", "Shrugging the shoulders up to the ears.", "Rounding the lower back at the start of each rep."]
  },
  "incline y-raise": {
    steps: ["Set a bench to a low incline and lie face down with the chest on the pad.", "Let light dumbbells hang straight down, thumbs pointing up.", "Raise the arms forward and out in a Y, in line with the body.", "Pause at the top, then lower slowly."],
    avoid: ["Going heavy. This is a small muscle, light weights are the point.", "Lifting the chest off the pad to get the weights up.", "Shrugging the shoulders toward the ears."],
    tip: "Start with the lightest dumbbells. Even 1–2 kg is plenty at first."
  },
  "cable fly (mid)": {
    steps: ["Set both pulleys to shoulder height and take a handle in each hand.", "Step forward into a split stance, slight bend in the elbows.", "Bring the hands together in front of the chest in a wide arc, like hugging a big tree.", "Open the arms back slowly until you feel a stretch across the chest."],
    avoid: ["Bending and straightening the elbows (turns it into a press).", "Letting the cables pull the arms too far back.", "Leaning far forward to move more weight."],
    tip: "Same height on both sides is recommended, but a small difference is fine."
  },
  "cable fly (low-to-high)": {
    steps: ["Set both pulleys low and take a handle in each hand.", "Step forward into a split stance, palms facing forward, slight bend in the elbows.", "Scoop the hands up and in until they meet at chest height.", "Lower back slowly along the same arc."],
    avoid: ["Lifting the hands above the chin.", "Bending and straightening the elbows.", "Shrugging the shoulders up."],
    tip: "Hits the upper chest most. Same height on both sides is recommended, but a small difference is fine."
  },
  "cable fly (high-to-low)": {
    steps: ["Set both pulleys high and take a handle in each hand.", "Step forward into a split stance, slight bend in the elbows.", "Sweep the hands down and in until they meet in front of the hips.", "Let the arms rise back slowly along the same arc."],
    avoid: ["Pushing the hands down like a press.", "Rounding the shoulders forward at the bottom.", "Letting the cables yank the arms up."],
    tip: "Hits the lower chest most. Same height on both sides is recommended, but a small difference is fine."
  },
  "cable lateral raise": {
    steps: ["Set the pulley at its lowest point and stand side-on to it.", "Hold the handle with the far hand, in front of the opposite hip.", "Raise the arm out to the side until it reaches shoulder height.", "Lower slowly back across the body. Then swap sides."],
    avoid: ["Swinging the body to start the movement.", "Lifting above shoulder height.", "Shrugging the shoulder up."],
    tip: "The cable keeps tension at the bottom, where a dumbbell feels like nothing."
  },
  "lean-away lateral raise": {
    steps: ["Hold a post or rack with one hand, feet close to it.", "Lean away until the arm holding on is straight.", "With a dumbbell in the free hand, raise the arm out to the side to shoulder height.", "Lower slowly. Then swap sides."],
    avoid: ["Letting go of the lean during the set.", "Swinging the dumbbell up.", "Bending the elbow more as you lift."],
    tip: "The lean makes the start of the movement harder, which is where a normal lateral raise is easy."
  },
  "side-lying lateral raise": {
    steps: ["Lie on your side on a bench, bottom arm supporting the head.", "Hold a light dumbbell in the top hand, resting on the hip.", "Raise the arm up and out until it's almost pointing at the ceiling.", "Lower slowly back to the hip. Then swap sides."],
    avoid: ["Going heavy. A light weight feels heavy here.", "Rolling the body back to help the lift.", "Letting the dumbbell drop at the end."],
    tip: "This one is hardest at the bottom. Use about half the weight of a normal lateral raise."
  },
  "incline push-up": {
    steps: ["Put your hands on a bench or sturdy table edge, a little wider than the shoulders.", "Walk the feet back until the body is one straight line.", "Lower the chest to the edge, elbows about 45° from the body.", "Push back up until the arms are straight."],
    avoid: ["Letting the hips sag or stick up.", "Flaring the elbows straight out.", "Using something that can slide or tip."],
    tip: "The higher the hands, the easier it is. Lower the surface as you get stronger, until you reach the floor."
  },
  "deficit push-up": {
    steps: ["Put your hands on two blocks, plates or push-up handles, a little wider than the shoulders.", "Body in one straight line from head to heels.", "Lower the chest below the level of the hands.", "Push back up until the arms are straight."],
    avoid: ["Going deeper than the shoulders allow. Stop if it pinches.", "Letting the hips sag.", "Blocks that can roll or slide."],
    tip: "The extra depth gives the chest a bigger stretch. Only use it once normal push-ups are easy."
  },
  "dumbbell hip thrust": {
    steps: ["Sit with the upper back against a bench and a dumbbell across the hips.", "Feet flat, hip-width, far enough out that shins are vertical at the top.", "Hold the dumbbell in place and drive through the heels to lift the hips.", "Squeeze the glutes at the top, body flat from shoulders to knees.", "Lower under control."],
    avoid: ["Arching the lower back at the top instead of using the glutes.", "Feet too close, which moves the work to the knees.", "Pushing through the toes."],
    knee: "Knees stay at a fixed angle and take little load. Move the feet further out if the knee feels it.",
    tip: "Put a folded towel under the dumbbell if it presses on the hip bones."
  },
  "glute bridge": {
    steps: ["Lie on your back, knees bent, feet flat and hip-width.", "Arms on the floor by your sides.", "Push through the heels and lift the hips until the body is straight from shoulders to knees.", "Squeeze the glutes at the top for a second, then lower slowly."],
    avoid: ["Arching the lower back to get higher.", "Pushing through the toes.", "Letting the knees fall in or out."],
    knee: "Very little knee load. A good glute exercise on days the knee needs rest.",
    tip: "Too easy? Hold a dumbbell on the hips, or do it with one leg."
  },
  "back extension (45°)": {
    steps: ["Set the pad just below the hip bones so you can bend freely at the hips.", "Hook the heels under the foot pads, arms crossed on the chest.", "Hinge down over the pad with a flat back.", "Rise until the body is one straight line, then lower slowly."],
    avoid: ["Arching back past straight at the top.", "Swinging up fast.", "Pad too high, which stops you hinging at the hips."],
    tip: "Hold a weight plate against the chest when body weight gets easy."
  },
  "bird dog": {
    steps: ["Start on hands and knees: hands under the shoulders, knees under the hips.", "Brace the stomach and keep the back flat.", "Reach one arm forward and the opposite leg back until both are long.", "Pause, return slowly, and switch sides."],
    avoid: ["Twisting the hips as the leg goes back.", "Arching the lower back to lift the leg higher.", "Rushing. Slow is the point."],
    tip: "Imagine a glass of water on your lower back. Don't spill it."
  },
  "reverse crunch": {
    steps: ["Lie on your back, arms by your sides, knees bent over the hips.", "Press the lower back into the floor.", "Curl the hips up off the floor, bringing the knees toward the chest.", "Lower the hips slowly back down."],
    avoid: ["Swinging the legs to get momentum.", "Pushing hard with the hands.", "Letting the lower back arch as the legs come down."],
    tip: "The movement is small. It's the hips curling up, not the legs swinging."
  },
  "step-up": {
    steps: ["Stand facing a box or bench, a dumbbell in each hand.", "Put one whole foot on the box.", "Push through that foot to stand up tall on the box.", "Step back down slowly with the same leg each time. Do all reps, then swap."],
    avoid: ["Pushing off with the back foot to bounce up.", "Box so high the knee goes above the hip.", "Letting the knee collapse inward."],
    knee: "Start with a low step. Raise it as the knee tolerates more.",
    tip: "Start without dumbbells to find your balance."
  },
  "leg press": {
    steps: ["Sit with the lower back flat on the pad, feet hip-width in the middle of the platform.", "Release the safety handles and hold them.", "Lower the platform until the knees are bent about 90°, lower back still on the pad.", "Push the platform away until the legs are long but the knees are not locked."],
    avoid: ["Locking the knees straight at the top.", "Going so deep that the lower back lifts off the pad.", "Pushing through the toes."],
    knee: "Easy to control the depth. Stop where the knee feels fine and go deeper over the weeks.",
    tip: "Feet higher on the platform: more glutes. Feet lower: more front of the thighs."
  },
  "seated hamstring curl": {
    steps: ["Line the knee up with the machine's pivot point.", "Lower the thigh pad so it holds the legs snugly, ankle pad behind the heels.", "Sit back with the hips in the seat and curl the heels down and under.", "Let the legs go back up slowly, about 2–3 seconds."],
    avoid: ["Lifting the hips out of the seat.", "Letting the weight fly up at the end.", "Going through pain in the knee. Shorten the range or go lighter."],
    knee: "If the knee complains, stop and skip it for now. Romanian deadlifts cover the hamstrings too."
  },
  "single-leg dumbbell calf raise": {
    steps: ["Stand on one foot on a step, heel hanging off, dumbbell in the same hand.", "Hold a wall or rail lightly with the other hand for balance.", "Lower the heel below the step for a full stretch.", "Rise as high as you can, pause, then lower slowly. Then swap."],
    avoid: ["Bouncing at the bottom.", "Bending the knee to help.", "Pulling yourself up with the hand on the wall."],
    tip: "Doing one leg at a time doubles the load without needing heavy weights."
  },
  "calf raise on the leg press": {
    steps: ["Sit in the leg press and put the balls of your feet on the bottom edge of the platform.", "Press the platform up, release the safety handles and hold them. Legs straight, knees soft.", "Let the heels come toward you for a stretch.", "Push with the toes as far as you can, pause, then lower slowly."],
    avoid: ["Bending the knees to move the weight.", "Feet too high, which can let them slip off.", "Short bouncy reps."],
    tip: "Keep your hands on the safety handles so you can lock the platform if a foot slips."
  }
};
