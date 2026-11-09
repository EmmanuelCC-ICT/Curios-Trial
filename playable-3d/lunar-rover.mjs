import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import RAPIER from '@dimforge/rapier3d-compat';

// Campus driving stays within the supported ground, with the complete rover
// footprint protected by both bounds and the existing town collision world.
export const ROVER_COURSE=Object.freeze({minX:-36,maxX:70,minZ:-134,maxZ:34,radius:2.65,groundY:.04});
export const LUNAR_ROVER_HOME=Object.freeze({x:12,z:3});
export const ROVER_DOCK=Object.freeze({...LUNAR_ROVER_HOME,heading:Math.atan2(26,-57.5),boardX:9,boardZ:3});
export const ROVER_SPEC=Object.freeze({maxSpeed:5.2,reverseSpeed:2.3,wheelRadius:.56,wheelbase:2.50,steeringAngle:.68,stopDistance:4.2,seatHeight:1.23});
// The entrance Garden pond was removed with its collider. Keep the fountain protected.
export const ROVER_WATER_AREAS=Object.freeze([Object.freeze({x:0,z:4,radius:1.85})]);
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const angle=v=>Math.atan2(Math.sin(v),Math.cos(v));
const approach=(v,target,step)=>v<target?Math.min(target,v+step):Math.max(target,v-step);
const inside=(x,z)=>x>=ROVER_COURSE.minX+ROVER_COURSE.radius&&x<=ROVER_COURSE.maxX-ROVER_COURSE.radius&&z>=ROVER_COURSE.minZ+ROVER_COURSE.radius&&z<=ROVER_COURSE.maxZ-ROVER_COURSE.radius;
const dry=(x,z,margin=0)=>ROVER_WATER_AREAS.every(area=>Math.hypot(x-area.x,z-area.z)>area.radius+margin+.05);
function drySegment(a,b){const dx=b.x-a.x,dz=b.z-a.z,lengthSquared=dx*dx+dz*dz;return ROVER_WATER_AREAS.every(area=>{const t=lengthSquared?clamp(((area.x-a.x)*dx+(area.z-a.z)*dz)/lengthSquared,0,1):0;return Math.hypot(a.x+dx*t-area.x,a.z+dz*t-area.z)>area.radius+ROVER_COURSE.radius+.05;});}

