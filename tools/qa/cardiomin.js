const c=require('./load.js');const L=require('./profiles.js');
function hardMin(note){let h=0;const m=note.match(/(\d+) × (\d+) (s|min) Hard/);if(m)h+=(+m[1])*(+m[2])/(m[3]==='s'?60:1);const f=note.match(/\+ (\d+) min Hard/);if(f)h+=+f[1];return h;}
for(const [l,a] of L){if(a.goal!=='Cardio')continue;const P=c.generatePlan(a);const row=[];
 P.phases.forEach((ph,pi)=>{let mins=0,hard=0,strengthDays=0;
  for(const [k,w] of Object.entries(ph.workouts)){let st=false;for(const x of w.exercises){if(x.unit==='min'){const t=x.sets*x.reps*(k==='c'&&/twice/.test(w.name)?2:1);mins+=t;hard+=hardMin(x.note||'');}else st=true;}if(st&&k!=='c')strengthDays++;}
  row.push(`P${pi+1} ${Math.round(mins)}+${Math.round(hard)}=${Math.round(mins+hard)} (str ${strengthDays}d)`);});
 console.log(l.padEnd(46),row.join(' | '));}
