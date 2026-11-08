import * as THREE from 'three';

export function sampleTeacherSurface(scene,x,z){
 scene.updateMatrixWorld(true);const surfaces=[];scene.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.walkable)surfaces.push(mesh);});
 const ray=new THREE.Raycaster(new THREE.Vector3(x,.65,z),new THREE.Vector3(0,-1,0),0,.8);
 const hit=ray.intersectObjects(surfaces,false).find(hit=>hit.face&&hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y>=.9);
 return hit?.point.y??0;
}

// Cache the small sole band once. Sampling its deformed vertices preserves the
// authored dance while preventing downward animation from entering the path.
export function createTeacherGrounding(model,root,{surfaceY=0,clearance=.003,soleBand=.015}={}){
 const point=new THREE.Vector3(),meshes=[],samples=[];
 root.updateMatrixWorld(true);let restMin=Infinity,totalVertices=0;
 model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const count=mesh.geometry.attributes.position.count;meshes.push({mesh,count});totalVertices+=count;for(let i=0;i<count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);restMin=Math.min(restMin,point.y-root.position.y);}});
 for(const {mesh,count} of meshes)for(let i=0;i<count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);if(point.y-root.position.y<=restMin+soleBand)samples.push({mesh,index:i});}
 return {
  sampleCount:samples.length,totalVertices,setSurfaceY(value){surfaceY=value;},
  update(){
   if(!samples.length)return;
   root.updateMatrixWorld(true);let soleMin=Infinity;
   for(const {mesh,index}of samples){mesh.getVertexPosition(index,point).applyMatrix4(mesh.matrixWorld);soleMin=Math.min(soleMin,point.y-root.position.y);}
   // Only correct penetration. Never force a lifted foot or a jump downward.
   root.position.y=surfaceY+clearance+Math.max(0,-soleMin);
   return {soleMin,rootY:root.position.y,lowestWorldY:soleMin+root.position.y};
  }
 };
}
