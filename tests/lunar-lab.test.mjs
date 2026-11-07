import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import RAPIER from '../playable-3d/vendor/rapier/rapier.mjs';

const source = await readFile(new URL('../playable-3d/curios-lunar-lab.mjs', import.meta.url), 'utf8');
const threeURL = new URL('../playable-3d/vendor/three/build/three.module.js', import.meta.url).href;
// Execute the actual garden and geometry utilities, resolving browser import-map aliases for Node.
const dataModule=text=>'data:text/javascript;base64,'+Buffer.from(text).toString('base64');
const resolveThree=text=>text.replaceAll("'three'",JSON.stringify(threeURL));
const utilsURL=dataModule(resolveThree(await readFile(new URL('../playable-3d/vendor/three/examples/jsm/utils/BufferGeometryUtils.js',import.meta.url),'utf8')));
const gardenURL=dataModule(resolveThree(await readFile(new URL('../playable-3d/ecc-preview/authored-garden.js',import.meta.url),'utf8')).replace("'three/addons/utils/BufferGeometryUtils.js'",JSON.stringify(utilsURL)));
const {installLunarLab, LUNAR_SITE, LUNAR_LAYOUT,lunarApproachFraming,updateLunarLab} = await import(dataModule(resolveThree(source).replace("'./ecc-preview/authored-garden.js'",JSON.stringify(gardenURL))));
const worldSource = await readFile(new URL('../playable-3d/world.js', import.meta.url), 'utf8');
await RAPIER.init();

function install(scene, physics) {
  const previous = globalThis.document;
  globalThis.document = {createElement(tag) {
    assert.equal(tag, 'canvas');
    return {getContext: () => ({
      clearRect() {}, fillRect() {}, strokeRect() {}, fillText() {},
      beginPath() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
      createLinearGradient() { return {addColorStop() {}}; },
      createRadialGradient() { return {addColorStop() {}}; }
    })};
  }};
  try { return installLunarLab(scene, physics); }
  finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}

function fixture() {
  const scene = new THREE.Scene();
  const world = new RAPIER.World({x:0, y:-9.81, z:0});
  const blocks = [];
  const block = (x,y,z,w,h,d) => {
    blocks.push([x,y,z,w,h,d]);
    return world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z));
  };
  block(6,-.1,-20,92,.2,116);
  const root = install(scene, {block});
  // Execute the app's actual walking-surface converter, not a test-only approximation.
  const start = worldSource.indexOf('function addWalkingSurfaces(root){');
  const end = worldSource.indexOf('\n  function loadExterior()', start);
  assert.ok(start >= 0 && end > start);
  const sync = new Function('THREE','RAPIER','townPhysics','walkingSurfaces', worldSource.slice(start,end) + '; return addWalkingSurfaces;')(THREE,RAPIER,{world},new WeakSet());
  sync(scene);
  return {scene,world,root,blocks,sync};
}

function walker(world, x, z, feet=0) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x,feet+.785,z));
  const collider = world.createCollider(RAPIER.ColliderDesc.capsule(.56,.20),body);
  const controller = world.createCharacterController(.025);
  controller.enableAutostep(.52,.16,true);
  controller.enableSnapToGround(.38);
  controller.setSlideEnabled(true);
  let velocity=0;
  world.step();
  const position=()=>{const p=body.translation();return {x:p.x,y:p.y-.785,z:p.z};};
  const step=(dx=0,dz=0)=>{
    velocity=controller.computedGrounded()?-.1:Math.max(-12,velocity-9.81/60);
    controller.computeColliderMovement(collider,{x:dx,y:velocity/60,z:dz});
    const move=controller.computedMovement(), p=body.translation();
    body.setNextKinematicTranslation({x:p.x+move.x,y:p.y+move.y,z:p.z+move.z});
    world.step();return position();
  };
  return {position,step};
}

