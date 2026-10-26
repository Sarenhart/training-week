const c=require('./load.js');const cls=require('./classify.js');const {minutes}=require('./analyze.js');const {profile,rng}=require('./rnd.js');
const vm=require('vm');const fs=require('fs');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('/home/claude/training-week-dev/library.js','utf8')+';this.TWLIB=TWLIB;',ctx);const LIB=ctx.TWLIB;const OLD=new Set(require('./oldguides.json'));
const N=+process.argv[2]||600;const r=rng(42);const tally={};const ex={};
let PID=0;const prof={};const pop={};const hit=(k,msg)=>{(prof[k]=prof[k]||new Set()).add(PID);tally[k]=(tally[k]||0)+1;if(!ex[k])ex[k]=[];if(ex[k].length<3)ex[k].push(msg);};
const kitNeed=[[/^Band (chest|row|pulldown|face pull|Pallof|pushdown|leg curl|chest fly)/,['Long resistance band']],[/^Suspension/,['Suspension trainer']],[/^Pull-up$|Hanging knee raise/,['Pull-up bar']],[/Stability-ball/,['Stability ball']],[/^Sliding/,['Smooth floor (for sliding)']],[/^Table row/,['Heavy table (for rows)']],[/^Mini-band/,['Mini band (loop)']],[/Dumbbell|dumbbell|Goblet|^Romanian deadlift$|Suitcase hold|Preacher|Spider|skull/,['Dumbbells','Kettlebell']],[/bench press|Incline dumbbell press|Chest-supported|Preacher|Spider/,['Weight bench']],[/^Step-up$/,['Stairs or a sturdy step']],[/Exercise bike|^Bike/,['Exercise bike']],[/^Rower/,['Rower']]];
const gymOnly=/machine|Cable|cable|Lat pulldown|Leg press|leg press|Lying hamstring curl|Seated hamstring curl|Barbell|Face pull$|Rope|Pallof press$|Seated cable row|Machine|Back extension$|Calf raise on the leg press|Seated calf raise|Standing calf raise/;
for(let i=0;i<N;i++){PID=i;const a=profile(r);const kk=a.goal+'/'+a.where;pop[kk]=(pop[kk]||0)+1;pop[a.goal]=(pop[a.goal]||0)+1;{const ag=c.obAge(a);const P_=(k)=>pop[k]=(pop[k]||0)+1;if(ag>=50)P_(a.goal+' 50+');if(ag>=65&&a.where==='Gym')P_('65+ gym');if(ag>=65)P_('65+');if(a.where==='Home')P_('Home');if(a.where==='Home'&&a.kit.includes('Pull-up bar'))P_('Home+bar');for(const e of a.easy)P_('easy '+e);}let P;try{P=c.generatePlan(a);}catch(e){hit('crash',e.message);continue;}
 const age=c.obAge(a),old=age>=65,t=parseInt(a.time);const tag=`${a.goal}/${a.level}/${a.days}d/${a.time}/${a.where}/age${age}/easy[${a.easy}]/kit[${a.kit.length}]`;
 const seenWeek=[];
 P.phases.forEach((ph,pi)=>{const names=new Map();
  for(const [k,w] of Object.entries(ph.workouts)){const opt=k==='c';
   const m=minutes(w); if(!opt&&m>t+8)hit('time over chosen +8 min ('+a.goal+')',`${tag} P${pi+1} ${w.name} ~${m} min`);
   const inW=new Set();const groups={};
   for(const x of w.exercises){const n=x.name;
    if(inW.has(n))hit('same exercise twice in one workout',`${tag} P${pi+1} ${w.name}: ${n}`);inW.add(n);
    if(!opt&&cls(n)!=='cardio'&&cls(n)!=='balance'){if(names.has(n)&&names.get(n)!==k&&a.goal==='Strength')hit('exercise repeated in the week (Strength, '+a.where+')',`${tag} P${pi+1}: ${n}`);names.set(n,k);}
    if(x.ss){const g=x.ss[0];(groups[g]=groups[g]||[]).push(+x.ss.slice(1));}
    if(a.level==='New'&&pi===0&&/Barbell|barbell/.test(n))hit('New: barbell in phase 1',`${tag}: ${n}`);
    if(old&&a.where==='Gym'&&c.EX[n]?.floor)hit('65+: floor exercise in gym',`${tag} P${pi+1}: ${n}`);
    if(a.easy.includes('Knees')&&(/squat|lunge|Jump|\bhops?\b|Skater|Skipping|Pistol|Running|Step-up$|Bulgarian/i.test(n))&&!/Leg press|leg press|Deep squat hold/.test(n))hit('Knees easy: squat/lunge/jump/step-up',`${tag} P${pi+1}: ${n}`);
    if(a.easy.includes('Back')&&/Barbell back squat|good-morning|Romanian deadlift$|Backpack Romanian/i.test(n))hit('Back easy: loaded hinge/squat',`${tag} P${pi+1}: ${n}`);
    if(a.easy.includes('Shoulders')&&/dip|Pike|overhead press|shoulder press|Pull-up/i.test(n))hit('Shoulders easy: overhead/dip/pull-up',`${tag} P${pi+1}: ${n}`);
    if(a.easy.includes('Wrists')&&/push-up/i.test(n)&&!/handles|fists/i.test(x.note||''))hit('Wrists easy: push-up without handles/fists note',`${tag} P${pi+1}: ${n}`);
    if((old||a.easy.includes('Knees'))&&/Running|Jump|\bhops?\b|Skater|Skipping|Jump rope/i.test(n))hit('65+/knees: running or jumping',`${tag} P${pi+1}: ${n}`);
    if(a.goal==='Cardio'&&a.level==='New'&&pi===0&&/intervals/.test(n)&&/Hard \//.test(x.note||''))hit('Cardio New P1: Hard',`${tag}: ${n} ${x.note}`);
    if(a.where==='Home'){if(gymOnly.test(n)&&!/^Band|Prone|Single-leg|Dumbbell hip thrust at home|any machine|^Finisher/.test(n))hit('Home: gym-only exercise',`${tag} P${pi+1}: ${n}`);
      for(const [re,need] of kitNeed)if(re.test(n)&&!need.some(k=>a.kit.includes(k)))hit('Home: needs kit not ticked',`${tag} P${pi+1}: ${n} needs ${need.join('/')}`);
      if(/Dumbbell|dumbbell|Goblet|Romanian deadlift$|Suitcase/.test(n)&&x.kg>a.dbMax+0.01)hit('Home: dumbbell heavier than the heaviest owned',`${tag}: ${n} ${x.kg} > ${a.dbMax}`);
      if(n==='Pull-up'&&x.reps>10)hit('Home pull-ups: >10 reps per set',`${tag} P${pi+1}: ${x.sets}x${x.reps}`);}
    if(x.unit==='reps'&&x.reps>20)hit('more than 20 reps',`${tag}: ${n} ${x.reps}`);
    if(!c.EX[n]?.nokg&&c.EX[n]&&!c.EX[n].bw&&x.kg===0&&cls(n)!=='cardio')hit('loaded exercise with 0 kg: '+n,`${tag}`);
    if(cls(n)!=='cardio'&&!/^Finisher|^Warm-up|^Cool-down/.test(n)&&!LIB.find(x.lib||n)&&!LIB.find(n)&&!OLD.has(n.toLowerCase()))hit('no guide at all (no library card, no old guide)',n);
   }
   for(const g in groups){const s=groups[g].sort();if(s[0]!==1||s.some((v,i)=>v!==i+1))hit('superset labels out of order (e.g. A2 without A1)',`${tag} P${pi+1} ${w.name}: ${g}${s.join(',')}`);if(s.length===1)hit('superset with only one exercise',`${tag} P${pi+1} ${w.name}: ${g}${s}`);}
  }});
 if(a.goal==='Strength'&&age>=50){const any=P.phases.some(ph=>Object.entries(ph.workouts).some(([k,w])=>k!=='c'&&w.exercises.some(x=>cls(x.name)==='balance')));if(!any)hit('50+: no balance exercise (Part 1 rule)',tag);}
 if(a.goal!=='Cardio'){const w0=Object.values(P.phases[0].workouts)[0];if(!w0.exercises.some(x=>/Warm-up/.test(x.name)))hit('no warm-up in workout (Strength/Balance)',tag);}
}
console.log(JSON.stringify(pop));const out=Object.entries(tally).sort((x,y)=>prof[y[0]].size-prof[x[0]].size);for(const [k,v] of out){console.log(`${String(prof[k].size).padStart(4)} plans (${v} hits)  ${k}`);for(const e of ex[k])console.log('        e.g. '+e);}
