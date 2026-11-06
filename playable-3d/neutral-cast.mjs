import {createTeacherNPC,TEACHERS} from './teacher-npc.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSelectedHelper} from './helper-model.js';
import {config,npcInfo} from './world-settings.mjs';
let dialog;
export function showNpc(id,details=npcInfo(id)){
 if(!details.enabled||!details.dialogue)return;
 if(!dialog){dialog=document.createElement('dialog');dialog.id='npc-dialog';const heading=document.createElement('h2'),text=document.createElement('p'),close=document.createElement('button');heading.id='npc-heading';text.id='npc-message';close.textContent='Close';close.onclick=()=>dialog.close();dialog.setAttribute('aria-labelledby','npc-heading');dialog.append(heading,text,close);document.body.append(dialog);}
 dialog.querySelector('h2').textContent=details.name;dialog.querySelector('p').textContent=details.dialogue;
 if(!dialog.open)dialog.showModal();
}
export function createNeutralGuide({scene,onPause=()=>{}}){
 const fallback=()=>{const root=new THREE.Group();return {root};};
 const model=createSelectedHelper(fallback);scene.add(model.root);model.root.position.set(-5.85,0,22.7);let visible=true;
 return {root:model.root,resources:null,resourcesNear:()=>false,showResources:()=>{},showHelp:()=>{},close:()=>dialog?.close(),open:()=>false,markMarketVisited:()=>{},guidance:()=>{},nextPreparation:()=>null,
 async selectHelper(helper){if(helper.id==='echo'&&!npcInfo('echo').enabled)helper={id:'none',model:null};visible=Boolean(helper.model);await model.select(helper);},setHidden(value){visible=!value;},
 near:p=>visible&&model.root.position.distanceTo(p)<2.5,
 show(){onPause();showNpc('echo');},
 interaction(p){const details=npcInfo('echo');return visible&&details.enabled&&details.dialogue&&model.root.position.distanceTo(p)<2.5?{label:'Talk to '+details.name,action:()=>{onPause();showNpc('echo');}}:null;},
 update(dt,p,camera,available,activeScene){model.root.visible=visible&&activeScene===scene;if(model.root.visible){const target=new THREE.Vector3(p.x+1.3,0,p.z+1.2);if(model.root.position.distanceTo(target)>2.5)model.root.position.lerp(target,Math.min(1,dt*2));model.root.lookAt(p.x,model.root.position.y,p.z);}},
 snapshot:()=>({neutral:true,helperStatus:model.status})};
}
export function createExtraCast(worlds){
 const scene=worlds.town,cast=[];const loader=new GLTFLoader();
 return {async load(){for(const item of config.extraNpcs.filter(n=>n.enabled)){try{if(item.model==='./assets/mr-psandodakis-20260917.glb'){const npc=await createTeacherNPC(worlds,{...TEACHERS.find(n=>n.id==='psandodakis'),id:item.id,name:item.name,spawn:{x:item.position[0],z:item.position[1]},fixed:true});npc.root.rotation.y=0;cast.push({item,root:npc.root,npc});continue;}const gltf=await loader.loadAsync(item.model);const root=gltf.scene,box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),scale=1.72/Math.max(size.y,.001);root.scale.setScalar(scale);root.position.set(item.position[0],-box.min.y*scale,item.position[1]);root.name='Teacher NPC / '+item.id;scene.add(root);const mixer=new THREE.AnimationMixer(root);const idle=gltf.animations.find(a=>/idle/i.test(a.name));if(idle)mixer.clipAction(idle).play();cast.push({item,root,mixer});}catch(error){console.warn('Additional character unavailable: '+item.name,error);}}},
 interaction(p){const n=cast.filter(n=>n.item.dialogue&&n.root.position.distanceTo(p)<2.5).sort((a,b)=>a.root.position.distanceTo(p)-b.root.position.distanceTo(p))[0];return n?{label:'Talk to '+n.item.name,action:()=>{n.npc?.react(n.root.position.clone().add(new THREE.Vector3(0,0,2)));showNpc(n.item.id,n.item);}}:null;},
 update(dt){if(!matchMedia('(prefers-reduced-motion: reduce)').matches)cast.forEach(n=>n.npc?n.npc.update(dt,n.root.position):n.mixer.update(dt));}};
}
