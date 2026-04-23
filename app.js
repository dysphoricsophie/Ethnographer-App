const{APP_NAME,STATE_KEY,AMP_MAX,BASE_FLOOR,DEFAULT_SETTINGS,DEFAULT_TRAITS,PRESET_GROUPS}=CFG;
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
function sanitizeGroupNode(g){
  if(!g||typeof g!=='object') g=defaultGroup('Recovered Group');
  g.id=g.id||uid();
  g.name=(g.name||'Recovered Group').toString();
  g.description=(g.description||'').toString();
  g.children=Array.isArray(g.children)?g.children:[];
  g.traits=(g.traits&&typeof g.traits==='object')?g.traits:{};
  ensureGroupShape({traits:DEFAULT_TRAITS},g);
  g.children=g.children.map(ch=>sanitizeGroupNode(ch));
  return g;
}
function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(STATE_KEY)||"null");
    if(raw&&raw.app===APP_NAME&&raw.version>=3) return migrateState(raw);
  }catch(e){ console.warn('State load failed, resetting to defaults.', e); }
  return buildDefaultState();
}
function migrateState(s){
  s=(s&&typeof s==='object')?s:{};
  s.app=APP_NAME;
  s.version=3;
  s.traits=deepClone(DEFAULT_TRAITS);
  s.settings=(s.settings&&typeof s.settings==='object')?s.settings:{};
  const sp=parseFloat(s.settings.spillover);
  s.settings.spillover=Number.isFinite(sp)?clamp(sp,0,0.6):DEFAULT_SETTINGS.spillover;
  if(s.groups) s.groups=s.groups.filter(g=>!g._isTemplate);
  s.groups=Array.isArray(s.groups)?s.groups.map(g=>sanitizeGroupNode(g)):[defaultGroup('New Group')];
  if(!s.groups.length) s.groups=[defaultGroup('New Group')];
  if(!s.ui||typeof s.ui!=='object') s.ui={};
  s.ui.activeGroupId=s.ui.activeGroupId||s.groups[0]?.id;
  s.ui.activeTraitKey=traitByKey({traits:DEFAULT_TRAITS},s.ui.activeTraitKey)?.key||DEFAULT_TRAITS[0].key;
  s.ui.selectedPeakId=s.ui.selectedPeakId||null;
  s.ui.showJson=s.ui.showJson!==false;
  s.ui.templatesLocked=false;
  s.ui.activeTab=s.ui.activeTab||'Editor';
  return s;
}
function buildDefaultState(){
  const groups=[defaultGroup("New Group")];
  return{app:APP_NAME,version:3,traits:deepClone(DEFAULT_TRAITS),settings:deepClone(DEFAULT_SETTINGS),groups,
    ui:{activeGroupId:groups[0].id,activeTraitKey:DEFAULT_TRAITS[0].key,selectedPeakId:null,showJson:true,templatesLocked:false,activeTab:'Editor'}};
}
function saveState(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(e){ console.warn('State save failed', e); }}

const els={

  btnNewGroup:document.getElementById("btnNewGroup"),btnNewSubgroup:document.getElementById("btnNewSubgroup"),selGroup:document.getElementById("selGroup"),
  btnDeleteGroup:document.getElementById("btnDeleteGroup"),
  spillover:document.getElementById("spillover"),spilloverNum:document.getElementById("spilloverNum"),
  selTrait:document.getElementById("selTrait"),btnAddPeak:document.getElementById("btnAddPeak"),btnRemovePeak:document.getElementById("btnRemovePeak"),
  btnNormalize:document.getElementById("btnNormalize"),btnRandom:document.getElementById("btnRandom"),bins:document.getElementById("bins"),canvas:document.getElementById("curve"),
  btnExportProfile:document.getElementById("btnExportProfile"),btnImportProfile:document.getElementById("btnImportProfile"),fileProfile:document.getElementById("fileProfile"),
  btnDownloadCsv:document.getElementById("btnDownloadCsv"),btnScreenshot:document.getElementById("btnScreenshot"),peakControls:document.getElementById("peakControls"),
  description:document.getElementById("description"),completionStatus:document.getElementById("completionStatus"),toggleJson:document.getElementById("toggleJson"),
  activeObjectHeader:document.getElementById("activeObjectHeader"),btnHelpToggle:document.getElementById("btnHelpToggle"),helpPanel:document.getElementById("helpPanel"),
  debug:document.getElementById("debug"),modal:document.getElementById("modal"),modalBody:document.getElementById("modalBody"),btnModalClose:document.getElementById("btnModalClose"),
};

let state=loadState();
function activeGroup(){const visible=state.groups.filter(g=>!g._isTemplate);return findGroupById(visible,state.ui.activeGroupId)||visible[0]||state.groups[0];}
function activeTrait(){return traitByKey(state,state.ui.activeTraitKey)||state.traits[0];}
function isTemplateLocked(g){return false;} // templates hidden; all visible groups editable

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
(()=>{let _roT;new ResizeObserver(()=>{clearTimeout(_roT);_roT=setTimeout(drawCurve,30);}).observe(els.canvas.parentElement);})();

function renderGroupList(){
  // Only show non-template groups
  const visibleGroups=state.groups.filter(g=>!g._isTemplate);
  const flat=flattenGroups(visibleGroups);els.selGroup.innerHTML="";
  for(const item of flat){const opt=document.createElement("option");opt.value=item.id;opt.textContent=("  ".repeat(item.depth))+(item.depth?"- ":"")+item.name;els.selGroup.appendChild(opt);}
  // If active group is a template or gone, pick first visible
  const cur=findGroupById(visibleGroups,state.ui.activeGroupId);
  if(cur)els.selGroup.value=cur.id;
  else if(flat[0]){state.ui.activeGroupId=flat[0].id;els.selGroup.value=flat[0].id;}
}
function renderLockUI(){
  // Templates are hidden; all visible groups are fully editable
  [els.description,els.btnAddPeak,els.btnRemovePeak,els.btnNormalize,els.btnRandom].forEach(el=>{if(el)el.disabled=false;});
  els.peakControls.querySelectorAll("input").forEach(i=>i.disabled=false);
  els.canvas.style.opacity="1";els.canvas.style.pointerEvents="auto";
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
  for(const t of state.traits){
    const tr=g.traits[t.key];
    out.traits[t.key]={
      binModes:tr?.binModes||Array(t.bins.length).fill(2),
      peaks:(tr?.peaks||[]).map(({mu,sigma,amp})=>({mu:Math.round(mu*1000)/1000,sigma:Math.round(sigma*1000)/1000,amp:Math.round(amp*1000)/1000}))
    };
  }
  els.debug.textContent=JSON.stringify(out,null,2);
}
function renderActiveObjectHeader(){
  if(!els.activeObjectHeader)return;
  const g=activeGroup(),t=activeTrait();
  const tr=g?.traits?.[t.key];
  const peakIdx=Math.max(0,(tr?.peaks||[]).findIndex(p=>p.id===state.ui.selectedPeakId));
  const peakLabel=tr?.peaks?.length?`Peak ${peakIdx+1}`:"None";
  els.activeObjectHeader.textContent=`Editing: ${g?.name||"Group"} · Active trait: ${t?.name||"-"} · Selected peak: ${peakLabel}`;
}
function isTraitComplete(state,g,key){
  const t=traitByKey(state,key),tr=g.traits[key],n=t.bins.length;
  if(!Array.isArray(tr.peaks)||!tr.peaks.length)return false;if(tr.peaks.every(p=>(p.amp??0)<=0.001))return false;
  const spill=clamp(state.settings.spillover,0,0.6);let sumW=0;for(let i=0;i<n;i++)sumW+=modeToWeight(tr.binModes[i]??2,spill);
  if(sumW<=0.0001)return false;return computeRawBins(state,g,key).reduce((a,b)=>a+b,0)>0.0001;
}
function rerender(full=true){ if(state.ui.activeTab==='Face') setTimeout(renderFace,10);
  if(full){renderGroupList();renderLockUI();renderTraitList();}
  renderCompletion();renderBins();drawCurve();syncPeakSliders();renderPeakControls();renderJsonPreview();renderActiveObjectHeader();
  els.description.value=activeGroup().description||"";els.spillover.value=String(state.settings.spillover);els.spilloverNum.value=String(state.settings.spillover);
}
function validateGroup(state,g,label){const issues=[];if(!(g.name||"").trim())issues.push(label+": Name empty.");if(!(g.description||"").trim())issues.push(label+": Description required.");for(const t of state.traits)if(!isTraitComplete(state,g,t.key))issues.push(label+": Incomplete trait: "+t.name);return issues;}
function validateProject(state){const visible=state.groups.filter(g=>!g._isTemplate);return flattenGroups(visible).flatMap(item=>{const g=findGroupById(visible,item.id);return validateGroup(state,g,g.name);});}
function showModal(lines){els.modalBody.innerHTML="";for(const l of lines){const li=document.createElement("li");li.className="modalIssueItem";li.textContent=l;els.modalBody.appendChild(li);}els.modal.classList.remove("hidden");}
function hideModal(){els.modal.classList.add("hidden");}
els.btnModalClose.addEventListener("click",hideModal);els.modal.addEventListener("click",e=>{if(e.target===els.modal)hideModal();});
function deleteGroupById(groups,id){for(let i=0;i<groups.length;i++){if(groups[i].id===id){groups.splice(i,1);return true;}if(groups[i].children&&deleteGroupById(groups[i].children,id))return true;}return false;}
els.btnNewGroup.addEventListener("click",()=>{const g=defaultGroup();state.groups.push(g);state.ui.activeGroupId=g.id;saveState(state);rerender();});
els.btnNewSubgroup.addEventListener("click",()=>{const parent=activeGroup();if(!parent.children)parent.children=[];const g=defaultGroup("Subgroup");parent.children.push(g);state.ui.activeGroupId=g.id;saveState(state);rerender();});
els.btnDeleteGroup.addEventListener("click",()=>{const visible=state.groups.filter(g=>!g._isTemplate);if(visible.length<=1){alert("Cannot delete the last group.");return;}deleteGroupById(state.groups,state.ui.activeGroupId);const flat=flattenGroups(state.groups.filter(g=>!g._isTemplate));state.ui.activeGroupId=flat[0]?.id;saveState(state);rerender();});
// ── Create from Template button ──────────────────────────────────
document.getElementById('btnCreateFromTemplate').addEventListener('click',()=>{
  // Populate template selector
  const sel=document.getElementById('tplSelect');
  sel.innerHTML='';
  PRESET_GROUPS.forEach((p,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=p.name;sel.appendChild(opt);});
  // Set defaults
  const first=PRESET_GROUPS[0];
  document.getElementById('tplName').value=first?first.name+' (custom)':'New Group';
  document.getElementById('tplDescPreview').textContent=first?.description||'';
  document.getElementById('tplClearDesc').checked=false;
  document.getElementById('tplModal').classList.remove('hidden');
});
document.getElementById('tplSelect').addEventListener('change',()=>{
  const idx=parseInt(document.getElementById('tplSelect').value);
  const p=PRESET_GROUPS[idx];
  document.getElementById('tplDescPreview').textContent=p?.description||'';
  document.getElementById('tplName').value=p?p.name+' (custom)':'New Group';
});
document.getElementById('btnTplCancel').addEventListener('click',()=>document.getElementById('tplModal').classList.add('hidden'));
document.getElementById('tplModal').addEventListener('click',e=>{if(e.target===document.getElementById('tplModal'))document.getElementById('tplModal').classList.add('hidden');});
document.getElementById('btnTplConfirm').addEventListener('click',()=>{
  const idx=parseInt(document.getElementById('tplSelect').value);
  const p=PRESET_GROUPS[idx];if(!p)return;
  const copy=groupFromPreset(p);
  copy._isTemplate=false;
  copy.name=document.getElementById('tplName').value.trim()||p.name+' (custom)';
  if(document.getElementById('tplClearDesc').checked)copy.description='';
  state.groups.push(copy);state.ui.activeGroupId=copy.id;
  document.getElementById('tplModal').classList.add('hidden');
  saveState(state);rerender();
});
els.selGroup.addEventListener("change",()=>{state.ui.activeGroupId=els.selGroup.value;state.ui.selectedPeakId=null;saveState(state);rerender();});
function setSpillover(v){state.settings.spillover=clamp(parseFloat(v)||0,0,0.6);els.spillover.value=String(state.settings.spillover);els.spilloverNum.value=String(state.settings.spillover);saveState(state);updateCurveAndBins();}
els.spillover.addEventListener("input",()=>setSpillover(els.spillover.value));els.spilloverNum.addEventListener("input",()=>setSpillover(els.spilloverNum.value));
els.selTrait.addEventListener("change",()=>{state.ui.activeTraitKey=els.selTrait.value;state.ui.selectedPeakId=null;saveState(state);renderPeakControls();renderBins();drawCurve();syncPeakSliders();renderJsonPreview();});
els.description.addEventListener("input",()=>{activeGroup().description=els.description.value;saveState(state);renderCompletion();renderJsonPreview();});
els.btnAddPeak.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key],n=t.bins.length;const p={id:uid(),mu:(n-1)/2,sigma:Math.max(0.8,n/6),amp:1};tr.peaks.push(p);state.ui.selectedPeakId=p.id;saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnRemovePeak.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];if(tr.peaks.length<=1)return;const idx=tr.peaks.findIndex(x=>x.id===state.ui.selectedPeakId);tr.peaks.splice(idx<0?tr.peaks.length-1:idx,1);state.ui.selectedPeakId=tr.peaks[0]?.id||null;saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnNormalize.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key];const total=tr.peaks.reduce((s,p)=>s+p.amp,0);if(total>0)tr.peaks.forEach(p=>p.amp=p.amp/total*AMP_MAX*0.6);saveState(state);renderPeakControls();updateCurveAndBins();});
els.btnRandom.addEventListener("click",()=>{if(isTemplateLocked(activeGroup()))return;const g=activeGroup(),t=activeTrait(),tr=g.traits[t.key],n=t.bins.length;for(const p of tr.peaks){p.mu=Math.random()*(n-1);p.sigma=0.3+Math.random()*2;p.amp=0.5+Math.random()*(AMP_MAX-0.5);}saveState(state);renderPeakControls();updateCurveAndBins();});
els.toggleJson.addEventListener("change",()=>{state.ui.showJson=els.toggleJson.checked;saveState(state);renderJsonPreview();});
if(els.btnHelpToggle&&els.helpPanel){
  els.btnHelpToggle.addEventListener("click",()=>{
    els.helpPanel.classList.toggle("hidden");
    els.btnHelpToggle.textContent=els.helpPanel.classList.contains("hidden")?"? Help & guidance":"Hide help";
  });
}
document.getElementById("btnExportProject").addEventListener("click",()=>{const issues=validateProject(state);if(issues.length){showModal(issues);return;}const exportState=Object.assign({},state,{groups:state.groups.filter(g=>!g._isTemplate)});const firstName=exportState.groups[0]?.name||'project';const safeName=firstName.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'');downloadFile(safeName+"_project.json",new Blob([JSON.stringify(exportState,null,2)],{type:"application/json"}));});
document.getElementById("btnImportProject").addEventListener("click",()=>document.getElementById("fileProject").click());
document.getElementById("fileProject").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const s=JSON.parse(ev.target.result);if(!s.groups)throw new Error("Not a project file");s.traits=deepClone(DEFAULT_TRAITS);if(!s.ui)s.ui={activeGroupId:s.groups[0]?.id,activeTraitKey:DEFAULT_TRAITS[0].key,selectedPeakId:null,showJson:true,templatesLocked:true};state=s;saveState(state);rerender();}catch(err){alert("Import failed: "+err.message);}};r.readAsText(f);e.target.value="";});
els.btnExportProfile.addEventListener("click",()=>{const g=activeGroup(),issues=validateGroup(state,g,g.name);if(issues.length){showModal(issues);return;}const out={app:APP_NAME,version:3,name:g.name,description:g.description,traits:{}};for(const t of state.traits)out.traits[t.key]={peaks:g.traits[t.key]?.peaks.map(({mu,sigma,amp})=>({mu,sigma,amp})),binModes:g.traits[t.key]?.binModes};downloadFile(g.name.replace(/\s+/g,"_")+"_profile.json",new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));});
els.btnImportProfile.addEventListener("click",()=>els.fileProfile.click());
els.fileProfile.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const src=JSON.parse(ev.target.result);const g=activeGroup();if(src.name)g.name=src.name;if(src.description)g.description=src.description;if(src.traits)for(const t of state.traits){const s=src.traits[t.key];if(!s)continue;g.traits[t.key]={binModes:s.binModes||Array(t.bins.length).fill(2),peaks:(s.peaks||[]).map(p=>({id:uid(),...p}))};}saveState(state);rerender();}catch(err){alert("Import failed: "+err.message);}};r.readAsText(f);e.target.value="";});
els.btnDownloadCsv.addEventListener("click",()=>{const g=activeGroup(),rows=["Trait,Bin,Probability"];for(const t of state.traits){const probs=computeProbs(state,g,t.key);t.bins.forEach((b,i)=>rows.push(`"${t.name}","${b}",${(probs[i]*100).toFixed(2)}%`));}downloadFile(g.name.replace(/\s+/g,"_")+"_distribution.csv",new Blob([rows.join("\n")],{type:"text/csv"}));});
els.btnScreenshot.addEventListener("click",()=>{const link=document.createElement("a");link.download=activeGroup().name.replace(/\s+/g,"_")+"_"+activeTrait().key+".png";link.href=els.canvas.toDataURL("image/png");link.click();});

// ── Tab switching ─────────────────────────────────────────────────
// switchTab patched below

