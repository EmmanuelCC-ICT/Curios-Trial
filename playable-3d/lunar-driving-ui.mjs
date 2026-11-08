export function createLunarDrivingUI({onView,onRecover,onBrake,canDrive=()=>true,document:doc=document,now=()=>performance.now()}){
 const panel=doc.createElement('section');panel.id='lunar-driving-controls';panel.hidden=true;panel.setAttribute('aria-label','Rover driving controls');
 panel.innerHTML='<div class="rover-toolbar"><button type="button" data-view>Camera: Top view</button><button type="button" data-recover>Unstick rover</button></div><div class="rover-pedals"><div class="rover-steering"><button type="button" data-drive="left" aria-label="Steer rover left">↶ Left</button><button type="button" data-drive="right" aria-label="Steer rover right">Right ↷</button></div><div class="rover-gears"><button type="button" data-drive="forward" aria-label="Drive rover forward">▲ Drive</button><button type="button" data-drive="reverse" aria-label="Reverse rover">▼ Reverse</button></div><button type="button" data-brake>Stop</button></div><p>Hold Drive or Reverse; steer with the other thumb.</p>';
 doc.body.append(panel);const held=new Map(),pulses=new Map();let active=false,lastPointerAt=-Infinity;
 function reset(){held.clear();pulses.clear();panel.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
 const available=()=>active&&canDrive();
 for(const button of panel.querySelectorAll('[data-drive]')){
  const command=button.dataset.drive;
  button.addEventListener('pointerdown',e=>{if(!available()||e.button!==0)return;e.preventDefault();lastPointerAt=now();held.set(e.pointerId,command);button.setPointerCapture(e.pointerId);button.classList.add('pressed');});
  const release=e=>{held.delete(e.pointerId);if(![...held.values()].includes(command))button.classList.remove('pressed');};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
  button.addEventListener('click',()=>{if(available()&&now()-lastPointerAt>400)pulses.set(command,now()+220);});
  for(const event of ['contextmenu','selectstart','dragstart'])button.addEventListener(event,e=>e.preventDefault());
 }
 panel.querySelector('[data-view]').onclick=()=>{if(active){reset();onView?.();}};
 panel.querySelector('[data-recover]').onclick=()=>{if(available()){reset();onRecover?.();}};
 panel.querySelector('[data-brake]').onclick=()=>{reset();onBrake?.();};
 doc.defaultView.addEventListener('blur',reset);doc.addEventListener('visibilitychange',reset);
 return {panel,reset,setActive(value){active=value;panel.hidden=!value;reset();},setView(label){panel.querySelector('[data-view]').textContent='Camera: '+label;},read(){if(!available()){reset();return {throttle:0,steer:0};}const commands=new Set(held.values());for(const [command,until]of pulses)if(now()<until)commands.add(command);else pulses.delete(command);return {throttle:Number(commands.has('forward'))-Number(commands.has('reverse')),steer:Number(commands.has('left'))-Number(commands.has('right'))};}};
}
