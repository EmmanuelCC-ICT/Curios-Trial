import * as T from 'three';
import {batchStatic} from './static-batching.js?v=ecc-ba60122';

// Reuse the exact accepted courtyard maps and HDR; no second texture download.
export function approvedPalette(courtyard){
 let interior;const found=new Map();courtyard.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material])){found.set(m.name,m);if(m.name==='ECC reception artwork'||m.map?.image?.src?.includes('reception-backwall'))interior=m;}});
 const copy=(name,fallback)=>found.has(name)?found.get(name).clone():new T.MeshStandardMaterial({color:fallback,roughness:.8});
 const stone=copy('ECC cut limestone',0xe5dcc2);const masonry=found.get('ECC warm sandstone')||[...found.values()].find(m=>/sandstone|limestone/.test(m.name)&&m.map);
 if(masonry){stone.map=masonry.map;stone.normalMap=masonry.normalMap;stone.normalScale.set(.18,.18);stone.roughnessMap=masonry.roughnessMap;stone.aoMap=masonry.aoMap;stone.aoMapIntensity=.35;stone.envMap=masonry.envMap;}stone.color.setHex(0xeee6d0);stone.roughness=.94;stone.name='Approved campus sandstone';
 const paving=copy('ECC travertine paving',0xddd2bb);const source=found.get('ECC travertine paving');if(source){paving.onBeforeCompile=source.onBeforeCompile;paving.customProgramCacheKey=source.customProgramCacheKey;}paving.name='Approved campus paving';
 paving.onBeforeCompile=shader=>{source?.onBeforeCompile?.(shader);shader.vertexShader='varying vec2 campusGround;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n campusGround = (modelMatrix * vec4(position,1.0)).xz;');shader.fragmentShader='varying vec2 campusGround;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n vec2 slab=campusGround/vec2(1.2,.6);slab.x+=mod(floor(slab.y),2.)*.5;vec2 seam=min(fract(slab),1.-fract(slab));float edge=min(seam.x*1.2,seam.y*.6);diffuseColor.rgb*=mix(.72,1.,smoothstep(.004,.017,edge));');};paving.customProgramCacheKey=()=> 'approved-campus-sawn-joints-1';
 const blue=copy('ECC powdercoat blue',0x28526a),timber=copy('ECC warm timber',0xc4a175),glass=copy('ECC authored glass',0xd4ded0),roof=copy('ECC clay roof',0xa85a35);
 // The imported Careers façade has a blue post immediately in front of its
 // sandstone return.  Give the metal a stable depth preference so the two
 // almost-touching surfaces cannot alternate as the depth buffer is sampled.
 // Pull the powdercoat forward consistently.  Several thin posts sit close to
 // their sandstone or glazing returns, so a single stable depth preference
 // avoids shimmer at every approach angle.
 blue.polygonOffset=true;blue.polygonOffsetFactor=-2;blue.polygonOffsetUnits=-2;
 glass.opacity=.14;glass.color.setHex(0xe5f2f0);glass.metalness=.06;glass.roughness=.07;glass.envMapIntensity=.38;glass.name='Approved campus glazing';glass.depthWrite=false;glass.forceSinglePass=true;
 const plaster=new T.MeshStandardMaterial({color:0xe5d9bf,roughness:.91});
 const glow=new T.MeshStandardMaterial({color:0xffe5b2,emissive:0xffd292,emissiveIntensity:.7,roughness:.6});
 const soil=new T.MeshStandardMaterial({color:0x544b37,roughness:1});
 return {stone,paving,blue,timber,glass,roof,plaster,glow,soil,interior:interior||plaster};
}
const geometryCache=new Map();
export function dressedBox(root,x,y,z,w,h,d,material,bevel=.02){
 const r=Math.min(bevel,w*.18,h*.18,d*.18),key=[w,h,d,r,material.transparent&&!material.map?'glass':'solid'].join(':');let geo=geometryCache.get(key);
 if(!geo){
  if(material.transparent&&!material.map){geo=new T.PlaneGeometry(w<d?d:w,h);if(w<d)geo.rotateY(Math.PI/2);}
  else if(r===0)geo=new T.BoxGeometry(w,h,d);
  else{const s=new T.Shape();s.moveTo(-w/2+r,-h/2+r);s.lineTo(w/2-r,-h/2+r);s.lineTo(w/2-r,h/2-r);s.lineTo(-w/2+r,h/2-r);s.closePath();geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:1,steps:1,curveSegments:1});geo.translate(0,0,-d/2+r);geo.clearGroups();}
  // Metre-based UVs avoid stretched stone on long lintels and piers.
  const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.7?p.getZ(i):p.getX(i))/2,(ny>.7?p.getZ(i):p.getY(i))/2);}
  geometryCache.set(key,geo);
 }
 const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=!material.transparent;o.receiveShadow=true;root.add(o);return o;
}
export function planter(root,x,z,w,d,p){
 const box=(x,y,z,w,h,d,m)=>dressedBox(root,x,y,z,w,h,d,m);
 box(x,.17,z,w,.34,d,p.stone);box(x,.355,z,w+.06,.09,d+.06,p.stone);box(x,.407,z,w-.2,.025,d-.2,p.soil);
}
export function canopy(root,x,z,w,d,p,y=3.15){
 dressedBox(root,x,y,z-d/2,w,.16,.16,p.blue);dressedBox(root,x,y,z+d/2,w,.16,.16,p.blue);
 for(const dx of[-w/2+.13,w/2-.13])for(const dz of[-d/2+.13,d/2-.13])dressedBox(root,x+dx,y/2,z+dz,.12,y,.12,p.blue,.008);
 for(let q=-w/2;q<=w/2;q+=.26)dressedBox(root,x+q,y+.12,z,.09,.15,d+.15,p.timber,.008);
}
export function makeAvatarStudio(p,sign){
 const b=new T.Group();b.name='Approved standard Avatar Studio';
 const box=(x,y,z,w,h,d,m=p.stone,bevel=.02)=>dressedBox(b,x,y,z,w,h,d,m,bevel);
 // Existing footprint, entry direction and destination preserved.
 box(0,.055,0,6.3,.11,8.1,p.paving);box(0,3.3,-3.81,6.3,6.6,.3);
 box(-3.02,3.3,0,.28,6.6,8);box(3.02,2.1,0,.28,4.2,8);
 box(0,3.30,0,6.3,.18,8,p.stone);box(-.65,6.53,-.5,5.35,.20,7.45,p.blue);box(-.65,6.66,-.5,5.5,.12,7.6,p.stone);
 box(2.44,4.12,0,1.44,.18,8.15,p.blue);box(2.44,4.23,0,1.52,.07,8.2,p.stone);
 // Sandstone entrance tower and deep stone returns make a recognisable composition.
 box(-2.6,3.55,3.73,.82,7.1,.82);box(-2.6,7.13,3.73,.96,.13,.98);
 box(2.68,2.06,3.65,.53,4.12,.72);box(.12,3.10,3.84,4.35,.46,.55,p.blue);
 box(.28,2.90,4.14,6.65,.18,2.05,p.blue);box(.28,2.795,4.14,6.35,.07,1.92,p.timber);
 for(const x of[-2.65,3.35])box(x,1.42,4.9,.12,2.84,.12,p.blue,.008);
 // Actual window reveals, separate glass panes, door gap and metal handles.
 for(const level of[0,3.35]){
  for(const x of[-1.74,-.86,.86,1.74]){box(x,level+1.43,3.39,.81,2.64,.025,p.glass,0);box(x-.43,level+1.43,3.48,.06,2.77,.13,p.blue,.006);}
  if(level>0)box(0,level+1.43,3.39,.8,2.64,.025,p.glass,0);
  for(const y of[.075,2.78])box(0,level+y,3.47,4.38,.09,.16,p.blue,.008);
 }
 for(const x of[-.38,.38]){box(x,1.34,3.45,.71,2.6,.027,p.glass,0);box(x+Math.sign(x)*-.29,1.22,3.54,.03,.4,.06,p.blue,.005);}
 for(let z=-3.3;z<3;z+=1.04){box(2.82,1.5,z,.028,2.68,.94,p.glass,0);box(2.87,1.5,z-.49,.11,2.82,.055,p.blue,.006);}
 for(let x=-2.04;x<1.3;x+=.25)box(x,4.90,3.74,.065,2.83,.25,p.timber,.006);
 // Two believable rooms: reception and studio displays behind the glazed facade.
 for(const level of[0,3.35]){
  box(0,level+.08,-.25,5.8,.09,7,p.timber);box(0,level+1.42,-2.95,5.85,2.75,.13,p.plaster);const room=new T.Mesh(new T.PlaneGeometry(4.1,2.65),p.interior);room.position.set(0,level+1.44,-2.86);b.add(room);
  box(-2.23,level+1.30,-1.8,.12,1.82,.85,p.blue);box(-2.15,level+1.30,-1.8,.025,1.64,.67,p.glow,0);
  box(.73,level+.82,1.5,1.9,.18,.8,p.timber);box(.73,level+.4,1.5,1.75,.72,.62,p.stone);
  for(const x of[-1.35,1.45]){box(x,level+.46,-.55,.72,.13,.68,p.timber);box(x,level+.8,-.82,.72,.68,.12,p.timber);for(const dx of[-.25,.25])box(x+dx,level+.22,-.55,.04,.43,.43,p.blue,.004);}
  for(const x of[-1.65,0,1.65])box(x,level+2.86,1.42,.65,.025,.35,p.glow,0);
  // Slim shelving and coloured folios, large enough to read through the windows.
  for(const y of[.50,1.18,1.85]){box(1.63,level+y,-2.57,1.45,.055,.35,p.timber);for(let i=0;i<6;i++)box(1.1+i*.18,level+y+.2,-2.57,.12,.33,.25,i%2?p.blue:p.plaster,.004);}
 }
 const plaque=sign('AVATAR STUDIO',2.85,'#f6e9ce','#29434a');plaque.position.set(.1,3.1,4.9);b.add(plaque);
 // Roof-level charcoal battens and a restrained solar strip finish the upper silhouette.
 for(let z=-3.6;z<2.9;z+=.45)box(-.65,6.74,z,4.9,.035,.08,p.blue,0);
 box(1.99,4.29,-.55,.83,.04,4.9,p.blue,0);
 return b;
}
export function applyBuildingPalette(model,p){
 const glazing=p.glass.clone();glazing.side=T.FrontSide;
 model.traverse(o=>{if(!o.isMesh)return;const name=o.material.name;
  if(/limestone/i.test(name))o.material=p.stone;
  else if(/Satin-navy/.test(name))o.material=p.blue;
  else if(/Oiled-timber/.test(name))o.material=p.timber;
  // These imported panes are closed boxes; render the exterior face once.
  else if(/Clear-glass/.test(name)){o.material=glazing;o.castShadow=false;}
  else if(/Pale-paving/.test(name))o.material=p.paving;
  else if(/Warm lighting/.test(name))o.material=p.glow;
 });return model;
}
export {batchStatic};