test('Lunar Lab installation and walking-surface synchronization are idempotent',()=>{
  const f=fixture();
  try {
    const count=f.world.colliders.len(), children=f.root.children.length;
    assert.equal(install(f.scene,{block(){assert.fail('duplicate collider');}}),f.root);
    f.sync(f.scene);
    assert.equal(f.world.colliders.len(),count);
    assert.equal(f.root.children.length,children);
    assert.deepEqual(f.root.position.toArray(),[LUNAR_SITE.x,0,LUNAR_SITE.z]);
    for(const name of ['Main hall walkable floor','Entrance threshold','Low curved entrance forecourt']) {
      const surface=f.root.getObjectByName(name);
      assert.ok(surface?.userData.walkable,`${name} must have a walking surface`);
      const top=new THREE.Box3().setFromObject(surface).max.y;
      assert.ok(top>0 && top<=LUNAR_LAYOUT.floorY+1e-5,`${name} must stay low and accessible`);
      if(name!=='Low curved entrance forecourt')assert.ok(Math.abs(top-LUNAR_LAYOUT.floorY)<1e-5);
    }
    assert.ok(f.blocks.length>6,'hall and segmented outer walls need physical boundaries');
  } finally {f.world.free();}
});

test('Rapier capsule crosses the forecourt and threshold, rests inside and returns to lawn',()=>{
  const f=fixture();
  try {
    const w=walker(f.world,LUNAR_SITE.arrivalX,LUNAR_SITE.arrivalZ);
    for(let i=0;i<30;i++)w.step();
    for(let i=0;i<300;i++) {
      const p=w.step(0,-.05);
      assert.ok(p.y>-.025,'feet must not fall through ground');
      if(p.z<LUNAR_SITE.z+LUNAR_LAYOUT.frontZ-.5)assert.ok(p.y>LUNAR_LAYOUT.floorY-.025,`feet penetrate hall floor: ${JSON.stringify(p)}`);
    }
    assert.ok(w.position().z<LUNAR_SITE.z,'front entrance must be traversable');
    for(let i=0;i<60;i++)w.step();
    assert.ok(Math.abs(w.position().y-LUNAR_LAYOUT.floorY)<.025,'standing feet match rendered floor');
    for(let i=0;i<380;i++)w.step(0,.05);
    for(let i=0;i<60;i++)w.step();
    assert.ok(w.position().z>LUNAR_SITE.z+17,'return route must stay open beyond the paving');
    assert.ok(Math.abs(w.position().y)<.025,'feet return to lawn height');
  } finally {f.world.free();}
});

test('Rapier prevents walking through the rear and remaining front-side walls',()=>{
  for(const [startZ,dx,dz,check] of [
    [.8,0,-.05,p=>p.z>LUNAR_SITE.z+LUNAR_LAYOUT.rearZ+.30 && p.z<LUNAR_SITE.z+LUNAR_LAYOUT.rearZ+.45],
    [2.5,-.05,0,p=>p.x>LUNAR_SITE.x-3.36 && p.x<LUNAR_SITE.x-3.20],
    [2.5,.05,0,p=>p.x<LUNAR_SITE.x+3.36 && p.x>LUNAR_SITE.x+3.05],
    [-5,-.05,0,p=>p.x>LUNAR_SITE.x-3.36 && p.x<LUNAR_SITE.x-3.20],
    [-5,.05,0,p=>p.x<LUNAR_SITE.x+3.36 && p.x>LUNAR_SITE.x+3.20]
  ]) {
    const f=fixture();
    try {
      const w=walker(f.world,LUNAR_SITE.x,LUNAR_SITE.z+startZ,LUNAR_LAYOUT.floorY);
      for(let i=0;i<180;i++)w.step(dx,dz);
      assert.ok(check(w.position()),`wall penetration: ${JSON.stringify(w.position())}`);
      assert.ok(Math.abs(w.position().y-LUNAR_LAYOUT.floorY)<.025,'feet remain on the hall floor');
    } finally {f.world.free();}
  }
});

