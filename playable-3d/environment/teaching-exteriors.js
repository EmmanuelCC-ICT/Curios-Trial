import * as T from 'three';
import {buildMedia} from './media-building.js?v=ecc-ba60122';
import {buildSpace} from './space-building.js?v=ecc-ba60122';
import {batchStatic} from './static-batching.js?v=ecc-ba60122';

// Complete authored silhouettes at entry. Trees and learning rooms are optional.
export function addTeachingExteriors(scene,palette,textures){
 const existing=scene.getObjectByName('Campus teaching building exteriors');if(existing)return existing;
 const root=new T.Group();root.name='Campus teaching building exteriors';
 for(const [build,x,z,yaw,scale]of [[buildMedia,-4,-37,Math.PI,.9],[buildSpace,18,-53,-Math.PI/2,.85]]){
  const source=build(palette,textures),shell=new T.Group();shell.name=source.name;shell.add(batchStatic(source));shell.position.set(x,0,z);shell.rotation.y=yaw;shell.scale.setScalar(scale);shell.traverse(mesh=>{if(mesh.isMesh&&mesh.material.name==='Media mural original artwork')mesh.onAfterRender=()=>{if(mesh.material.map.image?.width>1)mesh.material.userData.artworkDrawn=true;};});root.add(shell);
 }
 scene.add(root);return root;
}

export async function addTeachingDetail(scene,palette){
 const root=addTeachingExteriors(scene,palette);
 const {addTeachingInteriors}=await import('./learning-interiors.js?v=ecc-ba60122');
 addTeachingInteriors(root.children[0],root.children[1],palette);
 for(const shell of root.children)for(const name of ['Media learning rooms','SPACE learning hall']){
  const detail=shell.getObjectByName(name);if(detail&&!detail.userData.batched){shell.remove(detail);const batch=batchStatic(detail);detail.clear();detail.add(batch);detail.userData.batched=true;shell.add(detail);}
 }
 return root;
}
