import {buildAuthoredCourtyard} from './authored-courtyard.js?v=entrance-stage-4';
import * as T from 'three';
import {addCourtyardArchitecture,addCourtyardPlanting} from './courtyard-detail.js?v=courtyard1';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {upgradeMaterials,addHeroDetails} from './hero-materials.js?v=courtyard1';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const DOORS=[
 {id:'chapel',name:'Chapel',x:-3.86,z:1.31,description:'A quiet threshold for future reflection and reset. Interior activities are outside this exterior preview.'},
 {id:'admin',name:'Administration',x:0,z:-1.9,description:'Orientation and enquiries. EST Prep is planned for a separate existing building. This is an exterior preview.'},
 {id:'services',name:'Student Services',x:6.5,z:2.3,description:'A welcoming support entrance. Future activities and service interactions have not been implemented.'}
];
export const VIEWS={arrival:{position:[-1,3.8,18],target:[0,2,-.2]},layout:{position:[13,14,21],target:[0,0,-.5]},chapel:{position:[-9,2.5,9],target:[-5.7,2.2,.65]},services:{position:[11,3.1,8],target:[5.1,1.7,-.6]},rear:{position:[-15,9,-15],target:[0,2,-2]}};

function random(seed=129){return()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=512;const a=c.getContext('2d'),r=random();
 const row=kind==='brick'?32:kind==='roof'?64:64,col=kind==='brick'?88:kind==='roof'?36:128;
 a.fillStyle=kind==='roof'?'#664b3d':kind==='red'?'#746457':'#b8ad95';a.fillRect(0,0,512,512);
 for(let y=0;y<512;y+=row)for(let x=-col;x<512;x+=col){const v=r()*(kind==='roof'?7:18);let rgb=kind==='roof'?[143+v,84+v,57+v]:kind==='red'?[131+v,85+v,65+v]:kind==='brick'?[213+v,201+v,174+v]:[209+v,195+v,166+v];a.fillStyle=`rgb(${rgb.join(',')})`;const xx=x+(y/row%2)*col/2;a.fillRect(xx+1.2,y+1.2,col-2.4,row-2.4);a.strokeStyle='#fff2';a.strokeRect(xx+2,y+2,col-4,row-4);if(kind==='roof'){const g=a.createLinearGradient(xx,y,xx+col,y);g.addColorStop(0,'#0004');g.addColorStop(.4,'#ffffff20');g.addColorStop(1,'#0003');a.fillStyle=g;a.fillRect(xx+1,y+1,col-2,row-2);}}
 for(let i=0;i<14000;i++){a.fillStyle=r()>.5?'#ffffff12':'#281d1810';a.fillRect(r()*512,r()*512,r()*2+1,1);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;
}
function material(kind,color=0xffffff){const map=texture(kind);return new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.035,color,roughness:.88});}
function uvWorld(g,scale=2){const p=g.attributes.position,n=g.attributes.normal,u=[];for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));u.push((nx>nz?p.getZ(i):p.getX(i))/scale,(ny>.7?p.getZ(i):p.getY(i))/scale);}g.setAttribute('uv',new T.Float32BufferAttribute(u,2));return g;}
export function consolidate(root){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;const m=o.material;if(Array.isArray(m))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=m.uuid;if(!buckets.has(key))buckets.set(key,{m,gs:[]});buckets.get(key).gs.push(g.index?g.toNonIndexed():g);});const result=new T.Group();for(const {m,gs}of buckets.values()){const g=mergeGeometries(gs,false);if(!g)throw Error('Unable to merge exterior material');const mesh=new T.Mesh(g,m);mesh.castShadow=!m.transparent;mesh.receiveShadow=true;result.add(mesh);}return result;}

