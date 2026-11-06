import {neutralLabel} from './world-settings.mjs';
import {approvedPalette} from './environment/approved-campus-kit.js?v=ecc-ba60122';
import {createESTWallVideo} from './est-wall-video.js?v=load1-20260914';
import {buildChapel} from './chapel.js?v=opt2-20260914';
import {buildExterior} from './ecc-preview/model.js?v=ecc-ba60122';
import {LEGACY} from './destinations.js?v=ecc1';
import {findSafeLanding} from './landing.mjs?v=post-photo-tour-20261013';
import {createDeferredTextures} from './deferred-textures.js?v=ecc-ba60122';
import {createCampusLandscape,createCampusPaths,createCampusBuildingExteriors} from './campus-landscape.js?v=broad-integrated-20261014';
import {arrivalPrecinct} from './arrival-precinct.js?v=ecc-ba60122';
/**
 * Modular tile-kit plaza ground (Career Empire daytime campus).
 * ~2wu tiles stamped from a 2D grid: grass / path / asphalt / plaza (+ curb overlays).
 * phase() recolours type-kit materials only — layout is never rebuilt.
 * Tripo plaza-day-ground.glb whole-map plate is unused (rejected as unusable).
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {treeKit,districtBuildingModel} from './scenery.js?v=scenery-2';
import {PHASES} from './profiles.js';

const TILE=2;
const TILE_HALF=TILE/2;
/** District tile indices cover roughly ±26 world units around town centre. */
const GRID_MIN=-13;
const GRID_MAX=13;

const rand=(()=>{let n=1429;return()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296;};})();
const basic=(colour,roughness=.8)=>new THREE.MeshStandardMaterial({color:colour,roughness});
function mesh(group,geometry,material,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
function box(group,w,h,d,material,x,y,z){return mesh(group,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
/** First reusable hero-building kit: an ECC-campus Avatar Studio pavilion. */
function avatarStudioBuilding(){
  const root=new THREE.Group();root.name='ECC Avatar Studio';root.position.set(-17,0,5);root.rotation.y=Math.PI/2;
  const limestone=basic(0xd9d0bd,.88),navy=basic(0x21384a,.72),timber=basic(0x9e7654,.82);
  const glass=new THREE.MeshStandardMaterial({color:0x9ddbe2,roughness:.16,metalness:.08,transparent:true,opacity:.55,side:THREE.DoubleSide});
  const teal=new THREE.MeshStandardMaterial({color:0x3eaeb3,emissive:0x197f87,emissiveIntensity:.48,roughness:.35});
  const leaf=basic(0x527953,.96),planter=basic(0xc5bcab,.9);
  box(root,6.2,.25,8.1,limestone,0,.125,0);
  // A deliberately simple modular shell: rear wall, side piers, roof and framed glass frontage.
  box(root,6.05,3.25,.28,limestone,0,1.76,-3.72);
  for(const x of [-2.83,2.83])box(root,.34,3.15,7.55,limestone,x,1.73,0);
  box(root,6.45,.25,8.0,navy,0,3.38,0);
  box(root,6.78,.15,8.32,limestone,0,3.57,0);
  for(const x of [-1.65,-.55,.55,1.65]){
    box(root,.11,2.45,.08,navy,x,1.46,3.35);
    mesh(root,new THREE.PlaneGeometry(.96,2.36),glass,x,1.46,3.40);
  }
  // Timber shade fins and a small veranda make it belong to the warm campus family.
  for(let x=-2.35;x<-1.1;x+=.24)box(root,.11,2.35,.12,timber,x,1.65,-.2);
  box(root,6.95,.15,1.05,navy,0,3.0,3.88);
  for(const x of [-2.9,2.9])box(root,.14,3,.14,navy,x,1.5,4.22);
  // One recognisable, restrained avatar marker rather than a whole building of neon.
  const ring=mesh(root,new THREE.TorusGeometry(.64,.07,10,36),teal,0,1.62,4.31);ring.castShadow=false;
  const marker=mesh(root,new THREE.CylinderGeometry(.42,.42,2.15,20,true),new THREE.MeshStandardMaterial({color:0x78d1d5,transparent:true,opacity:.16,side:THREE.DoubleSide,emissive:0x196b74,emissiveIntensity:.32}),0,1.25,4.28);marker.castShadow=false;
  for(const x of [-2.2,2.2]){
    box(root,1.32,.48,.62,planter,x,.34,3.92);
    for(let i=0;i<3;i++){const shrub=mesh(root,new THREE.DodecahedronGeometry(.23,1),leaf,x+(i-1)*.28,.66,3.92);shrub.scale.y=1.3;}
  }
  const solar=basic(0x27485e,.42);for(const x of [-1.1,0,1.1])box(root,.86,.06,2.3,solar,x,3.67,-.7);
  return root;
}
export function sign(text,width=3,colour='#e5dbc1',back='#253c3b'){
 text=neutralLabel(text);
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle=back;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=colour;ctx.lineWidth=3;ctx.strokeRect(16,16,992,224);
  ctx.fillStyle=colour;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 68px Georgia';ctx.fillText(text,512,133,925);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshStandardMaterial({map:texture,roughness:.65,side:THREE.DoubleSide}));
}
function texture(kind){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='stone'?'#9c9c92':kind==='asphalt'?'#32343a':'#b6c0a7';ctx.fillRect(0,0,512,512);
  if(kind==='stone'){
    for(let y=0;y<8;y++)for(let x=-1;x<5;x++){
      const v=151+rand()*32;ctx.fillStyle=`rgb(${v+3},${v+2},${v-4})`;
      ctx.fillRect(x*128+(y%2)*64+2,y*64+2,124,60);
    }
  }
  if(kind==='asphalt'){
    for(let i=0;i<22000;i++){const v=28+rand()*40;ctx.fillStyle=`rgb(${v},${v},${v+2})`;ctx.fillRect(rand()*512,rand()*512,rand()*2+1,rand()*2+1);}
  }else{
    for(let i=0;i<17000;i++){const v=rand();ctx.fillStyle=v>.5?'rgba(255,255,240,.04)':'rgba(0,20,0,.035)';ctx.fillRect(rand()*512,rand()*512,rand()*3+1,rand()*3+1);}
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** Warm, low-contrast campus sky. It is deliberately environmental rather than a sci-fi backdrop. */
function campusSkyTexture(){
  const c=document.createElement('canvas');c.width=2048;c.height=1024;const ctx=c.getContext('2d');
  const sky=ctx.createLinearGradient(0,0,0,c.height);sky.addColorStop(0,'#90c6dd');sky.addColorStop(.48,'#d6edf1');sky.addColorStop(.72,'#f6deb9');sky.addColorStop(1,'#e7c993');ctx.fillStyle=sky;ctx.fillRect(0,0,c.width,c.height);
  // Fine cloud bands retain a bright Perth-day feeling without competing with destinations.
  ctx.globalAlpha=.20;ctx.fillStyle='#fffdf4';
  for(let i=0;i<14;i++){const x=(i*271)%c.width,y=110+(i*83)%360,w=260+(i%4)*150;ctx.beginPath();ctx.ellipse(x,y,w,20+(i%3)*12,0,0,Math.PI*2);ctx.fill();}
  // A distant native canopy gives the world an edge while leaving the horizon quiet.
  ctx.globalAlpha=.52;ctx.fillStyle='#6d8f72';
  for(let x=-30;x<c.width+90;x+=46){const h=28+((x*17)%53+53)%53;ctx.beginPath();ctx.arc(x,c.height*.775,h*.72,Math.PI,0);ctx.lineTo(x+h,c.height*.81);ctx.lineTo(x-h,c.height*.81);ctx.closePath();ctx.fill();}
  ctx.globalAlpha=1;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;return t;
}
/** Try plaza PNG maps; resolve null on miss so caller can keep procedural fallback. */
function tryLoadPlazaMap(url,repeatX=1,repeatY=1,textures){
  if(textures)return textures.load(new THREE.TextureLoader(),url,{transparent:/overlay|curb/.test(url),colour:url.includes('grass')?'#b6c0a7':url.includes('asphalt')?'#32343a':'#9c9c92'}).then(t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;t.repeat.set(repeatX,repeatY);return t;});
  return new Promise(resolve=>{
    const loader=new THREE.TextureLoader();
    loader.load(url,t=>{
      t.colorSpace=THREE.SRGBColorSpace;
      t.wrapS=t.wrapT=THREE.RepeatWrapping;
      t.anisotropy=8;
      t.repeat.set(repeatX,repeatY);
      resolve(t);
    },undefined,()=>resolve(null));
  });
}
function planeOverlay(group,w,d,material,x,y,z,rotY=0){
  const o=mesh(group,new THREE.PlaneGeometry(w,d),material,x,y,z);
  o.rotation.x=-Math.PI/2;o.rotation.z=rotY;o.castShadow=false;o.renderOrder=2;return o;
}
function consolidate(root){
  root.updateMatrixWorld(true);const groups=new Map();
  root.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);}});
  const merged=new THREE.Group();
  for(const [material,geometries] of groups){
    // Blender primitives and custom lofts do not all carry UVs. These assets use solid materials.
    const normalised=geometries.map(g=>{const n=g.index?g.toNonIndexed():g;for(const key of Object.keys(n.attributes))if(!['position','normal'].includes(key))n.deleteAttribute(key);return n;});
    const geo=mergeGeometries(normalised);if(!geo)throw new Error(`Cannot merge ${material.name}`);
    mesh(merged,geo,material.clone());for(const g of new Set([...geometries,...normalised]))g.dispose();
  }
  return merged;
}

