import * as T from 'three';
import {mergePavingPolygons} from './paving-polygons.js?v=windows1';

export function pavingNetwork(root,material,y=.085){
 const pieces=[];
 function path(points,width,curved=true){
  const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,0,z)),false,'centripetal');
  if(curved){
   let prior;for(let i=0;i<=120;i++){const t=i/120,p=curve.getPoint(t),v=curve.getTangent(t),nx=-v.z*width/2,nz=v.x*width/2,next=[[p.x-nx,p.z-nz],[p.x+nx,p.z+nz]];if(prior){pieces.push([prior[0],next[0],prior[1]],[prior[1],next[0],next[1]]);}prior=next;}
  }else for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),nx=-dz/length*width/2,nz=dx/length*width/2;
   pieces.push([[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz],[a[0]+nx,a[1]+nz]]);
   // Round joins cover the bend without coplanar rectangles overlapping.
   if(i<points.length-1)for(let j=0;j<24;j++){const a=j*Math.PI/12,c=(j+1)*Math.PI/12;pieces.push([b,[b[0]+Math.cos(a)*width/2,b[1]+Math.sin(a)*width/2],[b[0]+Math.cos(c)*width/2,b[1]+Math.sin(c)*width/2]]);}
  }
 }
 function finish(){
  const positions=[],uv=[];const polygons=mergePavingPolygons(pieces);
  for(const p of polygons)for(let i=1;i<p.length-1;i++)for(const a of [p[0],p[i+1],p[i]]){positions.push(a[0],y,a[1]);uv.push(a[0]/3,a[1]/3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.name='Joined campus paving — single surface';mesh.userData.walkable=true;mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 return {path,finish};
}
