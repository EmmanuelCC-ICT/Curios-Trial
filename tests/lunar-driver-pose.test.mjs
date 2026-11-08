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

test('Basil explains teacher prototypes, modular reuse and the weeks-to-build/hours-to-clone distinction',async()=>{
 const slides=JSON.parse(await readFile(new URL('../playable-3d/assets/curios/welcome-slides.json',import.meta.url),'utf8'));
 assert.equal(slides.length,11);assert.equal(slides[0].title,'Hi, I’m Basil.');
 assert.match(slides[1].text,/weeks building Career Empire, then hours cloning it for Curios/);
 assert.match(slides[2].text,/teacher tools, branding, app rooms and testing came afterwards/);
 assert.equal(slides[4].image,'avatar-studio.jpg');assert.match(slides[5].text,/Teacher setup in the top bar/);
 assert.match(slides[7].text,/prototype is for teachers/);assert.match(slides[7].text,/modularise.*repurpose.*add or remove/);
 assert.match(slides[8].text,/Once the world is built, customisation becomes much easier/);
 assert.match(slides[8].text,/Curios Lunar Lab building.*moon rover you can drive/);
 assert.match(slides[9].text,/prototype.*having fun.*experimenting/);
 assert.match(slides.at(-1).text,/Hop in the rover.*Curios Lunar Lab/);
 assert.match(slides.at(-1).text,/Maybe one day.*rocket.*Mooniverse/);assert.equal(slides.at(-1).image,'lunar-lab.svg');
 assert.ok(!JSON.stringify(slides).includes('fifteen minutes'));
});

test('Basil transcript, script and text dialogue include the same complete new ending',async()=>{
 const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const slides=JSON.parse(await read('playable-3d/assets/curios/welcome-slides.json'));
 const config=JSON.parse(await read('world-config.json')),script=JSON.parse(await read('tools/welcome-script.json'));
 const dialogue=config.extraNpcs.find(n=>n.id==='basil').dialogue;
 assert.equal(await read('playable-3d/assets/curios/basil-welcome-transcript.txt'),slides.map(s=>s.text).join('\n\n')+'\n');
 assert.deepEqual(script.slice(-4).map(s=>s.text),slides.slice(-4).map(s=>s.text));
 assert.ok(dialogue.endsWith(slides.slice(-4).map(s=>s.text).join('\n\n')));
 assert.match(dialogue,/weeks building Career Empire, then hours cloning it for Curios/);
 assert.ok(!dialogue.includes('fifteen minutes'));
});

test('Welcome stays silent with readable timing, local images and a fresh module chain',async()=>{
 const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
 const slides=JSON.parse(await read('playable-3d/assets/curios/welcome-slides.json'));
 for(const slide of slides){assert.ok(slide.seconds>=9);assert.ok(slide.seconds>=3+slide.text.split(/\s+/).length/2.7-.1);assert.match(slide.image,/^[a-z0-9-]+\.(png|jpg|svg)$/);assert.ok((await read('playable-3d/assets/curios/'+slide.image)).length>0);}
 const player=await read('playable-3d/welcome-player.mjs');assert.match(player,/welcome-slides.json\?v=prototype-intro-1/);
 assert.ok(!/createElement\(['"](?:audio|video)['"]\)/.test(player));
 for(const path of ['playable-3d/app.js','playable-3d/neutral-cast.mjs'])assert.match(await read(path),/welcome-player.mjs\?v=entrance-stage-4/);
 assert.match(await read('playable-3d/world-settings.mjs'),/world-config.json\?v=entrance-stage-4/);
});


test('Teacher showcase keeps controls separate from scrolling copy and honours reduced motion',async()=>{
 const player=await readFile(new URL('../playable-3d/welcome-player.mjs',import.meta.url),'utf8');
 const css=await readFile(new URL('../playable-3d/curios-brand.css',import.meta.url),'utf8');
 assert.match(player,/TEACHER SHOWCASE/);assert.match(player,/prefers-reduced-motion: reduce/);
 assert.match(player,/innerHeight-headerBottom-24/);
 assert.match(css,/#basil-welcome \.welcome-slide\{min-height:0;overflow:auto/);
 assert.match(css,/#basil-welcome footer\{flex:none/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
