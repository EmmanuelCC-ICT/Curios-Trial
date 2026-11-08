import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLunarDrivingUI} from '../playable-3d/lunar-driving-ui.mjs';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
const three=new URL('../playable-3d/vendor/three/build/three.module.js',import.meta.url).href;
const cameraSource=await readFile(new URL('../playable-3d/lunar-driving-camera.mjs',import.meta.url),'utf8');
const {roverCameraPose,createRoverTreeClearance}=await import('data:text/javascript;base64,'+Buffer.from(cameraSource.replace("'three'",JSON.stringify(three))).toString('base64'));

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
