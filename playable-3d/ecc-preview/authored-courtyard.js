import {addAdminSignage} from './admin-signage.js?v=entry-load-20260921';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {timberMap} from './hero-materials.js?v=authored1';
import * as T from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ECC_WELCOME} from './landmark-layout.js?v=exterior2';
export {ECC_WELCOME};
const beds=[[-8,5,2.8,4.6],[-6.3,-6.5,5,1.7],[7.2,10.9,4.7,2],[2.3,-.8,1.1,1.3],[-4.9,6.4,2.65,2.6],[5.8,5.2,3,2.6]];
export const courtyardObstacles=[{type:'circle',x:-6.479646327692871,z:2.668779006744716,r:.30},{type:'circle',x:-10,z:-4,r:.3},{type:'box',x:0,z:-4.55,w:8,d:4.2},{type:'box',x:6.45,z:-1.45,w:4.4,d:6.4},{type:'chapel',x:-6,z:-1,r:3.05,doorAngle:1.19,doorHalf:.21},...beds.map(([x,z,w,d])=>({type:'box',x,z,w,d})),{type:'box',x:ECC_WELCOME.x,z:ECC_WELCOME.z,w:2.42,d:.72,yaw:ECC_WELCOME.yaw}];
for(const [x,z,w,d] of [[-2.0,-.32,2,3.5],[3.25,.1,1.6,4.25]])for(const dx of [-w/2+.12,w/2-.12])for(const dz of [-d/2+.12,d/2-.12])courtyardObstacles.push({type:'box',x:x+dx,z:z+dz,w:.12,d:.12});
function label(words,w,h,x,y,z,dark=false){const c=document.createElement('canvas');c.width=1024;c.height=Math.ceil(1024*h/w);const ctx=c.getContext('2d');ctx.fillStyle=dark?'#263e42':'#eee4c9';ctx.font=`500 ${c.height*.57}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(words,512,c.height/2,970);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.6}));o.position.set(x,y,z);return o;}
async function maps(textures){const loader=new T.TextureLoader();const names=['sandstone-diffuse.jpg','sandstone-normal.jpg','sandstone-arm.jpg'];const [map,normalMap,packed]=await Promise.all(names.map(n=>textures?textures.load(loader,new URL('./assets/courtyard/'+n,import.meta.url).href,{normal:n.includes('normal')}):loader.loadAsync(new URL('./assets/courtyard/'+n,import.meta.url).href)));map.colorSpace=T.SRGBColorSpace;for(const t of [map,normalMap,packed]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}return {map,normalMap,packed};}
// The supplied courtyard mesh combines its old benches with the surrounding
// architecture. Remove only the low furniture triangles in their known zones,
// then rebuild the benches as explicit, controllable scene objects below.
const legacyBenchZones=[[-8.4,8.3,2.5,.95],[-6,8.3,2.5,.95],[5.7,7.7,2.7,.95],[9.3,3.7,.95,2.1]];
function removeEmbeddedBenches(root){
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh)return;
  const original=o.geometry,source=original.index?original.toNonIndexed():original,position=source.getAttribute('position');
  const kept=[];let removed=false;const points=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
  for(let i=0;i<position.count;i+=3){
   for(let vertex=0;vertex<3;vertex++)points[vertex].set(position.getX(i+vertex),position.getY(i+vertex),position.getZ(i+vertex)).applyMatrix4(o.matrixWorld);
   // A triangle that touches a bench zone belongs to the legacy furniture.
   // Removing by centroid left slivers at zone edges, visible as dark shards
   // on the paving. Include the whole triangle, with a small clearance.
   const inRecordedBenchZone=points.some(point=>point.y<1.6&&legacyBenchZones.some(([x,z,w,d])=>Math.abs(point.x-x)<w/2+.18&&Math.abs(point.z-z)<d/2+.18));
   // The supplied patio merges two remaining bench boards into the wider
   // timber primitive, outside its documented coordinate zones. Any low
   // timber in this exterior is seating; trim it as well so no bench boards
   // remain after the independently placed seating has been removed.
   const isLowTimber=/warm[ _]timber/i.test(o.material.name)&&points.some(point=>point.y<1.6);
   const isBench=inRecordedBenchZone||isLowTimber;
   if(isBench){removed=true;continue;}kept.push(i,i+1,i+2);
  }
  if(!removed){if(source!==original)source.dispose();return;}
  const geometry=new T.BufferGeometry();
  for(const [name,attribute] of Object.entries(source.attributes)){
   const values=[];for(const index of kept)for(let c=0;c<attribute.itemSize;c++)values.push(attribute.array[index*attribute.itemSize+c]);
   geometry.setAttribute(name,new T.BufferAttribute(new attribute.array.constructor(values),attribute.itemSize,attribute.normalized));
  }
  geometry.computeBoundingBox();geometry.computeBoundingSphere();o.geometry=geometry;
  if(source!==original)source.dispose();original.dispose();
 });
}
function addBackedBench(root,x,z,length,rotation=0){
 const seat=new T.MeshStandardMaterial({color:0x9b7046,roughness:.78}),base=new T.MeshStandardMaterial({color:0xd7cfbc,roughness:.9});
 const bench=new T.Group();bench.name='Courtyard bench — clear planter-facing orientation';
 const box=(w,h,d,material,px,py,pz)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(px,py,pz);mesh.castShadow=mesh.receiveShadow=true;bench.add(mesh);};
 box(length,.09,.48,seat,0,.53,0);box(length,.38,.08,seat,0,.76,.22);
 for(const px of [-length/2+.28,length/2-.28])box(.28,.5,.38,base,px,.25,0);
 bench.position.set(x,0,z);bench.rotation.y=rotation;root.add(bench);
}
export async function buildAuthoredCourtyard(doors,{textures,deferDetail=false}={}){
 // All independent courtyard downloads begin together; geometry and artwork stay unchanged.
 const textureLoader=new T.TextureLoader();
 const load=(loader,url,options)=>textures?textures.load(loader,url,options):loader.loadAsync(url);
 const [asset,stone,hdr,paving,recognition,interior,crest,rock]=await Promise.all([
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('./assets/authored-courtyard/ecc-exterior-annotations.glb?v=1',import.meta.url).href),
  maps(textures),load(new HDRLoader(),new URL('./assets/authored-courtyard/garden-reflections.hdr',import.meta.url).href,{hdr:true}),
  Promise.all(['diffuse','normal','arm'].map(n=>load(textureLoader,new URL('./assets/authored-courtyard/stone-surface-'+n+'.webp',import.meta.url).href,{normal:n==='normal'}))),
  load(textureLoader,new URL('./assets/authored-courtyard/chapel-etched-glass-v2-lossless.webp',import.meta.url).href),
  load(textureLoader,new URL('./assets/authored-courtyard/reception-backwall.jpg',import.meta.url).href),
  textureLoader.loadAsync(new URL('./assets/admin-signage/cleaned-ecc-crest-source-lossless.webp',import.meta.url).href),
  deferDetail?null:new GLTFLoader().loadAsync(new URL('../assets/campus-landscape/boulder-a.glb',import.meta.url).href)
 ]);
 hdr.mapping=T.EquirectangularReflectionMapping;for(const t of paving){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.anisotropy=8;}paving[0].colorSpace=T.SRGBColorSpace;
 const woodMap=timberMap();const root=asset.scene;root.name='ECC authored arrival courtyard';
 removeEmbeddedBenches(root);
 root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const m=o.material;m.name=m.name.replaceAll('_',' ');m.envMap=hdr;m.envMapIntensity=.16;
  if(/limestone|sandstone/.test(m.name)){m.map=stone.map;m.normalMap=stone.normalMap;m.normalScale.set(.18,.18);m.aoMap=stone.packed;m.aoMapIntensity=.35;m.roughnessMap=stone.packed;m.color.setHex(/cut/.test(m.name)?0xede1c3:0xffffff);m.roughness=1;}
  if(m.name==='ECC recessed limestone'){m.color.setHex(0x9aa99f);m.envMapIntensity=.05;}
  if(m.name==='ECC courtyard glass'){m.name='ECC authored glass';m.depthWrite=false;m.transparent=true;m.opacity=.14;m.side=T.DoubleSide;m.color.setHex(0xd4ded0);m.metalness=.06;m.roughness=.07;m.envMapIntensity=.38;m.forceSinglePass=true;o.castShadow=false;}
  if(m.name==='ECC travertine paving'){m.map=paving[0];m.normalMap=paving[1];m.normalScale.set(.065,.065);m.roughnessMap=paving[2];m.aoMap=paving[2];m.aoMapIntensity=.2;m.color.setRGB(.72,.84,.95);m.roughness=.94;
   // Sawn paving keeps photographic grain, with restrained colour contrast at walking distance.
   m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb = mix(vec3(.56,.52,.43), diffuseColor.rgb, .24);');};m.customProgramCacheKey=()=> 'ecc-sawn-paving-v1';}
  if(m.name==='ECC powdercoat blue'){m.color.setHex(0x28526a);m.roughness=.48;m.metalness=.25;m.envMapIntensity=.38;}
  if(m.name==='ECC Chapel woven stainless'){m.envMapIntensity=.7;m.roughness=.28;m.metalness=.84;}
  if(m.name==='ECC plaster'){m.color.setHex(0x938363);m.envMapIntensity=.28;}
  if(m.name==='ECC clay roof'){m.side=T.DoubleSide;m.color.setHex(0xa85a35);m.roughness=.89;}
  if(/warm interior/.test(m.name)){m.emissiveIntensity=.8;}
  if(/travertine paving|brick paving|mortar|soil/.test(m.name))o.castShadow=false;
  if(m.name==='Chapel tree silver'){m.color.setHex(0xc8d5cc);m.emissive.setHex(0x6d8980);m.emissiveIntensity=.14;}
  if(m.name==='ECC warm timber'||m.name==='ECC warm soffit'){m.map=woodMap;m.color.setHex(0xc4a175);m.roughness=.78;}
  m.needsUpdate=true;
 });
 // The original reference is archived; this isolated reconstruction contains
 // only etched glass artwork, so the exterior sculpture is genuinely separate.
 recognition.colorSpace=T.SRGBColorSpace;recognition.anisotropy=16;
 const recognitionPanel=new T.Mesh(new T.PlaneGeometry(1.60,2.40),new T.MeshPhysicalMaterial({map:recognition,roughness:.19,metalness:.08,envMap:hdr,envMapIntensity:.3,clearcoat:.8,clearcoatRoughness:.12}));recognitionPanel.name='Flush Chapel woman-and-branches etched glass';recognitionPanel.position.set(-6.38656901329193,2.10,1.9568375670574985);recognitionPanel.rotation.y=-0.13;root.add(recognitionPanel);
 interior.colorSpace=T.SRGBColorSpace;interior.anisotropy=8;
 const roomArt=new T.MeshStandardMaterial({map:interior,emissiveMap:interior,emissive:0xffddb2,emissiveIntensity:.45,color:0xffffff,roughness:.95});
 roomArt.name='ECC reception artwork';
 for(const [x,z,w]of [[0,-5.72,3.03],[-2.78,-5.19,1.98],[2.78,-5.19,1.98],[6.45,-1.69,3.2]]){const panel=new T.Mesh(new T.PlaneGeometry(w,2.75),roomArt);panel.name='Recessed reception background texture';panel.position.set(x,1.48,z);root.add(panel);}
 const crossLight=new T.PointLight(0xffd6a0,.65,2.2,2);crossLight.position.set(-6+Math.sin(.5)*2.55,1.90,-1+Math.cos(.5)*2.55);crossLight.name='Chapel restrained warm recess light';root.add(crossLight);
 const welcomeDetails=await addAdminSignage(root,hdr,ECC_WELCOME,crest);
 root.add(label('STUDENT SERVICES',3.55,.26,6.45,3.77,2.602));
 const chapelLabel=label('CHAPEL',.84,.21,-3.149907270545058,3.04,0.14099580783983612,true);chapelLabel.rotation.y=1.19;root.add(chapelLabel);
 welcomeDetails.add(label('WELCOME TO ECC',2.15,.24,0,.41,.331,true),label('Learning World',1.05,.12,0,.18,.331,true));
 // The three courtyard benches beside the Arrival planter are deliberately
 // omitted. The embedded originals were removed above and their colliders are
 // likewise absent, leaving an open, walkable paved forecourt.
 for(const [x,y,z]of [[0,2.45,-3.1],[6.45,2.45,.4],[-4.0,2.45,.35]]){const l=new T.PointLight(0xffc17b,9,4.5,2);l.position.set(x,y,z);l.name='ECC warm recessed room light';root.add(l);}
 // Detailed rocks reused from the accepted kit; instance them within the planted areas.
 let detailLoad;
 function loadDetail(){return detailLoad||=(async()=>{
  const {addAuthoredGarden}=await import('./authored-garden.js?v=ecc-ba60122');
  const detail=new T.Group();detail.name='ECC courtyard garden detail';addAuthoredGarden(detail,beds,{treeSites:[[-8.2,4.9,1.1,.4],[-6.6,-6.4,1.32,2.1],[-10,-4,1.4,.6],[10.8,-3,1.5,2.3]]}); // Omit only the foreground showcase tree; retain its planted bed.
  const stones=rock||await new GLTFLoader().loadAsync(new URL('../assets/campus-landscape/boulder-a.glb',import.meta.url).href);
  stones.scene.updateMatrixWorld(true);const rockBounds=new T.Box3().setFromObject(stones.scene),rockCentre=rockBounds.getCenter(new T.Vector3()),rockSize=rockBounds.getSize(new T.Vector3()),rockDiameter=Math.hypot(rockSize.x,rockSize.z);
  stones.scene.traverse(o=>{if(!o.isMesh)return;const sites=[[-7.7,3.5,.7],[-8.5,5.7,.55],[-6.5,-6.5,.5],[6.6,11,.55],[7.9,10.8,.35],[-5.25,5.95,.40],[-4.45,6.90,.28],[5.35,4.50,.34],[6.6,5.3,.40]];const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.translate(-rockCentre.x,-rockBounds.min.y,-rockCentre.z);geo.scale(1/rockDiameter,1/rockDiameter,1/rockDiameter);const inst=new T.InstancedMesh(geo,o.material,sites.length);inst.name='ECC garden stone outcrops';const d=new T.Object3D();sites.forEach(([x,z,s],i)=>{d.position.set(x,.36,z);d.rotation.y=i*1.71;d.scale.setScalar(s);d.updateMatrix();inst.setMatrixAt(i,d.matrix);});inst.castShadow=inst.receiveShadow=true;detail.add(inst);});
  root.add(detail);root.userData.plantInstances=detail.userData.plantInstances;return detail;
 })().catch(error=>{detailLoad=null;throw error;});}
 if(!deferDetail)await loadDetail();
 return {root,loadDetail,architecture:root,obstacles:courtyardObstacles,doors,materials:{},plantInstances:root.userData.plantInstances||0};
}
