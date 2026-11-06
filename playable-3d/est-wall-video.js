import * as THREE from 'three';
export function createESTWallVideo(scene){
 const video=document.createElement('video');video.hidden=true;
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(6.4,3.6),new THREE.MeshBasicMaterial({color:0x294640}));screen.name='Blank display for teacher content';screen.position.set(0,3.3,-6.48);scene.add(screen);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(6.58,3.78,.14),new THREE.MeshStandardMaterial({color:0x203d43,roughness:.7}));frame.position.set(0,3.3,-6.59);scene.add(frame);
 return {video,screen,ensurePoster:async()=>{},prepare:async()=>{},pause:()=>{}};
}
