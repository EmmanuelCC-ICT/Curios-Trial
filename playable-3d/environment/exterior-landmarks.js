import * as T from 'three';
import {createMarketExterior} from './market-exterior.js?v=ecc-ba60122';
// Existing authored outdoor landmarks only: no imports/fetches of model kits,
// interiors, activity code or NPCs. Both entry and full-campus setup reuse this.
export function addExteriorLandmarks(scene,palette,grass=scene.getObjectByName('tile-kit-grass')?.material){
 const existing=scene.getObjectByName('Campus exterior landmarks');if(existing)return existing;
 if(!grass)throw Error('Existing campus grass material missing');
 const root=new T.Group();root.name='Campus exterior landmarks';
 root.add(createMarketExterior(palette));
 const positions=[];for(let x=-40;x<52;x+=2)for(let z=-78;z<38;z+=2){if(x>=-26&&x<28&&z>=-26&&z<28)continue;positions.push([x+1,z+1]);}
 const ground=new T.InstancedMesh(new T.PlaneGeometry(2,2),grass,positions.length);ground.name='Continued campus grass tiles';
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);positions.forEach(([x,z],i)=>ground.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(x,0,z),q,new T.Vector3(1,1,1))));ground.receiveShadow=true;ground.computeBoundingSphere();root.add(ground);
 const points=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;points.push(new T.Vector3(-4+14*Math.cos(a),.025,-54+9*Math.sin(a)));}
 const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xeeeede,transparent:true,opacity:.55}));line.name='Oval perimeter';root.add(line);
 scene.add(root);return root;
}
