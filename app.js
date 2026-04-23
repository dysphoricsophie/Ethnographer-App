// app.js — application logic, no modules
const{APP_NAME,APP_VERSION,STATE_KEY,AMP_MAX,BASE_FLOOR,DEFAULT_SETTINGS,DEFAULT_TRAITS,PRESET_GROUPS}=CFG;
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function uid(){return Math.random().toString(16).slice(2)+Date.now().toString(16);}
function gauss(x,mu,sigma){sigma=Math.max(0.12,sigma);const z=(x-mu)/sigma;return Math.exp(-0.5*z*z);}
function deepClone(x){return JSON.parse(JSON.stringify(x));}
function downloadFile(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);}
function modeToWeight(m,spill){return m===2?1:m===1?spill:0;}
function defaultTraitState(trait){const n=trait.bins.length,mu=(n-1)/2;return{binModes:Array(n).fill(2),peaks:[{id:uid(),mu,sigma:Math.max(0.8,n/6),amp:1.0}]};}
function defaultGroup(name="New Group"){const traits={};for(const t of DEFAULT_TRAITS)traits[t.key]=defaultTraitState(t);return{id:uid(),name,description:"",traits,children:[]};}
function groupFromPreset(p){
  const g=defaultGroup(p.name);g._isTemplate=true;g.description=p.description||"";
  for(const t of DEFAULT_TRAITS){const src=p.traits[t.key];if(!src)continue;const n=t.bins.length;
    g.traits[t.key]={binModes:src.binModes?src.binModes.slice():Array(n).fill(2),peaks:(src.peaks||[]).map(pk=>({id:uid(),mu:pk.mu??0,sigma:pk.sigma??1,amp:pk.amp??1}))};}
  return g;
}
function flattenGroups(groups,depth=0){const out=[];for(const g of groups){out.push({id:g.id,name:g.name,depth});if(g.children?.length)out.push(...flattenGroups(g.children,depth+1));}return out;}
function findGroupById(groups,id){for(const g of groups){if(g.id===id)return g;if(g.children){const f=findGroupById(g.children,id);if(f)return f;}}return null;}
function traitByKey(state,key){return state.traits.find(t=>t.key===key)||null;}
function ensureGroupShape(state,g){
  for(const t of state.traits){
    if(!g.traits[t.key]){g.traits[t.key]=defaultTraitState(t);continue;}
    const tr=g.traits[t.key];
    if(!Array.isArray(tr.binModes)||tr.binModes.length!==t.bins.length)tr.binModes=Array(t.bins.length).fill(2);
    if(!Array.isArray(tr.peaks)||!tr.peaks.length)tr.peaks=[{id:uid(),mu:(t.bins.length-1)/2,sigma:Math.max(0.8,t.bins.length/6),amp:1}];
    for(const p of tr.peaks)if(!p.id)p.id=uid();
  }
}
function computeRawBins(state,g,key){
  const t=traitByKey(state,key),tr=g.traits[key];if(!t||!tr)return[];
  const n=t.bins.length,spill=clamp(state.settings.spillover,0,0.6),raw=[];
  for(let i=0;i<n;i++){const w=modeToWeight(tr.binModes[i]??2,spill);let mix=0;for(const p of tr.peaks)mix+=clamp(p.amp??0,0,AMP_MAX)*gauss(i,p.mu??0,p.sigma??1);raw.push(w*(BASE_FLOOR+mix));}
  return raw;
}
function computeProbs(state,g,key){const raw=computeRawBins(state,g,key),s=raw.reduce((a,b)=>a+b,0);return s>0?raw.map(v=>v/s):raw.map(()=>0);}
function loadState(){try{const s=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(s&&s.app===APP_NAME&&s.version>=3)return migrateState(s);}catch(e){}return buildDefaultState();}
function migrateState(s){
  s.traits=deepClone(DEFAULT_TRAITS);
  const pn=new Set((PRESET_GROUPS||[]).map(p=>p.name));
  function mt(groups){for(const g of groups){if(pn.has(g.name)&&!('_isTemplate'in g))g._isTemplate=true;if(g.children)mt(g.children);}}
  if(s.groups)mt(s.groups);
  if(!s.ui)s.ui={activeGroupId:s.groups?.[0]?.id,activeTraitKey:DEFAULT_TRAITS[0].key,selectedPeakId:null,showJson:true,templatesLocked:true};
  if(s.ui.templatesLocked===undefined)s.ui.templatesLocked=true;
  if(s.ui.showJson===undefined)s.ui.showJson=true;
  return s;
}
function buildDefaultState(){
  const groups=(PRESET_GROUPS||[]).length?PRESET_GROUPS.map(p=>groupFromPreset(p)):[defaultGroup("Example Group")];
  return{app:APP_NAME,version:APP_VERSION,traits:deepClone(DEFAULT_TRAITS),settings:deepClone(DEFAULT_SETTINGS),groups,
    ui:{activeGroupId:groups[0].id,activeTraitKey:DEFAULT_TRAITS[0].key,selectedPeakId:null,showJson:true,templatesLocked:true}};
}
function saveState(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(e){}}

