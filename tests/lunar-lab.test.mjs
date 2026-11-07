import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import RAPIER from '../playable-3d/vendor/rapier/rapier.mjs';

const source = await readFile(new URL('../playable-3d/curios-lunar-lab.mjs', import.meta.url), 'utf8');
const threeURL = new URL('../playable-3d/vendor/three/build/three.module.js', import.meta.url).href;
const {installLunarLab, LUNAR_SITE} = await import('data:text/javascript;base64,' + Buffer.from(source.replace("'three'", JSON.stringify(threeURL))).toString('base64'));
const worldSource = await readFile(new URL('../playable-3d/world.js', import.meta.url), 'utf8');
await RAPIER.init();

function install(scene, physics) {
  const previous = globalThis.document;
  globalThis.document = {createElement(tag) {
    assert.equal(tag, 'canvas');
    return {getContext: () => ({fillRect() {}, strokeRect() {}, fillText() {}})};
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
    const tops=[];
    f.root.traverse(o=>{if(o.userData.walkable)tops.push(new THREE.Box3().setFromObject(o).max.y);});
    assert.equal(tops.length,5);
    for(const height of [.145,.255,.42,.60,.77])assert.ok(tops.some(y=>Math.abs(y-height)<1e-5),`missing walking level ${height}`);
    assert.equal(f.blocks.length,6,'ground plus side walls, rear wall, rover and table');
  } finally {f.world.free();}
});

test('Rapier capsule walks up the front steps, rests above the floor and returns to lawn',()=>{
  const f=fixture();
  try {
    const w=walker(f.world,LUNAR_SITE.arrivalX,LUNAR_SITE.arrivalZ);
    for(let i=0;i<30;i++)w.step();
    for(let i=0;i<260;i++) {
      const p=w.step(0,-.05);
      assert.ok(p.y>-.025,'feet must not fall through ground');
      if(p.z<LUNAR_SITE.z+2.2)assert.ok(p.y>.74,`feet penetrate habitat floor: ${JSON.stringify(p)}`);
    }
    assert.ok(w.position().z<LUNAR_SITE.z,'front entrance must be traversable');
    for(let i=0;i<60;i++)w.step();
    assert.ok(Math.abs(w.position().y-.77)<.025,'standing feet match rendered floor');
    for(let i=0;i<300;i++)w.step(0,.05);
    for(let i=0;i<60;i++)w.step();
    assert.ok(w.position().z>LUNAR_SITE.arrivalZ+1,'return route must stay open');
    assert.ok(Math.abs(w.position().y)<.025,'feet return to lawn height');
  } finally {f.world.free();}
});

test('Rapier prevents walking through the back and side walls',()=>{
  for(const [dx,dz,check] of [[0,-.05,p=>p.z>LUNAR_SITE.z-5.56],[-.05,0,p=>p.x>LUNAR_SITE.x-5.4],[.05,0,p=>p.x<LUNAR_SITE.x+5.4]]) {
    const f=fixture();
    try {
      const w=walker(f.world,LUNAR_SITE.x,LUNAR_SITE.z+.8,.77);
      for(let i=0;i<180;i++)w.step(dx,dz);
      assert.ok(check(w.position()),`wall penetration: ${JSON.stringify(w.position())}`);
      assert.ok(w.position().y>.74,'feet remain above habitat floor');
    } finally {f.world.free();}
  }
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