function materials(){
 const standard=(color,roughness=.5,metalness=.35,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
 return {white:standard(0xe5e8e2,.32,.45),graphite:standard(0x172934,.65,.35),silver:standard(0x879fa8,.3,.75),gold:standard(0xb89c64,.38,.65),rubber:standard(0x20282c,.96,.05),seat:standard(0x354953,.85,.08),blue:standard(0x123a58,.3,.55),paving:standard(0x9d9e94,.96,.02),cyan:standard(0x58ebe3,.3,.2,{emissive:0x1dbebc,emissiveIntensity:.55}),light:standard(0xffe5bb,.3,.1,{emissive:0xffd48c,emissiveIntensity:.7}),red:standard(0xf5806c,.45,.15,{emissive:0xb83318,emissiveIntensity:.25})};
}
function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(p,w,h,d,m,x,y,z)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const cylinder=(p,r,h,m,x,y,z,n=24)=>mesh(p,new THREE.CylinderGeometry(r,r,h,n),m,x,y,z);
function rod(p,a,b,r,m){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=cylinder(p,r,delta.length(),m,...start.add(end).multiplyScalar(.5).toArray(),10);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function rounded(p,w,h,d,r,m,x,y,z){const s=new THREE.Shape(),l=-w/2,b=-h/2;s.moveTo(l+r,b);s.lineTo(l+w-r,b);s.quadraticCurveTo(l+w,b,l+w,b+r);s.lineTo(l+w,b+h-r);s.quadraticCurveTo(l+w,b+h,l+w-r,b+h);s.lineTo(l+r,b+h);s.quadraticCurveTo(l,b+h,l,b+h-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:5});g.translate(0,0,-d/2);return mesh(p,g,m,x,y,z);}
function label(p,title,subtitle,w,h,x,y,z){
 if(typeof document==='undefined'||!document.createElement)return;
 const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const g=c.getContext('2d');if(!g)return;
 g.fillStyle='#132b38';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#bca36d';g.lineWidth=7;g.strokeRect(10,10,c.width-20,c.height-20);g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f4f2e7';g.font=`700 ${Math.min(c.height*.3,1024/(title.length*.65))}px Arial`;g.fillText(title,512,c.height*.37,940);g.fillStyle='#86e7dd';g.font=`500 ${Math.min(c.height*.17,1024/(subtitle.length*.58))}px Arial`;g.fillText(subtitle,512,c.height*.73,940);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),x,y,z);
}
// Batch static construction by material. Six wheels, steering and scanner remain
// independent animated assemblies; small bolts do not cost individual draw calls.
function batch(group){
 group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),buckets=new Map(),originals=[];
 group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const transform=inverse.clone().multiply(o.matrixWorld);const geometry=o.geometry.clone().applyMatrix4(transform);const flat=geometry.index?geometry.toNonIndexed():geometry;if(flat!==geometry)geometry.dispose();const key=o.material;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(flat);originals.push(o);});
 for(const o of originals){o.removeFromParent();o.geometry.dispose();}
 for(const [material,geometries]of buckets){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());mesh(group,merged,material);}
}
function buildCourse(scene,m){
 const p=new THREE.Group();p.name='Entrance rover charging dock';scene.add(p);
 // A small flush boarding pad beside arrival, not a new road or a Lab test range.
 box(p,3.6,.018,4.6,m.graphite,ROVER_DOCK.x,.018,ROVER_DOCK.z);
 for(const x of [ROVER_DOCK.x-1.75,ROVER_DOCK.x+1.75])box(p,.055,.012,4.5,m.cyan,x,.034,ROVER_DOCK.z);
 for(const z of [ROVER_DOCK.z-2.24,ROVER_DOCK.z+2.24])box(p,3.5,.012,.055,m.gold,ROVER_DOCK.x,.034,z);
 // Stand the boarding sign beside the dock, above the entrance paving.
 const signX=ROVER_DOCK.x+1.95,signZ=ROVER_DOCK.z+1.6;
 const dock=label(p,'LUNAR ROVER','PRESS E OR TAP DRIVE TO BOARD',2.1,.62,signX,1.06,signZ);
 if(dock)dock.rotation.y=-Math.PI/2;
 for(const offset of [-.76,.76])box(p,.09,.85,.09,m.graphite,signX+.035,.425,signZ+offset);
 batch(p);return p;
}
function buildVehicle(scene,m){
 const root=new THREE.Group();root.name='Rideable Lunar Explorer 06';scene.add(root);
 root.userData.design='Six-wheel rocker-bogie explorer with open cockpit, steering, navigation mast and sample payload';
 root.userData.seatCushionLocal={x:0,y:ROVER_SPEC.seatHeight,z:-.38};
 const body=new THREE.Group();body.name='Open cockpit and science chassis';root.add(body);
 rounded(body,2.1,.48,3.25,.16,m.white,0,.93,0);
 rounded(body,1.72,.25,3.5,.08,m.graphite,0,.65,0);
 box(body,1.88,.045,1.75,m.graphite,0,1.195,-.2);
 for(const side of [-1,1]){
  rounded(body,.19,.28,2.38,.07,m.gold,side*1.02,.96,-.1);
  box(body,.08,.04,2.2,m.cyan,side*1.13,1.04,-.12);
  // Angular guard rails keep the cabin open and give a readable silhouette.
  rod(body,[side*.92,1.2,-1.35],[side*.92,1.92,-1.35],.045,m.silver);
  rod(body,[side*.92,1.92,-1.35],[side*.92,2.3,-.9],.045,m.silver);
  rod(body,[side*.92,2.3,-.9],[side*.92,2.3,.15],.045,m.silver);
  rod(body,[side*.92,2.3,.15],[side*.92,1.23,.85],.045,m.silver);
  rod(body,[side*.92,1.35,-1.2],[side*.92,1.35,.1],.037,m.gold);
  box(body,.35,.09,.64,m.graphite,side*1.15,.63,-.25);
  box(body,.36,.025,.08,m.cyan,side*1.15,.69,.02);
  for(const z of [-1.28,0,1.28]){
   rod(body,[side*.53,.9,z],[side*1.21,.61,z-.12],.067,m.silver);
   rod(body,[side*.7,.95,z+.27],[side*1.13,.62,z],.05,m.gold);
   const shock=cylinder(body,.095,.42,m.graphite,side*.94,.79,z+.12,12);shock.rotation.z=side*.7;
  }
  rod(body,[side*1.13,.64,-1.28],[side*1.13,.82,0],.075,m.graphite);
  rod(body,[side*1.13,.82,0],[side*1.13,.64,1.28],.075,m.graphite);
 }
 rod(body,[-.92,2.3,-.9],[.92,2.3,-.9],.045,m.silver);
 rounded(body,.83,.15,.8,.075,m.seat,0,1.155,-.38);
 const back=rounded(body,.84,.65,.16,.09,m.seat,0,1.45,-.81);back.rotation.x=-.09;
 rounded(body,.51,.25,.17,.08,m.graphite,0,1.84,-.86);
 for(const x of [-.3,.3])box(body,.035,.7,.025,m.gold,x,1.59,-.71);
 for(const x of [-.55,.55])rounded(body,.14,.1,.65,.04,m.graphite,x,1.49,-.29);
 // Wedge console, illuminated display and paired physical controls.
 const console=rounded(body,1.42,.35,.4,.09,m.graphite,0,1.47,.68);console.rotation.x=.22;
 const screen=box(body,.74,.015,.27,m.blue,0,1.66,.64);screen.rotation.x=.22;
 for(let i=0;i<4;i++)box(body,.10,.018,.035,m.cyan,-.27+i*.18,1.676,.63);
 for(const x of [-.55,.55]){cylinder(body,.045,.035,m.gold,x,1.67,.65,12);box(body,.05,.025,.055,m.red,x,1.66,.79);}
 const steering=new THREE.Group();steering.name='Rover steering yoke';steering.position.set(0,1.62,.3);steering.rotation.x=.45;root.add(steering);
 rod(steering,[0,-.25,0],[0,0,0],.035,m.silver);rod(steering,[-.28,0,0],[.28,0,0],.04,m.graphite);for(const x of [-.28,.28])rod(steering,[x,-.11,0],[x,.11,0],.045,m.graphite);batch(steering);
 // A nose with daylight-running strips, twin lamps and protection frame.
 rounded(body,1.85,.26,.48,.1,m.white,0,1.08,1.66);
 for(const x of [-.66,.66]){rounded(body,.42,.14,.055,.045,m.graphite,x,1.16,1.935);box(body,.32,.065,.025,m.light,x,1.16,1.973);}
 rod(body,[-.97,.7,1.95],[.97,.7,1.95],.07,m.silver);for(const x of [-.93,.93])rod(body,[x,.7,1.95],[x,1.09,1.75],.055,m.silver);
 for(const x of [-.74,.74])box(body,.23,.08,.045,m.red,x,.98,-1.69);
 // Rear payload: foil-wrapped sample box, thermal ribs and solar cells.
 rounded(body,1.36,.43,.64,.07,m.gold,0,1.44,-1.28);
 for(let x=-.55;x<=.55;x+=.22)box(body,.035,.36,.66,m.silver,x,1.44,-1.28);
 const solar=box(body,1.47,.035,.72,m.blue,0,1.69,-1.29);solar.rotation.x=-.1;
 for(let x=-.61;x<=.7;x+=.24)box(body,.012,.012,.68,m.silver,x,1.719,-1.29);
 for(const z of [-1.52,-1.29,-1.06])box(body,1.4,.012,.01,m.silver,0,1.72,z);
 rod(body,[.76,1.28,-1.27],[.76,2.81,-1.27],.045,m.silver);
 const scanner=new THREE.Group();scanner.name='Stereo navigation mast';scanner.position.set(.76,2.82,-1.27);root.add(scanner);
 rounded(scanner,.67,.31,.3,.08,m.white,0,0,0);
 for(const x of [-.18,.18]){const optic=cylinder(scanner,.085,.07,m.graphite,x,0,.18,16);optic.rotation.x=Math.PI/2;const lens=cylinder(scanner,.045,.075,m.cyan,x,0,.19,16);lens.rotation.x=Math.PI/2;}
 cylinder(scanner,.12,.11,m.gold,0,.22,0,16);batch(scanner);
 rod(body,[-.78,1.3,-1.3],[-.78,2.9,-1.3],.015,m.graphite);cylinder(body,.035,.11,m.cyan,-.78,2.96,-1.3,10);
 label(body,'EXPLORER 06','CURIOS LUNAR LAB',1.34,.35,0,.99,1.966);
 batch(body);
 const seat=new THREE.Object3D();seat.name='Driver root anchor';seat.position.set(0,.42,-.38);body.add(seat);
 const wheels=[];
 for(const side of [-1,1])for(const z of [-1.28,0,1.28]){
  const pivot=new THREE.Group();pivot.name=`${side<0?'Left':'Right'} ${z<0?'rear':z>0?'front':'middle'} suspension`;pivot.position.set(side*1.22,.59,z);root.add(pivot);
  const spin=new THREE.Group();spin.name='Rotating mesh tyre';pivot.add(spin);
  const tyre=cylinder(spin,.56,.36,m.rubber,0,0,0,28);tyre.rotation.z=Math.PI/2;
  const rim=cylinder(spin,.36,.39,m.silver,0,0,0,24);rim.rotation.z=Math.PI/2;
  const hub=cylinder(spin,.17,.41,m.gold,0,0,0,16);hub.rotation.z=Math.PI/2;
  const ring=mesh(spin,new THREE.TorusGeometry(.41,.022,6,28),m.cyan,side*.202,0,0);ring.rotation.y=Math.PI/2;
  for(let i=0;i<18;i++){
   const a=i/18*TAU;
   const tread=box(spin,.40,.045,.105,m.graphite,0,Math.cos(a)*.556,Math.sin(a)*.556);tread.rotation.x=a;
   if(i%3===0){const spoke=box(spin,.025,.61,.045,m.graphite,side*.207,0,0);spoke.rotation.x=a;}
  }
  batch(spin);wheels.push({pivot,spin,z,side});
 }
 return {root,body,seat,wheels,scanner,steering};
}