test('Rapier can enter both galleries through the hall passages and return',()=>{
  for(const direction of [-1,1]) {
    const f=fixture();
    try {
      const w=walker(f.world,LUNAR_SITE.x,LUNAR_SITE.z-1,LUNAR_LAYOUT.floorY);
      for(let i=0;i<130;i++){
        const p=w.step(direction*.05,0);
        assert.ok(Math.abs(p.y-LUNAR_LAYOUT.floorY)<.03,'passage must have continuous flooring');
      }
      assert.ok((w.position().x-LUNAR_SITE.x)*direction>6,'gallery passage must not be blocked');
      for(let i=0;i<130;i++)w.step(-direction*.05,0);
      assert.ok(Math.abs(w.position().x-LUNAR_SITE.x)<.1,'return to central hall stays clear');
    } finally {f.world.free();}
  }
});

test('Rapier outer gallery boundaries stop a capsule across multiple chord seams',()=>{
  for(const [cx,cz,r,side] of [[LUNAR_LAYOUT.domeX,LUNAR_LAYOUT.domeZ,LUNAR_LAYOUT.domeRadius,-1],[LUNAR_LAYOUT.wingX,LUNAR_LAYOUT.wingZ,LUNAR_LAYOUT.wingRadius,1]]) {
    for(const angle of [-1.2,-.8,-.4,0,.4,.8,1.2]) {
      const f=fixture();
      try {
        const dx=side*Math.cos(angle),dz=Math.sin(angle);
        const w=walker(f.world,LUNAR_SITE.x+cx+dx*r*.55,LUNAR_SITE.z+cz+dz*r*.55,LUNAR_LAYOUT.floorY);
        for(let i=0;i<100;i++)w.step(dx*.05,dz*.05);
        const p=w.position(),distance=Math.hypot(p.x-LUNAR_SITE.x-cx,p.z-LUNAR_SITE.z-cz);
        assert.ok(distance<r-.15 && distance>r-.8,`outer wall must stop rather than leak or block early: ${JSON.stringify({cx,angle,distance,r})}`);
        assert.ok(Math.abs(p.y-LUNAR_LAYOUT.floorY)<.03,'outer boundary keeps feet on gallery floor');
      } finally {f.world.free();}
    }
  }
});

test('Lunar approach framing fades smoothly outside the site and when looking away',()=>{
  const at=(x,z,yaw=0,aspect=1)=>lunarApproachFraming({x:LUNAR_SITE.x+x,z:LUNAR_SITE.z+z},yaw,aspect);
  assert.equal(at(0,14).weight,1);
  assert.equal(at(0,4).weight,1,'camera should frame the close entrance');
  for(const [x,z,yaw] of [[0,.4,0],[0,29,0],[18,14,0],[-18,14,0],[0,14,Math.PI]])assert.ok(Math.abs(at(x,z,yaw).weight)<1e-12);
  for(const p of [at(0,2.2),at(0,24.5),at(14.5,14)])assert.ok(p.weight>0 && p.weight<1);
  for(const z of [.4,4,20,29])assert.ok(Math.abs(at(0,z-.001).weight-at(0,z+.001).weight)<1e-5,'framing joins must be smooth');
  assert.equal(at(0,14,0,1.8).distance,14.5);
  assert.equal(at(0,14).fov,48);
  assert.ok(at(0,14,0,.5).distance>at(0,14,0,1.8).distance,'portrait framing must pull back');
});

