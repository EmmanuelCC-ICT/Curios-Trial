import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import RAPIER from '../playable-3d/vendor/rapier/rapier.mjs';

const data=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const threeURL=new URL('../playable-3d/vendor/three/build/three.module.js',import.meta.url).href;
const rapierURL=new URL('../playable-3d/vendor/rapier/rapier.mjs',import.meta.url).href;
const resolveThree=text=>text.replaceAll("'three'",JSON.stringify(threeURL));
const utilsURL=data(resolveThree(await readFile(new URL('../playable-3d/vendor/three/examples/jsm/utils/BufferGeometryUtils.js',import.meta.url),'utf8')));
const source=await readFile(new URL('../playable-3d/lunar-rover.mjs',import.meta.url),'utf8');
const {createLunarRover,ROVER_COURSE,ROVER_SPEC,ROVER_DOCK}=await import(data(resolveThree(source).replace("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utilsURL)).replace("'@dimforge/rapier3d-compat'",JSON.stringify(rapierURL))));
await RAPIER.init();
function fixture(physical=false){
 const scene=new THREE.Scene(),world=physical?new RAPIER.World({x:0,y:-9.81,z:0}):null;
 if(world)world.createCollider(RAPIER.ColliderDesc.cuboid(46,.1,58).setTranslation(6,-.1,-20));
 const rover=createLunarRover(scene,world?{world}:undefined);world?.step();
 return {scene,world,rover,close(){rover.dispose();world?.free();}};
}
function assertBounds(rover){
 const b=new THREE.Box3().setFromObject(rover.root,true);
 assert.ok(b.min.x>=ROVER_COURSE.minX&&b.max.x<=ROVER_COURSE.maxX,`lateral escape ${b.min.x}, ${b.max.x}`);
 assert.ok(b.min.z>=ROVER_COURSE.minZ&&b.max.z<=ROVER_COURSE.maxZ,`longitudinal escape ${b.min.z}, ${b.max.z}`);
 assert.ok(b.min.y>=-.001,'tyres stay on ground');
}

test('Rover is a six-wheel cockpit vehicle with a compact entrance dock',()=>{
 const f=fixture();try{
  const r=f.rover,names=[];let meshes=0,triangles=0;r.root.traverse(o=>{names.push(o.name);if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  assert.equal(names.filter(n=>n==='Rotating mesh tyre').length,6);
  for(const name of ['Open cockpit and science chassis','Rover steering yoke','Stereo navigation mast','Driver root anchor'])assert.ok(names.includes(name),name);
  assert.ok(meshes<75,'static body and wheel detail must be batched');
  assert.ok(triangles<40000,'detail stays within a useful campus geometry budget');
  assert.equal(r.course.name,'Entrance rover charging dock');
  assert.deepEqual(r.root.userData.seatCushionLocal,{x:0,y:ROVER_SPEC.seatHeight,z:-.38});
  assertBounds(r);
  assert.equal(createLunarRover(f.scene),r,'repeated installation must not duplicate the rover or range');
  assert.equal(f.scene.children.length,3);
 }finally{f.close();}
});

test('Rover boarding, steering, wheels and safe repeated exit use world-space poses',()=>{
 const f=fixture(true);try{
  const r=f.rover,start=r.position.clone(),seat=r.board();assert.equal(r.driving,true);
  assert.ok(seat instanceof THREE.Vector3&&seat.y>.4&&seat.y<.5);
  for(let i=0;i<50;i++){r.update(1/60,{throttle:1,steer:.8});f.world.step();}
  assert.ok(r.position.distanceTo(start)>.4);assert.ok(Math.abs(r.heading-ROVER_DOCK.heading)>.1);
  assert.notEqual(r.root.getObjectByName('Rotating mesh tyre').rotation.x,0);
  assert.notEqual(r.root.getObjectByName('Left front suspension').rotation.y,0);
  const expected=r.root.localToWorld(new THREE.Vector3(0,.42,-.38));
  assert.ok(r.seatPosition().distanceTo(expected)<.04,'seat anchor follows actual chassis and heading');
  const exit=r.exit();assert.ok(exit);assert.equal(r.driving,false);assert.equal(r.speed,0);
  assert.ok(exit.distanceTo(r.position)>2,'exit must clear wheels');assert.equal(exit.y,0);
  assert.ok(r.exit());assert.ok(r.board());assert.ok(r.exit());
  assertBounds(r);
 }finally{f.close();}
});

test('Continuous input cannot leave the supported campus ground',()=>{
 const f=fixture();try{
  const r=f.rover;r.board();
  for(const input of [{throttle:1,steer:0},{throttle:-1,steer:.8},{throttle:1,steer:-1},{throttle:-1,steer:0}])for(let i=0;i<450;i++){
   r.update(1/30,input);if(i%15===0)assertBounds(r);
  }
  assert.ok(ROVER_COURSE.minX<ROVER_DOCK.x&&ROVER_COURSE.minZ< -54.5,'campus bounds include both arrival and Lunar Lab');
 }finally{f.close();}
});

test('Unoccupied entrance rover stays parked without unattended driving',()=>{
 const f=fixture();try{const r=f.rover,start=r.position.clone();for(let i=0;i<1200;i++)r.update(.1,{throttle:1});assert.ok(r.position.equals(start));assert.equal(r.speed,0);r.board();r.update(.1,{throttle:1});assert.ok(!r.position.equals(start));r.exit();const parked=r.position.clone();for(let i=0;i<1200;i++)r.update(.1);assert.ok(r.position.equals(parked));}finally{f.close();}
});

test('Pause, hidden tabs, reduced motion, invalid dt and long frames cannot run away',()=>{
 const f=fixture();const old=globalThis.document;try{
  const r=f.rover;r.board();r.update(.1,{throttle:1});
  const stop=r.position.clone(),heading=r.heading,spin=r.root.getObjectByName('Rotating mesh tyre').rotation.x;
  for(let i=0;i<20;i++)r.update(100,{throttle:1,paused:true});
  assert.ok(r.position.equals(stop));assert.equal(r.heading,heading);assert.equal(r.speed,0);assert.equal(r.root.getObjectByName('Rotating mesh tyre').rotation.x,spin);
  globalThis.document={hidden:true};r.update(5,{throttle:1});assert.ok(r.position.equals(stop));
  delete globalThis.document;
  for(const dt of [NaN,Infinity,-1,0])r.update(dt,{throttle:1});assert.ok(r.position.equals(stop));
  r.update(100,{throttle:1});assert.ok(r.position.distanceTo(stop)<.04,'long frame is capped, not caught up');
  r.exit();const reduced=r.position.clone();for(let i=0;i<900;i++)r.update(.1,{reducedMotion:true});assert.ok(r.position.equals(reduced));
  r.board();for(let i=0;i<30;i++)r.update(1/60,{throttle:-1,reducedMotion:true});assert.ok(r.position.distanceTo(reduced)>.1,'manual driving remains available with reduced motion');
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;f.close();}
});

test('Actual town Rapier collision stops the rover before a thin obstacle',()=>{
 const f=fixture(true);try{
  const r=f.rover;r.root.rotation.y=Math.PI;r.board();
  const wall=f.world.createCollider(RAPIER.ColliderDesc.cuboid(6,2,.025).setTranslation(-10,2,23));f.world.step();
  for(let i=0;i<300;i++){r.update(1/30,{throttle:1});f.world.step();}
  const b=new THREE.Box3().setFromObject(r.root,true);assert.ok(b.min.z>23,'vehicle must not phase through a thin wall');
  assert.ok(r.position.z<26.5,'must drive up to the obstacle, not be stuck against ground');assert.equal(r.speed,0);
  f.world.removeCollider(wall,true);
 }finally{f.close();}
});

test('An unoccupied rover has real town collision and dispose releases it once',()=>{
 const f=fixture(true);try{
  const r=f.rover,world=f.world;assert.equal(world.colliders.len(),2);
  const point=r.position.clone();
  const hit=()=>world.intersectionWithShape({x:point.x,y:1,z:point.z},{x:0,y:0,z:0,w:1},new RAPIER.Ball(.1),RAPIER.QueryFilterFlags.EXCLUDE_SENSORS);
  assert.ok(hit(),'unoccupied rover blocks pedestrian collision');r.board();world.step();assert.equal(hit(),null,'rider capsule cannot collide with its own vehicle');r.exit();world.step();assert.ok(hit());
  r.dispose();r.dispose();assert.equal(world.colliders.len(),1);assert.equal(f.scene.children.length,0);r.update(1,{throttle:1});assert.equal(r.board(),null);
 }finally{f.close();}
});

test('Driving ignores only the rider capsule while keeping other town obstacles solid',()=>{
 const scene=new THREE.Scene(),world=new RAPIER.World({x:0,y:0,z:0});
 world.createCollider(RAPIER.ColliderDesc.cuboid(46,.1,58).setTranslation(6,-.1,-20));
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-10,.84,26));
 const collider=world.createCollider(RAPIER.ColliderDesc.capsule(.56,.2),body);
 const r=createLunarRover(scene,{world,body,collider});world.step();
 try{
  r.root.rotation.y=Math.PI;r.board();for(let i=0;i<60;i++){r.update(1/60,{throttle:1});world.step();}
  assert.ok(r.position.z<26.2,'driver capsule must not block its own vehicle');
  world.createCollider(RAPIER.ColliderDesc.cuboid(3,2,.05).setTranslation(-10,2,23));world.step();
  for(let i=0;i<120;i++){r.update(1/60,{throttle:1});world.step();}
  assert.ok(new THREE.Box3().setFromObject(r.root,true).min.z>23,'excluding rider must not exclude ordinary obstacles');
 }finally{r.dispose();world.free();}
});

test('A blocked dismount keeps the rider aboard rather than teleporting through obstacles',()=>{
 const f=fixture(true);try{
  const r=f.rover;r.board();
  for(const local of [[-2.15,0,0],[2.15,0,0],[0,0,2.65],[0,0,-2.65]]){
   const p=r.root.localToWorld(new THREE.Vector3(...local));f.world.createCollider(RAPIER.ColliderDesc.cuboid(.4,2,.4).setTranslation(p.x,2,p.z));
  }
  f.world.step();assert.equal(r.exitPosition(),null);assert.equal(r.exit(),null);assert.equal(r.driving,true);
  r.update(1/60,{driving:false,paused:true});assert.equal(r.driving,true,'implicit exit must also respect safe placement');
 }finally{f.close();}
});


test('Entrance dock stays small and the original seated cockpit is retained',()=>{
 const f=fixture();try{const r=f.rover;assert.deepEqual({x:r.position.x,z:r.position.z},{x:-10,z:27});assert.equal(r.heading,Math.PI/2);const b=new THREE.Box3().setFromObject(r.course,true);assert.ok(b.getSize(new THREE.Vector3()).x<4&&b.getSize(new THREE.Vector3()).z<6);assert.equal(r.root.userData.standingDriver,undefined);assert.deepEqual(r.root.userData.seatCushionLocal,{x:0,y:1.23,z:-.38});assert.match(source,/rounded\(body,\.84,\.65,\.16,\.09,m\.seat,0,1\.45/);assert.match(source,/m\.graphite,0,1\.84,-\.86/);assert.doesNotMatch(source,/ROVER TEST RANGE/);}finally{f.close();}
});

test('Map route uses swept town collision, marks only safe paths and returns home',()=>{
 const f=fixture(true);try{
  const r=f.rover,w=f.world;w.createCollider(RAPIER.ColliderDesc.cuboid(9,3,13).setTranslation(4,3,-10));w.createCollider(RAPIER.ColliderDesc.cuboid(5,3,5).setTranslation(15,3,18));w.step();
  const out=r.routeTo(38,-54.5);assert.equal(out.reachable,true,out.reason);assert.ok(out.points.length>=3,'route must go around the central building');
  const routeShape=new RAPIER.Cylinder(1.45,ROVER_COURSE.radius),rotation={x:0,y:0,z:0,w:1};
  for(let i=1;i<out.points.length;i++){const a=out.points[i-1],b=out.points[i];for(let t=0;t<=1;t+=.05){const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;assert.ok(x>=ROVER_COURSE.minX+ROVER_COURSE.radius&&x<=ROVER_COURSE.maxX-ROVER_COURSE.radius);const hit=w.intersectionWithShape({x,y:1.76,z},rotation,routeShape,undefined,undefined,undefined,undefined,c=>c.parent()===null);assert.equal(hit,null,'route footprint must avoid all building geometry');}}
  const marks=f.scene.getObjectByName('Collision-checked rover route');assert.ok(marks.children.length>10);assert.equal(r.driving,false,'route selection does not auto-board or move');assert.equal(r.position.z,27);
  r.root.position.set(38,.04,-54.5);const back=r.findRoute(ROVER_DOCK);assert.equal(back.reachable,true,back.reason);assert.ok(back.points.length>=3);
  r.board();r.update(1/60,{throttle:0});assert.equal(r.route,null,'arrival clears route markers');assert.equal(marks.children.length,0);
  const failed=r.routeTo(4,-10);assert.equal(failed.reachable,false);assert.ok(failed.reason);assert.equal(marks.children.length,0);
 }finally{f.close();}
});

test('Missing collision data, off-campus destinations, and sealed routes fail safely',()=>{
 const plain=fixture();try{assert.equal(plain.rover.routeTo(38,-54.5).reachable,false);}finally{plain.close();}
 const f=fixture(true);try{assert.equal(f.rover.routeTo(200,200).reachable,false);f.world.createCollider(RAPIER.ColliderDesc.cuboid(50,3,.2).setTranslation(4,3,10));f.world.step();const result=f.rover.routeTo(38,-54.5);assert.equal(result.reachable,false);assert.deepEqual(result.points,[]);}finally{f.close();}
});

test('Actual authored campus colliders leave a route from entrance to Lunar Lab and back',async()=>{
 const worldSource=await readFile(new URL('../playable-3d/world.js',import.meta.url),'utf8');
 const arrivalSource=await readFile(new URL('../playable-3d/arrival-precinct.js',import.meta.url),'utf8');
 const courtyardSource=await readFile(new URL('../playable-3d/ecc-preview/authored-courtyard.js',import.meta.url),'utf8');
 const landmarkSource=await readFile(new URL('../playable-3d/ecc-preview/landmark-layout.js',import.meta.url),'utf8');
 const destinationSource=await readFile(new URL('../playable-3d/destinations.js',import.meta.url),'utf8');
 const landscapeSource=await readFile(new URL('../playable-3d/campus-landscape.js',import.meta.url),'utf8');
 const labSource=await readFile(new URL('../playable-3d/curios-lunar-lab.mjs',import.meta.url),'utf8');
 const {ECC_WELCOME}=await import(data(landmarkSource));
 const LEGACY=new Function('return '+destinationSource.match(/export const LEGACY=(\{[^;]+\});/)[1])();
 const precinct={colliders:new Function('return '+arrivalSource.match(/colliders:(\[\[[^\n]+\]\])/)[1])()};
 const physicsSource=worldSource.slice(worldSource.indexOf('function physics(inside){'),worldSource.indexOf('\n  const townPhysics'));
 const physics=new Function('RAPIER','precinct','stations','LEGACY',physicsSource+';return physics(false);')(RAPIER,precinct,[],LEGACY);
 const w=physics.world,scene=new THREE.Scene();
 const obstacles=new Function('ECC_WELCOME',courtyardSource.slice(courtyardSource.indexOf('const beds='),courtyardSource.indexOf('function label(')).replace('export const courtyardObstacles','const courtyardObstacles')+';return courtyardObstacles;')(ECC_WELCOME);
 const apply=worldSource.slice(worldSource.indexOf('function addExteriorColliders('),worldSource.indexOf('  // Use the rendered path triangles'));
 new Function('RAPIER',apply+';return addExteriorColliders;')(RAPIER)(w,obstacles);
 const beds=new Function('return '+landscapeSource.match(/const beds=(\[\[[^\n]+\]\]);/)[1])();
 for(const [x,z,width,depth]of beds)physics.block(x,.25,z,width,.5,depth);
 // Use the two current authored building specs, conservatively solid including
 // their narrow pedestrian doorways, which are not rover entrances.
 const specs=new Function('EST','return '+landscapeSource.match(/for\(const spec of (\[[^\n]+\])\)\{/)[1])({name:'Archon Engine'});
 for(const b of specs)physics.block(b.x,1.8,b.z,b.width,3.6,b.depth);
 const start=labSource.indexOf('function colliders(root,physics){'),end=labSource.indexOf('export function installLunarLab',start);
 new Function('LUNAR_SITE',labSource.slice(start,end)+';return colliders;')({x:38,z:-68.5})(null,physics);
 const r=createLunarRover(scene,physics);w.step();
 try{
  const out=r.routeTo(38,-54.5);assert.equal(out.reachable,true,out.reason);assert.ok(out.points.length>2);assert.ok(out.points[0].z>LEGACY.z+ROVER_COURSE.radius,'home clears the existing Welcome sign');
  const footprint=new RAPIER.Cylinder(1.45,ROVER_COURSE.radius);
  for(let i=1;i<out.points.length;i++){const a=out.points[i-1],b=out.points[i];for(let t=0;t<=1;t+=.02){const p={x:a.x+(b.x-a.x)*t,y:1.76,z:a.z+(b.z-a.z)*t};assert.equal(w.intersectionWithShape(p,{x:0,y:0,z:0,w:1},footprint,undefined,undefined,undefined,undefined,c=>!c.isSensor()&&c.parent()===null),null,'route crosses an authored campus obstacle');}}
  r.root.position.set(38,.04,-54.5);const home=r.routeTo(ROVER_DOCK.x,ROVER_DOCK.z);assert.equal(home.reachable,true,home.reason);
 }finally{r.dispose();w.free();}
});
