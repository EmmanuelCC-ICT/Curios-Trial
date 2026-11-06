import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Bake static transforms and merge only meshes with identical material/shadow state.
// This retains all triangles, UVs, normals and material objects: no visual reduction.
export function batchStatic(root){
 root.updateMatrixWorld(true);
 const groups=new Map(),result=new T.Group();result.name=root.name;
 root.traverse(o=>{
  if(!o.isMesh)return;
  if(o.isInstancedMesh||o.isSkinnedMesh||Array.isArray(o.material))throw new Error('Static batching requires ordinary single-material meshes');
  const material=o.material;
  // Keep individual transparent sorting surfaces intact.
  if(material.transparent){const mesh=new T.Mesh(o.geometry,material);mesh.matrix.copy(o.matrixWorld);mesh.matrixAutoUpdate=false;mesh.castShadow=o.castShadow;mesh.receiveShadow=o.receiveShadow;mesh.renderOrder=o.renderOrder;result.add(mesh);return;}
  const key=[material.uuid,o.castShadow,o.receiveShadow,o.renderOrder].join(':');
  let geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
  if(geometry.index){const expanded=geometry.toNonIndexed();geometry.dispose();geometry=expanded;}
  if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
  if(!groups.has(key))groups.set(key,{material,castShadow:o.castShadow,receiveShadow:o.receiveShadow,renderOrder:o.renderOrder,geometries:[]});
  groups.get(key).geometries.push(geometry);
 });
 for(const {material,castShadow,receiveShadow,renderOrder,geometries}of groups.values()){
  const geometry=mergeGeometries(geometries,false);if(!geometry)throw new Error('Incompatible static mesh attributes');
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const mesh=new T.Mesh(geometry,material);mesh.castShadow=castShadow;mesh.receiveShadow=receiveShadow;mesh.renderOrder=renderOrder;result.add(mesh);
  geometries.forEach(g=>g.dispose());
 }
 return result;
}

// Small spatial batches let the renderer cull off-screen plants. All original
// instance matrices and full-detail geometry are retained, including shadows.
export function partitionInstances(root,{cellSize=12,filter=()=>true}={}){
 const meshes=[];root.traverse(o=>{if(o.isInstancedMesh&&o.count>1&&!(o.parent?.isLOD&&o.parent.levels.some(level=>level.object===o))&&filter(o))meshes.push(o);});
 let before=0,after=0;
 for(const original of meshes){
  const cells=new Map(),m=new T.Matrix4();before++;
  for(let i=0;i<original.count;i++){
   original.getMatrixAt(i,m);const key=`${Math.floor(m.elements[12]/cellSize)},${Math.floor(m.elements[14]/cellSize)}`;
   if(!cells.has(key))cells.set(key,[]);cells.get(key).push({index:i,matrix:m.clone()});
  }
  if(cells.size===1){after++;continue;}
  for(const entries of cells.values()){
   const mesh=new T.InstancedMesh(original.geometry,original.material,entries.length);mesh.name=original.name;
   mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);mesh.scale.copy(original.scale);
   mesh.castShadow=original.castShadow;mesh.receiveShadow=original.receiveShadow;mesh.renderOrder=original.renderOrder;
   mesh.userData={...original.userData,spatialBatch:true};
   entries.forEach(({index,matrix},i)=>{mesh.setMatrixAt(i,matrix);if(original.instanceColor){const colour=new T.Color();original.getColorAt(index,colour);mesh.setColorAt(i,colour);}});
   mesh.computeBoundingBox();mesh.computeBoundingSphere();original.parent.add(mesh);after++;
  }
  original.removeFromParent();original.dispose();
 }
 return {before,after};
}
