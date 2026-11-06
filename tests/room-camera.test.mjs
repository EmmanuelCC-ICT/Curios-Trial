import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
import {roomCameraPose} from '../playable-3d/room-camera.mjs';
import {createLocomotion} from '../playable-3d/locomotion.js';
test('small-room camera keeps both feet and head of every corner inside the view',()=>{
 for(const aspect of [.46,.75,1,1.777,2.6]){const pose=roomCameraPose(aspect),camera=new THREE.PerspectiveCamera(pose.fov,aspect,.08,220);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
 for(const x of [-6.9,0,6.9])for(const z of [-6.8,0,6.9])for(const y of [0,1.8]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.9&&Math.abs(p.y)<.9,`Corner must remain visible at aspect ${aspect}`);}}
});
test('room steering follows screen directions with a fixed front view',()=>{
 const yaw=roomCameraPose(1.777).steeringYaw;
 for(const [x,z,axis,sign]of [[0,-1,'z',-1],[0,1,'z',1],[-1,0,'x',-1],[1,0,'x',1]]){const controls=createLocomotion();let step;for(let i=0;i<60;i++)step=controls.step(x,z,yaw,false);assert.ok(step[axis]*sign>0);}
});
