import * as THREE from 'three';
import {addAuthoredGarden} from './ecc-preview/authored-garden.js';

// The user's reference is a three-part visitor centre, not an open box pavilion.
// Everything is authored geometry; the existing supplied Curios artwork is reused.
export const LUNAR_SITE=Object.freeze({x:38,z:-68.5,arrivalX:38,arrivalZ:-54.5});
export const LUNAR_LAYOUT=Object.freeze({floorY:.30,doorHalfWidth:2.15,frontZ:3.4,rearZ:-5.7,domeX:-6,domeZ:-1.2,domeRadius:5.2,wingX:5.4,wingZ:-1.4,wingRadius:4.2});
const mat=(color,roughness=.55,metalness=.15,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
const navy=mat(0x122332,.48,.35),navyLight=mat(0x21384a,.5,.35),pearl=mat(0xd9dfdb,.38,.5),metal=mat(0x778b94,.34,.68),gold=mat(0xa58d5f,.4,.55),black=mat(0x182129,.76,.1);
const cyan=mat(0x2bdad7,.24,.2,{emissive:0x00b9bf,emissiveIntensity:.75});
const warm=mat(0xffd9a0,.3,.1,{emissive:0xffc372,emissiveIntensity:.8});
const glass=mat(0x8bb9c4,.13,.2,{transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false});
const stone=mat(0xb7b3a8,.9,.02),sand=mat(0x837f70,.96,.01),leaf=mat(0x6d7950,.9,0,{side:THREE.DoubleSide});
function add(parent,geometry,material,x=0,y=0,z=0,name){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=!material.transparent;m.receiveShadow=true;if(name)m.name=name;parent.add(m);return m;}
const box=(p,w,h,d,m,x,y,z,name)=>add(p,new THREE.BoxGeometry(w,h,d),m,x,y,z,name);
const cyl=(p,r,h,m,x,y,z,n=48)=>add(p,new THREE.CylinderGeometry(r,r,h,n),m,x,y,z);
const sphere=(p,r,m,x,y,z,n=32)=>add(p,new THREE.SphereGeometry(r,n,Math.max(12,n/2)),m,x,y,z);
function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function roundedBox(p,w,h,d,r,m,x,y,z){const g=new THREE.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:true,bevelSize:Math.min(.045,r/3),bevelThickness:.025,bevelSegments:2,curveSegments:8});g.translate(0,0,-d/2);return add(p,g,m,x,y,z);}
function tube(p,points,r,m,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),closed,'centripetal');return add(p,new THREE.TubeGeometry(curve,Math.max(20,points.length*6),r,8,closed),m);}
function ring(p,r,y,x=0,z=0,material=cyan,width=.045){const m=add(p,new THREE.TorusGeometry(r,width,8,96),material,x,y,z);m.rotation.x=Math.PI/2;return m;}
function canvasTexture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function textPanel(p,{title,subtitle='',kicker='',w=3,h=1.3,x=0,y=1,z=0,background='#102738',font='700',border=false}){
 const t=canvasTexture(1024,Math.round(1024*h/w),(g,W,H)=>{g.clearRect(0,0,W,H);if(background){g.fillStyle=background;g.fillRect(0,0,W,H);}g.textAlign='center';if(border){g.strokeStyle='#d0b67b';g.lineWidth=5;g.strokeRect(12,12,W-24,H-24);}g.fillStyle='#f4f0e7';g.font=`${font} ${Math.round(Math.min(H*.30,W*.85/Math.max(1,title.length*.62)))}px Arial`;g.fillText(title,W/2,H*.46);g.fillStyle='#72e6df';g.font=`500 ${Math.round(Math.min(H*.13,W*.86/Math.max(1,subtitle.length*.56)))}px Arial`;g.fillText(subtitle,W/2,H*.72);if(kicker){g.fillStyle='#efd7a5';g.font=`500 ${Math.round(Math.min(H*.095,W*.86/Math.max(1,kicker.length*.56)))}px Arial`;g.fillText(kicker,W/2,H*.9);}});
 return add(p,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:!background,side:THREE.DoubleSide}),x,y,z);
}
function seedRandom(seed){let s=seed>>>0;return()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
function moonMaterial(){const rng=seedRandom(127);const t=canvasTexture(1024,512,(g,W,H)=>{g.fillStyle='#9b9a91';g.fillRect(0,0,W,H);for(let i=0;i<8000;i++){const b=110+rng()*90;g.fillStyle=`rgba(${b},${b},${b-4},.14)`;const r=1+rng()*8;g.beginPath();g.arc(rng()*W,rng()*H,r,0,Math.PI*2);g.fill();}for(let i=0;i<120;i++){const x=rng()*W,y=rng()*H,r=3+rng()*30;const a=g.createRadialGradient(x-r*.2,y-r*.25,r*.1,x,y,r);a.addColorStop(0,'#74756f');a.addColorStop(.65,'#85867f');a.addColorStop(.81,'#c5c2b7');a.addColorStop(1,'rgba(128,128,120,0)');g.fillStyle=a;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}});return mat(0xc6c4b9,.95,0,{map:t,bumpMap:t,bumpScale:.075});}
function artwork(){if(typeof window==='undefined')return null;const t=new THREE.TextureLoader().load('./assets/curios/curios-branding.png');t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function geodesicDome(root){
 const group=new THREE.Group();group.name='Lunar Lab geodesic conservatory';group.position.set(-6,.30,-1.2);root.add(group);
 const R=5.2,N=24,B=6,positions=[],indices=[],lines=[];
 for(let j=0;j<B;j++){const phi=j/B*Math.PI/2;for(let i=0;i<N;i++){const theta=i/N*Math.PI*2+(j%2)*Math.PI/N;positions.push(R*Math.cos(phi)*Math.sin(theta),R*Math.sin(phi),R*Math.cos(phi)*Math.cos(theta));}}
 const top=positions.length/3;positions.push(0,R,0);
 const edgeSet=new Set();function tri(a,b,c){if([a,b,c].some(i=>positions[i*3]>2.45))return;indices.push(a,b,c);for(const [i,j]of [[a,b],[b,c],[c,a]]){const key=[Math.min(i,j),Math.max(i,j)].join(':');if(!edgeSet.has(key)){edgeSet.add(key);lines.push([i,j]);}}}
 for(let j=0;j<B-1;j++)for(let i=0;i<N;i++){const k=(i+1)%N,a=j*N+i,b=j*N+k,c=(j+1)*N+i,d=(j+1)*N+k;tri(a,c,b);tri(b,c,d);}
 for(let i=0;i<N;i++)tri((B-1)*N+i,top,(B-1)*N+(i+1)%N);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();add(group,g,glass,0,0,0,'Triangulated dome glazing');
 const struts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.035,1,7),metal,lines.length),o=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 lines.forEach(([i,j],k)=>{a.fromArray(positions,i*3);b.fromArray(positions,j*3);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());o.scale.set(1,a.distanceTo(b),1);o.updateMatrix();struts.setMatrixAt(k,o.matrix);});struts.castShadow=true;group.add(struts);
 const bolts=new THREE.InstancedMesh(new THREE.SphereGeometry(.065,6,4),pearl,top+1);for(let i=0;i<=top;i++){o.position.fromArray(positions,i*3);o.quaternion.identity();o.scale.setScalar(1);o.updateMatrix();bolts.setMatrixAt(i,o.matrix);}group.add(bolts);
 ring(group,R,.13,0,0,pearl,.11);ring(group,R-.07,.24,0,0,cyan,.035);
 cyl(group,R-.08,.18,stone,0,-.09,0).userData.walkable=true;
 const moon=sphere(group,1.18,moonMaterial(),-.3,2.6,-.35,48);moon.name='Cratered lunar exhibit';
 const moonOrbit=new THREE.Group();moonOrbit.name='Moving lunar orbital sculpture';moonOrbit.position.set(-.3,2.6,-.35);group.add(moonOrbit);const orbitRing=add(moonOrbit,new THREE.TorusGeometry(1.63,.035,10,96),cyan);orbitRing.rotation.x=1.1;const satellite=sphere(moonOrbit,.17,gold,1.6,.27,0,24);satellite.name='Orbiting satellite';cyl(group,1.1,.18,navy,-.3,.13,-.35);
 for(const x of [-1.7,1.7]){tube(group,[[x,.1,-.35],[x,2,-.35],[x*.65,3.7,-.35]],.035,metal);}
 textPanel(group,{title:'THE MOON',subtitle:'ONE GIANT LEAP FOR CURIOS',w:2.4,h:.65,x:-.3,y:.62,z:1.15,background:'#102738'});
 return group;
}
function rover(parent,x,y,z){const p=new THREE.Group();p.name='Detailed lunar exploration rover';p.position.set(x,y,z);p.rotation.y=-.28;parent.add(p);
 roundedBox(p,1.7,.48,2.4,.15,pearl,0,.9,0);roundedBox(p,1.15,.35,1.2,.08,gold,0,1.28,-.3);
 const tyre=mat(0x262c2c,.93,0);for(const side of [-1,1])for(const z of [-.88,0,.88]){const w=cyl(p,.36,.23,tyre,side*.94,.43,z,32);w.rotation.z=Math.PI/2;const hub=cyl(p,.19,.26,metal,side*.94,.43,z,24);hub.rotation.z=Math.PI/2;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tread=box(p,.27,.055,.11,black,side*.94,.43+Math.cos(a)*.35,z+Math.sin(a)*.35);tread.rotation.x=-a;}tube(p,[[side*.55,.87,z],[side*.9,.48,z]],.055,metal);}
 tube(p,[[.3,1.4,-.45],[.3,2.1,-.45],[.3,2.1,-.1]],.045,metal);roundedBox(p,.5,.27,.26,.07,pearl,.3,2.1,-.08);for(const x of [.16,.44])sphere(p,.075,black,x,2.1,.07,16);
 const panel=box(p,1.55,.04,.85,mat(0x182c47,.3,.5),0,1.53,-.35);panel.rotation.x=-.14;for(let i=0;i<6;i++)box(p,.012,.01,.8,metal,-.66+i*.26,1.565,-.35);
 tube(p,[[-.6,1,.9],[-.85,1.3,1.55],[-.2,.58,1.9]],.055,metal);sphere(p,.12,gold,-.2,.58,1.9,16);return p;
}

