import {isRocketViewingArea,rocketApproachFraming} from "./rocket-site.mjs?v=rocket-launch-1";
import {createLunarRover,ROVER_DOCK} from './lunar-rover.mjs?v=player-only-1';
import RAPIER from '@dimforge/rapier3d-compat';
import {createLunarDrivingUI} from './lunar-driving-ui.mjs';
import {roverCameraPose,ROVER_VIEWS,createRoverTreeClearance,dragCameraElevation,applyCameraElevation,cameraElevation,dragWalkingElevation,walkingLensTilt} from './lunar-driving-camera.mjs?v=walking-sky-1';
import {createLunarDriverPose} from './lunar-driver-pose.mjs';
import {roomCameraPose} from './room-camera.mjs';
import {ENTRANCE_STAGE,usesEntranceStage,entranceShowcasePose} from './entrance-showcase.mjs?v=player-only-1';
import {welcomeViewShift,welcomeIsOpen} from './welcome-player.mjs?v=player-only-1';
import {createCuriosHub} from './curios-hub.mjs?v=map-toggle-1';
import {ROOM_POINTS,MENU_DESTINATIONS,resolveCampusDestination} from './campus-destinations.mjs?v=rocket-pad-1';
import {config,npcInfo,neutralLabel} from './world-settings.mjs?v=player-only-1';
import {createIsolatedStorage} from './world-storage.mjs';
import {createNeutralGuide,showNpc,createExtraCast} from './neutral-cast.mjs?v=player-only-1';
import {estEyeHeight,estPlayTop} from './est-camera.mjs?v=broad-integrated-20261014';
import {MARKET_APPROACH} from './landing.mjs?v=post-photo-tour-20261013';
import {createGpuFrameGate,createTextureUploadQueue} from './frame-budget.mjs?v=interaction-upload-priority-20261016';
import {needsSoftwarePresentation,createSoftwarePresentation} from './software-presentation.mjs?v=interaction-upload-priority-20261016';
import {renderQuality,rendererName} from './render-quality.mjs?v=ecc-ba60122';
import {withAssetDeadline,canClearDetailWarning} from './startup-assets.mjs?v=ecc-ba60122';
import {WHOLE_AVATARS} from './whole-avatar-catalog.mjs?v=named-students-20261011';
import {keepOutdoorClearance,keepChapelClearance,campusEntryFraming} from './camera-clearance.mjs?v=ecc-ba60122';
import {createLocomotion, STEP, turnTowards,accumulateTravelTime} from './locomotion.js?v=ecc-ba60122';
import {createHelperPicker} from './helper-picker.js?v=discovery-handover-20261021';
import {createFlyover} from './flyover.js?v=visible-controls-20261015';
import {configurePhoneAssets} from './phone-assets.js?v=phone-load-20260917';
import {createJoystick} from './joystick.js?v=1';
import {afterFirstPaint} from './deferred-textures.js?v=ecc-ba60122';
import {CHAPEL} from './chapel.js?v=opt2-20260914';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWorlds,sign} from './world.js?v=staged-entry-1';
import {LEGACY,EST,CAREERS} from './destinations.js?v=demo-20260914';
import {loadCharacterKit,loadProfileKit,createCharacter,createFallbackCharacter,isSimpleBody} from './characters.js?v=test-characters-20261013';
import {loadProfiles,saveProfiles,normaliseProfile,OPTIONS,SKIN,PHASES,TEST_CHARACTER_INFO,COLOUR_PRESETS} from './profiles.js?v=test-characters-20261013';

const $=id=>document.getElementById(id),canvas=$('scene');
// Pixel readback synchronises the GPU. Reserve it for explicit visual diagnostics.
const sharpRatio=Math.min(devicePixelRatio,1.5);
const pixelDiagnostics=new URLSearchParams(location.search).get('diagnostics')==='pixels';
const joystick=createJoystick($('movement'));
const icons=()=>window.lucide?.createIcons();
const entryParams=new URLSearchParams(location.search);
const adminReviewRequested=false;
const isolatedDiscovery=entryParams.get('review')==='1'&&entryParams.get('discovery')==='1';
const discoveryReview=false;
const reviewProfiles={getItem:()=>null,setItem:()=>{}};
const gameSession=null;
const gameStorage=createIsolatedStorage();
const journey=null;let discoveryHandover=null;let extraCast=null,curiosHub=null;
const state=loadProfiles(isolatedDiscovery?reviewProfiles:gameStorage);
let discovery=null,intro=null,explorationTools=null,revealCameraStart=null;
let frameGate,surfaceUploads,softwarePresentation,portraitCapturePending=false,lastUploadWorldPose=null;
let previewAssetsReady=false,presentedPreviewRequest=-1,submittedView=null;
let softwareNavigationAt=null,nativeNavigationAt=null;
let worlds,renderer,camera,studio,orbit,actor,preview,mode='town',phase='flourishing',draft,editorTab='identity';
let wardrobeSection='pants';
let nightMarket=null,orientationTour=null,orientationTourLoad=null,orientationTourAttempt=0,companionApply=null;
let echo=null;
const locomotion=createLocomotion();
let renderMotion=null;
const helperPicker=createHelperPicker({storage:gameStorage,guest:true,profile:()=>state.activeId,onOpen:()=>{closeExplorationOptions(false);echo?.close();if(actor)resetNavigationInput();},onClose:()=>{resetNavigationInput();canvas.focus({preventScroll:true});},onChange:(helper,persistent)=>{if(discovery?.snapshot().souvenir){companionOffered=true;gameStorage.setItem('ce-companion-offered','1');}companionApply=applySelectedCompanion(helper);if(!persistent&&actor)toast('Your guidance preference is selected for this tab. Browser storage is unavailable.');}});
document.getElementById('choose-helper').onclick=()=>helperPicker.choose(true);
document.getElementById('guidance-help').onclick=()=>showNpc('help',{name:config.title,enabled:true,dialogue:config.welcome+' Use WASD or arrow keys to walk, drag to look, and E to interact. Places opens the available destinations.'});
let shadowScene=null,shadowTime=-Infinity,shadowActor=null,shadowActorYaw=0;
const shadowActorPosition=new THREE.Vector3();
async function visitResources(){showNpc('help',{name:config.title,enabled:true,dialogue:config.welcome});}
async function loadEcho(){if(!echo)echo=createNeutralGuide({scene:worlds.town,onPause:resetNavigationInput});return echo;}
async function applySelectedCompanion(helper=helperPicker.selected()){const guide=await loadEcho();await guide.selectHelper(helper);}
const marketRequested=entryParams.get('view')==='market';
let classroomGate;
const marketDialogOpen=()=>Boolean(classroomGate?.open()||nightMarket?.isOpen());
let undo=[],redo=[],pendingLeave=null,previewWalking=false,portrait=false,aerial=false,yaw=0,interaction=null;
let chapelTilt=0,lookElevation=0,lunarCameraElevation=0,lookBaseElevation=.3,lunarCameraBaseElevation=.3,flyover;
let lunarRover=null,lunarDriverPose=null,lunarRiderSensorState=null,lunarDrivingUI=null,lunarTreeClearance=null,showcaseTreeClearance=null,lunarCameraView=0,lunarCameraOrbit=0;
function resetNavigationInput(){lunarDrivingUI?.reset();if(lunarRover?.driving)lunarRover.stop();renderMotion=null;locomotion.reset();keys.clear();joystick.reset();tapMovement=null;drag=null;accumulator=0;nativeNavigationAt=clock.getElapsedTime();if(softwareNavigationAt!==null)softwareNavigationAt=nativeNavigationAt;document.querySelectorAll('.movement .pressed').forEach(b=>b.classList.remove('pressed'));}
function explorationMenuOpen(){return Boolean(discoveryHandover?.open()||orientationTour?.blocksWalking()||document.querySelector('#exploration-options')?.open||document.querySelector('#whole-character-choice')?.open||document.querySelector('#orientation-handover')?.open||explorationTools?.open());}
function canFlyover(){return !lunarRover?.driving&&!curiosHub?.dialogOpen()&&!discoveryHandover?.open()&&!marketDialogOpen()&&!intro?.open()&&!discovery?.open()&&!echo?.open()&&mode==='town'&&campusReady&&!enteringHall&&!enteringCareers&&!studioLoadPending&&!feedbackOpen()&&!watchingEST&&$('module-overlay').hidden&&!$('reflection-dialog').open&&!$('leave-dialog').open;}
function flyoverBlockedReason(){
 if(lunarRover?.driving)return 'Exit the lunar rover before using Flyover.';
 if(discovery?.open())return 'Close the picture clue to use Flyover · F.';
 if(helperPicker.open())return 'Finish or close companion choices to use Flyover · F.';
 if(echo?.open())return 'Close the companion conversation to use Flyover · F.';
 if(orientationTour?.blocksWalking())return 'Continue or skip this tour step to use Flyover · F.';
 if(document.querySelector('#whole-character-choice')?.open||document.querySelector('#orientation-handover')?.open||feedbackOpen()||watchingEST||!$('module-overlay').hidden||$('reflection-dialog').open||$('leave-dialog').open||explorationTools?.open())return 'Close the open panel to use Flyover · F.';
 if(!entryReady||!campusReady)return 'Campus is getting ready. Flyover will be available here.';
 if(enteringHall||enteringCareers||studioLoadPending)return 'Your destination is getting ready. Try Flyover in a moment.';
 return '';
}
let studioLoadPending=false;
const explorationReview=new URLSearchParams(location.search).get('market-review')==='1'||new URLSearchParams(location.search).get('review')==='1';
const explore=async()=>true;
let introWarmTime=-Infinity;
let toastTimer,drag=null,lastTime=0,accumulator=0,metricsTime=0,frames=0,viewport={width:1,height:1};
let tapMovement=null,watchingEST=false;
const teachers=[];
let teacherLoading=false,teacherAttempted=false,ovalVisitRecorded=false,teacherLoad,teacherModuleFailure=null,teacherModuleRequest=0;
const teacherFailures=new Map();
const teacherRay=new THREE.Raycaster(),teacherPointer=new THREE.Vector2();
function updateTeacherLoading(){
 if(mode!=='town'||document.hidden||(discoveryReview&&(!discovery||(!discovery.revealed()&&discovery.snapshot().step<3))))return;
 const p=actor.model.position,near=Math.hypot(p.x+4,p.z+54)<28;
 if(!near){teacherAttempted=false;return;}
 if(teachers.length&&teachers.some(n=>n.near(p,7))&&!ovalVisitRecorded){ovalVisitRecorded=true;explore('oval').then(ok=>{if(!ok)ovalVisitRecorded=false;});}
 if(teachers.length===2||teacherLoading)return;
 if(teacherModuleFailure&&(teacherModuleFailure.attempts>=3||performance.now()<teacherModuleFailure.retryAt))return;
 if(teacherAttempted&&![...teacherFailures.values()].some(f=>f.attempts<3&&performance.now()>=f.retryAt))return;
 return loadTeachers();
}
function loadTeachers({explicit=false}={}){
 if(teachers.length===2)return Promise.resolve();
 if(teacherLoad)return teacherLoad;
 teacherLoading=true;teacherAttempted=true;
 const moduleAttempt=teacherModuleFailure?.attempts||0,moduleGeneration=teacherModuleRequest++;
 const moduleRequest=moduleGeneration?import('./teacher-npc.js?v=player-only-1&retry='+moduleGeneration):import('./teacher-npc.js?v=player-only-1');
 teacherLoad=moduleRequest.then(async m=>{teacherModuleFailure=null;
  // Stagger decode/upload work and isolate each optional NPC's failure.
  for(const config of m.TEACHERS)if(npcInfo(config.id).enabled&&!teachers.some(n=>n.id===config.id)){
   const failed=teacherFailures.get(config.id);if(!explicit&&failed&&(failed.attempts>=3||performance.now()<failed.retryAt))continue;
   try{teachers.push(await m.createTeacherNPC(worlds,discoveryReview?{...config,spawn:{x:config.id==='middleton'?-6.2:-1.8,z:-54.6},fixed:true,reduced:discovery?.reduced()}:config));teachers.at(-1).name=npcInfo(config.id).name;teacherFailures.delete(config.id);}
   catch(error){const attempts=explicit?1:(failed?.attempts||0)+1;teacherFailures.set(config.id,{attempts,retryAt:performance.now()+Math.min(30000,2000*2**(attempts-1))});console.warn(config.name+' could not load; return to the oval to retry.',error);}
  }
 }).catch(error=>{const attempts=explicit?1:moduleAttempt+1;teacherModuleFailure={attempts,retryAt:performance.now()+Math.min(30000,2000*2**(attempts-1))};teacherAttempted=false;console.warn('Teachers unavailable; return to the oval to retry.',error);}).finally(()=>{teacherLoading=false;teacherLoad=null;});
 return teacherLoad;
}
function greetTeacher(npc){if(mode==='town'&&npc?.root?.visible&&npc.react(actor.model.position))toast('Hello, '+npc.name+'!');}
function tapTeacher(event){
 if(mode!=='town'||feedbackOpen()||watchingEST||!$('module-overlay').hidden||$('reflection-dialog').open)return;
 if(echo?.tap?.(event,camera))return;
 const r=canvas.getBoundingClientRect();teacherPointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);teacherRay.setFromCamera(teacherPointer,camera);
 const candidates=teachers.filter(n=>n.root.visible&&n.near(actor.model.position,7));
 const hits=candidates.flatMap(n=>teacherRay.intersectObject(n.root,true).map(hit=>({npc:n,hit}))).sort((a,b)=>a.hit.distance-b.hit.distance);
 if(!hits.length)return;
 const {npc,hit}=hits[0];
 const visible=o=>{for(let n=o;n;n=n.parent)if(!n.visible)return false;return true;};
 const blocker=teacherRay.intersectObjects(worlds.town.children.filter(o=>o!==actor.model&&o!==npc.root),true).find(h=>h.object.isMesh&&visible(h.object)&&h.distance<hit.distance-.05);
 if(!blocker){greetTeacher(npc);showNpc(npc.id);}
}
let moduleObserver=null,moduleTimer=null;
const keys=new Set(),clock=new THREE.Clock(),lookAt=new THREE.Vector3(),desiredCamera=new THREE.Vector3();
const active=()=>state.profiles.find(p=>p.id===state.activeId);
const copy=value=>structuredClone(value);
let headerHeight=88;
const isMobile=()=>window.innerWidth<=620;
const space=()=>mode==='chapel'?'chapel':mode==='interior'||mode==='careers';
const feedbackOpen=()=>Boolean(document.querySelector('#npc-dialog[open]')||document.querySelector('#curios-map[open]'));
const activeScene=()=>mode==='market'?nightMarket.scene:mode==='careers'?worlds.careers:mode==='chapel'?worlds.chapel:mode==='interior'?worlds.interior:worlds.town;
const dirty=()=>mode==='studio' && JSON.stringify(draft)!==JSON.stringify(active());
const bodyName=body=>OPTIONS.body.find(([id])=>id===body)?.[1] || 'avatar';
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4300);}
function persist(){try{saveProfiles(isolatedDiscovery?reviewProfiles:gameStorage,state);return true;}catch{toast('Your browser could not save this character. Keep this tab open.');return false;}}
function populateProfiles(){$('profile').replaceChildren(...state.profiles.map(p=>new Option(p.name,p.id)));$('profile').value=state.activeId;$('character-caption').textContent=active().name;}
let actorRequest=0,previewRequest=0,hallRequest=0,nearHall=false,nearCareers=false;
async function updateActor(ready){
  const request=++actorRequest,profile=copy(active());
  $('retry-saved-avatar').hidden=true;
  try{
    if(ready){if(!await ready)throw new Error('Avatar unavailable');}else await loadProfileKit(profile);
    if(request!==actorRequest)return;
    // Construct before disposing the current actor, so a bad optional model
    // cannot remove the player's working fallback or interrupt navigation.
    if(lunarRover?.driving){exitLunarRover();if(lunarRover.driving)return;}
    const replacement=createCharacter(profile);
    const position=actor.model.position.clone(),rotation=actor.model.rotation.y;
    actor.dispose();actor=replacement;actor.model.position.copy(position);actor.model.rotation.y=rotation;
    activeScene().add(actor.model);populateProfiles();
  }catch{
    if(request!==actorRequest)return;
    $('retry-saved-avatar').hidden=false;
    toast('Your saved avatar could not load. You can keep exploring. Use Retry saved avatar beside your profile to try again.');
  }
}
function refreshPreviewSave(){
 const ready=previewAssetsReady&&(!softwarePresentation||presentedPreviewRequest===previewRequest);
 $('save-avatar').disabled=!ready;
 let status=$('studio-preview-status');
 if(!status){status=document.createElement('p');status.id='studio-preview-status';status.setAttribute('role','status');status.textContent='Preparing your character preview…';status.style.cssText='font-size:13px;margin:8px 0';$('studio-panel').querySelector('.panel-heading').after(status);}
 status.hidden=mode!=='studio'||!previewAssetsReady||ready;
}
function completeWorldPresentation(){
 softwarePresentation?.present(renderedFrames);
 canvas.dataset.presentedMode=submittedView?.mode||'';
 canvas.dataset.presentedPreviewBody=submittedView?.previewRequest!==null?submittedView?.body||'':'';
 if(submittedView?.previewRequest!=null){presentedPreviewRequest=submittedView.previewRequest;if(mode==='studio')refreshPreviewSave();}
}
async function updatePreview(){
  const request=++previewRequest,profile=copy(draft);
  const current=()=>request===previewRequest&&mode==='studio';
  const show=()=>{
    if(!current())return;
    // Keep the working preview until its replacement has been constructed.
    if(lunarRover?.driving){exitLunarRover();if(lunarRover.driving)return;}
    const replacement=createCharacter(profile);
    replacement.model.rotation.y=preview?.model.rotation.y||0;
    preview?.dispose();preview=replacement;studio.add(preview.model);
    preview.setWalking(previewWalking);$('studio-caption').textContent=profile.name;
    canvas.dataset.previewBody=profile.body;
  };
  if(!preview){preview=createFallbackCharacter();studio.add(preview.model);preview.setWalking(previewWalking);}
  $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;
  previewAssetsReady=false;$('save-avatar').disabled=true;$('studio-preview-status')?.setAttribute('hidden','');$('retry-outfit').hidden=true;
  $('edit-state').textContent='Loading avatar…';
  try{
    await loadProfileKit(profile,()=>{
      show();
      if(current())$('edit-state').textContent='Avatar ready · loading selected clothing…';
    });
    if(!current())return;
    show();$('edit-state').textContent=dirty()?'Unsaved':'Saved';
    previewAssetsReady=true;refreshPreviewSave();
  }catch{
    if(current()){
      $('edit-state').textContent='Outfit could not load completely. Retry or choose another option.';
      $('retry-outfit').hidden=false;
    }
  }
}
$('retry-outfit').addEventListener('click',updatePreview);

