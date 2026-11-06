import {resolveCampusAssetURL} from './campus-asset-url.mjs?v=broad-integrated-20261014';
import {pavingNetwork} from './environment/paving-network.js?v=student-usability-20260924';
import {applyBuildingPalette,planter} from './environment/approved-campus-kit.js?v=ecc-ba60122';
import {thinGeometry,addAuthoredGarden} from './ecc-preview/authored-garden.js?v=ecc-ba60122';
import {batchStatic,partitionInstances} from './environment/static-batching.js?v=ecc-ba60122';
import * as THREE from 'three';
import {EST} from './destinations.js?v=ecc1';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
function mergeStatic(root){
 root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;const materials=Array.isArray(o.material)?o.material:[o.material];if(materials.length!==1)throw new Error('Unexpected multi-material campus mesh');const m=materials[0],g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=m.uuid;if(!groups.has(key))groups.set(key,{material:m,geometries:[]});groups.get(key).geometries.push(g);});const result=new THREE.Group();for(const {material,geometries}of groups.values()){const geometry=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g),false);if(!geometry)throw new Error('Campus geometry merge failed');const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);}return result;
}
// The normal game can fetch the required landscape while its courtyard is loading.
export async function loadCampusAssets({textures,ids=['mature-eucalypt-a','mature-eucalypt-b','small-multistem-a','boulder-a','careers','workplace']}={}){
 const manager=new THREE.LoadingManager();
 // Geometry/collisions must not wait for external decorative building maps.
 // Original images hydrate the same GLTF textures, retaining UVs and samplers.
 const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9axC8gQAAAABJRU5ErkJggg==';
 const imageURI=uri=>typeof uri==='string'&&!uri.startsWith('data:')&&/\.(png|jpe?g|webp)(?:[?#]|$)/i.test(uri);
 manager.setURLModifier(url=>resolveCampusAssetURL(url,value=>THREE.DefaultLoadingManager.resolveURL(value),textures?pixel:null));
 const loader=new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
 return new Map(await Promise.all(ids.map(async id=>{
  const url=`./assets/${['careers','workplace'].includes(id)?'campus-buildings/'+id+'-shared-textures':'campus-landscape/'+id+(['mature-eucalypt-a','mature-eucalypt-b','small-multistem-a'].includes(id)?'-packed':'')}.glb`;
  const asset=await loader.loadAsync(url);
  if(textures){
   const sourceURLs=new Map(),parser=asset.parser;
   for(const [index,definition]of (parser.json.textures||[]).entries()){
    const uri=parser.json.images?.[definition.source]?.uri;if(!imageURI(uri))continue;
    const texture=await parser.getDependency('texture',index);
    sourceURLs.set(texture.source,new URL(uri,new URL(parser.options.path,location.href)).href);
   }
   const queued=new Set();asset.scene.traverse(node=>{
    for(const material of(Array.isArray(node.material)?node.material:[node.material]))if(material)
     for(const texture of Object.values(material))if(texture?.isTexture&&sourceURLs.has(texture.source)&&!queued.has(texture)){
      queued.add(texture);textures.load(new THREE.TextureLoader(),sourceURLs.get(texture.source),{target:texture,flipY:texture.flipY});
     }
   });
  }
  return [id,asset];
 })));
}
// The accepted path network belongs to entry, not to distant tree downloads.
export function createCampusPaths(scene,palette){
 if(scene.getObjectByName('Campus walking paths'))return;
 const group=new THREE.Group();group.name='Campus walking paths';scene.add(group);
 const paving=palette.paving;
const pavingPaths=pavingNetwork(group,paving);const path=pavingPaths.path;
path([[-7,25],[-7,18],[-7,8],[-6,5],[-6,2],[-6,-1],[-3,-4],[0,-8.4]],4.2);
path([[-7,5],[-12.4,5]],4);path([[-7,18],[-13,18],[-13,12],[-19,12],[-19,14.8]],3.2);
path([[0,8],[8,8],[15,8],[15,13]],3.6);
path([[-7,5],[-8,0],[-11,-5],[-17,-5]],3.2);
path([[9,8],[10,2],[11,-5],[13,-9],[13,-16],[9,-20],[0,-22]],3.2);
path([[-20,-22],[-8,-22],[5,-22],[18,-22]],3.2);
path([[-11,-5],[-11,-14],[-11,-19],[-15,-22]],3.2);
pavingPaths.finish();
const plaza=new THREE.Mesh(new THREE.CircleGeometry(5.5,64),paving);plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.09,4);plaza.receiveShadow=true;plaza.userData.walkable=true;group.add(plaza);
}
export async function createCampusLandscape(scene,physics,palette,preloadedAssets,textures){
const loaded=preloadedAssets || await loadCampusAssets({textures,ids:scene.getObjectByName('Campus early exterior aprons')?['mature-eucalypt-a','mature-eucalypt-b','small-multistem-a','boulder-a']:undefined});
const group=new THREE.Group();group.name='Campus landscape';scene.add(group);
const placements=[];const colliders=[];
const paving=palette.paving,soil=palette.soil,edge=palette.stone;
function rect(x,z,w,d,material,y=.095){const geo=new THREE.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/3,(pos.getZ(i)+z)/3);const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.userData.walkable=material===paving;m.receiveShadow=true;group.add(m);return m;}
createCampusPaths(scene,palette);
// The long southern display pond is intentionally removed. The smaller Garden
// pond beside the buildings remains part of the active landscape.
function add(id,x,z,scale=1,rotation=0){placements.push({id,x,z,scale,rotation});}
// Keep a clear walking line around the Avatar Studio mural and its garden.
const beds=[[-19,-8.6,7,2.3],[-16,-1.7,4.4,1.15],[7.5,-2.5,1.7,7],[15.7,-16.8,2.2,5],[3,-20,5,1.4],[-17,-19.5,5,1.5],[22,3,6,1.8]];
beds.forEach(([x,z,w,d],j)=>{rect(x,z,w,d,soil,.1);colliders.push([x,.25,z,w,.5,d]);rect(x-w/2-.09,z,.18,d+.3,edge,.13);rect(x+w/2+.09,z,.18,d+.3,edge,.13);rect(x,z-d/2-.09,w,.18,edge,.13);rect(x,z+d/2+.09,w,.18,edge,.13);for(let i=0;i<5;i++){const along=[-.37,-.19,.035,.20,.37][i],cross=Math.sin((i+1)*2.1+j)*.12;const px=x+(w>d?along*w:cross),pz=z+(d>w?along*d:cross);const size=.59+.035*((i+j)%4);add((i+j)%3===0?'silver-shrub':'olive-shrub',px,pz,size,(i+j)*1.3);add('tufted-grass',px+(w>d?.14:.22),pz+(d>w?.14:.22),.61+.04*((i+2*j)%4),i+j*.7);if(i%2===0)add('yellow-flower-clump',px-.19,pz-.17,.50+.04*((i+j)%3),j+i*.6);}});
[[-11,20],[-3,21],[-13,10],[-1,13],[-22,-11],[-17,-12],[-8,-18],[-20,-19],[8,-18],[18,-21],[16,-3],[23,4],[6,12],[25,21]].forEach(([x,z],i)=>add(i%2?'mature-eucalypt-a':'mature-eucalypt-b',x,z,.78,i));
[[-20,-2],[-14,-9],[7,-6],[18,1],[-3,9]].forEach(([x,z],i)=>add('small-multistem-a',x,z,.65,i));
[[-19,-8.6],[7.5,-4],[15.7,-16],[-17,-19.5]].forEach(([x,z],i)=>add('boulder-a',x,z,.58,i));

for(let i=placements.length-1;i>=0;i--)if(/shrub|grass|flower/.test(placements[i].id))placements.splice(i,1);
for(const [x,z,w,d]of beds)planter(group,x,z,w,d,palette);
const planting=new THREE.Group();planting.name='Supporting campus native gardens';group.add(planting);addAuthoredGarden(planting,beds,{treeSites:[],baseY:.43,density:3.5,detail:'supporting'});
for(const id of [...new Set(placements.map(p=>p.id))]){const asset=loaded.get(id);asset.scene=mergeStatic(asset.scene);if(id==='boulder-a'){const bounds=new THREE.Box3().setFromObject(asset.scene),c=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());const scale=1/Math.hypot(size.x,size.z);asset.scene.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.geometry.translate(-c.x,-bounds.min.y,-c.z);o.geometry.scale(scale,scale,scale);}});}asset.scene.updateMatrixWorld(true);const ps=placements.filter(p=>p.id===id);asset.scene.traverse(o=>{if(!o.isMesh)return;const inst=new THREE.InstancedMesh(o.geometry,o.material,ps.length);ps.forEach((p,i)=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(p.x,id==='boulder-a'?.40:.12,p.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.rotation),new THREE.Vector3(p.scale,p.scale,p.scale));m.multiply(o.matrixWorld);inst.setMatrixAt(i,m);});inst.castShadow=true;inst.receiveShadow=true;
// Original trees retain every trunk and placement. Software Auto draws a
// sampled version of the same leaf quads; hardware/High keep the authored asset.
if(id!=='boulder-a'&&/^leaf/i.test(o.material.name)){const low=new THREE.InstancedMesh(thinGeometry(o.geometry,6,4),o.material,ps.length);low.instanceMatrix.copy(inst.instanceMatrix);low.castShadow=low.receiveShadow=true;low.computeBoundingSphere();const lod=new THREE.LOD();lod.name='Campus original tree detail';lod.userData.softwareDetail=true;lod.addLevel(inst,0);lod.addLevel(low,Infinity);group.add(lod);}else group.add(inst);});}
// Cull off-screen plants as soon as they appear, without waiting for the rest
// of campus assets and textures. Existing full-detail matrices/materials stay intact.
partitionInstances(group,{filter:o=>!o.userData.distanceDetail});
// The front-of-Administration pergola and benches were visually unreliable in
// review. Leave this constrained forecourt open until a replacement layout is
// commissioned, rather than retaining furniture that obstructs planting.

