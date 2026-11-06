import {wholeAvatar} from './whole-avatar-catalog.mjs?v=named-students-20261011';
import {selectAvatarClips} from './avatar-clips.mjs?v=named-students-20261011';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {downloadAvatar} from './avatar-download.js?v=entry-load-20260921';
import {SKIN} from './profiles.js?v=test-characters-20261013';

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('./vendor/draco/');
loader.setDRACOLoader(draco);
const kits = {};
const kitUsers=new Map();
function retainKit(body){kitUsers.set(body,(kitUsers.get(body)||0)+1);}
function releaseKit(body){
 const count=(kitUsers.get(body)||1)-1;kitUsers.set(body,count);
 if(count || !wholeAvatar(body))return;
 // Save starts actor replacement asynchronously and then removes the preview.
 // Give that same loaded kit a turn to acquire its new owner before eviction.
 setTimeout(()=>{
  if(kitUsers.get(body))return;
  const kit=kits[body];if(!kit)return;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  kit.scene.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of (Array.isArray(n.material)?n.material:[n.material]))if(m)materials.add(m);});
  for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);
  for(const item of [...geometries,...materials,...textures])item.dispose();
  delete kits[body];kitLoads.delete(body);kitUsers.delete(body);
 },0);
}
// Approved wardrobe assets are the production defaults on every entry route.
const TARGET_HEIGHT = 1.7;
const SIMPLE_BODIES = new Set(['tripo','shirt','schoolboy','jackettest','pantstest']);

function normalizeHeight(model, bodyOnly = false) {
  model.updateMatrixWorld(true);
  model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.update(); });
  const bounds = () => {
    if(!bodyOnly)return new THREE.Box3().setFromObject(model,true);
    const box=new THREE.Box3();
    model.traverse(n=>{if(n.isMesh&&!n.userData.clothingSlot)box.union(new THREE.Box3().setFromObject(n,true));});
    return box;
  };
  const box = bounds();
  const size = box.getSize(new THREE.Vector3());
  const scale = TARGET_HEIGHT / Math.max(size.y, 0.001);
  model.scale.multiplyScalar(scale);
  model.updateMatrixWorld(true);
  model.traverse(node => { if (node.isSkinnedMesh) node.skeleton.update(); });
  box.copy(bounds());
  model.position.y -= box.min.y;
  return scale;
}

function bindClips(model, animations, walkSpeed = 1.8) {
  const mixer = new THREE.AnimationMixer(model);
  const clips = {};
  const selected=selectAvatarClips(animations);
  for (const [name,clip] of Object.entries(selected)) if(clip) clips[name]=mixer.clipAction(clip);
  if (!clips.idle && clips.walk) {
    const walk = selected.walk;
    const tracks = walk.tracks.map(track => new track.constructor(
      track.name, [0], Array.from(track.values.slice(0, track.getValueSize()))
    ));
    clips.idle = mixer.clipAction(new THREE.AnimationClip('idle', 1, tracks));
  }
  if (clips.idle) clips.idle.play();
  let motion = 'idle';
  let gaitSpeed = walkSpeed;
  return {
    mixer,
    clips,
    setWalking(value, speed = 2.8) {
      gaitSpeed = walkSpeed * Math.max(0, speed) / 2.8;
      const next = value ? 'walk' : 'idle';
      if (motion === next) return;
      clips[next]?.reset().fadeIn(0.18).play();
      clips[motion]?.fadeOut(0.18);
      motion = next;
    },
    update(dt) {
      // Only the walk action changes rate; fades and idle retain real-time timing.
      clips.walk?.setEffectiveTimeScale(gaitSpeed);
      mixer.update(dt);
    },
    disposeMixer() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
  };
}