// ── Trait descriptions ────────────────────────────────────────────
const TRAIT_DESCS={
  skin_colour:`Skin pigmentation is driven primarily by melanin concentration in the epidermis. UV-B radiation is the dominant selective pressure: high UV-B near the equator selects for dark skin (photoprotection against folate photolysis and DNA damage), while low UV-B at high latitudes selects for depigmentation (vitamin D3 synthesis). The SLC24A5 and SLC45A2 alleles explaining much of Eurasian lightening derive from post-Out-of-Africa adaptation, becoming common only ~10–8 kya. Skin colour is therefore a fast-evolving, highly polygenic trait with no single ancestral "default".`,
  hair_colour:`Hair colour depends on the ratio of eumelanin (brown/black) to pheomelanin (red/yellow) in the hair shaft cortex. MC1R variants drive red and blonde phenotypes, predominantly in NW European populations where relaxed UV selection reduced the cost of MC1R loss-of-function. Black hair reflects high eumelanin and is ancestral across most human populations. Blonde hair in Melanesia (TYRP1 gene) evolved independently from European blondism — a striking example of convergent evolution under different selective pressures.`,
  hair_texture:`Hair cross-section shape determines curliness: circular → straight; elliptical → wavy or curly. Tightly coiled "Afrotrichous" hair is ancestral for sub-Saharan African lineages; it forms a thermal insulation layer reducing solar heat load on the scalp while maximising convective cooling. EDAR 370A (derived allele near-fixed in East Asians and Native Americans) produces thicker, straighter hair shafts, denser scalp follicles, and additional pleiotropic effects (more eccrine glands, altered breast morphology, shovel-shaped incisors). The derived EDAR allele likely swept in cold, dry environments where its effects on sweat gland density and heat retention were adaptive.`,
  body_hair:`Body hair density is inversely associated with the EDAR 370A allele in East Asians and shows high androgen sensitivity elsewhere. In populations with high androgen receptor sensitivity (many South Asian, Middle Eastern, and Mediterranean groups), males develop notably dense body hair. Sparse body hair in tropical populations is linked to ectoparasite load reduction and more efficient sweating surface. Sparse body hair in NE Asian populations is a pleiotropic consequence of EDAR 370A positive selection, not a separate adaptation.`,
  height:`Adult stature is ~80% heritable and responds rapidly to polygenic selection. Cold-climate populations (Bergmann's rule) tend toward larger body mass, but limb:trunk ratio matters more than raw height. Tallest populations globally include Nilotic groups (Dinka, Tutsi), N. Europeans, and the Tehuelche of Patagonia. Pygmy stature in equatorial forest populations is associated with low insulin-like growth factor-1 (IGF-1) levels and is an adaptation to caloric scarcity and thermoregulation in dense forest. Nutrition is the largest non-genetic driver, explaining secular height trends within populations.`,
  trunk_length:`The ratio of sitting height to total height reflects Allen's rule: cold climates select for shorter limbs relative to trunk (reduced radiative surface area), while hot climates select for longer limbs. Nilotic and Sudanese populations show extreme relative leg length. East Asians and Arctic peoples (Inuit, Mongolian) show relatively long trunks. This ratio is highly heritable and reflects deep ecogeographic adaptation rather than recent cultural changes.`,
  body_type:`Frame size and robusticity reflect both Bergmann/Allen ecogeographic rules and subsistence ecology. Hunter-gatherers in open environments tend toward lean, long-limbed frames; cold-climate pastoralists and high-latitude groups toward stocky, robust frames. Tropical forest hunter-gatherers (including some African Pygmy populations) are small and gracile. Musculoskeletal robusticity tracks activity levels across generations through bone remodelling, but underlying frame size is substantially genetic.`,
  steatopygia:`Gluteofemoral fat deposition ("steatopygia") is most pronounced in Khoikhoi and San (Bushman) populations of southern Africa. It represents a sex-specific energy storage adaptation possibly linked to seasonal food scarcity in semi-arid environments; the fat depot can be metabolised during lean seasons. It is controlled by sex hormones and appears to be a derived trait in specific southern African lineages, not a general sub-Saharan feature. Mild gluteofemoral deposition (compared to abdominal) is common in many populations and is hormonally mediated.`,
  cephalic_index:`The ratio of skull width to length (×100). Dolichocephaly (long, narrow skull) is ancestral and common across Africa, South Asia, and parts of Europe. Brachycephaly (wide, short skull) is strongly associated with Central and NE Asian populations and correlates with the EDAR 370A allele region through linked selection. Secular trends toward rounder skulls have been observed in many populations, partly attributed to softer diets reducing masticatory stress on bone. The index has no direct cognitive or health implications.`,
  head_height:`Cranial vault height (hypsicrany vs. chamacrany) varies across populations. High vaults are characteristic of NW Europeans and some African groups; lower, flatter vaults characterise Mongoloid-cluster populations. High vault development is partly linked to brain volume distribution and masticatory muscle attachment patterns. It is a moderately heritable metric with minimal direct adaptive significance identified beyond its correlated traits.`,
  head_size:`Absolute cranial capacity correlates with brain volume (~1350 ml average modern human). Variation is ~50% heritable. Larger cranial volumes are modestly associated with European and African samples; smaller with some Island Southeast Asian groups. Secular increases in head circumference have been documented in many populations, linked to improved nutrition. No consistent relationship with cognitive ability exists at the population level after controlling for socioeconomic factors.`,
  nose_breadth:`Nasal morphology is shaped by air-conditioning selection: narrow, high-bridged noses (leptorrhine) warm and humidify cold dry air more efficiently; wide, low-bridged noses (platyrrhine) are better suited to warm humid tropical air where conditioning is less critical. This explains the tight correlation between nasal index and climate independently documented in multiple studies (Weiner 1954; Noback et al. 2011). Nasal width is highly heritable and responds rapidly to selection, making it one of the most climatically informative craniometric traits.`,
  face_breadth:`Facial breadth (bizygomatic width) is broad in populations with Central/NE Asian ancestry, likely linked to masticatory muscle (masseter) volume and dietary adaptation to tough, fibrous foods. It is also influenced by EDAR-region genetics in East Asian populations. Narrow faces characterise gracile Mediterranean and Horn of Africa populations. Facial breadth correlates with robusticity and cold-climate body proportions more broadly.`,
  prognathism:`Alveolar prognathism (forward projection of the lower face and dentition) is most pronounced in sub-Saharan African populations and Australian Aboriginals, and is associated with larger tooth size and jaw robusticity in populations with historically abrasive diets. Orthognathy (flat midface) characterises East Asian and most European populations. Prognathism has no functional impairment and represents retained ancestral morphology in populations with less intense selection toward orthognathism.`,
  eye_folds:`The epicanthal fold (a skin fold covering the inner corner of the eye) is near-universal in East Asian, Central Asian, and many Southeast Asian populations. It is strongly associated with the EDAR 370A allele's regional sweep. Proposed adaptive functions include protection against glare from snow and ice (Arctic populations) and wind-blown dust (steppe populations). The Mongolian fold specifically covers the lacrimal caruncle. It is rare in African and European populations except as an infant feature that resolves with nasal bridge development.`,
  male_neoteny:`Neoteny in males (retention of juvenile facial features into adulthood — reduced brow ridges, rounder face, shorter lower face) is most pronounced in East Asian populations and correlates with the EDAR sweep and associated craniofacial changes. It may reflect sexual selection pressures or be a pleiotropic consequence of skull shape changes linked to diet and climate adaptation. Robust, non-neotenous male faces (heavy brow ridges, long lower face) are most common in populations with deep ancestry in sub-Saharan Africa and Australia.`,
  female_neoteny:`Female facial neoteny (large eyes relative to face, small nose, rounded face) is highest in East Asian populations and correlates with mate-preference research documenting cross-cultural preferences for neotenous features as cues of youth and health. It is partly a consequence of the same craniofacial developmental shifts that produce brachycephaly and reduced prognathism, and partly independent sexual-selection mediated. Northern European populations also score relatively high compared to African and Australian populations.`,
  lactose_tolerance:`Lactase persistence (LP) — the continued expression of lactase enzyme into adulthood — is almost absent in ancestral human populations (lactase non-persistence is the default). LP alleles (LCT −13910*T in Europeans; several independent alleles in E. African pastoralists) swept to high frequency specifically in cattle-herding populations over the last ~7,500 years (one of the strongest signatures of recent positive selection in the human genome). Frequency correlates tightly with historic dairying intensity: ~90–95% in northern Europeans and some Nilotic groups, ~30–50% in Middle Eastern and Indian populations, ~5–15% in most East Asian and Amerindian groups. Pre-1500 CE populations with no dairying tradition have effectively zero LP.`,
  height_dimorphism:`Sexual dimorphism in height (males averaging 5–15% taller than females across populations) reflects the intersection of sexual selection, operational sex ratio, and subsistence ecology. Dimorphism is highest in polygynous societies with high male-male competition and lowest in monogamous, high-paternal-investment societies. Nilotic pastoralists show among the largest dimorphism; some Arctic forager groups the lowest. Absolute size dimorphism scales with mean height, so tall populations also tend to show larger absolute dimorphism.`,
  muscle_dimorphism:`Male-female differences in muscle mass (males average ~40% more upper-body strength) are driven by testosterone's anabolic effects on muscle protein synthesis and are broadly consistent across populations, though modulated by subsistence activity, diet protein quality, and genetic variation in androgen receptor sensitivity. Higher muscle dimorphism is associated with populations with historically heavy male physical labour and high-protein diets (pastoralists, hunter-gatherers with large-game hunting). Lower dimorphism characterises agricultural populations with more equal subsistence labour division.`,
};

// ── Trait Library ─────────────────────────────────────────────────
function renderLibrary(){
  const g=activeGroup();
  const grouped=new Map();
  for(const t of state.traits){if(!grouped.has(t.category))grouped.set(t.category,[]);grouped.get(t.category).push(t);}
  const el=document.getElementById('libContent');el.innerHTML='';
  for(const[cat,traits]of grouped){
    const sec=document.createElement('div');
    const catTitle=document.createElement('div');catTitle.className='libCatTitle';catTitle.textContent=cat;
    const grid=document.createElement('div');grid.className='libGrid';
    for(const t of traits){
      const probs=computeProbs(state,g,t.key);
      const card=document.createElement('div');card.className='traitCard';
      const nm=document.createElement('div');nm.className='traitCardName';nm.textContent=t.name;
      const chips=document.createElement('div');chips.className='traitCardBins';
      t.bins.forEach((b,i)=>{
        const chip=document.createElement('span');chip.className='traitBinChip';
        chip.style.background=t.colors?.[i]||'#9D87D2';
        const pct=Math.round(probs[i]*100);
        chip.style.minWidth=Math.max(18,pct*1.4)+'px';
        chip.style.textAlign='center';chip.title=b+': '+pct+'%';
        chip.textContent=pct>9?pct+'%':'';
        chips.appendChild(chip);
      });
      const topIdx=probs.indexOf(Math.max(...probs));
      const descText=TRAIT_DESCS[t.key]||'';
      const descWrap=document.createElement('div');
      const descEl=document.createElement('div');descEl.className='traitCardDesc';descEl.textContent=descText;
      descWrap.appendChild(descEl);
      if(descText.length>180){
        const toggle=document.createElement('span');toggle.className='traitCardReadMore';toggle.textContent='Read more';
        toggle.addEventListener('click',e=>{e.stopPropagation();const exp=descEl.classList.toggle('expanded');toggle.textContent=exp?'Read less':'Read more';});
        descWrap.appendChild(toggle);
      }
      const activeNote=document.createElement('div');activeNote.style.cssText='font-size:10px;color:var(--ok);margin-top:5px;font-weight:600;';
      activeNote.textContent='Active group: most common '+t.bins[topIdx]+' ('+Math.round(probs[topIdx]*100)+'%)';
      card.appendChild(nm);card.appendChild(chips);card.appendChild(activeNote);card.appendChild(descWrap);
      card.addEventListener('click',()=>{state.ui.activeTraitKey=t.key;saveState(state);switchTab('Editor');rerender();});
      grid.appendChild(card);
    }
    sec.appendChild(catTitle);sec.appendChild(grid);el.appendChild(sec);
  }
}

// ── Compare ───────────────────────────────────────────────────────
function populateCmpSelects(){
  const flat=flattenGroups(state.groups);
  ['cmpSelA','cmpSelB'].forEach((id,idx)=>{
    const sel=document.getElementById(id),prev=sel.value;sel.innerHTML='';
    flat.forEach(item=>{const opt=document.createElement('option');opt.value=item.id;opt.textContent=('  '.repeat(item.depth))+(item.depth?'- ':'')+item.name;sel.appendChild(opt);});
    if(prev&&flat.find(f=>f.id===prev))sel.value=prev;
    else sel.value=flat[Math.min(idx,flat.length-1)]?.id;
  });
}
document.getElementById('cmpSelA').addEventListener('change',renderCompare);
document.getElementById('cmpSelB').addEventListener('change',renderCompare);

const CMP_PL=14,CMP_PR=16,CMP_PT=18;
function drawCmpCanvas(canvas,g,t){
  const W=canvas.width,H=canvas.height,ctx=canvas.getContext('2d');
  const tr=g.traits[t.key],n=t.bins.length;
  const padB=(n>5||Math.max(...t.bins.map(b=>b.length))>10)?50:26;
  const baseY=H-padB,probs=computeProbs(state,g,t.key),maxP=Math.max(...probs,0.001);
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1C1623');bg.addColorStop(1,'#151316');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(61,44,76,0.5)';ctx.lineWidth=1;
  for(let i=1;i<=3;i++){const y=CMP_PT+(i/3)*(H-CMP_PT-padB);ctx.beginPath();ctx.moveTo(CMP_PL,y);ctx.lineTo(W-CMP_PR,y);ctx.stroke();}
  ctx.strokeStyle='rgba(92,58,91,0.5)';ctx.beginPath();ctx.moveTo(CMP_PL,baseY);ctx.lineTo(W-CMP_PR,baseY);ctx.stroke();
  const barW=(W-CMP_PL-CMP_PR)/n*0.7;
  for(let i=0;i<n;i++){
    const col=t.colors?.[i]||'#9D87D2',bx=CMP_PL+(i+0.5)/n*(W-CMP_PL-CMP_PR)-barW/2,bh=(probs[i]/maxP)*(H-CMP_PT-padB),by=baseY-bh;
    ctx.fillStyle=col+'70';ctx.beginPath();ctx.roundRect(bx,by,barW,bh,2);ctx.fill();
    ctx.fillStyle=col;ctx.fillRect(bx,by,barW,2);
  }
  const STEPS=200,pts=[];
  for(let s=0;s<=STEPS;s++){
    const xi=s/STEPS*(n-1);let v=0;
    for(let i=0;i<n;i++){const wt=modeToWeight(tr.binModes[i]??2,clamp(state.settings.spillover,0,0.6));let mix=0;for(const p of tr.peaks)mix+=clamp(p.amp,0,AMP_MAX)*gauss(xi,p.mu,p.sigma);v+=wt*(BASE_FLOOR+mix)/n;}
    pts.push({x:xi,v});
  }
  const maxV=Math.max(...pts.map(p=>p.v),0.001);
  const toC=p=>({px:CMP_PL+(p.x/Math.max(n-1,1))*(W-CMP_PL-CMP_PR),py:CMP_PT+(1-p.v/maxV)*(H-CMP_PT-padB)});
  const fp=toC(pts[0]);
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);pts.slice(1).forEach(p=>{const c=toC(p);ctx.lineTo(c.px,c.py);});
  const lp=toC(pts[pts.length-1]);ctx.lineTo(lp.px,baseY);ctx.lineTo(fp.px,baseY);ctx.closePath();
  const grd=ctx.createLinearGradient(0,CMP_PT,0,baseY);grd.addColorStop(0,'rgba(157,135,210,0.22)');grd.addColorStop(1,'rgba(77,59,125,0.02)');
  ctx.fillStyle=grd;ctx.fill();
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);pts.slice(1).forEach(p=>{const c=toC(p);ctx.lineTo(c.px,c.py);});
  ctx.strokeStyle='#9D87D2';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.font='9px system-ui,sans-serif';ctx.fillStyle='rgba(185,162,164,0.75)';ctx.textAlign='center';ctx.textBaseline='top';
  for(let i=0;i<n;i++){const cx=CMP_PL+(i+0.5)/n*(W-CMP_PL-CMP_PR);ctx.fillText(t.bins[i],cx,baseY+4);}
  ctx.restore();
}

function renderCompare(){
  populateCmpSelects();
  const gA=findGroupById(state.groups,document.getElementById('cmpSelA').value);
  const gB=findGroupById(state.groups,document.getElementById('cmpSelB').value);
  const el=document.getElementById('cmpContent');el.innerHTML='';
  if(!gA||!gB){el.innerHTML='<div class="cmpEmpty">Select two groups above to compare.</div>';return;}
  ensureGroupShape(state,gA);ensureGroupShape(state,gB);
  const pending=[];
  for(const t of state.traits){
    const row=document.createElement('div');row.className='cmpRow';
    row.innerHTML=`<div class="cmpRowHeader"><div class="cmpRowTitle">${t.name}</div><div class="cmpRowSub">${t.category}</div></div>`;
    const charts=document.createElement('div');charts.className='cmpCharts';
    [gA,gB].forEach(g=>{
      const wrap=document.createElement('div');wrap.className='cmpChartWrap';
      const lbl=document.createElement('div');lbl.className='cmpChartLabel';lbl.textContent=g.name;
      const canvas=document.createElement('canvas');
      canvas.style.cssText='display:block;width:100%;height:120px;border-radius:6px;background:var(--surface2)';
      wrap.appendChild(lbl);wrap.appendChild(canvas);charts.appendChild(wrap);
      pending.push({canvas,g,t});
    });
    row.appendChild(charts);el.appendChild(row);
  }
  // Wait for layout then size+draw all canvases
  setTimeout(()=>{
    pending.forEach(({canvas,g,t})=>{
      const w=canvas.offsetWidth||canvas.parentElement.offsetWidth||360;
      canvas.width=w; canvas.height=120;
      drawCmpCanvas(canvas,g,t);
    });
  },50);
}


