import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
function roundedBox(w,h,d,segments,r){const sh=new THREE.Shape(),x=-w/2,y=-h/2;sh.moveTo(x+r,y);sh.lineTo(x+w-r,y);sh.quadraticCurveTo(x+w,y,x+w,y+r);sh.lineTo(x+w,y+h-r);sh.quadraticCurveTo(x+w,y+h,x+w-r,y+h);sh.lineTo(x+r,y+h);sh.quadraticCurveTo(x,y+h,x,y+h-r);sh.lineTo(x,y+r);sh.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(sh,{depth:d-.04,steps:1,bevelEnabled:true,bevelSegments:segments,bevelSize:.02,bevelThickness:.02,curveSegments:6});g.translate(0,0,-(d-.04)/2);return g;}
/** ECC Chapel: reference-led architectural interior. Original reference JPEGs remain unchanged. */
export const CHAPEL={x:-3.15,z:-8.8,entry:[0,5.7],reflection:[-6.2,2.4]};
export async function buildChapel(scene,physics){
 const root=new THREE.Group();root.name='ECC Chapel reflection interior';
 const loader=new THREE.TextureLoader();
 const altarPhoto=await loader.loadAsync(new URL('./assets/chapel/altar-reference.jpg',import.meta.url).href);
 for(const t of [altarPhoto]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;}
 const {RectAreaLightUniformsLib}=await import('three/addons/lights/RectAreaLightUniformsLib.js');
 RectAreaLightUniformsLib.init();
 const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
 const ivory=mat(0xf1eee5),oak=mat(0xb88c57),stone=mat(0xd5c5a7),cloth=mat(0xfffaf0),chair=mat(0xddd8cc),dark=mat(0x26434a),gold=mat(0xb89c62,.4),glass=new THREE.MeshPhysicalMaterial({color:0xa6b4ae,roughness:.29,metalness:.12,clearcoat:.8,clearcoatRoughness:.2,envMapIntensity:.55});
 const woodCanvas=document.createElement('canvas');woodCanvas.width=128;woodCanvas.height=512;const wc=woodCanvas.getContext('2d');wc.fillStyle='#b88b58';wc.fillRect(0,0,128,512);for(let i=0;i<160;i++){wc.strokeStyle=i%3?'rgba(70,38,14,.12)':'rgba(255,230,177,.2)';wc.lineWidth=.3+(i%4)*.2;wc.beginPath();for(let y=0;y<=512;y+=8){const x=(i*37)%128+Math.sin(y*.023+i)*1.5;if(y===0)wc.moveTo(x,y);else wc.lineTo(x,y);}wc.stroke();}const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.repeat.set(2,2);oak.color.set(0xffffff);oak.map=woodTexture;
 const carpet=mat(0xffffff);const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#c7bfaf';ctx.fillRect(0,0,128,128);for(let i=0;i<5000;i++){const n=(i*73)%128,m=(i*37+Math.floor(i/128)*11)%128;ctx.fillStyle=i%2?'#bfb5a4':'#d0c7b7';ctx.fillRect(n,m,1,2);}const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);carpet.map=texture;
 // Material detail is shared across all repeated seats and architectural parts.
 function grain(base,size,kind){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const im=x.createImageData(size,size);let seed=1947;for(let y=0;y<size;y++)for(let i=0;i<size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296-.5)*18;const weave=kind==='fabric'?((i%4<2?3:-3)+(y%4<2?3:-3)):0;const k=(y*size+i)*4;for(let j=0;j<3;j++)im.data[k+j]=base[j]+noise+weave;im.data[k+3]=255;}x.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
 const fabricTexture=grain([219,214,203],512,'fabric');fabricTexture.repeat.set(2,2);chair.map=fabricTexture;chair.color.set(0xffffff);chair.bumpMap=fabricTexture;chair.bumpScale=.009;chair.roughness=.95;
 carpet.map=grain([189,182,165],512,'carpet');carpet.map.repeat.set(24,24);carpet.bumpMap=carpet.map;carpet.bumpScale=.012;carpet.roughness=1;
 oak.roughness=.48;oak.envMapIntensity=.2;gold.metalness=.75;gold.roughness=.25;
 const stoneMap=await loader.loadAsync(new URL('./ecc-preview/assets/courtyard/sandstone-diffuse.jpg',import.meta.url).href);stoneMap.colorSpace=THREE.SRGBColorSpace;stoneMap.wrapS=stoneMap.wrapT=THREE.RepeatWrapping;stoneMap.repeat.set(2,2);stoneMap.anisotropy=8;stone.map=stoneMap;stone.color.setHex(0xe1d6c0);
 function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 function cylinder(r,h,m,x,y,z){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
 function solid(x,y,z,w,h,d){physics.block(x,y,z,w,h,d);}
 box(22,.16,18,carpet,0,-.08,0);box(22,6,.25,ivory,0,3,-8.7);
 // Broad side glazing below plaster bulkheads, matching the photographed side perspective.
 const daylight=new THREE.MeshBasicMaterial({color:0xd6e4df});
 for(const side of [-1,1]){
  box(.25,1.0,18,stone,side*10.9,.50,0);box(.25,2.35,18,ivory,side*10.9,4.375,0);
  for(const z of [-8.2,-4,0,4,8.2])box(.28,2.3,z===0?1.15:.75,ivory,side*10.9,2.15,z);
  for(const z of [-6.1,-2.0,2.0,6.1]){
   box(.025,2.12,3.2,daylight,side*10.99,2.10,z).castShadow=false;
   box(.025,2.10,3.18,glass,side*10.78,2.10,z).castShadow=false;
   for(const dz of [-1.63,0,1.63])box(.10,2.25,.07,oak,side*10.72,2.12,z+dz);
   for(const y of [1,3.24])box(.12,.07,3.32,oak,side*10.72,y,z);
  }
 }

 for(const side of [-1,1]){
 const x=side*6.0;box(9.7,1,.25,stone,x,.5,8.7);box(9.7,2.1,.25,ivory,x,4.25,8.7);
 for(const dx of [-4.8,-1.6,1.6,4.8])box(.16,2.2,.25,oak,x+dx,2.1,8.7);
 for(const dx of [-3.2,0,3.2]){box(3.02,2.15,.025,daylight,x+dx,2.1,8.81).castShadow=false;box(3.00,2.1,.025,glass,x+dx,2.1,8.57).castShadow=false;}
 for(const y of [1,3.22])box(9.7,.08,.16,oak,x,y,8.55);
}
 solid(-10.9,3,0,.25,6,18);solid(10.9,3,0,.25,6,18);solid(0,3,-8.7,22,6,.25);solid(0,3,8.7,22,6,.25);
 // Sanctuary: shallow curved edge, clear access around altar; only a gentle 16cm rise.
 const stage=new THREE.Mesh(new THREE.CylinderGeometry(4.9,4.9,.16,64,1,false,-Math.PI/2,Math.PI),oak);stage.position.set(0,.08,-7.45);root.add(stage);
 box(9.8,.17,1.2,oak,0,.085,-7.9);
 const stageCarpet=new THREE.Mesh(new THREE.CircleGeometry(4.86,64,Math.PI,Math.PI),carpet);stageCarpet.rotation.x=-Math.PI/2;stageCarpet.position.set(0,.165,-7.45);root.add(stageCarpet);solid(0,.04,-6.9,9.8,.08,3.2);
 box(2,.14,.95,oak,0,1.02,-6.15);for(const x of [-.82,.82])box(.13,.88,.65,oak,x,.53,-6.15);box(2.05,.035,1,cloth,0,1.11,-6.15);box(2.05,.36,.025,cloth,0,.94,-5.65);
 solid(0,.65,-6.15,2.1,1.3,1);
 for(const x of [-.72,.72]){cylinder(.12,.045,gold,x,1.15,-6.15);cylinder(.045,.38,cloth,x,1.35,-6.15);cylinder(.014,.04,new THREE.MeshBasicMaterial({color:0xffde9d}),x,1.56,-6.15);}
 box(.045,.38,.045,oak,0,1.33,-6.38);box(.23,.045,.045,oak,0,1.40,-6.38);
 // Folding frosted screen and timber frame, as seen behind the actual altar.
 for(let i=0;i<9;i++){const x=(i-4)*.8,z=-8.1+Math.abs(i-4)*.035;box(.78,2.9,.10,glass,x,1.7,z);box(.055,3.1,.14,oak,x-.4,1.7,z+.015);box(.8,.08,.15,oak,x,3.25,z);}
 // Original coloured cross, sampled directly from the supplied altar photograph.
 const crossShape=new THREE.Shape();crossShape.moveTo(-.10,-.7);crossShape.lineTo(.10,-.7);crossShape.lineTo(.10,.14);crossShape.lineTo(.46,.14);crossShape.lineTo(.46,.39);crossShape.lineTo(.10,.39);crossShape.lineTo(.10,.7);crossShape.lineTo(-.10,.7);crossShape.lineTo(-.10,.39);crossShape.lineTo(-.46,.39);crossShape.lineTo(-.46,.14);crossShape.lineTo(-.10,.14);crossShape.closePath();
 const cg=new THREE.ShapeGeometry(crossShape),pos=cg.attributes.position,uv=cg.attributes.uv;for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+.46)/.92,v=(pos.getY(i)+.7)/1.4;uv.setXY(i,(415+u*104)/940,1-(635-v*157)/1253);}uv.needsUpdate=true;const cross=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({map:altarPhoto,side:THREE.DoubleSide}));cross.name='Original ECC coloured cross';cross.position.set(0,4.32,-8.495);const crossMount=new THREE.Mesh(new THREE.ExtrudeGeometry(crossShape,{depth:.035,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012}),new THREE.MeshStandardMaterial({color:0xd5dedc,roughness:.26,metalness:.65}));crossMount.position.set(0,4.32,-8.56);crossMount.scale.set(1.12,1.08,1);root.add(crossMount,cross);
 // Four round oak columns and limestone bases; broad aisles remain clear.
 for(const x of [-5,5])for(const z of [-4.2,4.2]){box(.9,.95,.9,stone,x,.475,z);cylinder(.29,4.6,oak,x,3.2,z);solid(x,2.7,z,.9,5.4,.9);}
 // A central raised roof lantern surrounded on all four sides by lower timber ceilings.
 // This bounded central volume replaces the former full-length nave-like spine.
 const warmLED=new THREE.MeshBasicMaterial({color:0xffe3b5});
 for(const side of [-1,1]){
  for(let row=0;row<7;row++){const roof=box(5.83,.13,2.46,oak,side*7.99,5.40,-7.44+row*2.48);roof.castShadow=false;}
  for(let col=0;col<4;col++){const roof=box(2.46,.13,4.45,oak,-3.72+col*2.48,5.40,side*6.475);roof.castShadow=false;}
  box(.22,.9,8.55,ivory,side*4.96,5.59,0);
  box(10.14,.9,.22,ivory,0,5.59,side*4.25);
  box(.025,.035,8.14,warmLED,side*4.80,5.11,0).castShadow=false;
  box(9.5,.035,.025,warmLED,0,5.11,side*4.09).castShadow=false;
  for(const z of [-6,0,6])box(5.56,.023,.034,warmLED,side*7.99,5.32,z).castShadow=false;
  for(const x of [-2.5,2.5])box(.025,.023,4.20,warmLED,x,5.32,side*6.475).castShadow=false;
  for(let row=0;row<5;row++)for(let slit=0;slit<5;slit++)box(.015,.018,1.05,dark,side*(5.4+slit*.055),5.32,-6+row*3).castShadow=false;
 }
 const slope=Math.atan(.60/4.96);
 for(const side of [-1,1])for(let row=0;row<4;row++){const roof=box(5.01,.12,2.10,oak,side*2.48,6.80,-3.18+row*2.12);roof.rotation.z=-side*slope;roof.castShadow=false;}
 const skyCanvas=document.createElement('canvas');skyCanvas.width=16;skyCanvas.height=128;const sx=skyCanvas.getContext('2d'),sg=sx.createLinearGradient(0,0,0,128);sg.addColorStop(0,'#d2e9f0');sg.addColorStop(1,'#f8faf1');sx.fillStyle=sg;sx.fillRect(0,0,16,128);const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;const sky=new THREE.MeshBasicMaterial({map:skyTexture,color:0xffffff});
 // Clerestory glass sits above the deep white frieze on all four sides.
 for(const side of [-1,1]){
  box(.065,.46,8.24,sky,side*4.98,6.28,0).castShadow=false;
  box(9.92,.46,.065,sky,0,6.28,side*4.23).castShadow=false;
  for(let i=0;i<6;i++)box(.11,.57,.055,ivory,side*4.98,6.28,-4.1+i*1.64);
  for(let i=0;i<7;i++)box(.055,.57,.11,ivory,-4.92+i*1.64,6.28,side*4.23);
 }
 // Shallow folded white relief panels, as visible from the side in ECC-Chapel-4.
 const relief=new THREE.BufferGeometry();const corners=[[-.29,-.25,0],[.29,-.25,0],[.29,.25,0],[-.29,.25,0]],vertices=[];for(let i=0;i<4;i++)vertices.push(...corners[i],...corners[(i+1)%4],0,0,.065);relief.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));relief.computeVertexNormals();
 for(const side of [-1,1])for(let row=0;row<1;row++)for(let col=0;col<13;col++){const panel=new THREE.Mesh(relief,ivory);panel.position.set(side*4.83,5.61,-3.72+col*.62);panel.rotation.y=-side*Math.PI/2;root.add(panel);}
 const ripple=document.createElement('canvas');ripple.width=256;ripple.height=512;const rc=ripple.getContext('2d');rc.fillStyle='#888';rc.fillRect(0,0,256,512);for(let i=0;i<48;i++){rc.strokeStyle=i%2?'#939393':'#7d7d7d';rc.lineWidth=1.5;rc.beginPath();for(let y=0;y<513;y+=6){const x=i*5.5+Math.sin(y*.019+i)*2.2;y?rc.lineTo(x,y):rc.moveTo(x,y);}rc.stroke();}glass.bumpMap=new THREE.CanvasTexture(ripple);glass.bumpScale=.025;
 for(let i=0;i<15;i++){const x=((i%3)-1)*.58,z=-1.65+Math.floor(i/3)*.83,h=.42+(i%4)*.13,top=6.2-(i%3)*.15;const cableLength=7.02-top;cylinder(.006,cableLength,dark,x,top+cableLength/2,z);cylinder(.027,h,gold,x,top-h/2,z);cylinder(.029,h-.055,warmLED,x,top-h/2,z);cylinder(.032,.025,gold,x,top-h,z);}
 // Individual upholstered chairs, not pews. Repeated meshes share geometry/material.
 const chairParts=[{g:roundedBox(.56,.15,.56,3,.065),m:chair,p:[0,.47,0]},{g:roundedBox(.57,.55,.13,3,.06),m:chair,p:[0,.79,.23]},...[-.20,.20].flatMap(x=>[-.19,.19].map(z=>({g:new THREE.CylinderGeometry(.026,.035,.43,8),m:oak,p:[x,.235,z]})))];
 const seats=[];for(const side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<4;col++)seats.push({x:side*(1.1+col*.73),z:-3.8+row*1.12,a:0});
 for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=0;col<4;col++)seats.push({x:side*(6.1+col*.75),z:-3.3+row*1.15,a:side*.28});
 seats.push({x:-6.15,z:2.25,a:-Math.PI/2},{x:-6.15,z:3.35,a:-Math.PI/2});
 const transform=new THREE.Object3D(),part=new THREE.Matrix4();for(const item of chairParts){const inst=new THREE.InstancedMesh(item.g,item.m,seats.length);seats.forEach((s,i)=>{transform.position.set(s.x,0,s.z);transform.rotation.set(0,s.a,0);transform.updateMatrix();part.makeTranslation(...item.p);inst.setMatrixAt(i,transform.matrix.clone().multiply(part));});inst.castShadow=inst.receiveShadow=true;root.add(inst);}
 for(const s of seats)solid(s.x,.5,s.z,.55,1,.6);
 // Soft contact shadows ground repeated seating without expensive per-chair lights.
 const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=64;const sc=shadeCanvas.getContext('2d'),gradient=sc.createRadialGradient(32,32,4,32,32,32);gradient.addColorStop(0,'rgba(37,30,20,.22)');gradient.addColorStop(1,'rgba(37,30,20,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);const shadeMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadeCanvas),transparent:true,depthWrite:false});for(const s of seats){const o=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),shadeMaterial);o.rotation.x=-Math.PI/2;o.position.set(s.x,.005,s.z);root.add(o);}
 // Altar-side presider chairs and lectern, as photographed.
 box(.65,.8,.55,dark,-3.3,.56,-6.5);box(.84,.075,.62,oak,-3.3,1,-6.5);solid(-3.3,.55,-6.5,.85,1.1,.7);
 for(const x of [2.4,3.25]){box(.64,.15,.65,chair,x,.55,-7.1);box(.68,.62,.13,chair,x,.85,-7.39);for(const dx of [-.25,.25])box(.07,.5,.07,oak,x+dx,.3,-7.1);}
 // The photo's distinctive branching window is a visual focus of a quiet side alcove.
 const tree=await loader.loadAsync(new URL('./ecc-preview/assets/authored-courtyard/chapel-etched-glass-v2-lossless.webp',import.meta.url).href);tree.colorSpace=THREE.SRGBColorSpace;tree.anisotropy=8;const window=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.7),new THREE.MeshPhysicalMaterial({map:tree,roughness:.24,metalness:.12,clearcoat:.8,envMapIntensity:.25}));window.name='ECC tree-glass interior interpretation';window.rotation.y=0;window.position.set(-6.7,2.3,-8.51);root.add(window);
 for(const x of [-7.65,-5.75])box(.12,3.1,.16,oak,x,2.3,-8.42);for(const y of [.87,3.73])box(2.0,.10,.16,oak,-6.7,y,-8.42);
 // Quiet-alcove timber baffles and a teal upholstered bench echo the concept.
 for(let i=0;i<10;i++)box(.075,3.9,.18,oak,-7.8+i*.16,1.95,4.9);
 box(1.7,.36,.65,dark,-7, .47,4.4);box(1.7,.55,.15,dark,-7,.8,4.65);for(const x of [-7.7,-6.3])box(.09,.3,.5,oak,x,.15,4.4);solid(-7,.5,4.4,1.8,1,.75);
 const leafMat=mat(0x617d4c);for(const [x,z] of [[-4.1,-6.5],[4.1,-6.5],[-7.2,1],[7.3,5.4]]){cylinder(.28,.55,stone,x,.275,z);for(let i=0;i<12;i++){const angle=i*2.4,y=.65+(i%4)*.23;const o=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),leafMat);o.scale.set(1,2.5,.35);o.rotation.z=Math.sin(angle)*.9;o.position.set(x+Math.cos(angle)*.24,y,z+Math.sin(angle)*.24);root.add(o);}}
 // Small coloured glass insets echo the actual side-wall windows.
 for(const side of [-1,1])for(let i=0;i<3;i++){const color=[0x3d99a1,0xb9983d,0x786697][i];box(.03,.4,.48,new THREE.MeshBasicMaterial({color}),side*10.73,2.3,-5.2+i*1.5);}
 box(2.1,2.8,.13,dark,0,1.4,8.59);box(.04,2.55,.04,gold,0,1.4,8.50);for(const x of [-1.12,1.12])box(.11,2.95,.17,oak,x,1.47,8.48);
 const fill=new THREE.HemisphereLight(0xf8f2e8,0x797469,1.0);root.add(fill);
 const sun=new THREE.DirectionalLight(0xffecd3,.35);sun.position.set(-4,6.2,2);sun.target.position.set(0,1,-4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.1,far:25});sun.shadow.normalBias=.035;sun.shadow.radius=5;root.add(sun,sun.target);
 function area(color,intensity,w,h,x,y,z,tx,ty,tz){const light=new THREE.RectAreaLight(color,intensity,w,h);light.position.set(x,y,z);light.lookAt(tx,ty,tz);root.add(light);return light;}
 area(0xffe4be,2.4,7,2.4,0,5.1,-5.5,0,0,-5.2);
 area(0xf0f5ef,2.5,2.5,7,-4.7,6.2,0,1,1,0);area(0xffe9cc,2.3,2.5,7,4.7,6.2,0,-1,1,0);
 area(0xffe1b4,1.6,6,2,0,4.5,5,0,2,-2);
 for(const x of [-3.5,0,3.5]){cylinder(.07,.025,dark,x,3.39,-7.76);cylinder(.052,.026,warmLED,x,3.37,-7.76);}
 // Small speakers flank the sanctuary as in the supplied reference.
 for(const side of [-1,1]){const speaker=box(.28,.78,.22,dark,side*4.3,4.1,-8.3);speaker.rotation.z=-side*.08;}
 // Batch static architecture by material and shadow behavior; upholstery remains instanced.
 root.updateMatrixWorld(true);const batches=new Map();for(const o of [...root.children]){if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))continue;const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;const a=batches.get(key)||[];a.push(o);batches.set(key,a);}
 for(const objects of batches.values()){if(objects.length<2)continue;const geometries=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);return g;});const geometry=mergeGeometries(geometries,false);if(!geometry)throw new Error('Chapel static geometry batch failed');const combined=new THREE.Mesh(geometry,objects[0].material);combined.name='Chapel batched '+objects[0].material.type;combined.castShadow=objects[0].castShadow;combined.receiveShadow=objects[0].receiveShadow;for(const o of objects)root.remove(o);for(const g of geometries)g.dispose();root.add(combined);}
 root.userData.chairCount=seats.length;root.userData.referenceSet=['ECC-Chapel-4','ECC-Chapel-5','ECC-Chapel-6'];
 scene.add(root);return {root,seats:seats.length,reflection:CHAPEL.reflection};
}
