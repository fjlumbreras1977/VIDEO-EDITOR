const EPS=1e-6;
const end=c=>c.start+c.duration;
const overlaps=(a,b)=>a.start<end(b)-EPS&&end(a)>b.start+EPS;
export const TRANSITION_TYPES=[['fade','Fundido cruzado'],['dip','Fundido a negro'],['slide','Deslizamiento'],['wipe','Barrido'],['zoom','Zoom']];
export const FILTER_TYPES=[['none','Original'],['cinema','Cine'],['warm','Cálido'],['mono','Blanco y negro'],['vintage','Vintage'],['cool','Frío'],['vivid','Vibrante'],['dream','Suave']];

/** The same delta is applied to the entire selection, preserving relative sync. */
export function allowedMoveDelta(project,originals,requested,targetTrack){
 const ids=new Set(originals.map(c=>c.id));
 const minimum=-Math.min(...originals.map(c=>c.start));
 const wanted=Math.max(minimum,requested),ranges=[];
 for(const c of originals){
  if(c.kind!=='video')continue;
  const track=originals.length===1&&targetTrack?targetTrack:c.track;
  for(const other of project.clips){
   if(other.kind==='video'&&other.track===track&&!ids.has(other.id))ranges.push([other.start-end(c),end(other)-c.start]);
  }
 }
 ranges.sort((a,b)=>a[0]-b[0]);
 const merged=[];
 for(const range of ranges){
  const last=merged.at(-1);
  // Touching open intervals leave a valid exact-fit position between them.
  if(last&&range[0]<last[1]-EPS)last[1]=Math.max(last[1],range[1]);
  else merged.push([...range]);
 }
 for(const [left,right] of merged){
  if(wanted>left+EPS&&wanted<right-EPS){
   if(left<minimum-EPS)return right;
   return wanted-left<=right-wanted?left:right;
  }
 }
 return wanted;
}
export function placeVideoClip(project,clip,at=clip.start){
 if(clip.kind!=='video')return Math.max(0,at);
 return clip.start+allowedMoveDelta(project,[clip],Math.max(0,at)-clip.start,clip.track);
}
export function timingBounds(project,clip){
 if(clip.kind!=='video')return {left:0,right:86400};
 const other=project.clips.filter(c=>c.kind==='video'&&c.track===clip.track&&c.id!==clip.id);
 return {left:Math.max(0,...other.filter(c=>end(c)<=clip.start+EPS).map(end)),right:Math.min(86400,...other.filter(c=>c.start>=end(clip)-EPS).map(c=>c.start))};
}
export function videoOverlaps(project){
 const result=[];
 for(const track of project.tracks){
  const clips=project.clips.filter(c=>c.kind==='video'&&c.track===track.id).sort((a,b)=>a.start-b.start);
  for(let i=1;i<clips.length;i++)for(let j=0;j<i;j++)if(overlaps(clips[i],clips[j]))result.push([clips[j],clips[i]]);
 }
 return result;
}
export function settleVideoClips(project){
 for(const track of project.tracks){
  let until=0;
  for(const c of project.clips.filter(c=>c.kind==='video'&&c.track===track.id).sort((a,b)=>a.start-b.start)){
   if(c.start<until-EPS)c.start=until;
   until=end(c);
  }
 }
}
/** Preserve timing when opening older projects: move conflicting videos to layers. */
export function separateLegacyVideos(project,newId){
 let moved=0;
 for(const track of [...project.tracks]){
  const clips=project.clips.filter(c=>c.kind==='video'&&c.track===track.id),lanes=[{track:track.id,clips:[]}];
  for(const clip of clips){
   let lane=lanes.find(l=>!l.clips.some(other=>overlaps(clip,other)));
   if(!lane){
    const id=newId();
    project.tracks.splice(project.tracks.findIndex(t=>t.id===track.id),0,{...track,id,name:track.name+' · Capa '+(lanes.length+1)});
    lane={track:id,clips:[]};lanes.push(lane);
   }
   if(clip.track!==lane.track){clip.track=lane.track;moved++;}
   lane.clips.push(clip);
  }
 }
 return moved;
}
export function videoJoins(project,trackId){
 const clips=project.clips.filter(c=>c.kind==='video'&&c.track===trackId).sort((a,b)=>a.start-b.start),joins=[];
 for(let i=1;i<clips.length;i++)if(Math.abs(end(clips[i-1])-clips[i].start)<EPS)joins.push({from:clips[i-1],to:clips[i],track:trackId,time:clips[i].start});
 return joins;
}
export function nearestVideoJoin(project,trackId,time){
 if(project.tracks.find(t=>t.id===trackId)?.locked)return null;
 return videoJoins(project,trackId).sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time))[0]||null;
}
export function transitionLimit(join){return Math.min(5,join.from.duration,join.to.duration);}
export function reconcileTransitions(project){
 const joins=project.tracks.flatMap(t=>videoJoins(project,t.id));
 const seen=new Set();
 project.transitions=(project.transitions||[]).filter(tr=>{
  const join=joins.find(j=>j.from.id===tr.from&&j.to.id===tr.to),pair=tr.from+'>'+tr.to;
  if(!join||seen.has(pair)||!TRANSITION_TYPES.some(([type])=>type===tr.type)||!Number.isFinite(tr.duration)||tr.duration<=0)return false;
  tr.duration=Math.min(tr.duration,transitionLimit(join));seen.add(pair);return true;
 });
 return project.transitions;
}
export function applyTransition(project,join,type,newId,duration=.6){
 if(!join||project.tracks.find(t=>t.id===join.track)?.locked||!TRANSITION_TYPES.some(([id])=>id===type))return null;
 const current=videoJoins(project,join.track).find(j=>j.from.id===join.from.id&&j.to.id===join.to.id);
 if(!current)return null;
 project.transitions||=[];
 let transition=project.transitions.find(tr=>tr.from===join.from.id&&tr.to===join.to.id);
 if(!transition){transition={id:newId(),from:join.from.id,to:join.to.id};project.transitions.push(transition);}
 Object.assign(transition,{type,duration:Math.max(.001,Math.min(duration,transitionLimit(current)))});
 return transition;
}
export function transitionJoins(project){
 const joins=project.tracks.flatMap(t=>videoJoins(project,t.id));
 return (project.transitions||[]).flatMap(tr=>{
  const join=joins.find(j=>j.from.id===tr.from&&j.to.id===tr.to);
  return join?[{...join,...tr,duration:Math.min(tr.duration,transitionLimit(join)),fromClip:join.from,toClip:join.to}]:[];
 });
}
export function activeTransitions(project,time){
 return transitionJoins(project).filter(tr=>!tr.fromClip.disabled&&!tr.toClip.disabled&&!project.tracks.find(track=>track.id===tr.track)?.hidden&&time>=tr.time-tr.duration/2&&time<tr.time+tr.duration/2).map(tr=>({...tr,progress:Math.max(0,Math.min(1,(time-tr.time)/tr.duration+.5))}));
}
export function validateTransitions(project,validId){
 if(project.transitions===undefined)return;
 if(!Array.isArray(project.transitions)||project.transitions.length>10000)throw Error('Transiciones no válidas.');
 const ids=new Set(),pairs=new Set();
 for(const tr of project.transitions){
  const a=project.clips.find(c=>c.id===tr.from),b=project.clips.find(c=>c.id===tr.to),pair=tr.from+'>'+tr.to;
  if(!validId(tr.id)||ids.has(tr.id)||pairs.has(pair)||!a||!b||a.kind!=='video'||b.kind!=='video'||a.track!==b.track||Math.abs(end(a)-b.start)>EPS||!TRANSITION_TYPES.some(([type])=>type===tr.type)||!Number.isFinite(tr.duration)||tr.duration<=0||tr.duration>Math.min(5,a.duration,b.duration)+EPS)throw Error('Una transición no tiene una unión de vídeo válida.');
  ids.add(tr.id);pairs.add(pair);
 }
}