/** Classify a tile centre (wx,wz) into grass | path | asphalt | plaza. Asphalt wins roads. */
function classifyTile(wx,wz){return 'grass';}

/** Phase tints multiply albedo maps (flourishing = bright white). */
const TILE_TINTS={
  disrepair:{grass:0x9aa090,path:0xa8a698,asphalt:0x707278,plaza:0xa3a292,curb:0x6a9094},
  growth:{grass:0xd0e0c0,path:0xeae6da,asphalt:0xc4c6cc,plaza:0xe4e0d4,curb:0xb0d8dc},
  flourishing:{grass:0xffffff,path:0xffffff,asphalt:0xffffff,plaza:0xffffff,curb:0xffffff},
};

/**
 * Build InstancedMesh kits for each tile type from the stamped grid.
 * Planes are Y-up on y≈0 and receive shadows.
 */
function buildTileKits(town,materials){
  const buckets={grass:[],path:[],asphalt:[],plaza:[]};
  for(let iz=GRID_MIN;iz<=GRID_MAX;iz++){
    for(let ix=GRID_MIN;ix<=GRID_MAX;ix++){
      const wx=ix*TILE+TILE_HALF;
      const wz=iz*TILE+TILE_HALF;
      buckets[classifyTile(wx,wz)].push({x:wx,z:wz});
    }
  }
  const elev={grass:0,path:.02,asphalt:.03,plaza:.04};
  const kits={};
  const plane=new THREE.PlaneGeometry(TILE,TILE);
  plane.rotateX(-Math.PI/2);
  const matrix=new THREE.Object3D();
  for(const type of Object.keys(buckets)){
    const cells=buckets[type];
    const mat=materials[type];
    const inst=new THREE.InstancedMesh(plane,mat,cells.length);
    inst.name=`tile-kit-${type}`;
    inst.castShadow=false;
    inst.receiveShadow=true;
    inst.frustumCulled=false;
    for(let i=0;i<cells.length;i++){
      matrix.position.set(cells[i].x,elev[type],cells[i].z);
      matrix.rotation.set(0,0,0);
      matrix.scale.set(1,1,1);
      matrix.updateMatrix();
      inst.setMatrixAt(i,matrix.matrix);
    }
    inst.instanceMatrix.needsUpdate=true;
    town.add(inst);
    kits[type]={mesh:inst,material:mat,count:cells.length};
  }
  return {kits,buckets};
}

