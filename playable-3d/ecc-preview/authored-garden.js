import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Authored asymmetrical native canopy kit: branching, hanging lanceolate leaves and strappy groundcover.
const cache=new Map();
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function makeKit(seed=729){
 if(cache.has(seed))return cache.get(seed);const r=rng(seed),branches=[],leaves=[];const up=new T.Vector3(0,1,0);
 function branch(a,b,r1,r2){const d=b.clone().sub(a),g=new T.CylinderGeometry(r2,r1,d.length(),7,1);g.applyMatrix4(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(up,d.normalize()),new T.Vector3(1,1,1)));branches.push(g);}
 const leaf=new T.BufferGeometry();leaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.18,.2,.03,-.24,.5,.09,-.15,.8,.04,0,1,-.09,.15,.8,.04,.24,.5,.09,.18,.2,.03,0,.48,.13],3));leaf.setAttribute('uv',new T.Float32BufferAttribute([.5,0,0,.2,0,.5,0,.8,.5,1,1,.8,1,.5,1,.2,.5,.48],2));const indices=[];for(let i=0;i<8;i++)indices.push(i,(i+1)%8,8);leaf.setIndex(indices);leaf.computeVertexNormals();
 function spray(at,dir,scale){for(let i=0;i<30;i++){const a=r()*Math.PI*2,dist=Math.sqrt(r())*scale;const p=at.clone().add(new T.Vector3(Math.cos(a)*dist,(r()-.7)*scale*.8,Math.sin(a)*dist));const l=.15+r()*.20,q=new T.Quaternion().setFromEuler(new T.Euler(1.6+r()*1.0,a,(r()-.5)*1.1));const g=leaf.clone().applyMatrix4(new T.Matrix4().compose(p,q,new T.Vector3(l,l,l)));const c=new T.Color().setHSL(.205+r()*.025,.20+r()*.13,.25+r()*.16);const colors=[];for(let k=0;k<g.attributes.position.count;k++)colors.push(c.r,c.g,c.b);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));leaves.push(g);}}
 const trunk=[new T.Vector3(0,0,0),new T.Vector3(.10,1.15,.04),new T.Vector3(-.10,2.25,.13),new T.Vector3(.15,3.25,.13),new T.Vector3(.48,4.2,.04),new T.Vector3(.55,5.1,.10)];
 for(let i=1;i<trunk.length;i++)branch(trunk[i-1],trunk[i],.18*(1-(i-1)/6),.18*(1-i/6));
 // Deliberate irregular branch tiers. Open gaps preserve the pale branching silhouette.
 for(let k=0;k<13;k++){const ang=k*2.399+.5*r(),h=1.9+k*.23,reach=1.2+r()*1.1,base=new T.Vector3(0,h,.10),mid=new T.Vector3(Math.cos(ang)*reach*.6,h+.45,Math.sin(ang)*reach*.6),end=new T.Vector3(Math.cos(ang)*reach,h+.9+r()*.5,Math.sin(ang)*reach);branch(base,mid,.065,.04);branch(mid,end,.04,.018);
  for(let j=0;j<7;j++){const q=.15+j*.12,a=ang+(j%2?1:-1)*(.7+r()*.4),at=mid.clone().lerp(end,q),tip=at.clone().add(new T.Vector3(Math.cos(a)*(.35+r()*.48),.17+r()*.24,Math.sin(a)*(.35+r()*.48)));branch(at,tip,.013,.002);spray(tip,a,.45);spray(tip.clone().add(new T.Vector3(0,-.20,0)),a,.35);}}
 const bark=mergeGeometries(branches),foliage=mergeGeometries(leaves.map(g=>g.toNonIndexed()));branches.forEach(g=>g.dispose());leaves.forEach(g=>g.dispose());
 const barkMat=new T.MeshStandardMaterial({color:0xb2ac96,roughness:.96});const leafMat=new T.MeshStandardMaterial({color:0x81945d,vertexColors:true,roughness:.88,side:T.DoubleSide});const shrubGeometry=new T.BufferGeometry();
 for(const [name,attr]of Object.entries(foliage.attributes)){const selected=[],stride=24*attr.itemSize;for(let start=0;start<attr.array.length;start+=stride*12)for(let j=0;j<stride&&start+j<attr.array.length;j++)selected.push(attr.array[start+j]);shrubGeometry.setAttribute(name,new T.Float32BufferAttribute(selected,attr.itemSize));}
 const kit={bark,foliage,shrubGeometry,barkMat,leafMat};cache.set(seed,kit);return kit;
}
function groundKit(){if(cache.has('ground'))return cache.get('ground');const r=rng(184),geos=[];
 for(let i=0;i<48;i++){const a=r()*Math.PI*2,len=.3+r()*.6,spread=.22+r()*.40,verts=[],uv=[];for(let j=0;j<7;j++){const t=j/6,rad=spread*t*t,h=len*Math.sin(t*Math.PI*.72),w=.016*(1-t)+.001;for(const s of [-1,1]){verts.push(Math.cos(a)*rad+Math.cos(a+1.57)*w*s,h,Math.sin(a)*rad+Math.sin(a+1.57)*w*s);uv.push(s<0?0:1,t);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const ix=[];for(let j=0;j<6;j++)ix.push(j*2,j*2+1,j*2+2,j*2+1,j*2+3,j*2+2);g.setIndex(ix);g.computeVertexNormals();geos.push(g);}
 const g=mergeGeometries(geos),mat=new T.MeshStandardMaterial({color:0x6b793c,roughness:.96,side:T.DoubleSide});cache.set('ground',{g,mat});return {g,mat};}
export function addAuthoredGarden(root,beds,{treeSites=[[-8.2,4.9,1.1,.4],[-6.6,-6.4,1.32,2.1],[7.6,11.1,1.05,1.4],[-10,-4,1.4,.6],[10.8,-3,1.5,2.3]],baseY=.36,density=9,detail='hero'}={}){
 const kit=makeKit(),d=new T.Object3D(),r=rng(329);
 for(const [geo,mat,name] of [[kit.bark,kit.barkMat,'bark'],[kit.foliage,kit.leafMat,'leaves']]){const o=new T.InstancedMesh(geo,mat,treeSites.length);o.name='Courtyard eucalyptus authored '+name;treeSites.forEach(([x,z,s,rot],i)=>{d.position.set(x,baseY,z);d.scale.setScalar(s);d.rotation.set(0,rot,0);d.updateMatrix();o.setMatrixAt(i,d.matrix);});o.castShadow=o.receiveShadow=true;root.add(o);}
 const plants=[];for(const [x,z,w,depth]of beds){for(let i=0;i<Math.round(w*depth*density);i++){const px=x+(r()-.5)*Math.max(.1,w-1.4),pz=z+(r()-.5)*Math.max(.1,depth-1.4);if(treeSites.some(t=>Math.hypot(px-t[0],pz-t[1])<.35))continue;plants.push([px,pz,(detail==='supporting'?.52:.35)+r()*.6,r()*6.28]);}}
 const {g,mat}=groundKit(),o=new T.InstancedMesh(detail==='supporting'?thinGeometry(g,36,2):g,mat,plants.length);o.name='Courtyard lomandra authored';plants.forEach(([x,z,s,a],i)=>{d.position.set(x,baseY,z);d.scale.setScalar(s);d.rotation.set(0,a,0);d.updateMatrix();o.setMatrixAt(i,d.matrix);});o.castShadow=o.receiveShadow=true;root.add(o);root.userData.plantInstances=plants.length+treeSites.length;
 // Restrained native-style yellow flower accents among the strappy plants.
 const flowerGeo=new T.SphereGeometry(.035,5,3);flowerGeo.scale(1.4,.55,1.4);const flowers=new T.InstancedMesh(flowerGeo,new T.MeshStandardMaterial({color:0xc6a83f,roughness:.9}),plants.length);flowers.name='Courtyard native yellow accents';plants.forEach(([x,z,s,a],i)=>{d.position.set(x+.08,baseY+s*.5,z-.09);d.scale.setScalar(i%3===0?1.2:.001);d.rotation.set(0,a,.2);d.updateMatrix();flowers.setMatrixAt(i,d.matrix);});flowers.castShadow=true;root.add(flowers);
 // Fine-leaf shrubs reuse the same botanical kit, with an independent low spreading scale.
 const shrubs=[];for(const [x,z,w,depth]of beds)for(let i=0;i<Math.max(1,Math.round(w*depth*.28));i++)shrubs.push([x+(r()-.5)*Math.max(.1,w-1.2),z+(r()-.5)*Math.max(.1,depth-1.2),Math.min((detail==='supporting'?.24:.18)+r()*.09,Math.max(.08,(Math.min(w,depth)-.4)/8))]);const shrub=new T.InstancedMesh(kit.shrubGeometry,kit.leafMat,shrubs.length);shrub.name='Courtyard native authored shrubs';shrubs.forEach(([x,z,s],i)=>{d.position.set(x,baseY-.3,z);d.scale.set(s*1.35,s*.8,s*1.35);d.rotation.set(0,r()*6.28,0);d.updateMatrix();shrub.setMatrixAt(i,d.matrix);});shrub.castShadow=shrub.receiveShadow=true;root.add(shrub);
 addDistanceDetail(root,[...root.children].filter(o=>o.isInstancedMesh&&!o.userData.distanceDetail),{hero:detail!=='supporting'});
}

// Same silhouette and palette at walking distance; thinner blade/leaf coverage beyond 30 m.
export function thinGeometry(source,verticesPerPart,stride){
 const key=source.uuid+':'+verticesPerPart+':'+stride;if(cache.has(key))return cache.get(key);
 const src=source.index?source.toNonIndexed():source,g=new T.BufferGeometry();
 for(const [name,a]of Object.entries(src.attributes)){const values=[];for(let i=0;i<a.count;i+=verticesPerPart*stride)for(let j=i;j<Math.min(a.count,i+verticesPerPart);j++)for(let k=0;k<a.itemSize;k++)values.push(a.array[j*a.itemSize+k]);g.setAttribute(name,new T.Float32BufferAttribute(values,a.itemSize));}
 g.computeBoundingSphere();cache.set(key,g);if(src!==source)src.dispose();return g;
}
function addDistanceDetail(root,objects,{hero=false}={}){
 for(const original of objects){
  const cells=new Map(),matrix=new T.Matrix4();for(let i=0;i<original.count;i++){original.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/12)+':'+Math.floor(matrix.elements[14]/12);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(matrix.clone());}
  const reduced=/leaves|shrubs/.test(original.name)?thinGeometry(original.geometry,24,3):/lomandra/.test(original.name)?thinGeometry(original.geometry,36,3):original.geometry;
  for(const matrices of cells.values()){const centre=new T.Vector3();matrices.forEach(m=>centre.add(new T.Vector3().setFromMatrixPosition(m)));centre.divideScalar(matrices.length);const lod=new T.LOD();lod.position.copy(centre);lod.name='Campus planting distance detail';lod.userData.heroDetail=hero;
   for(const [geo,distance]of [[original.geometry,0],[reduced,30]]){const o=new T.InstancedMesh(geo,original.material,matrices.length);o.name=original.name;o.userData.distanceDetail=true;o.castShadow=o.receiveShadow=true;matrices.forEach((m,i)=>{const n=m.clone();n.elements[12]-=centre.x;n.elements[13]-=centre.y;n.elements[14]-=centre.z;o.setMatrixAt(i,n);});o.computeBoundingSphere();lod.addLevel(o,distance,.12);}root.add(lod);
  }original.removeFromParent();original.dispose();
 }
}
