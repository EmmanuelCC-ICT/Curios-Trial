import * as THREE from 'three';
import {ATTRIBUTES_SITE} from './attributes-site.mjs';

const studios = [
  [
    "Communication",
    "#1458b4",
    "communication",
    "Help someone understand your idea and listen to theirs."
  ],
  [
    "Creativity",
    "#e66f00",
    "creativity",
    "Try a fresh idea or find a different way to make something work."
  ],
  [
    "Citizenship",
    "#008586",
    "citizenship",
    "Think about who your choices affect and how you can contribute."
  ],
  [
    "Critical thinking",
    "#7939a1",
    "critical-thinking",
    "Compare ideas, question assumptions and use evidence to choose."
  ],
  [
    "Collaboration",
    "#d92a65",
    "collaboration",
    "Bring different strengths together to reach a shared goal."
  ],
  [
    "Character",
    "#41812e",
    "character",
    "Act fairly, take responsibility and show care for others."
  ],
  [
    "Independence",
    "#176bc2",
    "independence",
    "Plan your next step and make decisions about your own learning."
  ],
  [
    "Resilience",
    "#44892f",
    "resilience",
    "Recover from a setback and try again with what you learned."
  ]
];
const plans = [
  ['Keep the outdoor layout','The big display still needs wall space. The new room only has space around its edges.'],
  ['Split the display into stations','The same work fits on three small tables. Visitors can move between them without blocking the aisle.'],
  ['Ask what space is available','A teammate finds a side alcove. You can keep the centrepiece there and move the rest onto two tables.']
];

