export const ANIMATABLE_DEFAULTS={x:0,y:0,scale:100,rotation:0,opacity:100,brightness:100,contrast:100,saturation:100,hue:0,warmth:0,blur:0,filterAmount:100,volume:100,pan:0,audioFxAmount:100,audioHighpass:400,audioLowpass:3400,presenceGain:4,compThreshold:-24,compRatio:4,compAttack:.003,compRelease:.25};
export const ANIMATABLE_PROPS=Object.keys(ANIMATABLE_DEFAULTS);
export const EASING_TYPES=[['linear','Lineal'],['ease-in','Acelerar'],['ease-out','Desacelerar'],['ease-in-out','Suave al entrar y salir']];
const number=(v,d=0)=>Number.isFinite(v)?v:d;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function easeProgress(q,type='linear'){
 q=clamp(q,0,1);
 return type==='ease-in'?q*q:type==='ease-out'?1-(1-q)**2:type==='ease-in-out'?q*q*(3-2*q):q;
}
export function filterStyle(c,pixelScale=1){
 const a=c.filterEnabled===false?0:clamp(number(c.filterAmount,100),0,100)/100;
 const style={none:'',cinema:`contrast(${1+.18*a}) saturate(${1-.28*a})`,warm:`sepia(${.35*a}) saturate(${1+.2*a})`,mono:`grayscale(${a})`,vintage:`sepia(${.65*a}) contrast(${1-.15*a})`,cool:`hue-rotate(${22*a}deg) saturate(${1-.2*a})`,vivid:`saturate(${1+.7*a}) contrast(${1+.1*a})`,dream:`brightness(${1+.12*a}) blur(${a*pixelScale}px)`};
 const base=`brightness(${number(c.brightness,100)}%) contrast(${number(c.contrast,100)}%) saturate(${number(c.saturation,100)}%) hue-rotate(${number(c.hue)}deg) sepia(${number(c.warmth)/100}) blur(${number(c.blur)*pixelScale}px)`;
 return base+(a&&c.filter!=='none'&&style[c.filter]?' '+style[c.filter]:'');
}
export function chromaPixels(data,color='#00ff00',tolerance=90,softness=35){
 const key=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),soft=Math.max(.001,softness);
 for(let i=0;i<data.length;i+=4){
  const distance=Math.hypot(data[i]-key[0],data[i+1]-key[1],data[i+2]-key[2]);
  data[i+3]*=clamp((distance-tolerance)/soft,0,1);
 }
 return data;
}
