import test from 'node:test';
test('Welcome masking releases before rover ownership and every non-showcase camera branch',async()=>{
 const app=await read('playable-3d/app.js'),welcome=await read('playable-3d/welcome-player.mjs'),css=await read('playable-3d/curios-brand.css');
 const camera=app.slice(app.indexOf('function updateCamera('),app.indexOf('function boardLunarRover('));
 assert.ok(camera.indexOf('if(!stagedWelcome)showcaseTreeClearance?.restore();')<camera.indexOf('if(flyover?.active)return;'));
 assert.ok(camera.includes("!lunarRover?.driving&&welcomeIsOpen('basil')"));
 const board=app.slice(app.indexOf('function boardLunarRover('),app.indexOf('function exitLunarRover('));
 assert.ok(board.indexOf('showcaseTreeClearance?.restore();')<board.indexOf('lunarTreeClearance ||= createRoverTreeClearance'));
 assert.ok(welcome.includes("classList.toggle('showing-basil-welcome',visible)"));
 assert.ok(welcome.includes("classList.remove('showing-basil-welcome')"));
 assert.ok(welcome.includes('if(!slides.length)'));
 assert.ok(welcome.includes("!document.body.classList.contains('driving-lunar-rover')"));
 for(const id of ['movement','interact','flyover-quick-controls'])assert.ok(css.includes('.showing-basil-welcome #'+id));
});
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import {ENTRANCE_STAGE,usesEntranceStage,entranceShowcasePose} from '../playable-3d/entrance-showcase.mjs';
import {resolveCampusDestination} from '../playable-3d/campus-destinations.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const config=JSON.parse(await read('world-config.json'));
test('Default player, Basil, helper and home shortcuts agree on the ECC forecourt',async()=>{
 assert.deepEqual(config.extraNpcs.find(n=>n.id==='basil').position,[ENTRANCE_STAGE.basil.x,ENTRANCE_STAGE.basil.z]);
 assert.equal(usesEntranceStage(config),true);const custom=structuredClone(config);custom.extraNpcs[0].position=[-20,10];assert.equal(usesEntranceStage(custom),false,'do not override a teacher-positioned Basil');
 const arrival=resolveCampusDestination(config,'arrival');assert.deepEqual([arrival.x,arrival.z],[ENTRANCE_STAGE.player.x,ENTRANCE_STAGE.player.z]);
 const app=await read('playable-3d/app.js');assert.ok(app.includes('worlds.teleport(false,ENTRANCE_STAGE.player.x,ENTRANCE_STAGE.player.z)'));assert.ok(app.includes("welcomeIsOpen('basil')&&usesEntranceStage(config)"));assert.ok(!app.includes('ECC_HOME'));assert.ok(!app.includes('worlds.teleport(false,-7,23.3)'));
 const cast=await read('playable-3d/neutral-cast.mjs');assert.ok(cast.includes('ENTRANCE_STAGE.helper.x,0,ENTRANCE_STAGE.helper.z'));assert.ok(cast.includes('basilEntranceYaw'));
});
test('Welcome framing keeps ECC crest, Basil feet/head and distant Lab outside the panel',()=>{
 for(const [width,height]of [[1280,720],[1600,900],[390,844],[430,932]]){
  const pose=entranceShowcasePose(width/height),camera=new THREE.PerspectiveCamera(pose.fov,width/height,.08,200);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.setViewOffset(width,height,width*pose.shiftX,height*pose.shiftY,width,height);camera.updateMatrixWorld();
  for(const [label,point]of [['ECC crest',[2.6,2,-3.4]],['Basil feet',[7.1,.16,1.7]],['Basil head',[7.1,1.94,1.7]],['Lab logo',[38,5.9,-65.1]]]){const p=new THREE.Vector3(...point).project(camera),x=(p.x+1)/2,y=(1-p.y)/2;assert.ok(x>.02&&x<.97&&y>.12&&y<.9,`${label} inside ${width}×${height}`);if(width<600)assert.ok(y<.49,`${label} stays above bottom panel`);else assert.ok(x<.58,`${label} stays left of panel`);}
 }
});
test('First visible greeting includes the Lab, rover and refreshed static-ground soles',async()=>{
 const app=await read('playable-3d/app.js'),npc=await read('playable-3d/teacher-npc.js');
 assert.ok(app.indexOf('curiosHub.installSigns();lunarRover ||=')<app.indexOf('await castReady;extraCast.refreshGrounding();'));
 assert.ok(npc.includes('c=>!c.isSensor()&&c.parent()===null'));assert.ok(npc.includes('Math.max(rendered,hit?.normal.y>=.9?.65-hit.timeOfImpact:0)'));assert.ok(npc.includes('surface+HALF+RADIUS+.025'));
 assert.ok(app.includes('echo?.tap?.(event,camera)'));
});
test('Returning visitors receive every changed entrance module and only scoped scene removals',async()=>{
 const app=await read('playable-3d/app.js'),world=await read('playable-3d/world.js'),model=await read('playable-3d/ecc-preview/model.js'),cast=await read('playable-3d/neutral-cast.mjs');
 for(const name of ['world.js','lunar-rover.mjs','neutral-cast.mjs','welcome-player.mjs','curios-hub.mjs','campus-destinations.mjs'])assert.ok(app.includes(name+'?v=entrance-stage-4'),name);
 assert.ok(cast.includes('teacher-npc.js?v=entrance-stage-4'));assert.ok(world.includes('campus-landscape.js?v=entrance-stage-4'));assert.ok(world.includes('ecc-preview/model.js?v=entrance-stage-4'));assert.ok(model.includes('authored-courtyard.js?v=entrance-stage-4'));
 const courtyard=await read('playable-3d/ecc-preview/authored-courtyard.js'),garden=await read('playable-3d/ecc-preview/authored-garden.js'),landscape=await read('playable-3d/campus-landscape.js');
 assert.ok(garden.includes('[7.6,11.1,1.05,1.4]'),'the shared tree kit stays unchanged');assert.ok(courtyard.includes('[7.2,10.9,4.7,2]'),'retain the planted bed');assert.ok(courtyard.includes('treeSites:[[-8.2,4.9,1.1,.4],[-6.6,-6.4,1.32,2.1],[-10,-4,1.4,.6],[10.8,-3,1.5,2.3]]'));
 assert.ok(landscape.includes('if((x===16&&z===-3)||(x===18&&z===-21))return;'));
 assert.ok(!world.includes('pondTime'));assert.ok(!world.includes('Garden pond rippled water'));
});
