import * as T from 'three';

// Deterministic, tileable PBR detail: one shared map set per surface family.
// No network assets, per-frame texture work or full-screen postprocessing.
const cache=new Map();
function hash(x,y,s=0){let n=Math.imul(x+137*s,374761393)^Math.imul(y+19*s,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
function noise(x,y,period,seed){const ix=Math.floor(x/period),iy=Math.floor(y/period),u=x/period-ix,v=y/period-iy;const a=u*u*(3-2*u),b=v*v*(3-2*v),n=1024/period;const h=(dx,dy)=>hash((ix+dx)%n,(iy+dy)%n,seed);return T.MathUtils.lerp(T.MathUtils.lerp(h(0,0),h(1,0),a),T.MathUtils.lerp(h(0,1),h(1,1),a),b);}
function maps(kind){
 if(cache.has(kind))return cache.get(kind);
 const size=512,base=document.createElement('canvas'),height=document.createElement('canvas');
 for(const c of [base,height])c.width=c.height=size;
 const ctx=base.getContext('2d'),bc=ctx.createImageData(size,size),hc=ctx.createImageData(size,size);
 const paving=kind==='paving',row=paving?256:128,col=paving?512:256;
 const palette=kind==='brick'?[191,175,142]:paving?[186,173,145]:[193,171,130];
 // Sample the same 1024-unit authored pattern: courses and paving keep their world scale.
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const x=px*2,y=py*2;
  const iy=Math.floor(y/row),sx=(x+(iy%2)*col/2)%1024,ix=Math.floor(sx/col),fx=sx%col,fy=y%row;
  const edge=Math.min(fx,col-fx,fy,row-fy),joint=edge<2.4,bevel=Math.min(1,edge/6);
  const grain=(noise(x,y,128,6)-.5)*15+(noise(x,y,32,2)-.5)*22+(noise(x,y,8,3)-.5)*12+(hash(x,y,4)-.5)*11;
  const strata=Math.sin(y*.105+noise(x,y,64,5)*5)*3.5;
  const block=(hash(ix,iy,9)-.5)*22,shade=.82+.18*bevel;
  const at=(py*size+px)*4;
  for(let k=0;k<3;k++)bc.data[at+k]=joint?[135,127,111][k]:(palette[k]+block+grain+strata)*shade;
  const h=joint?55:159+grain*.55+bevel*20;
  // Bump reads red; roughness reads green. Pack them without changing either value.
  hc.data[at]=h;hc.data[at+1]=joint?247:213+grain*.7;hc.data[at+2]=0;
  bc.data[at+3]=hc.data[at+3]=255;
 }
 ctx.putImageData(bc,0,0);height.getContext('2d').putImageData(hc,0,0);
 const tex=c=>{const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;};
 const map=tex(base);map.colorSpace=T.SRGBColorSpace;
 const detail=tex(height);const result={map,bumpMap:detail,roughnessMap:detail};cache.set(kind,result);return result;
}
function interiorMap(){
 const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
 x.fillStyle='#354346';x.fillRect(0,0,512,512);
 const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#152b32');g.addColorStop(.4,'#748789');g.addColorStop(1,'#b7ab8c');x.fillStyle=g;x.fillRect(22,18,468,475);
 // Recessed room illusion, kept deliberately low contrast behind reflected glass.
 x.fillStyle='#283737';x.beginPath();x.moveTo(22,18);x.lineTo(490,18);x.lineTo(405,112);x.lineTo(99,112);x.fill();
 x.fillStyle='#9d947e';x.beginPath();x.moveTo(22,493);x.lineTo(490,493);x.lineTo(405,367);x.lineTo(99,367);x.fill();
 x.fillStyle='#606c65';x.fillRect(99,112,306,255);
 for(let i=0;i<5;i++){x.fillStyle=i%2?'#697567':'#c4b58f';x.fillRect(104+i*59,117,5,247);}
 x.fillStyle='#ead9ac';x.fillRect(121,115,270,5);x.fillStyle='#9e8e71';x.fillRect(133,312,230,13);x.fillStyle='#414b43';x.fillRect(143,325,8,63);x.fillRect(346,325,8,63);
 x.globalAlpha=.18;const sky=x.createLinearGradient(0,0,0,512);sky.addColorStop(0,'#e5f2fb');sky.addColorStop(.5,'#94bed0');sky.addColorStop(1,'#486a62');x.fillStyle=sky;x.fillRect(0,0,512,512);x.globalAlpha=1;
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;
}
export async function upgradeMaterials(m){
 for(const key of ['stone','brick','paving']){const old=m[key];old.map?.dispose();Object.assign(old,maps(key));old.color.set(0xffffff);old.bumpScale=key==='paving'?.025:.045;old.roughness=.95;old.needsUpdate=true;}
 m.teal.color.set(0x294d60);m.teal.roughness=.52;m.navy.color.set(0x263f50);m.navy.roughness=.47;
 m.white.color.set(0xc8c4b5);m.wood.color.set(0x967044);m.wood.roughness=.82;
 m.glass.name='ECC courtyard glass';m.glass.color.set(0xa1b6b4);m.glass.opacity=.20;m.glass.roughness=.12;m.glass.metalness=.4;m.glass.depthWrite=false;m.glass.envMapIntensity=.9;
 upgradeRoof(m.roof);
 m.wood.map=timberMap();m.wood.color.set(0x9c805b);m.wood.bumpMap=m.wood.map;m.wood.bumpScale=.012;
 m.room=new T.MeshStandardMaterial({map:interiorMap(),roughness:.32,metalness:.12,color:0xe8e5d5});
 await scannedSandstone(m);
 m.reveal=new T.MeshStandardMaterial({color:0x4b514b,roughness:.94});
}

export function addHeroDetails({source,box,mesh,m,beds}){
 // Complete fascia outlines and stone returns strengthen depth without changing massing.
 for(const [x,z,w,d,y] of [[0,-4.55,8.7,4.75,3.39],[6.45,-1.45,4.8,6.8,3.46]]){
  for(const dz of [-d/2,d/2]){box(w,.19,.14,m.navy,x,y,z+dz);box(w,.045,.17,m.reveal,x,y-.13,z+dz);}
  for(const dx of [-w/2,w/2])box(.14,.19,d,m.navy,x+dx,y,z);
 }
 for(const x of [-3.78,3.78]){box(.33,2.77,.26,m.stone,x,1.98,-2.32);box(.43,.12,.38,m.stone,x,3.31,-2.28);}
 // Administration gable outlines follow the retained real-school pitched roof.
 function rafter(ax,ay,bx,by,z){const length=Math.hypot(bx-ax,by-ay),o=box(length,.14,.17,m.navy,(ax+bx)/2,(ay+by)/2,z);o.rotation.z=Math.atan2(by-ay,bx-ax);}
 rafter(-1.65,4.66,0,5.57,-1.76);rafter(0,5.57,1.65,4.66,-1.76);
 for(const [x,z,w,h,y]of [[-2.8,-2.405,1.85,2.05,1.83],[2.8,-2.405,1.85,2.05,1.83],[8,1.84,.55,2.3,1.55]]){
  box(w+.34,.11,.34,m.stone,x,y-h/2-.07,z+.12);box(w+.3,.16,.27,m.stone,x,y+h/2+.12,z+.08);
 }
 // Layered entrance soffits and restrained downlight strips stay above clear headroom.
 for(const [x,z,w,d,y]of [[0,-1.92,4.42,1.35,3.34],[6.45,1.84,4.7,1.35,3.48]]){
  box(w,.13,d,m.navy,x,y,z);box(w-.12,.075,d-.10,m.wood,x,y-.12,z);
  for(let dx=-w/2+.2;dx<w/2;dx+=.22)box(.055,.035,d-.12,m.wood,x+dx,y-.17,z);
  for(const dx of [-w*.27,w*.27])box(.40,.025,.11,m.warm,x+dx,y-.20,z);
 }
 // Slender timber screens next to existing entries; no new posts in walking lanes.
 for(const x of [-3.64,-3.49,3.47,3.62])box(.055,2.44,.19,m.wood,x,1.84,-2.2);
 for(const z of [-3.5,-1.3,.6]){box(.25,.10,1.5,m.stone,8.75,1,z);box(.24,.14,1.55,m.navy,8.75,2.79,z);}
 // Stone coping on existing raised beds, entirely inside existing collision bounds.
 for(const [x,z,w,d]of beds){
  for(const dz of [-d/2+.06,d/2-.06])box(w,.07,.13,m.stone,x,.305,z+dz);
  for(const dx of [-w/2+.06,w/2-.06])box(.13,.07,d-.24,m.stone,x+dx,.305,z);
 }
 // Contact AO cards anchor the existing walls/planters without a screen-space pass.
 const c=document.createElement('canvas');c.width=c.height=128;const a=c.getContext('2d');const g=a.createRadialGradient(64,64,24,64,64,64);g.addColorStop(0,'rgba(31,33,26,.32)');g.addColorStop(.65,'rgba(31,33,26,.19)');g.addColorStop(1,'rgba(31,33,26,0)');a.fillStyle=g;a.fillRect(0,0,128,128);
 const map=new T.CanvasTexture(c);const ao=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
 for(const [x,z,w,d]of [[0,-4.55,9.4,5.6],[6.45,-1.45,5.8,7.8],[-6,-1,7.4,7.4],...beds]){const p=mesh(new T.PlaneGeometry(w+.7,d+.7),ao,x,.052,z);p.rotation.x=-Math.PI/2;p.castShadow=false;}
 source.userData.heroStandard='CE-VISUAL-20260913-HERO';
}

export function timberMap(){
 const c=document.createElement('canvas');c.width=c.height=256;const a=c.getContext('2d');a.fillStyle='#c6ad82';a.fillRect(0,0,256,256);
 for(let i=0;i<260;i++){const x=hash(i,1)*256;a.strokeStyle=i%3?'#74563b35':'#eedab760';a.lineWidth=.4+hash(i,4);a.beginPath();a.moveTo(x,0);a.bezierCurveTo(x+hash(i,7)*10,85,x-5,172,x,256);a.stroke();}
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}
function upgradeRoof(material){
 const size=512,c=document.createElement('canvas'),h=document.createElement('canvas');c.width=c.height=h.width=h.height=size;const a=c.getContext('2d'),b=h.getContext('2d'),co=a.createImageData(size,size),hi=b.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const tx=x%32/32,ty=y%96/96,crest=Math.pow(Math.sin(tx*Math.PI),.65),lap=ty<.055?-.25:0,variation=(hash(Math.floor(x/32),Math.floor(y/96),31)-.5)*14,grain=(hash(x,y,10)-.5)*13,shade=.72+.28*crest+lap;const i=(y*size+x)*4;for(let k=0;k<3;k++){co.data[i+k]=([143,91,62][k]+variation+grain)*shade;hi.data[i+k]=90+crest*105+lap*100;}co.data[i+3]=hi.data[i+3]=255;}
 a.putImageData(co,0,0);b.putImageData(hi,0,0);const map=new T.CanvasTexture(c),bump=new T.CanvasTexture(h);map.colorSpace=T.SRGBColorSpace;for(const t of [map,bump]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}material.map?.dispose();material.map=map;material.bumpMap=bump;material.bumpScale=.065;material.roughness=.91;
}

async function scannedSandstone(m){
 const loader=new T.TextureLoader();
 try{
  const [map,normalMap,packed]=await Promise.all(['diffuse','normal','arm'].map(name=>loader.loadAsync(new URL(`./assets/courtyard/sandstone-${name}.jpg`,import.meta.url).href)));
  map.colorSpace=T.SRGBColorSpace;
  for(const t of [map,normalMap,packed]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2/3,2/3);t.anisotropy=8;}
  for(const key of ['stone','brick']){const a=m[key];a.map?.dispose();a.bumpMap?.dispose();a.map=map;a.bumpMap=null;a.normalMap=normalMap;a.normalScale.set(.65,.65);a.aoMap=packed;a.aoMapIntensity=.7;a.roughnessMap=packed;a.roughness=1;a.needsUpdate=true;a.userData.source='Poly Haven sandstone_blocks_08 / CC0';}
 }catch(error){console.warn('ECC sandstone maps unavailable; retained procedural fallback.',error);}
}