// ════════════════════════════════════════════════════════════════
// FACE PREVIEW RENDERER
// ════════════════════════════════════════════════════════════════

const FACE_SKIN = ['#1C0E08','#4A2210','#7B4422','#B07845','#E8C090'];
const FACE_HAIR = ['#0A0602','#251408','#5C3018','#9A6830','#C8A860'];


const _faceSheetCache = new Map();
let _faceRenderRAF = null;

function _hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function _seededRand(seed) {
  let x = seed || 1;
  return function () {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) / 4294967295);
  };
}

function _faceTraitSnapshot() {
  const keys = [
    'skin_colour','hair_colour','hair_texture','cephalic_index','face_breadth','head_height','nose_breadth','prognathism',
    'eye_folds','male_neoteny','female_neoteny','body_hair','height_dimorphism','steatopygia','body_type','height','trunk_length','muscle_dimorphism'
  ];
  const out = {};
  for (const k of keys) out[k] = _faceEV(k);
  return out;
}

function _faceEV(key) {
  const g = activeGroup(); ensureGroupShape(state, g);
  const probs = computeProbs(state, g, key);
  const t = state.traits.find(x => x.key === key);
  if (!t || !probs.length) return 0.5;
  let s = 0; probs.forEach((p, i) => s += p * i);
  return s / Math.max(1, t.bins.length - 1);
}

function _lerpClr(a, b, t) {
  function parse(h) {
    if (h.startsWith('rgb')) { const m=h.match(/\d+/g); return m.map(Number); }
    return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  }
  const ca=parse(a), cb=parse(b);
  return `rgb(${Math.round(ca[0]+t*(cb[0]-ca[0]))},${Math.round(ca[1]+t*(cb[1]-ca[1]))},${Math.round(ca[2]+t*(cb[2]-ca[2]))})`;
}

function _scaleClr(clr, factor) { return _lerpClr(clr,'#000000',1-factor); }

function _gradClr(arr, t) {
  const idx = t * (arr.length - 1), lo = Math.floor(idx), hi = Math.min(lo+1, arr.length-1);
  return _lerpClr(arr[lo], arr[hi], idx - lo);
}

function _clrRgb(clr) {
  if (clr.startsWith('rgb')) return clr.match(/\d+/g).map(Number);
  return [parseInt(clr.slice(1,3),16),parseInt(clr.slice(3,5),16),parseInt(clr.slice(5,7),16)];
}

