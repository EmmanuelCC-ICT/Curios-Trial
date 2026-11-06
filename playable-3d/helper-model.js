import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Dispose every replaced/late model, including GPU textures. Never cache the set.
export function disposeHelper(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});root.removeFromParent();geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
export function createSelectedHelper(fallback){
 const root=new THREE.Group(),body=new THREE.Group(),orbit=new THREE.Group();root.add(body);body.add(orbit);
 let version=0,current=null,status='idle',id=null,disposed=false,controller=null;
 function clear(){if(current){disposeHelper(current);current=null;}}
 return {root,body,orbit,get status(){return status;},get id(){return id;},
 async select(helper){if(!helper.model){id=helper.id;version++;controller?.abort();clear();status='disabled';return;}if(id===helper.id&&status!=='failed')return;id=helper.id;const request=++version;status='loading';controller?.abort();controller=new AbortController();const signal=controller.signal;const timeout=setTimeout(()=>controller?.signal===signal&&controller.abort(),15000);clear();
  try{const url=new URL(helper.model,import.meta.url);const response=await fetch(url,{signal});if(!response.ok)throw Error('Helper HTTP '+response.status);const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),new URL('.',url).href);if(disposed||request!==version){disposeHelper(gltf.scene);return;}
   const model=gltf.scene;const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const scale=.84/Math.max(size.y,.001);model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});body.add(model);current=model;status='ready';
  }catch(error){if(disposed||request!==version)return;const safe=fallback();current=safe.root;body.add(current);status='failed';console.warn('Selected guide unavailable; Echo fallback active.',error);}finally{clearTimeout(timeout);}
 },dispose(){disposed=true;version++;controller?.abort();clear();root.removeFromParent();}};
}