function changeDraft(mutator){undo.push(copy(draft));if(undo.length>60)undo.shift();redo=[];mutator(draft);draft=normaliseProfile(draft);updatePreview();renderEditor();}
function field(label,key,type='text',rows){
  const wrapper=document.createElement('label');wrapper.className='field';
  const title=document.createElement('span');title.textContent=label;wrapper.append(title);
  let input;
  if(rows){input=document.createElement('select');for(const [value,name] of rows)input.add(new Option(name,value));input.value=draft[key];}
  else if(type==='textarea'){input=document.createElement('textarea');input.value=draft.future[key];input.maxLength=500;}
  else{input=document.createElement('input');input.type=type;input.value=draft[key];input.maxLength=36;}
  input.setAttribute('aria-label',label);
  input.addEventListener('change',()=>changeDraft(p=>{if(type==='textarea')p.future[key]=input.value;else p[key]=input.value;}));
  wrapper.append(input);return wrapper;
}
function colour(label,key){
  const input=document.createElement('input');input.type='color';input.className='colour-input';input.value=draft.colours[key];input.title=label;input.setAttribute('aria-label',label);
  input.addEventListener('change',()=>changeDraft(p=>p.colours[key]=input.value));return input;
}
function colourPreset(label,presets,value,apply){
  const wrapper=document.createElement('label');wrapper.className='field';
  const caption=document.createElement('span');caption.textContent=label+' colour preset';
  const select=document.createElement('select');select.setAttribute('aria-label',caption.textContent);
  select.add(new Option('Custom / choose a preset',''));
  for(const [name,hex]of presets)select.add(new Option(name,hex));
  select.value=presets.find(([,hex])=>hex.toUpperCase()===value.toUpperCase())?.[1]||'';
  select.addEventListener('change',()=>{if(select.value)changeDraft(p=>apply(p,select.value));});
  wrapper.append(caption,select);return wrapper;
}
function optionWithColour(label,key,colourKey=key){const row=document.createElement('div');row.className='field-row';row.append(field(label,key,'select',OPTIONS[key]),colour(`${label} colour`,colourKey));if(COLOUR_PRESETS[colourKey])row.append(colourPreset(label,COLOUR_PRESETS[colourKey],draft.colours[colourKey],(p,value)=>{p.colours[colourKey]=value;}));return row;}
function wardrobeCategoryCards(){
  const nav=document.createElement('div');nav.className='wardrobe-categories';nav.setAttribute('role','group');nav.setAttribute('aria-label','Clothing sections');
  for(const [key,title,thumb] of [['tops','Tops','top-'+(draft.workTop==='none'?'scrubs':draft.workTop)],['pants','Pants','pants-'+draft.pantsStyle],['hair','Hair','hair-'+(draft.hairStyle==='none'?'sweep':draft.hairStyle)],['shoes','Shoes','shoes-'+(draft.shoeStyle==='none'?'trainers':draft.shoeStyle)]]){
    const b=document.createElement('button');b.type='button';b.className='wardrobe-category';b.dataset.section=key;b.setAttribute('aria-label',title);b.setAttribute('aria-pressed',wardrobeSection===key);
    const img=document.createElement('img');img.src='./wardrobe-thumbnails/'+thumb+'.png?v=hair-shoes-20260921';img.alt='';img.width=62;img.height=68;
    const text=document.createElement('span');text.textContent=title;b.append(img,text);
    b.addEventListener('click',()=>{wardrobeSection=key;renderEditor();document.querySelector('[data-section="'+key+'"]').focus({preventScroll:true});});nav.append(b);
  }
  return nav;
}
function garmentCards(section){
  const grid=document.createElement('div');grid.className='garment-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label',({tops:'Choose a top',pants:'Choose pants',hair:'Choose hair',shoes:'Choose shoes'})[section]);
  const options=({tops:OPTIONS.workTop,pants:[...OPTIONS.pantsStyle,['none','No pants']],hair:OPTIONS.hairStyle,shoes:OPTIONS.shoeStyle})[section];
  for(const [key,title] of options){
    const selected=section==='hair'?draft.hairStyle===key:section==='shoes'?draft.shoeStyle===key:section==='tops'?draft.workTop===key:(key==='none'?draft.outer==='none':draft.outer!=='none'&&draft.pantsStyle===key);
    const b=document.createElement('button');b.type='button';b.className='garment-card';b.dataset.garment=section+'-'+key;b.setAttribute('aria-label',title);b.setAttribute('aria-pressed',selected);
    if(key==='none'){b.classList.add('is-empty');const empty=document.createElement('span');empty.className='garment-empty';empty.innerHTML='<i data-lucide="minus"></i>';b.append(empty);}
    else{const img=document.createElement('img');img.src='./wardrobe-thumbnails/'+({tops:'top-',pants:'pants-',hair:'hair-',shoes:'shoes-'})[section]+key+'.png?v=hair-shoes-20260921';img.alt='';img.width=120;img.height=132;img.loading='lazy';b.append(img);}
    const label=document.createElement('span');label.textContent=title;b.append(label);
    b.addEventListener('click',()=>{if(selected){updatePreview();return;}changeDraft(p=>{if(section==='hair')p.hairStyle=key;else if(section==='shoes')p.shoeStyle=key;else if(section==='tops'){p.workTop=key;if(key!=='none')p.topColour=p.topColours[key];}else if(key==='none')p.outer='none';else{p.pantsStyle=key;p.outer='blazer';}});document.querySelector('[data-garment="'+section+'-'+key+'"]').focus({preventScroll:true});});grid.append(b);
  }
  return grid;
}
function accessoryColourControls(section){
  const isHair=section==='hair',style=draft[isHair?'hairStyle':'shoeStyle'],field=isHair?'hairColours':'shoeColours',title=isHair?'Hair':'Shoe';
  const controls=document.createElement('div');controls.className='field-row';controls.hidden=style==='none';if(style==='none')return controls;
  const label=document.createElement('label');label.className='field';label.style.flex='1';const caption=document.createElement('span');caption.textContent=title+' hex colour';
  const hex=document.createElement('input');hex.type='text';hex.value=draft[field][style];hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label',title+' hex colour');
  const error=document.createElement('small');error.setAttribute('role','status');error.style.color='#a32d25';
  const apply=()=>{const value=hex.value.trim().replace(/^#?/,'#').toUpperCase();if(!/^#[0-9A-F]{6}$/.test(value)){hex.setAttribute('aria-invalid','true');error.textContent='Use six hex digits, for example #543321.';return;}hex.removeAttribute('aria-invalid');error.textContent='';hex.value=value;if(value!==draft[field][style])changeDraft(p=>{p[field][style]=value;});};
  hex.addEventListener('change',apply);hex.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();apply();}});
  const picker=document.createElement('input');picker.type='color';picker.className='colour-input';picker.value=draft[field][style];picker.setAttribute('aria-label',title+' colour');picker.addEventListener('change',()=>changeDraft(p=>{p[field][style]=picker.value.toUpperCase();}));
  label.append(caption,hex,error);controls.append(label,picker,colourPreset(title,COLOUR_PRESETS[isHair?'hair':'shoes'],draft[field][style],(p,value)=>{p[field][style]=value;}));return controls;
}
function renderEditor(){
  const root=$('editor-fields');root.replaceChildren();
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===editorTab);b.setAttribute('aria-pressed',b.dataset.tab===editorTab);});
  const simple=isSimpleBody(draft.body);
  if(editorTab==='identity'){
    const choices=WHOLE_AVATARS.map(({id,name})=>[id,name]);
    if(!choices.some(([id])=>id===draft.body))choices.unshift([draft.body,'Current: '+bodyName(draft.body)]);
    root.append(field('Name','name'),field('Character','body','select',choices));
    const tests=document.createElement('details');
    const summary=document.createElement('summary');summary.textContent='Test characters';tests.append(summary);const archiveNote=document.createElement('p');archiveNote.className='hint';archiveNote.textContent='Archived experiments with different capabilities. Choose a test to see what it supports.';tests.append(archiveNote);
    tests.addEventListener('toggle',async()=>{
      if(!tests.open || tests.dataset.loaded)return;
      tests.dataset.loaded='loading';
      try{const {TEST_AVATARS}=await import('./test-avatar-catalog.mjs?v=test-characters-20261013');
        if(!tests.isConnected)return;
        tests.append(field('Test character','body','select',TEST_AVATARS));tests.dataset.loaded='ready';
      }catch{delete tests.dataset.loaded;const note=document.createElement('p');note.textContent='Could not load test choices. Close and reopen to retry.';tests.append(note);}
    });root.append(tests);
    if(TEST_CHARACTER_INFO[draft.body]){const note=document.createElement('p');note.className='hint';note.textContent=TEST_CHARACTER_INFO[draft.body].description;root.append(note);}
    if(simple){
      if(WHOLE_AVATARS.some(item=>item.id===draft.body)){const note=document.createElement('p');note.className='hint';note.textContent='This whole character keeps their own appearance and animations.';root.append(note);}
    }else{
      root.append(field('Face','face','select',OPTIONS.face));
      const skin=document.createElement('div');skin.className='field';const label=document.createElement('span');label.textContent='Skin tone';skin.append(label);
      const swatches=document.createElement('div');swatches.className='swatches';swatches.setAttribute('role','group');swatches.setAttribute('aria-label','Skin tone');
      for(const [key,hex] of Object.entries(SKIN)){const b=document.createElement('button');b.className='swatch';b.style.backgroundColor=hex;b.classList.toggle('active',draft.skin===key);b.title=key[0].toUpperCase()+key.slice(1);b.setAttribute('aria-label',`${b.title} skin tone`);b.setAttribute('aria-pressed',draft.skin===key);b.addEventListener('click',()=>{changeDraft(p=>p.skin=key);renderEditor();});swatches.append(b);}
      skin.append(swatches);root.append(skin,optionWithColour('Hair','hair'));
      const eye=document.createElement('label');eye.className='binary-field';eye.append('Eye colour',colour('Eye colour','eye'));root.append(eye);
    }
  }else if(editorTab==='style'){
    if(draft.body==='pantstest'){
      root.append(wardrobeCategoryCards());
      if(['hair','shoes'].includes(wardrobeSection)){root.append(garmentCards(wardrobeSection),accessoryColourControls(wardrobeSection));}
      if(wardrobeSection==='tops'){
      root.append(garmentCards('tops'));
      const controls=document.createElement('div');controls.className='field-row';controls.hidden=draft.workTop==='none';
      const picker=document.createElement('input');picker.type='color';picker.className='colour-input';picker.value=draft.topColour;picker.setAttribute('aria-label','Top colour');picker.title='Top colour';
      picker.addEventListener('change',()=>changeDraft(p=>{p.topColour=picker.value.toUpperCase();p.topColours[p.workTop==='none'?'scrubs':p.workTop]=p.topColour;}));
      const label=document.createElement('label');label.className='field';label.style.flex='1';const title=document.createElement('span');title.textContent='Top hex colour';
      const hex=document.createElement('input');hex.type='text';hex.value=draft.topColour;hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label','Top hex colour');
      const error=document.createElement('small');error.setAttribute('role','status');error.style.color='#a32d25';
      const applyHex=()=>{const value=hex.value.trim().replace(/^#?/,'#').toUpperCase();if(!/^#[0-9A-F]{6}$/.test(value)){hex.setAttribute('aria-invalid','true');error.textContent='Use six hex digits, for example #397D88.';return;}if(value===draft.topColour){hex.value=value;hex.removeAttribute('aria-invalid');error.textContent='';return;}changeDraft(p=>{p.topColour=value;p.topColours[p.workTop==='none'?'scrubs':p.workTop]=value;});};
      hex.addEventListener('change',applyHex);hex.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyHex();}});
      label.append(title,hex,error);controls.append(label,picker);root.append(controls);
      if(draft.workTop!=='none')root.append(colourPreset('Top',COLOUR_PRESETS.top,draft.topColour,(p,value)=>{p.topColour=value;p.topColours[p.workTop]=value;}));
      }
      if(wardrobeSection==='pants'){
      root.append(garmentCards('pants'));
      const controls=document.createElement('div');controls.className='field-row';
      const picker=document.createElement('input');picker.type='color';picker.className='colour-input';picker.value=draft.pantsColours[draft.pantsStyle];picker.setAttribute('aria-label','Pants colour');picker.title='Pants colour';
      picker.addEventListener('change',()=>changeDraft(p=>{p.pantsColours[p.pantsStyle]=picker.value.toUpperCase();}));
      const label=document.createElement('label');label.className='field';label.style.flex='1';const title=document.createElement('span');title.textContent='Hex colour';
      const hex=document.createElement('input');hex.type='text';hex.value=draft.pantsColours[draft.pantsStyle];hex.maxLength=7;hex.spellcheck=false;hex.setAttribute('aria-label','Pants hex colour');
      const error=document.createElement('small');error.setAttribute('role','status');error.style.color='#a32d25';
      const applyHex=()=>{const value=hex.value.trim().replace(/^#?/,'#').toUpperCase();if(!/^#[0-9A-F]{6}$/.test(value)){hex.setAttribute('aria-invalid','true');error.textContent='Use six hex digits, for example #397D88.';return;}if(value===draft.pantsColours[draft.pantsStyle]){hex.value=value;hex.removeAttribute('aria-invalid');error.textContent='';return;}changeDraft(p=>{p.pantsColours[p.pantsStyle]=value;});};
      hex.addEventListener('change',applyHex);hex.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyHex();}});
      label.append(title,hex,error);controls.append(label,picker);root.append(controls);
      if(draft.outer!=='none')root.append(colourPreset('Pants',COLOUR_PRESETS.bottom,draft.pantsColours[draft.pantsStyle],(p,value)=>{p.pantsColours[p.pantsStyle]=value;}));
      }
      const note=document.createElement('p');note.className='hint';note.textContent='Each style remembers its colour. Save to keep your choices.';root.append(note);
    }else if(draft.body==='jackettest'){
      root.append(field('Jacket','outer','select',[['blazer','Navy blazer'],['none','Off - inspect fit']]));
      const note=document.createElement('p');note.className='hint';note.textContent=TEST_CHARACTER_INFO.jackettest.description;root.append(note);
    }else if(simple){
      const note=document.createElement('p');note.className='hint';note.textContent=WHOLE_AVATARS.some(item=>item.id===draft.body)?'This character comes with their own outfit.':TEST_CHARACTER_INFO[draft.body].description;root.append(note);
    }else{
      root.append(optionWithColour('Top','top'),optionWithColour('Bottom','bottom'),optionWithColour('Outer layer','outer'));
      const jumper=document.createElement('label');jumper.className='binary-field';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=draft.jumper;checkbox.addEventListener('change',()=>changeDraft(p=>p.jumper=checkbox.checked));jumper.append(checkbox,'Knit jumper');root.append(jumper);
      const knit=document.createElement('label');knit.className='binary-field';knit.append('Jumper colour',colour('Jumper colour','jumper'));root.append(knit);
      root.append(field('Accessory','accessory','select',OPTIONS.accessory));const shoes=document.createElement('label');shoes.className='binary-field';shoes.append('Shoe colour',colour('Shoe colour','shoes'));root.append(shoes,colourPreset('Shoe',COLOUR_PRESETS.shoes,draft.colours.shoes,(p,value)=>{p.colours.shoes=value;}));
    }
  }
  icons();
}
let studioLoad,modeRequest=0,campusLoad,campusReady=false,environmentReady=false,entryEnvironmentModule;
function campusNotice(message,failed=false){
  $('campus-progress').hidden=campusReady;
  $('campus-progress-message').textContent=message;
  $('campus-retry').hidden=!failed;
}
function showMarketExteriorSigns(){if(worlds.town.getObjectByName('Market exterior signs'))return;const group=new THREE.Group();group.name='Market exterior signs';const marketSign=sign('LIVE MUSIC & SUNDAY MARKETS',5);marketSign.position.set(43,2.1,-23.1);marketSign.scale.y=.5;group.add(marketSign);const invitation=sign('Food, music and places to explore',5);invitation.position.set(43,1.45,-23.1);invitation.scale.y=.5;group.add(invitation);worlds.town.add(group);}
async function ensureCampus(){
  if(campusReady)return;
  if(campusLoad)return campusLoad;
  campusNotice('Preparing the next outdoor places. Explore freely as the rest of the campus loads.');worlds.scenery.status='loading';
  campusLoad=(async()=>{
    THREE.Cache.enabled=true;
    try{
      await prepareEntry();
      const results=await Promise.allSettled([worlds.loadScenery({deferReveal:true})]);
      const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
      await new Promise(resolve=>setTimeout(resolve,0));
      if(!environmentReady){
        const {integrateEnvironment}=await import('./environment.js?v=broad-integrated-20261014');
        const before=new Set(worlds.town.children);
        try{await integrateEnvironment(worlds);worlds.syncWalkingSurfaces();environmentReady=true;}
        catch(error){for(const child of [...worlds.town.children])if(!before.has(child))child.removeFromParent();throw error;}
      }
      worlds.phase(phase);worlds.revealCampusDetail();worlds.openCampus();campusReady=true;worlds.scenery.status='ready';showMarketExteriorSigns();
      worlds.scenery.errors=[];canvas.dataset.campusReadyMs=String(Math.round(performance.now()));
      campusNotice('Campus ready');startSurfaceDetail();if(detailFailed)detailNotice();
    }catch(error){
      worlds.scenery.status='fallback';campusNotice('Some outdoor detail could not load. You can continue exploring; retry to load the remaining places.',true);
      throw error;
    }finally{THREE.Cache.clear();THREE.Cache.enabled=false;campusLoad=null;}
  })();
  return campusLoad;
}
// Opening assets finish before any speculative next-task work. Destination
// actions still own navigation; prefetch never changes progress or opens a UI.
let entryLoad,entryPreparing=false,entryGeometryReady=false,entryDrawSubmitted=false,entryReady=false,entryFailure=false,entryHandover=false,entrySceneFrame=0,entryReadyAt=0,preparing=false,prepared=new Set(),lastPreparation=0;
let detailLoad,detailFailed=false;
function detailNotice(){
 $('campus-progress').hidden=false;
 $('campus-progress-message').textContent='Some surface detail is still loading. You can keep exploring; Retry will request missing surfaces again.';
 $('campus-retry').hidden=false;
}
function refreshSurfaceDetailNotice(){
 detailFailed=worlds.failedSurfaceDetails>0;
 if(!detailFailed&&canClearDetailWarning({entryReady,campusReady,campusLoading:campusLoad,pending:worlds.pendingSurfaceDetails,campusFailed:worlds.scenery.status==='fallback'}))$('campus-progress').hidden=true;
}
function startSurfaceDetail(){
 if(detailLoad)return detailLoad;
 detailFailed=false;
 detailLoad=worlds.loadDetailTextures().then(()=>{if(canClearDetailWarning({entryReady,campusReady,campusLoading:campusLoad,pending:worlds.pendingSurfaceDetails,campusFailed:worlds.scenery.status==='fallback'}))$('campus-progress').hidden=true;}).catch(()=>{detailFailed=true;detailNotice();}).finally(()=>{detailLoad=null;if(!detailFailed&&worlds.pendingSurfaceDetails>0)startSurfaceDetail();});
 return detailLoad;
}