function _drawFace(canvas, isFemale, opts = {}) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // ── Trait parameters (all 0→1) ──
  const traits = opts.traits || _faceTraitSnapshot();
  const skinT = 1 - traits.skin_colour;      // 1=light
  const hairT = 1 - traits.hair_colour;       // 1=light
  const texT  = traits.hair_texture;           // 1=coily
  const ciT   = traits.cephalic_index;         // 1=wide skull
  const fbT   = traits.face_breadth;           // 1=wide face
  const hhT   = traits.head_height;            // 1=high vault
  const nbT   = traits.nose_breadth;           // 1=wide nose
  const prT   = traits.prognathism;            // 1=projecting jaw
  const efT   = traits.eye_folds;              // 1=strong epicanthal fold
  const mntT  = traits.male_neoteny;           // 1=smooth brow
  const fntT  = traits.female_neoteny;         // 1=round/soft
  const bhT   = traits.body_hair;              // 1=dense (beard)
  const hsTol = traits.height_dimorphism;      // dimorphism hint
  const stT   = traits.steatopygia;            // unused in face but reserved

  const neoT  = isFemale ? fntT : mntT;
  // Brow ridge: male only, strong when low neoteny + low prognathism
  const browRidge = isFemale ? 0 : Math.max(0, (1-mntT)*0.9);

  // ── Colour palette ──
  const skin = _gradClr(FACE_SKIN, skinT);
  const hair = _gradClr(FACE_HAIR, hairT);
  const [sr,sg,sb] = _clrRgb(skin);
  const [hr,hg,hb] = _clrRgb(hair);
  const skinDk   = `rgb(${Math.round(sr*.62)},${Math.round(sg*.62)},${Math.round(sb*.62)})`;
  const skinMid  = `rgb(${Math.round(sr*.82)},${Math.round(sg*.82)},${Math.round(sb*.82)})`;
  const skinLt   = `rgb(${Math.min(255,Math.round(sr+(255-sr)*.12))},${Math.min(255,Math.round(sg+(255-sg)*.12))},${Math.min(255,Math.round(sb+(255-sb)*.12))})`;
  // Iris colour: dark brown → hazel → light blue based on hair lightness
  const irisBase = hairT < 0.25 ? [25,14,8] : hairT < 0.55 ? [62,42,18] : [72,90,128];
  const irisClr  = `rgb(${irisBase[0]},${irisBase[1]},${irisBase[2]})`;
  // Lip colour
  const lipBase  = isFemale
    ? [Math.round(sr*.82+28), Math.round(sg*.52+8), Math.round(sb*.52+8)]
    : [Math.round(sr*.78+8),  Math.round(sg*.58+2), Math.round(sb*.58+2)];
  const lipClr   = `rgb(${lipBase[0]},${lipBase[1]},${lipBase[2]})`;

  // ── Geometry ──
  const cx = W*.5, cy = H*.485;
  // Face proportions driven by traits
  const fw   = 78  + ciT*22 + fbT*16;          // half-face width at cheeks
  const fh   = 102 + hhT*14 - ciT*6;           // face half-height
  const topY = cy - fh*1.06 - hhT*8;           // top of cranium
  const botY = cy + fh*0.88 + prT*7;           // chin tip
  const temW = fw*0.92;                          // temple width
  const cheekW = fw;
  const jawW = fw*(isFemale ? 0.68 - neoT*.06 : 0.80 - prT*.04);
  const jawY = cy + fh*.55;
  const chinW = fw*(isFemale ? 0.14 - neoT*.02 : 0.20 + prT*.02);

  // ── BG — soft neutral studio ──
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#D4CEC8'); bg.addColorStop(1,'#9A9490');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  // Vignette
  const vig = ctx.createRadialGradient(cx,cy*.9,W*.25,cx,cy*.9,W*.9);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,.22)');
  ctx.fillStyle = vig; ctx.fillRect(0,0,W,H);

  // ── Clothing hint at bottom ──
  const clY = H*.88;
  const clothClr = isFemale ? '#5A4060' : '#2C3044';
  ctx.beginPath();
  ctx.moveTo(0,H); ctx.lineTo(0,clY);
  ctx.bezierCurveTo(cx-fw*1.6, clY-fh*.04, cx-fw*.5, clY-fh*.15, cx, clY-fh*.16);
  ctx.bezierCurveTo(cx+fw*.5, clY-fh*.15, cx+fw*1.6, clY-fh*.04, W, clY);
  ctx.lineTo(W,H); ctx.closePath();
  ctx.fillStyle = clothClr; ctx.fill();
  const clothShd = ctx.createLinearGradient(0,clY,0,H);
  clothShd.addColorStop(0,'rgba(255,255,255,.07)'); clothShd.addColorStop(1,'rgba(0,0,0,.15)');
  ctx.fillStyle = clothShd; ctx.fill();

  // ── Neck ──
  const nkW = fw * (isFemale ? .24 : .30);
  const nkTopY = botY - fh*.02, nkBotY = clY + fh*.1;
  ctx.beginPath();
  ctx.moveTo(cx-nkW, nkTopY);
  ctx.bezierCurveTo(cx-nkW*.9, nkBotY-.5*fh, cx-nkW*1.1, nkBotY, cx-nkW*1.4, nkBotY+fh*.1);
  ctx.lineTo(cx+nkW*1.4, nkBotY+fh*.1);
  ctx.bezierCurveTo(cx+nkW*1.1, nkBotY, cx+nkW*.9, nkBotY-.5*fh, cx+nkW, nkTopY);
  ctx.closePath();
  ctx.fillStyle = skin; ctx.fill();
  // neck shadow sides
  const nkSh = ctx.createLinearGradient(cx-nkW*1.4,0,cx+nkW*1.4,0);
  nkSh.addColorStop(0,'rgba(0,0,0,.22)'); nkSh.addColorStop(.25,'rgba(0,0,0,0)');
  nkSh.addColorStop(.75,'rgba(0,0,0,0)'); nkSh.addColorStop(1,'rgba(0,0,0,.22)');
  ctx.fillStyle = nkSh;
  ctx.beginPath();
  ctx.moveTo(cx-nkW, nkTopY);
  ctx.bezierCurveTo(cx-nkW*.9, nkBotY-.5*fh, cx-nkW*1.1, nkBotY, cx-nkW*1.4, nkBotY+fh*.1);
  ctx.lineTo(cx+nkW*1.4, nkBotY+fh*.1);
  ctx.bezierCurveTo(cx+nkW*1.1, nkBotY, cx+nkW*.9, nkBotY-.5*fh, cx+nkW, nkTopY);
  ctx.closePath(); ctx.fill();

  // ── Face path helper ──
  function facePath() {
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.bezierCurveTo(cx+temW*.72, topY, cx+temW, topY+fh*.16, cx+cheekW, cy-fh*.06);
    ctx.bezierCurveTo(cx+cheekW, cy+fh*.22, cx+jawW*1.08, jawY-fh*.04, cx+jawW, jawY);
    ctx.bezierCurveTo(cx+chinW*2.4, botY+fh*.03, cx+chinW, botY, cx, botY);
    ctx.bezierCurveTo(cx-chinW, botY, cx-chinW*2.4, botY+fh*.03, cx-jawW, jawY);
    ctx.bezierCurveTo(cx-jawW*1.08, jawY-fh*.04, cx-cheekW, cy+fh*.22, cx-cheekW, cy-fh*.06);
    ctx.bezierCurveTo(cx-temW, topY+fh*.16, cx-temW*.72, topY, cx, topY);
    ctx.closePath();
  }

  // ── Hair (back) ──
  ctx.save();
  const hairTopY = topY - fh*(0.06 + texT*0.22);
  const hairSideX = temW + fw*(isFemale ? .32 : .18);
  const hairBotY  = isFemale ? botY + fh*.62 : cy - fh*.08;

  // Curly hair = poofy ellipse blob
  if (texT > 0.6) {
    const aW = fw*(1.0 + texT*.4), aH = fh*(0.5 + texT*.3);
    const aCtX = cx, aCtY = topY - aH*.18;
    // Base blob
    ctx.beginPath(); ctx.ellipse(aCtX, aCtY, aW*.62, aH*.78, 0, 0, Math.PI*2);
    ctx.fillStyle = hair; ctx.fill();
    // Coily texture bumps
    for (let i=0; i<22; i++) {
      const a = (i/22)*Math.PI*2;
      const rx = Math.cos(a)*aW*(.44+Math.sin(i*3.7)*.06);
      const ry = Math.sin(a)*aH*(.62+Math.cos(i*2.9)*.06);
      const br = aW*(.055+texT*.03);
      ctx.beginPath(); ctx.arc(aCtX+rx, aCtY+ry, br, 0, Math.PI*2);
      const bright = [1.18, 1.0, 0.72][i%3];
      ctx.fillStyle = `rgb(${Math.min(255,Math.round(hr*bright))},${Math.min(255,Math.round(hg*bright))},${Math.min(255,Math.round(hb*bright))})`;
      ctx.fill();
    }
  } else {
    // Straight / wavy silhouette
    ctx.beginPath();
    if (isFemale) {
      ctx.moveTo(cx - hairSideX, hairBotY+fh*.08);
      ctx.bezierCurveTo(cx-hairSideX*1.22, cy+fh*.38, cx-hairSideX*1.18, topY+fh*.1, cx-temW*.96, topY+fh*.04);
      ctx.bezierCurveTo(cx-fw*.52, hairTopY, cx, hairTopY-fh*.02, cx, hairTopY-fh*.02);
      ctx.bezierCurveTo(cx, hairTopY-fh*.02, cx+fw*.52, hairTopY, cx+temW*.96, topY+fh*.04);
      ctx.bezierCurveTo(cx+hairSideX*1.18, topY+fh*.1, cx+hairSideX*1.22, cy+fh*.38, cx+hairSideX, hairBotY+fh*.08);
      ctx.closePath();
    } else {
      ctx.moveTo(cx-hairSideX, cy-fh*.12);
      ctx.bezierCurveTo(cx-hairSideX, topY+fh*.1, cx-fw*.72, hairTopY, cx-fw*.28, hairTopY);
      ctx.bezierCurveTo(cx-fw*.14, hairTopY-fh*.01, cx+fw*.14, hairTopY-fh*.01, cx+fw*.28, hairTopY);
      ctx.bezierCurveTo(cx+fw*.72, hairTopY, cx+hairSideX, topY+fh*.1, cx+hairSideX, cy-fh*.12);
      ctx.closePath();
    }
    ctx.fillStyle = hair; ctx.fill();
    // Sheen highlight across hair
    const hSh = ctx.createLinearGradient(cx-fw*.5, hairTopY, cx+fw*.3, topY+fh*.35);
    hSh.addColorStop(0,'rgba(255,255,255,.14)'); hSh.addColorStop(.45,'rgba(255,255,255,.05)'); hSh.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = hSh; ctx.fill();
    // Wavy strands if texT > .25
    if (texT > 0.25 && texT <= 0.6) {
      for (let i=0; i<6; i++) {
        const tx = cx+(i-2.5)*fw*.14;
        ctx.beginPath(); ctx.moveTo(tx, hairTopY+fh*.04);
        ctx.bezierCurveTo(tx+fw*.04, hairTopY+fh*.1, tx-fw*.04, hairTopY+fh*.15, tx+fw*.02, hairTopY+fh*.2);
        ctx.strokeStyle = `rgba(${Math.min(255,Math.round(hr*1.12))},${Math.min(255,Math.round(hg*1.12))},${Math.min(255,Math.round(hb*1.12))},.55)`;
        ctx.lineWidth = fw*.022; ctx.lineCap='round'; ctx.stroke();
      }
    }
  }
  ctx.restore();

  // ── Ears ──
  const earY  = cy - fh*.025, earH = fh*.215, earW = fw*.115;
  for (const s of [-1,1]) {
    const ex = cx + s*(cheekW - earW*.18);
    // Outer ear
    ctx.beginPath(); ctx.ellipse(ex, earY, earW, earH, 0, 0, Math.PI*2);
    ctx.fillStyle = skin; ctx.fill();
    ctx.strokeStyle = skinDk; ctx.lineWidth=.8; ctx.stroke();
    // Inner ear
    ctx.beginPath(); ctx.ellipse(ex-s*earW*.18, earY, earW*.48, earH*.62, 0, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${Math.round(sr*.78)},${Math.round(sg*.68)},${Math.round(sb*.68)},.28)`; ctx.fill();
  }

  // ── Face base ──
  ctx.save();
  facePath(); ctx.fillStyle = skin; ctx.fill();
  // Side lighting: light from upper-left
  const faceLight = ctx.createLinearGradient(cx-fw*1.1, topY, cx+fw*1.1, botY);
  faceLight.addColorStop(0,  'rgba(255,255,255,.07)');
  faceLight.addColorStop(.3, 'rgba(255,255,255,0)');
  faceLight.addColorStop(.7, 'rgba(0,0,0,0)');
  faceLight.addColorStop(1,  'rgba(0,0,0,.1)');
  ctx.fillStyle = faceLight; ctx.fill();
  // Temple shadows
  for (const s of [-1,1]) {
    const tSh = ctx.createLinearGradient(cx+s*fw*.2,0, cx+s*fw*.9,0);
    tSh.addColorStop(0,'rgba(0,0,0,0)'); tSh.addColorStop(1,'rgba(0,0,0,.12)');
    ctx.fillStyle = tSh; ctx.fill();
  }
  ctx.restore();

  // ── Clip to face from here ──
  ctx.save(); facePath(); ctx.clip();

  // Cheekbone highlight (especially visible in darker skin)
  for (const s of [-1,1]) {
    const ck = ctx.createRadialGradient(cx+s*fw*.55, cy+fh*.06, 0, cx+s*fw*.55, cy+fh*.06, fw*.28);
    ck.addColorStop(0,`rgba(255,${isFemale?200:180},${isFemale?160:130},.${isFemale?'10':'07'})`)
    ck.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ck; ctx.beginPath(); ctx.ellipse(cx+s*fw*.55,cy+fh*.06,fw*.28,fh*.2,0,0,Math.PI*2); ctx.fill();
  }

  // ── Brow ridge shadow ──
  if (browRidge > 0.05) {
    const brY = topY + fh*.6;
    const brG = ctx.createLinearGradient(cx, brY-browRidge*16, cx, brY+5);
    brG.addColorStop(0, `rgba(0,0,0,${browRidge*.32})`); brG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = brG;
    ctx.beginPath(); ctx.ellipse(cx, brY, fw*.88, browRidge*20, 0, 0, Math.PI*2); ctx.fill();
  }

  // ── Eyes ──
  const eyeY   = cy - fh*.152;
  const eyeSpX = fw*.30;
  const eyeRx  = fw*.175;
  const eyeRy  = eyeRx * (isFemale ? 0.43 : 0.37) * (1-efT*.1);

  for (const s of [-1,1]) {
    const ex = cx + s*eyeSpX;
    ctx.save();

    // Under-eye shadow (orbital)
    const orb = ctx.createRadialGradient(ex, eyeY+eyeRy*.4, eyeRy*.2, ex, eyeY+eyeRy*.4, eyeRy*2.2);
    orb.addColorStop(0,'rgba(0,0,0,.18)'); orb.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.ellipse(ex, eyeY+eyeRy*.5, eyeRx*1.18, eyeRy*2.2, 0, 0, Math.PI*2);
    ctx.fillStyle=orb; ctx.fill();

    // Eye white
    ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeRx, eyeRy, 0, 0, Math.PI*2);
    ctx.fillStyle='#F5F0E8'; ctx.fill();
    // Eye white shadow at edges
    const wSh = ctx.createLinearGradient(ex-eyeRx, eyeY, ex+eyeRx, eyeY);
    wSh.addColorStop(0,'rgba(0,0,0,.08)'); wSh.addColorStop(.25,'rgba(0,0,0,0)');
    wSh.addColorStop(.75,'rgba(0,0,0,0)'); wSh.addColorStop(1,'rgba(0,0,0,.08)');
    ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeRx, eyeRy, 0, 0, Math.PI*2);
    ctx.fillStyle=wSh; ctx.fill();

    // Iris
    const irisR = eyeRy * .92;
    const iG = ctx.createRadialGradient(ex-eyeRx*.12, eyeY-eyeRy*.15, irisR*.08, ex, eyeY, irisR);
    iG.addColorStop(0,   irisClr);
    iG.addColorStop(.45, `rgb(${Math.max(0,irisBase[0]-10)},${Math.max(0,irisBase[1]-10)},${Math.max(0,irisBase[2]-10)})`);
    iG.addColorStop(1,   `rgb(${Math.max(0,irisBase[0]-20)},${Math.max(0,irisBase[1]-20)},${Math.max(0,irisBase[2]-20)})`);
    ctx.beginPath(); ctx.arc(ex, eyeY, irisR, 0, Math.PI*2);
    ctx.fillStyle=iG; ctx.fill();
    // Iris ring
    ctx.beginPath(); ctx.arc(ex, eyeY, irisR, 0, Math.PI*2);
    ctx.strokeStyle=`rgba(0,0,0,.35)`; ctx.lineWidth=.6; ctx.stroke();

    // Pupil
    ctx.beginPath(); ctx.arc(ex, eyeY, irisR*.5, 0, Math.PI*2);
    ctx.fillStyle='#060304'; ctx.fill();
    // Catchlight
    ctx.beginPath(); ctx.arc(ex-eyeRx*.18, eyeY-eyeRy*.42, irisR*.27, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.78)'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex+eyeRx*.18, eyeY+eyeRy*.12, irisR*.12, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,.28)'; ctx.fill();

    // Epicanthal fold — painted as a skin-coloured bridge over inner corner
    if (efT > 0.08) {
      const innerX = ex - s*eyeRx;
      const fA = Math.min(efT*0.98, 0.96);
      ctx.beginPath();
      ctx.moveTo(innerX+s*eyeRx*.06, eyeY-eyeRy*.85);
      ctx.bezierCurveTo(
        innerX - s*eyeRx*.30*fA, eyeY - eyeRy*.15,
        innerX - s*eyeRx*.32*fA, eyeY + eyeRy*.28,
        innerX + s*eyeRx*.05,    eyeY + eyeRy*.78
      );
      ctx.lineWidth = eyeRx*.22*fA;
      ctx.strokeStyle = skin; ctx.lineCap='round'; ctx.stroke();
      // Second pass slightly lighter for natural crease
      ctx.lineWidth = eyeRx*.12*fA;
      ctx.strokeStyle = skinLt; ctx.stroke();
    }

    // Upper lid line
    ctx.beginPath();
    ctx.moveTo(ex-eyeRx, eyeY);
    ctx.bezierCurveTo(ex-eyeRx*.35, eyeY-eyeRy*1.28, ex+eyeRx*.35, eyeY-eyeRy*1.28, ex+eyeRx, eyeY);
    ctx.lineWidth = isFemale ? 2.0 : 1.5; ctx.strokeStyle='rgba(20,8,4,.9)'; ctx.stroke();
    // Lower lid (thinner)
    ctx.beginPath();
    ctx.moveTo(ex-eyeRx, eyeY);
    ctx.bezierCurveTo(ex-eyeRx*.35, eyeY+eyeRy*.82, ex+eyeRx*.35, eyeY+eyeRy*.82, ex+eyeRx, eyeY);
    ctx.lineWidth=.8; ctx.strokeStyle='rgba(20,8,4,.45)'; ctx.stroke();
    // Female lashes
    if (isFemale) {
      for (let i=0; i<10; i++) {
        const a = Math.PI*.06 + i*(Math.PI*.88/9);
        const lx = ex + Math.cos(a)*eyeRx, ly = eyeY - Math.abs(Math.sin(a))*eyeRy;
        ctx.beginPath(); ctx.moveTo(lx,ly);
        ctx.lineTo(lx + Math.cos(a)*3.5, ly - 4.5);
        ctx.strokeStyle='rgba(8,4,2,.86)'; ctx.lineWidth=1.4; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Eyebrows ──
  const browY    = eyeY - eyeRy*2.6 - browRidge*10;
  const browThick = isFemale ? 2.0 + fntT*.4 : 2.5 + (1-mntT)*1.8;
  const browClr  = `rgb(${Math.max(4,Math.round(hr*.85))},${Math.max(3,Math.round(hg*.85))},${Math.max(2,Math.round(hb*.85))})`;
  for (const s of [-1,1]) {
    const bx = cx + s*eyeSpX;
    // Main brow stroke
    ctx.beginPath();
    ctx.moveTo(bx-s*eyeRx*.94, browY+eyeRy*.32+(s<0?.5:-.5));
    ctx.bezierCurveTo(bx-s*eyeRx*.28, browY-eyeRy*.18, bx+s*eyeRx*.22, browY, bx+s*eyeRx*.86, browY+eyeRy*.28);
    ctx.lineWidth=browThick; ctx.strokeStyle=browClr; ctx.lineCap='round'; ctx.stroke();
    // Fine hair texture overlay
    for (let i=0; i<4; i++) {
      const t2 = i/3;
      const bhx = (bx-s*eyeRx*.94)*(1-t2) + (bx+s*eyeRx*.86)*t2;
      const bhy = (browY+eyeRy*.32)*(1-t2) + (browY+eyeRy*.28)*t2 - eyeRy*.1;
      ctx.beginPath(); ctx.moveTo(bhx, bhy);
      ctx.lineTo(bhx+s*1.5, bhy - browThick*.6 - 1.5);
      ctx.strokeStyle=`rgba(${hr},${hg},${hb},.45)`; ctx.lineWidth=.8; ctx.stroke();
    }
  }

  // ── Nose ──
  const noseTopY = cy - fh*.02;
  const noseBotY = cy + fh*.215;
  const noseHW   = fw*(.095 + nbT*.13);   // half-width of bridge at tip
  const nostW    = noseHW*(.68 + nbT*.30); // nostril spread

  // Bridge shadow lines (paired)
  ctx.save(); ctx.globalAlpha = 0.22;
  for (const s of [-1,1]) {
    ctx.beginPath();
    ctx.moveTo(cx+s*noseHW*.28, noseTopY);
    ctx.bezierCurveTo(cx+s*noseHW*.44, noseTopY+fh*.07, cx+s*nostW*.38, noseBotY-fh*.03, cx+s*nostW*.34, noseBotY);
    ctx.lineWidth=1.4; ctx.strokeStyle=skinDk; ctx.stroke();
  }
  ctx.globalAlpha=1;
  // Tip bulge
  const tipG = ctx.createRadialGradient(cx, noseBotY-fh*.008, 0, cx, noseBotY-fh*.008, nostW*.9);
  tipG.addColorStop(0, skinLt); tipG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.ellipse(cx, noseBotY-fh*.008, nostW*.9, nostW*.6, 0, 0, Math.PI*2);
  ctx.fillStyle=tipG; ctx.fill();
  // Alar base arc
  ctx.beginPath();
  ctx.moveTo(cx-nostW*.78, noseBotY-fh*.01);
  ctx.bezierCurveTo(cx-nostW*.98, noseBotY+fh*.022, cx-nostW*.42, noseBotY+fh*.035, cx, noseBotY+fh*.032);
  ctx.bezierCurveTo(cx+nostW*.42, noseBotY+fh*.035, cx+nostW*.98, noseBotY+fh*.022, cx+nostW*.78, noseBotY-fh*.01);
  ctx.lineWidth=1.0; ctx.strokeStyle=skinDk; ctx.globalAlpha=.32; ctx.stroke(); ctx.globalAlpha=1;
  // Nostrils
  for (const s of [-1,1]) {
    ctx.beginPath(); ctx.ellipse(cx+s*nostW*.62, noseBotY-fh*.003, nostW*.34, nostW*.22, s*.28, 0, Math.PI*2);
    ctx.fillStyle=`rgba(0,0,0,.38)`; ctx.fill();
  }
  ctx.restore();

  // ── Lips ──
  const lipY  = cy + fh*.368 + prT*fh*.015;
  const lipW  = fw*(.23 + prT*.04 + nbT*.015);
  const loLipH = fh*.042*(1+prT*.22);
  const upLipH = fh*.030*(1+prT*.34);

  // Upper lip (Cupid's bow)
  ctx.beginPath();
  ctx.moveTo(cx-lipW, lipY);
  ctx.bezierCurveTo(cx-lipW*.42, lipY-upLipH, cx-lipW*.08, lipY-upLipH*1.6, cx, lipY-upLipH*.9);
  ctx.bezierCurveTo(cx+lipW*.08, lipY-upLipH*1.6, cx+lipW*.42, lipY-upLipH, cx+lipW, lipY);
  ctx.bezierCurveTo(cx+lipW*.36, lipY+upLipH*.42, cx-lipW*.36, lipY+upLipH*.42, cx-lipW, lipY);
  ctx.fillStyle=lipClr; ctx.fill();
  // Lower lip
  ctx.beginPath();
  ctx.moveTo(cx-lipW, lipY);
  ctx.bezierCurveTo(cx-lipW*.4, lipY+loLipH*1.05, cx, lipY+loLipH*1.42, cx, lipY+loLipH*1.42);
  ctx.bezierCurveTo(cx, lipY+loLipH*1.42, cx+lipW*.4, lipY+loLipH*1.05, cx+lipW, lipY);
  ctx.bezierCurveTo(cx+lipW*.34, lipY+loLipH*2.1, cx-lipW*.34, lipY+loLipH*2.1, cx-lipW, lipY);
  ctx.fillStyle=`rgb(${Math.max(0,lipBase[0]-12)},${Math.max(0,lipBase[1]-8)},${Math.max(0,lipBase[2]-8)})`;
  ctx.fill();
  // Lip line
  ctx.beginPath(); ctx.moveTo(cx-lipW, lipY);
  ctx.bezierCurveTo(cx-lipW*.38,lipY+1.2,cx+lipW*.38,lipY+1.2,cx+lipW,lipY);
  ctx.lineWidth=.8; ctx.strokeStyle=`rgba(${Math.max(0,sr-40)},${Math.max(0,sg-42)},${Math.max(0,sb-42)},.5)`; ctx.stroke();
  // Lip highlight
  const lipHi = ctx.createLinearGradient(cx, lipY-upLipH, cx, lipY+upLipH*.5);
  lipHi.addColorStop(0,'rgba(255,255,255,.06)'); lipHi.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.moveTo(cx-lipW*.8, lipY+upLipH*.2);
  ctx.bezierCurveTo(cx-lipW*.4,lipY-upLipH*.6, cx+lipW*.4,lipY-upLipH*.6, cx+lipW*.8,lipY+upLipH*.2);
  ctx.lineWidth=upLipH*1.8; ctx.strokeStyle=lipHi; ctx.lineCap='round'; ctx.stroke();

  // ── Beard / facial hair (male) ──
  if (!isFemale && bhT > 0.18) {
    const bA = Math.min(0.82, (bhT-.18)/.82);
    // Stubble field
    ctx.beginPath(); ctx.ellipse(cx, lipY+fh*.14, fw*.68, fh*.28, 0, 0, Math.PI*2);
    const bG = ctx.createRadialGradient(cx, lipY+fh*.1, fw*.08, cx, lipY+fh*.1, fw*.68);
    bG.addColorStop(0, `rgba(${hr},${hg},${hb},${(.28+bA*.38).toFixed(2)})`);
    bG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle=bG; ctx.fill();
    // Moustache gradient
    if (bhT > 0.5) {
      ctx.beginPath(); ctx.ellipse(cx, lipY-upLipH*1.8, lipW*.7, fh*.052, 0, 0, Math.PI*2);
      const mG = ctx.createRadialGradient(cx, lipY-upLipH*1.8, 0, cx, lipY-upLipH*1.8, lipW*.7);
      mG.addColorStop(0, `rgba(${hr},${hg},${hb},${(.32+bA*.28).toFixed(2)})`);
      mG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle=mG; ctx.fill();
    }
    // Individual stubble dots for density
    if (bhT > 0.42) {
      const dots = Math.round(80*bA);
      const seed = _hashString(JSON.stringify({isFemale, bhT, fw, fh, prT, nbT}));
      const rand = _seededRand(seed);
      for (let i=0; i<dots; i++) {
        const px = cx+(rand()-.5)*fw*1.28;
        const py = lipY-upLipH*2+rand()*fh*.42;
        const dx=(px-cx)/fw, dy=(py-(cy+fh*.18))/(fh*.3);
        if(dx*dx+dy*dy>1.05) continue;
        ctx.beginPath(); ctx.arc(px, py, .8+bA*.8, 0, Math.PI*2);
        ctx.fillStyle=`rgba(${hr},${hg},${hb},${(.25+bA*.3).toFixed(2)})`; ctx.fill();
      }
    }
  }

  // ── Sub-surface scatter glow ──
  const sss = ctx.createRadialGradient(cx-fw*.1, cy-fh*.08, 0, cx-fw*.1, cy-fh*.08, fw*1.08);
  sss.addColorStop(0, `rgba(255,${Math.min(255,sg+28)},${Math.min(255,sb+18)},.07)`);
  sss.addColorStop(.5, 'rgba(255,255,255,.02)');
  sss.addColorStop(1,  'rgba(0,0,0,.04)');
  facePath(); ctx.fillStyle=sss; ctx.fill();

  ctx.restore(); // release face clip

  // ── Female front hair strands ──
  if (isFemale && texT < 0.5) {
    ctx.save(); ctx.globalAlpha=.88;
    for (const s of [-1,1]) {
      const sx = cx + s*(temW*.9);
      ctx.beginPath();
      ctx.moveTo(sx, topY+fh*.06);
      ctx.bezierCurveTo(sx+s*fw*.06, cy+fh*.06, sx+s*fw*.1, botY+fh*.18, sx+s*fw*.05, botY+fh*.52);
      ctx.lineWidth=fw*.085; ctx.strokeStyle=hair; ctx.lineCap='round'; ctx.stroke();
      // highlight strand
      ctx.lineWidth=fw*.025;
      ctx.strokeStyle=`rgb(${Math.min(255,Math.round(hr*1.18))},${Math.min(255,Math.round(hg*1.18))},${Math.min(255,Math.round(hb*1.18))})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Hairline edge strands (male short) ──
  if (!isFemale && texT < 0.55) {
    ctx.save(); ctx.globalAlpha=.55;
    const nStrands = 10;
    for (let i=0; i<nStrands; i++) {
      const t2 = i/(nStrands-1);
      const sx = cx + (t2-.5)*fw*1.42;
      ctx.beginPath(); ctx.moveTo(sx, hairTopY+fh*.01);
      ctx.lineTo(sx+(t2-.5)*fw*.015, hairTopY+fh*.07);
      ctx.strokeStyle=hair; ctx.lineWidth=fw*.015; ctx.lineCap='round'; ctx.stroke();
    }
    ctx.restore();
  }

  // ── Group label watermark ──
  const grpName = (opts.groupLabel || document.getElementById('selGroup')?.options[document.getElementById('selGroup')?.selectedIndex]?.text || '').trim();
  ctx.save();
  ctx.font='bold 10px system-ui,sans-serif';
  ctx.fillStyle='rgba(0,0,0,.28)';
  ctx.textAlign='center'; ctx.textBaseline='bottom';
  ctx.fillText(grpName+(isFemale?' · F':' · M'), cx, H-6);
  ctx.restore();
}
// ════════════════════════════════════════════════════════════════




