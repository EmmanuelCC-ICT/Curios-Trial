import {showWelcomeVideo,updateWelcomeAnchor,welcomeIsPlaying} from './welcome-player.mjs?v=player-only-1';
import {createTeacherNPC,TEACHERS} from './teacher-npc.js?v=player-only-1';
import * as THREE from 'three';
import {ENTRANCE_STAGE,usesEntranceStage,basilEntranceYaw} from './entrance-showcase.mjs?v=player-only-1';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSelectedHelper} from './helper-model.js';
import {config,npcInfo} from './world-settings.mjs?v=player-only-1';
let dialog,pages=[],page=0;
function renderDialogue(){dialog.querySelector('#npc-message').textContent=pages[page]||'';dialog.querySelector('[data-page]').textContent=pages.length>1?`${page+1} of ${pages.length}`:'';dialog.querySelector('[data-back]').disabled=page===0;dialog.querySelector('[data-next]').textContent=page===pages.length-1?'Explore Curios':'Next';dialog.querySelector('footer').hidden=pages.length<2;dialog.scrollTop=0;}
export function showNpc(id,details=npcInfo(id)){
 if(details.enabled&&details.videoEnabled&&details.id==='basil'){showWelcomeVideo(details);return;}
 if(!details.enabled||!details.dialogue)return;
 if(!dialog){dialog=document.createElement('dialog');dialog.id='npc-dialog';dialog.setAttribute('aria-labelledby','npc-heading');const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button'),text=document.createElement('p'),footer=document.createElement('footer'),back=document.createElement('button'),count=document.createElement('span'),next=document.createElement('button');heading.id='npc-heading';close.textContent='Close';close.onclick=()=>dialog.close();header.append(heading,close);text.id='npc-message';text.setAttribute('aria-live','polite');back.dataset.back='';back.textContent='Back';count.dataset.page='';next.dataset.next='';back.onclick=()=>{if(page>0){page--;renderDialogue();}};next.onclick=()=>{if(page<pages.length-1){page++;renderDialogue();}else dialog.close();};footer.append(back,count,next);dialog.append(header,text,footer);document.body.append(dialog);}
 pages=[];let chunk='';for(const paragraph of details.dialogue.split(/\n\s*\n/)){if(chunk&&chunk.length+paragraph.length>600){pages.push(chunk);chunk='';}chunk+=(chunk?'\n\n':'')+paragraph;}if(chunk)pages.push(chunk);page=0;dialog.querySelector('h2').textContent=details.name;renderDialogue();if(!dialog.open)dialog.showModal();dialog.querySelector('header button').focus({preventScroll:true});dialog.scrollTop=0;
}
export function createNeutralGuide({scene,onPause=()=>{}}){
 const fallback=()=>{const root=new THREE.Group();return {root};};
 const model=createSelectedHelper(fallback);scene.add(model.root);model.root.position.set(ENTRANCE_STAGE.helper.x,0,ENTRANCE_STAGE.helper.z);let visible=true;
 return {root:model.root,resources:null,resourcesNear:()=>false,showResources:()=>{},showHelp:()=>{},close:()=>dialog?.close(),open:()=>false,markMarketVisited:()=>{},guidance:()=>{},nextPreparation:()=>null,
 async selectHelper(helper){if(!npcInfo('echo').enabled)helper={id:'none',model:null};visible=Boolean(helper.model);await model.select(helper);},setHidden(value){visible=!value;},
 near:p=>visible&&model.root.position.distanceTo(p)<2.5,
 show(){onPause();showNpc('echo');},
 interaction(p){const details=npcInfo('echo');return visible&&details.enabled&&details.dialogue&&model.root.position.distanceTo(p)<2.5?{label:'Talk to '+details.name,action:()=>{onPause();showNpc('echo');}}:null;},
 update(dt,p,camera,available,activeScene){model.root.visible=visible&&activeScene===scene;if(model.root.visible){const target=new THREE.Vector3(p.x-1.5,0,p.z+.7);if(model.root.position.distanceTo(target)>2.5)model.root.position.lerp(target,Math.min(1,dt*2));model.root.lookAt(p.x,model.root.position.y,p.z);}},
 snapshot:()=>({neutral:true,helperStatus:model.status})};
}
export function createExtraCast(worlds){
 const welcomeAnchor={position:new THREE.Vector3(ENTRANCE_STAGE.player.x,0,ENTRANCE_STAGE.player.z)};
 return {async load(){},refreshGrounding(){},interaction(){return null;},
 update(dt,camera,mode,player){updateWelcomeAnchor('basil',welcomeAnchor,camera,mode,player);}};
}
