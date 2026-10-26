const c=require('./load.js');
const R=[
 [/– (intervals|steady|tempo)$|^Finisher|^Warm-up|^Cool-down|walk, jog|Brisk walk|Easy cardio|Long & easy|^(Rower|Cross-trainer|Incline treadmill walk|Jump rope|Bike)$/,'cardio'],
 [/stretch|Ankle rocks|90\/90|Open-book|Wall slide|Deep squat hold|Calf stretch/,'mobility'],
 [/stand|Tandem|Heel-to-toe|step and hold|Step-up and hold|star reach|Step switch|March|hop and stick|Skater|RDL reach|Toe stand|Calf-raise hold|Split-stance|Reverse lunge to knee drive|Skipping|Jump lunge|Single-leg Pallof/,'balance'],
 [/leg curl|Romanian|good-morning/i,'ham'],
 [/chest|Push-up ladder|Suspension push-up/i,'chest'],[/Pike push-up|overhead press/i,'shoulders'],[/lateral raise/i,'shoulders'],
 [/face pull|Y-T-W/i,'rear'],[/pulldown|row|Pull-up|pullover/i,'back'],[/curl$|Towel isometric curl/i,'biceps'],[/pushdown|Chair dip|triceps/i,'triceps'],
 [/leg curl|Romanian|good-morning/i,'ham'],[/glute|hip thrust|lateral walk|superman|Reverse hyper|Side-lying leg raise/i,'glutes'],
 [/Squat ladder|Sit-to-stand|Pistol|Reverse lunge|squat/i,'thighs'],[/calf/i,'calves'],[/plank|Pallof|crunch|Hollow|knee lift|Dead bug|Bird dog|Copenhagen/i,'core']];
function cls(n){const e=c.EX[n];if(e&&e.m)return e.m;for(const [re,m] of R)if(re.test(n))return m;return '??';}
module.exports=cls;
if(require.main===module){const {profile,rng}=require('./rnd.js');const r=rng(7);const s=new Set();for(let i=0;i<500;i++){const P=c.generatePlan(profile(r));P.phases.forEach(ph=>Object.values(ph.workouts).forEach(w=>w.exercises.forEach(x=>s.add(x.name))));}
 const by={};[...s].forEach(n=>{const k=cls(n);(by[k]=by[k]||[]).push(n)});for(const k in by)console.log(k,':',by[k].filter(n=>!c.EX[n]).join(' | '));}
