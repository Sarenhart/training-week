const {summarize}=require('./analyze.js');const L=require('./profiles.js');
const want=process.argv[2]||'';
for(const [l,a] of L){if(!l.startsWith(want))continue;const {out}=summarize(a);
 console.log(l,'|',out.dir);
 out.phases.forEach((ph,i)=>{const w=ph.wk;const mins=ph.wos.filter(x=>x.k!=='c').map(x=>x.mins).join('/');
  const opt=ph.wos.find(x=>x.k==='c');
  console.log(` P${i+1} min[${mins}] opt:${opt?opt.name+' '+opt.mins:'-'} | bal ${Math.round(ph.extra.balanceMin)}m card ${Math.round(ph.extra.cardioMin)}m mob ${ph.extra.mobility} | ch${w.chest.sets} bk${w.back.sets} sh${w.shoulders.sets} rr${w.rear.sets} bi${w.biceps.sets} tr${w.triceps.sets} gl${w.glutes.sets} th${w.thighs.sets} hm${w.ham.sets} cf${w.calves.sets} co${w.core.sets}`);});}
