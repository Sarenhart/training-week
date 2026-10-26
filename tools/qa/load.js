const fs=require('fs');const s=fs.readFileSync('/home/claude/training-week-dev/index.html','utf8');
const grab=n=>{const m=s.match(new RegExp('// <<'+n+'\\n([\\s\\S]*?)// '+n+'>>'));return m[1];};
const pre='const esc=x=>String(x);const fmt=x=>String(x);const today=()=>"2026-10-26";const navigator={language:"sv-SE"};const localStorage={getItem(){return null},setItem(){}};let S={};';
module.exports=new Function(pre+grab('onboarding')+grab('generator')+';return {generatePlan,EX,defaultAnswers,obMetric,obAge,directionOf,focusMax,timeFit,HOME,MACHINES,doctorNote};')();
