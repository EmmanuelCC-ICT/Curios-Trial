let panel,activeId,closed=false;
function finishWelcome(){closed=true;if(panel)panel.hidden=true;document.body.classList.remove('showing-basil-welcome');document.dispatchEvent(new Event('curios-welcome-finished'));}
export async function showWelcomeVideo(details){
 if(!panel){panel=document.createElement('aside');panel.id='basil-welcome';panel.className='family-welcome';panel.setAttribute('aria-label','Welcome to Curios');const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.textContent='Welcome!';close.textContent='×';close.setAttribute('aria-label','Close welcome');close.onclick=finishWelcome;header.append(title,close);const copy=document.createElement('p');copy.className='family-welcome-copy';const go=document.createElement('button');go.textContent='Let’s explore';go.onclick=finishWelcome;panel.append(header,copy,go);document.body.append(panel);for(const event of ['pointerdown','pointerup','click'])panel.addEventListener(event,e=>e.stopPropagation());}
 panel.querySelector('p').textContent=details.dialogue;activeId=details.id;closed=false;panel.hidden=false;document.body.classList.add('showing-basil-welcome');
}
export function welcomeIsOpen(id){return activeId===id&&panel&&!closed;}
export function welcomeIsPlaying(){return false;}
export function welcomeViewShift(){return 0;}
export function updateWelcomeAnchor(id,root,camera,mode,player){
 if(!panel||activeId!==id||closed)return;
 const visible=mode==='town'&&!document.body.classList.contains('driving-lunar-rover')&&root.position.distanceTo(player)<9;panel.hidden=!visible;document.body.classList.toggle('showing-basil-welcome',visible);
}
