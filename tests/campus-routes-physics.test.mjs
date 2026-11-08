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
const {createLunarRover,ROVER_COURSE,ROVER_DOCK}=await import(data(resolveThree(source).replace("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utilsURL)).replace("'@dimforge/rapier3d-compat'",JSON.stringify(rapierURL))));
await RAPIER.init();
import {MENU_DESTINATIONS,resolveCampusDestination,campusMapDestinations} from '../playable-3d/campus-destinations.mjs';
const config=JSON.parse(await readFile(new URL('../world-config.json',import.meta.url),'utf8'));

test('Every Places/full-map rover destination and dock return clears the authored campus colliders',async()=>{
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
 const mature=new Function('return '+landscapeSource.match(/(\[\[-11,20\][^\n]+\])\.forEach/)[1])();
 for(const [x,z]of mature)if(!(x===16&&z===-3)&&!(x===18&&z===-21))physics.block(x,1.5,z,.4,3,.4);
 for(const [x,z]of [[-20,-2],[-14,-9],[7,-6],[18,1],[-3,9]])physics.block(x,1.5,z,.4,3,.4);
 // Use the two current authored building specs, conservatively solid including
 // their narrow pedestrian doorways, which are not rover entrances.
 const specs=new Function('EST','return '+landscapeSource.match(/for\(const spec of (\[[^\n]+\])\)\{/)[1])({name:'Archon Engine'});
 for(const b of specs)physics.block(b.x,1.8,b.z,b.width,3.6,b.depth);
 const start=labSource.indexOf('function colliders(root,physics){'),end=labSource.indexOf('export function installLunarLab',start);
 new Function('LUNAR_SITE',labSource.slice(start,end)+';return colliders;')({x:38,z:-68.5})(null,physics);
 const r=createLunarRover(scene,physics);w.step();
 try{
  const keys=new Set([...Object.values(MENU_DESTINATIONS),...campusMapDestinations(config).map(pin=>pin.key),'room:media']);
  const footprint=new RAPIER.Cylinder(1.45,ROVER_COURSE.radius);r.board();
  for(const key of keys){
   r.root.position.set(ROVER_DOCK.x,.04,ROVER_DOCK.z);
   const target=resolveCampusDestination(config,key,{driving:true,roverDock:ROVER_DOCK}),before=r.position.clone();
   const out=r.routeTo(target.x,target.z);assert.equal(out.reachable,true,key+': '+out.reason);
   assert.ok(r.position.equals(before),'selecting '+key+' must not move the rover');assert.equal(r.driving,true);
   assert.deepEqual(out.points.at(-1),{x:target.x,z:target.z});
   for(let i=1;i<out.points.length;i++){
    const a=out.points[i-1],b=out.points[i];
    for(let t=0;t<=1;t+=.05){const p={x:a.x+(b.x-a.x)*t,y:1.76,z:a.z+(b.z-a.z)*t};assert.equal(w.intersectionWithShape(p,{x:0,y:0,z:0,w:1},footprint,undefined,undefined,undefined,undefined,c=>!c.isSensor()&&c.parent()===null),null,key+' route crosses an authored obstacle');}
   }
   r.root.position.set(target.x,.04,target.z);const home=r.routeTo(ROVER_DOCK.x,ROVER_DOCK.z);assert.equal(home.reachable,true,key+' return: '+home.reason);
  }
  r.root.position.set(ROVER_DOCK.x,.04,ROVER_DOCK.z);assert.equal(r.routeTo(38,-54.5).reachable,true);
  const before=r.position.clone();assert.equal(r.routeTo(-3.15,-8.8).reachable,false,'the pedestrian chapel door is too tight');
  assert.equal(r.route,null,'failure clears old route markers');assert.ok(r.position.equals(before));assert.equal(r.driving,true);
 }finally{r.dispose();w.free();}
});