function updateEntryLoading(){
 if(!discoveryReview||!entryHandover)return;
 const waiting=mode==='town'&&!entryReady&&!entryFailure&&!intro?.open();
 $('loading').hidden=!waiting;if(waiting)$('loading-message').textContent='Opening campus…';
}
async function waitForVisibleEntryFrame(){
 const before=entrySceneFrame;let pending;
 await new Promise(resolve=>{const check=()=>requestAnimationFrame(()=>{frameGate.ready();if(!pending&&entrySceneFrame>before)pending=entrySceneFrame;if(pending&&frameGate.completedFrame>=pending)resolve();else check();});check();});
 await afterFirstPaint();
}
async function prepareEntry(){
 if(entryReady)return;
 if(entryLoad)return entryLoad;
 entryFailure=false;entryPreparing=true;entryGeometryReady=false;entryDrawSubmitted=false;updateEntryLoading();campusNotice('Preparing campus paths and buildings…');
 const environmentModule=environmentReady?null:(entryEnvironmentModule||=import('./environment.js?v=broad-integrated-20261014'));environmentModule?.catch(()=>{});
 // Present the collision-ready entrance before downloading distant buildings and trees.
 entryLoad=worlds.loadEntry().then(async()=>{
   if(!environmentReady){
     const {integrateEnvironment}=await environmentModule;
     await integrateEnvironment(worlds,{entryOnly:true});worlds.phase(phase);
   }
   entryGeometryReady=true;updateCamera(1,true);
   if(mode==='town')await waitForVisibleEntryFrame();
   entryReady=true;entryReadyAt=clock.getElapsedTime();$('campus-progress').hidden=true;
   updateEntryLoading();canvas.dataset.entryVisibleMs=String(performance.now());
 }).catch(error=>{
   entryFailure=true;campusNotice('Campus entrance could not load. Retry to open campus.',true);
   updateEntryLoading();throw error;
 }).finally(()=>{entryPreparing=false;entryLoad=null;});
 return entryLoad;
}
function prepareNextTask(){}
function openCampusInBackground(){ensureCampus().catch(error=>console.warn('Campus detail can be retried',error));}
async function setMode(next){
  if(lunarRover?.driving){exitLunarRover();if(lunarRover.driving)return false;}
  cancelMarketOpening(next);
  flyover?.exit();
  const request=++modeRequest;
  if(next==='town'&&!entryReady&&canvas.dataset.firstFrameMs)prepareEntry().catch(()=>{});
  if(next==='studio'){
    toast('Avatar Studio is getting ready. The studio is still setting things up. Explore the campus and pop back in a few minutes.');
    try{
      studioLoad ||= import('./studio.js?v=lazy-20260917').then(({createStudio})=>{
        ({studio,orbit}=createStudio(camera,canvas,{texture:worlds.town.environment}));
      }).catch(error=>{studioLoad=null;throw error;});
      studioLoadPending=true;await Promise.all([studioLoad,loadCharacterKit(active().body).catch(()=>null)]);studioLoadPending=false;
      if(request!==modeRequest)return false;
      clearTimeout(toastTimer);$('toast').hidden=true;
    }catch{studioLoadPending=false;if(request===modeRequest)toast('Avatar Studio is getting ready. The studio is still setting things up. Explore the campus and pop back in a few minutes.');return false;}
  }
  if(watchingEST)closeESTVideo();worlds?.estVideo.pause();hallRequest++;previewRequest++;resetNavigationInput();actor?.setWalking(false);document.querySelectorAll('.movement button').forEach(b=>b.classList.remove('pressed'));drag=null;mode=next;$('guidance-help').hidden=next!=='town';$('experience').classList.toggle('in-chapel',next==='chapel');
  nightMarket?.setVisible(next==='market');
  echo?.close();if(next==='market')echo?.markMarketVisited();
  const inStudio=next==='studio';$('experience').classList.toggle('in-studio',inStudio);$('arrival-mission').hidden=true;$('est-watch').hidden=true;
  for(const id of ['world-heading','world-tools','movement','world-footer'])$(id).hidden=inStudio;
  for(const id of ['studio-heading','studio-panel','studio-view-tools'])$(id).hidden=!inStudio;
  $('interact').hidden=true;interaction=null;$('aerial').setAttribute('aria-label',next==='chapel'?'Chapel overview':'Aerial view');
  $('town-view').classList.toggle('active',!inStudio&&next!=='market');$('town-view').setAttribute('aria-pressed',!inStudio&&next!=='market');
  $('night-market-entry')?.setAttribute('aria-pressed',next==='market');
  $('studio-view').classList.toggle('active',inStudio);$('studio-view').setAttribute('aria-pressed',inStudio);
  if(orbit)orbit.enabled=inStudio;canvas.setAttribute('aria-label',inStudio?'Interactive 3D character':next==='market'?'Interactive market environment':next==='careers'?'Interactive Learning Centre':next==='chapel'?'Interactive ECC Chapel':next==='interior'?'Interactive Learning Hall':'Interactive 3D town');
  if(inStudio){draft=copy(active());undo=[];redo=[];editorTab='identity';previewWalking=false;portrait=false;$('pose-avatar').setAttribute('aria-pressed','false');$('portrait-view').setAttribute('aria-pressed','false');updatePreview();renderEditor();resetStudioCamera();}
  else{preview?.dispose();preview=null;activeScene().add(actor.model);actor.model.position.copy(next==='market'?nightMarket.spawn:worlds.position(space()));if(next==='market')actor.model.rotation.y=Math.PI;yaw=0;chapelTilt=0;lookElevation=0;aerial=false;$('aerial').setAttribute('aria-pressed','false');setLocation(next==='careers'?'Careers Advice Centre':next==='chapel'?'ECC Chapel':next==='interior'?'EST Prep':'ECC Entrance');updateCamera(1,true);}
  resize();updateEntryLoading();
  if(['interior','careers'].includes(next))await explore('building');
  if(['studio','market'].includes(next)&&!adminReviewRequested)await explore(next);
  return true;
}
function setLocation(title){$('location-title').textContent=mode==='market'?config.places.market:neutralLabel(title);$('district-label').textContent=config.title.toUpperCase();$('location-subtitle').textContent=mode==='studio'?'Choose your character':mode==='market'?config.places.market:mode==='interior'?config.places.hall:mode==='careers'?config.places.centre:'Explore freely · WASD / arrows · drag to look';}
function leaveStudio(callback){if(dirty()){pendingLeave=callback;$('leave-dialog').showModal();}else callback();}
function saveDraft(){if($('save-avatar').disabled){toast('Wait for the selected outfit to load before saving.');return false;}state.profiles=state.profiles.map(p=>p.id===state.activeId?normaliseProfile(draft):p);const ok=persist();if(ok){try{gameStorage.setItem('ce-arrival-complete-'+state.activeId,'1');}catch{}echo?.guidance({avatarSaved:true});}updateActor();$('edit-state').textContent=ok?'Saved':'Not saved';return ok;}
function openStudio(){if(lunarRover?.driving)return visitCampusDestination('studio');if(mode==='studio')return;setMode('studio');}
let enteringHall=false,enteringCareers=false;
async function enterHall(appId){
  if(lunarRover?.driving)return visitCampusDestination('room:hall');
  
  if(enteringHall)return;enteringHall=true;
  const request=++hallRequest;toast('Opening the Learning Hall...');
  try{await worlds.ensureInterior();}catch{enteringHall=false;if(request===hallRequest)toast('The Learning Hall could not load. Try again.');return;}
  enteringHall=false;
  if(request!==hallRequest||mode!=='town')return;
  worlds.teleport(true,0,5.0);actor.model.rotation.y=Math.PI;if(!await setMode('interior'))return;if(appId)curiosHub?.open(appId);else curiosHub?.openRoom('hall');
}
async function enterCareers(appId){
  if(lunarRover?.driving)return visitCampusDestination('room:centre');
  
  if(enteringCareers)return;enteringCareers=true;
  const request=++hallRequest;toast('Opening the Learning Centre...');
  try{await worlds.ensureCareers();}catch{enteringCareers=false;if(request===hallRequest)toast('The Learning Centre could not load. Please try again.');return;}
  enteringCareers=false;
  if(request!==hallRequest||mode!=='town')return;
  worlds.teleport(true,0,5);if(!await setMode('careers'))return;curiosHub?.installRoomMonitors();const app=config.apps?.find(app=>app.id===appId&&app.enabled!==false);toast(app?'Walk up to the '+(app.station||'right')+' PC and press E to open '+app.name+'.':'Walk up to a PC and press E to open its app.');
}
async function enterChapel(){if(lunarRover?.driving)return visitCampusDestination('chapel');const request=++hallRequest;toast('Opening the Chapel...');try{await worlds.ensureChapel();if(!worlds.chapel.userData.reflectionProbe){const target=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType});const probe=new THREE.CubeCamera(.1,35,target);probe.position.set(0,2.2,-2);probe.update(renderer,worlds.chapel);worlds.chapel.environment=target.texture;worlds.chapel.environmentIntensity=.45;worlds.chapel.userData.reflectionProbe=target;}}catch{if(request===hallRequest)toast('Chapel could not load. Try entering again.');return;}if(request!==hallRequest||mode!=='town')return;worlds.teleport('chapel',...CHAPEL.entry);chapelRevealElapsed=0;setMode('chapel');}
function leaveChapel(){const nextClue=discoveryReview;setMode('town');worlds.teleport(false,...(entryReady?[CHAPEL.x,CHAPEL.z]:[ENTRANCE_STAGE.player.x,ENTRANCE_STAGE.player.z]));actor.model.position.copy(worlds.position(false));yaw=1.1;clearTimeout(toastTimer);$('toast').hidden=true;updateCamera(1,true);if(nextClue)discovery?.chapelCheckpoint(true);openCampusInBackground();}
function closeESTVideo(){}
function positionESTPlayButton(){}
function reflect(){keys.clear();joystick.reset();tapMovement=null;$('reflection-dialog').showModal();$('close-reflection').focus();}
let marketGateApproachArmed=true;
let marketOpening=false,marketLeaving=false,marketTravelCooldownUntil=0,marketTravelRequest=0,marketTravelController=null,marketModuleAttempt=0;
function cancelMarketOpening(next){if(next!=='market'&&marketOpening){marketTravelRequest++;marketOpening=false;const controller=marketTravelController;marketTravelController=null;controller?.abort();}}
// Capture only the already-loaded market scene; no campus or video assets.
async function requestMarket(){if(lunarRover?.driving)return visitCampusDestination('market');return openMarket();}
async function openMarket(){
 if(marketOpening)return;const request=++marketTravelRequest,controller=new AbortController();marketTravelController=controller;marketOpening=true;resetNavigationInput();actor?.setWalking(false);toast('Opening Sunday Market…');
 try{if(!nightMarket){const moduleReady=marketModuleAttempt?import('./neutral-market.js?v=year8-1&retry='+marketModuleAttempt):import('./neutral-market.js?v=year8-1');const {createNightMarket}=await withAssetDeadline(moduleReady,15000,'The Market is taking too long to open. Try again.',controller.signal);if(request!==marketTravelRequest)return;nightMarket=createNightMarket({onTravel:point=>{resetNavigationInput();actor.model.position.set(point.x,point.y,point.z);actor.model.rotation.y=Math.PI;actor.setWalking(false);setLocation(point.x<-12?'Markets Administration':'Sunday Market');yaw=point.yaw??0;aerial=false;$('aerial').setAttribute('aria-pressed','false');updateCamera(1,true);},campusGrass:worlds.campusGrass,campusPalette:worlds.campusPalette,storage:gameStorage,adminReview:adminReviewRequested,onPause:()=>{resetNavigationInput();actor.setWalking(false);},onClose:()=>{resetNavigationInput();canvas.focus();},onExit:returnTown});nightMarket.scene.environment=worlds.town.environment;nightMarket.scene.environmentIntensity=.3;}if(request!==marketTravelRequest)return;await setMode('market');if(adminReviewRequested&&request===marketTravelRequest&&mode==='market')nightMarket.visitDistrict(2);}
 catch(error){if(request!==marketTravelRequest)return;marketModuleAttempt++;console.warn('Market unavailable',error);toast('The market could not open. Campus activities remain available.');}finally{if(request===marketTravelRequest){marketOpening=false;marketTravelController=null;}}
}
async function leaveMarketByGate(){
 if(marketLeaving||mode!=='market')return;const request=modeRequest;marketLeaving=true;resetNavigationInput();actor.setWalking(false);
 try{await ensureCampus();if(mode!=='market'||request!==modeRequest)return;await setMode('town');worlds.teleport(false,MARKET_APPROACH.x,MARKET_APPROACH.z);actor.model.position.copy(worlds.position(false));actor.model.rotation.y=MARKET_APPROACH.yaw+Math.PI;yaw=MARKET_APPROACH.yaw;aerial=false;$('aerial').setAttribute('aria-pressed','false');marketTravelCooldownUntil=performance.now()+1200;updateCamera(1,true);setLocation('Outside Sunday Markets');canvas.focus();}
 catch{toast('Campus scenery is still preparing. Walk back through the gate to retry, or use Return to campus.');}
 finally{marketLeaving=false;}
}
function returnTown(){if(lunarRover?.driving)return visitCampusDestination('town');if(mode==='market'){leaveMarketByGate();}else if(mode==='studio')leaveStudio(()=>setMode('town'));else if(mode==='chapel')leaveChapel();else if(mode==='careers')destination('careers');else if(mode==='interior')destination('est');else setMode('town');}
function destination(which){if(lunarRover?.driving)return visitCampusDestination(({careers:'room:centre',est:'room:hall',chapel:'chapel'})[which]||'arrival');if(which==='chapel'){const go=async()=>{if(!await setMode('town'))return;enterChapel();};if(mode==='studio')leaveStudio(go);else go();return;}const go=async()=>{if(!await setMode('town'))return;if(which==='home'&&!campusReady){const request=modeRequest;try{await ensureCampus();}catch{return;}if(request!==modeRequest||mode!=='town')return;}if(!campusReady){worlds.teleport(false,ENTRANCE_STAGE.player.x,ENTRANCE_STAGE.player.z);actor.model.position.copy(worlds.position(false));updateCamera(1,true);return;}worlds.teleport(false,which==='careers'?CAREERS.x:which==='est'?EST.x:ENTRANCE_STAGE.player.x,which==='careers'?CAREERS.z:which==='est'?EST.z:ENTRANCE_STAGE.player.z);actor.model.position.copy(worlds.position(false));actor.model.rotation.y=which==='est'?0:Math.PI;yaw=which==='careers'?CAREERS.yaw:which==='est'?EST.yaw:-.343;setLocation(which==='careers'?CAREERS.name:which==='est'?'EST Prep':'ECC Entrance');updateCamera(1,true);};if(mode==='studio')leaveStudio(go);else go();}
async function visitCampusDestination(key,{enter=false}={}){
  const target=resolveCampusDestination(config,key,{driving:Boolean(lunarRover?.driving),enter,roverDock:ROVER_DOCK});
  if(!target){toast('That destination is not available in these teacher settings.');return;}
  if(target.action==='route'||target.action==='travel')return campusSpot(target.x,target.z,target.label,target.yaw);
  if(target.action==='studio')return openStudio();
  if(target.action==='town')return returnTown();
  const go=async()=>{
    if(!await setMode('town'))return;
    if(target.action==='room')return target.room==='hall'?enterHall(target.appId):enterCareers(target.appId);
    if(target.action==='chapel')return enterChapel();
    if(target.action==='market')return requestMarket();
  };
  if(mode==='studio')leaveStudio(go);else return go();
}
async function campusSpot(x,z,heading,angle=0){
  if(lunarRover?.driving){const route=lunarRover.routeTo?.(x,z);if(route?.reachable){$('location-title').textContent='Rover → '+heading;toast('Follow the glowing route. W/S to drive, A/D to steer, E to park.');}else {setLocation('Lunar Rover');toast(route?.reason||'No clear rover route to that entrance. Choose another destination or park to walk.');}return;}
  const go=async()=>{if(!await setMode('town'))return;const request=modeRequest;
    try{await ensureCampus();}catch{return;}
    if(request!==modeRequest||mode!=='town')return;
    worlds.teleport(false,x,z);actor.model.position.copy(worlds.position(false));if(heading==='Outside Sunday Markets')actor.model.rotation.y=angle+Math.PI;yaw=angle;
    setLocation(heading);updateCamera(1,true);
  };
  if(mode==='studio')leaveStudio(go);else await go();
}
function resetStudioCamera(){const distance=isMobile()?4.25:4.0;camera.position.set(.12,portrait?1.63:1.3,portrait?1.8:distance);orbit.target.set(0,portrait?1.48:.95,0);orbit.minDistance=1.15;orbit.maxDistance=5.2;orbit.maxPolarAngle=Math.PI*.59;orbit.minPolarAngle=Math.PI*.28;orbit.update();}
let renderBackend='',lastRenderMs=0,lastPausedSceneStamp;
function applyRenderQuality(){
 const quality=renderQuality(renderBackend,$('quality').value,devicePixelRatio);let changed=false;
 if(renderer.shadowMap.enabled!==quality.shadows){renderer.shadowMap.enabled=quality.shadows;changed=true;}
 if(renderer.getPixelRatio()!==quality.pixelRatio){renderer.setPixelRatio(quality.pixelRatio);resize();changed=true;}
 worlds.town.traverse(o=>{if(o.isDirectionalLight&&o.castShadow&&o.shadow.mapSize.x!==quality.shadowSize){o.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);o.shadow.map?.dispose();o.shadow.map=null;o.shadow.needsUpdate=true;changed=true;}if(o.isLOD){const distance=o.userData.softwareDetail||o.userData.heroDetail?(quality.software&&!quality.shadows?0:Infinity):quality.plantDistance;if((o.userData.softwareDetail||o.name==='Campus planting distance detail')&&o.levels[1].distance!==distance){o.levels[1].distance=distance;changed=true;}}});
 return changed;
}
function resize(){
  if(!renderer)return;viewport={width:window.innerWidth,height:$('experience').clientHeight};renderer.setSize(viewport.width,viewport.height,false);
  const mobile=isMobile();const width=mode==='studio'&&!mobile?viewport.width-(viewport.width>900?364:316):viewport.width;
  const height=mode==='studio'?Math.max(1,viewport.height*(mobile?.57:1)-headerHeight):viewport.height;
  camera.aspect=width/height;camera.fov=mode==='studio'?36:mode==='chapel'?(mobile?78:72):mobile?62:55;camera.updateProjectionMatrix();
  if(mode==='studio')resetStudioCamera();
}
let chapelRevealElapsed=0;
function updateCamera(dt,snap=false){
  const stagedWelcome=mode==='town'&&!aerial&&!flyover?.active&&!lunarRover?.driving&&welcomeIsOpen('basil')&&usesEntranceStage(config)&&Math.hypot(actor.model.position.x-ENTRANCE_STAGE.player.x,actor.model.position.z-ENTRANCE_STAGE.player.z)<6;
  // Release welcome ownership before any mode's early return or rover masking.
  if(!stagedWelcome)showcaseTreeClearance?.restore();
  if(camera.view?.enabled&&(mode!=='town'||aerial||flyover?.active))camera.clearViewOffset();
  if(flyover?.active)return;
  if(mode==='studio'){orbit.update();return;}
  const p=actor.model.position;
  if(mode==='town'&&lunarRover?.driving){
    if(camera.view?.enabled)camera.clearViewOffset();
    const pose=roverCameraPose(lunarRover.position,lunarRover.heading,{view:lunarCameraView,orbit:lunarCameraOrbit,elevation:lunarCameraElevation,aspect:camera.aspect});
    if(camera.fov!==pose.fov){camera.fov=pose.fov;camera.updateProjectionMatrix();}
    lunarCameraBaseElevation=pose.baseElevation;lunarCameraElevation=pose.elevation;
    desiredCamera.copy(pose.position);lookAt.copy(pose.target);
    // Query the actual scene walls before drawing; vehicle sensors are excluded.
    const physics=worlds.townPhysics,delta=desiredCamera.clone().sub(lookAt),distance=delta.length();
    const ray=new RAPIER.Ray(lookAt,delta.normalize());
    const hit=physics.world.castRay(ray,distance,true,RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,undefined,physics.collider,physics.body);
    if(hit&&hit.timeOfImpact<distance)desiredCamera.copy(lookAt).addScaledVector(delta,Math.max(.05,hit.timeOfImpact-.35));
    camera.position.lerp(desiredCamera,snap?1:1-Math.exp(-dt*7));
    const finalDelta=camera.position.clone().sub(lookAt),finalLength=finalDelta.length();
    if(finalLength>.01){const finalHit=physics.world.castRay(new RAPIER.Ray(lookAt,finalDelta.normalize()),finalLength,true,RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,undefined,physics.collider,physics.body);if(finalHit)camera.position.copy(lookAt).addScaledVector(finalDelta,Math.max(.05,finalHit.timeOfImpact-.35));}
    camera.lookAt(lookAt);camera.rotateX(pose.tilt);camera.updateMatrixWorld();
    lunarTreeClearance?.update(camera,lookAt,clock.getElapsedTime(),snap);return;
  }
  const launchPose=mode==='town'&&!aerial&&!stagedWelcome?curiosHub?.rocketLaunch?.cameraPose(p):null;
  if(launchPose){
    if(camera.fov!==launchPose.fov){camera.fov=launchPose.fov;camera.updateProjectionMatrix();}
    desiredCamera.set(...launchPose.eye);lookAt.set(...launchPose.target);
    camera.position.lerp(desiredCamera,snap?1:1-Math.exp(-dt*7));camera.lookAt(lookAt);return;
  }
  if(stagedWelcome){
    const pose=entranceShowcasePose(camera.aspect);camera.fov=pose.fov;camera.updateProjectionMatrix();
    camera.position.set(...pose.position);lookAt.set(...pose.target);camera.lookAt(lookAt);
    camera.setViewOffset(innerWidth,innerHeight,innerWidth*pose.shiftX,innerHeight*pose.shiftY,innerWidth,innerHeight);camera.updateMatrixWorld();
    showcaseTreeClearance ||= createRoverTreeClearance(worlds.town);showcaseTreeClearance.update(camera,lookAt,clock.getElapsedTime(),snap);return;
  }
  if(mode==='market'&&nightMarket?.observing){
    const distance=Math.max(8,6/camera.aspect);
    desiredCamera.set(.5,4.4+(distance-8)*.75,distance);lookAt.set(-.3,1,-1.5);
    camera.position.lerp(desiredCamera,snap?1:1-Math.exp(-dt*5));camera.lookAt(lookAt);return;
  }
  if(watchingEST){const viewingDistance=Math.max(7.9,6.8/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));desiredCamera.set(0,3.3,-6.48+viewingDistance);lookAt.set(0,3.3,-6.48);camera.position.lerp(desiredCamera,snap?1:1-Math.exp(-dt*7));camera.lookAt(lookAt);return;}
  if(mode==='town'&&worlds.town.fog){worlds.town.fog.near=aerial?200:75;worlds.town.fog.far=aerial?320:215;}
  if(aerial&&mode==='town'&&camera.fov!==(isMobile()?62:55)){camera.fov=isMobile()?62:55;camera.updateProjectionMatrix();}
  // Small app rooms use a stable room-centred view. Following the avatar into
  // corners forced the old collision ray to collapse the camera onto its head.
  if(mode==='interior'||mode==='careers'){
    const pose=roomCameraPose(camera.aspect);
    if(camera.fov!==pose.fov){camera.fov=pose.fov;camera.updateProjectionMatrix();}
    desiredCamera.set(...pose.position);lookAt.set(...pose.target);camera.position.copy(desiredCamera);camera.lookAt(lookAt);return;
  }
  if(aerial){if(mode==='chapel'){desiredCamera.set(8.9,2.25,-1.4);lookAt.set(-1.5,3.7,1.1);}else if(mode==='market'){desiredCamera.set(13,18,19);lookAt.set(0,0,-2);}else if(mode==='interior'||mode==='careers'){desiredCamera.set(8,12,13);lookAt.set(0,0,0);}else{desiredCamera.set(-63,87,65);lookAt.set(-20,0,-12);}}
  else if(mode==='town'||mode==='market'){
    // Keep head-to-foot framing steady through the Studio approach and camera turns.
    const office=mode==='market'&&p.x<-12.8;const framing=mode==='town'&&discoveryReview?campusEntryFraming(p,isMobile()):{distance:office?5.2:6.4,height:office?5.4:3.1,lookAhead:.6,bias:0,fov:isMobile()?62:55};
    const rocket=mode==='town'?rocketApproachFraming(p,yaw,camera.aspect):null;const landmark=rocket?.weight?rocket:mode==='town'?curiosHub?.lunarApproachFraming(p,yaw,camera.aspect):null;const landmarkWeight=landmark?.weight||0;if(landmarkWeight){framing.distance=THREE.MathUtils.lerp(framing.distance,landmark.distance,landmarkWeight);framing.height=THREE.MathUtils.lerp(framing.height,landmark.height,landmarkWeight);framing.fov=THREE.MathUtils.lerp(framing.fov,landmark.fov,landmarkWeight);}
    if(camera.fov!==framing.fov){camera.fov=framing.fov;camera.updateProjectionMatrix();}
    desiredCamera.set(p.x+Math.sin(yaw)*framing.distance,p.y+framing.height,p.z+Math.cos(yaw)*framing.distance);
    lookAt.set(p.x-Math.sin(yaw)*framing.lookAhead+Math.cos(yaw)*framing.bias,p.y+THREE.MathUtils.lerp(1.25,landmark?.lookY||1.25,landmarkWeight),p.z-Math.cos(yaw)*framing.lookAhead-Math.sin(yaw)*framing.bias);
  }else{
    const distance=mode==='chapel'?3.5:4.2;
    if(mode==='chapel')chapelRevealElapsed+=dt;
    const reveal=mode==='chapel'?(discovery?.reduced()?1:Math.min(1,chapelRevealElapsed/3)):1;
    desiredCamera.set(p.x+Math.sin(yaw)*distance,p.y+(mode==='interior'||mode==='careers'?3:1.95),p.z+Math.cos(yaw)*distance);
    lookAt.set(p.x-Math.sin(yaw)*(mode==='chapel'?5:1.1),p.y+(mode==='chapel'?1.6+1.3*reveal+chapelTilt:1.55),p.z-Math.cos(yaw)*(mode==='chapel'?5:1.1));
  }
  const walkingLook=!aerial&&(mode==='town'||mode==='market');
  if(walkingLook){
    lookBaseElevation=cameraElevation(desiredCamera,lookAt);
    lookElevation=dragWalkingElevation(lookElevation,0,lookBaseElevation);
    applyCameraElevation(desiredCamera,lookAt,Math.max(0,lookElevation),Math.min(.08,lookBaseElevation));
  }
  if(mode==='interior'||mode==='careers'){desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-6.65,6.65);desiredCamera.z=THREE.MathUtils.clamp(desiredCamera.z,-6.55,6.75);}
  if(mode==='chapel'){desiredCamera.x=THREE.MathUtils.clamp(desiredCamera.x,-10.5,10.5);desiredCamera.z=THREE.MathUtils.clamp(desiredCamera.z,-8.05,8.05);}
  const nearParkedRover=mode==='town'&&lunarRover&&!lunarRover.driving&&
    Math.hypot(p.x-lunarRover.position.x,p.z-lunarRover.position.z)<5;
  const recoverOutdoorCamera=mode==='town'&&(discoveryReview||nearParkedRover);
  if(!aerial&&(recoverOutdoorCamera||(discoveryReview&&mode==='chapel'))){worlds.protectCamera(space(),p,desiredCamera);const view={position:desiredCamera};if(mode==='chapel')keepChapelClearance(THREE,worlds,p,view,yaw);else keepOutdoorClearance(THREE,worlds,p,view,yaw);}
  camera.position.lerp(desiredCamera,snap?1:1-Math.exp(-dt*7));
  // Resolve after smoothing too: an old camera position may be across a wall.
  if(!aerial&&mode!=='market'){
    worlds.protectCamera(space(),p,camera.position);if(recoverOutdoorCamera)keepOutdoorClearance(THREE,worlds,p,camera,yaw);if(discoveryReview&&mode==='chapel')keepChapelClearance(THREE,worlds,p,camera,yaw);
    if(mode==='interior'){camera.position.y=Math.min(camera.position.y,p.y+estEyeHeight(Math.hypot(camera.position.x-p.x,camera.position.z-p.z)));worlds.protectCamera(space(),p,camera.position);}
    if((mode==='interior'||mode==='careers')||(mode!=='chapel'&&camera.position.distanceTo(p)<3.5))lookAt.set(p.x,p.y+.9,p.z);
  }
  camera.lookAt(lookAt);
  if(walkingLook)camera.rotateX(walkingLensTilt(camera.position,lookAt,lookElevation));
  // Reframe the welcome without moving characters, paths or collision geometry.
  const shift=mode==='town'&&!aerial?welcomeViewShift():0;if(shift){camera.setViewOffset(innerWidth,innerHeight,innerWidth*shift,0,innerWidth,innerHeight);}else if(camera.view?.enabled)camera.clearViewOffset();
}
function recoverLunarRover(){
 if(!lunarRover?.driving)return;
 resetNavigationInput();const result=lunarRover.recover();
 if(!result?.recovered){toast(result?.reason||'No clear recovery spot. Park or reload to return to the entrance.');return;}
 lunarDriverPose?.update();lunarCameraView=0;lunarCameraOrbit=0;lunarCameraElevation=0;lunarDrivingUI?.setView(ROVER_VIEWS[0]);
 updateCamera(1,true);updateInteraction();toast('Rover moved to clear ground. Hold Drive or Reverse to continue.');
}
function boardLunarRover(){
 if(!lunarRover||lunarRover.driving||mode!=='town')return;
 resetNavigationInput();actor.setWalking(false);actor.update(.2);lunarRover.board();lunarRiderSensorState=worlds.townPhysics.collider.isSensor();worlds.townPhysics.collider.setSensor(true);document.body.classList.add('driving-lunar-rover');
 lunarDrivingUI ||= createLunarDrivingUI({canDrive:canStepNavigation,onView:()=>{resetNavigationInput();lunarRover.stop();lunarCameraView=(lunarCameraView+1)%ROVER_VIEWS.length;lunarCameraOrbit=0;lunarCameraElevation=0;lunarDrivingUI.setView(ROVER_VIEWS[lunarCameraView]);updateCamera(1,true);},onRecover:recoverLunarRover,onBrake:()=>{resetNavigationInput();lunarRover.stop();}});
 lunarCameraView=isMobile()?0:1;lunarCameraOrbit=0;lunarCameraElevation=0;lunarDrivingUI.setView(ROVER_VIEWS[lunarCameraView]);lunarDrivingUI.setActive(true);
 showcaseTreeClearance?.restore();
 lunarTreeClearance ||= createRoverTreeClearance(worlds.town);
 lunarDriverPose=createLunarDriverPose(actor.model,lunarRover);lunarDriverPose.update();
 yaw=lunarRover.heading+Math.PI;aerial=false;$('aerial').setAttribute('aria-pressed','false');
 $('location-title').textContent='Lunar Rover · Campus Drive';$('location-subtitle').textContent='Hold Drive / Reverse · Drag up in Follow view to look higher';
 document.querySelectorAll('.movement [data-key]').forEach(b=>{b.dataset.walkLabel=b.getAttribute('aria-label');b.setAttribute('aria-label',{'KeyW':'Drive rover forward','KeyS':'Reverse rover','KeyA':'Steer rover left','KeyD':'Steer rover right'}[b.dataset.key]||b.dataset.walkLabel);});
 canvas.focus();updateInteraction();updateCamera(1,true);
}
function exitLunarRover(){
 if(!lunarRover?.driving)return;
 const at=lunarRover.exit();if(!at){toast('Move the rover into a clear space, or tap Unstick rover before exiting.');return;}lunarDriverPose?.restore();lunarDriverPose=null;lunarDrivingUI?.setActive(false);lunarTreeClearance?.restore();document.body.classList.remove('driving-lunar-rover');
 resetNavigationInput();worlds.teleport(false,at.x,at.z,at.y);actor.model.position.copy(worlds.position(false));actor.setWalking(false);worlds.townPhysics.collider.setSensor(lunarRiderSensorState??false);lunarRiderSensorState=null;
 document.querySelectorAll('.movement [data-walk-label]').forEach(b=>{b.setAttribute('aria-label',b.dataset.walkLabel);delete b.dataset.walkLabel;});
 setLocation('Lunar Rover');canvas.focus();
}
function updateMission(){$('arrival-mission').hidden=true;$('guidance-help').textContent='Help';}
function updateInteraction(){
 interaction=null;
 if(feedbackOpen()||!$('module-overlay').hidden||mode==='studio'||watchingEST||$('leave-dialog').open){$('interact').hidden=true;return;}
 const p=actor.model.position;
 if(mode==='town'&&lunarRover?.driving)interaction={label:'Park and exit rover · E',action:exitLunarRover};
 else if(mode==='town'&&lunarRover&&Math.hypot(p.x-lunarRover.position.x,p.z-lunarRover.position.z)<3.6)interaction={label:'Drive the lunar rover · E',action:boardLunarRover};
 else if(mode==='market')interaction=nightMarket.interaction(p);
 else if(mode==='town'){
  const launchAction=curiosHub?.rocketLaunch?.interaction(p);
  const walking=keys.size>0||Math.hypot(joystick.x,joystick.z)>.1;
  if(walking&&!curiosHub?.blocked()){if(Math.hypot(p.x-EST.x,p.z-EST.doorZ)<1.1){enterHall();return;}if(Math.hypot(p.x-CAREERS.x,p.z-CAREERS.doorZ)<1.1){enterCareers();return;}if(curiosHub?.forRoom('media')&&Math.hypot(p.x-ROOM_POINTS.media.x,p.z-ROOM_POINTS.media.z)<.9){curiosHub?.openRoom('media');return;}}
  if(launchAction)interaction=launchAction;
  else if(curiosHub?.forRoom('media')&&Math.hypot(p.x-ROOM_POINTS.media.x,p.z-ROOM_POINTS.media.z)<2.2)interaction={label:'Enter '+curiosHub.forRoom('media').name,action:()=>curiosHub?.openRoom('media')};
  else if(Math.hypot(p.x-ROOM_POINTS.hall.x,p.z-ROOM_POINTS.hall.z)<2.2||Math.hypot(p.x-EST.x,p.z-EST.doorZ)<2.2)interaction={label:'Enter '+config.places.hall,action:enterHall};
  else if(Math.hypot(p.x-ROOM_POINTS.centre.x,p.z-ROOM_POINTS.centre.z)<2.2||Math.hypot(p.x-CAREERS.x,p.z-CAREERS.doorZ)<2.2)interaction={label:'Enter '+config.places.centre,action:enterCareers};
  else if(curiosHub?.moonInteraction(p))interaction=curiosHub.moonInteraction(p);
  else if(campusReady&&Math.hypot(p.x-43,p.z+22)<3.2)interaction={label:'Enter '+config.places.market,action:requestMarket};
  else if(p.x>-13.6&&p.x<-10.8&&Math.abs(p.z-5)<1.45)interaction={label:'Open Avatar Studio',action:openStudio};
  else if(Math.hypot(p.x-CHAPEL.x,p.z-CHAPEL.z)<1.9)interaction={label:'Enter Chapel',action:enterChapel};
  else {const npc=teachers.filter(n=>n.root.visible&&n.near(p,5)).sort((a,b)=>a.root.position.distanceToSquared(p)-b.root.position.distanceToSquared(p))[0];if(npc&&npcInfo(npc.id).dialogue)interaction={label:'Talk to '+npc.name,action:()=>{resetNavigationInput();npc.react?.();showNpc(npc.id);}};else interaction=extraCast?.interaction(p)||echo?.interaction(p)||null;}
 }else if(mode==='careers')interaction=curiosHub?.pcInteraction(p)||{label:'Return to campus',action:returnTown};
 else if(['interior','chapel'].includes(mode))interaction={label:'Return to campus',action:returnTown};
 $('interact').hidden=!interaction;if(interaction)$('interact').querySelector('span').textContent=interaction.label;
}
function closeModule(){curiosHub?.close();}
function phaseChange(name){if(!Object.hasOwn(PHASES,name))return;phase=name;worlds.phase(name);$('phase').value=name;}
function qualityChange(){const quality=renderQuality(renderBackend,$('quality').value,devicePixelRatio);renderer.setPixelRatio(quality.pixelRatio);renderer.shadowMap.enabled=quality.shadows;resize();}
function bindEvents(){
  document.addEventListener('visibilitychange',()=>{lastTime=clock.getElapsedTime();accumulator=0;frames=0;metricsTime=lastTime;if(document.hidden)resetNavigationInput();});
  const header=document.querySelector('.topbar');
  new ResizeObserver(()=>{const height=header.offsetHeight;document.documentElement.style.setProperty('--game-header-height',height+'px');if(headerHeight!==height){headerHeight=height;resize();}}).observe(header);
  const menus=[...header.querySelectorAll('details')];
  menus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open){for(const other of menus)if(other!==menu)other.open=false;$('arrival-mission').classList.remove('mobile-expanded');$('arrival-mission').querySelector('button').setAttribute('aria-expanded','false');}}));
  document.addEventListener('click',e=>{if(!header.contains(e.target))menus.forEach(menu=>menu.open=false);});
  header.addEventListener('keydown',e=>{if(e.key==='Escape')menus.forEach(menu=>menu.open=false);});
  $('destination-bar').addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#arrival-mission')){$('destination-menu').open=false;canvas.focus();}});
  $('resources-destination').addEventListener('click',()=>mode==='studio'?leaveStudio(visitResources):visitResources());
  for(const [id,key] of Object.entries(MENU_DESTINATIONS))$(id).addEventListener('click',()=>visitCampusDestination(key,{enter:true}));

  $('retry-saved-avatar').addEventListener('click',()=>updateActor());
  document.addEventListener('ce-feedback-open',()=>{flyover?.stop();keys.clear();joystick.reset();tapMovement=null;actor?.setWalking(false);worlds.estVideo.pause();});
  $('close-reflection').addEventListener('click',()=>$('reflection-dialog').close());
  $('reflection-dialog').addEventListener('close',()=>{keys.clear();joystick.reset();canvas.focus();});
  $('interact').addEventListener('click',()=>interaction?.action());$('phase').addEventListener('change',e=>phaseChange(e.target.value));$('quality').addEventListener('change',qualityChange);
  $('campus-retry').addEventListener('click',()=>{if(detailFailed)worlds.retryDetailTextures().then(refreshSurfaceDetailNotice,()=>{detailFailed=true;detailNotice();});else if(!entryReady)prepareEntry().catch(()=>{});else openCampusInBackground();});
  $('aerial').addEventListener('click',async()=>{const request=modeRequest;if(mode==='town'&&!campusReady){try{await ensureCampus();}catch{return;}if(request!==modeRequest)return;}aerial=!aerial;$('aerial').setAttribute('aria-pressed',aerial);});$('recenter').addEventListener('click',()=>{yaw=0;chapelTilt=0;lookElevation=0;lunarCameraOrbit=0;lunarCameraElevation=0;aerial=false;$('aerial').setAttribute('aria-pressed','false');updateCamera(1,true);});
  $('profile').addEventListener('change',()=>{const id=$('profile').value;$('profile').value=state.activeId;if(id===state.activeId){updateActor();return;}const change=()=>{state.activeId=id;persist();helperPicker.choose();updateActor();if(mode==='studio')setMode('studio');};if(mode==='studio')leaveStudio(change);else change();});
  $('new-profile').addEventListener('click',()=>{const add=()=>{if(state.profiles.length>=24){toast('This browser already has 24 characters.');return;}const p=normaliseProfile({id:crypto.randomUUID(),name:`Character ${state.profiles.length+1}`});state.profiles.push(p);state.activeId=p.id;persist();helperPicker.choose();updateActor();setMode('studio');};if(mode==='studio')leaveStudio(add);else add();});
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{editorTab=b.dataset.tab;renderEditor();}));
  $('save-avatar').addEventListener('click',()=>{if(saveDraft()){setMode('town');toast(`${active().name} saved in this browser`);}});
  $('undo').addEventListener('click',()=>{if(!undo.length)return;redo.push(copy(draft));draft=undo.pop();updatePreview();renderEditor();});$('redo').addEventListener('click',()=>{if(!redo.length)return;undo.push(copy(draft));draft=redo.pop();updatePreview();renderEditor();});
  $('keep-editing').addEventListener('click',()=>{$('leave-dialog').close();pendingLeave=null;});$('discard-changes').addEventListener('click',()=>{$('leave-dialog').close();pendingLeave?.();pendingLeave=null;});$('save-changes').addEventListener('click',()=>{if(saveDraft()){$('leave-dialog').close();pendingLeave?.();pendingLeave=null;}});
  $('turn-avatar').addEventListener('click',()=>{if(preview)preview.model.rotation.y+=Math.PI;});$('pose-avatar').addEventListener('click',()=>{previewWalking=!previewWalking;preview?.setWalking(previewWalking);$('pose-avatar').setAttribute('aria-pressed',previewWalking);});$('portrait-view').addEventListener('click',()=>{portrait=!portrait;$('portrait-view').setAttribute('aria-pressed',portrait);resetStudioCamera();});

  window.addEventListener('keydown',e=>{if(curiosHub?.dialogOpen()||(mode==='town'&&!entryReady)||explorationMenuOpen()||intro?.open()||discovery?.open()||helperPicker.open()||echo?.open()||feedbackOpen()||marketDialogOpen())return;if(flyover?.keydown(e))return;if(watchingEST){if(e.code==='Escape')closeESTVideo();return;}if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||$('leave-dialog').open||(!$('module-overlay').hidden||$('reflection-dialog').open))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();advanceSoftwareNavigation();if(!canStepNavigation())return;keys.add(e.code);}if(e.code==='KeyE'&&!e.repeat)interaction?.action();});
  window.addEventListener('keyup',e=>{if(keys.has(e.code))advanceSoftwareNavigation();keys.delete(e.code);});window.addEventListener('blur',()=>{resetNavigationInput();actor?.setWalking(false);flyover?.stop();});document.addEventListener('visibilitychange',()=>{flyover?.stop();resetNavigationInput();actor?.setWalking(false);lastTime=clock.getElapsedTime();});window.addEventListener('resize',resize);
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
  document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('dragstart',e=>e.preventDefault());b.addEventListener('selectstart',e=>e.preventDefault());let pressedAt=0;b.addEventListener('pointerdown',e=>{if(curiosHub?.dialogOpen()||(mode==='town'&&!entryReady)||explorationMenuOpen()||intro?.open()||discovery?.open()||helperPicker.open()||echo?.open())return;e.preventDefault();b.setPointerCapture(e.pointerId);pressedAt=performance.now();keys.add(b.dataset.key);b.classList.add('pressed');});const release=e=>{if(b.classList.contains('pressed')&&e.type==='pointerup'&&performance.now()-pressedAt<180)tapMovement={key:b.dataset.key,until:performance.now()+220};keys.delete(b.dataset.key);b.classList.remove('pressed');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);});
  canvas.addEventListener('pointerdown',e=>{if(curiosHub?.dialogOpen()||(mode==='town'&&!entryReady)||explorationMenuOpen()||intro?.open()||discovery?.open()||helperPicker.open()||echo?.open())return;if(flyover?.pointerdown(e))return;canvas.focus();if(mode==='studio'||mode==='careers'||mode==='interior')return;drag={x:e.clientX,y:e.clientY,lastY:e.clientY,yaw,roverOrbit:lunarCameraOrbit,elevation:lookElevation,roverElevation:lunarCameraElevation,tilt:chapelTilt,moved:false};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(flyover?.pointermove(e))return;if(drag && mode!=='studio'){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8)drag.moved=true;if(!drag.moved)return;if(lunarRover?.driving){lunarCameraOrbit=drag.roverOrbit-(e.clientX-drag.x)*.006;lunarCameraElevation=dragCameraElevation(lunarCameraElevation,e.clientY-drag.lastY,lunarCameraBaseElevation,lunarCameraView===1?1:0);}else{yaw=drag.yaw-(e.clientX-drag.x)*.006;if(mode==='town'||mode==='market')lookElevation=dragWalkingElevation(lookElevation,e.clientY-drag.lastY,lookBaseElevation);}if(mode==='chapel')chapelTilt=THREE.MathUtils.clamp(drag.tilt+(e.clientY-drag.y)*.014,-1.6,4.5);drag.lastY=e.clientY;}});canvas.addEventListener('pointerup',e=>{if(flyover?.active){flyover.pointerup(e);return;}if(drag&&!drag.moved)tapTeacher(e);drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;flyover?.pointerup();});canvas.addEventListener('lostpointercapture',()=>{drag=null;flyover?.pointerup();});
}
let renderedFrames=0,lastPixelColours=null,lastPixelReadAt=-Infinity;
function publishDiagnostics(now,rendered=false){
    if(rendered&&pixelDiagnostics&&now-lastPixelReadAt>1){
      const gl=renderer.getContext(),pixels=new Uint8Array(4*24*24),colours=new Set();
      for(const x of [.25,.40,.6])for(const y of [.25,.45,.7]){gl.readPixels(Math.floor(gl.drawingBufferWidth*x),Math.floor(gl.drawingBufferHeight*y),24,24,gl.RGBA,gl.UNSIGNED_BYTE,pixels);for(let i=0;i<pixels.length;i+=4)colours.add(`${pixels[i]>>2},${pixels[i+1]>>2},${pixels[i+2]>>2}`);}
      lastPixelColours=colours.size;lastPixelReadAt=now;
    }
    if(now-metricsTime<=1)return;
    const discovered=discovery?.snapshot(),discoveryState=discovered?{...discovered,shots:Object.fromEntries(Object.entries(discovered.shots||{}).map(([id,shot])=>[id,{...shot,image:Boolean(shot.image)}]))}:null;
    const data={lunarRoute:lunarRover?.route?.points||null,lunarCameraView,lunarCameraOrbit,lunarCameraElevation,lookElevation,adminReview:adminReviewRequested,guestRun:gameSession?.isGuest,runId:gameSession?.id,introShellMs:Number(document.documentElement.dataset.introShellMs)||null,entryReady,surfaceDetailPending:worlds.pendingSurfaceDetails,surfaceDetailFailed:detailFailed,preparingNextTask:preparing,renderRatio:renderer.getPixelRatio(),renderBackend,renderFrameMs:Math.round(lastRenderMs),discovery:discoveryState,intro:intro?.snapshot(),echo:echo?.snapshot(),exploration:explorationTools?.snapshot(),optionsOpen:Boolean($('exploration-options')?.open),marketOpening,teacherLoading,teacherModuleFailure,...(mode==='market'?{market:nightMarket.snapshot()}:{}),lunarRover:lunarRover?{driving:lunarRover.driving,speed:lunarRover.speed,position:lunarRover.position.toArray(),heading:lunarRover.heading}:null,avatarFallback:Boolean(actor.model.userData.fallback),avatarBody:actor.profile?.body||null,campusReady,arrivalRestricted:worlds.arrivalOnly,teachers:teachers.map(n=>n.snapshot()),scenery:worlds.scenery,mode,phase,profileId:state.activeId,position:actor.model.position.toArray().map(n=>+n.toFixed(3)),cameraPosition:camera.position.toArray().map(n=>+n.toFixed(3)),cameraFov:camera.fov,cameraAspect:camera.aspect,fps:Math.round(frames/(now-metricsTime)),renderedFrames,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelColours:lastPixelColours,animations:Object.keys(actor.clips),visibleMeshes:0};
    (mode==='studio'?preview?.model:actor.model)?.traverse(o=>{if(o.isMesh&&o.visible)data.visibleMeshes++;});
    if(mode==='studio'&&draft?.body==='pantstest'){
      data.wardrobe={top:draft.workTop,pants:draft.outer==='none'?'none':draft.pantsStyle,topHex:draft.topColour,necklineVisible:false,visibleTops:[],hair:draft.hairStyle,shoes:draft.shoeStyle,hairHex:draft.hairColours[draft.hairStyle],shoeHex:draft.shoeColours[draft.shoeStyle],visibleHair:[],visibleShoes:[],bodyScale:preview?.model.children[0]?.scale.y};
      preview?.model.traverse(o=>{if(!o.isMesh||!o.visible)return;if(o.userData.clothingSlot==='necklineSkin')data.wardrobe.necklineVisible=true;for(const [slot,key]of [['hair','visibleHair'],['shoes','visibleShoes']])if(o.userData.clothingSlot===slot&&!data.wardrobe[key].includes(o.userData.itemStyle))data.wardrobe[key].push(o.userData.itemStyle);if(o.userData.clothingSlot==='workTop'&&!data.wardrobe.visibleTops.includes(o.userData.topStyle))data.wardrobe.visibleTops.push(o.userData.topStyle);});
    }
    $('diagnostics').value=JSON.stringify(data);$('diagnostics').dataset.state=JSON.stringify(data);frames=0;metricsTime=now;
}