function _faceBodyTraits(isFemale, traits = null){
  const src = traits || _faceTraitSnapshot();
  const skinT=1-src.skin_colour;
  const hairT=1-src.hair_colour;
  const texT=src.hair_texture;
  const ciT=src.cephalic_index;
  const fbT=src.face_breadth;
  const hhT=src.head_height;
  const nbT=src.nose_breadth;
  const prT=src.prognathism;
  const eyeT=src.eye_folds;
  const bodyType=src.body_type;
  const heightT=src.height;
  const trunkT=src.trunk_length;
  const steat=src.steatopygia;
  const maleNeo=src.male_neoteny;
  const femaleNeo=src.female_neoteny;
  const heightDim=src.height_dimorphism;
  const muscleDim=src.muscle_dimorphism;
  const neoT=isFemale?femaleNeo:maleNeo;
  const bothNeo=(maleNeo+femaleNeo)/2;
  const maleSteatGate = Math.max(0, (0.64-bodyType)/0.64) * Math.max(0, (0.58-heightDim)/0.58) * Math.max(0, (0.58-muscleDim)/0.58) * Math.max(0, (0.7-bothNeo)/0.7);
  const effSteat = isFemale ? steat*(0.7+0.3*(1-heightDim)) : steat*maleSteatGate;
  const skin = _gradClr(FACE_SKIN, skinT);
  const hair = _gradClr(FACE_HAIR, hairT);
  return {skin,hair,skinT,hairT,texT,ciT,fbT,hhT,nbT,prT,eyeT,bodyType,heightT,trunkT,steat,effSteat,maleNeo,femaleNeo,neoT,heightDim,muscleDim};
}
function _fitFaceCanvas(canvas){
  if(!canvas) return;
  const targetW=Math.max(620, Math.min(760, Math.round((canvas.clientWidth||760))));
  const targetH=Math.round(targetW*0.71);
  if(canvas.width!==targetW||canvas.height!==targetH){ canvas.width=targetW; canvas.height=targetH; }
}
function _drawInsetFace(ctx,x,y,w,h,isFemale,traits,groupLabel){
  const tw=Math.max(220, Math.round(w*1.22));
  const th=Math.max(280, Math.round(h*1.22));
  const cacheKey = `${isFemale?'F':'M'}:${tw}x${th}:${_hashString(JSON.stringify(traits||{}))}`;
  let tmp=_faceSheetCache.get(cacheKey);
  if(!tmp){
    tmp=document.createElement('canvas');
    tmp.width=tw;
    tmp.height=th;
    _drawFace(tmp,isFemale,{traits,groupLabel});
    _faceSheetCache.set(cacheKey,tmp);
    if(_faceSheetCache.size>8){
      const first=_faceSheetCache.keys().next().value;
      _faceSheetCache.delete(first);
    }
  }
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x,y,w,h,14); ctx.clip();
  ctx.drawImage(tmp,0,0,tmp.width,tmp.height,x,y,w,h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle='rgba(60,38,52,.55)'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='rgba(20,16,20,.72)'; ctx.fillRect(x+10,y+10,58,18);
  ctx.fillStyle='#F6EFE7'; ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('FACE',x+39,y+19);
  ctx.restore();
}
function _drawFrontFigure(ctx,cx,baseY,headH,tr,isFemale){
  const headW=headH*(0.72 + tr.ciT*0.08 + tr.fbT*0.06);
  const bodyH=headH*7.35;
  const topY=baseY-bodyH;
  const chinY=topY+headH;
  const neckY=chinY+headH*0.18;
  const shoulderY=topY+headH*1.45;
  const bustY=topY+headH*2.0;
  const waistY=topY+headH*3.15;
  const hipY=topY+headH*4.0;
  const crotchY=topY+headH*4.55;
  const kneeY=topY+headH*6.2;
  const sh= headW*(isFemale ? (1.78 - tr.heightDim*0.22) : (1.98 + tr.muscleDim*0.15 - tr.bodyType*0.05));
  const waist= headW*(isFemale ? (1.06 + tr.bodyType*0.15) : (1.14 + tr.bodyType*0.12));
  const hip= headW*(isFemale ? (1.52 + tr.effSteat*0.32 + (1-tr.heightDim)*0.08) : (1.18 + tr.effSteat*0.28 + tr.bodyType*0.08));
  const thigh= headW*(0.52 + tr.bodyType*0.12 + tr.effSteat*0.08);
  const calf= headW*(0.34 + tr.bodyType*0.08);
  const armW=headW*(isFemale?0.22:0.25) + tr.muscleDim*3;
  const skin=tr.skin;

  // guides
  ctx.save();
  ctx.strokeStyle='rgba(90,70,70,.18)'; ctx.lineWidth=1;
  [topY+headH*0.5, topY+headH*0.74, chinY, shoulderY, bustY, waistY, hipY, crotchY, kneeY, baseY].forEach((yy,i)=>{
    ctx.beginPath(); ctx.moveTo(cx-headW*2.4,yy); ctx.lineTo(cx+headW*2.4,yy); ctx.stroke();
  });
  ctx.restore();

  // head
  ctx.beginPath(); ctx.ellipse(cx, topY+headH*0.52, headW*0.52, headH*0.58, 0, 0, Math.PI*2);
  ctx.fillStyle=skin; ctx.fill();
  ctx.strokeStyle='rgba(30,20,18,.22)'; ctx.lineWidth=1.1; ctx.stroke();

  // hair cap
  ctx.beginPath();
  ctx.ellipse(cx, topY+headH*(0.44-tr.texT*0.04), headW*(0.57+tr.texT*0.1), headH*(0.34+tr.texT*0.12), 0, Math.PI, 0, true);
  ctx.fillStyle=tr.hair; ctx.fill();

  // face ticks
  ctx.save();
  ctx.strokeStyle='rgba(35,20,18,.38)'; ctx.lineWidth=0.9;
  [0.5,0.68,0.8].forEach(fr=>{ const yy=topY+headH*fr; ctx.beginPath(); ctx.moveTo(cx-headW*0.44,yy); ctx.lineTo(cx+headW*0.44,yy); ctx.stroke(); });
  ctx.restore();

  // torso silhouette
  ctx.beginPath();
  ctx.moveTo(cx-sh*0.5, shoulderY);
  ctx.bezierCurveTo(cx-sh*0.58, bustY, cx-waist*0.56, waistY, cx-hip*0.52, hipY);
  ctx.bezierCurveTo(cx-hip*0.52, crotchY-headH*0.12, cx-thigh*0.56, kneeY-headH*0.25, cx-thigh*0.42, kneeY);
  ctx.bezierCurveTo(cx-calf*0.42, baseY-headH*0.3, cx-calf*0.22, baseY-headH*0.1, cx-calf*0.25, baseY);
  ctx.lineTo(cx-calf*0.06, baseY);
  ctx.bezierCurveTo(cx-calf*0.04, baseY-headH*0.24, cx-thigh*0.14, kneeY-headH*0.08, cx-thigh*0.12, crotchY);
  ctx.lineTo(cx+thigh*0.12, crotchY);
  ctx.bezierCurveTo(cx+thigh*0.14, kneeY-headH*0.08, cx+calf*0.04, baseY-headH*0.24, cx+calf*0.06, baseY);
  ctx.lineTo(cx+calf*0.25, baseY);
  ctx.bezierCurveTo(cx+calf*0.22, baseY-headH*0.1, cx+calf*0.42, baseY-headH*0.3, cx+thigh*0.42, kneeY);
  ctx.bezierCurveTo(cx+thigh*0.56, kneeY-headH*0.25, cx+hip*0.52, crotchY-headH*0.12, cx+hip*0.52, hipY);
  ctx.bezierCurveTo(cx+waist*0.56, waistY, cx+sh*0.58, bustY, cx+sh*0.5, shoulderY);
  ctx.closePath();
  const bodyGrad=ctx.createLinearGradient(cx-headW*1.2,0,cx+headW*1.2,0);
  bodyGrad.addColorStop(0,'rgba(255,255,255,.12)'); bodyGrad.addColorStop(.3,skin); bodyGrad.addColorStop(.7,skin); bodyGrad.addColorStop(1,'rgba(0,0,0,.12)');
  ctx.fillStyle=bodyGrad; ctx.fill();
  ctx.strokeStyle='rgba(30,20,18,.20)'; ctx.lineWidth=1.2; ctx.stroke();

  // arms
  for(const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(cx+s*sh*0.46, shoulderY+headH*0.04);
    ctx.bezierCurveTo(cx+s*(sh*0.66+armW), shoulderY+headH*0.62, cx+s*(waist*0.75+armW*0.4), hipY-headH*0.08, cx+s*(hip*0.58), hipY+headH*0.62);
    ctx.strokeStyle=skin; ctx.lineWidth=armW; ctx.lineCap='round'; ctx.stroke();
  }

  // chest / sternum hints
  ctx.save();
  ctx.strokeStyle='rgba(50,25,20,.14)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(cx, bustY-headH*0.1); ctx.lineTo(cx, waistY+headH*0.15); ctx.stroke();
  if(isFemale){
    const br=Math.max(headW*0.22, headW*(0.22+tr.bodyType*0.02));
    for(const s of [-1,1]){ ctx.beginPath(); ctx.arc(cx+s*headW*0.34, bustY+headH*0.06, br, Math.PI*1.05, Math.PI*1.95); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.moveTo(cx-sh*0.22,bustY); ctx.lineTo(cx+sh*0.22,bustY); ctx.stroke();
  }
  ctx.restore();

  // underwear coverage
  ctx.save();
  if(isFemale){
    ctx.fillStyle='#78526c';
    ctx.beginPath();
    ctx.moveTo(cx-headW*0.62, bustY-headH*0.12);
    ctx.lineTo(cx-headW*0.12, bustY-headH*0.12);
    ctx.lineTo(cx-headW*0.05, bustY+headH*0.35);
    ctx.lineTo(cx-headW*0.54, bustY+headH*0.35);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx+headW*0.62, bustY-headH*0.12);
    ctx.lineTo(cx+headW*0.12, bustY-headH*0.12);
    ctx.lineTo(cx+headW*0.05, bustY+headH*0.35);
    ctx.lineTo(cx+headW*0.54, bustY+headH*0.35);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(cx-headW*0.08, bustY-headH*0.14, headW*0.16, headH*0.14);
    ctx.fillStyle='#6e4d66';
    ctx.beginPath();
    ctx.moveTo(cx-hip*0.48, crotchY-headH*0.12);
    ctx.quadraticCurveTo(cx, crotchY+headH*0.08, cx+hip*0.48, crotchY-headH*0.12);
    ctx.lineTo(cx+thigh*0.35, crotchY+headH*0.45);
    ctx.lineTo(cx-thigh*0.35, crotchY+headH*0.45);
    ctx.closePath(); ctx.fill();
  }else{
    ctx.fillStyle='#3d4762';
    ctx.beginPath();
    ctx.roundRect(cx-hip*0.46, crotchY-headH*0.1, hip*0.92, headH*0.72, 12);
    ctx.fill();
    ctx.clearRect(cx-0.6, crotchY+headH*0.08, 1.2, headH*0.5);
  }
  ctx.restore();
}
function _drawProfileFigure(ctx,cx,baseY,headH,tr,isFemale){
  const bodyH=headH*7.35;
  const topY=baseY-bodyH;
  const chinY=topY+headH;
  const shoulderY=topY+headH*1.46;
  const bustY=topY+headH*2.02;
  const waistY=topY+headH*3.2;
  const hipY=topY+headH*4.02;
  const crotchY=topY+headH*4.56;
  const kneeY=topY+headH*6.16;
  const headD=headH*(0.56+tr.ciT*0.05);
  const chestD=headD*(isFemale ? 0.86+tr.bodyType*0.08 : 0.95+tr.muscleDim*0.08);
  const bellyD=headD*(0.56+tr.bodyType*0.15);
  const buttD=headD*(0.62 + tr.effSteat*(isFemale?0.62:0.88) + tr.bodyType*0.05);
  const thighD=headD*(0.48+tr.bodyType*0.1+tr.effSteat*0.08);
  const calfD=headD*(0.32+tr.bodyType*0.05);
  const skin=tr.skin;

  ctx.save();
  ctx.strokeStyle='rgba(90,70,70,.18)'; ctx.lineWidth=1;
  [topY+headH*0.5, chinY, shoulderY, bustY, waistY, hipY, crotchY, kneeY, baseY].forEach(yy=>{ctx.beginPath();ctx.moveTo(cx-headH*1.5,yy);ctx.lineTo(cx+headH*1.7,yy);ctx.stroke();});
  ctx.restore();

  // profile head
  const hx=cx+headD*0.06, hy=topY+headH*0.55;
  ctx.beginPath();
  ctx.moveTo(hx-headD*0.58, hy-headH*0.5);
  ctx.bezierCurveTo(hx+headD*0.08, hy-headH*0.68, hx+headD*0.36, hy-headH*0.1, hx+headD*0.38+tr.nbT*8, hy+headH*0.04);
  ctx.bezierCurveTo(hx+headD*0.3+tr.prT*9, hy+headH*0.22, hx+headD*0.16+tr.prT*10, hy+headH*0.4, hx-headD*0.1, hy+headH*0.54);
  ctx.bezierCurveTo(hx-headD*0.48, hy+headH*0.44, hx-headD*0.62, hy+headH*0.08, hx-headD*0.58, hy-headH*0.5);
  ctx.closePath();
  ctx.fillStyle=skin; ctx.fill();
  ctx.strokeStyle='rgba(30,20,18,.22)'; ctx.lineWidth=1.1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx-headD*0.54, hy-headH*0.54); ctx.bezierCurveTo(hx-headD*0.16, hy-headH*0.8, hx+headD*0.24, hy-headH*0.62, hx+headD*0.2, hy-headH*0.18); ctx.strokeStyle=tr.hair; ctx.lineWidth=headH*(0.22+tr.texT*0.08); ctx.lineCap='round'; ctx.stroke();

  // torso silhouette
  ctx.beginPath();
  ctx.moveTo(cx-headD*0.12, shoulderY-headH*0.02);
  ctx.bezierCurveTo(cx+chestD*0.55, shoulderY+headH*0.3, cx+chestD*0.6, bustY-headH*0.02, cx+(isFemale?chestD*(0.78+tr.bodyType*0.05):chestD*0.44), bustY+headH*(isFemale?0.12:0.04));
  ctx.bezierCurveTo(cx+bellyD*0.9, waistY, cx+bellyD*0.85, hipY-headH*0.16, cx+bellyD*0.75, crotchY-headH*0.06);
  ctx.bezierCurveTo(cx+thighD*0.58, kneeY-headH*0.24, cx+calfD*0.55, baseY-headH*0.25, cx+calfD*0.34, baseY);
  ctx.lineTo(cx-calfD*0.16, baseY);
  ctx.bezierCurveTo(cx-calfD*0.2, baseY-headH*0.16, cx-thighD*0.08, kneeY-headH*0.2, cx-thighD*0.1, crotchY);
  ctx.bezierCurveTo(cx-buttD*(0.42+tr.effSteat*0.24), hipY+headH*0.08, cx-buttD*0.76, hipY-headH*0.02, cx-buttD*0.56, waistY+headH*0.18);
  ctx.bezierCurveTo(cx-buttD*0.44, bustY+headH*0.1, cx-headD*0.24, shoulderY+headH*0.18, cx-headD*0.12, shoulderY-headH*0.02);
  ctx.closePath();
  const profGrad=ctx.createLinearGradient(cx-headD*1.1,0,cx+headD*1.1,0); profGrad.addColorStop(0,'rgba(255,255,255,.1)'); profGrad.addColorStop(.4,skin); profGrad.addColorStop(1,'rgba(0,0,0,.12)');
  ctx.fillStyle=profGrad; ctx.fill();
  ctx.strokeStyle='rgba(30,20,18,.22)'; ctx.lineWidth=1.1; ctx.stroke();

  // arm profile
  ctx.beginPath(); ctx.moveTo(cx+chestD*0.22, shoulderY+headH*0.06); ctx.bezierCurveTo(cx+chestD*0.42, bustY+headH*0.4, cx+bellyD*0.25, hipY+headH*0.18, cx+bellyD*0.1, hipY+headH*0.74); ctx.strokeStyle=skin; ctx.lineWidth=headH*0.22; ctx.lineCap='round'; ctx.stroke();

  // underwear profile
  ctx.save();
  if(isFemale){
    ctx.fillStyle='#78526c';
    ctx.beginPath();
    ctx.moveTo(cx+chestD*0.1,bustY-headH*0.1);
    ctx.quadraticCurveTo(cx+chestD*0.66,bustY+headH*0.06,cx+chestD*0.1,bustY+headH*0.32);
    ctx.lineTo(cx+headD*0.02,bustY+headH*0.26);
    ctx.lineTo(cx+headD*0.02,bustY-headH*0.06);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle='#6e4d66';
    ctx.beginPath();
    ctx.moveTo(cx-buttD*0.24,crotchY-headH*0.1);
    ctx.quadraticCurveTo(cx+bellyD*0.64,crotchY, cx+thighD*0.3,crotchY+headH*0.34);
    ctx.lineTo(cx-buttD*0.15,crotchY+headH*0.34);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle='#3d4762';
    ctx.beginPath();
    ctx.moveTo(cx-buttD*0.26,crotchY-headH*0.1);
    ctx.lineTo(cx+bellyD*0.48,crotchY-headH*0.08);
    ctx.lineTo(cx+thighD*0.24,crotchY+headH*0.52);
    ctx.lineTo(cx-buttD*0.12,crotchY+headH*0.52);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function _drawFigureSheet(canvas,isFemale,traits,groupLabel){
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const tr=_faceBodyTraits(isFemale, traits);
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#f4ecdf'); bg.addColorStop(1,'#ddd2c4');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(90,70,70,.08)';
  for(let x=0;x<W;x+=24) ctx.fillRect(x,0,1,H);
  for(let y=0;y<H;y+=24) ctx.fillRect(0,y,W,1);

  const inset={x:22,y:18,w:176,h:216};
  _drawInsetFace(ctx,inset.x,inset.y,inset.w,inset.h,isFemale,traits,groupLabel);

  const baseY=H-52;
  const headH=Math.min(56, Math.max(46, H/9.7));
  const frontX=Math.round(W*0.44);
  const sideX=Math.round(W*0.73);

  _drawFrontFigure(ctx,frontX,baseY,headH,tr,isFemale);
  _drawProfileFigure(ctx,sideX,baseY,headH,tr,isFemale);

  // labels / guides
  ctx.save();
  ctx.fillStyle='rgba(20,18,20,.78)'; ctx.font='bold 11px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('FRONT VIEW', frontX, H-18);
  ctx.fillText('LATERAL VIEW', sideX, H-18);
  ctx.textAlign='left';
  ctx.fillText(isFemale?'FEMALE COMPOSITE':'MALE COMPOSITE', 22, H-18);
  ctx.font='10px system-ui';
  ctx.fillStyle='rgba(45,36,40,.62)';
  ctx.fillText('landmarks: eye / nose base / chin / shoulder / iliac crest / knee', inset.x+2, inset.y+inset.h+18);
  if(!isFemale && tr.effSteat>0.12){
    ctx.fillText('male gluteofemoral deposition expressed under low dimorphism + ectomorphic + high population steatopygia profile', 22, inset.y+inset.h+34);
  }
  ctx.restore();
}
function renderFace(){
  const g=activeGroup(); ensureGroupShape(state,g);
  const mc=document.getElementById('faceCanvasMale');
  const fc=document.getElementById('faceCanvasFemale');
  if(!mc||!fc) return;
  _fitFaceCanvas(mc); _fitFaceCanvas(fc);
  const traits = _faceTraitSnapshot();
  const groupLabel = (g?.name || '').trim();
  if(_faceRenderRAF) cancelAnimationFrame(_faceRenderRAF);
  _faceRenderRAF=requestAnimationFrame(()=>{
    _drawFigureSheet(mc,false,traits,groupLabel);
    _drawFigureSheet(fc,true,traits,groupLabel);
    _faceRenderRAF=null;
  });
}

// ════════════════════════════════════════════════════════════════
// SWITCH TAB — patched to include Admix + Lineage
// ════════════════════════════════════════════════════════════════
function switchTab(name){
  state.ui.activeTab=name;
  ['Editor','Library','Compare','Face','Admix','Lineage'].forEach(t=>{
    const tab=document.getElementById('tab'+t);
    const nav=document.getElementById('nav'+t);
    if(tab) tab.classList.toggle('active',t===name);
    if(nav) nav.classList.toggle('active',t===name);
  });
  if(name==='Library') renderLibrary();
  if(name==='Compare') renderCompare();
  if(name==='Face') renderFace();
  if(name==='Admix') renderAdmix();
  if(name==='Lineage') renderLineage();
}
document.getElementById('navEditor') .addEventListener('click',e=>{e.preventDefault();switchTab('Editor');});
document.getElementById('navLibrary').addEventListener('click',e=>{e.preventDefault();switchTab('Library');});
document.getElementById('navCompare').addEventListener('click',e=>{e.preventDefault();switchTab('Compare');});
document.getElementById('navFace')   .addEventListener('click',e=>{e.preventDefault();switchTab('Face');});
document.getElementById('navAdmix')  .addEventListener('click',e=>{e.preventDefault();switchTab('Admix');});
document.getElementById('navLineage').addEventListener('click',e=>{e.preventDefault();switchTab('Lineage');});

// ════════════════════════════════════════════════════════════════
// PHENOTYPE BANK
// ════════════════════════════════════════════════════════════════

// bank = array of {id, name, description, traits:{key:{binModes,peaks}}}
// kept separately from state so it survives project imports
let bank = [];
(()=>{try{const b=JSON.parse(localStorage.getItem('ethnographer_bank')||'[]');if(Array.isArray(b))bank=b;}catch(e){}})();

function saveBank(){try{localStorage.setItem('ethnographer_bank',JSON.stringify(bank));}catch(e){}}

function bankGroupObj(raw){
  // Convert an imported profile JSON into a full group object usable by editor + admixture
  const g = defaultGroup(raw.name||'Imported');
  g.id = uid();
  g.description = raw.description||'';
  g._bankId = g.id;
  if(raw.traits){
    for(const t of DEFAULT_TRAITS){
      const src=raw.traits[t.key];
      if(!src) continue;
      g.traits[t.key]={
        binModes: src.binModes ? src.binModes.slice() : Array(t.bins.length).fill(2),
        peaks: (src.peaks||[]).map(p=>({id:uid(),mu:p.mu??0,sigma:p.sigma??1,amp:p.amp??1}))
      };
    }
  }
  ensureGroupShape(state, g);
  return g;
}

function bankAdd(raw){
  const g = bankGroupObj(raw);
  g._bankSource = raw.name||'Imported';
  bank.push(g);
  saveBank();
  renderBank();
  updateAdmixSelects();
  updateLinSelects();
  return g;
}

function bankRemove(id){
  bank = bank.filter(b=>b.id!==id);
  saveBank();
  renderBank();
  updateAdmixSelects();
  updateLinSelects();
}

function renderBank(){
  const list = document.getElementById('bankList');
  const count = document.getElementById('bankCount');
  if(!list) return;
  count.textContent = bank.length;
  if(!bank.length){list.innerHTML='<div class="bankEmpty">No profiles in bank yet.</div>';return;}
  list.innerHTML='';
  bank.forEach(g=>{
    const item = document.createElement('div');
    item.className='bankItem';
    item.title = g.description ? g.description.slice(0,120)+'…' : g.name;

    // colour dots: skin + hair colour
    const dots = document.createElement('div');
    dots.className='bankItemDots';
    const skinT = state.traits.find(t=>t.key==='skin_colour');
    const hairT = state.traits.find(t=>t.key==='hair_colour');
    [skinT,hairT].forEach(t=>{
      if(!t) return;
      const probs = computeProbs(state,g,t.key);
      const topIdx = probs.indexOf(Math.max(...probs));
      const d=document.createElement('div');
      d.className='bankDot';
      d.style.background=t.colors?.[topIdx]||'#9D87D2';
      dots.appendChild(d);
    });

    const name = document.createElement('span');
    name.className='bankItemName';
    name.textContent=g.name;

    const sub = document.createElement('span');
    sub.className='bankItemSub';
    // count complete traits
    let ok=0; for(const t of state.traits) if(isTraitComplete(state,g,t.key)) ok++;
    sub.textContent=ok+'/'+state.traits.length;

    const del = document.createElement('button');
    del.className='bankItemDel';
    del.textContent='×';
    del.title='Remove from bank';
    del.addEventListener('click',e=>{e.stopPropagation();bankRemove(g.id);});

    // click → load into editor as new group
    item.addEventListener('click',()=>{
      const copy=deepClone(g);copy.id=uid();copy._isTemplate=false;copy._bankId=undefined;
      state.groups.push(copy);state.ui.activeGroupId=copy.id;
      saveState(state);rerender();switchTab('Editor');
      showToast('Loaded "'+g.name+'" into editor');
    });

    // drag → drag to admixture or lineage
    item.setAttribute('draggable','true');
    item.addEventListener('dragstart',e=>{
      e.dataTransfer.setData('bankGroupId', g.id);
      e.dataTransfer.effectAllowed='copy';
    });

    item.appendChild(dots);
    item.appendChild(name);
    item.appendChild(sub);
    item.appendChild(del);
    list.appendChild(item);
  });
}

function showToast(msg){
  const t=document.getElementById('bankToast');
  if(!t) return;
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2400);
}

