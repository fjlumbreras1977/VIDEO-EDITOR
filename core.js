import {ANIMATABLE_DEFAULTS,ANIMATABLE_PROPS,easeProgress} from './visual-effects.js?v=1.0.10';
import {validateTransitions} from './timeline-editing.js?v=1.0.10';
export const VERSION=1;
export const uid=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const clone=x=>JSON.parse(JSON.stringify(x));
export const end=c=>c.start+c.duration;
export const duration=p=>Math.max(0,...p.clips.map(end));
export const active=(c,t)=>t>=c.start&&t<end(c);
export function makeProject(){return {version:VERSION,name:'Mi primera historia',ratio:'16:9',fps:30,bg:'#0b0d12',tracks:[{id:'t1',name:'Texto',kind:'visual'},{id:'v2',name:'Superposición',kind:'visual'},{id:'v1',name:'Vídeo principal',kind:'visual'},{id:'a1',name:'Audio 1',kind:'audio'},{id:'a2',name:'Audio 2',kind:'audio'}],clips:[],markers:[]};}
export function makeClip(asset,track,start=0){return {id:uid(),assetId:asset.id,kind:asset.kind,name:asset.name,track,start,duration:asset.kind==='image'||asset.kind==='scene'?5:asset.duration,offset:0,speed:1,x:0,y:0,scale:100,rotation:0,opacity:100,volume:100,pan:0,brightness:100,contrast:100,saturation:100,blur:0,filter:'none',fit:'contain',flip:false,fadeIn:0,fadeOut:0,audioIn:0,audioOut:0,animation:'none',keyframes:[]};}
export function splitClips(p,ids,t){let out=[],splitIds=new Map();for(const c of [...p.clips]){if(!ids.includes(c.id)||t<=c.start+.02||t>=end(c)-.02||p.tracks.find(x=>x.id===c.track)?.locked)continue;const old=clone(c),left=t-c.start;c.duration=left;c.fadeOut=0;c.audioOut=0;c.keyframes=(old.keyframes||[]).filter(k=>k.t<=left);const right={...old,id:uid(),start:t,duration:old.duration-left,offset:old.offset+left*old.speed,fadeIn:0,audioIn:0,keyframes:croppedKeys(old,left,old.duration)};
c.keyframes=croppedKeys(old,0,left);
p.clips.push(right);splitIds.set(old.id,right.id);for(const transition of p.transitions||[])if(transition.from===old.id)transition.from=right.id;out.push(right.id);}for(const id of out){const c=p.clips.find(c=>c.id===id);if(c.linkedVideoId&&splitIds.has(c.linkedVideoId))c.linkedVideoId=splitIds.get(c.linkedVideoId);}return out;}
function curveAt(key,clip){return key.curve||{type:clip.keyframeEasing||'linear',from:0,to:1};}
export function animated(c,local){
 const keys=[...(c.keyframes||[])].sort((a,b)=>a.t-b.t),props=ANIMATABLE_PROPS;
 const base=Object.fromEntries(props.map(k=>[k,c[k]??ANIMATABLE_DEFAULTS[k]]));
 if(!keys.length)return base;
 let a=keys[0],b=keys.at(-1);
 if(local<=a.t)return {...base,...Object.fromEntries(props.map(k=>[k,a[k]??base[k]]))};
 if(local>=b.t)return {...base,...Object.fromEntries(props.map(k=>[k,b[k]??base[k]]))};
 for(let i=1;i<keys.length;i++)if(keys[i].t>=local){a=keys[i-1];b=keys[i];break;}
 const raw=clamp((local-a.t)/(b.t-a.t||1),0,1),curve=curveAt(a,c),lo=easeProgress(curve.from,curve.type),hi=easeProgress(curve.to,curve.type);
 const q=hi===lo?raw:(easeProgress(curve.from+(curve.to-curve.from)*raw,curve.type)-lo)/(hi-lo);
 return Object.fromEntries(props.map(k=>[k,(a[k]??base[k])+((b[k]??base[k])-(a[k]??base[k]))*q]));
}
export function croppedKeys(c,from,to){
 if(!c.keyframes?.length)return [];
 const original=[...c.keyframes].sort((a,b)=>a.t-b.t);
 const keys=[{t:0,...animated(c,from)},...original.filter(k=>k.t>from&&k.t<to).map(k=>({...k,t:k.t-from})),{t:to-from,...animated(c,to)}];
 for(let i=0;i<keys.length-1;i++){
  const begin=keys[i].t+from,finish=keys[i+1].t+from;
  const index=original.findIndex((k,j)=>j<original.length-1&&begin>=k.t-1e-8&&finish<=original[j+1].t+1e-8);
  if(index<0){keys[i].curve={type:'linear',from:0,to:1};continue;}
  const a=original[index],b=original[index+1],curve=curveAt(a,c),range=curve.to-curve.from;
  keys[i].curve={type:curve.type,from:curve.from+range*(begin-a.t)/(b.t-a.t),to:curve.from+range*(finish-a.t)/(b.t-a.t)};
 }
 return keys;
}
export function trim(c,side,t){if(!active(c,t)||t<=c.start+.02||t>=end(c)-.02)return false;const original=clone(c);if(side==='left'){const delta=t-c.start;c.start=t;c.duration-=delta;c.offset+=delta*c.speed;c.keyframes=croppedKeys(original,delta,original.duration);}else{c.duration=t-c.start;c.keyframes=croppedKeys(original,0,c.duration);}return true;}
export function snap(value,points,threshold){let nearest=value,distance=threshold;for(const p of points){if(Math.abs(value-p)<distance){nearest=p;distance=Math.abs(value-p);}}return Math.max(0,nearest);}
export function fade(c,local,audio=false){let v=1;const fi=audio?c.audioIn:c.fadeIn,fo=audio?c.audioOut:c.fadeOut;if(fi>0)v=Math.min(v,local/fi);if(fo>0)v=Math.min(v,(c.duration-local)/fo);return clamp(v,0,1);}
export function timecode(s,fps=30){s=Math.max(0,s);const frames=Math.floor(s*fps+.0001);return [Math.floor(frames/fps/3600),Math.floor(frames/fps/60)%60,Math.floor(frames/fps)%60,frames%fps].map(x=>String(x).padStart(2,'0')).join(':');}
export function parseSRT(text){text=text.replace(/^\uFEFF/,'').replace(/\r/g,'');const stamp=s=>{const m=s.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})/);return m?+m[1]*3600+ +m[2]*60+ +m[3]+ +m[4]/1000:NaN;};return text.split(/\n\s*\n/).flatMap(block=>{const lines=block.trim().split('\n'),i=lines.findIndex(l=>l.includes('-->'));if(i<0)return [];const [a,b]=lines[i].split('-->').map(stamp),body=lines.slice(i+1).join('\n').replace(/<[^>]*>/g,'');return Number.isFinite(a)&&Number.isFinite(b)&&b>a&&body?[{start:a,duration:Math.round((b-a)*1000)/1000,text:body}]:[];});}
export function toSRT(clips){const stamp=s=>{const ms=Math.round(Math.max(0,s)*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};return [...clips].filter(c=>c.kind==='text').sort((a,b)=>a.start-b.start).map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(end(c))}\n${c.text}\n`).join('\n');}
export function validateProject(p){
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
if(!p||p.version!==VERSION||typeof p.name!=='string'||p.name.length>1000||!Array.isArray(p.clips)||!Array.isArray(p.tracks))throw Error('El archivo no es un proyecto Dröma compatible.');
if(p.clips.length>10000||p.tracks.length>100)throw Error('El proyecto supera el tamaño admitido.');
if(!['16:9','9:16','1:1','4:5','4:3'].includes(p.ratio))throw Error('Proporción de proyecto no válida.');
if(![24,25,30,50,60].includes(p.fps))throw Error('Fotogramas por segundo no válidos.');
if(typeof p.bg!=='string'||!/^#[0-9a-fA-F]{6}$/.test(p.bg))throw Error('Color de fondo no válido.');
const ids=new Set();for(const tr of p.tracks){if(!validId(tr.id)||ids.has(tr.id)||!['visual','audio'].includes(tr.kind)||typeof tr.name!=='string'||tr.name.length>300)throw Error('Pistas no válidas.');ids.add(tr.id);}
const clipIds=new Set();for(const c of p.clips){if(!validId(c.id)||clipIds.has(c.id)||!ids.has(c.track)||!['video','audio','image','scene','text','shape'].includes(c.kind)||c.assetId&&!validId(c.assetId)||typeof c.name!=='string'||c.name.length>1000)throw Error('Clip no válido.');clipIds.add(c.id);
for(const k of ['start','duration','offset','speed','x','y','scale','rotation','opacity','volume'])if(!Number.isFinite(c[k]))throw Error('El proyecto contiene valores de clip no válidos.');
if(c.start<0||c.start>86400||c.duration<=0||c.duration>86400||c.offset<0||c.speed<.25||c.speed>4||c.scale<1||c.scale>500||c.opacity<0||c.opacity>100||c.volume<0||c.volume>200)throw Error('Rango de clip no válido.');
if(c.kind==='text'&&(typeof c.text!=='string'||c.text.length>100000))throw Error('Texto no válido.');
if(c.keyframes&&(!Array.isArray(c.keyframes)||c.keyframes.length>10000||c.keyframes.some(k=>!['t','x','y','scale','rotation','opacity'].every(x=>Number.isFinite(k[x])))))throw Error('Fotogramas clave no válidos.');
for(const key of c.keyframes||[]){for(const prop of ANIMATABLE_PROPS)if(key[prop]!==undefined&&!Number.isFinite(key[prop]))throw Error('Parámetro animado no válido.');if(key.curve&&(!['linear','ease-in','ease-out','ease-in-out'].includes(key.curve.type)||![key.curve.from,key.curve.to].every(Number.isFinite)||key.curve.from<0||key.curve.to>1||key.curve.from>key.curve.to))throw Error('Curva de animación no válida.');}
}
if(!Array.isArray(p.markers)||p.markers.some(m=>!validId(m.id)||!Number.isFinite(m.time)||m.time<0||typeof m.label!=='string'))throw Error('Marcadores no válidos.');
validateTransitions(p,validId);
return p;
}
export const MAGIC='DROMAV01';
export function bundleProject(project,assets){const files=assets.filter(a=>a.file);const manifest={project,assets:assets.map(({id,kind,name,duration,width,height,preset,file,inLibrary})=>({id,kind,name,duration,width,height,preset,inLibrary:inLibrary!==false,size:file?.size||0,type:file?.type||''}))};const json=new TextEncoder().encode(JSON.stringify(manifest)),size=new ArrayBuffer(4);new DataView(size).setUint32(0,json.length,true);return new Blob([MAGIC,size,json,...files.map(a=>a.file)],{type:'application/octet-stream'});}
export async function unbundleProject(blob){if(blob.size<12||await blob.slice(0,8).text()!==MAGIC)throw Error('Este archivo no es un proyecto .droma.');const len=new DataView(await blob.slice(8,12).arrayBuffer()).getUint32(0,true);if(len>20000000||12+len>blob.size)throw Error('Cabecera de proyecto dañada.');const data=JSON.parse(await blob.slice(12,12+len).text());validateProject(data.project);if(!Array.isArray(data.assets))throw Error('Biblioteca de medios dañada.');let offset=12+len;for(const a of data.assets){if(typeof a.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(a.id)||typeof a.name!=='string'||!Number.isFinite(a.duration)||a.duration<=0||!['video','audio','image','scene'].includes(a.kind)||(a.inLibrary!==undefined&&typeof a.inLibrary!=='boolean')||!Number.isSafeInteger(a.size)||a.size<0||offset+a.size>blob.size)throw Error('Contenido multimedia dañado.');if(a.size){a.file=new File([blob.slice(offset,offset+a.size)],a.name,{type:a.type});offset+=a.size;}}if(offset!==blob.size)throw Error('Tamaño de proyecto incorrecto.');const aset=new Set(data.assets.map(a=>a.id));if(data.project.clips.some(c=>c.assetId&&!aset.has(c.assetId)))throw Error('Faltan medios en el proyecto.');return data;}
