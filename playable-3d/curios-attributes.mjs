import * as THREE from 'three';
import {ATTRIBUTES_SITE} from './attributes-site.mjs';

const studios = [
  ['Collaboration','#287543','The Build Table'],
  ['Engagement','#245d9e','The Project Desk'],
  ['Flexibility','#a84813','The Remix Studio'],
  ['Critical Thinking','#a83358','The Clue Wall'],
  ['Respect & Responsibility','#63488f','The Shared Space']
];
const plans = [
  ['Keep the outdoor layout','The big display still needs wall space. The new room only has space around its edges.'],
  ['Split the display into stations','The same work fits on three small tables. Visitors can move between them without blocking the aisle.'],
  ['Ask what space is available','A teammate finds a side alcove. You can keep the centrepiece there and move the rest onto two tables.']
];

export function createAttributesPavilion({worlds,sign,pause,resume,canvas}) {
  const {x,z} = ATTRIBUTES_SITE;
  const points = studios.map((studio,index)=>({x:x+(index-2)*3,z:z-2.7,studio}));
  const desk = {x:x+3,z:z+2.4};
  let root, dialog, goal='', reflection='', previousChoice=null, choice=null, take=0, entry=null;

  function install(){
    if(root)return;
    root=new THREE.Group();
    root.name='Curios Attributes';
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
    label('CURIOS ATTRIBUTES',5.4,0,3.59,-3.44);
    for(const [index,{studio:[name,colour,subtitle]}] of points.entries()){
      const px=(index-2)*3;
      const accent=new THREE.MeshStandardMaterial({color:colour});
      for(const side of [-1,1])solid(.16,2.7,.28,accent,px+side*1.27,1.42,-3.65);
      block(2.7,.34,.32,accent,px,2.77,-3.65);
      solid(2.65,2.68,.22,stone,px,1.42,-4.75);
      label(name,2.56,px,2.78,-3.46,colour);
      label(subtitle,2.2,px,1.65,-4.62,colour);
      block(2.35,.035,1.25,accent,px,.095,-3.32);
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
    dialog.innerHTML=`<header><span>Curios Attributes · Sample module</span><button type="button" data-close aria-label="Return to pavilion">✕</button></header>
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
    show('My Fieldbook','04 · Reflect and plan',
      '<div class="attributes-scene"><span>Sample entry · ArtQuest</span><strong>I moved the labels after a partner said they were hard to read. They found the information faster on the second try.</strong></div><p>Look for evidence of using feedback, adapting to change or persisting when a task gets difficult.</p><label>My next-project goal<input maxlength="180" placeholder="When I get feedback, I will…"></label><label>What did I do, and what happened?<textarea maxlength="800" rows="3" placeholder="Describe a real example, or try a sample reflection."></textarea></label><p><small>Demo entries stay in this visit and clear on refresh.</small></p><output aria-live="polite"></output>',
      [['Save demo entry',()=>{
        if(!goal.trim()&&!reflection.trim()){
          dialog.querySelector('output').textContent='Add a goal or reflection first.';
          return;
        }
        entry={goal:goal.trim(),reflection:reflection.trim()};
        dialog.querySelector('output').textContent='Demo entry saved for this visit.';
      }],['Review descriptors',review],['Back to the studio',lesson]]);
    const input=dialog.querySelector('input'), notes=dialog.querySelector('textarea');
    input.value=goal;notes.value=reflection;
    input.oninput=()=>{goal=input.value;dialog.querySelector('output').textContent='';};
    notes.oninput=()=>{reflection=notes.value;dialog.querySelector('output').textContent='';};
    if(entry&&entry.goal===goal.trim()&&entry.reflection===reflection.trim())dialog.querySelector('output').textContent='Demo entry saved for this visit.';
  }

  function review(){
    show('Review your evidence','05 · Check in',
      '<p>Compare your examples with these sample summaries of the ECC Flexibility descriptors.</p><dl><dt>Needs Attention</dt><dd>Finds it difficult to adapt to changes or use feedback.</dd><dt>Satisfactory</dt><dd>Can adapt with support and sometimes accepts feedback.</dd><dt>Good</dt><dd>Uses feedback to improve and persists with some support.</dd><dt>Excellent</dt><dd>Embraces new ideas, responds positively to feedback and perseveres through difficult tasks.</dd></dl><p>ECC requires evidence of at least three descriptors for a rating. This demo leaves the rating open for further reflection.</p><blockquote data-entry></blockquote><p data-goal></p>',
      [['Return to My Fieldbook',fieldbook]]);
    dialog.querySelector('[data-entry]').textContent=entry?.reflection||'Sample evidence · I moved the labels after a partner gave me feedback.';
    if(entry?.goal)dialog.querySelector('[data-goal]').textContent='Next goal · '+entry.goal;
  }

  function interaction(p){
    if(!root)return null;
    const point=points.find(at=>Math.hypot(p.x-at.x,p.z-at.z)<1.35);
    if(point){
      const [name,,subtitle]=point.studio;
      return {label:'Open '+name,action:name==='Flexibility'?lesson:()=>show(subtitle,name,
        '<p>This studio doorway is part of the pavilion preview. Try the Flexibility studio for a playable lesson.</p>',
        [['Return to pavilion',()=>dialog.close()]])};
    }
    if(Math.hypot(p.x-desk.x,p.z-desk.z)<1.35)return {label:'Open My Fieldbook',action:fieldbook};
    return null;
  }
  return {install,interaction,open:()=>Boolean(dialog?.open)};
}
