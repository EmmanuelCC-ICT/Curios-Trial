import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
const three=new URL('../playable-3d/vendor/three/build/three.module.js',import.meta.url).href;
const source=await readFile(new URL('../playable-3d/lunar-driver-pose.mjs',import.meta.url),'utf8');
const {createLunarDriverPose}=await import('data:text/javascript;base64,'+Buffer.from(source.replace("'three'",JSON.stringify(three))).toString('base64'));
test('Rover rider aligns hips to seat, bends both legs and restores original rig',()=>{
 const scene=new THREE.Scene(),model=new THREE.Group();scene.add(model);
 const hips=new THREE.Bone();hips.name='mixamorig:Hips';hips.position.y=.8;model.add(hips);
 const originals=[];
 for(const side of ['Left','Right']){let parent=hips;for(const [name,y]of [['UpLeg',0],['Leg',-.4],['Foot',-.4]]){const bone=new THREE.Bone();bone.name='mixamorig:'+side+name;bone.position.y=y;parent.add(bone);parent=bone;originals.push([bone,bone.quaternion.clone()]);}}
 const root=new THREE.Group();root.position.set(38,.04,-49);root.rotation.y=.9;root.userData.seatCushionLocal={x:0,y:1.23,z:-.38};scene.add(root);
 const rover={root,heading:.9,seatPosition(){return root.localToWorld(new THREE.Vector3(0,.42,-.38));}};
 const pose=createLunarDriverPose(model,rover);pose.update();
 const seat=root.localToWorld(new THREE.Vector3(0,1.23,-.38)),actual=hips.getWorldPosition(new THREE.Vector3());
 assert.ok(actual.distanceTo(seat)<1e-8);assert.equal(model.rotation.y,.9);
 const thigh=originals[0][0],knee=originals[1][0];
 const legDirection=knee.getWorldPosition(new THREE.Vector3()).sub(thigh.getWorldPosition(new THREE.Vector3())).normalize();
 assert.ok(legDirection.dot(new THREE.Vector3(Math.sin(.9),0,Math.cos(.9)))>.95);
 const pose1=originals.map(([b])=>b.quaternion.toArray());pose.update();assert.deepEqual(originals.map(([b])=>b.quaternion.toArray()),pose1);
 pose.restore();for(const [bone,q]of originals)assert.ok(bone.quaternion.angleTo(q)<1e-8);
});
test('Rover app keeps input and modal ownership separate from walking',async()=>{
 const app=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8');
 assert.match(app,/if\(mode==='town'&&lunarRover\?\.driving\)\{lunarRover\.update/);
 assert.match(app,/if\(e\.code==='KeyE'&&!e\.repeat\)interaction\?\.action\(\)/);
 assert.match(app,/function canFlyover\(\)\{return !lunarRover\?\.driving/);
 assert.match(app,/paused:mode!=='town'\|\|!canStepNavigation\(\)/);
 assert.match(app,/lunarDriverPose\?\.restore\(\);lunarDriverPose=null/);
 assert.match(app,/if\(!at\)\{toast\('Move the rover/);
});

test('Rover destination shortcuts route instead of teleporting through a failed dismount',async()=>{
 const app=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8');
 assert.match(app,/function destination\(which\)\{if\(lunarRover\?\.driving\)/);
 for(const name of ['enterHall','enterCareers','enterChapel','requestMarket'])assert.match(app,new RegExp('async function '+name+'\\([^)]*\\)\\{\\s*if\\(lunarRover\\?\\.driving\\)return visitCampusDestination'));
 assert.match(app,/if\(!await setMode\('interior'\)\)return;if\(appId\)curiosHub/);
 assert.match(app,/if\(!await setMode\('careers'\)\)return;curiosHub/);
 assert.match(app,/const go=async\(\)=>\{if\(!await setMode\('town'\)\)return;/);
});

test('Welcome uses the exact single invitation in every presentation source',async()=>{
 const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');const slides=JSON.parse(await read('playable-3d/assets/curios/welcome-slides.json')),script=JSON.parse(await read('tools/welcome-script.json')),config=JSON.parse(await read('world-config.json'));
 const text="Welcome! Somethings are familiar, some are new. Take a look around, explore, think about what you might be able to do with this space, add or change. Take a drive around in the rover and see if you can launch the rocket!";
 assert.equal(slides.length,1);assert.equal(slides[0].text,text);assert.equal(script[0].text,text);assert.equal(config.welcome,text);assert.equal(await read('playable-3d/assets/curios/basil-welcome-transcript.txt'),text+'\n');
 assert.doesNotMatch(text,/I said Tania|old NPC/);
});
test('Compact welcome has no automatic slides, video, sound or dancing',async()=>{
 const player=await readFile(new URL('../playable-3d/welcome-player.mjs',import.meta.url),'utf8');assert.match(player,/welcomeIsPlaying\(\)\{return false/);assert.ok(!/createElement\(['"](?:audio|video)['"]\)/.test(player));assert.ok(!player.includes('setInterval'));
});
