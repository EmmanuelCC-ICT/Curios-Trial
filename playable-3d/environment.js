import {addExteriorLandmarks} from './environment/exterior-landmarks.js?v=ecc-ba60122';
import {addTeachingExteriors} from './environment/teaching-exteriors.js?v=ecc-ba60122';
import {shadowAnchor} from './shadow-anchor.js';
import {approvedPalette} from './environment/approved-campus-kit.js?v=ecc-ba60122';
import {partitionInstances} from './environment/static-batching.js?v=ecc-ba60122';
import {polishGround} from './environment/ground-polish.js?v=deferred-ground-20261012';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
export async function integrateEnvironment(world,{entryOnly=false}={}){
const plantInstances=[];const basePhase=world.baseEnvironmentPhase||world.phase;world.baseEnvironmentPhase=basePhase;let activePhase='flourishing';
const presets={
 disrepair:{sun:0xdce5ef,p:[-16,30,20],power:.65,sky:0xcbd8e5,ground:0x83918a,fill:1.45,exposure:1,map:2048,radius:4,size:.65,grass:0xb5bfaa,top:'#61758b',horizon:'#b9c5cc',cloud:'#748392',caption:'Disrepair · Muted overcast daylight, darker clouds and smaller plants (65%). Paths and entrances stay readable.'},
 growth:{sun:0xfff5e8,p:[-16,28,20],power:2,sky:0xdceeff,ground:0x8eaa8d,fill:1.7,exposure:1,map:2048,radius:3,size:.85,grass:0xd4e8c1,top:'#79b5d8',horizon:'#e6ece5',cloud:'#edf0ee',caption:'Growth · Fresh morning light and clearing skies. The same plants at 85% size; greens are recovering.'},
 flourishing:{sun:0xffdfb2,p:[-26,24,20],power:3.6,sky:0xe1f2ff,ground:0x98b697,fill:1.15,exposure:1,map:2048,radius:2,size:1,grass:0xc5e9ae,top:'#459bce',horizon:'#c9e9f3',cloud:'#ffffff',caption:'Flourishing · Warm directional spring sunshine, healthy greens, full-size plants and a delicate rainbow.'}
};
const skies={};
function stageSky(name){
 if(skies[name])return skies[name];
 const p=presets[name],c=document.createElement('canvas');c.width=2048;c.height=1024;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,850);g.addColorStop(0,p.top);g.addColorStop(.65,p.horizon);g.addColorStop(1,p.horizon);x.fillStyle=g;x.fillRect(0,0,2048,1024);
 // Deterministic cloud clusters: shaded undersides and soft, rounded white tops.
 const cloudCount=name==='disrepair'?17:name==='growth'?11:6;
 for(let i=0;i<cloudCount;i++){
  const cx=i*2048/cloudCount+70,cy=390+(i%3)*32;
  x.filter='blur(5px)';x.globalAlpha=name==='disrepair'?.8:.82;
  for(let j=0;j<5;j++){
   const px=cx+(j-2)*32,py=cy-Math.sin(j/4*Math.PI)*28,r=38+(j%3)*9;
   const cg=x.createLinearGradient(0,py-r,0,py+r);
   cg.addColorStop(0,name==='disrepair'?'#8996a4':'#ffffff');
   cg.addColorStop(1,name==='disrepair'?'#4d5e72':'#d1e1eb');
   x.fillStyle=cg;x.beginPath();x.ellipse(px,py,r,r*.68,0,0,Math.PI*2);x.fill();
  }
 }
 x.filter='none';if(name==='flourishing'){x.globalAlpha=.16;['#ef7474','#f4af65','#f5df85','#89c998','#83bcdf','#aaa0d5'].forEach((color,i)=>{x.strokeStyle=color;x.lineWidth=6;x.beginPath();x.arc(1100,625,190-i*6,Math.PI,Math.PI*2);x.stroke();});}
 x.globalAlpha=1;const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;skies[name]=t;return t;
}
function capturePlants(){
 // ECC hero beds are authored separately from the surrounding landscape.
 world.town.traverse(o=>{if(!o.isInstancedMesh||o.name!=='Oval edge eucalypts'&&!/^Courtyard (eucalyptus|native|lomandra)/.test(o.name)&&!/^Approved (tufted-grass|yellow-flower-clump|olive-shrub|mature-eucalypt-[ab]|small-multistem-a)$/.test(o.name))return;const matrices=[];for(let i=0;i<o.count;i++){const m=new T.Matrix4();o.getMatrixAt(i,m);matrices.push({i,m});}plantInstances.push({o,matrices});});

 // Landscape instances preserve original species, placement and soil-level pivot.
 const rocks=(world.campus.placements||[]).filter(p=>p.id==='boulder-a');
 world.campus.group?.traverse(o=>{if(!o.isInstancedMesh||o.userData.distanceDetail)return;const matrices=[];for(let i=0;i<o.count;i++){const m=new T.Matrix4();o.getMatrixAt(i,m);const pos=new T.Vector3().setFromMatrixPosition(m);if(rocks.some(r=>Math.abs(r.x-pos.x)<.01&&Math.abs(r.z-pos.z)<.01))continue;matrices.push({i,m});}if(matrices.length)plantInstances.push({o,matrices});});
}
function apply(name){activePhase=name;const p=presets[name];basePhase(name);world.town.background=stageSky(name);if(world.town.fog)world.town.fog.color.set(p.horizon);
 plantInstances.forEach(({o,matrices})=>{matrices.forEach(({i,m})=>{const n=m.clone();n.scale(new T.Vector3(p.size,p.size,p.size));o.setMatrixAt(i,n);});o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();});
 world.town.traverse(o=>{if(o.isMesh){for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(m.name==='ECC courtyard glass'){m.envMap=stageSky(name);m.needsUpdate=true;}if(m.map?.image?.src?.includes('grass-ecc-campus'))m.color.set(p.grass);}}});world.town.traverse(o=>{if(o.isDirectionalLight){o.shadow.normalBias=.045;o.shadow.bias=-.00012;o.color.set(p.sun);o.intensity=p.power;o.position.fromArray(p.p);o.shadow.radius=p.radius;if(o.shadow.mapSize.x!==p.map){o.shadow.mapSize.set(p.map,p.map);o.shadow.map?.dispose();o.shadow.map=null;o.shadow.needsUpdate=true;}}if(o.isAmbientLight)o.intensity=name==='flourishing'?.08:.35;if(o.isHemisphereLight){o.color.set(p.sky);o.groundColor.set(p.ground);o.intensity=p.fill;}});}

