import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import {ENTRANCE_STAGE,usesEntranceStage,entranceShowcasePose} from '../playable-3d/entrance-showcase.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const config=JSON.parse(await read('world-config.json'));
test('Only the player remains; no configured cast or guides',()=>{
 assert.deepEqual(config.extraNpcs,[]);assert.ok(Object.values(config.npcs).every(n=>n.enabled===false));assert.equal(usesEntranceStage(config),true);
});
test('Wide family camera keeps characters, rover and campus landmarks above welcome banner',()=>{
 for(const [w,h] of [[1280,720],[1600,900],[390,844],[430,932]]){const p=entranceShowcasePose(w/h),c=new THREE.PerspectiveCamera(p.fov,w/h,.08,275);c.position.set(...p.position);c.lookAt(...p.target);c.setViewOffset(w,h,w*p.shiftX,h*p.shiftY,w,h);c.updateMatrixWorld();
  const points=[...config.extraNpcs.flatMap(n=>[[n.name,...[n.position[0],.16,n.position[1]]],[n.name,...[n.position[0],1.94,n.position[1]]]]),['Chapel',-9,3,-12],['Admin',-4,4,-15],['Lab',38,5.9,-65],['Rover',15,2,3]];
  for(const [label,x,y,z] of points){const v=new THREE.Vector3(x,y,z).project(c),sx=(v.x+1)/2,sy=(1-v.y)/2;assert.ok(sx>.01&&sx<.99&&sy>.12&&sy<.72,`${label} at ${w}×${h}: ${sx},${sy}`);}
 }
});
test('Welcome is independent of removed character assets',async()=>{
 const cast=await read('playable-3d/neutral-cast.mjs'),app=await read('playable-3d/app.js');const update=cast.slice(cast.indexOf('export function createExtraCast'));
 assert.ok(!update.includes('loadAsync'));assert.ok(update.includes('welcomeAnchor'));assert.ok(app.includes('dialogue:config.welcome'));
});
test('Welcome remains dismissible and relinquishes camera ownership to the rover',async()=>{
 const app=await read('playable-3d/app.js'),welcome=await read('playable-3d/welcome-player.mjs');assert.ok(app.includes("!lunarRover?.driving&&welcomeIsOpen('basil')"));assert.ok(welcome.includes("classList.remove('showing-basil-welcome')"));assert.ok(welcome.includes("!document.body.classList.contains('driving-lunar-rover')"));assert.ok(welcome.includes('go.onclick=finishWelcome'));assert.ok(welcome.includes('close.onclick=finishWelcome'));
});
