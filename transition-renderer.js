/** Composite a real two-clip transition; clip positions and durations stay intact. */
export function createTransitionRenderer(makeCanvas){
 const buffers=[makeCanvas(),makeCanvas(),makeCanvas()];
 return function renderTransition(target,tr,time,drawClip){
  const w=target.canvas.width,h=target.canvas.height,q=tr.progress;
  for(const canvas of buffers){if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}canvas.getContext('2d').clearRect(0,0,w,h);}
  const [outgoing,incoming,mixed]=buffers,context=mixed.getContext('2d');
  outgoing.getContext('2d').drawImage(target.canvas,0,0);incoming.getContext('2d').drawImage(target.canvas,0,0);
  drawClip(tr.fromClip,time,outgoing.getContext('2d'),true);
  drawClip(tr.toClip,time,incoming.getContext('2d'),true);
  context.save();context.globalAlpha=1;context.globalCompositeOperation='source-over';
  if(tr.type==='dip'){
   context.fillStyle='#000000';context.fillRect(0,0,w,h);
   context.globalAlpha=Math.max(0,1-2*q);context.drawImage(outgoing,0,0);
   context.globalAlpha=Math.max(0,2*q-1);context.drawImage(incoming,0,0);
  }else if(tr.type==='slide'){
   context.drawImage(outgoing,-q*w,0);context.drawImage(incoming,(1-q)*w,0);
  }else if(tr.type==='wipe'){
   context.drawImage(outgoing,0,0);context.beginPath();context.rect(0,0,w*q,h);context.clip();context.drawImage(incoming,0,0);
  }else{
   // Add premultiplied images instead of stacking two half-transparent layers.
   context.globalAlpha=1-q;context.drawImage(outgoing,0,0);
   context.globalCompositeOperation='lighter';context.globalAlpha=q;
   if(tr.type==='zoom'){const scale=1.15-.15*q;context.translate(w/2,h/2);context.scale(scale,scale);context.translate(-w/2,-h/2);}
   context.drawImage(incoming,0,0);
  }
  context.restore();
  target.save();target.globalAlpha=1;target.globalCompositeOperation='source-over';target.filter='none';target.drawImage(mixed,0,0);target.restore();
 };
}
