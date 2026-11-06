import * as THREE from 'three';
import {JUNIPER} from './market-food.js?v=stall-refine-20260924';
import {approvedPalette,dressedBox,planter,batchStatic} from './environment/approved-campus-kit.js?v=ecc-ba60122';
import {addCourtyardPlanting} from './ecc-preview/courtyard-detail.js';

export function marketSurroundings(scene,obstacles,campusPalette,campusGrass){
 const p=campusPalette||approvedPalette(new THREE.Group()),architecture=new THREE.Group();architecture.name='Sunday market / campus architecture';
 const box=(x,y,z,w,h,d,m=p.stone)=>dressedBox(architecture,x,y,z,w,h,d,m);
 const canvas=new THREE.MeshStandardMaterial({color:'#eee5cf',roughness:1,side:THREE.DoubleSide});
 const green=new THREE.MeshStandardMaterial({color:'#315b50',roughness:.94});
 function plaque(text,x,y,z,w=3,h=.5){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#294640';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#c6b68f';ctx.lineWidth=8;ctx.strokeRect(9,9,1006,238);ctx.fillStyle='#fff4d8';ctx.font='bold 66px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,132,950);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.85}));m.position.set(x,y,z);architecture.add(m);
 }
 // Broad, continuous campus paving retains the original trial/navigation space.
 box(0,-.08,2,25,.14,34,p.paving);
 // Flush lawn pockets preserve paved queues and the cross-market walking route.
 const lawnMaterial=campusGrass||new THREE.MeshStandardMaterial({color:'#83a363',roughness:1});
 for(const [x,z,w,d]of [[-7,4,6,3.5],[9,8.7,4.6,4],[0,-10.1,17,4],[-7,-5,5,4]]){
  const geo=new THREE.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,pos=geo.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/3,(pos.getZ(i)+z)/3);
  const lawn=new THREE.Mesh(geo,lawnMaterial);lawn.name='Market lawn';lawn.position.set(x,.002,z);lawn.receiveShadow=true;architecture.add(lawn);
 }

 // A limestone garden boundary makes this a courtyard attached to the campus.
 box(0,.45,-13.4,25,.9,.35);box(-12.2,.45,-5.5,.35,.9,16);box(-12.2,.45,8.5,.35,.9,6);box(12.2,.45,-1,.35,.9,25);
 for(const x of [-12.2,12.2])for(const z of [-12.5,-5,3,11])box(x,.65,z,.55,1.3,.55);
 function stall(x,z,name,serving=false){
  const depth=serving?JUNIPER.depth:1.72,top=serving?JUNIPER.top:1.07;
  box(x,(top-.14)/2,z,4,top-.14,depth-.16,p.stone);box(x,top-.07,z,4.28,.14,depth,p.timber);
  for(let k=-1.8;k<=1.8;k+=.18)box(x+k,(top-.14)/2,z+(depth-.16)/2+.015,.07,top-.28,.035,p.timber);
  for(const dx of [-1.92,1.92])for(const dz of [-.74,.74]){box(x+dx,1.46,z+dz,.095,2.92,.095,p.blue);if(serving)obstacles.push({x:x+dx,z:z+dz,w:.095,d:.095});}
  for(const dx of [-1,1]){const roof=box(x+dx*1.14,2.96,z,2.38,.07,2.8,canvas);roof.rotation.z=-dx*.12;}
  box(x,2.74,z+1.4,4.6,.28,.055,green);plaque(name,x,2.73,z+1.44,3.6,.37);
  // Back worktop behind staff, leaving their body positions unobstructed.
  box(x,.84,z-1.62,3.8,.1,.48,p.timber);box(x,.4,z-1.65,3.7,.8,.4,p.blue);
  for(const dx of [-1.2,1.2])box(x+dx,.93,z-1.62,.48,.08,.32,p.plaster);
  obstacles.push({x,z:z-1.65,w:3.8,d:.5});
 }
 stall(0,-5,'JUNIPER KITCHEN',true);stall(-8,0,'LITTLE FINDS');
 plaque('RICE BOWLS  ·  ORDER HERE',-.65,.51,JUNIPER.z+JUNIPER.depth/2+.02,2.35,.3);
 // Small food props: bowls, produce crates, utensils and a card terminal.
 box(1.45,JUNIPER.top+.075,-4.9,.23,.15,.2,p.blue);
 for(const x of [-8.9,-8.2,-7.5]){box(x,1.2,.05,.27,.27,.27,p.roof);const plant=new THREE.Mesh(new THREE.SphereGeometry(.23,8,6),green);plant.scale.y=1.4;plant.position.set(x,1.51,.05);architecture.add(plant);}
 // Timber concert deck and campus-blue framing, still to Juniper's right.
 box(8,.24,-5,5,.48,3.5,p.timber);
 for(let z=-6.65;z<-3.3;z+=.23)box(8,.493,z,4.95,.015,.012,p.blue);
 for(const x of [5.2,10.8])for(const z of [-6.5,-3.5])box(x,1.7,z,.12,3.4,.12,p.blue);
 box(8,3.43,-5,6.1,.13,3.9,p.timber);box(8,3.26,-3.03,6.1,.24,.1,p.blue);
 plaque('THE LATE SHIFT  /  LIVE MUSIC',8,3.25,-2.965,4.7,.33);
 // Visible, grounded entrance sign and garden beds use the established planting kit.
 for(const x of [-4.3,4.3])box(x,1.8,10.8,.16,3.6,.16,p.blue);
 box(0,3.5,10.8,8.9,.16,.22,p.timber);plaque('LIVE MUSIC & SUNDAY MARKETS',0,3.48,10.94,7.6,.5);
 const beds=[[-10,9,2.2,3],[-10,-10,2.2,3],[10,-10,2.2,3]];
 for(const [x,z,w,d]of beds){planter(architecture,x,z,w,d,p);obstacles.push({x,z,w:w+.1,d:d+.1});}
 const planted=new THREE.Group();planted.name='Campus native market gardens';
 // The shared planting builder uses positive local bed coordinates.
 planted.position.z=-13;
 addCourtyardPlanting(planted,beds.map(([x,z,w,d])=>[x,z+13,w,d]),{treeSites:[[-10,22,.8,0],[-10,3,.95,1],[10,3,.9,2]],baseY:.43});
 scene.add(batchStatic(architecture),planted);
 return p;
}
