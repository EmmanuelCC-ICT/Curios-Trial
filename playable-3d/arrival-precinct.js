import * as THREE from 'three';
import {partitionInstances} from './environment/static-batching.js?v=ecc-ba60122';
import {approvedPalette,makeAvatarStudio,dressedBox,batchStatic} from './environment/approved-campus-kit.js?v=ecc-ba60122';
// One bounded, walkable precinct. Existing Studio interaction remains at (-12.4, 5).
export function arrivalPrecinct(town,stoneTexture,sign,palette){
 const root=new THREE.Group();root.name='Arrival to Studio campus';town.add(root);
 const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
 const stone=palette.stone,navy=palette.blue,wood=palette.timber,soil=mat(0x645743),grass=mat(0x6e8050);

 const glass=new THREE.MeshStandardMaterial({color:0x678e97,metalness:.3,roughness:.16,transparent:true,opacity:.65});
 const warm=new THREE.MeshStandardMaterial({color:0xf6e1af,emissive:0xffc976,emissiveIntensity:.25,roughness:.7});
 function box(g,x,y,z,w,h,d,m){const geo=new THREE.BoxGeometry(w,h,d);if(m===stone){const uv=geo.attributes.uv,n=geo.attributes.normal;for(let i=0;i<uv.count;i++){const side=Math.abs(n.getX(i))>.5;uv.setXY(i,uv.getX(i)*(side?d:w)/2,uv.getY(i)*(Math.abs(n.getY(i))>.5?d:h)/2);}}const a=new THREE.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=a.receiveShadow=true;g.add(a);return a;}
 const building=makeAvatarStudio(palette,sign);building.position.set(-17,0,5);building.rotation.y=Math.PI/2;root.add(building);
 // Landscape stage: continuous walk from arrival, generous clear central lane.
 // World-aligned paving keeps a consistent scale across turns and junctions.
 const paving=palette.paving;
 const border=mat(0x8c9186,.96);
 function ground(x,z,w,d,material,y=.105){
  const geo=new THREE.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);
  const uv=geo.attributes.uv,pos=geo.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/3,(pos.getZ(i)+z)/3);
  const surface=new THREE.Mesh(geo,material);surface.position.set(x,y,z);surface.receiveShadow=true;root.add(surface);
 }
 // Flush Studio apron, shaded walk and southern link; no new collision bodies.
 // The cross-link passes south of the existing garden and joins the main avenue.
 ground(-7,13.55,4.5,12.9,paving);
 ground(-8.6,5,9.8,4.2,paving);
 ground(-2.875,18,3.75,3.6,paving);
 for(const x of [-9.16,-4.84])ground(x,13.55,.18,12.9,border,.107);
 for(const z of [8.8,11.8,14.8,17.8,19.9])ground(-7,z,4.14,.075,border,.108);
 for(const z of [16.29,19.71])ground(-2.875,z,3.75,.18,border,.107);
 for(const z of [2.99,7.01])ground(-8.6,z,9.8,.18,border,.107);
 ground(-10.9,5,.08,3.84,border,.108);
 // A continuous narrow route around, not through, the planters leads to Chapel.
 ground(-7,11.3,1.6,8.8,paving,.115);ground(-4.85,7.8,5.9,1.6,paving,.115);ground(-2.7,-.1,1.6,15.8,paving,.115);ground(-3.05,-8.2,1.6,1.7,paving,.115);
 function pergola(x,z,w,d){const edgeX=w/2-.15,edgeZ=d/2-.15;for(const dx of [-edgeX,edgeX])for(const dz of [-edgeZ,edgeZ])box(root,x+dx,1.72,z+dz,.13,3.44,.13,navy);for(const dz of [-edgeZ,edgeZ])box(root,x,3.45,z+dz,w,.16,.16,wood);for(const dx of [-edgeX,edgeX])box(root,x+dx,3.45,z,.16,.16,d,wood);for(let q=-w/2+.2;q<w/2-.2;q+=.28)box(root,x+q,3.58,z,.12,.16,d+.25,wood);}
 // The two inherited timber pergolas shared the faulty Administration-side
 // post layout. Remove the complete obsolete structures rather than leaving
 // isolated uprights after their seating has been cleared.
 const welcome=sign('ARRIVAL GARDENS',1.35,'#f4e5c6','#29434a');welcome.position.set(-10.4,1.35,19.9);root.add(welcome);
 let seed=719;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const walkBeds=[[-10.6,11.2,2.1,7],[-3.3,12,2.7,8],[-10.7,1,3,3],[-4.3,2,2.0,3.8],[-10.7,20.6,3.5,2.2]];
 for(const [x,z,w,d]of walkBeds){dressedBox(root,x,.22,z,w,.44,d,stone);dressedBox(root,x,.46,z,w+.05,.08,d+.05,stone);box(root,x,.505,z,w-.2,.025,d-.2,soil);}
 // Stone outcrops and seating frame the walkway, never obstruct its centre.
 for(const [x,z] of [[-10.6,9],[-3.3,10],[-3.3,15],[-10.7,1]]){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.38,0),stone.clone());rock.position.set(x,.55,z);rock.scale.set(1.05,.7,.85);rock.castShadow=true;root.add(rock);}
 // Remove the thin decorative posts along this route. Their overlapping
 // geometry produced the reported Administration-side flicker.
 // Keep planting inside the resized courtyard-facing beds.
 // Merge static surfaces by material to keep the scene affordable to render.
 // Spatially separate botanical instances and preserve individual glass sorting.
 const staticRoot=new THREE.Group();root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const copy=new THREE.Mesh(o.geometry,o.material);o.updateWorldMatrix(true,false);copy.matrix.copy(o.matrixWorld);copy.matrixAutoUpdate=false;copy.castShadow=o.castShadow;copy.receiveShadow=o.receiveShadow;staticRoot.add(copy);}});
 const originals=[];root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)originals.push(o);});originals.forEach(o=>o.removeFromParent());town.add(batchStatic(staticRoot));
 partitionInstances(root,{filter:o=>!o.userData.distanceDetail});
 // Existing tree assets supply detailed native canopies around the new courtyard.
 let detailLoad;
 function loadDetail(){return detailLoad||=(async()=>{
  const {addAuthoredGarden}=await import('./ecc-preview/authored-garden.js?v=ecc-ba60122');
  const detail=new THREE.Group();detail.name='Arrival authored garden detail';
  addAuthoredGarden(detail,walkBeds.filter(b=>b[1]>3),{treeSites:[[-11.3,10,1.22,.7],[-2.8,13,1.34,2.3]],baseY:.52,density:4,detail:'supporting'});
  addAuthoredGarden(detail,[[-10.7,1,3,3],[-4.3,2,2.0,3.8]],{treeSites:[[-11,0,1.25,.4],[-4.3,1,1.20,2.3]],baseY:.5});
  partitionInstances(detail,{filter:o=>!o.userData.distanceDetail});root.add(detail);return detail;
 })().catch(error=>{detailLoad=null;throw error;});}
 return {loadDetail,trees:[],colliders:[[-10.6,.22,11.2,2.1,.44,7],[-3.3,.22,12,2.7,.44,8],[-10.7,.22,1,3,.44,3],[-4.3,.22,2,2.0,.44,3.8]]};
}