for(const p of placements.filter(p=>p.id.includes('eucalypt')||p.id.includes('multistem')))colliders.push([p.x,1.5,p.z,.4,3,.4]);
const buildings=installCampusBuildings(scene,palette,loaded,rect,colliders);
for(const b of colliders)physics.block(...b);
// Northern water remains outside the walking boundary; eastern pond and fountain use existing bodies.
return {group,buildings:buildings.map(({model,...spec})=>spec),placements,colliders:colliders.length,treeSource:loaded.get('mature-eucalypt-a')?.scene};
}

function installCampusBuildings(scene,palette,loaded,rect,colliders){
const paving=palette.paving;
const buildings=[];
for(const spec of [{id:'careers',name:'Careers Advice Centre',x:-19,z:18,width:8,depth:6},{id:'workplace',name:EST.name,x:15,z:18,width:12,depth:8}]){
 const existing=scene.getObjectByName(spec.name);if(existing?.userData.campusBuilding){buildings.push({...existing.userData.campusBuilding,model:existing});continue;}
 const asset=loaded.get(spec.id);
 // Reuse the building, porch, furniture and planting. The display plate gives way to campus paths.
 for(const child of [...asset.scene.children])if(/^Whole item paving/i.test(child.name))asset.scene.remove(child);
 if(spec.id===EST.buildingId){
  const oldText=[];asset.scene.traverse(o=>{if(/^Text[._]?013$/.test(o.name))oldText.push(o);});oldText.forEach(o=>o.removeFromParent());
 }
 // The legacy display ramps cut through the continuous campus paving. Keep the raised landing.
 const oldRamps=[];asset.scene.traverse(o=>{if(/^ramp-3p2x2/.test(o.name))oldRamps.push(o);});oldRamps.forEach(o=>o.removeFromParent());
 applyBuildingPalette(asset.scene,palette);const model=batchStatic(asset.scene);model.name=spec.name;model.rotation.y=Math.PI;model.position.set(spec.x,0,spec.z);scene.add(model);
 if(spec.id===EST.buildingId){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#164f54';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#d6b95c';ctx.lineWidth=12;ctx.strokeRect(10,10,1004,236);ctx.fillStyle='#fff9e8';ctx.font='bold 110px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(EST.name,512,130);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(3,.45),new THREE.MeshBasicMaterial({map:texture}));sign.name='EST Prep entrance sign';sign.rotation.y=Math.PI;sign.position.set(15,3.34,12.30);scene.add(sign);
 }
 // Side/rear walls and front jambs leave the authored doorway (module centred at local x=-1) open.
 const front=spec.z-spec.depth/2,back=spec.z+spec.depth/2;
 colliders.push([spec.x-spec.width/2,1.8,spec.z,.24,3.6,spec.depth],[spec.x+spec.width/2,1.8,spec.z,.24,3.6,spec.depth],[spec.x,1.8,back,spec.width,3.6,.24]);
 const entryX=spec.x+1,left=spec.x-spec.width/2,right=spec.x+spec.width/2;
 const leftWidth=entryX-.88-left,rightWidth=right-entryX-.88;
 colliders.push([left+leftWidth/2,1.8,front,leftWidth,3.6,.24],[right-rightWidth/2,1.8,front,rightWidth,3.6,.24]);
 // Walkable landing/floor with a low rise, within the existing character autostep height.
 colliders.push([spec.x,.1,spec.z,spec.width,.2,spec.depth]);
 rect(entryX,front-1.5,3.4,3.4,paving,.105);
 model.userData.campusBuilding={...spec,front,entrance:[entryX,front],outward:[0,-1]};
 buildings.push({...model.userData.campusBuilding,model});
}
return buildings;
}
export async function createCampusBuildingExteriors(scene,physics,palette,textures){
 const loaded=await loadCampusAssets({textures,ids:['careers','workplace']});const group=new THREE.Group();group.name='Campus early exterior aprons';scene.add(group);const colliders=[];
 const rect=(x,z,w,d,material,y=.095)=>{const geo=new THREE.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/3,(pos.getZ(i)+z)/3);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.userData.walkable=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
 installCampusBuildings(scene,palette,loaded,rect,colliders);for(const collider of colliders)physics.block(...collider);return group;
}
