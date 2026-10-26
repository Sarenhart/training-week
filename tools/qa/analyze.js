const c=require('./load.js');const cls=require('./classify.js');
const MUS=['chest','back','shoulders','rear','biceps','triceps','glutes','thighs','ham','calves','core'];
function workSec(x){const per=/per side|each side|per leg/i.test(x.note||'')?2:1;
  if(x.unit==='min')return x.reps*60; if(x.unit==='sec')return x.reps*per; if(x.unit==='m')return 45; if(x.unit==='rounds')return 60; return x.reps*3.5*per;}
function minutes(w){let s=0;let prevSS=null;
  for(const x of w.exercises){const work=workSec(x);
    if(x.unit==='min'){s+=x.sets*work;continue;}
    s+=x.sets*(work+(x.rest||0));
    const g=x.ss?x.ss[0]:null; if(!g||g!==prevSS)s+=60; prevSS=g;}  // 60 s to set up each new station
  return Math.round(s/60);}
function summarize(a){const P=c.generatePlan(a);const out={dir:P.direction,phases:[]};
 P.phases.forEach((ph,pi)=>{const wk={};MUS.forEach(m=>wk[m]={sets:0,days:new Set()});const extra={balanceMin:0,cardioMin:0,mobility:0};
  const wos=[];
  for(const [k,w] of Object.entries(ph.workouts)){const optional=k==='c'||/optional|recommended|planned/i.test(w.name)||k==='x';
   const mins=minutes(w);wos.push({k,name:w.name,mins,sets:w.exercises.filter(x=>x.unit!=='min').reduce((t,x)=>t+x.sets,0),ex:w.exercises});
   if(optional)continue;
   for(const x of w.exercises){const m=cls(x.name);
    if(wk[m]){wk[m].sets+=x.sets;wk[m].days.add(k);}
    else if(m==='balance')extra.balanceMin+=x.sets*workSec(x)/60;
    else if(m==='cardio')extra.cardioMin+=x.unit==='min'?x.sets*x.reps:0;
    else if(m==='mobility')extra.mobility+=x.sets;}}
  out.phases.push({name:ph.name,wk,extra,wos});});
 return {P,out};}
function fmtPlan(label,a){const {P,out}=summarize(a);const m=c.obMetric(a),bmi=m.kg&&m.cm?(m.kg/(m.cm/100)**2).toFixed(1):'–';
 let t=`\n=== ${label}\n${a.goal} · ${a.level} · ${a.days} d · ${a.time} · ${a.where}${a.where==='Home'?' ['+a.kit.join(', ')+']'+(a.kit.includes('Dumbbells')?' db≤'+a.dbMax:''):''} · ${a.sex} ${c.obAge(a)} y · ${a.weight||'?'} kg/${a.height||'?'} cm BMI ${bmi} · ${a.shape} → ${out.dir} · focus [${a.focus}] · easy [${a.easy}]${a.machine?' · machine '+a.machine:''}\n`;
 out.phases.forEach((ph,pi)=>{t+=`-- P${pi+1} ${ph.name}\n`;
  ph.wos.forEach(w=>{t+=`  ${w.k} ${w.name} (~${w.mins} min, ${w.sets} sets): `+w.ex.map(x=>`${x.ss?x.ss+' ':''}${x.name} ${x.sets}×${x.reps}${x.unit!=='reps'?x.unit:''}${x.kg?' '+x.kg+'kg':''}${x.rest?' r'+x.rest:''}`).join(' · ')+'\n';});
  t+='  weekly sets: '+MUS.map(mu=>`${mu} ${ph.wk[mu].sets}/${ph.wk[mu].days.size}d`).join(', ')+` | balance ${Math.round(ph.extra.balanceMin)} min, cardio ${Math.round(ph.extra.cardioMin)} min, mobility ${ph.extra.mobility} sets\n`;});
 return t;}
module.exports={summarize,fmtPlan,minutes,MUS,workSec};
