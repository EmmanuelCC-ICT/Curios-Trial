import * as THREE from 'three';

// Choose once at startup, so rotating a phone does not load a second asset set.
// Original desktop assets and all scene/physics placement remain unchanged.
const variants = {
  "ecc-preview/assets/courtyard/sandstone-diffuse.jpg": "assets/phone/19ddc20ded77.webp",
  "ecc-preview/assets/courtyard/sandstone-normal.jpg": "assets/phone/df2ca8fa1a9c.webp",
  "ecc-preview/assets/authored-courtyard/stone-surface-diffuse.webp": "assets/phone/dc020861de72.webp",
  "ecc-preview/assets/authored-courtyard/stone-surface-normal.webp": "assets/phone/e774700facce.webp",
  "ecc-preview/assets/authored-courtyard/stone-surface-arm.webp": "assets/phone/c05044c0f2de.webp",
  "assets/plaza/asphalt_day-lossless.webp": "assets/phone/3da032fd878b.webp",
  "assets/plaza/limestone-ecc-campus-v1.png": "assets/phone/1e50592a6a2b.webp",
  "assets/plaza/grass-ecc-campus-v1-lossless.webp": "assets/phone/grass-ecc-campus-v1-mobile.webp",
  "ecc-preview/assets/authored-courtyard/chapel-etched-glass-v2-lossless.webp": "assets/phone/7ad34dc0006b.webp",
  "ecc-preview/assets/authored-courtyard/reception-backwall.jpg": "assets/phone/reception-backwall-mobile.webp",
  "ecc-preview/assets/admin-signage/cleaned-ecc-crest-source-lossless.webp": "assets/phone/a8fd2904ee35.webp",
  "assets/campus-buildings/shared-textures/29647e2a40f3b3a4.png": "assets/phone/15d504f1b759.webp",
  "assets/campus-buildings/shared-textures/558d18f44b61d6b0.png": "assets/phone/9714666c1516.webp",
  "assets/campus-buildings/shared-textures/40936ed06fce1aa6.png": "assets/phone/ffc6ab32527d.webp",
  "assets/campus-buildings/shared-textures/4d90a7d0781d8038.png": "assets/phone/a6b40b7146e4.webp",
  "assets/campus-buildings/shared-textures/27ad0876b9c36991.png": "assets/phone/78bc376d38e6.webp",
  "assets/campus-buildings/shared-textures/8d713e300bba6882.png": "assets/phone/b3b814172ff1.webp",
  "environment/assets/SPACE-reference.jpg": "assets/phone/cac32030d7a8.webp",
  "assets/campus-landscape/mature-eucalypt-a-packed.glb": "assets/phone/mature-eucalypt-a-mobile.glb",
  "assets/campus-landscape/mature-eucalypt-b-packed.glb": "assets/phone/mature-eucalypt-b-mobile.glb",
  "assets/campus-landscape/small-multistem-a-packed.glb": "assets/phone/small-multistem-a-mobile.glb",
  "assets/player-schoolboy-2k-20260914.glb": "assets/phone/player-schoolboy-2k-20260914-mobile.glb",
  "assets/campus-landscape/boulder-a.glb": "assets/phone/boulder-a-mobile.glb",
  "ecc-preview/assets/authored-courtyard/garden-reflections.hdr": "assets/phone/garden-reflections-mobile.hdr",
  "assets/campus-buildings/careers-shared-textures.glb": "assets/phone/careers-mobile.glb",
  "assets/campus-buildings/workplace-shared-textures.glb": "assets/phone/workplace-mobile.glb"
};
export function configurePhoneAssets(){
 const phone=matchMedia('(pointer: coarse)').matches && Math.min(innerWidth,innerHeight)<=620;
 if(!phone)return;
 const base=new URL('./',import.meta.url);
 THREE.DefaultLoadingManager.setURLModifier(value=>{
  const url=new URL(value,base);
  if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return value;
  const variant=variants[url.pathname.slice(base.pathname.length)];
  return variant?new URL(variant,base).href:value;
 });
}
