import * as THREE from 'three';

export const ROVER_VIEWS=['Top view','Follow view','Reverse view'];
export function cameraElevation(position,target){return Math.atan2(position.y-target.y,Math.hypot(position.x-target.x,position.z-target.z));}
export function dragCameraElevation(start,deltaY,base=.3,lookUp=0){return THREE.MathUtils.clamp(start+deltaY*.006,.08-base-lookUp,1.4-base);}
// Orbit vertically around the existing subject, keeping distance and horizontal
// heading. Bounds prevent flipping overhead or dropping beneath the ground.
// The caller still applies its normal scene collision checks after this step.
export function applyCameraElevation(position,target,elevation=0,minElevation=.08){
 if(!elevation)return position;
 const dx=position.x-target.x,dy=position.y-target.y,dz=position.z-target.z;
 const horizontal=Math.hypot(dx,dz),radius=Math.hypot(horizontal,dy);
 if(horizontal<.0001||radius<.0001)return position;
 const angle=THREE.MathUtils.clamp(Math.atan2(dy,horizontal)+elevation,minElevation,1.4),scale=Math.cos(angle)*radius/horizontal;
 return position.set(target.x+dx*scale,target.y+Math.sin(angle)*radius,target.z+dz*scale);
}
const MAX_WALK_PITCH=1.46;

export function dragWalkingElevation(start,deltaY,base){
 return THREE.MathUtils.clamp(start+deltaY*.006,Math.min(0,-MAX_WALK_PITCH-base),Math.max(0,1.4-base));
}

export function walkingLensTilt(position,target,elevation){
 // Upward drag tilts the lens without lowering the collision-tested eye.
 return Math.min(Math.max(0,-elevation),Math.max(0,MAX_WALK_PITCH+cameraElevation(position,target)));
}

export function roverCameraPose(position,heading,{view=0,orbit=0,elevation=0,aspect=1}={}){
 const angle=heading+orbit,portrait=aspect<.8;
 const distance=view===0?(portrait?6:7):view===2?8:(portrait?10:8.5);
 const height=view===0?(portrait?19:17):view===2?6:3.35;
 const sign=view===2?1:-1;
 const target=new THREE.Vector3(position.x,position.y+1.15,position.z),eye=new THREE.Vector3(position.x+Math.sin(angle)*distance*sign,position.y+height,position.z+Math.cos(angle)*distance*sign);
 const baseElevation=cameraElevation(eye,target),boundedElevation=dragCameraElevation(elevation,0,baseElevation,view===1?1:0);
 // Follow view can tilt the lens above the horizon after the eye reaches
 // its ground-safe limit. Wall and tree checks still aim at the actual rover.
 const tilt=view===1?.16+Math.max(0,.08-baseElevation-boundedElevation):0;
 return {position:applyCameraElevation(eye,target,boundedElevation),target,tilt,fov:view===1?60:55,baseElevation,elevation:boundedElevation};
}

function isTree(mesh){
 for(let o=mesh;o;o=o.parent)if(/eucalypt|multistem|tree|foliage|authored bark|authored leaves/i.test(o.name||''))return true;
 return [mesh.material].flat().some(m=>/leaf|leaves|bark|branch|trunk/i.test(m?.name||''));
}
// Hide only the individual tree instances between the view and rover. Never
// edit source geometry/materials or remove physical obstacles. Restore on exit.
export function createRoverTreeClearance(scene){
 const ray=new THREE.Raycaster(),matrix=new THREE.Matrix4(),hidden=[],seen=new Set();let last=-Infinity;
 function restore(){for(const h of hidden){if(h.instance!==undefined){h.mesh.setMatrixAt(h.instance,h.matrix);h.mesh.instanceMatrix.needsUpdate=true;}else h.mesh.visible=h.visible;}hidden.length=0;seen.clear();}
 function update(camera,target,time=0,force=false){
  if(!force&&time-last<.15)return;last=time;restore();scene.updateMatrixWorld(true);
  const candidates=[];scene.traverse(o=>{if(o.isMesh&&o.visible&&isTree(o))candidates.push(o);});
  const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),offsets=[new THREE.Vector3(),right.clone().multiplyScalar(.9),right.clone().multiplyScalar(-.9),new THREE.Vector3(0,1,0)];
  for(const offset of offsets){const end=target.clone().add(offset),direction=end.sub(camera.position),distance=direction.length();ray.set(camera.position,direction.normalize());ray.near=0;ray.far=Math.max(0,distance-.3);
   for(const hit of ray.intersectObjects(candidates,false)){const mesh=hit.object,key=mesh.uuid+':'+(hit.instanceId??'mesh');if(seen.has(key))continue;seen.add(key);
    if(hit.instanceId!==undefined){mesh.getMatrixAt(hit.instanceId,matrix);hidden.push({mesh,instance:hit.instanceId,matrix:matrix.clone()});mesh.setMatrixAt(hit.instanceId,new THREE.Matrix4().makeScale(0,0,0));mesh.instanceMatrix.needsUpdate=true;}
    else{hidden.push({mesh,visible:mesh.visible});mesh.visible=false;}
   }
  }
 }
 return {update,restore,get hiddenCount(){return hidden.length;}};
}
