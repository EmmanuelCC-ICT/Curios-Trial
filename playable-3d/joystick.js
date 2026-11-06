export function createJoystick(container){
 const pad=document.createElement('div');pad.className='thumb-stick';pad.tabIndex=0;pad.setAttribute('role','group');pad.setAttribute('aria-label','Movement joystick. Drag to walk; release to stop. Keyboard arrow keys also work.');
 const knob=document.createElement('span');knob.className='thumb-stick-knob';knob.setAttribute('aria-hidden','true');pad.append(knob);container.append(pad);
 const input={x:0,z:0,reset};let pointer=null;
 function reset(){const id=pointer;pointer=null;input.x=input.z=0;knob.style.transform='translate(0px,0px)';pad.classList.remove('active');if(id!==null&&pad.hasPointerCapture(id))pad.releasePointerCapture(id);}
 function update(e){const box=pad.getBoundingClientRect(),radius=box.width*.32,dx=e.clientX-box.left-box.width/2,dz=e.clientY-box.top-box.height/2,length=Math.hypot(dx,dz),limit=Math.min(length,radius),gain=length>0?limit/length:0;knob.style.transform=`translate(${dx*gain}px,${dz*gain}px)`;const strength=Math.max(0,(limit/radius-.12)/.88);input.x=length?dx/length*strength:0;input.z=length?dz/length*strength:0;}
 pad.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;pad.setPointerCapture(pointer);pad.classList.add('active');update(e);});
 pad.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();update(e);}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===pointer)reset();});
 for(const type of ['contextmenu','selectstart','dragstart'])pad.addEventListener(type,e=>e.preventDefault());
 window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);window.addEventListener('resize',reset);
 return input;
}