export async function createWorlds(onProgress=()=>{},onSurfaceFailure=()=>{},scheduleHydration){
  const physicsReady=RAPIER.init();
  const loader=new GLTFLoader();
  const draco=new DRACOLoader();
  // Decoder matches three r180 / gltf-transform Draco meshes; CDN keeps vendor tree light.
  draco.setDecoderPath('./vendor/draco/');
  loader.setDRACOLoader(draco);
  const textures=createDeferredTextures({onFailure:onSurfaceFailure,scheduleHydration});
  // Full courtyard assets are optional until the arrival boundary opens.
  let exteriorLoad;
  const outerAsset={root:new THREE.Group(),obstacles:[]};
  // The new Studio is native geometry; optional scenery must not block startup.
  const studioReady=Promise.resolve({scene:new THREE.Group()});
  onProgress('Preparing the walking surface...');
  // Daytime plaza PNG kit (procedural canvas fallback if a map is missing).
  // Per-tile UVs are 0–1, so repeat stays at 1 (seamless maps tile across instances).
  const texturesReady=Promise.all([
    tryLoadPlazaMap('./assets/plaza/grass-ecc-campus-v1-lossless.webp',1,1,textures),
    tryLoadPlazaMap('./assets/plaza/limestone-ecc-campus-v1.png',1,1,textures),
    tryLoadPlazaMap('./assets/plaza/asphalt_day-lossless.webp',1,1,textures),
    tryLoadPlazaMap('./assets/plaza/asphalt_dash_overlay.png',1,8,textures),
    tryLoadPlazaMap('./assets/plaza/crosswalk_overlay.png',1,1,textures),
    tryLoadPlazaMap('./assets/plaza/curb_cyan_trim.png',12,1,textures),
  ]);
  const [studioAsset,,maps]=await Promise.all([studioReady,physicsReady,texturesReady]);
  const [grassMap,stoneMap,asphaltMap,dashMap,crosswalkMap,curbMap]=maps;
  onProgress('Building the learning district...');
  const town=new THREE.Scene(),interior=new THREE.Scene();
  // Brighter daytime sky / fog (clean ECC-campus atmosphere, not portal neon).
  town.background=campusSkyTexture();town.fog=new THREE.Fog(0xd7e8dc,64,175);
  interior.background=new THREE.Color(0xc4c2b4);

  const materials={
    grass:basic(0x7fad5e,.92),
    path:basic(0xd4d2c6,.78),
    asphalt:basic(0x3a3c42,.94),
    plaza:basic(0xc8c4b6,.72),
    leaf:basic(0x487e47),
    trunk:basic(0x605344),
    edge:basic(0xb4b7a8),
    water:new THREE.MeshStandardMaterial({color:0x4b9baf,metalness:.5,roughness:.2}),
  };
  const grassTex=grassMap||texture('grass');if(!grassMap)grassTex.repeat.set(1,1);
  materials.grass.map=grassTex;materials.grass.color.set(0xffffff);
  const stoneTex=stoneMap||texture('stone');if(!stoneMap)stoneTex.repeat.set(1,1);
  materials.path.map=stoneTex;materials.path.bumpMap=stoneTex;materials.path.bumpScale=.028;materials.path.color.set(0xffffff);
  materials.plaza.map=stoneTex;materials.plaza.bumpMap=stoneTex;materials.plaza.bumpScale=.032;materials.plaza.color.set(0xffffff);
  const roadTex=asphaltMap||texture('asphalt');if(!asphaltMap)roadTex.repeat.set(1,1);
  materials.asphalt.map=roadTex;materials.asphalt.color.set(0xffffff);

  const dashMat=new THREE.MeshStandardMaterial({map:dashMap||null,color:dashMap?0xffffff:0xf0c828,transparent:true,opacity:dashMap?1:.9,depthWrite:false,roughness:.85,side:THREE.DoubleSide});
  const crossMat=new THREE.MeshStandardMaterial({map:crosswalkMap||null,color:crosswalkMap?0xffffff:0xf2f2f6,transparent:true,opacity:crosswalkMap?1:.92,depthWrite:false,roughness:.8,side:THREE.DoubleSide});
  const curbMat=new THREE.MeshStandardMaterial({map:curbMap||null,color:curbMap?0xffffff:0x5ec8d4,transparent:true,opacity:curbMap?1:.45,depthWrite:false,roughness:.55,metalness:.15,side:THREE.DoubleSide,emissive:0x1a6a72,emissiveIntensity:.12});

  // --- Modular tile kits (replaces Tripo plate + pathGroup/roadGroup boxes) ---
  const {kits:tileKits}=buildTileKits(town,materials);

  // Road / path marking overlays (thin planes above asphalt & path).
  const marks=new THREE.Group();marks.name='tile-overlays';town.add(marks);
  // Yellow dashed centre lines on asphalt strips.
  planeOverlay(marks,1.1,42,dashMat,18.5,.055,5);
  planeOverlay(marks,1.1,30,dashMat,-22,.055,6);
  planeOverlay(marks,1.0,44,dashMat,-1,.056,24,Math.PI/2);
  planeOverlay(marks,1.0,34,dashMat,0,.056,-18,Math.PI/2);
  // Zebra crosswalks where roads meet plaza paths.
  planeOverlay(marks,7.5,4.2,crossMat,18.5,.062,6.5,Math.PI/2);
  planeOverlay(marks,7.5,4.2,crossMat,18.5,.062,24,Math.PI/2);
  planeOverlay(marks,7.5,4.2,crossMat,-22,.062,5.2,Math.PI/2);
  planeOverlay(marks,6.5,4.0,crossMat,0,.062,24);
  planeOverlay(marks,6.5,4.0,crossMat,0,.062,-15.5);
  // Restrained cyan curb accents along N-S avenue + cross path edges.
  planeOverlay(marks,0.35,40,curbMat,-3.7,.07,4);
  planeOverlay(marks,0.35,40,curbMat,3.7,.07,4);
  planeOverlay(marks,38,0.35,curbMat,0,.071,4.0);
  planeOverlay(marks,38,0.35,curbMat,0,.071,9.0);

  const est=outerAsset.root;est.name='ECC Campus Hub';est.position.set(0,.12,-11);town.add(est);
  const home=consolidate(studioAsset.scene);home.name='ECC Avatar Studio';home.position.set(-17,0,5);home.rotation.y=-Math.PI/2;home.visible=false;town.add(home);
  const palette=approvedPalette(est);palette.interior=palette.interior.clone();
  for(const [key,material] of Object.entries(palette))material.userData.deferredPalette=key;
  const precinct=arrivalPrecinct(town,stoneTex,sign,palette);
  const legacySign=sign('ORIGINAL CAREER EMPIRE',1.45,'#f2e4bd','#29434a');legacySign.position.set(LEGACY.x,1.3,LEGACY.z);town.add(legacySign);
  const legacyHint=sign('OPEN THE ORIGINAL GAME',1.25,'#e6d9b9','#29434a');legacyHint.position.set(LEGACY.x,.82,LEGACY.z);town.add(legacyHint);
  for(const dx of [-.6,.6])box(town,.07,1.5,.07,basic(0x304c54),LEGACY.x+dx,.75,LEGACY.z-.16);
  const homeSign=sign('AVATAR STUDIO',2.3);homeSign.position.set(-13.25,3.56,5.0);homeSign.rotation.y=Math.PI/2;homeSign.visible=false;town.add(homeSign);
  const inner=new THREE.Group();interior.add(inner);
  let interiorLoad,currentPhase='flourishing';
  function ensureInterior(){
    // The decorative poster must never hold the learning room closed.
    estVideo.ensurePoster().catch(()=>{});
    if(!interiorLoad)interiorLoad=loader.loadAsync('./assets/est-interior.glb').then(asset=>{
      inner.add(consolidate(asset.scene));phase(currentPhase);
    }).catch(error=>{interiorLoad=null;throw error;});
    return interiorLoad;
  }
  const careers=new THREE.Scene();careers.background=interior.background.clone();
  careers.add(new THREE.HemisphereLight(0xe2eeee,0x6c6a55,2.2));
  const careersSun=new THREE.DirectionalLight(0xffe8c7,2);careersSun.position.set(-5,9,6);careers.add(careersSun);
  const careersTitle=sign('CAREERS ADVICE CENTRE',6);careersTitle.position.set(0,5.65,-6.48);careers.add(careersTitle);
  const myLifeDesk={x:3.5,z:1.5};
  const myLifeSign=sign('MY LIFE',1.8);myLifeSign.position.set(myLifeDesk.x,1.65,myLifeDesk.z+.1);careers.add(myLifeSign);
  const shopDesk={x:-3.5,z:1.5};
  const shopSign=sign('SHOP DEMO',1.8);shopSign.position.set(shopDesk.x,1.65,shopDesk.z+.1);careers.add(shopSign);
  const shopHint=sign('$100,000 PRACTICE MONEY',5);shopHint.position.set(0,3.6,-6.48);careers.add(shopHint);
  let careersLoad;
  function ensureCareers(){
    if(!careersLoad)careersLoad=loader.loadAsync('./assets/est-interior.glb').then(asset=>careers.add(consolidate(asset.scene))).catch(error=>{careersLoad=null;throw error;});
    return careersLoad;
  }
  const hallSign=sign('EST PREP',4.0);hallSign.position.set(0,5.65,-6.48);interior.add(hallSign);
  const estVideo=createESTWallVideo(interior);
  const stations=[{id:'content',name:'CORE',x:-3.5,z:1.5,colour:0x2e8481},{id:'glossary',name:'TERM',x:3.5,z:1.5,colour:0x927331},{id:'decoder',name:'VTCS',x:-3.5,z:-3.5,colour:0x466faa},{id:'boss',name:'BOSS',x:3.5,z:-3.5,colour:0x9d5368}];
  for(const s of stations){const plaque=sign(s.name,1.04);plaque.position.set(s.x,1.47,s.z+.10);interior.add(plaque);const light=new THREE.PointLight(s.colour,2,3);light.position.set(s.x,1.7,s.z);interior.add(light);}
  // Stronger daytime sun + hemisphere
  const sun=new THREE.DirectionalLight(0xffe0ac,3.5);sun.position.set(-18,24,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-32;sun.shadow.camera.far=110;sun.shadow.normalBias=.035;town.add(sun);
  town.add(new THREE.HemisphereLight(0xe8f6ff,0x7d9168,1.5));
  town.add(new THREE.AmbientLight(0xddeeff,.35));
  interior.add(new THREE.HemisphereLight(0xe2eeee,0x6c6a55,2.2));
  const innerSun=new THREE.DirectionalLight(0xffe8c7,2);innerSun.position.set(-5,9,6);interior.add(innerSun);
  // Clean upright trees: vertical cylinder trunk + cone crown (no random X/Z tilt).
  const trunkGeo=new THREE.CylinderGeometry(.12,.22,1,8);
  const crownGeo=new THREE.ConeGeometry(1,1.6,8);
  const count=36;
  const trunks=new THREE.InstancedMesh(trunkGeo,materials.trunk,count);
  const crowns=new THREE.InstancedMesh(crownGeo,materials.leaf,count);
  trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;town.add(trunks,crowns);
  // Low planting makes paths feel like a campus precinct before future hero buildings arrive.
  const shrubGeo=new THREE.DodecahedronGeometry(.42,1);
  const shrubMat=basic(0x557f56,.95);
  const shrubSites=[[-10,10],[-8,11],[-6,10],[-10,-4],[-8,-5],[-6,-4],[7,11],[9,10],[11,11],[13,10],[8,-5],[10,-5],[12,-4],[-15,0],[-14,-2],[-13,1],[15,1],[16,0],[15,-2],[-3,20],[3,20],[-4,-15],[4,-15]];
  const shrubs=new THREE.InstancedMesh(shrubGeo,shrubMat,shrubSites.length*3);shrubs.castShadow=shrubs.receiveShadow=true;
  const shrubTransform=new THREE.Object3D();let shrubIndex=0;
  for(const [x,z] of shrubSites.filter(([x,z])=>!(x>-10&&x<-4&&z>3&&z<20)))for(let i=0;i<3;i++){
    const angle=(i*2.17+x)*1.3,offset=.28+i*.16;shrubTransform.position.set(x+Math.cos(angle)*offset,.28,z+Math.sin(angle)*offset);
    const scale=.55+i*.14;shrubTransform.scale.set(scale,.72+scale*.4,scale);shrubTransform.rotation.set(0,angle,0);shrubTransform.updateMatrix();shrubs.setMatrixAt(shrubIndex++,shrubTransform.matrix);
  }
  shrubs.count=shrubIndex;shrubs.instanceMatrix.needsUpdate=true;town.add(shrubs);
  const matrix=new THREE.Object3D(),treePositions=[...precinct.trees];
  const treeBlocked=(x,z)=>{
    // Keep clear of Home Base / Avatar Studio, EST facade, and central plaza pad.
    if(x>-16&&x<1&&z>-4&&z<25)return true;
    if(Math.hypot(x+17,z-5)<7.5)return true;
    if(Math.hypot(x,z+14)<10)return true;
    if(Math.hypot(x,z-4)<11)return true;
    // Keep landscaping clear of the two added campus buildings.
    if(Math.abs(x+12)<3.5&&Math.abs(z-14)<3.5)return true;
    if(Math.abs(x-10)<7&&Math.abs(z-17)<6)return true;
    // Keep clear of asphalt road corridors.
    if(Math.abs(x-18.5)<4&&z>-16&&z<26)return true;
    if(Math.abs(x+22)<4&&z>-10&&z<22)return true;
    return false;
  };
  for(let i=0;i<count;i++){
    let x,z,tries=0;
    do{
      if(i<8){x=(i%2?1:-1)*(13+rand()*3.5);z=-1+Math.floor(i/2)*7.2;}
      else{const a=rand()*Math.PI*2,r=22+rand()*18;x=Math.cos(a)*r;z=Math.sin(a)*r;}
      tries++;
    }while(treeBlocked(x,z)&&tries<40);
    if(treeBlocked(x,z)){x=(i%2?1:-1)*(22+rand()*4);z=16+rand()*6;}
    const trunkH=2.2+rand()*1.4;
    const crownH=2.4+rand()*1.6;
    const crownR=1.05+rand()*.55;
    const yaw=rand()*Math.PI*2;
    treePositions.push({x,z,height:trunkH+crownH*.92,yaw});
    // Trunk: unit-height cylinder scaled to trunkH; base sits on y≈0.
    matrix.position.set(x,trunkH/2,z);
    matrix.scale.set(1,trunkH,1);
    matrix.rotation.set(0,yaw,0);
    matrix.updateMatrix();
    trunks.setMatrixAt(i,matrix.matrix);
    // Cone crown centered above trunk top; upright only (Y rot).
    matrix.position.set(x,trunkH+crownH*0.42,z);
    matrix.scale.set(crownR,crownH/1.6,crownR);
    matrix.rotation.set(0,yaw+rand()*0.6,0);
    matrix.updateMatrix();
    crowns.setMatrixAt(i,matrix.matrix);
  }
  trunks.instanceMatrix.needsUpdate=true;
  crowns.instanceMatrix.needsUpdate=true;
  const garden=new THREE.Group();town.add(garden);
  for(const x of [-4.4,4.4])for(const z of [-7,-3,13]){
    box(garden,1.15,.42,2.2,materials.edge,x,.21,z);
    box(garden,1.0,.05,2.0,basic(0x3e4235),x,.44,z);
  }
  const flowers=new THREE.Group();town.add(flowers);const flowerMats=[basic(0xe7bd57),basic(0xce6889),basic(0xe3e5d9)];
  for(let i=0;i<90;i++){const x=(i%2?1:-1)*(4.15+rand()*.5),z=[-7,-3,13][i%3]+(rand()-.5)*1.8;
    mesh(flowers,new THREE.IcosahedronGeometry(.07,0),flowerMats[i%3],x,.58+rand()*.15,z);
  }
  const planting=new THREE.Group();town.add(planting);
  for(const x of [-4.4,4.4])for(const z of [-7,-3,13])for(let i=0;i<5;i++)mesh(planting,new THREE.ConeGeometry(.14,.28,5),materials.leaf,x+(i%2-.5)*.48,.59,z-.75+i*.35);
  const fountain=new THREE.Group();town.add(fountain);fountain.position.set(0,0,4);
  mesh(fountain,new THREE.CylinderGeometry(1.75,1.85,.4,48),materials.edge,0,.2,0);
  const water=mesh(fountain,new THREE.CylinderGeometry(1.61,1.61,.025,48),materials.water,0,.418,0);
  mesh(fountain,new THREE.CylinderGeometry(.22,.34,1.25,20),materials.edge,0,.9,0);
  mesh(fountain,new THREE.CylinderGeometry(.8,.7,.16,32),materials.edge,0,1.54,0);
  const spray=mesh(fountain,new THREE.CylinderGeometry(.018,.035,1.0,8),new THREE.MeshStandardMaterial({color:0xc2e6e2,transparent:true,opacity:.55}),0,2.1,0);
  const pondMaterial=materials.water.clone();pondMaterial.color.setHex(0x316c72);pondMaterial.roughness=.26;pondMaterial.metalness=.28;const pond=mesh(town,new THREE.CircleGeometry(7.5,96),pondMaterial,23,.045,-10);pond.name='Garden pond rippled water';pond.rotation.x=-Math.PI/2;pond.scale.set(1,.75,1);
  const pondTime={value:0};pondMaterial.onBeforeCompile=s=>{s.uniforms.pondTime=pondTime;
    s.vertexShader='varying vec2 pondUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n pondUv=uv;');
    s.fragmentShader='uniform float pondTime; varying vec2 pondUv;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float pondDepth = 1.0-smoothstep(.30,.5,length(pondUv-.5));
      diffuseColor.rgb *= mix(vec3(1.3,1.5,1.35),vec3(.68,.87,.92),pondDepth);
      diffuseColor.rgb *= 1.0+.012*sin(pondUv.x*143.0+sin(pondUv.y*57.0)*2.0+pondTime*.65)*cos(pondUv.y*97.0-pondTime*.3);`);
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float rippleA=sin(pondUv.x*143.0+sin(pondUv.y*57.0)*2.0+pondTime*.7)*cos(pondUv.y*97.0-pondTime*.3);
      float rippleB=cos(pondUv.y*131.0+sin(pondUv.x*63.0)*1.5-pondTime*.5)*sin(pondUv.x*83.0+pondTime*.4);
      normal=normalize(normal+vec3(.065*rippleA,.045*rippleB,0.0));`);
  };pondMaterial.customProgramCacheKey=()=> 'garden-pond-ripples-v2';
  const bankMaterial=palette.stone.clone();const bank=mesh(town,new THREE.RingGeometry(7.5,7.95,96),bankMaterial,23,.12,-10);bank.name='Garden pond limestone coping';bank.rotation.x=-Math.PI/2;bank.scale.set(1,.75,1);
  const pondWall=mesh(town,new THREE.CylinderGeometry(7.5,7.5,.11,96,1,true),bankMaterial,23,.065,-10);pondWall.scale.z=.75;pondWall.material.side=THREE.DoubleSide;
  // The old freestanding courtyard light assemblies overlapped the Arrival
  // forecourt and produced the reported flickering pole. They are omitted so
  // this area remains an open, stable pedestrian space.
  const lights=[];
  // Retired courtyard benches. These older world-level meshes were separate
  // from the authored courtyard asset and were the final visible seat after
  // the embedded furniture had been removed.
  const wear=new THREE.Group();town.add(wear);
  const crackMat=basic(0x5d6257);
  for(let i=0;i<45;i++){
    const z=-6+rand()*29,x=(rand()-.5)*5.2;
    const crack=box(wear,.025,.007,.3+rand()*.6,crackMat,x,.089,z);crack.rotation.y=rand()*Math.PI;
  }
  const closedWings=new THREE.Group();town.add(closedWings);const boarding=basic(0x626659);
  for(const x of [-6.45,6.45])for(const y of [1.2,1.83,2.42]){const plank=box(closedWings,2.15,.22,.08,boarding,x,y,-10.48);plank.rotation.z=(y===1.83?-.13:.08);}
  for(let i=0;i<18;i++){const x=(i%2?1:-1)*(7.4+rand()*.6),z=-9.7+rand()*.7;const chip=mesh(closedWings,new THREE.DodecahedronGeometry(.07+rand()*.09,0),materials.edge,x,.09,z);chip.scale.set(1.4,.6,1);}
  const restorations=new THREE.Group();town.add(restorations);
  for(const x of [-8.25,8.25]){
    for(const z of [-11,-16])box(restorations,.075,5.7,.075,basic(0x797e73),x,2.85,z);
    for(const y of [1.8,3.6,5.4])box(restorations,.9,.08,5.5,basic(0x9a8b67),x,y,-13.5);
  }
  // Flat walkable ground + building / prop colliders (same bounds as before).
  function addExteriorColliders(world,obstacles){
      for(const b of obstacles){
        if(b.type==='box'){const desc=RAPIER.ColliderDesc.cuboid(b.w/2,1.8,b.d/2).setTranslation(b.x,1.8,b.z-11);if(b.yaw)desc.setRotation({x:0,y:Math.sin(b.yaw/2),z:0,w:Math.cos(b.yaw/2)});world.createCollider(desc);}
        if(b.type==='circle')world.createCollider(RAPIER.ColliderDesc.cylinder(2,b.r).setTranslation(b.x,2,b.z-11));
        if(b.type==='chapel'){
          // Full exterior wall collision, preserving the recessed doorway but not opening an unfinished interior.
          for(let i=0;i<64;i++){const angle=i*Math.PI*2/64-Math.PI;if(Math.abs(angle-b.doorAngle)<b.doorHalf)continue;const x=b.x+Math.sin(angle)*(b.r-.1),z=b.z-11+Math.cos(angle)*(b.r-.1);world.createCollider(RAPIER.ColliderDesc.cuboid(.19,2.2,.14).setTranslation(x,2.2,z).setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)}));}
          world.createCollider(RAPIER.ColliderDesc.cylinder(2.2,b.r-.65).setTranslation(b.x,2.2,b.z-11));
        }
      }
  }
  // Use the rendered path triangles, including parent transforms, as the
  // walking surface. Previously these 7.5–19.5cm rises had no collider.
  const walkingSurfaces=new WeakSet();
  function addWalkingSurfaces(root){
    root.updateWorldMatrix(true,true);
    root.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.userData.walkable||walkingSurfaces.has(mesh))return;
      const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      const vertices=new Float32Array(geometry.attributes.position.array);
      const indices=geometry.index?new Uint32Array(geometry.index.array):Uint32Array.from({length:vertices.length/3},(_,i)=>i);
      townPhysics.world.createCollider(RAPIER.ColliderDesc.trimesh(vertices,indices));townPhysics.groundedRest=false;
      walkingSurfaces.add(mesh);geometry.dispose();
    });
  }
  function loadExterior(){
    if(!exteriorLoad)exteriorLoad=buildExterior({inGame:true,textures}).then(asset=>{
      addExteriorColliders(townPhysics.world,asset.obstacles);
      outerAsset.root.add(asset.root);outerAsset.obstacles=asset.obstacles;outerAsset.loadDetail=asset.loadDetail;addWalkingSurfaces(asset.root);
      // Arrival materials and their clones retain identity while receiving the
      // accepted courtyard artwork; later buildings use this same palette.
      const ready=approvedPalette(est),seen=new Set();
      function hydrate(material){
        const key=material.userData.deferredPalette;if(!key||seen.has(material))return;
        seen.add(material);const side=material.side;
        material.copy(ready[key]);if(key==='glass'&&material!==palette[key])material.side=side;material.onBeforeCompile=ready[key].onBeforeCompile;
        material.customProgramCacheKey=ready[key].customProgramCacheKey;material.needsUpdate=true;
      }
      town.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))hydrate(m);});
      Object.values(palette).forEach(hydrate);
    }).catch(error=>{exteriorLoad=null;throw error;});
    return exteriorLoad;
  }
  function physics(inside){
    const world=new RAPIER.World({x:0,y:-9.81,z:0});
    const block=(x,y,z,w,h,d)=>world.createCollider(RAPIER.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z));
    if(inside)block(0,-.1,0,120,.2,120);
    else block(6,-.1,-20,92,.2,116); // Match the continued grass footprint.
    if(inside===true){block(-7.3,3,0,.35,6,14);block(7.3,3,0,.35,6,14);block(0,3,-7,15,6,.35);block(0,3,7.3,15,6,.35);
      for(const s of stations)block(s.x,.65,s.z,2.35,1.3,1.1);
    }else if(!inside){
      block(0,.08,-7.6,19,.16,19);
      block(-17,2,5,7.2,4,6.2);
      block(LEGACY.x,1,LEGACY.z,2.5,2,.18);
      for(const b of precinct.colliders)block(...b);
      world.createCollider(RAPIER.ColliderDesc.cylinder(.45,1.8).setTranslation(0,.45,4));
      world.createCollider(RAPIER.ColliderDesc.cylinder(2,7.4).setTranslation(23,1,-10));
    }
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,inside?.8:.9,inside?5:17));
    const collider=world.createCollider(RAPIER.ColliderDesc.capsule(.56,.20),body);
    const controller=world.createCharacterController(.025);controller.enableAutostep(.52,.16,true);controller.enableSnapToGround(.38);controller.setSlideEnabled(true);
    return {world,body,collider,controller,block,verticalVelocity:0};
  }
  const townPhysics=physics(false),interiorPhysics=physics(true),chapelPhysics=physics('chapel');
  const chapel=new THREE.Scene();chapel.background=new THREE.Color(0xe8e0d1);let chapelLoad;
  function ensureChapel(){if(!chapelLoad)chapelLoad=buildChapel(chapel,chapelPhysics).catch(error=>{chapelLoad=null;throw error;});return chapelLoad;}
  const physical=inside=>inside==='chapel'?chapelPhysics:inside?interiorPhysics:townPhysics;
  function phase(name){
    const p=PHASES[name];if(!p)throw new Error('Unknown world phase');currentPhase=name;
    const tint=TILE_TINTS[name]||TILE_TINTS.flourishing;
    // Swap tile-kit material tints (maps stay; colour multiply drives phase mood).
    materials.grass.color.set(tint.grass);
    materials.path.color.set(tint.path);
    materials.asphalt.color.set(tint.asphalt);
    materials.plaza.color.set(tint.plaza);
    curbMat.color.set(tint.curb);
    curbMat.emissiveIntensity=name==='flourishing'?.12:name==='growth'?.06:0;
    materials.leaf.color.set(p.leaf);
    for(const root of [est,home,inner])root.traverse(o=>{if(!o.isMesh)return;const m=o.material;const key=m.name.replace(/\.\d+$/,'');
      if(key==='Stone'){m.color.set(p.stone);m.roughness=name==='disrepair'?.99:.83;}if(key==='Trim')m.color.set(p.trim);if(key==='Roof')m.color.set(p.roof);if(key==='Glass'){m.color.set(p.glass);m.roughness=name==='disrepair'?.7:name==='growth'?.35:.2;}
      if(key==='Light')m.emissiveIntensity=p.light;if(key==='Warm')m.emissiveIntensity=p.light*.6;
    });
    importedTrees?.phase(name);
    lights.forEach((m,i)=>m.emissiveIntensity=name==='disrepair'?(i<2?.15:0):p.light);
    flowers.visible=false;flowers.children.forEach((o,i)=>o.visible=name==='flourishing'||i%3===0);planting.visible=false;closedWings.visible=false;
    water.visible=name!=='disrepair';spray.visible=name==='flourishing';wear.visible=false;restorations.visible=false;
  }
  const scenery={status:'pending',trees:0,home:false,buildings:0,errors:[]};
  let importedTrees,importedModern,importedFuture,sceneryLoad,landscapeLoad;
  const entryPlantingRoots=new Set();
  function loadBuildingExteriors(){return buildingExteriorsLoad||=(loadExterior().then(()=>createCampusBuildingExteriors(town,townPhysics,palette,textures)).then(group=>{addWalkingSurfaces(group);return group;}).catch(error=>{buildingExteriorsLoad=null;throw error;}));}
  function loadLandscape(){
    return landscapeLoad||=loadBuildingExteriors().then(()=>createCampusLandscape(town,townPhysics,palette,undefined,textures)).then(result=>{addWalkingSurfaces(result.group);Object.assign(campus,result);scenery.trees=result.placements.filter(p=>p.id.includes('eucalypt')||p.id.includes('multistem')).length;scenery.buildings=2;return result.group;}).catch(error=>{landscapeLoad=null;scenery.errors.push('Campus: '+error.message);throw error;});
  }
  const pendingDetailRoots=new Set();
  function loadScenery({deferReveal=false}={}){
    if(sceneryLoad)return sceneryLoad;
    scenery.status='loading';scenery.errors=[];
    const holdDetail=root=>{root.visible=entryPlantingRoots.has(root)||!deferReveal;pendingDetailRoots.add(root);return root;};
    const trees=Promise.all([precinct.loadDetail().then(holdDetail),loadExterior().then(()=>outerAsset.loadDetail()).then(holdDetail)]);
    // Avatar Studio is now a native campus building, so the old generic city model is retired.
    const building=Promise.resolve().then(()=>{scenery.home=true;});
    const district=loadLandscape().then(holdDetail);
    sceneryLoad=Promise.all([loadExterior(),trees,building,district]).then(()=>{scenery.status='landscape-ready';}).catch(error=>{scenery.status='fallback';sceneryLoad=null;throw error;});
    return sceneryLoad;
  }
  let buildingExteriorsLoad;
  const campus={buildings:[],placements:[],colliders:0};
  phase('flourishing');
  function landing(point){
    const p=townPhysics,footprints=[];
    town.traverse(o=>{const b=o.userData.campusBuilding;if(b)footprints.push({minX:b.x-b.width/2-.4,maxX:b.x+b.width/2+.4,minZ:b.z-b.depth/2-.4,maxZ:b.z+b.depth/2+.4});});
    for(const name of ['Market courtyard dressed exterior','English and Media — curved glazed frontage','SPACE reference-led exterior']){
      const root=town.getObjectByName(name);if(root){const box=new THREE.Box3().setFromObject(root);footprints.push({minX:box.min.x-.3,maxX:box.max.x+.3,minZ:box.min.z-.3,maxZ:box.max.z+.3});}
    }
    const excluded=(x,z)=>footprints.some(b=>x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ)||(outerAsset.obstacles||[]).some(b=>b.type==='box'?Math.abs(x-b.x)<b.w/2+.35&&Math.abs(z-(b.z-11))<b.d/2+.35:Math.hypot(x-b.x,z-(b.z-11))<(b.r||0)+.35);
    p.world.step();
    const probe=(x,z)=>{
      const hit=p.world.castRayAndGetNormal(new RAPIER.Ray({x,y:.65,z},{x:0,y:-1,z:0}),.8,true,undefined,undefined,p.collider,p.body);
      if(!hit||hit.normal.y<.9)return null;const y=.65-hit.timeOfImpact;
      const occupied=p.world.intersectionWithShape({x,y:y+.82,z},{x:0,y:0,z:0,w:1},new RAPIER.Capsule(.56,.2),undefined,undefined,p.collider,p.body);
      return occupied?null:y;
    };
    return findSafeLanding(point,probe,{excluded});
  }
  for(const o of [trunks,crowns,shrubs,garden,flowers,planting,marks,wear])o.visible=false;
  let arrivalOnly=true;
  return {findLanding:landing,revealCampusDetail(){for(const root of pendingDetailRoots)root.visible=true;},loadBuildingExteriors,syncWalkingSurfaces:()=>addWalkingSurfaces(town),loadMuralTexture:()=>textures.startMatching(url=>url.includes('media-mural-sharp')),get muralReady(){let ready=false;town.getObjectByName('Campus teaching building exteriors')?.traverse(mesh=>{if(mesh.isMesh&&mesh.material.name==='Media mural original artwork')ready=Boolean(mesh.material.map.image?.width>1&&mesh.material.userData.artworkDrawn);});return ready;},campusGrass:materials.grass,campusPalette:palette,campusTextures:textures,loadEntry:async()=>{await loadExterior();createCampusPaths(town,palette);const roots=await Promise.all([precinct.loadDetail(),outerAsset.loadDetail(),loadLandscape()]);for(const root of roots){entryPlantingRoots.add(root);root.visible=true;}addWalkingSurfaces(town);},retryDetailTextures:()=>textures.retry(),get failedSurfaceDetails(){return textures.failed;},loadDetailTextures:async()=>{await loadExterior();return textures.start();},openCampus(){arrivalOnly=false;},get arrivalOnly(){return arrivalOnly;},careers,ensureCareers,shopDesk,myLifeDesk,estVideo,chapel,ensureChapel,chapelPhysics,campus,loadScenery,scenery,ensureInterior,town,interior,townPhysics,interiorPhysics,est,stations,phase,
    tileKits:{grass:tileKits.grass.count,path:tileKits.path.count,asphalt:tileKits.asphalt.count,plaza:tileKits.plaza.count},
    get pendingSurfaceDetails(){return textures.pending;},
    plazaTextures:{grass:!!grassMap,stone:!!stoneMap,asphalt:!!asphaltMap,dash:!!dashMap,crosswalk:!!crosswalkMap,curb:!!curbMap},
    update(time,camera){pondTime.value=time;if(importedTrees&&camera){importedTrees.update(time,camera);trunks.visible=crowns.visible=false;scenery.lod=importedTrees.stats();}if(spray.visible)spray.scale.y=1+Math.sin(time*3)*.075;materials.water.roughness=.2+Math.sin(time*.8)*.025;},
    move(inside,delta){const physics=physical(inside);
      // Static campus surfaces need no new downward contact solve at rest.
      // Re-solving triangle contacts with zero travel creates tiny alternating
      // corrections, visibly jittering the pose and invalidating every shadow.
      // Keep the shared physics world advancing NPC bodies while the player rests.
      // Keep gravity for airborne players and all collision solves for travel.
      if(physics.groundedRest&&delta.x===0&&delta.z===0&&physics.controller.computedGrounded()){physics.world.step();const p=physics.body.translation();return {x:p.x,y:p.y-.785,z:p.z};}
      physics.groundedRest=false;physics.verticalVelocity=physics.controller.computedGrounded()?-.1:Math.max(-12,physics.verticalVelocity-9.81/60);physics.controller.computeColliderMovement(physics.collider,{x:delta.x,y:physics.verticalVelocity/60,z:delta.z});const movement=physics.controller.computedMovement(),p=physics.body.translation();const next={x:p.x+movement.x,y:p.y+movement.y,z:p.z+movement.z};
      if(!inside&&arrivalOnly){next.x=Math.max(-13,Math.min(-5.2,next.x));next.z=Math.max(3.5,Math.min(29,next.z));}
      next.x=Math.max(inside==='chapel'?-10.5:inside?-6.9:-38,Math.min(inside==='chapel'?10.5:inside?6.9:50,next.x));next.z=Math.max(inside==='chapel'?-8.3:inside?-6.8:-76,Math.min(inside==='chapel'?8.3:inside?6.9:36,next.z));physics.body.setNextKinematicTranslation(next);physics.world.step();physics.groundedRest=delta.x===0&&delta.z===0&&physics.controller.computedGrounded();return {x:next.x,y:next.y-.785,z:next.z};},
    protectCamera(inside,position,target){
      const physics=physical(inside),origin={x:position.x,y:position.y+1.35,z:position.z};
      const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z,length=Math.hypot(dx,dy,dz);
      if(length<.01)return;
      const direction={x:dx/length,y:dy/length,z:dz/length};
      const hit=physics.world.castRay(new RAPIER.Ray(origin,direction),length,true,undefined,undefined,physics.collider,physics.body);
      if(hit){const distance=Math.max(.05,hit.timeOfImpact-.3);target.set(origin.x+direction.x*distance,origin.y+direction.y*distance,origin.z+direction.z*distance);}
    },
    position(inside){const p=physical(inside).body.translation();return new THREE.Vector3(p.x,p.y-.785,p.z);},
    teleport(inside,x,z,feetY){const p=physical(inside);p.groundedRest=false;p.verticalVelocity=0;const y=Number.isFinite(feetY)?feetY+.785:inside?.8:.9;p.body.setTranslation({x,y,z},true);p.body.setNextKinematicTranslation({x,y,z});p.world.step();}
  };
}
