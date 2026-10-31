// DATA viene de data.js (preguntas, respuestas y retroalimentación)
const D=DATA;
const KEY='dian2676-analista2-v1';
let A={};try{A=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){A={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SC={A:'Totalmente en desacuerdo',B:'En desacuerdo',C:'De acuerdo',D:'Totalmente de acuerdo'};
const app=document.getElementById('app');
const secById=Object.fromEntries(D.sections.map(s=>[s.id,s]));

function verdict(n){ // 'ok' | 'part' | 'bad' | null
  const l=A[n];if(!l)return null;const q=D.q[n];
  if(q.t==='mc')return l===q.a?'ok':'bad';
  if(q.c==='TP')return (l==='C'||l==='D')?'ok':'bad';
  if(q.c==='TN')return (l==='A'||l==='B')?'ok':'bad';
  if(l===q.e)return 'ok';
  const dir=x=>'AB'.includes(x);
  return dir(l)===dir(q.e)?'part':'bad';
}
function stats(s){let a=0,g=0,p=0;s.items.forEach(n=>{const v=verdict(n);if(v){a++;if(v==='ok')g++;if(v==='part')p++}});return{a,g,p,t:s.items.length}}
const pct=(x,t)=>t?Math.round(100*x/t):0;

function optsHtml(n){
  const q=D.q[n],l=A[n],done=!!l;let h='';
  const letters=q.t==='mc'?['A','B','C']:['A','B','C','D'];
  letters.forEach(L=>{
    const txt=q.t==='mc'?q.o[L]:SC[L];let cls='opt';
    if(done){
      if(q.t==='mc'){if(L===q.a)cls+=' ok';else if(L===l)cls+=' bad';else cls+=' dim'}
      else{const ok=(q.c==='TP'?'CD':q.c==='TN'?'AB':q.e).includes(L);if(L===l)cls+=' '+(verdict(n)==='ok'?'ok':verdict(n)==='part'?'part':'bad');else if(ok)cls+=' ok';else cls+=' dim'}
    }
    h+=`<button class="${cls}" data-n="${n}" data-l="${L}" ${done?'disabled':''}><b>${L}</b><span>${esc(txt)}</span></button>`;
  });
  return h;
}
function fbHtml(n){
  const l=A[n];if(!l)return'';const q=D.q[n],v=verdict(n);let h='';
  if(q.t==='mc'){
    h=`<p class="v">${v==='ok'?'✔ ¡Correcto!':'✘ Incorrecto. La respuesta correcta es la '+q.a+'.'}</p>
    <p><b>Por qué la ${q.a} es correcta:</b> ${esc(q.x)}</p><p><b>Por qué las demás no:</b></p><ul>`+
    Object.keys(q.w).map(k=>`<li><b>${k}.</b> ${esc(q.w[k])}${k===l?' <i>(tu respuesta)</i>':''}</li>`).join('')+
    `</ul><p class="src">Fundamento: ${esc(q.s)}</p>`;
  }else{
    const t=v==='ok'?'✔ Coherente con el perfil esperado':v==='part'?'◐ Parcialmente coherente: va en la dirección esperada, pero no con la intensidad esperada':'✘ Poco coherente con el perfil esperado';
    const ideal=q.c==='TP'?'C o D (ideal: '+q.e+')':q.c==='TN'?'A o B (ideal: '+q.e+')':q.e;
    h=`<p class="v">${t}</p><p><b>Respuesta esperada:</b> ${ideal} — ${esc(SC[q.e])}.</p><p><b>Por qué:</b> ${esc(q.x)}</p>
    <p class="src">${esc(D.cl[q.c])} · ${esc(q.k)}</p>`;
  }
  return `<div class="fb ${v}">${h}</div>`;
}
function qHtml(n){
  const q=D.q[n];
  const meta=q.t==='mc'?`<span class="tag">${esc(q.d)}</span>`:'';
  return `<article class="q" id="q${n}"><div class="h"><span class="n">Pregunta ${n}</span>${meta}</div><p class="stem">${esc(q.st)}</p><div class="opts">${optsHtml(n)}</div><div class="fbw">${fbHtml(n)}</div></article>`;
}
function statsHtml(s){
  const st=stats(s),sc=s.kind==='mc';
  return `<div class="r"><span>Respondidas: <b>${st.a}/${st.t}</b></span><span>${sc?'Aciertos':'Coherentes'}: <b>${st.g}${st.a?' ('+pct(st.g,st.a)+'%)':''}</b></span></div><div class="bar"><i style="width:${pct(st.a,st.t)}%"></i></div>`;
}
function resultHtml(s){
  const st=stats(s);if(st.a<st.t)return'';
  const r=st.g/st.t;
  if(s.kind==='mc'){
    const good=r>=2/3;
    return `<section class="res"><h3>Resultado del tema: ${st.g} de ${st.t} (${pct(st.g,st.t)}%)</h3><p>${good?'<span class="tag ok">Buen nivel</span> Superaste los dos tercios de aciertos. Repasa las preguntas que fallaste.':'<span class="tag bad">Por repasar</span> Quedaste por debajo de los dos tercios de aciertos: conviene repasar este tema y leer la retroalimentación de cada pregunta.'}</p></section>`;
  }
  return `<section class="res"><h3>Perfil: ${st.g} de ${st.t} respuestas coherentes${st.p?' y '+st.p+' parcialmente coherentes':''}</h3><p>Estas pruebas no tienen respuestas correctas o incorrectas: el resultado indica qué tan alineadas están tus respuestas con el perfil esperado por el Diccionario de Competencias y el Código de Integridad de la DIAN.</p></section>`;
}
function homeView(){
  const all=D.sections;let a=0,t=0,g=0,mcA=0;
  all.forEach(s=>{const st=stats(s);a+=st.a;t+=st.t;if(s.kind==='mc'){g+=st.g;mcA+=st.a}});
  let h=`<h1>Simulacro de prueba escrita · DIAN 2676</h1><p class="mute">Analista II · 202-02 · OPEC 236831. Elige un tema: cada uno se evalúa por separado y, al marcar una opción, verás si es correcta y su retroalimentación.</p>
  <div class="stats" style="position:static;border:0"><div class="r"><span>Avance total: <b>${a}/${t}</b></span><span>Aciertos (partes 1 y 2): <b>${g}${mcA?' ('+pct(g,mcA)+'%)':''}</b></span></div><div class="bar"><i style="width:${pct(a,t)}%"></i></div></div>`;
  const nf=failedList().length;
  h+=`<p><a class="btn" href="#repaso">${nf?'Repasar preguntas falladas ('+nf+')':'Repasar preguntas falladas'}</a></p>`;
  [1,2,3,4].forEach(p=>{
    h+=`<h2>${esc(D.parts[p])}</h2><div class="grid">`;
    all.filter(s=>s.part===p).forEach(s=>{
      const st=stats(s);let tag='';
      if(st.a===st.t&&s.kind==='mc')tag=st.g/st.t>=2/3?'<span class="tag ok">Buen nivel</span>':'<span class="tag bad">Repasar</span>';
      else if(st.a===st.t)tag='<span class="tag ok">Completo</span>';
      h+=`<a class="tcard" href="#${s.id}"><b>${esc(s.title)}</b><div class="bar"><i style="width:${pct(st.a,st.t)}%"></i></div><div class="row"><span>${st.a}/${st.t} respondidas</span><span>${st.a?(s.kind==='mc'?st.g+' aciertos':st.g+' coherentes'):'—'} ${tag}</span></div></a>`;
    });
    h+='</div>';
  });
  h+=`<p style="margin-top:24px"><button class="btn" id="resetAll">Reiniciar todo el simulacro</button></p><footer>Material de estudio de ConMérito, construido con el Manual de Funciones de la DIAN (Res. 067 de 2024) y la normativa vigente al 4 de octubre de 2026. No es material oficial de la CNSC ni de la DIAN. Tus respuestas se guardan solo en este navegador.</footer>`;
  app.innerHTML=h;
  document.getElementById('resetAll').onclick=()=>{if(confirm('¿Borrar todas tus respuestas?')){A={};save();route()}};
}
function sectionView(s){
  const idx=D.sections.indexOf(s),prev=D.sections[idx-1],next=D.sections[idx+1];
  let h=`<p style="margin:18px 0 0"><a href="#inicio">← Todos los temas</a></p><h1>${esc(s.title)}</h1><p class="mute">${esc(D.parts[s.part])}${s.kind==='scale'?' · Escala: A totalmente en desacuerdo · B en desacuerdo · C de acuerdo · D totalmente de acuerdo. No hay respuestas correctas o incorrectas.':' · Una sola opción correcta por pregunta.'}</p><div class="stats" id="stats">${statsHtml(s)}</div>`;
  let last=null;
  s.items.forEach(n=>{
    const q=D.q[n];
    if(q.t==='mc'&&q.si!==last){last=q.si;const si=D.sit[q.si];h+=`<section class="sit"><h3>Situación · ${si.f===si.l?'Pregunta '+si.f:'Preguntas '+si.f+' a '+si.l}</h3>${si.p.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`}
    h+=qHtml(n);
  });
  h+=`<div id="result">${resultHtml(s)}</div><div class="nav"><button class="btn" id="resetSec">Reiniciar este tema</button><span>${prev?`<a class="btn" href="#${prev.id}">← ${esc(prev.title.length>28?prev.title.slice(0,27)+'…':prev.title)}</a> `:''}${next?`<a class="btn" href="#${next.id}">${esc(next.title.length>28?next.title.slice(0,27)+'…':next.title)} →</a>`:''}</span></div>`;
  app.innerHTML=h;
  document.getElementById('resetSec').onclick=()=>{if(confirm('¿Borrar las respuestas de este tema?')){s.items.forEach(n=>delete A[n]);save();route()}};
  app.onclick=e=>{
    const b=e.target.closest('.opt');if(!b||b.disabled)return;
    const n=b.dataset.n;if(A[n])return;A[n]=b.dataset.l;save();
    const el=document.getElementById('q'+n);el.outerHTML=qHtml(+n);
    document.getElementById('stats').innerHTML=statsHtml(s);
    document.getElementById('result').innerHTML=resultHtml(s);
  };
}
let RETRY=null;
function failedList(){return D.sections.flatMap(s=>s.items).filter(n=>verdict(n)==='bad')}
function reviewView(){
  const items=RETRY||failedList();
  let h=`<p style="margin:18px 0 0"><a href="#inicio">← Todos los temas</a></p><h1>Repaso de preguntas falladas</h1>`;
  if(!items.length){app.innerHTML=h+'<p class="mute">No tienes preguntas falladas por ahora. Responde algún tema y vuelve aquí.</p>';return}
  const s={kind:'mc',items};
  h+=`<p class="mute">${RETRY?'Responde de nuevo estas preguntas.':'Estas son las preguntas que fallaste, con su retroalimentación. Puedes intentarlas otra vez.'}</p><div class="stats" id="stats">${statsHtml(s)}</div>`;
  let last=null;
  items.forEach(n=>{
    const q=D.q[n],sec=D.sections.find(x=>x.items.includes(n));
    if(q.t==='mc'&&q.si!==last){last=q.si;const si=D.sit[q.si];h+=`<section class="sit"><h3>Situación · ${si.f===si.l?'Pregunta '+si.f:'Preguntas '+si.f+' a '+si.l}</h3>${si.p.map(x=>`<p>${esc(x)}</p>`).join('')}</section>`}
    h+=`<p class="mute" style="margin:14px 0 0">${esc(sec.title)}</p>`+qHtml(n);
  });
  h+=`<div class="nav">${RETRY?'<button class="btn" id="endRetry">Terminar repaso</button>':'<button class="btn" id="retry">Reintentar estas preguntas</button>'}</div>`;
  app.innerHTML=h;
  const r=document.getElementById('retry');
  if(r)r.onclick=()=>{RETRY=items.slice();items.forEach(n=>delete A[n]);save();reviewView();window.scrollTo(0,0)};
  const e=document.getElementById('endRetry');
  if(e)e.onclick=()=>{RETRY=null;reviewView();window.scrollTo(0,0)};
  app.onclick=ev=>{
    const b=ev.target.closest('.opt');if(!b||b.disabled)return;
    const n=b.dataset.n;if(A[n])return;A[n]=b.dataset.l;save();
    document.getElementById('q'+n).outerHTML=qHtml(+n);
    document.getElementById('stats').innerHTML=statsHtml(s);
  };
}
function route(){
  const id=location.hash.slice(1);const s=secById[id];
  app.onclick=null;
  if(id!=='repaso')RETRY=null;
  if(id==='repaso'){reviewView()}else if(s){sectionView(s)}else{homeView()}
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
route();
