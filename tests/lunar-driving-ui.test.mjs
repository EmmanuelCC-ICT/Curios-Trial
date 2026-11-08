import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLunarDrivingUI} from '../playable-3d/lunar-driving-ui.mjs';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
const three=new URL('../playable-3d/vendor/three/build/three.module.js',import.meta.url).href;
const cameraSource=await readFile(new URL('../playable-3d/lunar-driving-camera.mjs',import.meta.url),'utf8');
const {roverCameraPose,createRoverTreeClearance,dragCameraElevation,applyCameraElevation,dragWalkingElevation,walkingLensTilt,cameraElevation}=await import('data:text/javascript;base64,'+Buffer.from(cameraSource.replace("'three'",JSON.stringify(three))).toString('base64'));

class Element {
 constructor(command){this.dataset={};if(command)this.dataset.drive=command;this.listeners={};this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};this.attributes={};}
 setAttribute(name,value){this.attributes[name]=value;}
 addEventListener(name,handler){(this.listeners[name]||=[]).push(handler);}
 setPointerCapture(){}
 dispatch(type,props={}){for(const h of this.listeners[type]||[])h({button:0,pointerId:1,preventDefault(){},...props});}
 set innerHTML(value){this.markup=value;this.buttons=['left','right','forward','reverse'].map(c=>new Element(c));this.special=Object.fromEntries(['view','recover','brake'].map(n=>[n,new Element()]));}
 querySelectorAll(selector){return selector==='[data-drive]'?this.buttons:[...this.buttons,...Object.values(this.special||{})].filter(b=>b.classes.has('pressed'));}
 querySelector(selector){return this.special[selector.slice(6,-1)];}
}
function fixture(){const document=new Element();document.defaultView=new Element();document.body={append(){}};document.createElement=()=>new Element();let time=1000,allowed=true,recovered=0,views=0,braked=0;const ui=createLunarDrivingUI({document,now:()=>time,canDrive:()=>allowed,onRecover:()=>recovered++,onView:()=>views++,onBrake:()=>braked++});return {ui,document,advance(n){time+=n;},allow(v){allowed=v;},counts:()=>({recovered,views,braked})};}
test('Mobile rover holds forward/reverse and steering independently; releases and cancellation stop them',()=>{
 const f=fixture(),ui=f.ui;ui.setActive(true);const [left,,forward,reverse]=ui.panel.buttons;
 forward.dispatch('pointerdown',{pointerId:1});left.dispatch('pointerdown',{pointerId:2});assert.deepEqual(ui.read(),{throttle:1,steer:1});
 forward.dispatch('pointerup',{pointerId:1});assert.deepEqual(ui.read(),{throttle:0,steer:1});
 reverse.dispatch('pointerdown',{pointerId:3});assert.deepEqual(ui.read(),{throttle:-1,steer:1});
 reverse.dispatch('pointercancel',{pointerId:3});left.dispatch('lostpointercapture',{pointerId:2});assert.deepEqual(ui.read(),{throttle:0,steer:0});
});
test('Mobile rover clears input on hidden/blur/pause, Stop, camera, recovery and dismount',()=>{
 const f=fixture(),ui=f.ui;ui.setActive(true);const forward=ui.panel.buttons[2];
 for(const action of [()=>f.document.dispatch('visibilitychange'),()=>f.document.defaultView.dispatch('blur'),()=>ui.panel.special.brake.onclick(),()=>ui.panel.special.view.onclick(),()=>ui.panel.special.recover.onclick(),()=>{f.allow(false);ui.read();f.allow(true);},()=>{ui.setActive(false);ui.setActive(true);}]){forward.dispatch('pointerdown');action();assert.equal(ui.read().throttle,0);}
 assert.deepEqual(f.counts(),{recovered:1,views:1,braked:1});ui.setView('Reverse view');assert.equal(ui.panel.special.view.textContent,'Camera: Reverse view');
});
test('Accessible click gives a bounded nudge and cannot leave the rover driving after release',()=>{
 const f=fixture(),ui=f.ui;ui.setActive(true);const reverse=ui.panel.buttons[3];reverse.dispatch('click');assert.equal(ui.read().throttle,-1);f.advance(221);assert.equal(ui.read().throttle,0);
 reverse.dispatch('pointerdown');reverse.dispatch('pointerup');reverse.dispatch('click');assert.equal(ui.read().throttle,0);
});
test('Rover camera has distinct overhead, follow and reverse views; drag orbit changes the view without steering',()=>{
 const p=new THREE.Vector3(0,0,0),top=roverCameraPose(p,0,{view:0,aspect:.46}),follow=roverCameraPose(p,0,{view:1,aspect:.46}),reverse=roverCameraPose(p,0,{view:2,aspect:.46}),orbit=roverCameraPose(p,0,{view:1,orbit:Math.PI/2});
 assert.ok(top.position.y>=17);assert.ok(follow.position.z<0);assert.ok(reverse.position.z>0);assert.ok(orbit.position.x<0);assert.equal(orbit.target.x,0);assert.ok(follow.position.distanceTo(p)<13);
});
test('Vertical orbit preserves the default pose, distance and heading with safe elevation bounds',()=>{
 const target=new THREE.Vector3(2,1.25,3),base=new THREE.Vector3(4,3.1,9),radius=base.distanceTo(target);
 assert.ok(applyCameraElevation(base.clone(),target,0).equals(base));
 const up=applyCameraElevation(base.clone(),target,dragCameraElevation(0,100)),down=applyCameraElevation(base.clone(),target,dragCameraElevation(0,-100));
 assert.ok(up.y>base.y);assert.ok(down.y<base.y);
 for(const offset of [-1e6,-1.2,0,.6,1.2,1e6]){
  const eye=applyCameraElevation(base.clone(),target,offset),delta=eye.clone().sub(target),angle=Math.atan2(delta.y,Math.hypot(delta.x,delta.z));
  assert.ok(Math.abs(eye.distanceTo(target)-radius)<1e-12);assert.ok(angle>=.08-1e-12&&angle<=1.4+1e-12);
  assert.ok(Math.abs(delta.x/delta.z-1/3)<1e-12);
 }
 assert.equal(dragCameraElevation(0,1e9),1.4-.3);assert.equal(dragCameraElevation(0,-1e9),.08-.3);
 for(const base of [.26,1.2]){const top=dragCameraElevation(0,1e6,base),bottom=dragCameraElevation(0,-1e6,base);assert.ok(dragCameraElevation(top,-1,base)<top);assert.ok(dragCameraElevation(bottom,1,base)>bottom);}
});
test('All rover presets allow independent vertical and horizontal drag in portrait and desktop',()=>{
 const p=new THREE.Vector3(12,.085,3),saved=p.clone();
 for(const aspect of [.46,1.78])for(const view of [0,1,2]){
  const base=roverCameraPose(p,2.7,{view,aspect}),neutral=roverCameraPose(p,2.7,{view,aspect,elevation:0});
  assert.ok(base.position.equals(neutral.position));
  for(const elevation of [-.6,.6]){
   const changed=roverCameraPose(p,2.7,{view,aspect,orbit:.4,elevation});
   assert.ok(changed.target.equals(base.target));assert.ok(!changed.position.equals(base.position));
   assert.ok(Math.abs(changed.position.distanceTo(changed.target)-base.position.distanceTo(base.target))<1e-12);
   assert.ok(changed.position.y>changed.target.y);
  }
 }
 assert.ok(p.equals(saved),'looking must not move or steer the vehicle');
});
test('Real canvas mouse/touch handlers consume both axes and stop on release or cancellation',async()=>{
 const app=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8');
 const source=app.split('\n').find(line=>line.trim().startsWith("canvas.addEventListener('pointerdown'"));
 function fixture(driving){
  const setup="let mode='town',entryReady=true,curiosHub=null,intro=null,discovery=null,echo=null,flyover=null,drag=null,yaw=0,lunarCameraOrbit=0,lunarCameraElevation=0,lookElevation=0,lookBaseElevation=.3,lunarCameraView=1,lunarCameraBaseElevation=.3,chapelTilt=0;const lunarRover={driving},explorationMenuOpen=()=>false,helperPicker={open:()=>false},tapTeacher=()=>{},listeners={},canvas={addEventListener:(type,fn)=>listeners[type]=fn,focus(){},setPointerCapture(){}};";
  return new Function('driving','dragCameraElevation','dragWalkingElevation',setup+source+";return {fire:(type,e)=>listeners[type]({clientX:100,clientY:100,pointerId:1,...e}),read:()=>({yaw,lunarCameraOrbit,lunarCameraElevation,lookElevation,drag})};")(driving,dragCameraElevation,dragWalkingElevation);
 }
 for(const pointerType of ['mouse','touch'])for(const driving of [false,true]){
  const f=fixture(driving);f.fire('pointerdown',{pointerType});f.fire('pointermove',{clientX:160,clientY:180,pointerType});
  const a=f.read();assert.equal(driving?a.lunarCameraOrbit:a.yaw,-.36);assert.equal(driving?a.lunarCameraElevation:a.lookElevation,.48);
  f.fire('pointermove',{clientX:160,clientY:10000});const limit=driving?f.read().lunarCameraElevation:f.read().lookElevation;f.fire('pointermove',{clientX:160,clientY:9990});const reversed=f.read();assert.ok((driving?reversed.lunarCameraElevation:reversed.lookElevation)<limit,'reverse immediately after overshooting a limit');
  f.fire('pointerup',{});f.fire('pointermove',{clientX:300,clientY:400});assert.deepEqual(f.read(),{...reversed,drag:null});
  for(const event of ['pointercancel','lostpointercapture']){f.fire('pointerdown',{});f.fire(event,{});assert.equal(f.read().drag,null);}
 }
 assert.ok(app.indexOf('applyCameraElevation(desiredCamera,lookAt,Math.max(0,lookElevation)')>app.indexOf('const rocket=mode'));
 assert.ok(app.indexOf('applyCameraElevation(desiredCamera,lookAt,Math.max(0,lookElevation)')<app.indexOf('worlds.protectCamera(space(),p,desiredCamera)'));
 assert.match(app,/roverCameraPose[^;]+elevation:lunarCameraElevation/);
 assert.equal((app.match(/lunarCameraOrbit=0;lunarCameraElevation=0;/g)||[]).length,4,'board, view, recovery and Recenter reset both axes');
 assert.match(app,/\$\('recenter'\)[^\n]+lookElevation=0/);
});
test('Driving view clears only occluding tree instances and restores them without changing walls or assets',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(0,5,8);camera.lookAt(0,1,0);camera.updateMatrixWorld();
 const tree=new THREE.InstancedMesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshBasicMaterial(),2);tree.name='Courtyard eucalyptus authored bark';const a=new THREE.Matrix4().makeTranslation(0,3,4),b=new THREE.Matrix4().makeTranslation(20,3,4);tree.setMatrixAt(0,a);tree.setMatrixAt(1,b);scene.add(tree);
 const wall=new THREE.Mesh(new THREE.BoxGeometry(2,4,2),new THREE.MeshBasicMaterial());wall.position.set(0,3,2);wall.name='School wall';scene.add(wall);
 const clear=createRoverTreeClearance(scene);clear.update(camera,new THREE.Vector3(0,1,0),1,true);assert.ok(clear.hiddenCount>0);const actual=new THREE.Matrix4();tree.getMatrixAt(0,actual);assert.equal(actual.determinant(),0);tree.getMatrixAt(1,actual);assert.ok(actual.equals(b));assert.equal(wall.visible,true);
 clear.restore();tree.getMatrixAt(0,actual);assert.ok(actual.equals(a));assert.equal(clear.hiddenCount,0);
 // Welcome must relinquish its mask before the rover takes ownership, then
 // parking and reopening must restore the same original instance matrices.
 const rover=createRoverTreeClearance(scene);rover.update(camera,new THREE.Vector3(0,1,0),2,true);rover.restore();tree.getMatrixAt(0,actual);assert.ok(actual.equals(a));
 clear.update(camera,new THREE.Vector3(0,1,0),3,true);clear.restore();tree.getMatrixAt(0,actual);assert.ok(actual.equals(a));
});
test('App wires mobile recovery, drag view and camera collision; touch controls do not hide behind the mini-map',async()=>{
 const app=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8'),css=await readFile(new URL('../playable-3d/lunar-driving.css',import.meta.url),'utf8');
 assert.match(app,/function resetNavigationInput\(\)\{lunarDrivingUI\?\.reset\(\);if\(lunarRover\?\.driving\)lunarRover\.stop\(\)/);assert.match(app,/const result=lunarRover\.recover\(\)/);assert.match(app,/lunarRover\.stop\(\)/);assert.match(app,/lunarCameraOrbit=drag\.roverOrbit/);assert.match(app,/RAPIER\.QueryFilterFlags\.EXCLUDE_SENSORS/);assert.match(app,/lunarTreeClearance\?\.restore\(\)/);assert.match(app,/z-=drivingInput\.throttle/);
 assert.match(css,/\.driving-lunar-rover #movement/);assert.match(css,/\.driving-lunar-rover #flyover-quick-controls/);assert.match(css,/#curios-mini-map[^}]+display:none!important/s);assert.match(css,/min-height:48px/);
});
test('Follow view shows the horizon and can pitch well above it without lowering the eye below its safe orbit',()=>{
 const rover=new THREE.Vector3(0,0,0);
 const neutral=roverCameraPose(rover,0,{view:1});
 const raised=roverCameraPose(rover,0,{view:1,elevation:-2});
 const pitch=pose=>pose.tilt-Math.atan2(pose.position.y-pose.target.y,Math.abs(pose.position.z-pose.target.z));
 assert.ok(pitch(neutral)>-.12);
 assert.ok(pitch(raised)>.8);
 assert.ok(raised.position.y>raised.target.y);
 assert.equal(raised.target.z,0);
});
test('Walking camera can aim at the rocket nose from close range without dropping the eye',()=>{
 const eye=new THREE.Vector3(0,3.1,7),target=new THREE.Vector3(0,1.25,0);
 const nose=new THREE.Vector3(0,36.3,-5);
 const base=cameraElevation(eye,target);
 const drag=dragWalkingElevation(0,-210,base);
 const camera=new THREE.PerspectiveCamera(55,1,.08,275);
 camera.position.copy(eye);
 camera.lookAt(target);
 assert.ok(nose.clone().project(camera).y>1);
 camera.rotateX(walkingLensTilt(eye,target,drag));
 camera.updateMatrixWorld();
 assert.ok(Math.abs(nose.clone().project(camera).y)<.8);
 assert.ok(camera.position.equals(eye));
 const upwardTarget=new THREE.Vector3(0,14,0),upwardBase=cameraElevation(eye,upwardTarget);
 assert.equal(dragWalkingElevation(0,0,upwardBase),0,'authored upward framing survives without drag');
 const limit=dragWalkingElevation(0,-10000,upwardBase);
 assert.ok(dragWalkingElevation(limit,1,upwardBase)>limit);
});
