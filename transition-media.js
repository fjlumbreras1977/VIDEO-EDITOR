import {videoJoins,reconcileTransitions} from './timeline-editing.js?v=1.0.11';
import {croppedKeys} from './core.js?v=1.0.11';

export function matchingLinkedVideo(project,audio){
 if(audio.kind!=='audio')return null;
 return project.clips.find(video=>video.kind==='video'&&video.audioMuted&&video.assetId===audio.assetId&&(!audio.linkedVideoId||audio.linkedVideoId===video.id)&&['start','duration','offset','speed'].every(k=>Math.abs(video[k]-audio[k])<1e-6))||null;
}

/** Reserve real source frames instead of freezing unavailable edge frames. */
export function prepareMovingTransitions(project,assets){
 let trimmed=0;
 for(const transition of project.transitions||[]){
  const join=videoJoins(project,project.clips.find(c=>c.id===transition.from)?.track).find(j=>j.from.id===transition.from&&j.to.id===transition.to);
  if(!join)continue;
  const a=join.from,b=join.to,source=assets.get(a.assetId),next=assets.get(b.assetId);
  if(!source||!next||!Number.isFinite(source.duration)||!Number.isFinite(next.duration))continue;
  const tail=Math.max(0,(source.duration-a.offset)/a.speed-a.duration),head=b.offset/b.speed;
  // The visible clip remains long enough for its incoming/outgoing windows.
  const duration=Math.min(transition.duration,(a.duration+tail)/1.5,(b.duration+head)/1.5);
  transition.duration=duration;
  const out=Math.max(0,duration/2-tail),input=Math.max(0,duration/2-head);
  if(out+input<1e-7)continue;
  const links=project.clips.filter(c=>c.kind==='audio').map(audio=>({audio,video:matchingLinkedVideo(project,audio),before:{...audio}})).filter(pair=>pair.video?.track===join.track);
  const beforeA={...a},beforeB={...b};
  a.duration-=out;a.keyframes=croppedKeys(beforeA,0,a.duration);
  b.offset+=input*b.speed;b.duration-=input;b.start+=input;b.keyframes=croppedKeys(beforeB,input,beforeB.duration);
  // Close the reserved interval on this track; source speed stays unchanged.
  for(const clip of project.clips)if(clip.track===join.track&&clip.start>=join.time-1e-6)clip.start-=out+input;
  for(const {audio,video,before} of links){
   const from=(video.offset-before.offset)/before.speed;
   Object.assign(audio,{linkedVideoId:video.id,start:video.start,duration:video.duration,offset:video.offset});
   audio.keyframes=croppedKeys(before,from,from+video.duration);
  }
  trimmed+=out+input;
 }
 reconcileTransitions(project);
 return trimmed;
}

export function mediaSample(clip,time,asset,transition,incoming){
 const start=clip.start-(incoming?.duration||0)/2;
 const sourceTime=time<start?clip.offset-(incoming?.duration||0)/2*clip.speed:clip.offset+(time-clip.start)*clip.speed;
 const sourceEnd=Math.max(0,(asset?.duration||0)-.001);
 return {time:Math.max(0,Math.min(sourceEnd,sourceTime)),held:sourceTime< -1e-6||sourceTime>(asset?.duration||0)+1e-6};
}

/** Do not restart playback or issue a new seek on every animation frame. */
export function syncMediaElement(player,{on,playing,desired,speed,fps=30,onError=()=>{}}){
 const el=player.el;
 if(el.readyState>=1){
  if(el.playbackRate!==speed)el.playbackRate=speed;
  const drift=Math.abs(el.currentTime-desired),tolerance=playing&&on ? .25 : .5/fps;
  if(!el.seeking&&!player.pendingPlay&&drift>tolerance){
   try{el.currentTime=desired;}catch{}
  }
 }
 if(on&&playing){
  if(el.paused&&!player.pendingPlay&&!player.playBlocked){
   const pending=Promise.resolve().then(()=>el.play());player.pendingPlay=pending;
   pending.catch(error=>{if(player.pendingPlay===pending){player.playBlocked=true;onError(error);}}).finally(()=>{if(player.pendingPlay===pending)player.pendingPlay=null;});
  }
 }else{
  if(!el.paused)el.pause();
  // An unresolved play() must not resume a clip after seeking away from it.
  const pending=player.pendingPlay;player.pendingPlay=null;player.playBlocked=false;
  pending?.then(()=>{if(!player.pendingPlay&&!el.paused)el.pause();},()=>{});
 }
}
