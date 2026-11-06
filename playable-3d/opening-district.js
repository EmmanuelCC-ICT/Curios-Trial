import {neutralLabel} from './world-settings.mjs?v=navigation-final1';
import * as T from 'three';
import {approvedPalette,dressedBox,batchStatic} from './environment/approved-campus-kit.js?v=ecc-ba60122';

// Authored community work courtyard. Built only after an explicit visit.
// Shares campus materials and already requested market characters; no new downloads.
export function createOpeningDistrict({scene,obstacles,npc,palette,onInspect,onAllocate,onApply,onWork,onRun,onTalk,onWelcome=()=>{},onReception=onWelcome,onReturn}){
 const p=palette||approvedPalette(new T.Group()),root=new T.Group(),architecture=new T.Group();root.name='Community administration centre';architecture.name='Work courtyard / static campus kit';
 const moss=new T.MeshStandardMaterial({color:'#52755b',roughness:.92}),paper=new T.MeshStandardMaterial({color:'#fff1cf',roughness:.95}),ink=new T.MeshStandardMaterial({color:'#244b48',roughness:.78});
 const clay=new T.MeshStandardMaterial({color:'#bc805e',roughness:.95});
 const b=(x,y,z,w,h,d,m=p.timber,parent=architecture)=>dressedBox(parent,x,y,z,w,h,d,m);
 const block=(x,z,w,d)=>obstacles.push({x,z,w,d});
 const boards=[];
 function sign(lines,x,y,z,w=2.8,h=1,parent=architecture){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=384;const ctx=canvas.getContext('2d');
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:.9}));mesh.position.set(x,y,z);parent.add(mesh);
  const draw=text=>{ctx.fillStyle='#254c46';ctx.fillRect(0,0,768,384);ctx.strokeStyle='#d9bf83';ctx.lineWidth=8;ctx.strokeRect(9,9,750,366);ctx.fillStyle='#fff3d6';ctx.textAlign='center';ctx.textBaseline='middle';text.forEach((s,i)=>{ctx.font=(i===0?'bold 52px':'36px')+' sans-serif';ctx.fillText(neutralLabel(s),384,75+i*85,710);});texture.needsUpdate=true;};draw(lines);boards.push({mesh,draw});return {mesh,draw};
 }
 function bench(x,z,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;architecture.add(g);b(0,.48,0,2,.12,.55,p.timber,g);b(0,.95,-.25,2,.45,.07,p.timber,g);for(const dx of [-.75,.75])b(dx,.23,0,.1,.46,.5,p.blue,g);block(x,z,angle? .75:2,angle?2:.75);}
 function planter(x,z,w=1.2){b(x,.26,z,w,.52,1,p.stone);b(x,.53,z,w-.16,.06,.82,p.soil);for(let i=0;i<5;i++){const leaf=new T.Mesh(new T.IcosahedronGeometry(.27,1),moss);leaf.scale.set(.6,1.6,.7);leaf.position.set(x+(i-2)*w/6,.79,z+Math.sin(i)*.16);architecture.add(leaf);}block(x,z,w,1);}
 function roof(x,z,w,d,title){
  // Open-front cutaway offices keep the third-person camera and entrances clear.
  const wall=new T.MeshStandardMaterial({color:'#e4e3dc',roughness:.9});
  b(x,1.65,z-d/2,w,3.3,.18,wall);block(x,z-d/2,w,.18);
  for(const dx of [-w/2,w/2]){b(x+dx,.65,z,.16,1.3,d,wall);block(x+dx,z,.16,d);}
  b(x,.005,z,w,.025,d,p.stone);
  sign([title],x,2.7,z-d/2+.105,3,.36);
 }
 function officeChair(x,z){b(x,.48,z,.65,.12,.65,p.blue);b(x,.85,z-.28,.65,.7,.1,p.blue);b(x,.23,z,.12,.46,.12,ink);}
 function computer(x,z){b(x,1.25,z,.7,.45,.07,ink);b(x,1.02,z,.12,.25,.12,ink);b(x,1,z+.3,.65,.025,.22,p.blue);}

 function desk(x,z,w=2.4){b(x,.9,z,w,.12,.8,p.timber);for(const dx of [-w/2+.15,w/2-.15])b(x+dx,.43,z,.12,.86,.68,p.blue);block(x,z,w,.8);}
 function crate(x,y,z,parent=architecture){b(x,y+.21,z,.62,.42,.48,clay,parent);for(const dy of [-.13,.13])b(x,y+.21+dy,z+.246,.64,.035,.025,p.timber,parent);b(x,y+.21,z+.265,.3,.14,.012,paper,parent);}
 function tablet(x,y,z){b(x,y,z,.45,.3,.035,p.blue);sign(['ORDERS','24 / TODAY'],x,y,z+.021,.4,.25);}
 // A generous paved route joins the existing market at its west gate.
 b(-23,-.08,0,23,.14,26,p.paving);b(-12.5,-.04,4,3,.1,4,p.paving);
 b(-34.4,.42,0,.25,.84,26,p.stone);b(-23,.42,-12.9,23,.84,.25,p.stone);b(-23,.42,12.9,23,.84,.25,p.stone);
 // Three recognisable places, not three floating menus.
 roof(-28,-6.6,8,5,'RESEARCH / NORA');computer(-29,-6.1);officeChair(-27.5,-7.1);
 desk(-29,-6);desk(-25,-6,2);
 b(-31.1,1,-6.25,.7,.1,.55,p.timber);sign(['ARCHIVE','8 YEARS EARLIER'],-31,1.22,-5.7,.7,.35);
 for(const x of [-30.25,-27.75])b(x,1.05,-7.5,.08,2.1,.08,p.blue);b(-29,1.5,-7.5,2.8,1.15,.12,p.blue);sign(['REGIONAL BULLETIN','80 employers / 3 years','WHO • WHEN • WHERE?'],-29,1.5,-7.425,2.65,1);
 tablet(-25,1.14,-5.9);for(let i=0;i<3;i++)b(-29+i*.55,.985,-6,.4,.025,.5,paper);
 b(-24.8,1,-7.45,.09,2,.09,p.blue);const newsBoard=sign(['A CLAIM IS A START','Check what supports it'], -24.8,1.8,-7.425,2.2,.8);
 sign(['OPERATIONS / DEV','Service yard and deliveries'],-19.3,2.8,-9.05,6,.8);
 desk(-20,-6);for(let i=0;i<4;i++)crate(-22+(i%2)*.75,Math.floor(i/2)*.43,-8);
 // Stock racks, tools and a delivery trolley identify practical work.
 for(const y of [.35,1,1.65])b(-17.4,y,-8,2.2,.07,.65,p.timber);
 for(const x of [-18.5,-16.3])b(x,.85,-8,.08,1.7,.7,p.blue);
 for(let i=0;i<6;i++)crate(-18.1+(i%3)*.65,1.04,-8);
 block(-17.4,-8,2.3,.8);
 for(let i=0;i<4;i++)b(-20.7+i*.4,1.65,-7.6,.12,.35,.06,i%2?ink:clay);
 roof(-28,6.5,8,4.8,'OPPORTUNITIES / APPLICATIONS');computer(-29,6);officeChair(-27.5,4.85);
 desk(-29,6,2.8);tablet(-29,1.14,6);for(const x of [-26.4,-25.2])b(x,1,5.3,.08,2,.08,p.blue);b(-25.8,1.55,5.3,1.6,1.3,.1,p.timber);sign(['WE ARE HIRING','Service • Stock','SUPERVISED ROLES'],-25.8,1.55,5.365,1.48,1.15);block(-25.8,5.3,1.6,.2);
 bench(-31,8.2);bench(-24.5,8.4);bench(-18,7.7);
 for(const [x,z,w]of [[-32,-10,2],[-24,-10,2],[-15,-10,2],[-32,11,2],[-21,11,2],[-15,10,1.5]])planter(x,z,w);
 // A single office shell and reception distinguish this from outdoor market stalls.
 const officeWall=new T.MeshStandardMaterial({color:'#e4e3dc',roughness:.9});
 // One continuous street-facing facade, with a clear central reception opening.
 for(const [z,d]of [[-3.85,12.3],[8.35,5.3]]){b(-12.9,.7,z,.18,1.4,d,officeWall);block(-12.9,z,.18,d);}
 const frontLintel=b(-12.9,3.45,0,.22,.22,22,officeWall,root);
 b(-33,1.8,0,.2,3.6,22,officeWall);block(-33,0,.2,22);
 b(-28,.3,11,10,.6,.2,officeWall);block(-28,11,10,.2);
 sign(['COMMUNITY ADMINISTRATION','Research • Operations • Opportunities'],-28,3.2,-10.85,9,.9);
 sign(['RECEPTION','Next gigs • Paid research'],-17,1.2,2.26,2.4,.55);
 sign(['SERVICE YARD →','Work trials with Dev'],-23,1.8,1.5,2.8,.7);
 sign(['SUNDAY MARKET →','Return through the entrance'],-14,1.55,5.7,2.5,.8);
 // Filing cabinets and desk equipment make these functioning offices.
 for(const x of [-31.7,-30.8]){b(x,.8,-8.35,.75,1.6,.5,p.blue);for(const y of [.35,.8,1.25])b(x,y,-8.085,.25,.04,.025,ink);}
 // Separate dynamic props retain simple transformations; static forms batch by material.
 const shade=new T.Group();shade.name='Deployable shade and cool station';root.add(shade);
 for(const x of [-20.5,-16.5])b(x,2.05,3,.08,4.1,.08,p.blue,shade);
 const canopy=b(-18.5,4.12,3,4.3,.08,2.6,paper,shade);b(-18.4,.4,3,1.6,.8,.7,p.blue,shade);b(-18.4,.83,3,1.7,.1,.8,paper,shade);
 const shadeObstacle={x:-18.4,z:3,w:1.7,d:.8,enabled:false};obstacles.push(shadeObstacle);shade.visible=false;
 const accessible=new T.Group();root.add(accessible);b(-19,.85,-2,2.6,.06,.1,p.blue,accessible);for(const x of [-20.2,-17.8])b(x,.4,-2,.07,.8,.07,p.blue,accessible);accessible.visible=false;
 const delivery=new T.Group();delivery.name='Delivery trolley';root.add(delivery);b(0,.18,0,.9,.08,.7,p.blue,delivery);for(const x of [-.32,.32])for(const z of [-.22,.22]){const wheel=new T.Mesh(new T.CylinderGeometry(.1,.1,.08,10),ink);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.1,z);delivery.add(wheel);}crate(0,.23,0,delivery);b(0,.7,-.42,.7,.05,.07,p.blue,delivery);for(const x of [-.3,.3])b(x,.45,-.42,.05,.6,.05,p.blue,delivery);
 const roleBoards=[-22,-19,-16].map((x,i)=>{b(x,.38,-2.2,1.25,.76,.75,p.stone);b(x,1.2,-2.21,.075,1,.075,p.blue);block(x,-2.2,1.25,.75);return sign(['WORK ROLE '+(i+1),'Assign available blocks'],x,1.45,-2.15,2.2,.68,root);});
 const tokens=new T.Group();root.add(tokens);const workBlocks=Array.from({length:6},(_,i)=>b(-21+i*.4,1.05,-6,.28,.18,.25,p.glow,tokens));
 for(const x of [-23.5,-21.1])b(x,1.45,-7.85,.075,2.9,.075,p.blue);
 const result=sign(['WORK PLAN','Choose a pressure at the yard','No extra wages or grades'],-22.3,2.55,-7.8,2.6,1,root);
 const parcels=Array.from({length:6},()=>{const parcel=new T.Group();crate(0,0,0,parcel);root.add(parcel);parcel.visible=false;return parcel;});

 const interview=sign(['OPPORTUNITIES','Talk to the adviser'],-31.2,1.15,6.1,1.35,.48,root);
 // A community table and refill/recycling station give the shared space a purpose.
 desk(-17,1.8,2.6);computer(-17,1.7);officeChair(-18.5,.8);bench(-26,2);for(const x of [-17.7,-17,-16.3]){b(x,1.0,1.8,.25,.1,.25,paper);b(x,1.14,1.6,.12,.3,.12,p.blue);}
 for(const [x,title]of [[-32.3,'RECYCLE'],[-31.4,'REFILL']]){b(x,.5,3,.65,1,.55,p.blue);sign([title],x,.75,3.286,.55,.22);block(x,3,.65,.55);}
 root.add(batchStatic(architecture));scene.add(root);
 const people=[];
 function person(x,z,id,role){const actor=npc(x,z,'#6f9187',id,0);root.attach(actor);actor.userData.role=role;people.push(actor);return actor;}
 const researcher=person(-29,-7.15,'nora','Nora');
 const worker=person(-21.7,-5.8,'customer-d','Visitor');
 const courier=person(-17,-1,'dev','Dev');
 const supervisor=person(-29,4.85,'customer-e','Visitor');
 const visitor=person(-17,.8,'customer-a','Receptionist');
 let elapsed=0,pressure='technology',served=null,ready=false;
 return {root,spawn:{x:-16.5,y:0,z:4.5,yaw:.25},
  update(dt,t,reduced,playerPosition){frontLintel.visible=!playerPosition||playerPosition.x>=-12.8;elapsed+=Math.min(dt,.1);const phase=reduced?0:(elapsed%24)/24;const distance=phase<.5?phase*2:(1-phase)*2;
   courier.position.set(-14.7,0,-5+distance*10);delivery.position.set(-14.7,.0,courier.position.z+.65);
   visitor.rotation.y=0;
   supervisor.position.set(-29,0,4.85);
   worker.rotation.z=reduced?0:Math.sin(t*1.4)*.025;researcher.rotation.y=reduced?0:Math.sin(t*.35)*.07;
  },snapshot(){return {people:people.length,pressure,served,applicationReady:ready,readyParcels:served??0,shade:shade.visible,accessible:accessible.visible,staticMeshes:root.children.find(o=>o.name==='Work courtyard / static campus kit')?.children.length||0};}
 };
}