const kitLoads = new Map();
export const hasCharacterKit = body => Boolean(kits[body]);
export function loadCharacterKit(body) {
  if (!wholeAvatar(body) && !['a', 'b', ...SIMPLE_BODIES].includes(body)) return Promise.reject(new Error('Unknown avatar body'));
  if (!kitLoads.has(body)) {
    const url = wholeAvatar(body)?.model || (body === 'pantstest' ? './assets/studio-walking-base.glb'
      : body === 'jackettest' ? './assets/player-jacket-test-20260909.glb'
      : body === 'tripo' ? './assets/player-tripo-20260908.glb'
      : body === 'shirt' ? './assets/player-uniform-shirt-20260908.glb'
      : body === 'schoolboy' ? './assets/player-schoolboy-2k-20260914.glb'
      : `./assets/avatar-${body}.glb`);
    kitLoads.set(body, downloadAvatar(loader.manager.resolveURL(url)).then(data => loader.parseAsync(data, new URL('./assets/', location.href).href)).then(async kit => {
      if (body === 'jackettest') {
        const source = kit.animations[0];
        if (!source) throw new Error('Jacket test animation is missing');
        // Exported frame 1 starts at t=0. Keep stress poses out of the walk.
        const walk = THREE.AnimationUtils.subclip(source, 'walk', 89, 149, 30);
        const tracks = source.tracks.map(track => new track.constructor(
          track.name, [0], Array.from(track.values.slice(0, track.getValueSize()))
        ));
        kit.animations = [new THREE.AnimationClip('idle', 1, tracks), walk];
      }
      return (kits[body] = kit);
    }).catch(error => {
      kitLoads.delete(body); // A failed download can be retried from the picker.
      throw error;
    }));
  }
  return kitLoads.get(body);
}

// Each selected garment is fetched once; failed requests can be retried.
// The source rig and full canonical body are retained for every combination.
const wardrobeLoads = new Map();
async function loadWardrobeItem(kit, slot, style, filename) {
  const key=slot+':'+style;
  if(!wardrobeLoads.has(key)) {
    const version=['hair','shoes'].includes(slot)?'hair-shoes-20260921':'dressups-entry-20260921';
    const request=downloadAvatar(loader.manager.resolveURL('./assets/'+filename+'?v='+version))
      .then(data=>loader.parseAsync(data,new URL('./assets/',location.href).href))
      .then(garment=>{
        const baseBones=new Map();kit.scene.traverse(n=>{if(n.isBone)baseBones.set(n.name,n);});
        kit.scene.updateMatrixWorld(true);garment.scene.updateMatrixWorld(true);
        const meshes=[];garment.scene.traverse(n=>{if(n.isSkinnedMesh)meshes.push(n);});
        if(!meshes.length)throw new Error('Wardrobe asset has no fitted meshes');
        const bindings=meshes.map(mesh=>({mesh,bones:mesh.skeleton.bones.map(b=>{
          const target=baseBones.get(b.name);if(!target)throw new Error('Missing wardrobe bone '+b.name);return target;
        })}));
        for(const {mesh,bones} of bindings){
          const skeleton=new THREE.Skeleton(bones,mesh.skeleton.boneInverses.map(m=>m.clone()));
          const bind=mesh.bindMatrix.clone();kit.scene.attach(mesh);mesh.bind(skeleton,bind);
          mesh.userData.clothingSlot=slot;
          mesh.userData.itemStyle=style;
          if(slot==='pants')mesh.userData.pantsStyle=style;
          if(slot==='workTop')mesh.userData.topStyle=style;
        }
      }).catch(error=>{wardrobeLoads.delete(key);throw error;});
    wardrobeLoads.set(key,request);
  }
  return wardrobeLoads.get(key);
}
export async function loadProfileKit(profile,onBaseReady) {
  const kit=await loadCharacterKit(profile.body);
  onBaseReady?.();
  if(profile.body!=='pantstest')return kit;
  const pending=[];
  if(profile.hairStyle && profile.hairStyle!=='none')pending.push(loadWardrobeItem(kit,'hair',profile.hairStyle,'hair-'+profile.hairStyle+'.glb'));
  if(profile.shoeStyle && profile.shoeStyle!=='none')pending.push(loadWardrobeItem(kit,'shoes',profile.shoeStyle,'shoes-'+profile.shoeStyle+'.glb'));
  if(profile.outer!=='none')pending.push(loadWardrobeItem(kit,'pants',profile.pantsStyle,'occupational-pants-'+profile.pantsStyle+'.glb'));
  if(profile.workTop!=='none'){
    const filename=profile.workTop==='scrubs'?'hospital-scrub-top.glb':'occupational-top-'+profile.workTop+'.glb';
    pending.push(loadWardrobeItem(kit,'workTop',profile.workTop,filename));
    pending.push(loadWardrobeItem(kit,'necklineSkin','skin','neckline-skin.glb'));
  }
  await Promise.all(pending);return kit;
}

