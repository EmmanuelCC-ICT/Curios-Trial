import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Small reusable native props: no image/model downloads or gameplay state.
export const JUNIPER={x:0,z:-5,width:4.28,depth:.82,top:.94,staffZ:-5.95};
const colours={ceramic:'#f6eee0',rice:'#f2e4c6',leaf:'#4d833c',carrot:'#e18a36',tomato:'#b94b36',protein:'#b97739',paper:'#c49b62',fold:'#997242'};
const materials=Object.fromEntries(Object.entries(colours).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:.9})]));
const bowlShape=new THREE.LatheGeometry([new THREE.Vector2(.0,.0),new THREE.Vector2(.10,.0),new THREE.Vector2(.16,.075),new THREE.Vector2(.18,.115),new THREE.Vector2(.167,.115),new THREE.Vector2(.146,.079),new THREE.Vector2(.094,.018),new THREE.Vector2(0,.018)],20);
const grainShape=new THREE.SphereGeometry(1,8,5);
function mesh(parent,geometry,material,x,y,z){const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);item.castShadow=item.receiveShadow=true;parent.add(item);return item;}
// Bake static parts by material once; every serving shares the resulting buffers.
function batchParts(group){
 const batches=new Map();
 for(const item of group.children){item.updateMatrix();const geometry=item.geometry.clone().applyMatrix4(item.matrix);if(!batches.has(item.material))batches.set(item.material,[]);batches.get(item.material).push(geometry);}
 group.clear();
 for(const [material,parts] of batches){mesh(group,mergeGeometries(parts),material,0,0,0);parts.forEach(g=>g.dispose());}
 return group;
}
let bowlPrototype,bagPrototype;
export function riceBowl(){
 if(bowlPrototype)return bowlPrototype.clone();
 const group=new THREE.Group();group.name='Juniper / freshly prepared rice bowl';
 mesh(group,bowlShape,materials.ceramic,0,0,0);
 const rice=mesh(group,grainShape,materials.rice,0,.087,0);rice.scale.set(.151,.043,.151);
 for(let i=0;i<13;i++){const angle=i*2.4,r=.025+(.105*(i%4)/3);const grain=mesh(group,grainShape,materials.rice,Math.cos(angle)*r,.121,Math.sin(angle)*r);grain.scale.set(.018,.008,.009);grain.rotation.y=angle;}
 for(let i=0;i<3;i++){
  const leaf=mesh(group,grainShape,materials.leaf,-.06+i*.026,.13,-.06);leaf.scale.set(.037,.014,.055);leaf.rotation.y=i*.7;
  const carrot=mesh(group,new THREE.CylinderGeometry(.022,.022,.012,10),materials.carrot,.065,.13,-.06+i*.045);carrot.rotation.z=.15;
  const tomato=mesh(group,grainShape,materials.tomato,-.075+i*.046,.132,.068);tomato.scale.set(.025,.017,.025);
  const protein=mesh(group,grainShape,materials.protein,-.026+i*.026,.135,.005);protein.scale.set(.022,.017,.052);protein.rotation.y=-.4;
 }
 bowlPrototype=batchParts(group);return bowlPrototype.clone();
}
export function takeawayBag(){
 if(bagPrototype)return bagPrototype.clone();
 const group=new THREE.Group();group.name='Juniper / folded takeaway bag';
 // Tapered kraft paper bag, folded mouth, two curved handles and a cream label.
 const body=new THREE.CylinderGeometry(.125,.145,.26,4,1);body.rotateY(Math.PI/4);body.scale(1,1,.7);
 mesh(group,body,materials.paper,0,.13,0);
 const fold=mesh(group,new THREE.BoxGeometry(.19,.025,.022),materials.fold,0,.268,0);fold.rotation.z=.04;
 for(const z of [-.036,.036])mesh(group,new THREE.TorusGeometry(.043,.006,4,12,Math.PI),materials.fold,0,.272,z);
 mesh(group,new THREE.BoxGeometry(.085,.075,.003),materials.ceramic,0,.145,.073);
 bagPrototype=batchParts(group);return bagPrototype.clone();
}
