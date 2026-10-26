const c=require('./load.js');
function rng(seed){return()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const KIT=["Dumbbells","Kettlebell","Barbell & plates","Weight vest","Long resistance band","Mini band (loop)","Pull-up bar","Suspension trainer","Weight bench","Sturdy chair","Stairs or a sturdy step","Heavy table (for rows)","Space to lunge","Smooth floor (for sliding)","Stability ball","Exercise bike","Treadmill","Rower","Cross-trainer","Jump rope","Outdoors nearby (walk, run, cycle)"];
const MACH=["Bike","Cross-trainer","Incline treadmill walk","Stair climber","Air bike","Ski machine","Rower","Running"];
const FOC=["chest","back","shoulders","arms","glutes","thighs","calves","core"];
function profile(r){
  const goal=pick(r,["Strength","Balance","Cardio"]),days=pick(r,[2,3,4]),where=pick(r,["Gym","Home"]);
  const sex=pick(r,["Female","Male","Prefer not to say"]);const h=Math.round(150+r()*45);const bmi=16+r()*24;
  const a={...c.defaultAnswers(),weight:String(Math.round(bmi*(h/100)**2)),height:String(h),sex,year:String(2026-Math.round(18+r()*67)),
   goal,shape:pick(r,["Slim","Toned","Built"]),level:pick(r,["New","Some","Experienced"]),days,time:pick(r,["30 min","45 min","60 min"]),where,
   easy:FOC.length&&r()<.4?[pick(r,["Knees","Back","Shoulders","Wrists"])].concat(r()<.3?[pick(r,["Knees","Back","Shoulders","Wrists"])]:[]).filter((x,i,s)=>s.indexOf(x)===i):[],
   kit:where==="Home"?KIT.filter(()=>r()<.3):[],dbMax:pick(r,[5,8,10,12.5,15,20,24,30])};
  if(r()<.3){a.weight="";}
  if(r()<.2){a.height="";}
  a.anchor=(a.kit.includes("Long resistance band")||a.kit.includes("Suspension trainer"))?r()<.6:null;
  a.machine=goal==="Cardio"&&where==="Gym"?pick(r,MACH):(goal==="Cardio"?pick(r,MACH):null);
  const fm=c.focusMax(a);const f=[...FOC].sort(()=>r()-.5).slice(0,Math.floor(r()*(fm+1)));a.focus=f;
  return a;}
module.exports={profile,rng};
if(require.main===module){const r=rng(7);const names={};let err=0;
 for(let i=0;i<500;i++){const a=profile(r);let P;try{P=c.generatePlan(a);}catch(e){err++;if(err<5)console.log('ERR',e.message,JSON.stringify(a));continue;}
  P.phases.forEach(ph=>Object.values(ph.workouts).forEach(w=>w.exercises.forEach(x=>{names[x.name]=(names[x.name]||0)+1;})));}
 console.log('errors',err);const unk=Object.keys(names).filter(n=>!c.EX[n]);console.log('known',Object.keys(names).length-unk.length,'unknown',unk.length);console.log(unk.sort().join('\n'));}
