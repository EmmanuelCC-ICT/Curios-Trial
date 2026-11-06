import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Courtyard-only kit. All roots stay inside the existing planter obstacles.
// Leaves are curved geometry, so silhouettes and shadows work from every walking view.
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function leafGeometry(){
 // Four nondegenerate triangles retain the central fold and tapered silhouette.
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.5,.5,.04,0,.5,.18,.5,.5,.04,0,1,0],3));
 g.setAttribute('uv',new T.Float32BufferAttribute([.5,0,0,.5,.5,.5,1,.5,.5,1],2));
 g.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);g.computeVertexNormals();return g;
}

function leafMap(){
 const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,64,0);g.addColorStop(0,'#536345');g.addColorStop(.46,'#a0a96a');g.addColorStop(.51,'#b4b679');g.addColorStop(1,'#6d7b4c');x.fillStyle=g;x.fillRect(0,0,64,128);x.strokeStyle='#bcc18b55';x.lineWidth=.8;for(let i=12;i<128;i+=13){x.beginPath();x.moveTo(32,i);x.lineTo(0,i+19);x.moveTo(32,i);x.lineTo(64,i+19);x.stroke();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
function barkMap(){
 const c=document.createElement('canvas');c.width=128;c.height=256;const x=c.getContext('2d'),r=rng(461);x.fillStyle='#a8a08a';x.fillRect(0,0,128,256);for(let i=0;i<170;i++){x.strokeStyle=['#d1c6ab','#81795f','#bdb094','#6f6d59'][i%4];x.lineWidth=.3+r()*4;const a=r()*128,b=r()*256;x.beginPath();x.moveTo(a,b);x.bezierCurveTo(a+4,b+25,a-7,b+50,a+3,b+80);x.stroke();}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
}
function mergedMesh(geometries,material,name){const g=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g),false);geometries.forEach(g=>g.dispose());const o=new T.Mesh(g,material);o.name=name;o.castShadow=o.receiveShadow=true;return o;}
function shootGeometry(seed,tree){
 const r=rng(seed),leaf=leafGeometry(),leaves=[],branches=[];const up=new T.Vector3(0,1,0);
 function twig(a,b,thickness){const v=b.clone().sub(a),g=new T.CylinderGeometry(thickness*.46,thickness,v.length(),6,1);g.applyMatrix4(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(up,v.normalize()),new T.Vector3(1,1,1)));branches.push(g);}
 function frond(at,scale){
  for(let j=0;j<(tree?19:13);j++){const angle=r()*Math.PI*2,dist=r()*scale;const pos=at.clone().add(new T.Vector3(Math.cos(angle)*dist,(r()-.5)*scale*.65,Math.sin(angle)*dist));const q=new T.Quaternion().setFromEuler(new T.Euler(.5+r()*2.4,angle,r()*.7));const len=(tree?.19:.13)+r()*(tree?.15:.09);leaves.push(leaf.clone().applyMatrix4(new T.Matrix4().compose(pos,q,new T.Vector3(len*.24,len,len*.42))));}
 }
 if(tree){
  let last=new T.Vector3();for(let i=1;i<=7;i++){const next=new T.Vector3(Math.sin(i*.55)*.18,i*.72,Math.sin(i*.8)*.13);twig(last,next,.17*(1-i/9));last=next;}
  for(let k=0;k<17;k++){const ang=k*2.399+r()*.25,h=2.1+k*.16,reach=1.25+r()*.75;const base=new T.Vector3(.1,h,0),tip=new T.Vector3(Math.cos(ang)*reach,h+.5+r()*.6,Math.sin(ang)*reach);twig(base,tip,.055*(1-k/24));
   for(let j=0;j<7;j++){const p=base.clone().lerp(tip,.35+j*.105),a=ang+(j%2?1:-1)*(.65+r()*.4),end=p.clone().add(new T.Vector3(Math.cos(a)*(.35+r()*.65),.25+r()*.45,Math.sin(a)*(.35+r()*.65)));twig(p,end,.012);for(let n=0;n<4;n++)frond(p.clone().lerp(end,.3+n*.24),.3);}
  }
 }else{
  for(let k=0;k<12;k++){const a=k*2.399,h=.25+r()*.4,tip=new T.Vector3(Math.cos(a)*(.15+r()*.3),h,Math.sin(a)*(.15+r()*.3));twig(new T.Vector3(),tip,.012);for(let j=0;j<4;j++)frond(tip.clone().multiplyScalar(.35+j*.22),.19);}
 }
 leaf.dispose();return {leaves,branches};
}
function grassGeometry(){
 const r=rng(814),geometries=[];
 for(let k=0;k<52;k++){const ang=r()*Math.PI*2,height=.32+r()*.48,lean=.18+r()*.28,start=r()*.12;const p=[],uv=[],ix=[];
  for(let j=0;j<6;j++){const t=j/5,rad=start+lean*t*t,w=(1-t)*.011+.001;for(const s of [-1,1]){p.push(Math.cos(ang)*rad+Math.sin(ang)*w*s,height*(t-.22*t*t),Math.sin(ang)*rad-Math.cos(ang)*w*s);uv.push((s+1)/2,t);}if(j<5){const i=j*2;ix.push(i,i+2,i+1,i+1,i+2,i+3);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();geometries.push(g);
 }return geometries;
}
let cachedKits;
export function addCourtyardPlanting(root,beds,{treeSites=[[-8,5,1,0],[7.2,10.9,.92,2.2]],baseY=.3}={}){
 if(!cachedKits){
 const map=leafMap(),bark=barkMap();const leaves=new T.MeshStandardMaterial({map,color:0xb6bfa0,roughness:.84,side:T.DoubleSide});const trunk=new T.MeshStandardMaterial({map:bark,bumpMap:bark,bumpScale:.045,color:0xc8bea5,roughness:.94});
 const grass=new T.MeshStandardMaterial({map,color:0x9d9c62,roughness:.95,side:T.DoubleSide});
 const tree=shootGeometry(99,true),shrub=shootGeometry(132,false);
 const kits={tree:[mergedMesh(tree.leaves,leaves,'Courtyard eucalyptus leaves'),mergedMesh(tree.branches,trunk,'Courtyard eucalyptus bark')],shrub:[mergedMesh(shrub.leaves,leaves,'Courtyard native shrubs'),mergedMesh(shrub.branches,trunk,'Courtyard shrub stems')],grass:[mergedMesh(grassGeometry(),grass,'Courtyard lomandra')]};
 cachedKits=kits;
 }
 const kits=cachedKits;
 const r=rng(192),positions={tree:treeSites,shrub:[],grass:[]};
 for(const [x,z,w,d]of beds){if(z<0)continue;
  for(let i=0;i<Math.round(w*d*1.8);i++)positions.shrub.push([x+(r()-.5)*(w-.75),z+(r()-.5)*(d-.75),.65+r()*.65,r()*6.28]);
  for(let i=0;i<Math.round(w*d*4);i++)positions.grass.push([x+(r()-.5)*(w-.5),z+(r()-.5)*(d-.5),.55+r()*.6,r()*6.28]);
 }
 for(const [kind,parts]of Object.entries(kits))for(const part of parts){const ps=positions[kind],inst=new T.InstancedMesh(part.geometry,part.material,ps.length);inst.name=part.name;const m=new T.Matrix4(),q=new T.Quaternion();ps.forEach(([x,z,s,a],i)=>{m.compose(new T.Vector3(x,baseY,z),q.setFromAxisAngle(new T.Vector3(0,1,0),a),new T.Vector3(s,s,s));inst.setMatrixAt(i,m);if(kind!=='tree')inst.setColorAt(i,new T.Color().setHSL(.20+r()*.055,.18+r()*.15,.55+r()*.22));});inst.castShadow=inst.receiveShadow=true;root.add(inst);}
 root.userData.courtyardPlants={trees:positions.tree.length,shrubs:positions.shrub.length,grasses:positions.grass.length};
}

export function addCourtyardArchitecture({box,mesh,m}){
 const plaster=new T.MeshStandardMaterial({color:0x8a7964,roughness:.95}),floor=new T.MeshStandardMaterial({color:0x5f5747,roughness:.91}),furniture=new T.MeshStandardMaterial({color:0xa08052,roughness:.8}),seat=new T.MeshStandardMaterial({color:0x394b48,roughness:.78}),paper=new T.MeshStandardMaterial({color:0xd3cbb4,roughness:1});
 // True shallow rooms behind the retained exterior apertures. Collision shells are unchanged.
 function room(x,z,w,d){
  box(w,.06,d,floor,x,.07,z);const wall=box(w,2.8,.08,plaster,x,1.46,z-d/2);
  const p=wall.geometry.attributes.position,col=[];for(let i=0;i<p.count;i++){const v=p.getY(i)>0?.56:.85;col.push(v,v,v);}wall.geometry.setAttribute('color',new T.Float32BufferAttribute(col,3));wall.material=plaster.clone();wall.material.vertexColors=true;box(w,.06,d,plaster,x,2.9,z);
  for(const dx of [-w/2,w/2])box(.06,2.8,d,plaster,x+dx,1.46,z);
  for(let k=0;k<3;k++){const bx=x+(k-1)*w*.26;box(.72,.035,.52,furniture,bx,.86,z+.1);for(const dx of [-.29,.29])for(const dz of [-.19,.19])box(.028,.8,.028,m.navy,bx+dx,.43,z+.1+dz);box(.34,.05,.36,seat,bx,.49,z-.48);box(.34,.38,.04,seat,bx,.68,z-.65);box(.28,.007,.2,paper,bx,.883,z+.2);box(.28,.22,.035,m.navy,bx,1,z-.03);}
  box(w*.63,.72,.06,paper,x,1.85,z-d/2+.07);for(let j=0;j<8;j++)box(.13,.20,.008,j%3?seat:furniture,x+(j-3.5)*w*.065,1.85+(j%2)*.1,z-d/2+.106);
  box(w*.75,.018,.06,m.warm,x,2.83,z);
 }
 room(0,-4.35,7.6,3.65);room(6.45,-.18,4.03,3.65);
 // Narrow masonry trim and metal drip edges give the parapets a readable shadow line.
 for(const [x,z,w,y] of [[0,-2.3,8.3,3.28],[6.45,1.88,4.6,3.36]]){box(w,.10,.26,m.stone,x,y,z);box(w,.025,.30,m.navy,x,y+.065,z);}
 // Slim vertical timber fins at the existing piers; no new obstacle in the forecourt.
 for(const [x,z]of [[-3.8,-2.18],[3.8,-2.18],[8.58,1.89]])for(let j=0;j<4;j++)box(.034,2.35,.23,m.wood,x+(j-1.5)*.073,1.68,z);
 // Slatted upper layer on existing sheltered links introduces filtered light and a stronger silhouette.
 for(const [x,z,w,d]of [[-2.9,-.32,2,3.5],[3.25,.1,1.6,4.25]])for(let k=-d/2+.05;k<d/2;k+=.22)box(w+.16,.085,.052,m.wood,x,3.16,z+k);
 // Recessed plinths and bronze handles articulate the original sign and entry details.
 box(2.17,.06,.58,m.navy,-3.2,.065,6.4);
 for(const [x,z]of [[0,-1.76],[6.45,2.26]])for(const dx of [-.16,.16])box(.025,.48,.07,m.wood,x+dx,1.2,z);
}
