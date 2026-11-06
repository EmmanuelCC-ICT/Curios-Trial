import * as THREE from 'three';

// Uses the game's camera, input set and render loop. No assets or extra loop.
export function createFlyover({camera, keys, canvas, root, canEnter, canShow=canEnter, beforeEnter=()=>{}, resetInput, fog, onLand=()=>false, showReminder=()=>true, blockedReason=()=>''}) {
  let saved=null, yaw=0, pitch=0, targetYaw=0, targetPitch=0, pointer=null;
  const velocity=new THREE.Vector3(), desired=new THREE.Vector3(), rotation=new THREE.Euler(0,0,0,'YXZ');
  const held=new Set();
  const button=document.createElement('button');
  button.id='flyover-toggle';button.textContent='Flyover';button.setAttribute('aria-pressed','false');button.title='Flyover camera (F)';
  const dock=root.querySelector('#flyover-slot');
  function placeButton(){(saved?root:dock||root).append(button);button.style.top=saved?'16px':'';}
  placeButton();
  const panel=document.createElement('section');panel.id='flyover-panel';panel.hidden=true;panel.setAttribute('aria-label','Flyover recording controls');
  panel.innerHTML=`<strong>Flyover camera</strong><p>WASD move · Q / E lower / rise<br>Drag to look · Arrow keys turn / tilt<br>F or Esc return · H hide controls<br>Touch: tap the view to show controls</p><label>Speed <input id="flyover-speed" type="range" min="1" max="40" value="10" step="1"><output id="flyover-speed-value">10 m/s</output></label><div class="flyover-pad"><button data-fly-key="KeyW" aria-label="Fly forward">Forward</button><button data-fly-key="KeyS" aria-label="Fly backward">Back</button><button data-fly-key="KeyA" aria-label="Fly left">Left</button><button data-fly-key="KeyD" aria-label="Fly right">Right</button><button data-fly-key="KeyE" aria-label="Raise camera">Rise</button><button data-fly-key="KeyQ" aria-label="Lower camera">Lower</button></div><div class="flyover-actions"><button id="flyover-bird">Bird’s-eye</button><button id="flyover-hide">Hide controls</button><button id="flyover-exit">Return to player</button></div>`;
  root.append(panel);
  const quick=document.createElement('div');quick.id='flyover-quick-controls';quick.hidden=true;quick.setAttribute('role','group');quick.setAttribute('aria-label','Flyover shortcuts');
  const reminder=document.createElement('button');reminder.id='flyover-reminder';reminder.textContent='Flyover · F';reminder.title='Explore with the Flyover camera (F)';reminder.setAttribute('aria-controls','flyover-panel');reminder.setAttribute('aria-keyshortcuts','F');reminder.setAttribute('aria-describedby','flyover-hint');
  const hint=document.createElement('p');hint.id='flyover-hint';hint.hidden=true;
  const modalHint=document.createElement('p');modalHint.className='flyover-modal-hint';modalHint.hidden=true;
  quick.append(reminder,hint);root.append(quick);
  reminder.onclick=()=>{beforeEnter();enter();};
  const landButton=document.createElement('button');landButton.id='flyover-land';landButton.textContent='Land · L';landButton.hidden=true;landButton.title='Land on nearby safe ground (L)';landButton.setAttribute('aria-keyshortcuts','L');quick.append(landButton);
  const landingStatus=document.createElement('p');landingStatus.id='flyover-landing-status';landingStatus.setAttribute('role','status');landingStatus.hidden=true;quick.append(landingStatus);
  function land(){if(!saved)return false;stop();if(!onLand(camera.position.clone(),yaw)){landingStatus.hidden=false;landingStatus.textContent='No safe ground found here. Fly to a clear outdoor path and try Land again.';return false;}exit();return true;}
  landButton.onclick=land;
  const speed=panel.querySelector('input'), output=panel.querySelector('output');
  speed.addEventListener('input',()=>output.value=`${speed.value} m/s`);
  const hiddenUI=()=>document.body.classList.toggle('flyover-clean');
  panel.querySelector('#flyover-hide').onclick=hiddenUI;
  panel.querySelector('#flyover-bird').onclick=()=>{targetPitch=-Math.PI/2+.01;canvas.focus();};
  panel.querySelector('#flyover-exit').onclick=exit;
  button.onclick=()=>{if(saved)exit();else{beforeEnter();enter();}};
  for(const control of panel.querySelectorAll('[data-fly-key]')){
    control.addEventListener('pointerdown',e=>{e.preventDefault();control.setPointerCapture(e.pointerId);held.add(control.dataset.flyKey);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])control.addEventListener(type,()=>held.delete(control.dataset.flyKey));
    control.addEventListener('contextmenu',e=>e.preventDefault());
  }
  function stop(){keys.clear();held.clear();velocity.set(0,0,0);pointer=null;targetYaw=yaw;targetPitch=pitch;}
  function enter(){
    if(saved||!canEnter())return;
    saved={position:camera.position.clone(),quaternion:camera.quaternion.clone(),far:camera.far,fov:camera.fov,zoom:camera.zoom,fog:fog()?{near:fog().near,far:fog().far}:null,focus:document.activeElement};
    resetInput();stop();rotation.setFromQuaternion(camera.quaternion,'YXZ');yaw=targetYaw=rotation.y;pitch=targetPitch=rotation.x;
    camera.far=600;camera.updateProjectionMatrix();if(fog()){fog().near=240;fog().far=550;}
    document.body.classList.add('in-flyover');placeButton();panel.hidden=false;landButton.hidden=false;landingStatus.hidden=true;button.textContent='Return to player';button.setAttribute('aria-pressed','true');canvas.focus();refresh();return true;
  }
  function exit(){
    if(!saved)return;
    const previous=saved;saved=null;stop();resetInput();camera.position.copy(previous.position);camera.quaternion.copy(previous.quaternion);camera.far=previous.far;camera.fov=previous.fov;camera.zoom=previous.zoom;camera.updateProjectionMatrix();if(previous.fog&&fog())Object.assign(fog(),previous.fog);
    document.body.classList.remove('in-flyover','flyover-clean');placeButton();panel.hidden=true;landButton.hidden=true;landingStatus.hidden=true;button.textContent='Flyover';button.setAttribute('aria-pressed','false');refresh();previous.focus?.focus();
  }
  function keydown(e){
    const editing=['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName);
    if(saved&&e.code==='Escape'){e.preventDefault();exit();return true;}
    if(editing)return Boolean(saved);
    if(e.code==='KeyF'&&!e.repeat){e.preventDefault();saved?exit():enter();return true;}
    if(!saved)return false;
    if(e.code==='KeyL'){e.preventDefault();if(!e.repeat)land();return true;}
    if(e.code==='KeyH'&&!e.repeat){e.preventDefault();hiddenUI();}
    if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}
    return true;
  }
  function pointerdown(e){if(!saved)return false;canvas.focus();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);return true;}
  function pointermove(e){if(!saved)return false;if(pointer?.id===e.pointerId){if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>6)pointer.moved=true;targetYaw-=(e.clientX-pointer.x)*.004;targetPitch=THREE.MathUtils.clamp(targetPitch-(e.clientY-pointer.y)*.004,-Math.PI/2+.01,Math.PI/2-.01);pointer.x=e.clientX;pointer.y=e.clientY;}return true;}
  function update(dt){
    if(!saved)return;
    const down=k=>keys.has(k)||held.has(k), axis=(a,b)=>Number(down(a))-Number(down(b));
    targetYaw+=axis('ArrowLeft','ArrowRight')*dt*.8;targetPitch=THREE.MathUtils.clamp(targetPitch+axis('ArrowUp','ArrowDown')*dt*.8,-Math.PI/2+.01,Math.PI/2-.01);
    const blend=1-Math.exp(-dt*8);yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;camera.quaternion.setFromEuler(rotation.set(pitch,yaw,0));
    // Horizontal translation stays predictable even when looking straight down.
    const x=axis('KeyD','KeyA'),z=axis('KeyS','KeyW'),y=axis('KeyE','KeyQ');
    desired.set(x*Math.cos(yaw)+z*Math.sin(yaw),y,-x*Math.sin(yaw)+z*Math.cos(yaw));if(desired.lengthSq()>1)desired.normalize();desired.multiplyScalar(Number(speed.value));velocity.lerp(desired,blend);camera.position.addScaledVector(velocity,dt);
    camera.position.y=THREE.MathUtils.clamp(camera.position.y,.5,180);
  }
  function refresh(){
    button.hidden=!saved&&!canShow();
    const visible=Boolean(saved)||showReminder();quick.hidden=!visible;reminder.hidden=Boolean(saved);
    const reason=!saved&&visible?(blockedReason()||(!canEnter()?'Close any open panel to use Flyover · F.':'')):'';
    if(reminder.disabled!==Boolean(reason))reminder.disabled=Boolean(reason);
    if(hint.textContent!==reason)hint.textContent=reason;hint.hidden=!reason;
    const modal=!saved&&visible&&reason?document.querySelector('#discovery-dialog[open],#helper-picker[open],#reflection-dialog[open],#leave-dialog[open],#whole-character-choice[open],#orientation-handover[open]'):null;
    if(modal){if(modalHint.parentElement!==modal){const heading=modal.querySelector('h1,h2,[role=heading]');if(heading)heading.after(modalHint);else modal.prepend(modalHint);}if(modalHint.textContent!==reason)modalHint.textContent=reason;}
    modalHint.hidden=!modal;
  }
  return {get active(){return Boolean(saved);},enter,exit,land,stop,keydown,pointerdown,pointermove,pointerup(e){if(e?.type==='pointerup'&&e.pointerType==='touch'&&pointer&&!pointer.moved)document.body.classList.remove('flyover-clean');pointer=null;},update,refresh};
}