const els={
  btnExportProject:document.getElementById("btnExportProject"),btnImportProject:document.getElementById("btnImportProject"),fileProject:document.getElementById("fileProject"),
  btnNewGroup:document.getElementById("btnNewGroup"),btnNewSubgroup:document.getElementById("btnNewSubgroup"),selGroup:document.getElementById("selGroup"),
  btnDeleteGroup:document.getElementById("btnDeleteGroup"),lockBadge:document.getElementById("lockBadge"),btnDuplicateGroup:document.getElementById("btnDuplicateGroup"),
  lockTemplatesToggle:document.getElementById("lockTemplatesToggle"),spillover:document.getElementById("spillover"),spilloverNum:document.getElementById("spilloverNum"),
  selTrait:document.getElementById("selTrait"),btnAddPeak:document.getElementById("btnAddPeak"),btnRemovePeak:document.getElementById("btnRemovePeak"),
  btnNormalize:document.getElementById("btnNormalize"),btnRandom:document.getElementById("btnRandom"),bins:document.getElementById("bins"),canvas:document.getElementById("curve"),
  btnExportProfile:document.getElementById("btnExportProfile"),btnImportProfile:document.getElementById("btnImportProfile"),fileProfile:document.getElementById("fileProfile"),
  btnDownloadCsv:document.getElementById("btnDownloadCsv"),btnScreenshot:document.getElementById("btnScreenshot"),peakControls:document.getElementById("peakControls"),
  description:document.getElementById("description"),completionStatus:document.getElementById("completionStatus"),toggleJson:document.getElementById("toggleJson"),
  debug:document.getElementById("debug"),modal:document.getElementById("modal"),modalBody:document.getElementById("modalBody"),btnModalClose:document.getElementById("btnModalClose"),
};

let state=loadState();
function activeGroup(){return findGroupById(state.groups,state.ui.activeGroupId)||state.groups[0];}
function activeTrait(){return traitByKey(state,state.ui.activeTraitKey)||state.traits[0];}
function isTemplateLocked(g){return!!g._isTemplate&&!!state.ui.templatesLocked;}

const ctx=els.canvas.getContext("2d");
let dragMode=null,dragPeakId=null;

function resizeCanvas(){
  const wrap=els.canvas.parentElement,w=wrap.clientWidth||800,h=Math.max(280,Math.round(w*0.3));
  if(els.canvas.width!==w||els.canvas.height!==h){els.canvas.width=w;els.canvas.height=h;}
}
function getPadB(){const t=activeTrait(),ml=Math.max(...t.bins.map(b=>b.length));return(t.bins.length>5||ml>10)?80:40;}
const PAD_L=18,PAD_R=22,PAD_T=28;
function worldToCanvas(x,y,padB){const w=els.canvas.width,h=els.canvas.height,n=activeTrait().bins.length;return{px:PAD_L+(x/Math.max(n-1,1))*(w-PAD_L-PAD_R),py:PAD_T+(1-y)*(h-PAD_T-padB)};}
function canvasToWorld(px,py,padB){const w=els.canvas.width,h=els.canvas.height,n=activeTrait().bins.length;return{x:(px-PAD_L)/(w-PAD_L-PAD_R)*Math.max(n-1,1),y:1-(py-PAD_T)/(h-PAD_T-padB)};}
function hitTestPeaks(mx,my){
  const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key],padB=getPadB();
  for(const p of tr.peaks){
    const y=clamp(p.amp/AMP_MAX,0,1),dot=worldToCanvas(p.mu,y,padB);
    const dpx=clamp(dot.px,PAD_L+2,els.canvas.width-PAD_R-2),dpy=clamp(dot.py,PAD_T+2,els.canvas.height-padB-2);
    const wr=worldToCanvas(p.mu+p.sigma,y,padB),wrpx=clamp(wr.px,PAD_L,els.canvas.width-PAD_R-2);
    if(Math.hypot(mx-dpx,my-dpy)<=12)return{mode:"peak",id:p.id};
    if(Math.hypot(mx-wrpx,my-dpy)<=12)return{mode:"width",id:p.id};
  }
  return null;
}