addExteriorLandmarks(world.town,approvedPalette(world.est),world.campusGrass);
addTeachingExteriors(world.town,approvedPalette(world.est),world.campusTextures);
if(!world.exteriorLandmarkCollider){world.exteriorLandmarkCollider=world.townPhysics.world.createCollider(RAPIER.ColliderDesc.cuboid(6,1.4,1.5).setTranslation(43,1.4,-26));}
let surroundings=null;if(!entryOnly){const {addSurroundings}=await import('./environment/surroundings.js?v=broad-integrated-20261014');surroundings=await addSurroundings(world.town,approvedPalette(world.est),world.campus?.treeSource);}
if(!world.town.getObjectByName('Soft campus perimeter'))polishGround(world.town);
if(world.campus.group)partitionInstances(world.campus.group,{filter:o=>!o.userData.distanceDetail});partitionInstances(world.est);if(surroundings)partitionInstances(surroundings,{filter:o=>o.name==='Oval edge eucalypts'});
if(!entryOnly)world.phase('flourishing');
capturePlants();world.phase=apply;
// Keep the accepted courtyard's sun unchanged in its original review area.
// Beyond it, translate the same light/target together so teaching buildings also receive shadows.
const directional=[];world.town.traverse(o=>{if(o.isDirectionalLight)directional.push(o);});
for(const sun of directional)if(!sun.target.parent)world.town.add(sun.target);
const priorUpdate=world.baseEnvironmentUpdate||world.update;world.baseEnvironmentUpdate=priorUpdate;world.update=(time,camera)=>{priorUpdate(time,camera);const pos=world.position(false);
 for(const sun of directional){const p=presets[activePhase].p,a=shadowAnchor(pos,p,sun.shadow.camera,sun.shadow.mapSize);sun.position.set(p[0]+a[0],p[1]+a[1],p[2]+a[2]);sun.target.position.fromArray(a);sun.target.updateMatrixWorld();}
};

const block=(x,y,z,w,h,d)=>world.townPhysics.world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z));
if(!world.teachingExteriorColliders){
// Closed reference building footprint where the approved Media exterior meets the playable edge.
world.townPhysics.world.createCollider(RAPIER.ColliderDesc.cuboid(10.95,3.6,3.25).setTranslation(-4,3.6,-37).setRotation({x:0,y:1,z:0,w:0}));
// Newly accessible exteriors remain solid; the playing surface stays open.
block(18.68,2.8,-53,5.95,5.6,21.25);
// SPACE has a real raised forecourt. Its top surface and shallow approach
// are colliders too, so the character rises onto the orange terrace rather
// than clipping through it or treating it as flat lawn.
block(14.39,.23,-53,3.32,.46,23.15);
block(12.92,.115,-58.1,1.15,.23,2.25);
block(12.92,.23,-58.1,.82,.46,1.72);
block(12.92,.345,-58.1,.52,.69,1.2);
block(12.92,.115,-48.75,1.15,.23,2.25);
block(12.92,.23,-48.75,.82,.46,1.72);
block(12.92,.345,-48.75,.52,.69,1.2);
block(18.4,3.5,-44.8,5.78,7,3.83);
block(23.78,2.4,-44.755,2.98,4.8,3.74);
world.teachingExteriorColliders=true;
}

if(entryOnly)return;

if(!world.surroundingsColliders){
 for(const [x,z,w,d]of surroundings.userData.extraBeds)block(x,.22,z,w,.44,d);
 for(const {x,z} of surroundings.userData.treePlacements)world.townPhysics.world.createCollider(RAPIER.ColliderDesc.cylinder(2,.28).setTranslation(x,2,z));
 world.surroundingsColliders=true;
}

}