function createModularCharacter(profile) {
  const kit = kits[profile.body];
  const model = clone(kit.scene);
  const materialCopies = new Map();
  const materialSlots = {
    Skin: 'skin', Hair: 'hair', Eye: 'eye', Top: 'top', Bottom: 'bottom',
    Outer: 'outer', Jumper: 'jumper', Shoe: 'shoes'
  };
  model.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = node.userData.clothingSlot !== 'necklineSkin';
    node.receiveShadow = true;
    const copy = source => {
      if (!materialCopies.has(source)) materialCopies.set(source, source.clone());
      const m = materialCopies.get(source);
      const semantic = m.name.replace(/\.\d+$/, '');
      const key = materialSlots[semantic];
      if (key) m.color.set(key === 'skin' ? SKIN[profile.skin] : profile.colours[key]);
      return m;
    };
    node.material = Array.isArray(node.material) ? node.material.map(copy) : copy(node.material);
    const {slot, variant} = node.userData;
    if (slot === 'hair') node.visible = variant === profile.hair;
    if (slot === 'top') node.visible = variant === profile.top;
    if (slot === 'bottom') node.visible = variant === profile.bottom;
    if (slot === 'outer') node.visible = variant === profile.outer;
    if (slot === 'accessory') node.visible = variant === profile.accessory;
    if (slot === 'jumper') node.visible = profile.jumper;
    const coveredSleeve = /^Sleeve/.test(node.name) && ['blazer', 'labcoat'].includes(profile.outer);
    if (coveredSleeve && (slot === 'top' || slot === 'jumper')) node.visible = false;
    if (slot === 'top' && /^Sleeve/.test(node.name) && profile.jumper) node.visible = false;
    if (/^Leg(?:[._\d]|$)/.test(node.name) && profile.bottom !== 'skirt') node.visible = false;
  });
  const head = model.getObjectByName('head');
  if (head) {
    head.scale.set(
      profile.face === 'round' ? 1.08 : profile.face === 'defined' ? 0.94 : 1,
      profile.face === 'defined' ? 1.025 : 1,
      1
    );
  }
  const anim = bindClips(model, kit.animations);
  return {
    model,
    mixer: anim.mixer,
    profile,
    clips: anim.clips,
    simple: false,
    setWalking: anim.setWalking,
    update: anim.update,
    dispose() {
      anim.disposeMixer();
      for (const m of materialCopies.values()) m.dispose();
      model.removeFromParent();
    }
  };
}

