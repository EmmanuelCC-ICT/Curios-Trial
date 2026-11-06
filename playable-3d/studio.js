import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

export function createStudio(camera,canvas,environment){
  const studio=new THREE.Scene();studio.background=new THREE.Color(0xd8e3d5);studio.fog=new THREE.Fog(0xd8e3d5,4,12);studio.environment=environment.texture;studio.environmentIntensity=.4;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xd8e3d5,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;ground.receiveShadow=true;studio.add(ground);
  studio.add(new THREE.HemisphereLight(0xf5faf4,0x7a8f72,2.1));const key=new THREE.DirectionalLight(0xfff3dc,3.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=4;key.shadow.camera.bottom=-2;key.shadow.normalBias=.015;studio.add(key);
  const rim=new THREE.DirectionalLight(0xcfe9f1,1.4);rim.position.set(3,3,-2);studio.add(rim);
  const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.enablePan=false;orbit.enabled=false;
  return {studio,orbit};
}
