import * as THREE from 'three';
let panel,video,activeId,closed=false;
export function showWelcomeVideo(details){
 if(!panel){
  panel=document.createElement('aside');panel.id='basil-welcome';panel.setAttribute('aria-label','Basil’s welcome video');
  const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');title.textContent='A quick hello from Basil';close.textContent='×';close.setAttribute('aria-label','Close welcome video');close.onclick=()=>{closed=true;video.pause();panel.hidden=true;};header.append(title,close);
  video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='metadata';video.controls=true;video.setAttribute('aria-label','Basil introduces Curios');
  const footer=document.createElement('footer'),sound=document.createElement('button'),transcript=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');sound.textContent='Sound on';sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'Sound on':'Mute';if(video.paused)video.play().catch(()=>{});};summary.textContent='Transcript';transcript.append(summary,text);footer.append(sound,transcript);panel.append(header,video,footer);document.body.append(panel);
  for(const event of ['pointerdown','pointerup','click'])panel.addEventListener(event,e=>e.stopPropagation());
 }
 if(activeId!==details.id){video.src=details.video;video.poster=details.videoPoster;video.replaceChildren();if(details.videoCaptions){const track=document.createElement('track');track.kind='captions';track.label='English';track.srclang='en';track.src=details.videoCaptions;video.append(track);}panel.querySelector('details p').textContent=details.dialogue;activeId=details.id;}
 closed=false;panel.hidden=false;video.play().catch(()=>{});
}
export function updateWelcomeAnchor(id,root,camera,mode,player){
 if(!panel||activeId!==id||closed)return;
 const near=mode==='town'&&root.position.distanceTo(player)<7;
 const pos=root.position.clone().add(new THREE.Vector3(0,2.25,0)).project(camera);
 const visible=near&&pos.z>-1&&pos.z<1&&Math.abs(pos.x)<1.15;
 const wasHidden=panel.hidden;panel.hidden=!visible;if(!visible){video.pause();return;}if(wasHidden&&!video.ended)video.play().catch(()=>{});
 const width=Math.min(innerWidth<900?200:320,innerWidth-24),height=panel.offsetHeight||240;
 const x=(pos.x*.5+.5)*innerWidth+65,y=(-pos.y*.5+.5)*innerHeight-45;
 panel.style.width=width+'px';panel.style.left=Math.max(12,Math.min(innerWidth-width-12,x))+'px';panel.style.top=(innerWidth<900?(document.querySelector('#experience > header')?.getBoundingClientRect().bottom||184)+8:Math.max(92,Math.min(innerHeight-height-90,y)))+'px';
}
