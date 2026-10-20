const value=(v,d,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:d));
export function configureAudioEffect(p,c,sampleRate,time=0){
 const fx=c.audioFx||'none',mix=fx==='none'?0:value(c.audioFxAmount,100,0,100)/100;
 p.dry.gain.setTargetAtTime(1-mix,time,.008);p.wet.gain.setTargetAtTime(mix,time,.008);
 p.f1.type=fx==='telephone'?'highpass':'peaking';
 p.f1.frequency.value=fx==='telephone'?value(c.audioHighpass,400,80,1500):2200;
 p.f1.gain.value=fx==='presence'?value(c.presenceGain,4,0,12):0;p.f1.Q.value=.7;
 p.f2.type='lowpass';p.f2.frequency.value=fx==='telephone'?Math.min(sampleRate/2,value(c.audioLowpass,3400,1500,8000)):sampleRate/2;
 p.comp.threshold.value=fx==='compress'?value(c.compThreshold,-24,-60,0):0;
 p.comp.ratio.value=fx==='compress'?value(c.compRatio,4,1,20):1;
 p.comp.attack.value=value(c.compAttack,.003,0,1);p.comp.release.value=value(c.compRelease,.25,.005,1.5);p.comp.knee.value=12;
}