test('Lunar exhibits animate while paused and reduced-motion states remain still',()=>{
  const root=install(new THREE.Scene());
  const names=['Cratered lunar exhibit','Rotating Earth exhibit','Moving lunar orbital sculpture','Moving Earth orbital sculpture','Roof satellite dish'];
  const objects=names.map(name=>{const o=root.getObjectByName(name);assert.ok(o,`missing ${name}`);return o;});
  const snapshot=()=>objects.map(o=>({rotation:o.rotation.toArray(),position:o.position.toArray()}));
  updateLunarLab(root,0);
  const initial=snapshot();updateLunarLab(root,5);const moved=snapshot();
  objects.forEach((o,i)=>{
    assert.notDeepEqual(moved[i].rotation,initial[i].rotation,`${names[i]} must move`);
    assert.deepEqual(moved[i].position,initial[i].position,'animation must not shift exhibits into walkways');
    assert.ok(moved[i].rotation.slice(0,3).every(Number.isFinite));
  });
  updateLunarLab(root,15,{paused:true});assert.deepEqual(snapshot(),moved,'pause freezes all exhibit transforms');
  updateLunarLab(root,15,{reducedMotion:true});const reduced=snapshot();
  updateLunarLab(root,40,{reducedMotion:true});assert.deepEqual(snapshot(),reduced,'reduced motion must not animate with time');
  updateLunarLab(root,50,{paused:true,reducedMotion:true});assert.deepEqual(snapshot(),reduced);
  updateLunarLab(root,5);assert.deepEqual(snapshot(),moved,'animation is deterministic and can resume');
  assert.doesNotThrow(()=>updateLunarLab(null,1));
  assert.doesNotThrow(()=>updateLunarLab(new THREE.Group(),1));
});

test('Entry signage uses larger mission lettering, corrected arrows and uncropped gallery artwork',()=>{
  const bannerSource=source.slice(source.indexOf('function missionBanner('),source.indexOf('function centralHall('));
  assert.match(bannerSource,/800 108px Arial/);
  assert.match(bannerSource,/700 83px Arial/);
  for(const title of ['↖  LUNAR LAB','←  OVAL','↓  MARKETS'])assert.ok(source.includes(`fillText('${title}'`),`missing directory direction ${title}`);
  const wingSource=source.slice(source.indexOf('function roundedWing('),source.indexOf('function dish('));
  assert.match(wingSource,/banner\.offset\.set\(\.0,\.0\)/);
  assert.match(wingSource,/banner\.repeat\.set\(1,1\)/);
});

test('Lunar Lab has the reference silhouette and detailed visitor exhibits',()=>{
  const root=install(new THREE.Scene());
  root.updateWorldMatrix(true,true);
  const named=name=>{const object=root.getObjectByName(name);assert.ok(object,`missing ${name}`);return object;};
  const dome=named('Lunar Lab geodesic conservatory');
  const hall=named('Curved central Lunar Lab entrance');
  const gallery=named('Rounded lunar exhibition gallery');
  const dish=named('Roof satellite dish');
  assert.ok(dome.position.x<hall.position.x && hall.position.x<gallery.position.x,'dome, entrance and gallery must read left to right');
  assert.ok(dish.position.y>4.5 && dish.position.x>0,'dish must sit above the right wing');
  const facade=named('Arched charcoal entrance facade');
  assert.equal(facade.geometry.type,'ExtrudeGeometry');
  const domeBounds=new THREE.Box3().setFromObject(dome), facadeBounds=new THREE.Box3().setFromObject(facade);
  assert.ok(domeBounds.getSize(new THREE.Vector3()).x>9,'dome must be a substantial left-hand volume');
  assert.ok(facadeBounds.max.y>domeBounds.max.y,'arched central identity must rise above the dome');
  const glazing=named('Triangulated dome glazing');
  assert.ok(glazing.geometry.index.count>300,'dome must have triangulated glazing');
  assert.ok(dome.children.some(o=>o.isInstancedMesh && o.count>100),'dome must retain its visible structural lattice');
  for(const name of ['Cratered lunar exhibit','Detailed lunar exploration rover','Native rock garden and planting'])named(name);
  named('Curios Moon Mission graphic banner');
  const garden=named('Lunar Lab native garden');
  assert.ok(garden.userData.plantInstances>50,'real authored garden must be populated');
  let plantDetail=0;garden.traverse(o=>{if(o.isLOD)plantDetail++;});
  assert.ok(plantDetail>0,'authored planting keeps its distance-detail levels');
  const forecourt=named('Low curved entrance forecourt');
  assert.ok(forecourt.geometry.attributes.normal.getY(0)>.99,'forecourt must face upwards');
  const bounds=new THREE.Box3().setFromObject(root);
  assert.ok(bounds.max.x<52 && bounds.min.z> -78,'building and forecourt must remain within campus ground');
});