function takeNavigationElapsed(now,elapsed=0){
  if(softwareNavigationAt===null){const delta=nativeNavigationAt===null?elapsed:Math.max(0,now-nativeNavigationAt);nativeNavigationAt=now;return delta;}
  const delta=Math.max(0,now-softwareNavigationAt);softwareNavigationAt=now;return delta;
}
function canStepNavigation(){
  return !curiosHub?.dialogOpen()&&!discoveryHandover?.open()&&!flyover?.active&&(mode!=='town'||entryReady)&&!marketOpening&&!intro?.open()&&!discovery?.open()&&!document.hidden&&!feedbackOpen()&&!marketDialogOpen()&&mode!=='studio'&&!watchingEST&&$('module-overlay').hidden&&!$('reflection-dialog').open&&!$('leave-dialog').open&&!explorationMenuOpen()&&!helperPicker.open()&&!echo?.open();
}
function softwareMovementActive(){return canStepNavigation()&&(keys.size>0||joystick.x!==0||joystick.z!==0||Boolean(lunarDrivingUI?.read().throttle||lunarDrivingUI?.read().steer));}
function uploadWorldPose(){return [mode,actor.model.uuid,...actor.model.position.toArray().map(v=>+v.toFixed(3)),+actor.model.rotation.y.toFixed(3)].join('|');}
function softwareWorldActive(){return !document.hidden&&!intro?.open()&&!explorationTools?.preparing()&&(mode==='studio'||flyover?.active||(entryReady&&(softwareMovementActive()||(!canStepNavigation()&&lastUploadWorldPose!==uploadWorldPose()))));}
function stepNavigation(elapsed){
  if(tapMovement){if(performance.now()<tapMovement.until)keys.add(tapMovement.key);else{keys.delete(tapMovement.key);tapMovement=null;}}
  let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  const drivingInput=lunarRover?.driving?lunarDrivingUI?.read():null;
  if(drivingInput){x-=drivingInput.steer;z-=drivingInput.throttle;}else{x+=joystick.x;z+=joystick.z;}
  const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
  if(mode==='town'&&lunarRover?.driving){lunarRover.update(elapsed,{throttle:-z,steer:-x,player:actor.model.position});lunarDriverPose?.update();actor.setWalking(false);yaw=lunarRover.heading+Math.PI;renderMotion=null;accumulator=0;return;}
  const running=keys.has('ShiftLeft')||keys.has('ShiftRight');
  // Interpolate rendering between physics poses, without feeding the visual
  // position back into collision or Market movement. External teleports reset it.
  if(!renderMotion||renderMotion.shown.distanceToSquared(actor.model.position)>1e-10){
    renderMotion={previous:actor.model.position.clone(),current:actor.model.position.clone(),shown:actor.model.position.clone()};
  }
  accumulator=accumulateTravelTime(accumulator,elapsed);let travelled=0,steps=0;
  while(accumulator>=STEP){
    const previous=renderMotion.current.clone();
    const steeringYaw=(mode==='interior'||mode==='careers')?Math.atan2(camera.position.x,camera.position.z):yaw;
    const delta=locomotion.step(x,z,steeringYaw,running);
    if(mode==='town')for(const npc of teachers)npc.fixedUpdate(STEP,previous);
    const next=mode==='market'?nightMarket.move(previous,delta):worlds.move(space(),delta);
    renderMotion.previous.copy(previous);renderMotion.current.set(next.x,next.y,next.z);
    const movedX=next.x-previous.x,movedZ=next.z-previous.z;
    travelled+=Math.hypot(movedX,movedZ);
    actor.model.rotation.y=turnTowards(actor.model.rotation.y,movedX,movedZ,STEP);
    accumulator-=STEP;steps++;
  }
  actor.model.position.lerpVectors(renderMotion.previous,renderMotion.current,accumulator/STEP);
  renderMotion.shown.copy(actor.model.position);
  if(mode==='town'&&campusReady){
    const marketDistance=Math.hypot(actor.model.position.x-43,actor.model.position.z+22);
    if(marketDistance>2)marketGateApproachArmed=true;
    if(marketGateApproachArmed&&travelled>.001&&performance.now()>marketTravelCooldownUntil&&marketDistance<1.2){marketGateApproachArmed=false;requestMarket();}
  }
  // A render frame with no physics tick is not a stop. Never restart its walk.
  if(steps)actor.setWalking(travelled/(steps*STEP)>.03,travelled/(steps*STEP));
}
function advanceSoftwareNavigation(){
  // Settle accepted input before changing/removing a key, including on native
  // graphics when a held interval had no animation callback. Software also
  // calls this from its existing timer. Share one elapsed-time clock with
  // the draw loop; never advance the same physics or gait interval twice.
  const now=clock.getElapsedTime(),elapsed=takeNavigationElapsed(now);
  if(canStepNavigation()){
    stepNavigation(elapsed);if(!lunarRover?.driving)actor.update(discovery?.reduced()?0:Math.min(elapsed,.25));
    // Proximity actions must observe each walking step; their scene timers are
    // still advanced by the existing animation loop, so this tick adds no time.
    discovery?.update(mode,actor.model.position,0);
    if(mode==='market')nightMarket.update(0,now,camera,actor.model.position);
    updateInteraction();updateMission();
  }
  // Publish real controller/model state without inventing a rendered frame.
  publishDiagnostics(now);updateEntryLoading();curiosHub?.updatePlayer(actor.model.position,mode);flyover?.refresh();
}