async function loadBankFiles(files){
  let added=0, errors=[];
  const jsons = Array.from(files).filter(f=>f.name.endsWith('.json'));
  for(const f of jsons){
    try{
      const text = await f.text();
      const raw = JSON.parse(text);
      // Accept single profile OR array of profiles OR project file
      if(Array.isArray(raw)){
        raw.forEach(r=>{ if(r.traits||r.name){ bankAdd(r); added++; } });
      } else if(raw.groups){
        // Project file — import all non-template groups
        raw.groups.filter(g=>!g._isTemplate).forEach(g=>{bankAdd(g);added++;});
      } else if(raw.traits||raw.name){
        bankAdd(raw); added++;
      }
    } catch(e){ errors.push(f.name); }
  }
  if(added) showToast('Added '+added+' profile'+(added>1?'s':'')+' to bank'+(errors.length?' ('+errors.length+' failed)':''));
  else if(errors.length) showToast('Failed to read '+errors.length+' file'+(errors.length>1?'s':''));
  else showToast('No valid JSON profiles found in selection');
}

document.getElementById('btnBankFiles').addEventListener('click',()=>document.getElementById('fileBankSingle').click());
document.getElementById('btnBankFolder').addEventListener('click',()=>document.getElementById('fileBankFolder').click());
document.getElementById('fileBankSingle').addEventListener('change',e=>{loadBankFiles(e.target.files);e.target.value='';});
document.getElementById('fileBankFolder').addEventListener('change',e=>{loadBankFiles(e.target.files);e.target.value='';});


// ════════════════════════════════════════════════════════════════
// ADMIXTURE CALCULATOR
// ════════════════════════════════════════════════════════════════

// admixSources = [{sourceId, weight}]  weight 0–100
let admixSources = [
  {sourceId:null, weight:50},
  {sourceId:null, weight:50}
];

function allAdmixGroups(){
  // editor groups + bank groups — deduped by id
  const eg = flattenGroups(state.groups.filter(g=>!g._isTemplate)).map(f=>findGroupById(state.groups,f.id));
  const bg = bank;
  const seen=new Set();
  return [...eg,...bg].filter(g=>g&&!seen.has(g.id)&&seen.add(g.id));
}

function updateAdmixSelects(){
  const all = allAdmixGroups();
  document.querySelectorAll('.admixSrcSel').forEach(sel=>{
    const prev=sel.value;
    sel.innerHTML='<option value="">— choose group —</option>';
    all.forEach(g=>{
      const o=document.createElement('option');o.value=g.id;o.textContent=g.name;sel.appendChild(o);
    });
    if(all.find(g=>g.id===prev)) sel.value=prev;
  });
}

function computeAdmix(){
  // Returns {probs:{key:[...n]}} weighted average
  const active = admixSources.filter(s=>s.sourceId&&s.weight>0);
  if(!active.length) return null;
  const totalW = active.reduce((s,a)=>s+a.weight,0);
  if(totalW===0) return null;
  const all = allAdmixGroups();
  const result={};
  for(const t of DEFAULT_TRAITS){
    const n=t.bins.length;
    const mixed=new Array(n).fill(0);
    for(const src of active){
      const g=all.find(x=>x.id===src.sourceId);
      if(!g) continue;
      ensureGroupShape(state,g);
      const probs=computeProbs(state,g,t.key);
      const w=src.weight/totalW;
      probs.forEach((p,i)=>mixed[i]+=p*w);
    }
    result[t.key]=mixed;
  }
  return result;
}

function admixToGroup(name){
  // Convert admix result into a full group object
  const mix=computeAdmix();
  if(!mix) return null;
  const g=defaultGroup(name);
  for(const t of DEFAULT_TRAITS){
    const probs=mix[t.key];
    // Re-fit: set all bins to Selected, create single peak at weighted mean
    const n=t.bins.length;
    let mu=0; probs.forEach((p,i)=>mu+=p*i);
    // sigma from variance
    let v=0; probs.forEach((p,i)=>v+=p*(i-mu)**2);
    const sigma=Math.max(0.3,Math.sqrt(v));
    // amplitude that makes the peak dominate roughly
    const amp=Math.min(AMP_MAX,Math.max(0.5, Math.max(...probs)*AMP_MAX*1.1));
    g.traits[t.key]={
      binModes:Array(n).fill(2),
      peaks:[{id:uid(),mu,sigma,amp}]
    };
  }
  const srcNames = admixSources.filter(s=>s.sourceId&&s.weight>0).map(s=>{
    const g2=allAdmixGroups().find(x=>x.id===s.sourceId);
    return g2?g2.name+'('+s.weight+'%)':'?';
  });
  g.description='Admixed from: '+srcNames.join(' + ')+'. Distribution computed as weighted probability average.';
  return g;
}

function renderAdmixTotal(){
  const tot=admixSources.reduce((s,a)=>s+a.weight,0);
  const badge=document.getElementById('admixTotal');
  if(!badge) return;
  badge.textContent=tot+'%';
  badge.className='admixBadge '+(Math.abs(tot-100)<0.1?'ok':'warn');
}

function renderAdmixCanvas(mix, traitKey){
  const canvas=document.getElementById('admixCanvas');
  if(!canvas||!mix) return;
  const W=canvas.offsetWidth||400;
  canvas.width=W; canvas.height=140;
  const ctx=canvas.getContext('2d');
  const t=DEFAULT_TRAITS.find(x=>x.key===traitKey)||DEFAULT_TRAITS[0];
  const probs=mix[t.key]||[];
  const n=probs.length, maxP=Math.max(...probs,0.001);
  const PL=14,PR=14,PT=22,PB=36,baseY=140-PB;
  ctx.clearRect(0,0,W,140);
  const bg=ctx.createLinearGradient(0,0,0,140);bg.addColorStop(0,'#1C1623');bg.addColorStop(1,'#151316');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,140);
  ctx.strokeStyle='rgba(61,44,76,.5)';ctx.lineWidth=1;
  for(let i=1;i<=3;i++){const y=PT+(i/3)*(140-PT-PB);ctx.beginPath();ctx.moveTo(PL,y);ctx.lineTo(W-PR,y);ctx.stroke();}
  const bw=(W-PL-PR)/n*0.72;
  for(let i=0;i<n;i++){
    const col=t.colors?.[i]||'#9D87D2';
    const bx=PL+(i+0.5)/n*(W-PL-PR)-bw/2, bh=(probs[i]/maxP)*(140-PT-PB), by=baseY-bh;
    ctx.fillStyle=col+'70';ctx.beginPath();ctx.roundRect(bx,by,bw,bh,2);ctx.fill();
    ctx.fillStyle=col;ctx.fillRect(bx,by,bw,2);
    ctx.font='bold 9px system-ui';ctx.fillStyle='rgba(250,247,247,.85)';
    ctx.textAlign='center';ctx.textBaseline='bottom';
    if(probs[i]>0.02) ctx.fillText(Math.round(probs[i]*100)+'%',bx+bw/2,Math.max(PT+12,by-1));
  }
  ctx.save();ctx.font='10px system-ui';ctx.fillStyle='rgba(185,162,164,.8)';ctx.textAlign='center';ctx.textBaseline='top';
  for(let i=0;i<n;i++){const cx=PL+(i+0.5)/n*(W-PL-PR);ctx.fillText(t.bins[i],cx,baseY+4);}
  ctx.restore();
  // Curve overlay
  const STEPS=200,pts=[];
  for(let s=0;s<=STEPS;s++){
    const xi=s/STEPS*(n-1);let v=0;
    for(let i=0;i<n;i++){const w=modeToWeight(2,.25);let mix2=0;
      // we draw directly from probs interpolated
    }
    // simpler: interpolate probs directly
    const lo=Math.floor(xi),hi=Math.min(lo+1,n-1),frac=xi-lo;
    const v2=(probs[lo]||0)*(1-frac)+(probs[hi]||0)*frac;
    pts.push({x:xi,v:v2});
  }
  const maxV=Math.max(...pts.map(p=>p.v),0.001);
  const toC=p=>({px:PL+(p.x/Math.max(n-1,1))*(W-PL-PR),py:PT+(1-p.v/maxV)*(140-PT-PB)});
  const fp=toC(pts[0]);
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);pts.slice(1).forEach(p=>{const c=toC(p);ctx.lineTo(c.px,c.py);});
  const lp=toC(pts[pts.length-1]);
  ctx.lineTo(lp.px,baseY);ctx.lineTo(fp.px,baseY);ctx.closePath();
  const grd=ctx.createLinearGradient(0,PT,0,baseY);
  grd.addColorStop(0,'rgba(157,135,210,.22)');grd.addColorStop(1,'rgba(77,59,125,.02)');
  ctx.fillStyle=grd;ctx.fill();
  ctx.beginPath();ctx.moveTo(fp.px,fp.py);pts.slice(1).forEach(p=>{const c=toC(p);ctx.lineTo(c.px,c.py);});
  ctx.strokeStyle='#9D87D2';ctx.lineWidth=2;ctx.stroke();
}

function renderAdmixTable(mix, traitKey){
  const t=DEFAULT_TRAITS.find(x=>x.key===traitKey)||DEFAULT_TRAITS[0];
  const probs=mix?.[t.key]||[];
  const tbody=document.getElementById('admixTableBody');
  if(!tbody) return;
  tbody.innerHTML='';
  probs.forEach((p,i)=>{
    const tr=document.createElement('tr');
    const pct=Math.round(p*1000)/10;
    const col=t.colors?.[i]||'#9D87D2';
    tr.innerHTML=`<td>${t.bins[i]}</td><td><strong>${pct}%</strong></td>
      <td><div class="admixBarWrap"><div class="admixBar" style="width:${Math.min(100,pct*1.2)}%;background:${col}"></div></div></td>`;
    tbody.appendChild(tr);
  });
}

function buildAdmixSourceRow(idx){
  const src=admixSources[idx];
  const all=allAdmixGroups();
  const row=document.createElement('div');
  row.className='admixSrcRow';
  row.dataset.idx=idx;

  const sel=document.createElement('select');
  sel.className='admixSrcSel';
  sel.innerHTML='<option value="">— choose group —</option>';
  all.forEach(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=g.name;sel.appendChild(o);});
  if(src.sourceId&&all.find(g=>g.id===src.sourceId)) sel.value=src.sourceId;
  sel.addEventListener('change',()=>{admixSources[idx].sourceId=sel.value||null;refreshAdmix();});

  const wt=document.createElement('input');
  wt.type='range';wt.min='0';wt.max='100';wt.step='1';wt.value=src.weight;
  wt.className='admixWtSlider';
  const wtN=document.createElement('input');
  wtN.type='number';wtN.min='0';wtN.max='100';wtN.step='1';wtN.value=src.weight;
  wtN.className='admixWtNum';
  wt.addEventListener('input',()=>{wtN.value=wt.value;admixSources[idx].weight=+wt.value;renderAdmixTotal();refreshAdmixPreview();});
  wtN.addEventListener('input',()=>{wt.value=wtN.value;admixSources[idx].weight=+wtN.value;renderAdmixTotal();refreshAdmixPreview();});

  const del=document.createElement('button');
  del.textContent='×';del.className='ghost';del.style.padding='3px 6px';del.style.color='var(--muted2)';
  del.title='Remove source';
  del.addEventListener('click',()=>{admixSources.splice(idx,1);renderAdmixSourceList();refreshAdmix();});

  row.appendChild(sel);row.appendChild(wt);row.appendChild(wtN);row.appendChild(del);
  return row;
}