export async function buildExterior({inGame=false,textures}={}){
 if(inGame)return buildAuthoredCourtyard(DOORS,{textures,deferDetail:true});
 const source=new T.Group();source.name='ECC exterior candidate 01';const obstacles=[];
 const m={stone:material('stone'),brick:material('brick'),red:material('red'),roof:material('roof'),paving:material('stone',0xe7dfca),white:new T.MeshStandardMaterial({color:0xe6e4d8,roughness:.72}),teal:new T.MeshStandardMaterial({color:0x326c78,roughness:.58}),navy:new T.MeshStandardMaterial({color:0x304c54,roughness:.5}),wood:new T.MeshStandardMaterial({color:0x886344,roughness:.75}),soil:new T.MeshStandardMaterial({color:0x594d3b,roughness:1}),glass:new T.MeshPhysicalMaterial({color:0x9cb6b7,metalness:.1,roughness:.18,transparent:true,opacity:.38,side:T.DoubleSide}),darkglass:new T.MeshStandardMaterial({color:0x304a49,metalness:.22,roughness:.22,side:T.DoubleSide}),warm:new T.MeshStandardMaterial({color:0xf5d7a5,emissive:0xffd9a3,emissiveIntensity:.8}),grass:new T.MeshStandardMaterial({color:0x828d64,roughness:1})};
 await upgradeMaterials(m);
 function mesh(g,mat,x=0,y=0,z=0){const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;source.add(o);return o;}
 function box(w,h,d,mat,x,y,z){return mesh(uvWorld(new T.BoxGeometry(w,h,d)),mat,x,y,z);}
 function block(x,z,w,d){obstacles.push({type:'box',x,z,w,d});}
 function beam(a,b,width,mat){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(width,width,d.length(),8),mat,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function text(words,w,h,x,y,z,{size=70,color='#f5f0df',background=null,rotation=0}={}){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`500 ${size}px Arial`;ctx.fillText(words,512,c.height/2,960);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.6,depthWrite:false,side:T.DoubleSide}),x,y,z);o.rotation.z=rotation;return o;}
 function pane(x,z,w,h,y=1.8,open=false){
  // A recessed room impression behind four real reveal edges; no flat frame slab.
  const back=open?null:mesh(new T.PlaneGeometry(w,h),m.room,x,y,z+.072);
  for(const dx of [-w/2-.04,w/2+.04])box(.10,h+.2,.24,m.navy,x+dx,y,z+.12);
  for(const dy of [-h/2-.04,h/2+.04])box(w+.2,.10,.24,m.navy,x,y+dy,z+.12);
  mesh(new T.PlaneGeometry(w-.05,h-.05),m.glass,x,y,z+.25);
  box(.045,h,.08,m.navy,x,y,z+.29);box(w,.04,.08,m.navy,x,y+.28,z+.29);
  return back;
 }
 function doorway(x,z,w=2.05,open=false){if(!open)mesh(new T.PlaneGeometry(w-.08,2.6),m.room,x,1.41,z-.035);for(const dx of [-w/2-.06,w/2+.06])box(.12,2.75,.2,m.navy,x+dx,1.4,z);box(w+.24,.12,.2,m.navy,x,2.79,z);for(const dx of [-w/4,w/4]){mesh(new T.PlaneGeometry(w/2-.05,2.63),m.glass,x+dx,1.41,z+.015);box(.045,2.66,.07,m.white,x+dx+w/4,1.41,z+.035);box(.035,.46,.05,m.wood,x+dx+(dx<0?.3:-.3),1.2,z+.13);}box(w+.2,.045,1,m.paving,x,.04,z+.35);}
 function tiledRoof(x,z,w,d,eave,rise,alongZ=false){const g=new T.Group();for(const side of [-1,1]){const roof=box(w+.4,.13,(d/2+.2)/Math.cos(Math.atan2(rise,d/2)),m.roof,0,eave+rise/2,side*d/4);roof.rotation.x=side*Math.atan2(rise,d/2);source.remove(roof);g.add(roof);}if(alongZ){g.rotation.y=Math.PI/2;}g.position.set(x,0,z);source.add(g);const ridge=box(alongZ?.14:w+.5,.14,alongZ?w+.5:.14,m.roof,x,eave+rise+.05,z);ridge.name='Terracotta ridge';}
 function planter(x,z,w,d){box(w,.27,d,m.stone,x,.135,z);box(w-.15,.035,d-.15,m.soil,x,.29,z);block(x,z,w,d);}
 function bench(x,z,w=2.2,rot=0){const g=new T.Group();for(const dx of [-w/2+.18,w/2-.18]){const b=box(.36,.5,.65,m.stone,dx,.25,0);source.remove(b);g.add(b);}for(let k=0;k<5;k++){const b=box(w,.075,.105,m.wood,0,.51,(k-2)*.125);source.remove(b);g.add(b);}g.position.set(x,0,z);g.rotation.y=rot;source.add(g);block(x,z,rot? .75:w,rot?w:.75);}
 // Ground is a bounded preview stage, not a second campus map.
 if(!inGame)mesh(new T.CylinderGeometry(23,23,.12,100),m.grass,0,-.1,0);
 box(19,.1,19,m.paving,0,-.01,3.4);
 for(const x of [-9.5,9.5])box(.23,.04,19,m.red,x,.065,3.4);
 for(const z of [4.7,9.3])box(19,.025,.18,m.red,0,.06,z);
 if(!inGame){box(4.5,.12,9,m.paving,0,-.015,16.5);
 for(const x of [-2.3,2.3])box(.2,.05,9,m.red,x,.06,16.5);}

 // Administration: brick wings, recessed glazing and crest-bearing gable.
 // Retain the envelope, but give the front windows actual cavities instead of a solid block.
 box(8,3.32,.2,m.brick,0,1.66,-6.55);
 for(const x of [-3.9,3.9])box(.2,3.32,4.2,m.brick,x,1.66,-4.55);
 for(const x of [-2.8,2.8]){box(2.3,.68,.2,m.stone,x,.34,-2.45);box(2.3,.47,.2,m.brick,x,3.085,-2.45);}
 for(const x of [-3.9,-1.65,1.65,3.9])box(.3,3.32,.22,m.brick,x,1.66,-2.45);
 // Overlaid deeply framed windows provide complete rear and side elevations.
 for(const x of [-2.8,2.8])pane(x,-2.405,1.85,2.05,1.83,true);
 // Remove a genuine central entry slot from the front wall by using an inset porch over the shell.
 doorway(0,-1.93,2.05,true);
 box(3.25,.1,1.1,m.paving,0,.02,-2.0);
 for(const x of [-3,-1,1,3]){const p=pane(x,-6.72,1.35,1.6,1.85);}
 box(8.55,.16,4.6,m.white,0,3.39,-4.55);tiledRoof(0,-4.55,8.55,4.6,3.48,1.15);
 box(3.15,1.5,2.45,m.brick,0,3.98,-3.05);
 const tri=new T.Shape();tri.moveTo(-1.68,0);tri.lineTo(1.68,0);tri.lineTo(0,.92);tri.closePath();mesh(new T.ShapeGeometry(tri),m.brick,0,4.58,-1.795);
 tiledRoof(0,-3.05,2.75,3.5,4.65,.92,true);
 for(const x of [-1.05,1.05])pane(x,-1.78,.65,.73,4.05);
 for(const x of [-2,2])box(.43,3.25,.55,m.teal,x,1.63,-1.46);box(4.43,.6,.55,m.teal,0,3,-1.46);
 text('ADMINISTRATION',3.65,.3,0,3,-1.17,{size:64});
 if(!inGame)text('EXTERIOR PREVIEW',1.65,.14,0,2.37,-1.81,{size:48});
 block(0,-4.55,8,4.2); // Exterior-only shell; porch is accessible to the doors.

 // Student Services: complete low wing and tall asymmetric teal blade.
 box(4.4,3.36,.2,m.brick,6.45,1.68,-4.55);
 for(const x of [4.35,8.55])box(.2,3.36,6.4,m.brick,x,1.68,-1.45);
 box(4.4,.42,.2,m.brick,6.45,3.15,1.75);
 for(const x of [4.55,7.76,8.44])box(.18,2.95,.22,m.stone,x,1.48,1.75);
 box(4.65,.16,6.65,m.white,6.45,3.46,-1.45);tiledRoof(6.45,-1.45,4.65,6.65,3.53,.55);
 doorway(6.45,2.1,2.3,true);pane(8,1.84,.55,2.3,1.55,true);
 box(.5,4,.7,m.teal,4.3,2,2.35);box(4.75,.42,.7,m.teal,6.42,3.79,2.35);
 text('STUDENT SERVICES',3.5,.3,6.55,3.76,2.71,{size:61});text('STUDENT SERVICES',2.6,.24,4.3,2.05,2.715,{size:56,rotation:Math.PI/2});
 for(const z of [-3.5,-1.3,.6]){const g=new T.Group();const o=box(.06,1.7,1.2,m.darkglass,8.69,1.87,z);for(const dz of [-.65,.65])box(.09,1.83,.06,m.white,8.73,1.87,z+dz);}
 block(6.45,-1.45,4.4,6.4);

 // Chapel curve is built from open wall bands: the cross, art glass and door are actual openings.
 const cx=-6,cz=-1,radius=3.05,wallHeight=4.2;
 function curve(a,b,y0,y1,mat,r=radius){const shape=new T.Shape();const steps=Math.max(2,Math.ceil((b-a)*25));for(let i=0;i<=steps;i++){const t=a+(b-a)*i/steps;const x=Math.sin(t)*r,z=Math.cos(t)*r;if(i===0)shape.moveTo(x,z);else shape.lineTo(x,z);}for(let i=steps;i>=0;i--){const t=a+(b-a)*i/steps;shape.lineTo(Math.sin(t)*(r-.22),Math.cos(t)*(r-.22));}shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:y1-y0,bevelEnabled:false,steps:1});g.rotateX(Math.PI/2);g.translate(cx,y1,cz);uvWorld(g);return mesh(g,mat);}
 const segments=160,bands=[0,.5,1.05,1.95,2.55,3.45,3.75,wallHeight];
 for(let i=0;i<segments;i++){const a=-Math.PI+i*2*Math.PI/segments,b=a+2*Math.PI/segments,t=(a+b)/2;for(let j=0;j<bands.length-1;j++){const y=(bands[j]+bands[j+1])/2;const cross=(Math.abs(t+.5)<.065&&y>1.05&&y<3.45)||(t>-.77&&t<-.23&&y>1.95&&y<2.55);const tree=t>-.12&&t<.32&&y>.5&&y<3.75;const door=t>.5&&t<1&&y<3.45;if(!cross&&!tree&&!door)curve(a,b,bands[j],bands[j+1],m.stone);}}
 curve(-Math.PI,Math.PI,4.11,4.22,m.navy,3.12);
 curve(-Math.PI,Math.PI,4.22,4.37,m.stone,3.22);
 curve(-Math.PI,Math.PI,4.37,4.43,m.white,3.16);
 mesh(new T.CylinderGeometry(2.97,2.97,.1,80),m.wood,cx,4.16,cz);mesh(new T.CylinderGeometry(2.97,2.97,.06,80),m.stone,cx,4.24,cz);mesh(new T.CylinderGeometry(2.9,2.9,.09,80),m.paving,cx,.02,cz);
 // Deep glass behind cross aperture, visible through masonry reveal.
 curve(-.81,-.19,.98,3.5,m.darkglass,2.77);
 const art=document.createElement('canvas');art.width=512;art.height=1024;const ac=art.getContext('2d');ac.fillStyle='#233e40';ac.fillRect(0,0,512,1024);const rnd=random(77);ac.strokeStyle='#cfddd4';ac.lineCap='round';
 function branch(x,y,len,ang,w,depth){const ex=x+Math.sin(ang)*len,ey=y-Math.cos(ang)*len;ac.lineWidth=w;ac.beginPath();ac.moveTo(x,y);ac.quadraticCurveTo(x+(ex-x)*.25,y-len*.55,ex,ey);ac.stroke();if(depth>0){branch(ex,ey,len*(.61+rnd()*.14),ang-.3-rnd()*.45,w*.62,depth-1);branch(ex,ey,len*(.64+rnd()*.14),ang+.25+rnd()*.5,w*.62,depth-1);}else{ac.fillStyle='#bfcfba';ac.beginPath();ac.ellipse(ex,ey,4,10,ang,0,Math.PI*2);ac.fill();}}
 branch(245,1040,325,0,35,6);branch(245,900,230,-.6,14,5);branch(250,780,230,.7,14,5);
 const at=new T.CanvasTexture(art);at.colorSpace=T.SRGBColorSpace;const artmat=new T.MeshStandardMaterial({map:at,roughness:.3,metalness:.12});const panel=mesh(new T.PlaneGeometry(1.35,3.25),artmat,cx+.305,2.125,cz+3.04);panel.rotation.y=.1;for(const x of [-.4,1.0])box(.065,3.4,.08,m.white,cx+x,2.125,cz+3.02);
 // Door on the right-hand return of the curve, oriented to the forecourt.
 const doorRoot=new T.Group();const prior=new Set(source.children);doorway(0,0,1.4);text('CHAPEL',1.15,.27,0,3.58,.03,{size:95,color:'#314b50'});for(const child of [...source.children])if(!prior.has(child)){source.remove(child);doorRoot.add(child);}doorRoot.rotation.y=.75;doorRoot.position.set(cx+Math.sin(.75)*3.08,0,cz+Math.cos(.75)*3.08);source.add(doorRoot);
 // Tiny warm interior glimpse; no activity room fitout is commissioned.
 box(1.4,.09,.7,m.wood,cx,1.05,cz-1.9);box(.09,1.15,.08,m.wood,cx,2.15,cz-2.2);box(.65,.09,.08,m.wood,cx,2.37,cz-2.2);
 for(const x of [-.9,0,.9])for(const z of [-.4,.5]){box(.55,.09,.53,m.white,cx+x,.52,cz+z);box(.55,.48,.08,m.white,cx+x,.82,cz+z+.23);for(const dx of [-.2,.2])for(const dz of [-.18,.18])box(.04,.5,.04,m.wood,cx+x+dx,.25,cz+z+dz);}
 obstacles.push({type:'chapel',x:cx,z:cz,r:radius,doorAngle:.75,doorHalf:.23});

 // Sheltered links, slender posts and visible timber soffits.
 function canopy(x,z,w,d){for(const dx of [-w/2,w/2])box(.11,.18,d,m.navy,x+dx,3.02,z);for(const dz of [-d/2,d/2])box(w,.18,.11,m.navy,x,3.02,z+dz);for(const dx of [-w/2+.12,w/2-.12])for(const dz of [-d/2+.12,d/2-.12]){box(.09,2.9,.09,m.navy,x+dx,1.45,z+dz);block(x+dx,z+dz,.12,.12);}for(let q=-w/2+.2;q<w/2;q+=.3)box(.075,.04,d-.1,m.wood,x+q,2.85,z);}
 canopy(-2.9,-.32,2,3.5);canopy(3.25,.1,1.6,4.25);
 for(const [x,z]of [[0,-1.6],[6.5,1.95],[-3.9,1.2]]){box(.5,.025,.25,m.warm,x,2.74,z);}

 // Exact original crest texture. No generative redraw or invented school motto.
 const logo=await new T.TextureLoader().loadAsync(new URL('./assets/ECC_Logo.png',import.meta.url).href);logo.colorSpace=T.SRGBColorSpace;logo.anisotropy=8;
 const logoMat=new T.MeshStandardMaterial({map:logo,transparent:true,roughness:.5,side:T.DoubleSide});
 mesh(new T.PlaneGeometry(.8,1.136),logoMat,0,4.03,-1.775);
 const welcome={x:-3.2,z:6.4};box(2.35,.7,.65,m.stone,welcome.x,.35,welcome.z);block(welcome.x,welcome.z,2.35,.7);text('WELCOME TO ECC',2.18,.3,welcome.x,.45,welcome.z+.331,{size:83,color:'#28474b'});text('Learning World',1.3,.15,welcome.x,.19,welcome.z+.335,{size:67,color:'#28474b'});
 box(1.65,.1,.4,m.navy,welcome.x,.76,welcome.z);
 const hologram=new T.MeshPhysicalMaterial({color:0x65c6cd,transparent:true,opacity:.12,roughness:.1,metalness:.2,side:T.DoubleSide,depthWrite:false});mesh(new T.PlaneGeometry(1.56,2.18),hologram,welcome.x,1.92,welcome.z);
 const crest=mesh(new T.PlaneGeometry(1.22,1.73),logoMat,welcome.x,1.92,welcome.z+.02);crest.name='Original supplied ECC crest';
 const glow=new T.MeshStandardMaterial({color:0x85d5db,emissive:0x47aeba,emissiveIntensity:1.4,transparent:true,opacity:.7});for(const dx of [-.81,.81])box(.018,2.3,.018,glow,welcome.x+dx,1.94,welcome.z);for(const y of [.79,3.09])box(1.65,.018,.018,glow,welcome.x,y,welcome.z);
 for(let i=0;i<13;i++){const x=welcome.x-.75+i*.125;box(.008,.12+(i%3)*.08,.008,glow,x,.92+(i%4)*.06,welcome.z+.15);}

 // Bounded gardens leave a clear shared forecourt and three approach lanes.
 const beds=[[-8,5,2.8,4.6],[-7.1,10.9,4.7,2],[-4.1,9.8,1.9,2],[-6.3,-6.5,5,1.7],[7.2,10.9,4.7,2],[8.5,6.2,1.7,3.5],[11,-1,2.5,7],[-11,-.5,2,7],[2.3,-.8,1.1,1.3]].filter(b=>!inGame||(Math.abs(b[0])<10&&![-7.1,-4.1,8.5].includes(b[0])));
 beds.forEach(b=>planter(...b));bench(-6,4,2.3);bench(5.7,7.7,2.5);bench(-6,8.3,2.3);bench(9.3,3.7,1.9,Math.PI/2);
 addHeroDetails({source,box,mesh,m,beds});
 addCourtyardArchitecture({box,mesh,m});
 const architecture=consolidate(source);architecture.name='ECC connected exterior - hero fidelity pilot';
 const root=new T.Group();root.name='ECC Campus Hub hero fidelity pilot';root.add(architecture);
 addCourtyardPlanting(root,beds);
 const positions=[],rand=random(333);
 for(const [x,z,w,d]of beds.filter(b=>b[1]<0)){const count=Math.max(4,Math.round(w*d*3.3));for(let i=0;i<count;i++)positions.push({id:i%8===0?'yellow-flower-clump':'tufted-grass',x:x+(rand()-.5)*(w-.45),z:z+(rand()-.5)*(d-.45),s:.42+rand()*.48,r:rand()*6.28});}
 for(const [x,z]of [[-8,4.4],[-8,6.1],[-7,10.7],[-5.5,10.8],[-4.3,9.8],[7,10.7],[5.7,10.8],[8.5,6.2],[8.5,7.3],[11,-3],[11,0],[-11,-1],[-11,1],[-6,-6.5]])if((!inGame||(Math.abs(x)<10&&z<9&&x!==8.5))&&z<0)positions.push({id:'olive-shrub',x,z,s:.65,r:rand()*6.28});
 if(!inGame)for(const [x,z]of [[-11,7],[11,8],[-12,-5],[12,-6],[-4,-9],[5,-9]]){positions.push({id:'mature-eucalypt-a',x,z,s:.68,r:rand()*6.28});obstacles.push({type:'circle',x,z,r:.3});}
 positions.push({id:'boulder-a',x:-7.4,z:3.4,s:.7,r:.8});
 // Additional rocks/low shrub layers stay inside the existing raised-bed obstacles.
 for(const [x,z,w,d]of beds){
  positions.push({id:'boulder-a',x:x-w*.23,z:z+d*.19,s:.32,r:rand()*6.28});
  if(w*d>6&&z<0)for(const k of [-1,1])positions.push({id:'olive-shrub',x:x+k*w*.23,z:z-d*.12,s:.38+rand()*.12,r:rand()*6.28});
 }

 const loader=new GLTFLoader();
 for(const id of [...new Set(positions.map(p=>p.id))]){const gltf=await loader.loadAsync(new URL(`../assets/campus-landscape/${id}.glb`,import.meta.url).href);const merged=consolidate(gltf.scene);const ps=positions.filter(p=>p.id===id);for(const child of merged.children){const inst=new T.InstancedMesh(child.geometry,child.material,ps.length);inst.name=`Approved ${id}`;const matrix=new T.Matrix4();ps.forEach((p,i)=>{matrix.compose(new T.Vector3(p.x,.3,p.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),p.r),new T.Vector3(p.s,p.s,p.s));inst.setMatrixAt(i,matrix);});inst.castShadow=true;inst.receiveShadow=true;root.add(inst);}}
 return {root,architecture,obstacles,doors:DOORS,materials:m,plantInstances:positions.length};
}

export function canWalk(x,z,obstacles,r=.22){
 if(Math.abs(x)>19||z>20||z< -12)return false;
 for(const b of obstacles){if(b.type==='box'&&Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return false;
 if(b.type==='circle'&&Math.hypot(x-b.x,z-b.z)<b.r+r)return false;
 if(b.type==='chapel'){const dx=x-b.x,dz=z-b.z,dist=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);if(dist<b.r-.6)return false;if(dist<b.r+r&&dist>b.r-.62&&Math.abs(angle-b.doorAngle)>b.doorHalf)return false;}}
 return true;
}