function sceneViewStamp(scene){
  const d=discovery?.snapshot(),h=echo?.snapshot();
  return [scene.uuid,mode,phase,$('quality').value,viewport.width,viewport.height,entryReady,campusReady,worlds.scenery.status,actor.model.uuid,+actor.model.rotation.y.toFixed(3),...actor.model.position.toArray().map(v=>+v.toFixed(3)),...camera.position.toArray().map(v=>+v.toFixed(3)),...camera.quaternion.toArray().map(v=>+v.toFixed(4)),teachers.length,scene.children.length,d?.step,d?.souvenir,d?.chapelVisited,h?.helper,h?.helperStatus,h?.visible].join('|');
}

function animate(){
  if(detailFailed&&worlds?.pendingSurfaceDetails===0){detailFailed=false;if(canClearDetailWarning({entryReady,campusReady,campusLoading:campusLoad,pending:worlds.pendingSurfaceDetails,campusFailed:worlds.scenery.status==='fallback'}))$('campus-progress').hidden=true;}
  requestAnimationFrame(animate);const now=clock.getElapsedTime(),elapsed=now-lastTime,dt=Math.min(elapsed,.25);lastTime=now;const movementElapsed=takeNavigationElapsed(now,elapsed);publishDiagnostics(now);updateEntryLoading();curiosHub?.updatePlayer(actor.model.position,mode);
  if(!$('module-overlay').hidden){accumulator=0;return;}
  // Upload arriving selected-avatar/surface assets before natural video handover.
  // Keep gameplay paused and bound the hidden-world GPU cadence to 2 fps.
  if(intro?.open()){if(now-introWarmTime<.5)return;introWarmTime=now;}
  // Background game tabs must not compete with the visible game for the GPU.
  if(document.hidden){accumulator=0;frames=0;metricsTime=now;return;}
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  curiosHub?.rocketLaunch?.update(Math.min(elapsed,1),mode==='town'&&!lunarRover?.driving&&!flyover?.active&&!aerial&&isRocketViewingArea(actor.model.position),reducedMotion);
  orientationTour?.update();flyover?.refresh();if(lunarRover&&!lunarRover.driving)lunarRover.update(dt,{player:actor.model.position,paused:mode!=='town'||!canStepNavigation(),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});curiosHub?.updateLunarLab(now,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,paused:mode!=='town'||!canStepNavigation()});
  if(flyover?.active){if(!document.hidden&&!feedbackOpen()){flyover.update(dt);worlds.update(now,camera);}}
  else if(!curiosHub?.dialogOpen()&&!discoveryHandover?.open()&&(mode!=='town'||entryReady)&&!marketOpening&&!intro?.open()&&!discovery?.open()&&!document.hidden&&!feedbackOpen()&&!marketDialogOpen()&&mode!=='studio'&&!watchingEST&&$('module-overlay').hidden&&!$('reflection-dialog').open&&!$('leave-dialog').open){
    // Freeze the displayed pose while a panel is open. A zero-input physics
    // step can still snap interpolation to a pending body pose. Keep staged
    // preparation and scene updates below running independently of movement.
    if(explorationMenuOpen()||helperPicker.open()||echo?.open()){resetNavigationInput();actor.setWalking(false);}
    else {
    stepNavigation(movementElapsed);
    }
    if(mode==='town'){if(entryReady&&!campusReady&&actor.model.position.z<-14&&worlds.scenery.status==='pending')openCampusInBackground();for(const npc of teachers)npc.update(Math.max(0,elapsed),actor.model.position);}if(!lunarRover?.driving)actor.update(discovery?.reduced()?0:Math.min(movementElapsed,.25));prepareNextTask(now);worlds.update(now,camera);updateInteraction();updateMission();
  }else {renderMotion=null;locomotion.reset();accumulator=0;actor.setWalking(false);if(mode==='studio')preview?.update(dt);}
  updateTeacherLoading();
  // The ungraded queue observation follows visible elapsed time. Clamping it
  // like a physics step made a nine-second group take much longer on slow GPUs.
  if(mode==='market')nightMarket.update(Math.max(0,elapsed),now,camera,actor.model.position);
  if(discoveryReview)for(const npc of teachers)npc.root.visible=Boolean(discovery?.revealed());
  const paused=renderQuality(renderBackend,$('quality').value,devicePixelRatio).software&&mode!=='studio'&&!intro?.open()&&!discovery?.cinematic()&&(curiosHub?.dialogOpen()||discovery?.openDialog()||explorationMenuOpen()||helperPicker.open()||echo?.open()||marketDialogOpen()||!$('module-overlay').hidden||$('reflection-dialog').open);
  // Keep the current view still behind a paused software UI. Camera smoothing
  // alone must not repeatedly invalidate its cached world frame.
  if(!paused&&!discovery?.cinematic())updateCamera(dt,discovery?.reduced());extraCast?.update(dt,camera,mode,actor.model.position);if(!intro?.open()){discovery?.update(mode,actor.model.position,discovery?.cinematic()?Math.max(0,elapsed):dt);discoveryHandover?.update(mode==='market');explorationTools?.update(dt,!discovery?.open()&&!explorationMenuOpen()&&!helperPicker.open()&&!echo?.open());}echo?.update(dt,actor.model.position,camera,mode!=='studio'&&!helperPicker.open()&&!aerial&&!flyover?.active&&!feedbackOpen()&&!watchingEST&&$('module-overlay').hidden&&!$('reflection-dialog').open,activeScene());positionESTPlayButton();
  // Preserve the visible world while the requested Market or Stats module
  // loads. Repeated scene draws can starve the requested UI on a constrained GPU.
  const entryFrameRequired=mode==='town'&&entryPreparing&&entryGeometryReady&&!entryDrawSubmitted;
  // Show the existing arrival scene once while the authored entrance loads.
  // Walking still waits for the collision-ready entrance frame.
  if((mode==='town'&&entryPreparing&&(entryDrawSubmitted||(!entryGeometryReady&&entrySceneFrame>0)))||(marketOpening&&mode!=='market')||explorationTools?.preparing()||(discovery?.preparingTravel()&&!entryFrameRequired))return;
  // Preserve the completed initial view long enough for the released controls
  // and input to paint before another slow software scene draw.
  if(mode==='town'&&entryReady&&now-entryReadyAt<.12&&renderQuality(renderBackend,'auto',1).software)return;
  const uploadHasPriority=surfaceUploads.waitingForFrame&&(!frameGate.constrained||(!surfaceUploads.worldFrameDue&&!softwareMovementActive())||!softwareWorldActive());
  if(uploadHasPriority||portraitCapturePending||!frameGate.readyForDraw())return;
  let scene=mode==='studio'?studio:activeScene();
  // On a software GPU, a paused panel should not repeatedly rasterize an
  // unchanged world. Assets, UI and teacher preparation keep advancing.
  let frameStamp=null;
  if(paused||softwareNavigationAt!==null){frameStamp=sceneViewStamp(scene);if(paused&&lastPausedSceneStamp===frameStamp)return;}

  renderer.setViewport(0,0,viewport.width,viewport.height);renderer.setScissorTest(false);renderer.clear();
  if(mode==='studio'){const mobile=isMobile();renderer.setViewport(0,mobile?viewport.height*.43:0,mobile?viewport.width:viewport.width-(viewport.width>900?364:316),Math.max(1,viewport.height*(mobile?.57:1)-headerHeight));}
  renderer.toneMappingExposure=mode==='town'?1:1.03;
  // A moving/skinned player needs current-pose shadows every rendered frame.
  // Reusing a map also reuses the previous shadow-pass skeleton cache for one
  // frame in this Three build, making the suit jump as well as its self-shadow.
  const playerShadowChanged=shadowActor!==actor||shadowActorPosition.distanceToSquared(actor.model.position)>1e-10||shadowActorYaw!==actor.model.rotation.y||Boolean(actor.clips.walk?.enabled&&actor.clips.walk.getEffectiveWeight()>.0001);
  // Retain idle-world reuse and the original map resolution.
  const qualityChanged=applyRenderQuality();
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=qualityChanged||playerShadowChanged||$('quality').value!=='auto'||shadowScene!==scene||(renderer.shadowMap.enabled&&now-shadowTime>=((mode!=='town'||keys.size||joystick.x||joystick.z||flyover?.active||teachers.length)?.1:.5));
  if(renderer.shadowMap.needsUpdate){shadowScene=scene;shadowTime=now;shadowActor=actor;shadowActorPosition.copy(actor.model.position);shadowActorYaw=actor.model.rotation.y;}
  // A bounded warm frame prevents first-use texture/shader work at video EOF.
  const renderStarted=performance.now();renderer.render(scene,camera);lastPausedSceneStamp=frameStamp;lastRenderMs=performance.now()-renderStarted;submittedView={mode,previewRequest:mode==='studio'&&previewAssetsReady?previewRequest:null,body:mode==='studio'?draft?.body:null};frameGate.submitted();if(!frameGate.constrained){canvas.dataset.presentedMode=mode;canvas.dataset.presentedPreviewBody=submittedView.previewRequest!==null?submittedView.body:'';}lastUploadWorldPose=uploadWorldPose();surfaceUploads.worldSubmitted();if(scene===worlds.town){entrySceneFrame=frameGate.submittedFrame;if(entryPreparing&&entryGeometryReady)entryDrawSubmitted=true;}if(intro?.open())canvas.dataset.introWarmFrameMs=String(Math.round(performance.now()));frames++;renderedFrames++;canvas.dataset.rendered='true';
  if(!canvas.dataset.firstFrameMs)canvas.dataset.firstFrameMs=String(Math.round(performance.now()));
  publishDiagnostics(now,true);
}

