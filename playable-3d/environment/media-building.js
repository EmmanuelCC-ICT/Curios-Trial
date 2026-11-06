import * as T from 'three';
export function buildMedia(palette,textures){
 const root=new T.Group();root.name='English and Media — curved glazed frontage';
 const materials=new Map();
 const mat=(c,r=.8)=>{const key=`${c}:${r}`;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:r}));return materials.get(key);};
 const silver=mat(0xb7c4c9,.3),stone=palette.stone,white=mat(0xe1e4df),floor=palette.paving,wood=palette.timber,back=mat(0xd6dfcb);
 const glass=palette.glass.clone();glass.opacity=.12;glass.roughness=.07;
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#33353a';ctx.fillRect(0,0,128,128);let seed=271;for(let i=0;i<2600;i++){seed=(1664525*seed+1013904223)>>>0;const x=seed%128;seed=(1664525*seed+1013904223)>>>0;const y=seed%128;ctx.fillStyle=['#7b7b74','#aaa497','#575963'][i%3];ctx.fillRect(x,y,1,1);}const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(2,4);const dark=new T.MeshStandardMaterial({map:tx,roughness:.9});
 function box(w,h,d,m,x,y,z){const geometry=m===glass?new T.PlaneGeometry(w<d?d:w,h):new T.BoxGeometry(w,h,d);if(m===glass&&w<d)geometry.rotateY(Math.PI/2);const o=new T.Mesh(geometry,m);o.position.set(x,y,z);if(m===stone||m===wood){const uv=o.geometry.attributes.uv,n=o.geometry.attributes.normal;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(Math.abs(n.getX(i))>.5?d:w)/2,uv.getY(i)*(Math.abs(n.getY(i))>.5?d:h)/2);}o.castShadow=!m.transparent;o.receiveShadow=true;root.add(o);return o;}
 const curve=x=>3.9-2.6*(x/12)**2;
 function curvedSlab(y,depth,extra,material,end=12.3){const shape=new T.Shape();shape.moveTo(-end,-3.05);shape.lineTo(end,-3.05);for(let i=24;i>=0;i--){const x=-end+i*2*end/24;shape.lineTo(x,curve(x)+extra);}shape.closePath();const slab=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),material);slab.rotation.x=Math.PI/2;slab.position.y=y;slab.castShadow=slab.receiveShadow=true;root.add(slab);}
 curvedSlab(6.69,.22,.55,white);
 const fasciaPoints=[];for(let i=0;i<=48;i++){const x=-12.3+i*24.6/48;fasciaPoints.push(new T.Vector3(x,6.59,curve(x)+.55));}const fascia=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(fasciaPoints),48,.14,10,false),silver);root.add(fascia);
 // Raised limestone plinth, rear wall, visible floor and shallow furnishing establish depth behind glass.
 curvedSlab(1.05,1.05,.52,stone);box(24,5.4,.18,back,0,3.8,-2.9);
 for(const y of [1.1,3.85]){
  // Keep floor edges inside the painted end walls; an overhang cuts through the mural.
  curvedSlab(y,.16,.13,floor,12.06);
 }
 // Faceted shallow arc; every pane has real depth and restrained reflections, not an opaque blue slab.
 for(let i=0;i<12;i++){const a=-12+i*2,b=a+2,z1=curve(a),z2=curve(b),x=(a+b)/2,z=(z1+z2)/2,w=Math.hypot(2,z2-z1),angle=-Math.atan2(z2-z1,2);
  for(const [y,h]of [[2.32,2.35],[5.12,2.35]]){const o=box(w-.055,h,.035,glass,x,y,z);o.name="Media transparent curtain wall";o.rotation.y=angle;}
  for(const y of [1.13,3.5,3.8,5.35,6.35])box(w,.065,.11,silver,x,y,z+.025).rotation.y=angle;
  box(w,.46,.07,mat(0x9caebd,.5),x,3.65,z-.02).rotation.y=angle;
  for(const y of [3.47,6.25]){const lamp=new T.Mesh(new T.BoxGeometry(1.25,.04,.07),new T.MeshStandardMaterial({color:0xfff4d6,emissive:0xfff1cf,emissiveIntensity:.7}));lamp.position.set(x,y,z-.75);root.add(lamp);}
 }
 for(let x=-12;x<=12;x+=2){box(.065,5.25,.12,silver,x,3.74,curve(x)+.04);box(.045,.94,.06,silver,x,1.65,curve(x)+.5);}
 // Glass balustrade along the curved lower frontage.
 for(let i=0;i<12;i++){const x=-11+i*2;box(1.94,.87,.025,glass,x,1.65,curve(x)+.5).rotation.y=-Math.atan2(curve(x+1)-curve(x-1),2);}
 // Tall, tapered speckled fins with rectangular openings.
 for(const x of [-11,-8,-5,5,8,11]){const shape=new T.Shape();shape.moveTo(-.5,0);shape.lineTo(.5,0);shape.lineTo(1.05,7.2);shape.lineTo(-.5,7.6);shape.closePath();for(const [y,h]of [[1.2,2.15],[4.15,2.05]]){const hole=new T.Path();hole.moveTo(-.25,y);hole.lineTo(-.25,y+h);hole.lineTo(.48,y+h);hole.lineTo(.48,y);hole.closePath();shape.holes.push(hole);}const geo=new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:false});const o=new T.Mesh(geo,dark);o.rotation.y=Math.PI/2;o.position.set(x,0,curve(x)-.4);o.castShadow=true;root.add(o);}
 // Painted end faces toward SPACE after the building is rotated into the compact layout.
 box(.16,5.8,6.3,white,-12.06,3.9,.15);box(.16,5.8,6.3,white,12.06,3.9,.15);
 const muralURL='environment/assets/media-mural-sharp-v2-lossless.webp',loader=new T.TextureLoader();
 const muralTx=textures?textures.defer(loader,muralURL,{colour:'#f2e8da'}):loader.load(muralURL);muralTx.colorSpace=T.SRGBColorSpace;muralTx.anisotropy=16;
 const muralMaterial=new T.MeshStandardMaterial({map:muralTx,roughness:.9});muralMaterial.name='Media mural original artwork';
 // Atlas keeps the tall wall, upper projecting panel and lower circular artwork distinct.
 for(const [z,width,y,height,x,uv]of [[-1.5,2.55,3.8,5.1,-12.17,[0,0,.397,1]],[1.55,2.65,4.6,3.2,-12.46,[.4,.383,.6,.617]],[1.55,2.65,2.02,1.85,-12.18,[.4,0,.6,.38]]]){
  box(.3,height,width,white,x+.17,y,z);
  // Bake each atlas crop into geometry UVs. One texture identity receives the
  // deferred GPU upload, including panels already drawn with the placeholder.
  const geometry=new T.PlaneGeometry(width,height),coords=geometry.attributes.uv;for(let i=0;i<coords.count;i++)coords.setXY(i,uv[0]+coords.getX(i)*uv[2],uv[1]+coords.getY(i)*uv[3]);
  const panel=new T.Mesh(geometry,muralMaterial);panel.rotation.y=-Math.PI/2;panel.position.set(x-.015,y,z);root.add(panel);
  if(y>3){box(.05,.5,.8,silver,x-.035,y+.6,z);box(.055,.35,.63,mat(0x456675,.15),x-.06,y+.6,z);}
 }
 box(.045,2.1,.85,mat(0x4d6468),-12.17,2.1,.04);
 // Low side landing and stair connect the painted end to the oval.  A solid
 // limestone plinth now carries the landing and the stair cheeks, so neither
 // reads as floating when viewed from the lawn.
 box(1.34,.96,6.54,stone,-12.7,.48,.15);
 box(1.2,.18,6.4,floor,-12.7,1.07,.15);
 for(let i=0;i<6;i++)box(.32,(i+1)*.175,2.1,stone,-15.1+i*.32,(i+1)*.0875,.2);
 box(2.05,.34,.22,stone,-14.32,.17,-.88);box(2.05,.34,.22,stone,-14.32,.17,1.28);
 // Door frames and slim rail on the glass frontage.
 for(const x of [-2,2]){box(.045,2.18,.08,silver,x+.65,2.28,curve(x)+.07);box(.08,.24,.08,silver,x+.57,2.1,curve(x)+.14);}
 const railPoints=fasciaPoints.map(p=>new T.Vector3(p.x,2.17,p.z));root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(railPoints),48,.028,6,false),silver));
 return root;
}
