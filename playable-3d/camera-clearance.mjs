// Authored canopies and the Market roof overhang extend beyond wall colliders.
// Keep the view out of those roof volumes while retaining physics ray checks.
export function insideCanopy(camera){return camera.y>2.25&&camera.y<4.6&&[[-2,-11.32,2.3,3.8],[3.25,-10.9,1.9,4.55]].some(([x,z,w,d])=>Math.abs(camera.x-x)<w/2+.25&&Math.abs(camera.z-z)<d/2+.25)||camera.y>2.6&&camera.y<3.4&&Math.abs(camera.x-43)<6.75&&Math.abs(camera.z+25.7)<2.45;}
// Collision-checked view recovery for the isolated review; never bypass a wall.
export function keepOutdoorClearance(THREE,worlds,p,camera,yaw){
 const horizontal=Math.hypot(camera.position.x-p.x,camera.position.z-p.z);
 if(camera.position.distanceTo(p)>=2.8&&horizontal>=1.6&&!insideCanopy(camera.position))return false;
 for(const [angle,height] of [[0,3.1],[.6,3.1],[-.6,3.1],[1.1,3.1],[-1.1,3.1],[0,5.5],[0,8]]){
  const candidate=new THREE.Vector3(p.x+Math.sin(yaw+angle)*6.4,p.y+height,p.z+Math.cos(yaw+angle)*6.4);
  if(insideCanopy(candidate))continue;
  worlds.protectCamera(false,p,candidate);
  if(!insideCanopy(candidate)&&candidate.distanceTo(p)>=3&&Math.hypot(candidate.x-p.x,candidate.z-p.z)>=2.8){camera.position.copy(candidate);return true;}
 }
 return false;
}
export function keepChapelClearance(THREE,worlds,p,camera,yaw){
 if(camera.position.distanceTo(p)>=2&&Math.hypot(camera.position.x-p.x,camera.position.z-p.z)>=1.8)return false;
 for(const angle of [Math.PI/2,-Math.PI/2,Math.PI]){
  const candidate=new THREE.Vector3(p.x+Math.sin(yaw+angle)*2.7,p.y+1.95,p.z+Math.cos(yaw+angle)*2.7);
  candidate.x=Math.max(-10.5,Math.min(10.5,candidate.x));candidate.z=Math.max(-8.05,Math.min(8.05,candidate.z));
  worlds.protectCamera('chapel',p,candidate);
  if(candidate.distanceTo(p)>=2&&Math.hypot(candidate.x-p.x,candidate.z-p.z)>=1.8){camera.position.copy(candidate);return true;}
 }
 return false;
}

// Keep the familiar student follow view at Arrival Gardens. Exterior loading
// is independent of camera height; the optional aerial control owns overhead views.
export function campusEntryFraming(p,mobile=false){
 return {blend:0,distance:6.4,height:3.1,lookAhead:.6,bias:0,fov:mobile?62:55};
}
