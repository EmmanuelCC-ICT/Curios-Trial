import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {downloadAvatar} from './avatar-download.js?v=avatarfix1-20260914';

const CENTER={x:-4,z:-54}, RX=8,RZ=4,HEIGHT=1.78,HALF=.58,RADIUS=.28;
export const onOval=(x,z)=>((x-CENTER.x)/RX)**2+((z-CENTER.z)/RZ)**2<=1;
export const TEACHERS=[
 {id:'middleton',name:'Mr Middleton',file:'mr-middleton-20260917.glb',spawn:{x:-7,z:-54},reactions:['wave','laugh','look'],clips:{walk:/walk$/,idle:/look_around$/,look:/look_around$/,wave:/wave_goodbye_02$/,laugh:/laugh_02$/}},
 {id:'psandodakis',name:'Mr Psandodakis',file:'mr-psandodakis-20260917.glb',spawn:{x:-1,z:-54},reactions:['nod','cheer','clap','dance'],clips:{walk:/walk$/,idle:/agree$/,nod:/agree$/,cheer:/cheer$/,clap:/clap$/,dance:/dance_01$/},stillIdle:true}
];
// Dedicated assets have no dependency on the player catalogue or Studio.
export async function createTeacherNPC(worlds,config=TEACHERS[0]){
 const bytes=await downloadAvatar('./assets/'+config.file);
 const kit=await new GLTFLoader().parseAsync(bytes,new URL('./assets/',location.href).href);
 const model=kit.scene,root=new THREE.Group();root.name=config.name;root.add(model);
 model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 const bounds=new THREE.Box3().setFromObject(model,true),size=bounds.getSize(new THREE.Vector3());
 model.scale.multiplyScalar(HEIGHT/size.y);model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 bounds.setFromObject(model,true);model.position.y-=bounds.min.y;
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const mixer=new THREE.AnimationMixer(model),actions={};
 for(const [key,pattern] of Object.entries(config.clips)){
  const clip=kit.animations.find(a=>pattern.test(a.name));
  if(!clip)throw new Error(config.name+' animation missing: '+key);
  // Keep navigation in the capsule. Preserve vertical body motion, remove root travel.
  let inPlace=clip.clone();
  // This export has no idle clip; rest in its authored neutral nod-start pose.
  if(key==='idle'&&config.stillIdle)inPlace=new THREE.AnimationClip('rest',1,clip.tracks.map(t=>new t.constructor(t.name,[0],Array.from(t.values.slice(0,t.getValueSize())))));
  for(const track of inPlace.tracks)if(/(?:^|\.)Root\.position$/.test(track.name)){
   for(let i=0;i<track.values.length;i+=3){track.values[i]=track.values[0];track.values[i+2]=track.values[2];}
  }
  actions[key]=mixer.clipAction(inPlace);
 }
 const physics=worlds.townPhysics,world=physics.world;
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(config.spawn.x,HALF+RADIUS+.025,config.spawn.z));
 const collider=world.createCollider(RAPIER.ColliderDesc.capsule(HALF,RADIUS),body);
 const controller=world.createCharacterController(.025);controller.enableSnapToGround(.25);controller.setSlideEnabled(true);
 root.position.set(config.spawn.x,0,config.spawn.z);worlds.town.add(root);
 let state='idle',timer=3,target=null,reaction=0,blocked=0;
 actions.idle.play();mixer.update(.1);if(config.fixed)root.rotation.y=Math.PI;
 function play(next){if(state===next)return;actions[state].fadeOut(.22);const a=actions[next];a.reset().setLoop(config.reactions.includes(next)?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=true;a.fadeIn(.22).play();state=next;}
 function pause(){target=null;blocked=0;timer=5+Math.random()*11;play('idle');}
 function chooseTarget(){const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.92;target={x:CENTER.x+Math.cos(angle)*RX*r,z:CENTER.z+Math.sin(angle)*RZ*r};timer=18;play('walk');}
 function turn(x,z,dt){const angle=Math.atan2(x,z),delta=Math.atan2(Math.sin(angle-root.rotation.y),Math.cos(angle-root.rotation.y));root.rotation.y+=delta*Math.min(1,dt*5);}
 return {
  root,id:config.id,name:config.name,
  stagePose(x,z,walking,dt){root.position.set(x,0,z);root.rotation.y=Math.PI;body.setTranslation({x,y:HALF+RADIUS+.025,z},true);body.setNextKinematicTranslation({x,y:HALF+RADIUS+.025,z});play(walking?'walk':'idle');mixer.update(dt);},
  near(p,d=5){return Math.hypot(p.x-root.position.x,p.z-root.position.z)<d;},
  react(p){if(config.reactions.includes(state))return false;if(!this.near(p,7))return false;target=null;const next=config.reactions[reaction++%config.reactions.length];play(next);timer=actions[next].getClip().duration;turn(p.x-root.position.x,p.z-root.position.z,1);return true;},
  fixedUpdate(dt,p){
   if(!this.near(p,42))return;
   if(config.fixed)return;
   if(!config.reactions.includes(state))timer-=dt;
   if(timer<=0){if(state==='idle')chooseTarget();else pause();}
   let dx=0,dz=0;
   if(state==='walk'&&target){const x=target.x-root.position.x,z=target.z-root.position.z,d=Math.hypot(x,z);if(d<.25)pause();else{dx=x/d*.8*dt;dz=z/d*.8*dt;turn(x,z,dt);}}
   controller.computeColliderMovement(collider,{x:dx,y:-.08,z:dz});
   const move=controller.computedMovement(),pos=body.translation();
   // Keep collision correction from adding sideways travel while idle or exceeding walking speed.
   const requested=Math.hypot(dx,dz),actual=Math.hypot(move.x,move.z),ratio=actual>requested?requested/actual:1;
   let x=pos.x+move.x*ratio,z=pos.z+move.z*ratio;
   if(!onOval(x,z)){x=pos.x;z=pos.z;pause();}
   const distance=Math.hypot(x-pos.x,z-pos.z);
   if(state==='walk'){blocked=distance<.8*dt*.2?blocked+dt:0;if(blocked>.6)pause();}
   body.setNextKinematicTranslation({x,y:pos.y+move.y,z});
   root.position.set(x,pos.y+move.y-HALF-RADIUS-.025,z);
  },
  update(dt,p){
   if(!this.near(p,42))return;
   // Greetings follow visible elapsed time, independently of capped physics catch-up.
   if(config.reactions.includes(state)){timer-=dt;if(timer<=0)pause();}
   mixer.update(config.reduced?0:dt);
  },
  snapshot(){return {id:config.id,name:config.name,state,visible:root.visible,position:root.position.toArray(),target,remaining:timer,reactions:reaction};},
  dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);world.removeCharacterController(controller);world.removeRigidBody(body);root.removeFromParent();const textures=new Set(),materials=new Set(),geometries=new Set();model.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
 };
}