function drawCurve(){
  resizeCanvas();
  const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];
  const w=els.canvas.width,h=els.canvas.height,n=t.bins.length,padB=getPadB();
  const probs=computeProbs(state,g,t.key),maxP=Math.max(...probs,0.001),baseY=h-padB;
  ctx.clearRect(0,0,w,h);

  // Background
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#1C1623");bg.addColorStop(1,"#151316");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);

  // Grid
  ctx.strokeStyle="rgba(61,44,76,0.6)";ctx.lineWidth=1;
  for(let i=1;i<=4;i++){const y=PAD_T+(i/4)*(h-PAD_T-padB);ctx.beginPath();ctx.moveTo(PAD_L,y);ctx.lineTo(w-PAD_R,y);ctx.stroke();}
  ctx.strokeStyle="rgba(92,58,91,0.5)";ctx.beginPath();ctx.moveTo(PAD_L,baseY);ctx.lineTo(w-PAD_R,baseY);ctx.stroke();

  // ── Selected peak guide lines (below bars) ──
  const selP=tr.peaks.find(p=>p.id===state.ui.selectedPeakId)||tr.peaks[0]||null;
  if(selP){
    const sy=clamp(selP.amp/AMP_MAX,0,1);
    const sdot=worldToCanvas(selP.mu,sy,padB);
    const sdpx=clamp(sdot.px,PAD_L+2,w-PAD_R-2);
    const sdpy=clamp(sdot.py,PAD_T+2,h-padB-2);
    const swr=worldToCanvas(selP.mu+selP.sigma,sy,padB);
    const swrpx=clamp(swr.px,PAD_L,w-PAD_R-2);
    ctx.save();
    ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.strokeStyle="rgba(157,135,210,0.38)";
    // Vertical line through center (mu)
    ctx.beginPath();ctx.moveTo(sdpx,PAD_T);ctx.lineTo(sdpx,baseY);ctx.stroke();
    // Horizontal line from dot edge to ring edge
    const dR=9,rR=7,ls=sdpx+dR+2,le=swrpx-rR-2;
    if(le>ls){ctx.beginPath();ctx.moveTo(ls,sdpy);ctx.lineTo(le,sdpy);ctx.stroke();}
    ctx.setLineDash([]);ctx.restore();
  }

  // Bars
  const barW=(w-PAD_L-PAD_R)/n*0.68;
  for(let i=0;i<n;i++){
    const mode=tr.binModes[i]??2,col=t.colors?.[i]||"#9D87D2";
    const bx=PAD_L+(i+0.5)/n*(w-PAD_L-PAD_R)-barW/2,bh=(probs[i]/maxP)*(h-PAD_T-padB),by=baseY-bh;
    ctx.fillStyle=mode===0?"rgba(61,44,76,0.18)":col+(mode===1?"40":"70");
    ctx.beginPath();ctx.roundRect(bx,by,barW,bh,3);ctx.fill();
    if(mode!==0){ctx.fillStyle=col;ctx.fillRect(bx,by,barW,2);}
  }

  // Curve fill + line
  const STEPS=300,pts=[];
  for(let s=0;s<=STEPS;s++){
    const xi=s/STEPS*(n-1),spill=clamp(state.settings.spillover,0,0.6);let v=0;
    for(let i=0;i<n;i++){const wt=modeToWeight(tr.binModes[i]??2,spill);let mix=0;for(const p of tr.peaks)mix+=clamp(p.amp,0,AMP_MAX)*gauss(xi,p.mu,p.sigma);v+=wt*(BASE_FLOOR+mix)/n;}
    pts.push({x:xi,v});
  }
  const maxV=Math.max(...pts.map(p=>p.v),0.001),toC=p=>worldToCanvas(p.x,p.v/maxV,padB);
  const fp=toC(pts[0]);
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);
  for(let i=1;i<pts.length;i++){const c=toC(pts[i]);ctx.lineTo(c.px,c.py);}
  const lp=toC(pts[pts.length-1]);
  ctx.lineTo(lp.px,baseY);ctx.lineTo(fp.px,baseY);ctx.closePath();
  const grd=ctx.createLinearGradient(0,PAD_T,0,baseY);
  grd.addColorStop(0,"rgba(157,135,210,0.28)");grd.addColorStop(0.6,"rgba(92,60,164,0.1)");grd.addColorStop(1,"rgba(77,59,125,0.02)");
  ctx.fillStyle=grd;ctx.fill();
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);
  for(let i=1;i<pts.length;i++){const c=toC(pts[i]);ctx.lineTo(c.px,c.py);}
  ctx.strokeStyle="#9D87D2";ctx.lineWidth=2.5;ctx.stroke();

  // Percent labels
  ctx.font="bold 10px system-ui,sans-serif";ctx.textAlign="center";ctx.textBaseline="bottom";
  for(let i=0;i<n;i++){
    const cx=PAD_L+(i+0.5)/n*(w-PAD_L-PAD_R),bh=(probs[i]/maxP)*(h-PAD_T-padB),by=baseY-bh-4;
    ctx.fillStyle="rgba(250,247,247,0.85)";ctx.fillText(Math.round(probs[i]*1000)/10+"%",cx,Math.max(PAD_T+14,by));
  }

  // Bin labels — centered below each bin, no rotation
  ctx.save();ctx.font="11px system-ui,sans-serif";ctx.fillStyle="rgba(185,162,164,0.85)";
  ctx.textAlign="center";ctx.textBaseline="top";
  for(let i=0;i<n;i++){
    const cx=PAD_L+(i+0.5)/n*(w-PAD_L-PAD_R);
    ctx.fillText(t.bins[i],cx,baseY+6);
  }
  ctx.restore();

  // Peak handles
  for(const p of tr.peaks){
    const isSel=(p.id===state.ui.selectedPeakId),y=clamp(p.amp/AMP_MAX,0,1);
    const dot=worldToCanvas(p.mu,y,padB);
    const dpx=clamp(dot.px,PAD_L+2,w-PAD_R-2),dpy=clamp(dot.py,PAD_T+2,h-padB-2);
    const wr=worldToCanvas(p.mu+p.sigma,y,padB),wrpx=clamp(wr.px,PAD_L,w-PAD_R-2);
    // Width ring
    ctx.beginPath();ctx.arc(wrpx,dpy,7,0,2*Math.PI);
    ctx.strokeStyle=isSel?"#7E6BA7":"rgba(126,107,167,0.5)";ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=isSel?"rgba(126,107,167,0.2)":"rgba(126,107,167,0.08)";ctx.fill();
    // Center dot
    ctx.beginPath();ctx.arc(dpx,dpy,isSel?9:7,0,2*Math.PI);
    ctx.fillStyle=isSel?"#EA9E83":"rgba(234,158,131,0.55)";ctx.fill();
    ctx.strokeStyle=isSel?"#FAF7F7":"rgba(250,247,247,0.5)";ctx.lineWidth=1.5;ctx.stroke();
    if(isSel){ctx.font="bold 10px system-ui,sans-serif";ctx.fillStyle="#FAF7F7";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText("μ="+p.mu.toFixed(2),dpx,dpy-11);}
  }
}