function renderAdmixSourceList(){
  const list=document.getElementById('admixSourceList');
  if(!list) return;
  list.innerHTML='';
  admixSources.forEach((_,i)=>list.appendChild(buildAdmixSourceRow(i)));
  renderAdmixTotal();
  document.getElementById('admixAddSource').disabled = admixSources.length>=4;
}

function refreshAdmixPreview(){
  const mix=computeAdmix();
  const key=document.getElementById('admixTraitSel')?.value||DEFAULT_TRAITS[0].key;
  renderAdmixCanvas(mix, key);
  renderAdmixTable(mix, key);
}

function refreshAdmix(){renderAdmixSourceList();refreshAdmixPreview();}

function renderAdmix(){
  // Wire drag-drop from bank onto admix source list
  const admixArea=document.getElementById('admixSourceList');
  if(admixArea && !admixArea._bankDragWired){
    admixArea._bankDragWired=true;
    admixArea.addEventListener('dragover',e=>{
      if(e.dataTransfer.types.includes('bankgroupid')){e.preventDefault();e.dataTransfer.dropEffect='copy';admixArea.style.outline='2px dashed var(--accent)';}
    });
    admixArea.addEventListener('dragleave',()=>admixArea.style.outline='');
    admixArea.addEventListener('drop',e=>{
      e.preventDefault();admixArea.style.outline='';
      const bankId=e.dataTransfer.getData('bankGroupId');
      if(!bankId) return;
      const g=bank.find(b=>b.id===bankId)||allAdmixGroups().find(x=>x.id===bankId);
      if(!g){showToast('Group not found');return;}
      if(admixSources.length>=6){showToast('Maximum 6 sources');return;}
      const newCount=admixSources.length+1;
      const even=Math.floor(100/newCount);
      admixSources.push({sourceId:g.id,weight:even});
      admixSources.forEach((s,i)=>s.weight=i<newCount-1?even:100-(even*(newCount-1)));
      renderAdmixSourceList();refreshAdmix();
      showToast('Added "'+g.name+'" to admixture sources');
    });
  }
  // Populate trait selector
  const tSel=document.getElementById('admixTraitSel');
  if(tSel&&!tSel.options.length){
    DEFAULT_TRAITS.forEach(t=>{const o=document.createElement('option');o.value=t.key;o.textContent=t.name;tSel.appendChild(o);});
    tSel.addEventListener('change',refreshAdmixPreview);
  }
  updateAdmixSelects();
  renderAdmixSourceList();
  refreshAdmixPreview();
}

document.getElementById('admixAddSource').addEventListener('click',()=>{
  if(admixSources.length>=4) return;
  admixSources.push({sourceId:null,weight:Math.round(100/( admixSources.length+1))});
  // re-balance remaining
  renderAdmixSourceList(); refreshAdmix();
});

document.getElementById('admixNorm').addEventListener('click',()=>{
  const tot=admixSources.reduce((s,a)=>s+a.weight,0);
  if(tot===0) return;
  admixSources.forEach(s=>s.weight=Math.round(s.weight/tot*100));
  renderAdmixSourceList(); refreshAdmixPreview();
});

document.getElementById('admixSaveGroup').addEventListener('click',()=>{
  const name=(document.getElementById('admixSaveName').value.trim())||'Admixed Group';
  const g=admixToGroup(name);if(!g) return;
  state.groups.push(g);state.ui.activeGroupId=g.id;saveState(state);
  showToast('Added "'+name+'" to editor');
  switchTab('Editor');rerender();
});

document.getElementById('admixAddToBank').addEventListener('click',()=>{
  const name=(document.getElementById('admixSaveName').value.trim())||'Admixed Group';
  const g=admixToGroup(name);if(!g) return;
  bank.push(g);saveBank();renderBank();updateAdmixSelects();updateLinSelects();
  showToast('Added "'+name+'" to phenotype bank');
});

document.getElementById('admixExport').addEventListener('click',()=>{
  const name=(document.getElementById('admixSaveName').value.trim())||'Admixed';
  const g=admixToGroup(name);if(!g) return;
  const out={app:'Ethnographer',version:3,name:g.name,description:g.description,traits:{}};
  for(const t of DEFAULT_TRAITS) out.traits[t.key]={peaks:g.traits[t.key]?.peaks.map(({mu,sigma,amp})=>({mu,sigma,amp})),binModes:g.traits[t.key]?.binModes};
  downloadFile(name.replace(/\s+/g,'_')+'_admixed.json',new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
});


// ════════════════════════════════════════════════════════════════
// LINEAGE BUILDER
// ════════════════════════════════════════════════════════════════

// linNodes: [{id, label, sourceId, x, y, generation, parents:[{nodeId,weight}], color}]
// linEdges are derived from parents

let linNodes=[];
let linRelations=[];
let linSelectedId=null;
let linDragId=null, linDragOffX=0, linDragOffY=0;
let linPanOffset={x:0,y:0}, linPanStart=null;

const LIN_NODE_W=160, LIN_NODE_H=44;
const GEN_COLORS=['#7E6BA7','#EA9E83','#5C9E8F','#C57072','#8A9E5C','#9E7850','#5C6FA7','#A75C8F'];

function linNodeById(id){return linNodes.find(n=>n.id===id)||null;}
function allLinGroups(){return allAdmixGroups();}
function linSexIcon(sex){return sex==='F'?'♀':sex==='M'?'♂':'◌';}
function linRelationColor(type){return type==='mother'?'#d872a9':type==='daughter'?'#f1a37f':'#6fc4bb';}
function linRelationLabel(rel,currentId){
  const from=linNodeById(rel.fromId), to=linNodeById(rel.toId);
  if(rel.type==='sister') return 'Sister of '+((currentId===rel.fromId?to:from)?.label||'?');
  if(rel.type==='mother') return currentId===rel.fromId ? 'Mother of '+(to?.label||'?') : 'Daughter/child of '+(from?.label||'?');
  return currentId===rel.fromId ? 'Daughter of '+(to?.label||'?') : 'Mother/parent of '+(from?.label||'?');
}
function linNodeRelations(nodeId){return linRelations.filter(r=>r.fromId===nodeId||r.toId===nodeId);}
function linAddRelation(fromId,toId,type){
  if(!fromId||!toId||fromId===toId) return false;
  if(type==='sister'){
    const a=[fromId,toId].sort();
    if(linRelations.some(r=>r.type==='sister'&&[r.fromId,r.toId].sort().join('|')===a.join('|'))) return false;
    linRelations.push({id:uid(),type:'sister',fromId:a[0],toId:a[1]});
    return true;
  }
  if(linRelations.some(r=>r.type===type&&r.fromId===fromId&&r.toId===toId)) return false;
  linRelations.push({id:uid(),type,fromId,toId});
  return true;
}
function linRemoveRelation(id){ linRelations=linRelations.filter(r=>r.id!==id); }
function linSetNodeSex(id,sex){ const n=linNodeById(id); if(n){ n.sex=sex; } }

function updateLinSelects(){
  // Called when bank or state changes
  if(document.getElementById('linModal')&&!document.getElementById('linModal').classList.contains('hidden'))
    renderLinModalBody(); // refresh open modal if any
}

function linNodeColor(gen){return GEN_COLORS[gen%GEN_COLORS.length];}

function drawLinCanvas(){
  const canvas=document.getElementById('linCanvas');
  if(!canvas) return;
  const area=document.getElementById('linCanvasArea');
  const W=Math.max(1200, area.offsetWidth||1200);
  const H=Math.max(700, area.offsetHeight||700);
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);

  ctx.fillStyle='#18141f'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(61,44,76,.35)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  ctx.save();
  ctx.translate(linPanOffset.x, linPanOffset.y);

  // admixture edges
  linNodes.forEach(node=>{
    if(!node.parents||!node.parents.length) return;
    const nx=node.x+LIN_NODE_W/2, ny=node.y+LIN_NODE_H/2;
    node.parents.forEach(p=>{
      const parent=linNodeById(p.nodeId); if(!parent) return;
      const px=parent.x+LIN_NODE_W/2, py=parent.y+LIN_NODE_H/2;
      const mx=(px+nx)/2, ly=(py+ny)/2;
      ctx.beginPath();
      ctx.moveTo(px,py+LIN_NODE_H*.4);
      ctx.bezierCurveTo(px,py+LIN_NODE_H*.4+(ny-py)*.4, nx,ny-(ny-py)*.4, nx,ny-LIN_NODE_H*.4);
      ctx.strokeStyle=parent.color||'#7E6BA7'; ctx.lineWidth=2.5; ctx.globalAlpha=.55; ctx.stroke(); ctx.globalAlpha=1;
      ctx.save();
      ctx.font='bold 11px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='rgba(21,19,22,.85)';
      const tw=ctx.measureText(p.weight+'%').width;
      ctx.fillRect(mx-tw/2-4,ly-8,tw+8,16);
      ctx.fillStyle='#EACCB4'; ctx.fillText(p.weight+'%',mx,ly);
      ctx.restore();
    });
  });

  // kinship edges
  linRelations.forEach(rel=>{
    const a=linNodeById(rel.fromId), b=linNodeById(rel.toId); if(!a||!b) return;
    const ax=a.x+LIN_NODE_W/2, ay=a.y+LIN_NODE_H/2, bx=b.x+LIN_NODE_W/2, by=b.y+LIN_NODE_H/2;
    const dx=bx-ax, dy=by-ay;
    const mx=(ax+bx)/2, my=(ay+by)/2 - Math.max(24, Math.abs(dx)*0.08);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.quadraticCurveTo(mx,my,bx,by);
    ctx.strokeStyle=linRelationColor(rel.type);
    ctx.lineWidth=rel.type==='sister'?2:2.4;
    if(rel.type==='sister') ctx.setLineDash([8,6]);
    ctx.globalAlpha=.8; ctx.stroke(); ctx.globalAlpha=1;
    ctx.setLineDash([]);
    ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const tag=rel.type.toUpperCase();
    const tw=ctx.measureText(tag).width;
    ctx.fillStyle='rgba(21,19,22,.88)'; ctx.fillRect(mx-tw/2-5,my-8,tw+10,16);
    ctx.fillStyle=linRelationColor(rel.type); ctx.fillText(tag,mx,my);
    ctx.restore();
  });

  linNodes.forEach(node=>{
    const isSel=node.id===linSelectedId;
    const col=node.color||'#7E6BA7';
    const x=node.x,y=node.y,W2=LIN_NODE_W,H2=LIN_NODE_H;
    ctx.shadowColor='rgba(0,0,0,.4)'; ctx.shadowBlur=isSel?16:8;
    ctx.beginPath(); ctx.roundRect(x,y,W2,H2,8);
    const grd=ctx.createLinearGradient(x,y,x,y+H2); grd.addColorStop(0,col+'40'); grd.addColorStop(1,col+'18');
    ctx.fillStyle=grd; ctx.fill();
    ctx.strokeStyle=isSel?col:'rgba(255,255,255,.18)'; ctx.lineWidth=isSel?2.5:1; ctx.stroke();
    ctx.shadowBlur=0;

    ctx.save();
    ctx.beginPath(); ctx.roundRect(x+5,y+5,LIN_NODE_W-10,14,4); ctx.fillStyle=col+'60'; ctx.fill();
    ctx.font='bold 9px system-ui'; ctx.fillStyle=col; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Gen '+node.generation,x+LIN_NODE_W/2,y+12);
    ctx.restore();

    ctx.save();
    ctx.font='bold 12px system-ui'; ctx.fillStyle='#FAF7F7'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.beginPath(); ctx.rect(x+6,y+22,LIN_NODE_W-12,H2-24); ctx.clip();
    ctx.fillText(node.label,x+LIN_NODE_W/2,y+H2/2+6);
    ctx.restore();

    ctx.beginPath(); ctx.arc(x+11,y+H2-9,6,0,Math.PI*2); ctx.fillStyle='rgba(21,19,22,.9)'; ctx.fill();
    ctx.fillStyle=col; ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(linSexIcon(node.sex||'U'),x+11,y+H2-9);

    if(node.parents&&node.parents.length){
      const tot=node.parents.reduce((s,p)=>s+p.weight,0);
      const dot=Math.abs(tot-100)<1?'#6ee7b7':'#C57072';
      ctx.beginPath(); ctx.arc(x+W2-8,y+8,4,0,Math.PI*2); ctx.fillStyle=dot; ctx.fill();
    }
  });

  ctx.restore();
  if(!linNodes.length){
    ctx.font='14px system-ui'; ctx.fillStyle='rgba(185,162,164,.45)'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Add a Founder Node to begin building your lineage.',W/2,H/2);
  }
}

// Canvas interaction
const linCanvas=document.getElementById('linCanvas');

function getLinPos(e){
  const r=linCanvas.getBoundingClientRect();
  const src=e.touches?e.touches[0]:e;
  return{x:(src.clientX-r.left)-linPanOffset.x, y:(src.clientY-r.top)-linPanOffset.y};
}

function hitTestLin(x,y){
  for(let i=linNodes.length-1;i>=0;i--){
    const n=linNodes[i];
    if(x>=n.x&&x<=n.x+LIN_NODE_W&&y>=n.y&&y<=n.y+LIN_NODE_H) return n;
  }
  return null;
}

linCanvas.addEventListener('mousedown',e=>{
  const{x,y}=getLinPos(e);
  const hit=hitTestLin(x,y);
  if(hit){
    linDragId=hit.id;linDragOffX=x-hit.x;linDragOffY=y-hit.y;
    linSelectedId=hit.id;
    linCanvas.classList.add('dragging');
    renderLinPanel();drawLinCanvas();
    e.preventDefault();
  } else {
    // pan
    linSelectedId=null;
    linPanStart={x:e.clientX-linPanOffset.x,y:e.clientY-linPanOffset.y};
    renderLinPanel();drawLinCanvas();
  }
  document.getElementById('linDeleteSelected').disabled=!linSelectedId;
});

window.addEventListener('mousemove',e=>{
  if(linDragId){
    const r=linCanvas.getBoundingClientRect();
    const x=(e.clientX-r.left)-linPanOffset.x-linDragOffX;
    const y=(e.clientY-r.top)-linPanOffset.y-linDragOffY;
    const n=linNodeById(linDragId);
    if(n){n.x=x;n.y=y;drawLinCanvas();}
  } else if(linPanStart){
    linPanOffset.x=e.clientX-linPanStart.x;
    linPanOffset.y=e.clientY-linPanStart.y;
    drawLinCanvas();
  }
});

window.addEventListener('mouseup',()=>{
  linDragId=null;linPanStart=null;
  linCanvas.classList.remove('dragging');
});