test('Lunar map marker supplies a self-contained moon logo and mini map deep-clones its image',async()=>{
  const hub=await readFile(new URL('../playable-3d/curios-hub.mjs',import.meta.url),'utf8');
  const svg=await readFile(new URL('../playable-3d/assets/curios/lunar-lab.svg',import.meta.url),'utf8');
  assert.match(hub,/marker\('Curios Lunar Lab',LUNAR_SITE\.arrivalX,LUNAR_SITE\.arrivalZ,[^;]+,'\.\/assets\/curios\/lunar-lab\.svg'\)/);
  // Source-level DOM contract: the marker embeds the supplied image, and the
  // mini map keeps all descendants rather than rebuilding text-only pins.
  assert.match(hub,/if\(image\)\{const img=document\.createElement\('img'\);img\.src=image;[^}]*logo\.append\(img\);b\.append\(logo\)/);
  assert.match(hub,/const smallPlan=plan\.cloneNode\(true\)/);
  assert.match(hub,/mini\.append\(header,smallPlan\)/);
  assert.match(svg,/^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 256 256"/);
  assert.match(svg,/aria-label="[^"]*moon[^"]*orbit[^"]*"/);
  assert.match(svg,/<circle\b[^>]*fill="url\(#moon\)"/);
  assert.match(svg,/<ellipse\b/);
  // Validate balanced element structure and local paint references without
  // adding a browser/XML package dependency to this static repository.
  const stack=[],ids=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const match of svg.matchAll(/<\s*(\/?)([\w:.-]+)\b([^<>]*)>/g)) {
    const [,closing,name,attributes]=match;
    if(closing)assert.equal(stack.pop(),name,`unbalanced SVG element ${name}`);
    else if(!attributes.trimEnd().endsWith('/'))stack.push(name);
  }
  assert.deepEqual(stack,[]);
  for(const [,id] of svg.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.has(id),`missing local paint ${id}`);
  assert.doesNotMatch(svg,/<(?:script|image|foreignObject|use)\b|\b(?:href|src|onload)\s*=|<!DOCTYPE|<!ENTITY/i);
  assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"',''),/(?:https?:|data:|\/\/)|url\(\s*[^#]/i,'logo cannot fetch external content');
});

test('Lunar dialog guards repeat opening, keyboard input and both navigation loops',async()=>{
  const hub=await readFile(new URL('../playable-3d/curios-hub.mjs',import.meta.url),'utf8');
  const app=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8');
  assert.match(hub,/if\(moonDialog\?\.open\)return;/);
  assert.match(hub,/dialogOpen:\(\)=>map\.open\|\|Boolean\(moonDialog\?\.open\)/);
  assert.match(hub,/moonDialog\.addEventListener\('close',\(\)=>\{resume\(\);canvas\.focus/);
  assert.match(app,/window\.addEventListener\('keydown',e=>\{if\(curiosHub\?\.dialogOpen\(\)/);
  assert.match(app,/function canStepNavigation\(\)\{\s*return !curiosHub\?\.dialogOpen\(\)/);
  assert.match(app,/else if\(!curiosHub\?\.dialogOpen\(\)&&!discoveryHandover/);
  assert.match(app,/const paused=[^\n]*curiosHub\?\.dialogOpen\(\)/);
});