function getCanvasPos(e){const r=els.canvas.getBoundingClientRect(),sx=els.canvas.width/r.width,sy=els.canvas.height/r.height,src=e.touches?e.touches[0]:e;return{mx:(src.clientX-r.left)*sx,my:(src.clientY-r.top)*sy};}
els.canvas.addEventListener("mousedown",e=>{if(isTemplateLocked(activeGroup()))return;const{mx,my}=getCanvasPos(e);const hit=hitTestPeaks(mx,my);if(hit){dragMode=hit.mode;dragPeakId=hit.id;state.ui.selectedPeakId=hit.id;renderPeakControls();drawCurve();}});
window.addEventListener("mousemove",e=>{
  if(!dragMode)return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];const p=tr.peaks.find(x=>x.id===dragPeakId);if(!p)return;
  const padB=getPadB(),{mx,my}=getCanvasPos(e),wc=canvasToWorld(mx,my,padB),n=t.bins.length;
  if(dragMode==="peak"){p.mu=clamp(wc.x,-0.5,n-0.5);p.amp=clamp(wc.y*AMP_MAX,0,AMP_MAX);}else{p.sigma=Math.max(0.12,Math.abs(wc.x-p.mu)||0.12);}
  saveState(state);renderPeakControls();renderBins();drawCurve();renderJsonPreview();
});
window.addEventListener("mouseup",()=>{dragMode=null;dragPeakId=null;});
new ResizeObserver(()=>drawCurve()).observe(els.canvas.parentElement);

