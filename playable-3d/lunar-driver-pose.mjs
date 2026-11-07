import * as THREE from 'three';

// Align the retained character rig to the rover seat without replacing its model.
// All original bone transforms are restored before normal walking resumes.
export function createLunarDriverPose(model,rover){
 const bones=[];model.traverse(o=>{if(o.isBone)bones.push({bone:o,q:o.quaternion.clone()});});
 const find=name=>bones.find(({bone})=>bone.name.toLowerCase().endsWith(name.toLowerCase()))?.bone;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),forward=new THREE.Vector3(),q=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),delta=new THREE.Quaternion();
 const aim=(bone,child,direction)=>{if(!bone||!child)return;model.updateMatrixWorld(true);bone.getWorldPosition(a);child.getWorldPosition(b);b.sub(a);if(b.lengthSq()<1e-8)return;delta.setFromUnitVectors(b.normalize(),direction.clone().normalize());bone.getWorldQuaternion(q);q.premultiply(delta);bone.parent.getWorldQuaternion(parentQ).invert();bone.quaternion.copy(parentQ.multiply(q));};
 function update(){
  for(const state of bones)state.bone.quaternion.copy(state.q);
  model.position.copy(rover.seatPosition());model.rotation.y=rover.heading;model.updateMatrixWorld(true);
  forward.set(Math.sin(rover.heading),0,Math.cos(rover.heading));
  for(const side of ['Left','Right']){
   aim(find(side+'UpLeg'),find(side+'Leg'),forward.clone().multiplyScalar(.98).add(new THREE.Vector3(0,-.14,0)));
   aim(find(side+'Leg'),find(side+'Foot'),forward.clone().multiplyScalar(.07).add(new THREE.Vector3(0,-1,0)));
   aim(find(side+'Arm'),find(side+'ForeArm'),forward.clone().multiplyScalar(.5).add(new THREE.Vector3(0,-.8,0)));
   aim(find(side+'ForeArm'),find(side+'Hand'),forward.clone().multiplyScalar(.9).add(new THREE.Vector3(0,.05,0)));
  }
  const hips=find('Hips');if(hips){model.updateMatrixWorld(true);hips.getWorldPosition(a);const seat=rover.root.userData.seatCushionLocal||{x:0,y:1.18,z:-.38};b.set(seat.x,seat.y,seat.z);rover.root.localToWorld(b);model.position.add(b.sub(a));}
  model.updateMatrixWorld(true);
 }
 return {update,restore(){for(const state of bones)state.bone.quaternion.copy(state.q);model.updateMatrixWorld(true);}};
}