function missionBanner(parent,x){
 const random=seedRandom(2027),texture=canvasTexture(512,1280,(g,W,H)=>{
  const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0b273a');bg.addColorStop(.65,'#081525');bg.addColorStop(1,'#143b46');g.fillStyle=bg;g.fillRect(0,0,W,H);
  for(let i=0;i<100;i++){const a=.15+random()*.5;g.fillStyle=`rgba(220,242,239,${a})`;g.beginPath();g.arc(25+random()*(W-50),160+random()*500,.6+random()*1.4,0,Math.PI*2);g.fill();}
  g.strokeStyle='#a58d62';g.lineWidth=2;g.strokeRect(18,18,W-36,H-36);g.fillStyle='#f5eee0';g.textAlign='center';g.font='italic 800 60px Arial';g.fillText('CURIOS',W/2,110);
  g.fillStyle='#74d8d4';g.font='600 40px Arial';g.fillText('YEAR 8',W/2,177);
  const moon=g.createRadialGradient(215,340,12,260,410,147);moon.addColorStop(0,'#e3e0cf');moon.addColorStop(.6,'#b8b9ad');moon.addColorStop(.9,'#6d7d81');moon.addColorStop(1,'#263d4a');g.fillStyle=moon;g.beginPath();g.arc(256,425,142,0,Math.PI*2);g.fill();
  for(let i=0;i<36;i++){const a=random()*6.28,r=Math.sqrt(random())*118,cx=256+Math.cos(a)*r,cy=425+Math.sin(a)*r,cr=3+random()*13;g.fillStyle='rgba(52,67,70,.19)';g.beginPath();g.arc(cx,cy,cr,0,Math.PI*2);g.fill();g.strokeStyle='rgba(237,232,204,.28)';g.lineWidth=2;g.beginPath();g.arc(cx-1,cy-1,cr,-2.5,.2);g.stroke();}
  g.strokeStyle='#cdb779';g.lineWidth=4;g.beginPath();g.ellipse(256,425,193,67,-.4,.1,Math.PI*1.7);g.stroke();g.fillStyle='#54dcd5';g.beginPath();g.arc(421,355,8,0,Math.PI*2);g.fill();
  g.fillStyle='#f2eee5';g.font='800 108px Arial';g.fillText('MOON',W/2,767);g.font='700 83px Arial';g.fillText('MISSION',W/2,849);
  g.fillStyle='#6bded7';g.fillRect(189,907,134,3);g.font='600 43px Arial';g.fillText('BEYOND',W/2,986);g.fillText('EARTH',W/2,1040);
  g.fillStyle='#dac594';g.font='600 38px Arial';g.fillText('START HERE',W/2,1189);
 });
 const board=roundedBox(parent,1.26,2.95,.08,.025,gold,x,2.18,3.60);board.name='Curios Moon Mission graphic banner';
 add(parent,new THREE.PlaneGeometry(1.18,2.86),new THREE.MeshBasicMaterial({map:texture}),x,2.18,3.71);
}
function centralHall(root,art){
 const hall=new THREE.Group();hall.name='Curved central Lunar Lab entrance';root.add(hall);
 const facade=new THREE.Shape();facade.moveTo(-3.7,.3);facade.lineTo(-4.1,4.5);facade.quadraticCurveTo(-3.1,7.5,0,7.7);facade.quadraticCurveTo(3.1,7.5,4.1,4.5);facade.lineTo(3.7,.3);facade.lineTo(2.1,.3);facade.lineTo(2.25,3.0);facade.quadraticCurveTo(2.0,4.25,0,4.3);facade.quadraticCurveTo(-2.0,4.25,-2.25,3.0);facade.lineTo(-2.1,.3);facade.closePath();
 add(hall,new THREE.ExtrudeGeometry(facade,{depth:.4,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:3,curveSegments:32}),navy,0,0,3.05,'Arched charcoal entrance facade');
 // Curved roof behind the face: a half-vault, with metal standing seams.
 const roofPoints=[];for(let i=0;i<=40;i++){const a=Math.PI*i/40;roofPoints.push([Math.cos(a)*4.0,3.65+Math.sin(a)*3.85]);}
 const v=[],ix=[];for(const [x,y]of roofPoints)v.push(x,y,-5.7,x,y,3.15);for(let i=0;i<40;i++){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(v,3));roof.setIndex(ix);roof.computeVertexNormals();add(hall,roof,new THREE.MeshStandardMaterial({color:0x263a49,roughness:.48,metalness:.45,side:THREE.DoubleSide}));
 for(const z of [-5.6,-3.4,-1.2,1,3.2])tube(hall,roofPoints.map(([x,y])=>[x,y+.035,z]),.045,metal);
 const outer=[[-3.76,.32,3.6],[-4.05,4.46,3.6],[-2.7,6.7,3.6],[0,7.76,3.6],[2.7,6.7,3.6],[4.05,4.46,3.6],[3.76,.32,3.6]];tube(hall,outer,.095,pearl);
 const entrance=[[-2.12,.3,3.65],[-2.35,2.65,3.65],[-1.96,3.87,3.65],[0,4.29,3.65],[1.96,3.87,3.65],[2.35,2.65,3.65],[2.12,.3,3.65]];tube(hall,entrance,.16,pearl);tube(hall,entrance.map(([x,y,z])=>[x,y,z+.15]),.042,cyan);
 // Transparent fixed leaves flank the open passage, rather than blocking it.
 for(const s of [-1,1]){box(hall,.06,2.8,.10,metal,s*1.97,1.7,3.3);box(hall,.77,2.75,.035,glass,s*1.58,1.7,3.3);box(hall,.06,2.8,.1,metal,s*1.18,1.7,3.3);box(hall,.76,.06,.1,metal,s*1.58,3.08,3.3);box(hall,.035,.6,.06,gold,s*1.24,1.45,3.4);}
 const floor=box(hall,7.35,.22,8.95,stone,0,.19,-1.18,'Main hall walkable floor');floor.userData.walkable=true;
 box(hall,7.35,4.0,.18,navyLight,0,2.3,-5.69);
 for(const x of [-2.8,0,2.8]){box(hall,.04,3.7,.05,metal,x,2.3,-5.57);const screen=textPanel(hall,{title:x===0?'MAKE IT MATTER':'EXPLORE',subtitle:x===0?'DESIGN • BUILD • DISCOVER':'SCIENCE • PEOPLE • POSSIBILITY',w:2.25,h:1.2,x,y:2.2,z:-5.55});screen.name='Mission display';roundedBox(hall,1.9,.15,.7,.06,pearl,x,1.03,-4.9);}
 for(const z of [-3.9,-1.4,1.1]){const light=cyl(hall,.58,.05,warm,0,4.22,z,32);light.scale.z=.7;}
 if(art){const logo=art.clone();logo.needsUpdate=true;logo.offset.set(.235,.713);logo.repeat.set(.53,.25);add(hall,new THREE.PlaneGeometry(4.55,1.20),new THREE.MeshBasicMaterial({map:logo}),0,6.3,3.59);}else textPanel(hall,{title:'CURIOS',w:5.4,h:1.3,x:0,y:6.35,z:3.6,background:null,font:'italic 900'});
 textPanel(hall,{title:'LUNAR LAB',w:5.5,h:1.45,x:0,y:5.03,z:3.62,background:null,font:'800'});
 for(const x of [-3.05,3.05])missionBanner(hall,x);
}
function roundedWing(root,art){
 const wing=new THREE.Group();wing.name='Rounded lunar exhibition gallery';wing.position.set(5.4,0,-1.4);root.add(wing);
 cyl(wing,4.2,.22,stone,0,.19,0).userData.walkable=true;
 add(wing,new THREE.CylinderGeometry(4.18,4.18,4.25,64,1,true,-.45,Math.PI+.9),glass,0,2.43,0);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;box(wing,.08,4.3,.08,metal,Math.sin(a)*4.19,2.45,Math.cos(a)*4.19);}
 cyl(wing,4.42,.4,navy,0,4.78,0);cyl(wing,4.51,.16,pearl,0,5.04,0);ring(wing,4.49,5.16,0,0,cyan,.05);ring(wing,4.24,4.54,0,0,warm,.045);
 if(art){const banner=art.clone();banner.needsUpdate=true;banner.offset.set(.0,.0);banner.repeat.set(1,1);const surface=add(wing,new THREE.CylinderGeometry(4.195,4.195,3.25,64,1,true,-.30,1.40),new THREE.MeshBasicMaterial({map:banner,side:THREE.DoubleSide}),0,2.18,0);surface.name='Curved supplied lunar artwork mural';}
 for(const a of [.05,.55,1.05,1.55]){const x=Math.sin(a)*4.22,z=Math.cos(a)*4.22;const fixture=box(wing,.2,.14,.4,gold,x,4.28,z);fixture.rotation.y=a;}
 const globeMat=mat(0x4289a9,.6,.1);const earth=sphere(wing,.8,globeMat,0,1.9,0,36);earth.name='Rotating Earth exhibit';const earthOrbits=new THREE.Group();earthOrbits.name='Moving Earth orbital sculpture';earthOrbits.position.set(0,1.9,0);wing.add(earthOrbits);const orbitA=add(earthOrbits,new THREE.TorusGeometry(1.22,.028,8,80),gold);orbitA.rotation.x=.75;const orbitB=add(earthOrbits,new THREE.TorusGeometry(1.42,.022,8,80),cyan);orbitB.rotation.y=.55;sphere(earthOrbits,.13,pearl,1.2,0,0,24);ring(wing,1.2,1.0,0,0,cyan,.025);cyl(wing,1.0,.16,navy,0,.45,0);
 dish(root,5.1,5.15,-2.0);
}
function dish(root,x,y,z){const p=new THREE.Group();p.name='Roof satellite dish';p.position.set(x,y,z);root.add(p);for(const s of [-1,1])tube(p,[[s*.7,0,.55],[0,1.1,0],[s*.7,0,-.55]],.07,metal);const bowl=new THREE.Group();bowl.position.y=1.0;bowl.rotation.x=.56;bowl.rotation.z=-.20;p.add(bowl);const pts=[];for(let i=0;i<=24;i++){const r=i/24*1.7;pts.push(new THREE.Vector2(r,r*r*.18));}add(bowl,new THREE.LatheGeometry(pts,64),new THREE.MeshStandardMaterial({color:0xced5d4,roughness:.38,metalness:.5,side:THREE.DoubleSide}));ring(bowl,1.7,.52,0,0,metal,.045);for(let a=0;a<Math.PI*2;a+=Math.PI/4){tube(bowl,[[Math.sin(a)*1.66,.5,Math.cos(a)*1.66],[Math.sin(a)*.45,1.45,Math.cos(a)*.45],[0,1.6,0]],.025,metal);}sphere(bowl,.13,navy,0,1.6,0,16);}
// Rounded corners leave room for the rover's steering radius. The inner
// walking loop stays separate from the marked driving lane.
export function lunarLoopPoints(rover){
 const [left,right,rear,front,radius]=rover?[55,65,-85,-50,5]:[24,51,-78.5,-56,2];
 const corners=[[right-radius,front-radius,0],[right-radius,rear+radius,-Math.PI/2],
  [left+radius,rear+radius,-Math.PI],[left+radius,front-radius,-Math.PI*1.5]];
 const points=[];
 for(const [x,z,end] of corners){
  for(let i=0;i<=8;i++){
   const angle=end+Math.PI/2-i*Math.PI/16;
   points.push({x:x+Math.cos(angle)*radius,z:z+Math.sin(angle)*radius});
  }
 }
 return points;
}
function installWalkaround(root){
 function strip(points,width,material,height,name){
  const positions=[],indices=[];
  for(let i=0;i<points.length;i++){
   const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length],p=points[i];
   const length=Math.hypot(b.x-a.x,b.z-a.z);
   const dx=(b.z-a.z)/length*width/2,dz=-(b.x-a.x)/length*width/2;
   positions.push(p.x-LUNAR_SITE.x+dx,height,p.z-LUNAR_SITE.z+dz,p.x-LUNAR_SITE.x-dx,height,p.z-LUNAR_SITE.z-dz);
   const j=2*i,k=2*((i+1)%points.length);indices.push(j,k,j+1,k,k+1,j+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=add(root,geometry,material,0,0,0,name);
  mesh.receiveShadow=true;
 }
 const lane=mat(0x455260,.96,0),walk=mat(0xcac4b4,.95,0),mark=mat(0xd7ddc9,.85,0);
 for(const material of [lane,walk,mark])material.side=THREE.DoubleSide;
 const circuit=lunarLoopPoints(true);
 strip(circuit,4.4,lane,.016,'Lunar Lab marked rover circuit');
 strip(circuit,.10,mark,.022,'Rover circuit centre guide');
 strip(lunarLoopPoints(false),1.8,walk,.014,'Lunar Lab perimeter footpath');
 // A transverse start stripe is visible from the southern approach.
 for(let i=0;i<7;i++)box(root,.55,.008,.30,mark,22,.026,17.3+i*.4);
 const notice=textPanel(root,{title:'ROVER CIRCUIT',subtitle:'SLOW · GIVE WAY',w:4,h:1,x:22,y:.03,z:20.5});
 if(notice)notice.rotation.x=-Math.PI/2;
}
function grounds(root){
 const courtyard=new THREE.Shape();courtyard.moveTo(-11,-3);courtyard.quadraticCurveTo(-12,5,-8.7,7);courtyard.quadraticCurveTo(-4,8.8,-1.8,8.2);courtyard.lineTo(-1.8,16.2);courtyard.lineTo(1.8,16.2);courtyard.lineTo(1.8,8.2);courtyard.quadraticCurveTo(7,9,10,5);courtyard.quadraticCurveTo(11,2,9.7,-3);courtyard.closePath();
 // Shape coordinates map to X/Z; keep the paving low and continuous with lawn.
 const g=new THREE.ShapeGeometry(courtyard,48);g.rotateX(Math.PI/2);for(let i=0;i<g.index.count;i+=3){const b=g.index.array[i+1];g.index.array[i+1]=g.index.array[i+2];g.index.array[i+2]=b;}g.computeVertexNormals();const pave=add(root,g,stone,0,.12,0,'Low curved entrance forecourt');pave.userData.walkable=true;
 for(let row=0;row<12;row++)for(let col=0;col<3;col++){const z=4.6+row*.93,x=(col-1)*1.16;const p=box(root,1.13,.025,.9,(row+col)%3===0?mat(0xc7c2b8,.92,0):stone,x,.14,z);p.userData.walkable=true;}
 // One shallow threshold, not a raised sci-fi plinth.
 const step=box(root,4.2,.16,.8,pearl,0,.22,3.95,'Entrance threshold');step.userData.walkable=true;
 const rnd=seedRandom(482);const rocks=new THREE.Group();rocks.name='Native rock garden and planting';root.add(rocks);
 for(const side of [-1,1]){
  const bed=add(rocks,new THREE.CircleGeometry(1,32),sand,side*5.6,.15,6.6);bed.rotation.x=-Math.PI/2;bed.scale.set(3.0,1.65,1);
  for(let i=0;i<9;i++){const x=side*(2.8+rnd()*5.6),z=5.8+rnd()*2.6,r=.22+rnd()*.55;const geo=new THREE.IcosahedronGeometry(r,2);const pos=geo.attributes.position;for(let j=0;j<pos.count;j++){const px=pos.getX(j),py=pos.getY(j),pz=pos.getZ(j),f=.92+.09*Math.sin(px*13+py*7+pz*11);pos.setXYZ(j,px*f,py*f,pz*f);}const normal=geo.attributes.normal;for(let j=0;j<pos.count;j++){const v=new THREE.Vector3(pos.getX(j),pos.getY(j),pos.getZ(j)).normalize();normal.setXYZ(j,v.x,v.y,v.z);}normal.needsUpdate=true;const rock=add(rocks,geo,mat(i%2?0x9d9a8e:0x797d78,.97,0),x,r*.5+.16,z);rock.scale.set(1.3,.65,.85);rock.rotation.y=rnd()*6.3;}
 }
 const planted=new THREE.Group();planted.name='Lunar Lab native garden';rocks.add(planted);addAuthoredGarden(planted,[[-5.5,6.65,6.4,2.6],[5.5,6.65,6.4,2.6]],{treeSites:[],baseY:.16,density:5,detail:'hero'});
 for(const x of [-2.65,2.65])for(const z of [4.8,8.7,12.1]){cyl(root,.085,.70,navy,x,.48,z,16);cyl(root,.105,.10,warm,x,.85,z,16);cyl(root,.13,.035,metal,x,.92,z,16);}
 // Rock-mounted identity and a small wayfinding board sit outside the clear route.
 const marker=add(root,new THREE.IcosahedronGeometry(1.25,2),mat(0x5e6869,.94,.05),-7.7,.8,9.1);marker.scale.set(1.5,.72,.45);marker.rotation.z=.12;
 textPanel(root,{title:'CURIOS',subtitle:'LUNAR LAB',w:2.2,h:.95,x:-7.7,y:1.12,z:9.7,background:null,font:'italic 900'});
 const wayfinding=canvasTexture(1024,800,(g,W,H)=>{g.fillStyle='#102738';g.fillRect(0,0,W,H);g.strokeStyle='#c7aa72';g.lineWidth=8;g.strokeRect(14,14,W-28,H-28);g.textAlign='left';g.font='700 95px Arial';g.fillStyle='#f2eee5';g.fillText('↖  LUNAR LAB',60,190);g.fillStyle='#7be4de';g.font='700 83px Arial';g.fillText('←  OVAL',60,395);g.fillText('↓  MARKETS',60,600);});
 roundedBox(root,2.6,2.1,.14,.1,navy,7.3,1.65,9.1);const directory=add(root,new THREE.PlaneGeometry(2.5,1.95),new THREE.MeshBasicMaterial({map:wayfinding}),7.3,1.65,9.24);directory.name='Correctly directed campus wayfinding';for(const x of [6.45,8.15])box(root,.08,.75,.09,metal,x,.52,9.1);
}
function colliders(root,physics){if(!physics)return;const block=(x,y,z,w,h,d)=>physics.block(LUNAR_SITE.x+x,y,LUNAR_SITE.z+z,w,h,d);
 // The central doorway is open; solid side/back walls match the new hall.
 for(const x of [-3.65,3.65]){block(x,2.3,2.65,.20,4.0,1.5);block(x,2.3,-5.15,.20,4.0,1.1);}block(0,2.3,-5.7,7.4,4.0,.22);
 for(const x of [-3.05,3.05])block(x,1.9,3.35,1.35,3.2,.35);
 // Outer dome/gallery walls are segmented, leaving the central passage untouched.
 for(const [cx,cz,r] of [[-6,-1.2,5.2],[5.4,-1.4,4.2]])for(let i=0;i<40;i++){const a=i/40*Math.PI*2,b=(i+1)/40*Math.PI*2,x1=cx+Math.sin(a)*r,z1=cz+Math.cos(a)*r,x2=cx+Math.sin(b)*r,z2=cz+Math.cos(b)*r,x=(x1+x2)/2,z=(z1+z2)/2;if(Math.abs(x)<3.55)continue;block(x,1.95,z,Math.abs(x2-x1)+.16,3.3,Math.abs(z2-z1)+.16);}
}
export function installLunarLab(scene,physics){
 const existing=scene.getObjectByName('Curios Lunar Lab');if(existing)return existing;
 const root=new THREE.Group();root.name='Curios Lunar Lab';root.position.set(LUNAR_SITE.x,0,LUNAR_SITE.z);scene.add(root);
 const art=artwork();grounds(root);installWalkaround(root);const dome=geodesicDome(root);rover(dome,-1.3,0,2.55);centralHall(root,art);roundedWing(root,art);colliders(root,physics);
 root.userData.design='Left geodesic dome, arched centre and rounded gallery matched to the supplied concept';
 return root;
}

export function lunarApproachFraming(p,yaw=0,aspect=1){
 const z=p.z-LUNAR_SITE.z,x=Math.abs(p.x-LUNAR_SITE.x);
 const fade=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 const weight=fade(.4,4,z)*(1-fade(20,29,z))*(1-fade(11,18,x))*Math.max(0,Math.cos(yaw));
 return {weight,distance:Math.max(14.5,14/aspect),height:5.5,lookY:2.9,fov:48};
}

export function updateLunarLab(root,time,{reducedMotion=false,paused=false}={}){
 if(!root||paused)return;const t=reducedMotion?0:time;
 const moon=root.getObjectByName('Cratered lunar exhibit'),earth=root.getObjectByName('Rotating Earth exhibit'),orbit=root.getObjectByName('Moving lunar orbital sculpture'),earthOrbit=root.getObjectByName('Moving Earth orbital sculpture'),dish=root.getObjectByName('Roof satellite dish');
 if(moon)moon.rotation.y=t*.11;if(earth)earth.rotation.y=t*.17;
 if(orbit){orbit.rotation.y=t*.28;orbit.rotation.z=.22;}
 if(earthOrbit){earthOrbit.rotation.y=-t*.24;earthOrbit.rotation.z=.18*Math.sin(t*.3);}
 if(dish)dish.rotation.y=Math.sin(t*.12)*.23;
}
