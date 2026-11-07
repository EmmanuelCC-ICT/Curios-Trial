import * as THREE from 'three';

// Curios Year 8 lunar pavilion, positioned southeast of the oval.
// Original recovered procedural geometry, with walkable floors and a clear front approach.
export const LUNAR_SITE = Object.freeze({ x:36, z:-69, arrivalX:36, arrivalZ:-57 });
const material = (color, metalness=.25, roughness=.42, extra={}) =>
  new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const pearl=material(0xe2eaf0,.55,.3), dark=material(0x102338,.7,.32);
const cyan=material(0x00ebe3,.3,.2,{emissive:0x00a6a4,emissiveIntensity:.7});
const metal=material(0x567282,.85,.25), gold=material(0xf3c950,.7,.3);
const glass=material(0x50d1e6,.27,.16,{transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false});
const stone=material(0xc4cdd3,.05,.88), solar=material(0x193a65,.7,.2);
function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(p,w,h,d,m,x,y,z)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
const ball=(p,r,m,x,y,z)=>mesh(p,new THREE.SphereGeometry(r,32,20),m,x,y,z);
const cyl=(p,rt,rb,h,m,x,y,z,n=32)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
function sign(parent,top,bottom,x,y,z,w=8){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');
 g.fillStyle='#091b32';g.fillRect(0,0,1024,256);g.lineWidth=9;g.strokeStyle='#04e7e2';g.strokeRect(8,8,1008,240);
 g.textAlign='center';g.fillStyle='white';g.font='900 94px system-ui';g.fillText(top,512,122);
 g.font='600 35px system-ui';g.fillStyle='#00e6dc';g.fillText(bottom,512,190);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 return mesh(parent,new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),x,y,z);
}
function solarWing(parent,x,z){
 cyl(parent,.08,.12,2.0,metal,x,1.1,z);
 const rack=box(parent,4.4,.13,2.4,metal,x,2.12,z);rack.rotation.x=-.22;
 for(let col=0;col<4;col++)for(let row=0;row<2;row++){
  const cell=box(parent,.95,.03,1.05,solar,x+(col-1.5)*1.06,2.21,z+(row-.5)*1.13);
  cell.rotation.x=-.22;
  box(parent,.05,.04,.96,cyan,x+(col-1.5)*1.06,2.25,z+(row-.5)*1.13);
 }
}
export function installLunarLab(scene,physics){
 if(scene.getObjectByName('Curios Lunar Lab'))return scene.getObjectByName('Curios Lunar Lab');
 const root=new THREE.Group();root.name='Curios Lunar Lab';root.position.set(LUNAR_SITE.x,0,LUNAR_SITE.z);scene.add(root);
 cyl(root,10,10.4,.15,dark,0,.07,0,64).userData.walkable=true;
 const halo=mesh(root,new THREE.TorusGeometry(9.8,.12,12,80),cyan,0,.16,0);halo.rotation.x=Math.PI/2;
 cyl(root,8.5,8.7,.13,stone,0,.19,0,64).userData.walkable=true;
 // Open-front lunar research habitat with a panoramic geodesic roof.
 box(root,12.1,.48,8.6,dark,0,.53,-1.8).userData.walkable=true;
 // Two broad shallow steps connect the open front to the habitat floor.
 box(root,3.4,.17,1.0,stone,0,.335,3.75).userData.walkable=true;
 box(root,3.4,.35,.7,stone,0,.425,2.95).userData.walkable=true;
 for(const x of [-5.8,5.8]){
  box(root,.42,4.65,8.2,pearl,x,2.86,-1.8);
  box(root,.1,4.1,8,cyan,x+Math.sign(x)*.26,2.85,-1.8);
 }
 box(root,11.8,3.6,.24,dark,0,2.9,-5.87);
 for(const x of [-4.5,-2.25,0,2.25,4.5])box(root,.1,3.5,.25,metal,x,2.9,-5.72);
 for(const x of [-5.42,5.42])box(root,.13,3.75,7.55,glass,x,2.9,-1.8);
 box(root,12.7,.28,9.1,pearl,0,5.39,-1.8);
 const dome=mesh(root,new THREE.SphereGeometry(4.85,48,24,0,Math.PI*2,0,Math.PI/2),glass,0,5.56,-1.8);
 dome.scale.set(1.15,.55,.85);
 for(let a=0;a<12;a++){
  const angle=a*Math.PI/6;const pts=[];
  for(let k=0;k<=16;k++){const theta=k*Math.PI/32;pts.push(new THREE.Vector3(Math.sin(theta)*Math.cos(angle)*5.57,5.57+Math.cos(theta)*2.67,-1.8+Math.sin(theta)*Math.sin(angle)*4.12));}
  for(let k=1;k<pts.length;k++){const diff=pts[k].clone().sub(pts[k-1]);const seg=cyl(root,.035,.035,diff.length(),metal,0,0,0,8);seg.position.copy(pts[k].clone().add(pts[k-1]).multiplyScalar(.5));seg.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());}
 }
 // Lit entrance, with no wall across the walkway.
 for(const x of [-5.1,5.1])box(root,.3,4.35,.3,pearl,x,2.8,2.45);
 box(root,11,.2,.31,cyan,0,5.0,2.44);
 sign(root,'CURIOS','BEYOND EARTH  •  YEAR 8',0,5.85,2.65,8.0);
 sign(root,'LUNAR LAB','EXPLORE  •  CONNECT  •  CREATE',0,2.25,-5.69,7.7);
 // Raised moon, craters, halo and engineering workstations.
 ball(root,1.32,stone,-3.1,3,-2.2);
 const craters=[[-.52,.39,.91,.29],[.4,.48,.9,.19],[-.1,-.47,1.07,.25]];
 for(const [x,y,z,r] of craters){const c=ball(root,r,material(0x929ba6,.04,.95),-3.1+x,3+y,-2.2+z);c.scale.z=.15;}
 const orbit=mesh(root,new THREE.TorusGeometry(1.66,.065,12,64),cyan,-3.1,3,-2.2);orbit.rotation.y=.35;
 box(root,4.4,.17,2.2,metal,3.1,1.35,-2.4);
 for(const x of [1.2,5])for(const z of [-3.25,-1.45])box(root,.12,1.15,.12,pearl,x,.74,z);
 // Lunar rover displayed beside the approach path.
 const rover=new THREE.Group();rover.position.set(-5.0,.35,5.75);rover.rotation.y=-.25;root.add(rover);
 box(rover,2.8,.48,1.7,pearl,0,.62,0);box(rover,1.3,.45,1.2,gold,0,1.06,-.2);
 for(const x of [-1.36,1.36])for(const z of [-.94,.94]){const wheel=cyl(rover,.34,.34,.24,dark,x,.35,z,22);wheel.rotation.z=Math.PI/2;ball(rover,.09,cyan,x,.35,z);}
 cyl(rover,.045,.045,1.1,metal,.4,1.62,-.2);ball(rover,.26,glass,.4,2.25,-.2);
 solarWing(root,7.3,-3.6);solarWing(root,-7.3,-3.6);
 for(let i=0;i<7;i++)box(root,2.35,.05,1.0,stone,0,.14,9.7+i*1.18);
 sign(root,'MOON MISSION','MAKE IT MATTER',5.6,1.75,6.8,4.1);
 box(root,.15,1.2,.15,metal,5.6,.75,6.75);
 cyl(root,.23,.33,4.8,metal,8.85,2.5,4.8);ball(root,.52,cyan,8.85,5.12,4.8);
 if(physics){
  for(const [x,y,z,w,h,d] of [[-5.8,2.86,-1.8,.42,4.65,8.2],[5.8,2.86,-1.8,.42,4.65,8.2],[0,2.9,-5.87,11.8,3.6,.24],[-5,1.1,5.75,3.2,1.6,2.2],[3.1,1.0,-2.4,4.4,1.4,2.2]])physics.block(LUNAR_SITE.x+x,y,LUNAR_SITE.z+z,w,h,d);
 }
 return root;
}