function closeExplorationOptions(){resetNavigationInput();}
let companionOffered=false;
function landFromFlyover(point,heading){
 if(mode!=='town'||!campusReady)return false;
 const atMarket=Math.abs(point.x-43)<7.5&&point.z>-31&&point.z<-16;
 const landed=worlds.findLanding(atMarket?MARKET_APPROACH:point);if(!landed)return false;
 resetNavigationInput();worlds.teleport(false,landed.x,landed.z,landed.y);actor.model.position.copy(worlds.position(false));actor.model.rotation.y=(atMarket?0:heading)+Math.PI;actor.setWalking(false);yaw=atMarket?0:heading;aerial=false;$('aerial').setAttribute('aria-pressed','false');
 setLocation(atMarket?'Outside Sunday Markets':'Campus · safely landed');orientationTour?.landed(landed);requestAnimationFrame(()=>updateCamera(1,true));return true;
}
async function goToMarketEntrance(){orientationTour?.stop();if(adminReviewRequested)return requestMarket();return campusSpot(MARKET_APPROACH.x,MARKET_APPROACH.z,'Outside Sunday Markets',MARKET_APPROACH.yaw);}

function openWholeCharacterChoice(){
 resetNavigationInput();openStudio();
}

async function boot(){

  // On the normal exploration route, companions open only on request.
  const studioFirst=['wardrobe','scrubs','pants'].includes(new URLSearchParams(location.search).get('outfit'));
  // Share immutable startup downloads across the campus builders. Release the
  // temporary cache when construction finishes, so it cannot retain spare models.
  configurePhoneAssets();
  THREE.Cache.enabled=true;
  try{
    icons();const softwareBuffer=needsSoftwarePresentation(document);renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:softwareBuffer});renderer.setPixelRatio(sharpRatio);renderBackend=rendererName(renderer);renderer.setPixelRatio(renderQuality(renderBackend,$('quality').value,devicePixelRatio).pixelRatio);renderer.localClippingEnabled=true;renderer.shadowMap.enabled=renderQuality(renderBackend,$('quality').value,devicePixelRatio).shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;
    softwarePresentation=createSoftwarePresentation(canvas,softwareBuffer&&renderQuality(renderBackend,'auto',devicePixelRatio).software);
    frameGate=createGpuFrameGate(renderer,renderQuality(renderBackend,'auto',devicePixelRatio).software,completeWorldPresentation);
    surfaceUploads=createTextureUploadQueue({waitForFrame:()=>new Promise(resolve=>{const next=()=>requestAnimationFrame(()=>{if(document.hidden||!frameGate.ready()||(frameGate.constrained&&(softwareMovementActive()||(surfaceUploads?.worldFrameDue&&softwareWorldActive()))))next();else resolve();});next();}),upload:texture=>{renderer.initTexture(texture);frameGate.uploadSubmitted();}});
    camera=new THREE.PerspectiveCamera(55,1,.08,275);
    const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();
    $('loading-message').textContent=studioFirst?'Opening your wardrobe…':'Loading your character and learning district...';
    const avatarReady=loadProfileKit(copy(active())).then(()=>true,()=>false);
    // Fetch only the lightweight exterior module graph while the selected avatar
    // has asset priority. Geometry integration still waits for the entry paths.
    entryEnvironmentModule=import('./environment.js?v=broad-integrated-20261014');entryEnvironmentModule.catch(()=>{entryEnvironmentModule=null;});
    worlds=await createWorlds(message=>{$('loading-message').textContent=message;},()=>{detailFailed=true;detailNotice();},(hydrate,options)=>surfaceUploads.schedule(hydrate,options));applyRenderQuality();
    $('loading-message').textContent='Preparing your first view...';worlds.town.environment=environment.texture;worlds.town.environmentIntensity=.28;worlds.interior.environment=environment.texture;worlds.interior.environmentIntensity=.55;worlds.careers.environment=environment.texture;worlds.careers.environmentIntensity=.55;worlds.chapel.environment=environment.texture;worlds.chapel.environmentIntensity=.35;
    THREE.Cache.clear();THREE.Cache.enabled=false;
    worlds.teleport(false,ENTRANCE_STAGE.player.x,ENTRANCE_STAGE.player.z);phase='flourishing';$('phase').value='flourishing';worlds.phase('flourishing');actor=createFallbackCharacter();actor.model.position.copy(worlds.position(false));worlds.town.add(actor.model);populateProfiles();updateActor(avatarReady);flyover=createFlyover({camera,keys,canvas,root:$('experience'),canEnter:canFlyover,canShow:()=>mode==='town'&&campusReady,showReminder:()=>mode==='town'&&entryReady&&!intro?.open(),blockedReason:flyoverBlockedReason,beforeEnter:()=>closeExplorationOptions(false),resetInput:resetNavigationInput,fog:()=>worlds.town.fog,onLand:landFromFlyover});bindEvents();resize();
    await setMode('town');yaw=0;updateCamera(1,true);
    if(marketRequested&&adminReviewRequested)await requestMarket();
    // A shareable, playable quality-review viewpoint; normal entry remains the ECC entrance.
    const viewpoints={'discovery-mural':{p:[10.6,-38.4,Math.PI/2],name:'Mural detail'},'discovery-oval':{p:[-4,-57,Math.PI],name:'Oval · filming spot'},'teachers':{p:[-4,-49.8,0],name:'Meet your teachers · Oval'},'mr-middleton':{p:[-7,-50,0],name:'Mr Middleton · Oval'},'mr-psandodakis':{p:[-1,-50,0],name:'Mr Psandodakis · Oval'},'garden-pond':{p:[32,-10,Math.PI/2],name:'Garden pond'},'fountain-walk':{p:[-2.6,5.5,0],name:'Fountain walk'},'garden-benches':{p:[-5.8,-8,Math.PI/2],name:'Garden seating'},'chapel-exterior':{p:[-1.5,-4.5,.58],name:'Chapel exterior'},'ecc-courtyard':{p:[0,-2.8,0],name:'ECC Courtyard'},'avatar-studio':{p:[-8,5,Math.PI/2],name:'Avatar Studio'},'careers':{p:[-14,12,2.45],name:'Careers Advice Centre'},'est':{p:[16,9,Math.PI],name:'EST Prep'},'media':{p:[-4,-45,Math.PI],name:'English and Media'},'space':{p:[7,-53,-Math.PI/2],name:'SPACE'},'home-economics':{p:[43,-18,0],name:'Outside Sunday Markets'}};
    const view=marketRequested&&!adminReviewRequested?'home-economics':marketRequested?null:new URLSearchParams(location.search).get('view');
    const viewpoint=viewpoints[view];
    const completeView=Boolean(viewpoint||view==='chapel-interior');entryHandover=!completeView&&!studioFirst&&!marketRequested;
    if(renderQuality(renderBackend,'auto',1).software){softwareNavigationAt=clock.getElapsedTime();setInterval(advanceSoftwareNavigation,16);}
    if(!completeView){
      $('loading').hidden=true;icons();if(mode!=='market'&&!studioFirst)prepareEntry().catch(()=>{});animate();
      if(mode==='market')$('campus-progress').hidden=true;
      else if(studioFirst){
        $('campus-progress').hidden=true;
        setMode('studio').then(async opened=>{if(!opened){openCampusInBackground();return;}if(mode==='studio'){draft.body='pantstest';editorTab='style';renderEditor();updatePreview();}});
      }
    }else {icons();const ready=ensureCampus();animate();await ready;}
    if(!marketRequested&&new URLSearchParams(location.search).get('view')==='chapel-interior')await enterChapel();
    if(viewpoint){worlds.teleport(false,viewpoint.p[0],viewpoint.p[1]);actor.model.position.copy(worlds.position(false));yaw=viewpoint.p[2];if(view==='home-economics')actor.model.rotation.y=Math.PI;aerial=false;setLocation(viewpoint.name);updateCamera(1,true);}
    if(completeView){$('loading').hidden=true;icons();}
    curiosHub=createCuriosHub({worlds,sign,canvas,pause:()=>{resetNavigationInput();actor.setWalking(false);},resume:resetNavigationInput,visit:visitCampusDestination,visitRover:()=>campusSpot(ROVER_DOCK.boardX,ROVER_DOCK.boardZ,'Lunar Rover',Math.PI)});
    await loadEcho();if(npcInfo('echo').enabled)await echo.selectHelper({id:'echo',name:npcInfo('echo').name,model:'./assets/helpers/echo.glb'});
    extraCast=createExtraCast(worlds);const castReady=extraCast.load();prepareEntry().then(async()=>{curiosHub.installSigns();lunarRover ||= createLunarRover(worlds.town,worlds.townPhysics);ensureCampus().catch(()=>{});castReady.then(()=>extraCast.refreshGrounding()).catch(error=>console.warn('Welcome still loading',error));const greeting={id:'basil',name:'Welcome',enabled:true,videoEnabled:true,dialogue:config.welcome};if(greeting&&mode==='town'){resetNavigationInput();showNpc(greeting.id,greeting);}}).catch(()=>{});
    $('choose-helper').textContent='Companion';
    $('arrival-mission').hidden=true;
    document.title=config.title;document.querySelector('.brand').setAttribute('aria-label',config.title+' home');
    if(entryParams.get('teacher-preview')==='1'){$('world-footer').querySelector('.build-label').textContent='TEACHER PREVIEW · NOT PUBLISHED';}
    $('experience').setAttribute('aria-label',config.title+' 3D world');
    for(const [id,key] of Object.entries(MENU_DESTINATIONS)){const target=resolveCampusDestination(config,key);$(id).hidden=!target;if(target){($(id).querySelector('span')||$(id)).textContent=target.label;$(id).title=target.label;$(id).setAttribute('aria-label',target.label);}}

    $('resources-destination').hidden=true;$('world-footer').querySelector('.build-label').textContent='REUSE · REPURPOSE · RECYCLE';
    $('character-choice').onclick=openWholeCharacterChoice;
    // Wardrobe entry defers campus detail until Town is selected.
    // Normal entry is playable at the ECC entrance while distant detail streams.
    // Avatar alternatives load on selection through updatePreview/updateActor.
  }catch(error){THREE.Cache.clear();THREE.Cache.enabled=false;console.error(error);$('loading-message').textContent=`The 3D district could not open. Reload to retry. ${error.message}`;$('loading').querySelector('progress').hidden=true;$('fallback-link').hidden=false;const retry=$('avatar-retry');retry.textContent='Retry loading';retry.hidden=false;retry.onclick=()=>location.reload();}
}
boot();