/**
 * Forward is local +Z; positive steer turns left. seatPosition() is the seated
 * avatar ROOT anchor. userData.seatCushionLocal gives the actual hip target. board()/exit() return
 * the corresponding world positions. The caller supplies avatar seated pose,
 * camera and keyboard UI, and must pause this update for any modal interaction.
 * dt is seconds, capped at .1 and sub-stepped. No module-owned timers/listeners.
 */
export function createLunarRover(scene,physics){
 const existing=scene.getObjectByName('Rideable Lunar Explorer 06');if(existing?.userData.rover)return existing.userData.rover;
 const m=materials(),course=buildCourse(scene,m),{root,body,seat,wheels,scanner,steering}=buildVehicle(scene,m);
 root.position.set(ROVER_DOCK.x,ROVER_COURSE.groundY,ROVER_DOCK.z);root.rotation.y=ROVER_DOCK.heading;
 let driving=false,speed=0,steerAngle=0,wheelTravel=0,elapsed=0,disposed=false,route=null;
 const safePoses=[];
 const world=physics?.world,centreY=1.76;
 const rigidBody=world?world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(root.position.x,centreY,root.position.z)):null;
 const collider=rigidBody?world.createCollider(RAPIER.ColliderDesc.cuboid(1.43,1.45,2.04),rigidBody):null;
 const shape=world?new RAPIER.Cuboid(1.46,1.45,2.08):null;
 const routeShape=world?new RAPIER.Cylinder(1.45,ROVER_COURSE.radius):null;
 const orientation=new THREE.Quaternion(),rotationAxis=new THREE.Vector3(0,1,0),candidate=new THREE.Vector3(),exitPoint=new THREE.Vector3();
 const identity={x:0,y:0,z:0,w:1};
 const obstacle=other=>!other.isSensor()&&other.handle!==physics?.collider?.handle;
 const routeRoot=new THREE.Group();routeRoot.name='Collision-checked rover route';scene.add(routeRoot);
 const routeMaterial=new THREE.MeshBasicMaterial({color:0x47c3b9,transparent:true,opacity:.78,depthWrite:false});
 function syncPhysics(){if(!rigidBody)return;orientation.setFromAxisAngle(rotationAxis,root.rotation.y);const p={x:root.position.x,y:root.position.y-ROVER_COURSE.groundY+centreY,z:root.position.z};rigidBody.setTranslation(p,true);rigidBody.setNextKinematicTranslation(p);rigidBody.setRotation(orientation,true);rigidBody.setNextKinematicRotation(orientation);world.propagateModifiedBodyPositionsToColliders();}
 syncPhysics();
 function ground(x,z){
  if(!dry(x,z))return null;
  if(!world)return 0;
  const origin={x,y:.55,z};
  // A wheel corner in a shallow wall contact still has ground beneath it.
  // Ignore solids enclosing the ray origin here, not in the body sweep. Their
  // collisions remain mandatory; otherwise terrain checks prevent any escape.
  const hit=world.castRayAndGetNormal(new RAPIER.Ray(origin,{x:0,y:-1,z:0}),.7,true,undefined,undefined,collider,rigidBody,other=>obstacle(other)&&!other.containsPoint(origin));
  if(!hit||hit.normal.y<.85)return null;const y=.55-hit.timeOfImpact;
  return y>=-.025&&y<=.34?Math.max(0,y):null;
 }
 function footprintGround(x,z,heading){
  const y=ground(x,z);if(y===null)return null;
  const sin=Math.sin(heading),cos=Math.cos(heading);let low=y,high=y;
  // Verify all wheel corners, not just a centre ray over an invisible ground
  // plate. A missing corner or a ledge cannot become a saved recovery point.
  for(const a of [-1.46,1.46])for(const b of [-2.08,2.08]){
   const corner=ground(x+a*cos+b*sin,z-a*sin+b*cos);if(corner===null)return null;
   low=Math.min(low,corner);high=Math.max(high,corner);
  }
  return high-low<=.34?high:null;
 }
 function blocked(x,z,heading,dx=0,dz=0){
  if(!inside(x,z)||!dry(x,z,ROVER_COURSE.radius))return true;if(!world)return false;
  const y=footprintGround(x,z,heading);if(y===null)return true;
  orientation.setFromAxisAngle(rotationAxis,heading);
  const p={x,y:centreY+y,z};
  let overlaps=false;
  world.intersectionsWithShape(p,orientation,shape,other=>{
   // A loaded collider or round-off can leave a shallow initial overlap.
   // Permit only straight motion that reduces that same contact and points
   // out of its surface. Never ignore a new obstacle or cross through a wall.
   const old=other.contactShape(shape,{x:x-dx,y:root.position.y-ROVER_COURSE.groundY+centreY,z:z-dz},orientation,.02);
   const next=other.contactShape(shape,p,orientation,.02);
   const separating=(dx||dz)&&Math.abs(angle(heading-root.rotation.y))<1e-6&&old&&next&&old.distance>=-.12&&old.distance<=0&&next.distance>old.distance+1e-7&&dx*old.normal1.x+dz*old.normal1.z>1e-8;
   if(!separating){overlaps=true;return false;}return true;
  },undefined,undefined,collider,rigidBody,obstacle);
  if(overlaps)return true;
  // stopAtPenetration=false is essential: an initial safety-margin contact
  // must not report TOI=0 while reversing away. Rapier still stops inward
  // movement and new contacts; the checks above constrain real penetration.
  if(dx||dz){const hit=world.castShape({x:x-dx,y:centreY+y,z:z-dz},orientation,{x:dx,y:0,z:dz},shape,.015,1,false,undefined,undefined,collider,rigidBody,obstacle);if(hit&&hit.time_of_impact<=1)return true;}
  return false;
 }
 function seatPosition(target=new THREE.Vector3()){root.updateWorldMatrix(true,true);return seat.getWorldPosition(target);}
 function exitPosition(target=new THREE.Vector3()){
  root.updateWorldMatrix(true,true);const choices=[];
  for(const local of [[-2.15,0,0],[2.15,0,0],[0,0,2.65],[0,0,-2.65]]){
   candidate.set(...local);root.localToWorld(candidate);
   const margin=Math.min(candidate.x-ROVER_COURSE.minX,ROVER_COURSE.maxX-candidate.x,candidate.z-ROVER_COURSE.minZ,ROVER_COURSE.maxZ-candidate.z);
   if(margin<.3)continue;const y=ground(candidate.x,candidate.z);if(y===null)continue;candidate.y=y;
   if(world&&world.intersectionWithShape({x:candidate.x,y:y+.84,z:candidate.z},identity,new RAPIER.Capsule(.56,.23),undefined,undefined,collider,rigidBody,obstacle))continue;
   choices.push({point:candidate.clone(),margin});
  }
  if(!choices.length)return null;choices.sort((a,b)=>b.margin-a.margin);return target.copy(choices[0].point);
 }
 function board(){if(disposed)return null;rememberSafePose();driving=true;speed=0;steerAngle=0;collider?.setSensor(true);return seatPosition();}
 /** Immediate brake; the caller clears held controls. No movement or dismount. */
 function stop(){speed=0;steerAngle=0;steering.rotation.z=0;for(const wheel of wheels)wheel.pivot.rotation.y=0;}
 function exit(){if(disposed)return null;const point=exitPosition(exitPoint);if(!point)return null;driving=false;speed=0;steerAngle=0;collider?.setSensor(false);return point.clone();}
 function clearRoute(){route=null;for(const child of [...routeRoot.children]){child.geometry?.dispose();child.removeFromParent();}}
 function routeFree(x,z){if(!world||!inside(x,z)||!dry(x,z,ROVER_COURSE.radius))return false;const y=ground(x,z);if(y===null)return false;for(let i=0;i<8;i++)if(ground(x+Math.sin(i*TAU/8)*ROVER_COURSE.radius,z+Math.cos(i*TAU/8)*ROVER_COURSE.radius)===null)return false;return !world.intersectionWithShape({x,y:centreY+y,z},identity,routeShape,undefined,undefined,collider,rigidBody,obstacle);}
 function lineClear(a,b){
  if(!routeFree(a.x,a.z)||!routeFree(b.x,b.z)||!drySegment(a,b))return false;
  const dx=b.x-a.x,dz=b.z-a.z,n=Math.ceil(Math.hypot(dx,dz)/.75);
  // Verify terrain as well as the swept body. No guidance over missing ground.
  for(let i=1;i<n;i++)if(!routeFree(a.x+dx*i/n,a.z+dz*i/n))return false;
  const y=Math.max(ground(a.x,a.z),ground(b.x,b.z));
  const hit=world.castShape({x:a.x,y:centreY+y,z:a.z},identity,{x:dx,y:0,z:dz},routeShape,.035,1,true,undefined,undefined,collider,rigidBody,obstacle);
  return !hit||hit.time_of_impact>1;
 }
 function rememberSafePose(){
  const previous=safePoses.at(-1),x=root.position.x,z=root.position.z;
  if(previous&&Math.hypot(x-previous.x,z-previous.z)<1.2)return;
  if(!routeFree(x,z)||blocked(x,z,root.rotation.y))return;
  safePoses.push({x,z,heading:root.rotation.y});if(safePoses.length>128)safePoses.shift();
 }
 /** Explicit reset, never an autonomous drive or an animated passage through
  * obstacles. Recheck stored destinations against today's collision world;
  * retain the seated/driving state and replan any existing route from there.
  * Pass {home:true} to request only the entrance dock. A blocked dock and no
  * safe history returns recovered:false without moving.
  */
 function recover({home=false}={}){
  const fail=reason=>({recovered:false,reason,position:null,heading:null,source:null});
  if(disposed||!world)return fail('Town collision data is not available yet.');
  stop();
  const choices=home?[]:[...safePoses].reverse().filter(p=>Math.hypot(p.x-root.position.x,p.z-root.position.z)>=1.2).map(p=>({...p,source:'recent-safe'}));
  choices.push({...ROVER_DOCK,source:'dock'});
  const safe=choices.find(p=>routeFree(p.x,p.z)&&!blocked(p.x,p.z,p.heading));
  if(!safe)return fail('No clear recovery point is available. Try reversing into the open space.');
  const destination=route?.points.at(-1);clearRoute();
  root.position.set(safe.x,footprintGround(safe.x,safe.z,safe.heading)+ROVER_COURSE.groundY,safe.z);root.rotation.y=safe.heading;
  body.position.y=0;body.rotation.z=0;steering.rotation.z=0;for(const wheel of wheels)wheel.pivot.rotation.y=0;
  syncPhysics();rememberSafePose();if(destination)routeTo(destination);
  return {recovered:true,reason:null,position:root.position.clone(),heading:safe.heading,source:safe.source};
 }
 /** Return safe ground points without moving the rover. Targets must be outdoors. */
 function findRoute(target){
  const fail=reason=>({points:[],reachable:false,reason});
  if(disposed||!world)return fail('Town collision data is not available yet.');
  if(!Number.isFinite(target?.x)||!Number.isFinite(target?.z))return fail('Choose a valid outdoor destination.');
  const start={x:root.position.x,z:root.position.z},goal={x:target.x,z:target.z};
  if(!routeFree(start.x,start.z))return fail('Move into a wider clear area before requesting a route.');
  if(!routeFree(goal.x,goal.z))return fail('That destination has no rover-sized stopping space. Choose an outdoor approach.');
  if(lineClear(start,goal))return {points:[start,goal],reachable:true,reason:null};
  const step=1.5,minX=ROVER_COURSE.minX+ROVER_COURSE.radius,minZ=ROVER_COURSE.minZ+ROVER_COURSE.radius;
  const cols=Math.floor((ROVER_COURSE.maxX-ROVER_COURSE.radius-minX)/step)+1,rows=Math.floor((ROVER_COURSE.maxZ-ROVER_COURSE.radius-minZ)/step)+1,count=cols*rows;
  const cache=new Int8Array(count),closed=new Uint8Array(count),came=new Int32Array(count).fill(-1),cost=new Float64Array(count).fill(Infinity);
  const point=id=>({x:minX+(id%cols)*step,z:minZ+Math.floor(id/cols)*step});
  const open=id=>{if(!cache[id]){const p=point(id);cache[id]=routeFree(p.x,p.z)?1:-1;}return cache[id]===1;};
  function nearest(p){let best=-1,distance=Infinity;const cx=Math.round((p.x-minX)/step),cz=Math.round((p.z-minZ)/step);for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,z=cz+dz;if(x<0||x>=cols||z<0||z>=rows)continue;const id=x+z*cols,q=point(id),d=Math.hypot(q.x-p.x,q.z-p.z);if(d<distance&&open(id)&&lineClear(p,q)){best=id;distance=d;}}return best;}
  const first=nearest(start),last=nearest(goal);if(first<0||last<0)return fail('There is not enough clear space to join the driving route.');
  const heap=[];
  function push(id,score){let i=heap.length;heap.push({id,score});while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}heap[i]={id,score};}
  function pop(){const head=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].score<heap[c].score)c++;if(heap[c].score>=tail.score)break;heap[i]=heap[c];i=c;}heap[i]=tail;}return head.id;}
  const end=point(last),heuristic=id=>{const p=point(id);return Math.hypot(p.x-end.x,p.z-end.z);};cost[first]=0;push(first,heuristic(first));
  while(heap.length){
   const current=pop();if(closed[current])continue;if(current===last)break;closed[current]=1;
   const cx=current%cols,cz=Math.floor(current/cols),a=point(current);
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dz)continue;const x=cx+dx,z=cz+dz;if(x<0||x>=cols||z<0||z>=rows)continue;
    const next=x+z*cols;if(closed[next]||!open(next))continue;const nextCost=cost[current]+Math.hypot(dx,dz)*step;
    if(nextCost>=cost[next]||!lineClear(a,point(next)))continue;came[next]=current;cost[next]=nextCost;push(next,nextCost+heuristic(next));
   }
  }
  if(first!==last&&came[last]<0)return fail('No collision-free rover route connects these locations.');
  const path=[];for(let id=last;id>=0;id=came[id]){path.push(point(id));if(id===first)break;}path.reverse();path.unshift(start);path.push(goal);
  const points=[start];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!lineClear(path[i],path[j]))j--;points.push(path[j]);i=j;}
  return {points,reachable:true,reason:null};
 }
 function routeTo(x,z){
  const result=findRoute(typeof x==='object'?x:{x,z});clearRoute();if(!result.reachable)return result;
  route={...result,index:1};
  // Low, spaced chevrons communicate guidance without laying a new road.
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.18,0,-.18,0,0,.14,.18,0,-.18,0,0,-.065],3));geometry.setIndex([0,1,3,1,2,3]);geometry.computeVertexNormals();
  for(let i=1;i<result.points.length;i++){
   const a=result.points[i-1],b=result.points[i],length=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(length/2.4));
   for(let j=0;j<n;j++){const t=j/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;const mark=new THREE.Mesh(geometry.clone(),routeMaterial);mark.position.set(x,(ground(x,z)??0)+.045,z);mark.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);mark.userData.routeSegment=i;routeRoot.add(mark);}
  }
  geometry.dispose();return result;
 }
 function updateRoute(){
  if(!route)return;const destination=route.points.at(-1);if(Math.hypot(destination.x-root.position.x,destination.z-root.position.z)<1.6){clearRoute();return;}
  while(route.index<route.points.length-1&&Math.hypot(route.points[route.index].x-root.position.x,route.points[route.index].z-root.position.z)<2)route.index++;
  for(const mark of routeRoot.children)mark.visible=mark.userData.routeSegment>=route.index;
 }
 function update(dt,input={}){
  if(disposed)return;
  if(typeof input.driving==='boolean'&&input.driving!==driving){if(input.driving)board();else exit();}
  if(input.paused||(typeof document!=='undefined'&&document.hidden)){speed=0;return;}
  dt=clamp(finite(dt),0,.1);if(!dt)return;
  // Parked rovers stay parked. No unattended laps around campus pedestrians.
  if(!driving){speed=0;return;}
  const reduced=Boolean(input.reducedMotion);elapsed+=dt;
  const steps=Math.ceil(dt*120),h=dt/steps;
  for(let i=0;i<steps;i++){
   const throttle=clamp(finite(input.throttle),-1,1),turn=clamp(finite(input.steer),-1,1);
   const nearLab=root.position.x>=16&&root.position.z<=-46;
   const forwardLimit=nearLab?3.2:ROVER_SPEC.maxSpeed;
   const desired=throttle*(throttle<0?ROVER_SPEC.reverseSpeed:forwardLimit);
   speed=approach(speed,desired,h*(throttle===0?4.5:2.0));steerAngle=approach(steerAngle,turn*ROVER_SPEC.steeringAngle,h*2.8);
   let heading=angle(root.rotation.y+speed*Math.tan(steerAngle)/ROVER_SPEC.wheelbase*h),dx=Math.sin(heading)*speed*h,dz=Math.cos(heading)*speed*h;
   if(blocked(root.position.x+dx,root.position.z+dz,heading,dx,dz)){
    // Steering can swing the nose farther into a corner while reversing.
    // Try a straight, fully collision-checked retreat before stopping.
    heading=root.rotation.y;dx=Math.sin(heading)*speed*h;dz=Math.cos(heading)*speed*h;
    if(speed>=0||blocked(root.position.x+dx,root.position.z+dz,heading,dx,dz)){speed=0;continue;}
    steerAngle=0;
   }
   root.rotation.y=heading;root.position.x+=dx;root.position.z+=dz;root.position.y=(footprintGround(root.position.x,root.position.z,heading)??0)+ROVER_COURSE.groundY;wheelTravel+=speed*h/ROVER_SPEC.wheelRadius;
  }
  for(const wheel of wheels){wheel.pivot.rotation.y=wheel.z>0?steerAngle:wheel.z<0?-steerAngle*.48:0;wheel.spin.rotation.x=wheelTravel;}
  steering.rotation.z=-steerAngle*.65;body.position.y=reduced?0:Math.sin(wheelTravel*1.7)*Math.min(.018,Math.abs(speed)*.006);body.rotation.z=reduced?0:-steerAngle*Math.abs(speed)*.009;scanner.rotation.y=reduced?0:Math.sin(elapsed*.6)*.20;
  syncPhysics();rememberSafePose();updateRoute();
 }
 function dispose(){if(disposed)return;disposed=true;clearRoute();routeMaterial.dispose();routeRoot.removeFromParent();if(rigidBody)world.removeRigidBody(rigidBody);const geometries=new Set(),materialSet=new Set(),textures=new Set();for(const object of [root,course]){object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const material of(Array.isArray(o.material)?o.material:[o.material]))if(material){materialSet.add(material);if(material.map)textures.add(material.map);}});object.removeFromParent();}geometries.forEach(g=>g.dispose());materialSet.forEach(mat=>mat.dispose());textures.forEach(t=>t.dispose());delete root.userData.rover;}
 const api={root,course,update,board,exit,stop,recover,seatPosition,exitPosition,findRoute,routeTo,clearRoute,dispose,get route(){return route;},get position(){return root.position;},get heading(){return root.rotation.y;},get speed(){return speed;},get driving(){return driving;}};
 root.userData.rover=api;return api;
}
