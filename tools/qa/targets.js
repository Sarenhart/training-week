const c=require('./load.js');const cls=require('./classify.js');
const LV={M:[4,6],B:[8,10],F:[12,16]};const up={M:'B',B:'F',F:'F'};const rank={M:0,B:1,F:2};
const TABLE={chest:{Slim:'B',Toned:'B',Built:'F'},back:{Slim:'F',Toned:'F',Built:'F'},shoulders:{Slim:'B',Toned:'F',Built:'F'},arms:{Slim:'M',Toned:'B',Built:'F'},
 glutes:{Slim:'F',Toned:'F',Built:'B'},thighs:{Slim:'B',Toned:'B',Built:'B'},calves:{Slim:'M',Toned:'M',Built:'M'},core:{Slim:'F',Toned:'B',Built:'B'}};
const SMALL=new Set(['arms','calves']);
function target(a,g,pi){let t=TABLE[g][a.shape];const mx=(x,y)=>rank[x]>=rank[y]?x:y;
 if(a.goal==='Strength'&&['chest','back','thighs'].includes(g))t=mx(t,'B');
 if(a.goal==='Balance'){if(t==='F')t='B';if(['glutes','core','calves'].includes(g))t=mx(t,'B');}
 if(a.goal==='Cardio'){t=['thighs','core'].includes(g)?'B':'M';}
 if(a.focus.includes(g))t='F';
 else if(SMALL.has(g)){let s='M';for(let i=0;i<pi;i++)s=up[s];if(rank[s]<rank[t])t=s;}
 const easyMap={Knees:'thighs',Shoulders:'shoulders'};for(const e of a.easy)if(easyMap[e]===g&&!a.focus.includes(g))t='M';
 if(g==='back'&&rank[t]<1)t='B';
 return t;}
const HELP={chest:[['triceps',.5]],back:[['biceps',.5]],thighs:[['glutes',.5]],ham:[]};
function helpers(name,m){if(m==='chest'&&/press|push-up|dip/i.test(name))return[['triceps',.5]];
 if(m==='back'&&!/pullover|Y-raise|superman/i.test(name))return[['biceps',.5]];
 if(m==='shoulders'&&/press|Pike/i.test(name))return[['triceps',.5]];
 if(m==='thighs'&&!/curl/i.test(name))return[['glutes',.5]];
 if(m==='glutes'&&/split|step|lunge|Bulgarian/i.test(name))return[['thighs',.5]];
 if(m==='ham'&&/Romanian|good-morning|RDL/i.test(name))return[['glutes',.5]];
 return[];}
const G={chest:['chest'],back:['back'],shoulders:['shoulders','rear'],biceps:['biceps'],triceps:['triceps'],glutes:['glutes'],thighs:['thighs','ham'],calves:['calves'],core:['core']};
function weekly(ph,withOpt){const s={};for(const k of Object.keys(G))s[k]=0;
 for(const [k,w] of Object.entries(ph.workouts)){const opt=k==='c'||k==='x';if(opt&&!withOpt)continue;
  for(const x of w.exercises){const m=cls(x.name);const add=(mm,f)=>{for(const g in G)if(G[g].includes(mm))s[g]+=x.sets*f;};add(m,1);for(const [h,f] of helpers(x.name,m))add(h,f);}}
 return s;}
function check(a){const P=c.generatePlan(a);const res=[];
 P.phases.forEach((ph,pi)=>{const s=weekly(ph,false),so=weekly(ph,true);
  for(const g of ['chest','back','shoulders','biceps','triceps','glutes','thighs','calves','core']){const gg=g==='biceps'||g==='triceps'?'arms':g;const t=target(a,gg,pi);
   res.push({pi,g,t,lo:LV[t][0],hi:LV[t][1],got:s[g],gotOpt:so[g]});}});
 return res;}
module.exports={check,target,weekly};
if(require.main===module){const L=require('./profiles.js');
 for(const [l,a] of L){const r=check(a);const bad=r.filter(x=>x.got<x.lo-1);const over=r.filter(x=>x.got>x.hi+4);
  const fmt=x=>`P${x.pi+1} ${x.g} ${x.got}${x.gotOpt!==x.got?'('+x.gotOpt+')':''}/${x.t}${x.lo}`;
  console.log(l.padEnd(44),'LOW:',bad.map(fmt).join(', ')||'-', over.length?' HIGH: '+over.map(fmt).join(', '):'');}}