export function createAttributesPavilion({worlds,sign,pause,resume,canvas}) {
  const {x,z} = ATTRIBUTES_SITE;
  const points = studios.map((studio,index)=>({x:x+(index-3.5)*1.92,z:z-2.7,studio}));
  const desk = {x:x+3,z:z+2.4};
  let root, dialog, previousChoice=null, choice=null, take=0;

  function install(){
    if(root)return;
    root=new THREE.Group();
    root.name='Curios Capabilities';
    root.position.set(x,0,z);
    const timber=new THREE.MeshStandardMaterial({color:0xb58457});
    const stone=new THREE.MeshStandardMaterial({color:0xe5d7bd});
    const ink=new THREE.MeshStandardMaterial({color:0x214647});
    const block=(w,h,d,material,px,y,pz)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
      mesh.position.set(px,y,pz);
      mesh.receiveShadow=true;
      root.add(mesh);
      return mesh;
    };
    const label=(title,width,px,y,pz,colour='#214647')=>{
      const board=sign(title,width,'#fff8e8',colour);
      board.position.set(px,y,pz);
      root.add(board);
    };
    block(16,.12,10,stone,0,.02,0).userData.walkable=true;
    block(4,.08,2.8,stone,0,.005,6.3).userData.walkable=true;
    const {block:collider}=worlds.townPhysics;
    const solid=(w,h,d,material,px,y,pz)=>{
      block(w,h,d,material,px,y,pz);
      collider(x+px,y,z+pz,w,h,d);
    };
    // The raised centre and open sides keep the studios visible from the campus camera.
    for(const px of [-7.7,7.7]){
      for(const pz of [-4.4,4.4])solid(.24,3.9,.24,timber,px,1.95,pz);
      block(1.1,.22,9.6,timber,px,3.9,0);
    }
    block(16.5,.36,1.25,ink,0,4.02,4.4);
    block(16.5,.24,2.4,timber,0,3.92,-3.55);
    for(const px of [-6,-4,-2,0,2,4,6])block(.15,.16,8.5,timber,px,3.89,.15);
    label('CURIOS CAPABILITIES',5.4,0,3.59,-3.44);
    for(const [index,{studio:[name,colour,slug]}] of points.entries()){
      const px=(index-3.5)*1.92;
      const accent=new THREE.MeshStandardMaterial({color:colour});
      for(const side of [-1,1])solid(.16,2.7,.28,accent,px+side*.89,1.42,-3.65);
      block(1.9,.34,.32,accent,px,2.77,-3.65);
      solid(1.85,2.68,.22,stone,px,1.42,-4.75);
      label(name,1.85,px,2.78,-3.46,colour);
      const texture=new THREE.TextureLoader().load('./portfolio/icons/'+slug+'.svg');
      texture.colorSpace=THREE.SRGBColorSpace;
      const badge=new THREE.Mesh(new THREE.PlaneGeometry(1.52,1.52),
        new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.05}));
      badge.position.set(px,1.52,-4.62);
      root.add(badge);
      block(1.72,.035,1.25,accent,px,.095,-3.32);
    }
    solid(1.8,.9,.65,timber,3,.5,1.15);
    label('MY FIELDBOOK',1.8,3,1.16,1.53);
    worlds.town.add(root);
  }

  function show(title,kicker,body,actions){
    if(!dialog){
      dialog=document.createElement('dialog');
      dialog.className='attributes-dialog';
      dialog.setAttribute('aria-labelledby','attributes-heading');
      dialog.addEventListener('close',()=>{resume();canvas.focus({preventScroll:true});});
      document.body.append(dialog);
    }
    dialog.innerHTML=`<header><span>Curios Capabilities · Sample module</span><button type="button" data-close aria-label="Return to pavilion">✕</button></header>
      <main><p class="attributes-kicker">${kicker}</p><h2 id="attributes-heading" tabindex="-1">${title}</h2>${body}<div class="attributes-actions"></div></main>`;
    dialog.querySelector('[data-close]').onclick=()=>dialog.close();
    for(const [label,action] of actions){
      const button=document.createElement('button');
      button.type='button';
      button.textContent=label;
      button.onclick=action;
      dialog.querySelector('.attributes-actions').append(button);
    }
    if(!dialog.open){pause();dialog.showModal();}
    dialog.querySelector('h2').focus();
    dialog.scrollTop=0;
  }

  function lesson(){
    show('The Remix Studio','01 · Learn',
      '<p>Flexibility is how we respond when a plan, a piece of feedback or a situation changes.</p><blockquote>Try naming what changed, choosing what to keep, and testing one adjustment.</blockquote><p>If a display wall is too small, you could keep the strongest work and test a different arrangement with your team.</p>',
      [['Enter the festival scene',scene],['Open My Fieldbook',fieldbook]]);
  }

  function scene(){
    show('The venue has changed','02 · Try',
      '<div class="attributes-scene"><span>Courtyard · rain</span><span>→</span><strong>Small indoor room</strong></div><p>Your group planned a school festival display outdoors. Rain has moved it inside. You have the same work to show, with less space. What will you do first?</p>',
      plans.map(([label],index)=>[label,()=>{previousChoice=choice;choice=index;take++;outcome();}]));
  }

  function outcome(){
    const previous=previousChoice;
    const comparison=previous===null?'':`<p><strong>Previous take:</strong> ${plans[previous][0]}. ${plans[previous][1]}</p>`;
    show(plans[choice][0],'03 · See what changed',
      `<div class="attributes-scene"><span>Take ${take}</span><strong>${plans[choice][1]}</strong></div>${comparison}<p>What did your plan keep? What changed when you responded to the new constraint?</p>`,
      [['↶ Rewind to the decision',scene],['Take it to My Fieldbook',fieldbook]]);
  }

  function fieldbook(){
    show('My Fieldbook','Capability portfolios',
      '<p><a href="./portfolio/student.html">Student portfolio and entry</a></p><p><a href="./portfolio/teacher.html">Teacher portfolio view</a></p>',[]);
  }

  function interaction(p){
    if(!root)return null;
    const point=points.find(at=>Math.abs(p.x-at.x)<.94 && Math.abs(p.z-at.z)<1.35);
    if(point){
      const [name,,slug,description]=point.studio;
      const actions=[['Open My Fieldbook',fieldbook]];
      if(name==='Resilience')actions.unshift(['Try the festival scenario',lesson]);
      return {label:'Open '+name,action:()=>show(name,'Key capability',
        `<img width="88" height="88" alt="" src="./portfolio/icons/${slug}.svg"><p>${description}</p>`,actions)};
    }
    if(Math.hypot(p.x-desk.x,p.z-desk.z)<1.35)return {label:'Open My Fieldbook',action:fieldbook};
    return null;
  }
  return {install,interaction,open:()=>Boolean(dialog?.open)};
}