/** Reference players using their original walk rig. */
function createSimpleTripoCharacter(profile) {
  const kit = kits[profile.body];
  const model = clone(kit.scene);
  const materialCopies = new Map();
  // The intact schoolboy export keeps its authored textures and normal map.
  // Forearm twist is repaired in the asset; no global material override needed.
  model.traverse(node => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  const anim = bindClips(model, kit.animations || [], ['jackettest','pantstest'].includes(profile.body) ? 1 : 1.8);
  anim.mixer.update(0);
  normalizeHeight(model,profile.body==='pantstest');
  // Normalize the complete outfit first so jacket-off never changes avatar size.
  if (profile.body === 'jackettest') model.traverse(node => {
    if (node.isMesh && node.userData.clothingSlot === 'jacket') node.visible = profile.outer !== 'none';
  });
  if(profile.body==='pantstest')model.traverse(n=>{
    if(n.userData.clothingSlot!=='pants')return;
    n.visible=profile.outer!=='none'&&n.userData.pantsStyle===profile.pantsStyle;
    const tint=source=>{
      if(!materialCopies.has(source)){
        const material=source.clone();
        if(/^Pants_(Cloth|Trim|Contrast|Press)(?:\.|$)/.test(material.name)){
          material.color.set(profile.pantsColours[profile.pantsStyle]);
          if(/^Pants_Trim/.test(material.name))material.color.multiplyScalar(n.userData.pantsStyle==='scrubs' ? .92 : .74);
          if(/^Pants_Contrast/.test(material.name))material.color.multiplyScalar(.48);
          if(/^Pants_Press/.test(material.name))material.color.multiplyScalar(1.10);
        }
        if(/^Pants_Check(?:\.|$)/.test(material.name) && material.map){
          const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
          const ctx=canvas.getContext('2d');
          ctx.fillStyle='#F0EDE3';ctx.fillRect(0,0,64,64);
          ctx.fillStyle=profile.pantsColours.chef;ctx.fillRect(0,0,32,32);ctx.fillRect(32,32,32,32);
          const texture=new THREE.CanvasTexture(canvas);texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
          material.map=texture;material.color.set(0xffffff);material.userData.ownedCheckTexture=true;
        }
        materialCopies.set(source,material);
      }
      return materialCopies.get(source);
    };
    n.material=Array.isArray(n.material)?n.material.map(tint):tint(n.material);
  });
  if(profile.body==='pantstest')model.traverse(n=>{
    if(n.userData.clothingSlot!=='workTop')return;
    n.visible=profile.workTop===n.userData.topStyle;
    const tint=source=>{
      if(!materialCopies.has(source)){
        const material=source.clone();
        if(/^Scrub_(Cloth|Trim|Stitch)(?:\.|$)/.test(material.name)){
          material.color.set(profile.topColours[n.userData.topStyle] || profile.topColour);
          if(/^Scrub_Trim/.test(material.name))material.color.multiplyScalar(.92);
          if(/^Scrub_Stitch/.test(material.name))material.color.multiplyScalar(.82);
        }
        if(/^Top_Cloth_/.test(material.name)){material.side=THREE.FrontSide;material.shadowSide=THREE.FrontSide;}
        if(/^Top_(Cloth|Trim|Seam|Contrast)_/.test(material.name)){
          material.color.set(profile.topColours[n.userData.topStyle] || profile.topColour);
          if(/^Top_Trim_/.test(material.name))material.color.multiplyScalar(.90);
          if(/^Top_Seam_/.test(material.name))material.color.multiplyScalar(.76);
          if(/^Top_Contrast_/.test(material.name))material.color.multiplyScalar(.48);
        }
        materialCopies.set(source,material);
      }
      return materialCopies.get(source);
    };
    n.material=Array.isArray(n.material)?n.material.map(tint):tint(n.material);
  });
  if(profile.body==='pantstest')model.traverse(n=>{
    if(n.userData.clothingSlot==='necklineSkin')n.visible=profile.workTop!=='none';
    const slot=n.userData.clothingSlot;
    if(!n.isMesh || !['hair','shoes'].includes(slot))return;
    const style=n.userData.itemStyle,selected=slot==='hair'?profile.hairStyle:profile.shoeStyle;
    n.visible=selected===style;
    const tint=source=>{
      if(!materialCopies.has(source)){
        const material=source.clone();
        if(/^(Hair|Shoe)_(Main|Trim|Shadow)(?:\.|$)/.test(material.name)){
          material.color.set((slot==='hair'?profile.hairColours:profile.shoeColours)[style]);
          if(/_Trim/.test(material.name))material.color.multiplyScalar(.8);
          if(/_Shadow/.test(material.name))material.color.multiplyScalar(.55);
        }
        materialCopies.set(source,material);
      }
      return materialCopies.get(source);
    };
    n.material=Array.isArray(n.material)?n.material.map(tint):tint(n.material);
  });
  // Sole clearance is a translation, never a change to the canonical proportions.
  if(profile.body==='pantstest' && profile.shoeStyle && profile.shoeStyle!=='none')model.position.y+=.009;
  retainKit(profile.body);
  let disposed=false;
  const positioned = new THREE.Group();
  positioned.add(model);
  return {
    model: positioned,
    mixer: anim.mixer,
    profile,
    clips: anim.clips,
    simple: true,
    setWalking: anim.setWalking,
    update: anim.update,
    dispose() {
      if(disposed)return;disposed=true;
      anim.disposeMixer();
      if(wholeAvatar(profile.body)){
        const skeletons=new Set();model.traverse(n=>{if(n.isSkinnedMesh)skeletons.add(n.skeleton);});
        for(const skeleton of skeletons)skeleton.dispose();
      }
      for (const material of materialCopies.values()) {
        if(material.userData.ownedCheckTexture)material.map?.dispose();
        material.dispose();
      }
      positioned.removeFromParent();
      releaseKit(profile.body);
    }
  };
}

export function createCharacter(profile) {
  if (isSimpleBody(profile.body)) return createSimpleTripoCharacter(profile);
  return createModularCharacter(profile);
}

export function isSimpleBody(body) {
  return Boolean(wholeAvatar(body)) || SIMPLE_BODIES.has(body);
}

// Temporary, download-free stand-in. Never write this choice into the profile.
export function createFallbackCharacter() {
  const model=new THREE.Group();model.name='Temporary avatar';model.userData.fallback=true;
  const material=new THREE.MeshStandardMaterial({color:0x397d88,roughness:.9});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.77,4,8),material);body.position.y=.69;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),material);head.position.y=1.43;
  model.add(body,head);let walking=false,time=0;
  return {model,clips:{},setWalking(value){walking=value;},update(dt){time+=dt;body.rotation.z=walking?Math.sin(time*10)*.04:0;},dispose(){model.removeFromParent();body.geometry.dispose();head.geometry.dispose();material.dispose();}};
}
