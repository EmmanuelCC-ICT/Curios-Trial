import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../playable-3d/vendor/three/build/three.module.js';
const rootURL=new URL('../',import.meta.url),three=new URL('playable-3d/vendor/three/build/three.module.js',rootURL).href;
const moduleURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const resolve=source=>source.replaceAll("'three'",JSON.stringify(three));
const {createTeacherGrounding,sampleTeacherSurface}=await import(moduleURL(resolve(await readFile(new URL('playable-3d/teacher-grounding.mjs',rootURL),'utf8'))));

test('Basil samples the authored path at configured coordinates and ignores scenery',()=>{
 const scene=new THREE.Scene();
 const path=new THREE.Mesh(new THREE.BoxGeometry(4,.085,6));path.position.set(-7,.0425,25);path.userData.walkable=true;scene.add(path);
 const scenery=new THREE.Mesh(new THREE.BoxGeometry(1,3,1));scenery.position.set(-7,1.5,25);scene.add(scenery);
 assert.ok(Math.abs(sampleTeacherSurface(scene,-7,25)-.085)<1e-6);
 assert.equal(sampleTeacherSurface(scene,10,10),0);
 path.position.y=.2425;assert.ok(Math.abs(sampleTeacherSurface(scene,-7,25)-.285)<1e-6);
});

test('Actual Basil sole cache prevents dance and blended-pose sinking without flattening jumps',async()=>{
 const utils=moduleURL(resolve(await readFile(new URL('playable-3d/vendor/three/examples/jsm/utils/BufferGeometryUtils.js',rootURL),'utf8')));
 const loaderSource=resolve(await readFile(new URL('playable-3d/vendor/three/examples/jsm/loaders/GLTFLoader.js',rootURL),'utf8')).replace("'../utils/BufferGeometryUtils.js'",JSON.stringify(utils));
 const {GLTFLoader}=await import(moduleURL(loaderSource));
 const original=await readFile(new URL('playable-3d/assets/mr-psandodakis-20260917.glb',rootURL));
 const jsonLength=original.readUInt32LE(12),json=JSON.parse(original.subarray(20,20+jsonLength).toString());
 // Textures are irrelevant to deformation; strip them only from this in-memory test fixture.
 for(const mesh of json.meshes)for(const primitive of mesh.primitives)delete primitive.material;
 delete json.materials;delete json.textures;delete json.images;
 const jsonBytes=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(jsonBytes.length/4)*4,32);jsonBytes.copy(padded);
 const binary=original.subarray(20+jsonLength),glb=Buffer.alloc(20+padded.length+binary.length);
 glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(padded.length,12);glb.writeUInt32LE(0x4e4f534a,16);padded.copy(glb,20);binary.copy(glb,20+padded.length);
 const kit=await new GLTFLoader().parseAsync(glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
 const model=kit.scene,root=new THREE.Group();root.add(model);const bounds=new THREE.Box3();
 model.updateMatrixWorld(true);bounds.setFromObject(model,true);model.scale.multiplyScalar(1.78/bounds.getSize(new THREE.Vector3()).y);model.updateMatrixWorld(true);bounds.setFromObject(model,true);model.position.y-=bounds.min.y;
 const grounding=createTeacherGrounding(model,root,{surfaceY:.085});assert.equal(grounding.sampleCount,507);assert.equal(grounding.totalVertices,14434);
 const mixer=new THREE.AnimationMixer(model),clips={};
 for(const kind of ['agree','cheer','clap','dance_01']){
  const clip=kit.animations.find(c=>c.name.endsWith(kind)).clone();
  for(const track of clip.tracks)if(/(?:^|\.)Root\.position$/.test(track.name))for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}
  clips[kind]=clip;
 }
 const point=new THREE.Vector3();let checked=0;
 function verify(){const result=grounding.update();root.updateMatrixWorld(true);let min=Infinity;model.traverse(mesh=>{if(mesh.isSkinnedMesh)for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);min=Math.min(min,point.y);}});assert.ok(min>=.088-1e-5,`sole ${min}`);assert.ok(Math.abs(min-result.lowestWorldY)<1e-5);checked++;}
 for(const clip of Object.values(clips)){mixer.stopAllAction();const action=mixer.clipAction(clip).reset().play();for(let i=0;i<=48;i++){mixer.setTime(clip.duration*i/48);verify();}action.stop();}
 mixer.stopAllAction();const dance=mixer.clipAction(clips.dance_01).reset().play();mixer.update(.4);const nod=mixer.clipAction(clips.agree).reset().setEffectiveWeight(0).play();dance.fadeOut(.22);nod.fadeIn(.22);for(let i=0;i<18;i++){mixer.update(1/60);verify();}
 assert.ok(checked>200);
 // A positive authored vertical movement remains airborne, not pinned to the path.
 mixer.stopAllAction();model.position.y+=.4;const airborne=grounding.update();assert.ok(airborne.lowestWorldY>.3);assert.equal(airborne.rootY,.08800000000000001);
 model.position.y-=.4;grounding.setSurfaceY(.16);const courtyard=grounding.update();assert.ok(courtyard.lowestWorldY>=.163-1e-6,'the new courtyard base replaces the old path height');
});


test('Canvas taps tolerate a neutral helper without a tap handler',async()=>{
 const app=await readFile(new URL('playable-3d/app.js',rootURL),'utf8');
 assert.ok(app.includes('echo?.tap?.(event,camera)'));
 assert.ok(!app.includes('echo?.tap(event,camera)'));
});
