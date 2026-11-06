export const CAMPUS_START=Object.freeze({x:-7,z:23.3});
export const MARKET_APPROACH=Object.freeze({x:43,z:-17.8,yaw:0});
export const nearCampusStart=p=>Boolean(p&&Math.hypot(p.x-CAMPUS_START.x,p.z-CAMPUS_START.z)<3);

// Search verified low outdoor ground; camera altitude never becomes player height.
export function findSafeLanding(request,probe,{bounds={minX:-38,maxX:50,minZ:-76,maxZ:36},excluded=()=>false,fallback=CAMPUS_START}={}){
 if(!Number.isFinite(request?.x)||!Number.isFinite(request?.z))return null;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const origin={x:clamp(request.x,bounds.minX+.4,bounds.maxX-.4),z:clamp(request.z,bounds.minZ+.4,bounds.maxZ-.4)};
 function test(x,z){
  if(x<bounds.minX+.3||x>bounds.maxX-.3||z<bounds.minZ+.3||z>bounds.maxZ-.3||excluded(x,z))return null;
  const y=probe(x,z);return Number.isFinite(y)&&y>=-.02&&y<=.52?{x,y:y+.035,z}:null;
 }
 const direct=test(origin.x,origin.z);if(direct)return direct;
 for(let radius=.65;radius<=12;radius+=.65)for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,point=test(origin.x+Math.sin(angle)*radius,origin.z+Math.cos(angle)*radius);if(point)return point;
 }
 return fallback?test(fallback.x,fallback.z):null;
}
