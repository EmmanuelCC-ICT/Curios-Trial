import * as THREE from 'three';
import {JUNIPER,riceBowl,takeawayBag} from './market-food.js';
import {marketCharacters} from './market-characters.js';
import {marketSurroundings} from './market-surroundings.js';
import {createOpeningDistrict} from './opening-district.js';
import {config,npcInfo,neutralLabel} from './world-settings.mjs?v=navigation-final1';
import {showNpc} from './neutral-cast.mjs';
export function createNightMarket({onExit,campusPalette,campusGrass,onPause=()=>{},onClose=()=>{}}){
 const scene=new THREE.Scene(),people=[];let visible=false;
 scene.background=new THREE.Color('#b9dce3');scene.fog=new THREE.Fog('#b9dce3',24,58);
 scene.add(new THREE.HemisphereLight('#e1f2ff','#98b697',1.15));
 const sun=new THREE.DirectionalLight('#ffdfb2',3.2);sun.position.set(-16,24,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});sun.shadow.normalBias=.035;scene.add(sun);
 const mats=new Map(),obstacles=[],customers=[],lanterns=[],labels=[];
 const cast=marketCharacters();let visitor=0;
 const mat=(colour,glow=false)=>{const campusKey={'#80654c':'timber','#dbc7a2':'timber','#387f7b':'blue','#38716b':'blue','#b7a784':'stone','#b4a17d':'timber'}[colour];if(!glow&&campusPalette&&campusKey)return campusPalette[campusKey];const key=colour+glow;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:colour,roughness:.85,...(glow?{emissive:colour,emissiveIntensity:.7}:{})}));return mats.get(key);};
 function box(w,h,d,x,y,z,c,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function orb(r,x,y,z,c,parent=scene,glow=false){const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),mat(c,glow));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function label(text,x,y,z,width=3,colour='#fcf0d5'){text=neutralLabel(text);
  const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');
  ctx.fillStyle='#183b3b';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#bfa878';ctx.lineWidth=7;ctx.strokeRect(4,4,760,184);
  ctx.font='bold 46px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=colour;ctx.fillText(text,384,96,718);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));s.position.set(x,y,z);s.scale.set(width,width/4,1);scene.add(s);labels.push({sprite:s,width});s.userData.labelCanvas=c;return s;
 }
 // Lettering sits flush on a solid campus-blue front panel, never billboards.
 function panel(text,x,y,z,w,h){
  const art=label(text,0,0,0);scene.remove(art);labels.splice(labels.findIndex(l=>l.sprite===art),1);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:art.material.map,roughness:.85}));
  mesh.userData.labelCanvas=art.userData.labelCanvas;mesh.userData.panel=true;mesh.position.set(x,y,z);scene.add(mesh);art.material.dispose();changeLabel(mesh,text);return mesh;
 }
 function changeLabel(sprite,text){text=neutralLabel(text);
  if(sprite.userData.text===text)return;sprite.userData.text=text;const c=sprite.userData.labelCanvas,ctx=c.getContext('2d');ctx.fillStyle=sprite.userData.panel?'#245779':'#183b3b';ctx.fillRect(0,0,768,192);ctx.strokeStyle='#bfa878';ctx.lineWidth=7;ctx.strokeRect(4,4,760,184);ctx.font=sprite.userData.panel?'bold 88px sans-serif':'bold 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fcf0d5';ctx.fillText(text,384,96,718);sprite.material.map.needsUpdate=true;
 }
 function npc(x,z,colour,id,facing=Math.PI){const g=new THREE.Group();g.position.set(x,0,z);box(.45,.72,.28,0,1.08,0,colour,g);orb(.22,0,1.67,0,'#c99575',g);for(const side of [-1,1]){box(.16,.65,.19,side*.13,.41,0,'#263d46',g);box(.13,.58,.16,side*.31,1.05,0,colour,g);}id=id||['customer-a','customer-b','customer-c','customer-d','customer-e'][visitor++%5];g.userData.npcId=id;scene.add(g);if(npcInfo(id).enabled){cast.register(g,id,{facing});people.push(g);}else g.visible=false;return g;}
 function stall(x,z){obstacles.push({x,z,w:4.1,d:1.65});}
 marketSurroundings(scene,obstacles,campusPalette,campusGrass);
 obstacles.push({x:JUNIPER.x,z:JUNIPER.z,w:JUNIPER.width,d:JUNIPER.depth});stall(-8,0);
 npc(-.65,JUNIPER.staffZ,'#e8c56a','mara',0);const maraLabel=label('MARA · START HERE',-.65,2.08,JUNIPER.staffZ,3);
 const helper=npc(1.1,JUNIPER.staffZ,'#68b5ae','sam',0);const helperLabel=label('SAM · MARKET CREW',1.1,2.3,-5.8,1.8);
 for(const [x,z]of [[-2,-1],[-3,1],[-2,2.5]])customers.push(npc(x,z,'#a1a7c4'));
 const trialBags=Array.from({length:6},(_,i)=>{const bowl=riceBowl();bowl.position.set(-1.5+(i%3)*.44,JUNIPER.top,-5.2+Math.floor(i/3)*.4);scene.add(bowl);return bowl;});
 const extraCustomers=[npc(-3,3.5,'#a1a7c4'),npc(-1,2,'#c9b17c'),npc(-1,3.5,'#c9b17c')];
 const observationLabels=[label('PHONE ORDER / ALREADY PAID',0,2.05,0,2.7),label('WALK-UP / ORDER & PAY',0,2.05,0,2.5),label('FOOD READY / COLLECT HERE',2.8,1.9,-4.4,2.8)];observationLabels.forEach(l=>l.visible=false);
 const trialBoard=panel('WORK BENCH',4.2,.43,-2.465,1.2,.42);
 box(1.3,.8,.65,4.2,.4,-2.8,'#387f7b');box(1.45,.1,.8,4.2,.85,-2.8,'#dbc7a2');box(.55,.025,.4,4.2,.915,-2.7,'#fff1cc');obstacles.push({x:4.2,z:-2.8,w:1.45,d:.8});
 const customerLabel=label('WAITING FOR A PHONE ORDER',-2,2.5,-1,2.4);
 const collection=new THREE.Group();scene.add(collection);collection.position.set(2.8,0,-4.4);
 box(1.25,.85,.7,0,.425,0,'#387f7b',collection);box(1.45,.1,.85,0,.9,0,'#dbc7a2',collection);
 for(const x of [-.35,0,.35]){const bag=takeawayBag();bag.position.set(x,.95,0);collection.add(bag);}
 const collectionObstacle={x:2.8,z:-4.4,w:1.45,d:.85};obstacles.push(collectionObstacle);
 const collectionLabel=panel('COLLECT HERE',0,.43,.356,1.15,.42);scene.remove(collectionLabel);collection.add(collectionLabel);
 const sign=new THREE.Group();sign.name='Juniper / movable collection sign';
 box(.09,1.5,.09,0,.75,0,'#80654c',sign);box(1.8,.55,.10,0,1.35,0,'#dbc7a2',sign);scene.add(sign);
 // Mount the text flush on the board: a camera-facing sprite cut through it.
 const signArt=label('PICK UP HERE  >',0,0,0,1.7);scene.remove(signArt);labels.splice(labels.findIndex(l=>l.sprite===signArt),1);
 const signText=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.45),new THREE.MeshStandardMaterial({map:signArt.material.map,roughness:.85}));
 signText.userData.labelCanvas=signArt.userData.labelCanvas;signText.position.set(0,1.35,.056);sign.add(signText);
 const signBack=signText.clone();signBack.position.z=-.056;signBack.rotation.y=Math.PI;sign.add(signBack);signArt.material.dispose();sign.visible=false;
 // Keep the complete stage cluster together when changing its placement.
 const beforeStage=new Set(scene.children),stageObstacleStart=obstacles.length;
 // A small stage, not a concert production. All forms remain replaceable.
 obstacles.push({x:0,z:-11,w:5,d:3.5});


 const crewRibbon=label('CREW PASS',4,2.3,-10,2.6);
 const celebrationLights=[-2,-1,1,2].map((x,i)=>orb(.18,x,3,-10,['#e8b96e','#77d6cd','#e8b96e','#77d6cd'][i],scene,true));
 const ticket=box(.65,.035,.32,-7.25,1.12,.35,'#edcb80');
 const stageGlow=orb(.22,0,3.2,-11,'#ffdb87',scene,true);
 const performer=npc(0,-11,'#c9976b',undefined,0);performer.position.y=.5;
 const band=[npc(-1.3,-11,'#699d93',undefined,0),npc(1.3,-11,'#ac7890',undefined,0)];band.forEach(p=>p.position.y=.5);
 // Freestanding sound-check equipment; no props attached to idle character rigs.
 const keyboard=new THREE.Group();keyboard.name='Stage keyboard and X stand';keyboard.position.set(-1.3,.5,-10.45);scene.add(keyboard);
 box(1.12,.11,.38,0,.9,0,'#253237',keyboard);
 for(let i=0;i<21;i++)box(.047,.025,.24,-.5+i*.05,.97,.045,'#f1ede2',keyboard);
 for(let i=0;i<20;i++)if(![2,6].includes(i%7))box(.028,.035,.14,-.475+i*.05,1,-.005,'#182326',keyboard);
 for(const side of [-1,1]){const leg=box(.035,.91,.065,0,.44,0,'#344349',keyboard);leg.rotation.z=side*.58;box(.5,.035,.42,side*.22,.018,0,'#344349',keyboard);}
 box(.1,.018,.025,.41,.975,-.14,'#7badac',keyboard);
 function microphone(x){
  const stand=new THREE.Group();stand.name='Stage microphone stand';stand.position.set(x,.5,-10.5);scene.add(stand);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.15,.17,.035,16),mat('#253237'));base.position.y=.02;stand.add(base);
  box(.025,1.28,.025,0,.66,0,'#4c595d',stand);
  const boom=box(.025,.3,.025,0,1.34,-.08,'#4c595d',stand);boom.rotation.x=-.7;
  const capsule=orb(.045,0,1.45,-.18,'#848c8c',stand);capsule.scale.set(.75,.75,1.65);
 }
 microphone(0);microphone(1.3);
 const thanks=label('THANK YOU, JUNIPER CREW',2.5,3.9,-10.8,4.5);thanks.visible=false;
 const audience=[npc(-3.7,-6.8,'#8eacbb'),npc(-4.4,-6.2,'#c6aa75'),npc(-3.2,-7.3,'#aaa0bd')];audience.forEach(p=>p.visible=true);

 for(const x of [-2,2])box(.6,1,.6,x,1,-10.8,'#243537');
 const stageBreakLabel=label('FREE STAGE BREAK',-5,2.1,-8,3);
 const stageBench=box(2,.45,.7,-5,.23,-8.8,'#b4a17d');obstacles.push({x:-5,z:-8.8,w:2,d:.7});
 // Juniper is centred at (0,-5); the stage now faces the same entrance from its right.
 for(const child of scene.children)if(!beforeStage.has(child)&&child!==ticket){child.position.x+=8;child.position.z+=6;}
 for(const obstacle of obstacles.slice(stageObstacleStart)){obstacle.x+=8;obstacle.z+=6;}
 crewRibbon.position.set(9.3,2.3,-2.8);thanks.position.set(8,3.9,-4.8);
 audience.forEach((p,i)=>p.position.set(6.3+i*.9,0,-1.8-(i%2)*.3));
 stageBench.position.set(6.5,.23,1);stageBreakLabel.position.set(6.5,2.1,1);
 Object.assign(obstacles.at(-1),{x:6.5,z:1});

 const keepsake=new THREE.Group();box(.3,.5,.3,0,.3,0,'#efc36b',keepsake);orb(.14,0,.65,0,'#ffdf98',keepsake,true);keepsake.position.set(-8.7,1.08,.35);scene.add(keepsake);
 const plant=new THREE.Group();scene.add(plant);plant.position.set(-8,1.08,.35);box(.27,.25,.27,0,.125,0,'#ba8159',plant);box(.04,.42,.04,0,.4,0,'#4b7855',plant);for(const x of [-.12,.12])orb(.15,x,.52,0,'#79a767',plant);plant.visible=false;

 const trinkets={};
 const plane=new THREE.Group();plane.position.set(-7.6,1.14,-.1);scene.add(plane);for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.ConeGeometry(.13,.4,3),mat('#fff1cf'));wing.rotation.z=Math.PI/2;wing.rotation.x=side*.3;wing.position.x=side*.055;plane.add(wing);}trinkets.plane=plane;
 const compass=new THREE.Group();compass.position.set(-8.25,1.11,-.1);scene.add(compass);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.035,16),mat('#d5b769'));compass.add(dial);const needle=box(.025,.015,.2,0,.03,0,'#a74638',compass);needle.rotation.y=.5;trinkets.compass=compass;
 const duck=new THREE.Group();duck.position.set(-8.8,1.1,-.1);scene.add(duck);const body=orb(.12,0,.11,0,'#f5cd55',duck);body.scale.z=1.3;orb(.085,0,.25,.08,'#f5cd55',duck);box(.1,.035,.09,0,.24,.16,'#dc873f',duck);trinkets.duck=duck;
 for(const x of [-10,10])for(let z=-12;z<=10;z+=5.5){box(.13,4,.13,x,2,z,'#8d8971');orb(.14,x,3.85,z,'#ffe0a1',scene,true);}
 for(let i=0;i<17;i++){const x=-10+i*1.25,y=3.9-.6*Math.sin(Math.PI*i/16);orb(.085,x,y,4,'#ffdd93',scene,true);}

 for(const x of [5.5,8.5]){box(.09,2.5,.09,x,1.25,7,'#b39a77');lanterns.push(orb(.2,x,2.5,7,'#ffd578',scene,true));}


 const empty=()=>{};
 const district=createOpeningDistrict({scene,obstacles,npc,palette:campusPalette,onInspect:empty,onAllocate:empty,onApply:empty,onWork:empty,onRun:empty,onTalk:empty,onReturn:empty});
 npc(-9,5.3,'#b89d76','kenji',Math.PI/2);
 // Same physical connection to the community centre, freely accessible.
 function move(p,delta){const next={x:p.x,y:0,z:p.z};const valid=(x,z)=>((x>-11.4&&x<11.4&&z>-12.7&&z<18)||(x>-34&&x<-12.8&&z>-12.5&&z<12.5)||(x>=-12.8&&x<=-11.4&&z>2.7&&z<5.3))&&!obstacles.some(o=>o.enabled!==false&&Math.abs(x-o.x)<o.w/2+.3&&Math.abs(z-o.z)<o.d/2+.3);if(valid(p.x+delta.x,p.z))next.x+=delta.x;if(valid(next.x,p.z+delta.z))next.z+=delta.z;return next;}
 return {scene,spawn:new THREE.Vector3(0,0,15),observing:false,isOpen:()=>Boolean(document.querySelector('#npc-dialog[open]')),
 setVisible(value){visible=value;document.getElementById('experience').classList.toggle('in-market',value);if(value)cast.start();},move,
 interaction(p){if(Math.abs(p.x)<4&&p.z>11.4)return {label:'Return to campus',action:onExit};const nearby=people.filter(n=>n.visible&&npcInfo(n.userData.npcId).dialogue&&n.position.distanceTo(p)<3).sort((a,b)=>a.position.distanceTo(p)-b.position.distanceTo(p))[0];if(!nearby)return null;const id=nearby.userData.npcId;return {label:'Talk to '+npcInfo(id).name,action:()=>{onPause();showNpc(id);}};},
 update(dt,t,camera,p){if(!visible)return;district.update(dt,t,matchMedia('(prefers-reduced-motion: reduce)').matches,p);cast.update(dt,matchMedia('(prefers-reduced-motion: reduce)').matches);},
 snapshot:()=>({neutral:true,npcs:people.map(n=>({id:n.userData.npcId,name:npcInfo(n.userData.npcId).name,visible:n.visible})),visuals:cast.snapshot()})};
}
