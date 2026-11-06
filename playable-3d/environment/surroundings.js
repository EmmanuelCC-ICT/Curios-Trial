import {addExteriorLandmarks} from './exterior-landmarks.js?v=ecc-ba60122';
import {campusExtensions} from './campus-extensions.js?v=ecc-ba60122';
import {batchStatic} from './static-batching.js?v=ecc-ba60122';
import {addTeachingDetail} from './teaching-exteriors.js?v=ecc-ba60122';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {thinGeometry} from '../ecc-preview/authored-garden.js?v=ecc-ba60122';
// Stage 2 composition study. Reference-derived silhouettes, not enterable buildings.
export async function addSurroundings(scene,palette,treeSource){
 const existing=scene.getObjectByName('Approved campus surroundings and connections');if(existing)return existing;
 addExteriorLandmarks(scene,palette);
 await addTeachingDetail(scene,palette);
 const root=new T.Group();root.name='Approved campus surroundings and connections';
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.88});
 const stone=mat(0xc4bda7),glass=mat(0x668992),fin=mat(0x454c4b),roof=mat(0xb8c6c4),blue=mat(0x31596f);
 function box(g,w,h,d,m,x,y,z){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;g.add(o);return o;}
 // Home Economics is a low connecting roofline, subordinate to the hero Chapel.
 const extension=campusExtensions(root,palette);root.userData.extraBeds=extension.beds;
 // Reuse entry geometry; clone object transforms while retaining the same meshes/maps.
 const source=treeSource||(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('./assets/campus-landscape/mature-eucalypt-a-packed.glb')).scene;
 const tree=batchStatic(source.clone(true));tree.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(tree),center=bounds.getCenter(new T.Vector3()),height=bounds.max.y-bounds.min.y;
 const normal=new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z);
 // Staggered western and southern tree belt, outside the playing oval.
 const trees=[];
 // Compact tree-lined west/south boundary and the row beyond the oval.
 for(let i=0;i<25;i++)trees.push({x:-36+(i%2)*.6,z:-66+i*4,h:6.5+(i%4)*.3});
 for(let i=0;i<18;i++)trees.push({x:-32+i*4.3,z:34+(i%2)*.5,h:6.6+(i%3)*.3});
 for(let i=0;i<14;i++)trees.push({x:-27+i*4.1,z:-72+(i%2)*.5,h:6.5+(i%3)*.35});
 root.userData.treePlacements=trees;
 tree.traverse(o=>{
  if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(normal);
  const instances=geometry=>{const inst=new T.InstancedMesh(geometry,o.material,trees.length);inst.name='Oval edge eucalypts';trees.forEach(({x,z,h},i)=>{const scale=h/height;inst.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(x,0,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i*1.7),new T.Vector3(scale,scale,scale)));});inst.castShadow=inst.receiveShadow=true;inst.computeBoundingSphere();return inst;};
  if(!/^leaf/.test(o.material.name)){root.add(instances(geo));return;}
  // Retain every original trunk and source leaf; software Auto samples the
  // existing leaf quads. Hardware and explicit High keep the complete asset.
  const high=new T.Group(),low=new T.Group();high.add(instances(geo));low.add(instances(thinGeometry(geo,6,4)));
  const lod=new T.LOD();lod.name='Campus boundary tree detail';lod.userData.softwareDetail=true;lod.addLevel(high,0);lod.addLevel(low,Infinity);root.add(lod);
 });
 scene.add(root);return root;
}
