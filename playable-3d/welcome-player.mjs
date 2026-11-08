import * as THREE from 'three';
function finishWelcome(){document.body.classList.remove('showing-basil-welcome');closed=true;playing=false;if(panel)panel.hidden=true;document.dispatchEvent(new Event('curios-welcome-finished'));}
let panel,activeId,closed=false,slides=[],index=0,playing=true,remaining=0,last=0;
function renderSlide(){
 const slide=slides[index];if(!slide)return;panel.querySelector('.welcome-slide').scrollTop=0;
 panel.querySelector('.welcome-slide h3').textContent=slide.title;panel.querySelector('.welcome-slide p').textContent=slide.text;
 const image=panel.querySelector('.welcome-slide img');image.src=`./assets/curios/${slide.image}`;image.alt=slide.image==='lunar-lab.svg'?'Lunar Lab moon and orbit emblem':slide.image==='avatar-studio.jpg'?'Avatar Studio with the original character choices':slide.title==='Make it your own.'?'Teacher setup page with world and character settings':slide.title==='Walk in. Open an app.'?'Campus map showing the app rooms':'Curios learning world';
 panel.querySelector('[data-count]').textContent=`${index+1} / ${slides.length}`;
 panel.querySelector('[data-chapter]').textContent=`TEACHER SHOWCASE · ${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
 panel.style.setProperty('--welcome-progress',`${(index+1)/slides.length*100}%`);
 const copy=panel.querySelector('.welcome-copy');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)copy.animate?.([{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
 panel.querySelector('[data-back]').disabled=index===0;panel.querySelector('[data-next]').textContent=index===slides.length-1?'Let’s go!':'Next';
 remaining=slide.seconds*1000;last=performance.now();
}
export async function showWelcomeVideo(details){
 if(!panel){
  panel=document.createElement('aside');panel.id='basil-welcome';panel.setAttribute('aria-label','Basil’s welcome slides');
  const header=document.createElement('header'),identity=document.createElement('div'),chapter=document.createElement('span'),title=document.createElement('strong'),close=document.createElement('button');chapter.dataset.chapter='';title.textContent='Basil’s Curios showcase';identity.className='welcome-identity';identity.append(chapter,title);close.textContent='×';close.setAttribute('aria-label','Close welcome');close.onclick=finishWelcome;header.append(identity,close);
  const slide=document.createElement('section');slide.className='welcome-slide';const image=document.createElement('img'),copy=document.createElement('div'),heading=document.createElement('h3'),text=document.createElement('p');copy.className='welcome-copy';copy.append(heading,text);slide.append(image,copy);
  const footer=document.createElement('footer');for(const [key,label,action]of [['back','Previous',()=>{if(index>0){index--;renderSlide();}}],['pause','Pause',()=>{playing=!playing;panel.querySelector('[data-pause]').textContent=playing?'Pause':'Play';last=performance.now();}],['next','Next',()=>{if(index<slides.length-1){index++;renderSlide();}else finishWelcome();}]]){const button=document.createElement('button');button.dataset[key]='';button.textContent=label;button.onclick=action;footer.append(button);}const count=document.createElement('span');count.dataset.count='';footer.append(count);
  panel.append(header,slide,footer);document.body.append(panel);for(const event of ['pointerdown','pointerup','click'])panel.addEventListener(event,e=>e.stopPropagation());
  const response=await fetch('./assets/curios/welcome-slides.json?v=prototype-intro-1');slides=await response.json();
 }
 if(!slides.length){closed=true;panel.hidden=true;document.body.classList.remove('showing-basil-welcome');return;}
 if(activeId!==details.id||index===slides.length-1){index=0;activeId=details.id;playing=true;panel.querySelector('[data-pause]').textContent='Pause';renderSlide();}
 closed=false;panel.hidden=false;last=performance.now();
}
export function welcomeIsOpen(id){return activeId===id&&panel&&!closed;}
export function welcomeIsPlaying(id){return activeId===id&&panel&&!panel.hidden&&!closed&&playing;}
export function welcomeViewShift(){return panel&&!panel.hidden&&innerWidth>=600?(innerWidth<900?.25:.19):0;}
export function updateWelcomeAnchor(id,root,camera,mode,player){
 if(!panel||activeId!==id||closed)return;
 const pos=root.position.clone().add(new THREE.Vector3(0,2.25,0)).project(camera);
 const visible=mode==='town'&&!document.body.classList.contains('driving-lunar-rover')&&root.position.distanceTo(player)<7&&pos.z>-1&&pos.z<1&&Math.abs(pos.x)<1.15;
 panel.hidden=!visible;document.body.classList.toggle('showing-basil-welcome',visible);const now=performance.now();if(visible&&playing){remaining-=Math.min(100,now-last);if(remaining<=0&&index<slides.length-1){index++;renderSlide();}else if(remaining<=0){finishWelcome();}}last=now;if(!visible||closed)return;
 const width=Math.min(innerWidth<600?innerWidth-24:Math.min(510,innerWidth*.42),innerWidth-24),headerBottom=document.querySelector('#experience > header')?.getBoundingClientRect().bottom||80;
 panel.style.width=width+'px';panel.style.maxHeight=Math.max(160,innerWidth<600?Math.min(innerHeight*.51,innerHeight-headerBottom-24):innerHeight-headerBottom-24)+'px';
 const height=panel.offsetHeight||380,top=Math.max(headerBottom+12,innerHeight-height-(innerWidth<600?14:24));
 panel.style.left=(innerWidth>=600?innerWidth-width-24:innerWidth-width-12)+'px';panel.style.top=top+'px';
}
