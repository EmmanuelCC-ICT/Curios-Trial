// Make a non-overlapping planar surface from convex ribbon pieces. Shared-edge
// fragments are discarded; holes and the exact outer path boundary are retained.
const EPS=1e-8;
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export const polygonArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function clean(p){const out=[];for(const a of p)if(!out.length||Math.hypot(a[0]-out.at(-1)[0],a[1]-out.at(-1)[1])>EPS)out.push(a);if(out.length>1&&Math.hypot(out[0][0]-out.at(-1)[0],out[0][1]-out.at(-1)[1])<EPS)out.pop();return out.length>=3&&Math.abs(polygonArea(out))>EPS?out:[];}
function split(p,a,b){
 const inside=[],outside=[];
 for(let i=0;i<p.length;i++){
  const u=p[i],v=p[(i+1)%p.length],du=cross(a,b,u),dv=cross(a,b,v);
  if(du>=-EPS)inside.push(u);if(du<=EPS)outside.push(u);
  if((du>EPS&&dv<-EPS)||(du<-EPS&&dv>EPS)){const t=du/(du-dv),q=[u[0]+t*(v[0]-u[0]),u[1]+t*(v[1]-u[1])];inside.push(q);outside.push(q);}
 }
 return [clean(inside),clean(outside)];
}
const bounds=p=>[Math.min(...p.map(a=>a[0])),Math.min(...p.map(a=>a[1])),Math.max(...p.map(a=>a[0])),Math.max(...p.map(a=>a[1]))];
const overlaps=(a,b)=>a[0]<b[2]-EPS&&a[2]>b[0]+EPS&&a[1]<b[3]-EPS&&a[3]>b[1]+EPS;
export function mergePavingPolygons(input){
 const previous=[],result=[];
 for(const points of input){
  let p=clean(points);if(!p.length)continue;if(polygonArea(p)<0)p=p.slice().reverse();const box=bounds(p);let fragments=[p];
  for(const clip of previous){
   if(!overlaps(box,clip.box))continue;
   fragments=fragments.flatMap(subject=>{
    if(!overlaps(bounds(subject),clip.box))return [subject];
    let remaining=subject;const outside=[];
    for(let i=0;i<clip.p.length&&remaining.length;i++){const [a,b]=split(remaining,clip.p[i],clip.p[(i+1)%clip.p.length]);if(b.length)outside.push(b);remaining=a;}
    return outside;
   });
   if(!fragments.length)break;
  }
  result.push(...fragments);previous.push({p,box});
 }
 return result;
}