function renderLinPanel(){
  const detail=document.getElementById('linPanelDetail');
  const hint=document.getElementById('linPanelHint');
  if(!detail||!hint) return;
  const node=linNodeById(linSelectedId);
  if(!node){detail.style.display='none';hint.style.display='';return;}
  hint.style.display='none'; detail.style.display='flex'; detail.innerHTML='';

  const title=document.createElement('div'); title.className='linPanelTitle'; title.textContent=node.label;
  const sub=document.createElement('div'); sub.className='linPanelSub'; sub.textContent='Generation '+node.generation+(node.parents&&node.parents.length?' · Admixed':' · Founder');
  detail.appendChild(title); detail.appendChild(sub);

  const sexHead=document.createElement('div'); sexHead.style.cssText='font-size:10px;color:var(--muted2);font-weight:700;text-transform:uppercase;letter-spacing:.07em;'; sexHead.textContent='Node sex'; detail.appendChild(sexHead);
  const sexRow=document.createElement('div'); sexRow.className='linSexRow';
  [['U','Unknown'],['F','Female'],['M','Male']].forEach(([sex,label])=>{
    const btn=document.createElement('button'); btn.className='linSexBtn'+((node.sex||'U')===sex?' active':''); btn.textContent=linSexIcon(sex)+' '+label;
    btn.addEventListener('click',()=>{ linSetNodeSex(node.id,sex); renderLinPanel(); drawLinCanvas(); });
    sexRow.appendChild(btn);
  });
  detail.appendChild(sexRow);

  if(node.parents&&node.parents.length){
    const ph=document.createElement('div'); ph.style.cssText='font-size:10px;color:var(--muted2);font-weight:700;text-transform:uppercase;letter-spacing:.07em;'; ph.textContent='Ancestry'; detail.appendChild(ph);
    const plist=document.createElement('div'); plist.style.cssText='display:flex;flex-direction:column;gap:4px;';
    node.parents.forEach(p=>{
      const pn=linNodeById(p.nodeId);
      const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;font-size:11px;';
      const bar=document.createElement('div'); bar.style.cssText=`width:${Math.min(100,p.weight)}%;height:4px;border-radius:2px;background:${pn?.color||'#9D87D2'};`;
      const lbl=document.createElement('div'); lbl.textContent=(pn?.label||'?')+' — '+p.weight+'%';
      row.appendChild(bar); row.appendChild(lbl); plist.appendChild(row);
    });
    detail.appendChild(plist);
  }

  const relHead=document.createElement('div'); relHead.style.cssText='font-size:10px;color:var(--muted2);font-weight:700;text-transform:uppercase;letter-spacing:.07em;'; relHead.textContent='Kinship links'; detail.appendChild(relHead);
  const relList=document.createElement('div'); relList.className='linRelList';
  const rels=linNodeRelations(node.id);
  if(!rels.length){ const empty=document.createElement('div'); empty.className='linPanelSub'; empty.textContent='No kinship links yet.'; relList.appendChild(empty); }
  rels.forEach(rel=>{
    const item=document.createElement('div'); item.className='linRelItem';
    const meta=document.createElement('div'); meta.className='linRelMeta';
    const dot=document.createElement('div'); dot.className='linRelDot'; dot.style.background=linRelationColor(rel.type);
    const txt=document.createElement('div'); txt.textContent=linRelationLabel(rel,node.id);
    meta.appendChild(dot); meta.appendChild(txt);
    const rm=document.createElement('button'); rm.className='ghost'; rm.textContent='×'; rm.style.fontSize='12px';
    rm.addEventListener('click',()=>{ linRemoveRelation(rel.id); renderLinPanel(); drawLinCanvas(); });
    item.appendChild(meta); item.appendChild(rm); relList.appendChild(item);
  });
  detail.appendChild(relList);

  const controlWrap=document.createElement('div'); controlWrap.className='linRelControls';
  const targetSel=document.createElement('select'); targetSel.className='linPanelSelect';
  targetSel.innerHTML='<option value="">Link to…</option>';
  linNodes.filter(n=>n.id!==node.id).forEach(n=>{ const o=document.createElement('option'); o.value=n.id; o.textContent=n.label+' (Gen '+n.generation+')'; targetSel.appendChild(o); });
  controlWrap.appendChild(targetSel);
  const typeRow=document.createElement('div'); typeRow.className='linSexRow';
  let activeType='mother';
  [['mother','Mother'],['daughter','Daughter'],['sister','Sister']].forEach(([type,label],idx)=>{
    const btn=document.createElement('button'); btn.className='linRelBtn'+(idx===0?' active':''); btn.textContent=label;
    btn.addEventListener('click',()=>{ activeType=type; typeRow.querySelectorAll('.linRelBtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); });
    typeRow.appendChild(btn);
  });
  controlWrap.appendChild(typeRow);
  const addBtn=document.createElement('button'); addBtn.className='primary'; addBtn.style.width='100%'; addBtn.textContent='Add relationship';
  addBtn.addEventListener('click',()=>{
    const targetId=targetSel.value;
    if(!targetId) return alert('Choose another node first.');
    const ok=linAddRelation(node.id,targetId,activeType);
    if(!ok) return alert('That relationship already exists or is invalid.');
    renderLinPanel(); drawLinCanvas();
  });
  controlWrap.appendChild(addBtn);
  detail.appendChild(controlWrap);

  const traits=['skin_colour','hair_colour','height','cephalic_index','nose_breadth'];
  const chartHead=document.createElement('div'); chartHead.style.cssText='font-size:10px;color:var(--muted2);font-weight:700;text-transform:uppercase;letter-spacing:.07em;'; chartHead.textContent='Trait Peaks'; detail.appendChild(chartHead);
  const all=allLinGroups();
  const srcGroup=all.find(g=>g.id===node.sourceId);
  traits.forEach(key=>{
    const t=DEFAULT_TRAITS.find(x=>x.key===key); if(!t) return;
    let probs;
    if(node.mixProbs&&node.mixProbs[key]) probs=node.mixProbs[key];
    else if(srcGroup){ ensureGroupShape(state,srcGroup); probs=computeProbs(state,srcGroup,key); }
    else return;
    const wrap=document.createElement('div'); wrap.style.cssText='margin-bottom:5px;';
    const lbl=document.createElement('div'); lbl.style.cssText='font-size:10px;color:var(--muted);margin-bottom:2px;'; lbl.textContent=t.name;
    const bars=document.createElement('div'); bars.style.cssText='display:flex;gap:2px;align-items:flex-end;height:22px;';
    const maxP=Math.max(...probs,0.001);
    probs.forEach((p,i)=>{ const b=document.createElement('div'); b.style.cssText=`flex:1;height:${Math.max(2,Math.round(p/maxP*22))}px;background:${t.colors?.[i]||'#9D87D2'};border-radius:2px 2px 0 0;`; b.title=t.bins[i]+': '+Math.round(p*100)+'%'; bars.appendChild(b); });
    wrap.appendChild(lbl); wrap.appendChild(bars); detail.appendChild(wrap);
  });

  const delBtn=document.createElement('button'); delBtn.className='danger'; delBtn.style='width:100%;margin-top:4px;font-size:11px;'; delBtn.textContent='✕ Delete Node';
  delBtn.addEventListener('click',()=>linDeleteNode(linSelectedId));
  detail.appendChild(delBtn);
}

function linDeleteNode(id){
  linNodes=linNodes.filter(n=>n.id!==id);
  linNodes.forEach(n=>{ if(n.parents) n.parents=n.parents.filter(p=>p.nodeId!==id); });
  linRelations=linRelations.filter(r=>r.fromId!==id && r.toId!==id);
  linSelectedId=null;
  document.getElementById('linDeleteSelected').disabled=true;
  renderLinPanel(); drawLinCanvas();
  document.getElementById('linNodeCount').textContent=linNodes.length+' nodes';
}

// ── Modal for founder / admix nodes ─────────────────────────────
let linModalMode='founder'; // 'founder' | 'admix'
let linPendingNode=null;

function openLinModal(mode){
  linModalMode=mode;
  linPendingNode=null;
  document.getElementById('linModalIcon').textContent=mode==='founder'?'🌱':'⊕';
  document.getElementById('linModalTitle').textContent=mode==='founder'?'Add Founding Group':'Add Admixture Event';
  renderLinModalBody();
  document.getElementById('linModal').classList.remove('hidden');
}

function renderLinModalBody(){
  const body=document.getElementById('linModalBody');
  if(!body) return;
  body.innerHTML='';
  const all=allLinGroups();

  if(linModalMode==='founder'){
    const lbl=document.createElement('div');lbl.className='tplLabel';lbl.textContent='Source group (editor or bank)';body.appendChild(lbl);
    const sel=document.createElement('select');sel.className='linSrcSel';sel.id='linFounderSel';
    sel.innerHTML='<option value="">— choose —</option>';
    all.forEach(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=g.name;sel.appendChild(o);});
    body.appendChild(sel);
    // Generation selector
    const lbl3=document.createElement('div');lbl3.className='tplLabel';lbl3.style.marginTop='10px';lbl3.textContent='Place in generation';body.appendChild(lbl3);
    const maxGen=linNodes.length?Math.max(...linNodes.map(n=>n.generation||0))+2:4;
    const genWrap=document.createElement('div');genWrap.className='linGenSelector';genWrap.id='linFounderGenWrap';
    let _selGen=0;
    for(let g2=0;g2<=Math.min(maxGen,7);g2++){
      const btn=document.createElement('button');btn.className='linGenBtn'+(g2===0?' active':'');
      btn.textContent=g2===0?'●':g2;btn.title='Generation '+g2;btn.dataset.gen=g2;
      btn.addEventListener('click',()=>{
        _selGen=g2;
        genWrap.querySelectorAll('.linGenBtn').forEach(b=>b.classList.toggle('active',+b.dataset.gen===g2));
      });
      genWrap.appendChild(btn);
    }
    genWrap._getGen=()=>_selGen;
    body.appendChild(genWrap);
    const lbl2=document.createElement('div');lbl2.className='tplLabel';lbl2.style.marginTop='8px';lbl2.textContent='Label (optional)';body.appendChild(lbl2);
    const inp=document.createElement('input');inp.className='tplInput';inp.id='linFounderLabel';inp.placeholder='Defaults to group name';body.appendChild(inp);

  } else {
    // Admixture event: select 2+ existing tree nodes + source group
    if(!linNodes.length){
      body.innerHTML='<div style="color:var(--muted);font-size:12px;">Add at least one founder node first.</div>';return;
    }
    const intro=document.createElement('div');intro.style.cssText='font-size:11px;color:var(--muted);';
    intro.textContent='Select parent nodes and their percentage contributions. The resulting child node will be placed at the weighted centroid of its parents.';
    body.appendChild(intro);

    // parent rows (start with 2)
    const srcArea=document.createElement('div');srcArea.id='linAdmixSrcs';
    body.appendChild(srcArea);

    let admixPairs=[{nodeId:linNodes[0]?.id||'',weight:50},{nodeId:linNodes[linNodes.length>1?1:0]?.id||'',weight:50}];

    function renderAdmixPairs(){
      srcArea.innerHTML='';
      admixPairs.forEach((pair,i)=>{
        const row=document.createElement('div');row.className='linSrcRow';
        const sel=document.createElement('select');sel.className='linSrcSel';
        sel.innerHTML='<option value="">— choose node —</option>';
        linNodes.forEach(n=>{const o=document.createElement('option');o.value=n.id;o.textContent=n.label+' (Gen '+n.generation+')';sel.appendChild(o);});
        if(pair.nodeId) sel.value=pair.nodeId;
        sel.addEventListener('change',()=>{admixPairs[i].nodeId=sel.value;});

        const wt=document.createElement('input');wt.type='number';wt.min='0';wt.max='100';wt.value=pair.weight;wt.className='admixWtNum';
        wt.addEventListener('input',()=>{admixPairs[i].weight=+wt.value;updateTotal();});

        const del=document.createElement('button');del.textContent='×';del.className='ghost';del.style.cssText='padding:3px 7px;color:var(--muted2);';
        del.addEventListener('click',()=>{if(admixPairs.length<=2)return;admixPairs.splice(i,1);renderAdmixPairs();});

        const wtLbl=document.createElement('span');wtLbl.style.cssText='font-size:11px;color:var(--muted);white-space:nowrap;';wtLbl.textContent='%';
        row.appendChild(sel);row.appendChild(wt);row.appendChild(wtLbl);row.appendChild(del);
        srcArea.appendChild(row);
      });
      // Add + button
      const addRow=document.createElement('div');addRow.style.cssText='display:flex;align-items:center;gap:8px;margin-top:4px;';
      const addBtn=document.createElement('button');addBtn.className='ghost';addBtn.style.fontSize='11px';addBtn.textContent='+ Add source';
      addBtn.addEventListener('click',()=>{if(admixPairs.length>=6)return;admixPairs.push({nodeId:'',weight:0});renderAdmixPairs();});
      const totLbl=document.createElement('span');totLbl.id='linAdmixTotal';totLbl.style.cssText='font-size:11px;margin-left:auto;';updateTotal();
      addRow.appendChild(addBtn);addRow.appendChild(totLbl);srcArea.appendChild(addRow);

      linPendingNode={pairs:admixPairs};
    }
    function updateTotal(){
      const tot=admixPairs.reduce((s,p)=>s+p.weight,0);
      const el=document.getElementById('linAdmixTotal');
      if(el) el.textContent='Total: '+tot+'%';
      if(el) el.style.color=Math.abs(tot-100)<1?'var(--ok)':'var(--danger)';
    }
    renderAdmixPairs();

    // Label for result
    const lbl2=document.createElement('div');lbl2.className='tplLabel';lbl2.style.marginTop='10px';lbl2.textContent='Label for result node';body.appendChild(lbl2);
    const inp=document.createElement('input');inp.className='tplInput';inp.id='linAdmixLabel';inp.placeholder='e.g. F1 Hybrid, Mixed Coastal…';body.appendChild(inp);
  }
}

document.getElementById('linModalCancel').addEventListener('click',()=>document.getElementById('linModal').classList.add('hidden'));
document.getElementById('linModal').addEventListener('click',e=>{if(e.target===document.getElementById('linModal'))document.getElementById('linModal').classList.add('hidden');});

document.getElementById('linModalConfirm').addEventListener('click',()=>{
  const all=allLinGroups();
  if(linModalMode==='founder'){
    const srcId=document.getElementById('linFounderSel')?.value;
    const rawLabel=document.getElementById('linFounderLabel')?.value?.trim();
    const srcG=all.find(g=>g.id===srcId);
    const label=rawLabel||(srcG?.name||'Founder '+(linNodes.length+1));
    const genWrap=document.getElementById('linFounderGenWrap');
    const gen=genWrap?._getGen?.()??0;
    const genNodes=linNodes.filter(n=>n.generation===gen);
    const x=80+genNodes.length*(LIN_NODE_W+30);
    const y=60+gen*(LIN_NODE_H+80);
    linNodes.push({id:uid(),label,sourceId:srcId||null,x,y,generation:gen,parents:[],color:linNodeColor(gen),sex:'U'});

  } else {
    // Admixture event
    const pairs=linPendingNode?.pairs||[];
    const validPairs=pairs.filter(p=>p.nodeId&&p.weight>0);
    if(validPairs.length<1){alert('Select at least one parent node.');return;}
    const label=document.getElementById('linAdmixLabel')?.value?.trim()||'Admixed '+(linNodes.length+1);
    // Generation = max parent gen + 1
    const maxGen=Math.max(...validPairs.map(p=>(linNodeById(p.nodeId)?.generation||0)));
    const gen=maxGen+1;
    // Position: weighted centroid of parents + offset
    let cx=0,cy=0,tw=0;
    validPairs.forEach(p=>{const pn=linNodeById(p.nodeId);if(!pn)return;cx+=pn.x*p.weight;cy+=pn.y*p.weight;tw+=p.weight;});
    cx=tw>0?cx/tw:200; cy=tw>0?cy/tw:200;
    cy+=100; // push child below parents

    // Compute mixed probs
    const mixProbs={};
    for(const t of DEFAULT_TRAITS){
      const n=t.bins.length;
      const mixed=new Array(n).fill(0);
      const totW=validPairs.reduce((s,p)=>s+p.weight,0);
      for(const pair of validPairs){
        const pn=linNodeById(pair.nodeId);
        let srcProbs;
        if(pn?.mixProbs?.[t.key]) srcProbs=pn.mixProbs[t.key];
        else{
          const srcG=pn?.sourceId?all.find(g=>g.id===pn.sourceId):null;
          if(srcG){ensureGroupShape(state,srcG);srcProbs=computeProbs(state,srcG,t.key);}
          else srcProbs=new Array(n).fill(1/n);
        }
        const w=pair.weight/totW;
        srcProbs.forEach((p,i)=>mixed[i]+=p*w);
      }
      mixProbs[t.key]=mixed;
    }

    linNodes.push({id:uid(),label,sourceId:null,x:cx-LIN_NODE_W/2,y:cy,generation:gen,parents:validPairs,color:linNodeColor(gen),mixProbs,sex:'U'});
  }

  document.getElementById('linNodeCount').textContent=linNodes.length+' nodes';
  document.getElementById('linModal').classList.add('hidden');
  drawLinCanvas();
});

document.getElementById('linAddFounder').addEventListener('click',()=>openLinModal('founder'));
document.getElementById('linAddAdmixNode').addEventListener('click',()=>openLinModal('admix'));
document.getElementById('linDeleteSelected').addEventListener('click',()=>{if(linSelectedId)linDeleteNode(linSelectedId);});
document.getElementById('linClear').addEventListener('click',()=>{if(!linNodes.length||confirm('Clear the entire lineage tree?')){linNodes=[];linRelations=[];linSelectedId=null;document.getElementById('linNodeCount').textContent='0 nodes';document.getElementById('linDeleteSelected').disabled=true;renderLinPanel();drawLinCanvas();}});
document.getElementById('linExport').addEventListener('click',()=>{
  const out={lineage:{nodes:linNodes.map(({id,label,sourceId,x,y,generation,parents,color,mixProbs,sex})=>({id,label,sourceId,x,y,generation,parents,color,mixProbs,sex:sex||'U'})),relations:linRelations.map(r=>({...r})),exportedAt:new Date().toISOString()}};
  downloadFile('lineage_export.json',new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
});

function renderLineage(){
  updateLinSelects();
  drawLinCanvas();
  renderLinPanel();
  // Wire up drag-drop from bank onto the canvas
  const linCanvas=document.getElementById('linCanvas');
  if(linCanvas && !linCanvas._bankDragWired){
    linCanvas._bankDragWired=true;
    linCanvas.addEventListener('dragover',e=>{
      if(e.dataTransfer.types.includes('bankgroupid')){
        e.preventDefault(); e.dataTransfer.dropEffect='copy';
        linCanvas.classList.add('dragover-canvas');
      }
    });
    linCanvas.addEventListener('dragleave',()=>linCanvas.classList.remove('dragover-canvas'));
    linCanvas.addEventListener('drop',e=>{
      e.preventDefault(); linCanvas.classList.remove('dragover-canvas');
      const bankId=e.dataTransfer.getData('bankGroupId');
      if(!bankId) return;
      const g=bank.find(b=>b.id===bankId)||allAdmixGroups().find(g=>g.id===bankId);
      if(!g){showToast('Group not found in bank');return;}
      const rect=linCanvas.getBoundingClientRect();
      const dropX=e.clientX-rect.left-linPanOffset.x-LIN_NODE_W/2;
      const dropY=e.clientY-rect.top-linPanOffset.y-LIN_NODE_H/2;
      // Snap to nearest generation row
      const genH=LIN_NODE_H+80;
      const gen=Math.max(0,Math.round((dropY-60)/genH));
      const node={id:uid(),label:g.name,sourceId:g.id,x:Math.max(20,dropX),y:60+gen*genH,generation:gen,parents:[],color:linNodeColor(gen),sex:'U'};
      linNodes.push(node);
      linSelectedId=node.id;
      renderLinPanel();drawLinCanvas();
      document.getElementById('linNodeCount').textContent=linNodes.length+' nodes';
      showToast('Added "'+g.name+'" to generation '+gen);
    });
  }
}

// ── Also wire up rerender to refresh bank ──
const _origRerender=rerender;
function rerender(full=true){
  _origRerender(full);
  renderBank();
  updateAdmixSelects();
  updateLinSelects();
}

// ── Init bank on load ──
renderBank();

try{
  rerender();
}catch(err){
  console.error('Boot failed, resetting state.', err);
  state=buildDefaultState();
  saveState(state);
  rerender();
}
