import * as T from 'three';
// Spatial perimeter treatment; independent of activity timeline state changes.
export function polishGround(scene){
 const existing=scene.getObjectByName('Soft campus perimeter');if(existing)return existing;
 // The tile material exists before its deferred image; cloned perimeter maps
 // must share that texture so late hydration restores the same artwork.
 let grass=scene.getObjectByName('tile-kit-grass')?.material;
 scene.traverse(o=>{if(!grass&&o.isMesh){grass=(Array.isArray(o.material)?o.material:[o.material]).find(m=>m.map?.image?.src?.includes('grass-ecc-campus'));}});
 if(!grass)return;
 const apply=(material,outer)=>{
  material.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec2 campusGroundXZ;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 campusGroundPoint = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
     campusGroundPoint = instanceMatrix * campusGroundPoint;
    #endif
    campusGroundXZ = (modelMatrix * campusGroundPoint).xz;`);
   shader.fragmentShader='varying vec2 campusGroundXZ;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float broadVariation = sin(campusGroundXZ.x * .14 + sin(campusGroundXZ.y * .09)) * sin(campusGroundXZ.y * .12);
    float borderDistance = min(min(campusGroundXZ.x + 40.0, 52.0 - campusGroundXZ.x), min(campusGroundXZ.y + 78.0, 38.0 - campusGroundXZ.y));
    float borderBlend = 1.0 - smoothstep(0.0, 8.0, borderDistance);
    diffuseColor.rgb *= 1.0 + .045 * broadVariation;
    diffuseColor.rgb *= mix(vec3(1.0), vec3(.89, .92, .86), borderBlend);
    ${outer?'float edgeWaver = 1.5 * sin(campusGroundXZ.x * .19) + 1.3 * sin(campusGroundXZ.y * .16); diffuseColor.a *= 1.0 - smoothstep(7.0, 22.0, -borderDistance + edgeWaver);':''}`);
  };
  material.customProgramCacheKey=()=>`campus-ground-polish-v1-${outer}`;
  material.needsUpdate=true;
 };
 apply(grass,false);
 const material=grass.clone();material.transparent=true;material.depthWrite=false;apply(material,true);
 const geometry=new T.PlaneGeometry(140,164,1,1);
 const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*70,uv.getY(i)*82);
 const outer=new T.Mesh(geometry,material);outer.name='Soft campus perimeter';outer.rotation.x=-Math.PI/2;outer.position.set(6,-.018,-20);outer.receiveShadow=true;scene.add(outer);
 return outer;
}