function renderGroupList(){
  const flat=flattenGroups(state.groups);els.selGroup.innerHTML="";
  for(const item of flat){const opt=document.createElement("option");opt.value=item.id;opt.textContent=("  ".repeat(item.depth))+(item.depth?"- ":"")+item.name;els.selGroup.appendChild(opt);}
  const cur=findGroupById(state.groups,state.ui.activeGroupId);els.selGroup.value=cur?cur.id:flat[0]?.id;
}
function renderLockUI(){
  const g=activeGroup(),locked=isTemplateLocked(g);
  els.lockBadge.classList.toggle("hidden",!locked);els.btnDuplicateGroup.style.display=locked?"inline-flex":"none";
  els.lockTemplatesToggle.checked=!!state.ui.templatesLocked;
  [els.description,els.btnAddPeak,els.btnRemovePeak,els.btnNormalize,els.btnRandom].forEach(el=>{if(el)el.disabled=locked;});
  els.peakControls.querySelectorAll("input").forEach(i=>i.disabled=locked);
  els.canvas.style.opacity=locked?"0.6":"1";els.canvas.style.pointerEvents=locked?"none":"auto";
}
function renderTraitList(){
  const g=activeGroup();ensureGroupShape(state,g);const grouped=new Map();
  for(const t of state.traits){const c=t.category||"Traits";if(!grouped.has(c))grouped.set(c,[]);grouped.get(c).push(t);}
  els.selTrait.innerHTML="";
  for(const[cat,traits]of grouped){const og=document.createElement("optgroup");og.label=cat;
    for(const t of traits){const ok=isTraitComplete(state,g,t.key);const opt=document.createElement("option");opt.value=t.key;opt.textContent=(ok?"✓ ":"• ")+t.name;og.appendChild(opt);}
    els.selTrait.appendChild(og);}
  if(!traitByKey(state,state.ui.activeTraitKey))state.ui.activeTraitKey=state.traits[0].key;els.selTrait.value=state.ui.activeTraitKey;
}
function renderCompletion(){
  const g=activeGroup(),descOk=(g.description||"").trim().length>0;let ok=0;for(const t of state.traits)if(isTraitComplete(state,g,t.key))ok++;const tot=state.traits.length;
  els.completionStatus.innerHTML=(descOk?`<span class="ok">Description ✓</span>`:`<span class="warn">Description missing</span>`)+`<span style="margin:0 8px;opacity:.4">·</span>`+(ok===tot?`<span class="ok">Traits ${ok}/${tot}</span>`:`<span class="warn">Traits ${ok}/${tot}</span>`);
}
function renderBins(){
  const g=activeGroup(),t=activeTrait();ensureGroupShape(state,g);const tr=g.traits[t.key],probs=computeProbs(state,g,t.key),locked=isTemplateLocked(g);els.bins.innerHTML="";
  for(let i=0;i<t.bins.length;i++){
    const div=document.createElement("div"),mode=tr.binModes[i];div.className="bin"+(mode===2?" sel":mode===1?" allow":" off");div.style.setProperty("--stripe-color",(t.colors&&t.colors[i])||"#9D87D2");
    const nm=document.createElement("div");nm.className="binName";nm.textContent=t.bins[i];
    const meta=document.createElement("div");meta.className="binMeta";const pct=document.createElement("div");pct.className="binPct";pct.textContent=Math.round(probs[i]*1000)/10+"%";
    const tag=document.createElement("div");tag.className="binModeTag";tag.textContent=mode===2?"Selected":mode===1?"Allowed":"Excluded";meta.appendChild(tag);meta.appendChild(pct);div.appendChild(nm);div.appendChild(meta);
    if(!locked)div.addEventListener("click",ev=>{if(ev.shiftKey)tr.binModes[i]=tr.binModes[i]===0?1:0;else tr.binModes[i]=tr.binModes[i]===2?1:2;saveState(state);rerender(false);});else div.style.cursor="default";
    els.bins.appendChild(div);
  }
}
function makeRange(label,value,min,max,step,onInput){
  const wrap=document.createElement("div");wrap.className="ctrlRow";const lbl=document.createElement("div");lbl.className="ctrlRowLabel";lbl.textContent=label;
  const row=document.createElement("div");row.className="ctrlRowInputs";const rng=document.createElement("input");rng.type="range";rng.min=String(min);rng.max=String(max);rng.step=String(step);rng.value=String(value);
  const num=document.createElement("input");num.type="number";num.min=String(min);num.max=String(max);num.step=String(step);num.value=String(value);
  rng.addEventListener("input",()=>{num.value=rng.value;onInput(parseFloat(rng.value));});num.addEventListener("input",()=>{rng.value=num.value;onInput(parseFloat(num.value));});
  row.appendChild(rng);row.appendChild(num);wrap.appendChild(lbl);wrap.appendChild(row);return{wrap,rng,num};
}
let _peakSliderRefs={};
function renderPeakControls(){
  const g=activeGroup(),t=activeTrait();ensureGroupShape(state,g);const tr=g.traits[t.key];
  if(!state.ui.selectedPeakId&&tr.peaks.length)state.ui.selectedPeakId=tr.peaks[0].id;
  const p=tr.peaks.find(x=>x.id===state.ui.selectedPeakId)||tr.peaks[0]||null;_peakSliderRefs={};els.peakControls.innerHTML="";
  if(!p){const d=document.createElement("div");d.className="small";d.textContent="No peaks.";els.peakControls.appendChild(d);return;}
  const box=document.createElement("div");box.className="peakCard";const title=document.createElement("div");title.className="peakCardTitle";title.textContent="Peak #"+(tr.peaks.indexOf(p)+1);
  const grid=document.createElement("div");grid.className="peakGrid";
  const muR=makeRange("Center (μ)",p.mu,-0.5,t.bins.length-0.5,0.01,v=>{p.mu=v;saveState(state);updateCurveAndBins();});
  const sigR=makeRange("Width (σ)",p.sigma,0.12,Math.max(6,t.bins.length),0.01,v=>{p.sigma=v;saveState(state);updateCurveAndBins();});
  const ampR=makeRange("Weight (amp)",p.amp,0,AMP_MAX,0.01,v=>{p.amp=clamp(v,0,AMP_MAX);saveState(state);updateCurveAndBins();});
  _peakSliderRefs={mu:{rng:muR.rng,num:muR.num},sigma:{rng:sigR.rng,num:sigR.num},amp:{rng:ampR.rng,num:ampR.num}};
  grid.appendChild(muR.wrap);grid.appendChild(sigR.wrap);grid.appendChild(ampR.wrap);
  const note=document.createElement("div");note.className="peakNote";note.textContent="Weight controls peak dominance vs other peaks and the baseline floor.";
  box.appendChild(title);box.appendChild(grid);box.appendChild(note);els.peakControls.appendChild(box);
  box.querySelectorAll("input").forEach(i=>i.disabled=isTemplateLocked(g));
}
function syncPeakSliders(){
  const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];const p=tr.peaks.find(x=>x.id===state.ui.selectedPeakId)||tr.peaks[0];
  if(!p||!_peakSliderRefs.mu)return;const set=(refs,val)=>{refs.rng.value=String(val);refs.num.value=String(val);};
  set(_peakSliderRefs.mu,Math.round(p.mu*1000)/1000);set(_peakSliderRefs.sigma,Math.round(p.sigma*1000)/1000);set(_peakSliderRefs.amp,Math.round(p.amp*1000)/1000);
}
function updateCurveAndBins(){const g=activeGroup();ensureGroupShape(state,g);renderCompletion();renderBins();drawCurve();syncPeakSliders();renderJsonPreview();}
function renderJsonPreview(){
  if(!state.ui.showJson){els.debug.classList.add("hidden");return;}els.debug.classList.remove("hidden");
  const g=activeGroup(),out={name:g.name,description:g.description,traits:{}};
  for(const t of state.traits){const probs=computeProbs(state,g,t.key);out.traits[t.key]={bins:Object.fromEntries(t.bins.map((b,i)=>[b,Math.round(probs[i]*1000)/10+"%"]))};}
  els.debug.textContent=JSON.stringify(out,null,2);
}
function isTraitComplete(state,g,key){
  const t=traitByKey(state,key),tr=g.traits[key],n=t.bins.length;
  if(!Array.isArray(tr.peaks)||!tr.peaks.length)return false;if(tr.peaks.every(p=>(p.amp??0)<=0.001))return false;
  const spill=clamp(state.settings.spillover,0,0.6);let sumW=0;for(let i=0;i<n;i++)sumW+=modeToWeight(tr.binModes[i]??2,spill);
  if(sumW<=0.0001)return false;return computeRawBins(state,g,key).reduce((a,b)=>a+b,0)>0.0001;
}
function rerender(full=true){
  if(full){renderGroupList();renderLockUI();renderTraitList();}
  renderCompletion();renderBins();drawCurve();syncPeakSliders();renderPeakControls();renderJsonPreview();
  els.description.value=activeGroup().description||"";els.spillover.value=String(state.settings.spillover);els.spilloverNum.value=String(state.settings.spillover);
}
function validateGroup(state,g,label){const issues=[];if(!(g.name||"").trim())issues.push(label+": Name empty.");if(!(g.description||"").trim())issues.push(label+": Description required.");for(const t of state.traits)if(!isTraitComplete(state,g,t.key))issues.push(label+": Incomplete trait: "+t.name);return issues;}
function validateProject(state){return flattenGroups(state.groups).flatMap(item=>{const g=findGroupById(state.groups,item.id);return validateGroup(state,g,g.name);});}
function showModal(lines){els.modalBody.innerHTML="";for(const l of lines){const li=document.createElement("li");li.className="modalIssueItem";li.textContent=l;els.modalBody.appendChild(li);}els.modal.classList.remove("hidden");}
function hideModal(){els.modal.classList.add("hidden");}
els.btnModalClose.addEventListener("click",hideModal);els.modal.addEventListener("click",e=>{if(e.target===els.modal)hideModal();});
function canDeleteActiveGroup(groups,activeGroupId){if(!Array.isArray(groups)||groups.length===0)return false;return !(groups.length===1&&groups[0]?.id===activeGroupId);}
function deleteGroupById(groups,id){for(let i=0;i<groups.length;i++){if(groups[i].id===id){groups.splice(i,1);return true;}if(groups[i].children&&deleteGroupById(groups[i].children,id))return true;}return false;}
els.btnNewGroup.addEventListener("click",()=>{const g=defaultGroup();state.groups.push(g);state.ui.activeGroupId=g.id;saveState(state);rerender();});
els.btnNewSubgroup.addEventListener("click",()=>{const parent=activeGroup();if(!parent.children)parent.children=[];const g=defaultGroup("Subgroup");parent.children.push(g);state.ui.activeGroupId=g.id;saveState(state);rerender();});
els.btnDeleteGroup.addEventListener("click",()=>{if(!canDeleteActiveGroup(state.groups,state.ui.activeGroupId)){alert("Cannot delete the last top-level group.");return;}deleteGroupById(state.groups,state.ui.activeGroupId);if(!state.groups.length){alert("Cannot leave the project without a top-level group.");return;}const flat=flattenGroups(state.groups);state.ui.activeGroupId=flat[0]?.id;saveState(state);rerender();});
els.btnDuplicateGroup.addEventListener("click",()=>{const src=activeGroup(),copy=deepClone(src);copy.id=uid();copy._isTemplate=false;copy.name=src.name+" (copy)";for(const t of state.traits)if(copy.traits[t.key])for(const p of copy.traits[t.key].peaks)p.id=uid();state.groups.push(copy);state.ui.activeGroupId=copy.id;saveState(state);rerender();});
els.selGroup.addEventListener("change",()=>{state.ui.activeGroupId=els.selGroup.value;state.ui.selectedPeakId=null;saveState(state);rerender();});
els.lockTemplatesToggle.addEventListener("change",()=>{state.ui.templatesLocked=els.lockTemplatesToggle.checked;saveState(state);rerender();});
function setSpillover(v){state.settings.spillover=clamp(parseFloat(v)||0,0,0.6);els.spillover.value=String(state.settings.spillover);els.spilloverNum.value=String(state.settings.spillover);saveState(state);updateCurveAndBins();}
els.spillover.addEventListener("input",()=>setSpillover(els.spillover.value));els.spilloverNum.addEventListener("input",()=>setSpillover(els.spilloverNum.value));
els.selTrait.addEventListener("change",()=>{state.ui.activeTraitKey=els.selTrait.value;state.ui.selectedPeakId=null;saveState(state);renderPeakControls();renderBins();drawCurve();syncPeakSliders();renderJsonPreview();});
els.description.addEventListener("input",()=>{activeGroup().description=els.description.value;saveState(state);renderCompletion();renderJsonPreview();});
els.btnAddPeak.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key],n=t.bins.length;const p={id:uid(),mu:(n-1)/2,sigma:Math.max(0.8,n/6),amp:1};tr.peaks.push(p);state.ui.selectedPeakId=p.id;saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnRemovePeak.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];if(tr.peaks.length<=1)return;const idx=tr.peaks.findIndex(x=>x.id===state.ui.selectedPeakId);tr.peaks.splice(idx<0?tr.peaks.length-1:idx,1);state.ui.selectedPeakId=tr.peaks[0]?.id||null;saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnNormalize.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];const total=tr.peaks.reduce((s,p)=>s+p.amp,0);if(total>0)tr.peaks.forEach(p=>p.amp=p.amp/total*AMP_MAX*0.6);saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnRandom.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key],n=t.bins.length;for(const p of tr.peaks){p.mu=Math.random()*(n-1);p.sigma=0.3+Math.random()*2;p.amp=0.5+Math.random()*(AMP_MAX-0.5);}saveState(state);renderPeakControls();updateCurveAndBins();});
els.toggleJson.addEventListener("change",()=>{state.ui.showJson=els.toggleJson.checked;saveState(state);renderJsonPreview();});
els.btnExportProject.addEventListener("click",()=>{const issues=validateProject(state);if(issues.length){showModal(issues);return;}downloadFile("ethnographer_project.json",new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));});
els.btnImportProject.addEventListener("click",()=>els.fileProject.click());
els.fileProject.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const s=JSON.parse(ev.target.result);if(!s.groups)throw new Error("Not a project file");s.traits=deepClone(DEFAULT_TRAITS);if(!s.ui)s.ui={activeGroupId:s.groups[0]?.id,activeTraitKey:DEFAULT_TRAITS[0].key,selectedPeakId:null,showJson:true,templatesLocked:true};state=s;saveState(state);rerender();}catch(err){alert("Import failed: "+err.message);}};r.readAsText(f);e.target.value="";});
els.btnExportProfile.addEventListener("click",()=>{const g=activeGroup(),issues=validateGroup(state,g,g.name);if(issues.length){showModal(issues);return;}const out={app:APP_NAME,version:APP_VERSION,name:g.name,description:g.description,traits:{}};for(const t of state.traits)out.traits[t.key]={peaks:g.traits[t.key]?.peaks.map(({mu,sigma,amp})=>({mu,sigma,amp})),binModes:g.traits[t.key]?.binModes};downloadFile(g.name.replace(/\s+/g,"_")+"_profile.json",new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));});
els.btnImportProfile.addEventListener("click",()=>els.fileProfile.click());
els.fileProfile.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const src=JSON.parse(ev.target.result);const g=activeGroup();if(src.name)g.name=src.name;if(src.description)g.description=src.description;if(src.traits)for(const t of state.traits){const s=src.traits[t.key];if(!s)continue;g.traits[t.key]={binModes:s.binModes||Array(t.bins.length).fill(2),peaks:(s.peaks||[]).map(p=>({id:uid(),...p}))};}saveState(state);rerender();}catch(err){alert("Import failed: "+err.message);}};r.readAsText(f);e.target.value="";});
els.btnDownloadCsv.addEventListener("click",()=>{const g=activeGroup(),rows=["Trait,Bin,Probability"];for(const t of state.traits){const probs=computeProbs(state,g,t.key);t.bins.forEach((b,i)=>rows.push(`"${t.name}","${b}",${(probs[i]*100).toFixed(2)}%`));}downloadFile(g.name.replace(/\s+/g,"_")+"_distribution.csv",new Blob([rows.join("\n")],{type:"text/csv"}));});
els.btnScreenshot.addEventListener("click",()=>{const link=document.createElement("a");link.download=activeGroup().name.replace(/\s+/g,"_")+"_"+activeTrait().key+".png";link.href=els.canvas.toDataURL("image/png");link.click();});
rerender();
