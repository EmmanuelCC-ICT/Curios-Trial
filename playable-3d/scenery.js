import * as THREE from 'three';

// Bake imported transforms while preserving UVs, then centre and ground the model.
function parts(asset) {
  const root=asset.scene;root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());
  const result=[];
  root.traverse(o=>{if(!o.isMesh)return;
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
    geometry.translate(-center.x,-bounds.min.y,-center.z);
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    result.push({geometry,material:o.material});
  });
  return {parts:result,size:bounds.getSize(new THREE.Vector3())};
}

export function treeKit(town,highAsset,lowAsset,placements) {
  const high=parts(highAsset),low=parts(lowAsset),matrix=new THREE.Object3D();
  // Both LODs use the same colour atlas: share its GPU texture and material.
  low.parts.forEach((p,i)=>{const old=p.material;p.material=high.parts[i]?.material||high.parts[0].material;if(old!==p.material){old.map?.dispose();old.dispose();}});
  const make=(model,label)=>model.parts.map(p=>{
    const mesh=new THREE.InstancedMesh(p.geometry,p.material,placements.length);
    mesh.name=`imported-trees-${label}`;mesh.castShadow=mesh.receiveShadow=true;
    mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);town.add(mesh);return mesh;
  });
  const near=make(high,'near'),far=make(low,'far');
  let last=-Infinity;
  const bands=placements.map(()=>false);
  return {
    update(time,camera){
      if(!camera||time-last<.25)return;last=time;
      let n=0,f=0;
      placements.forEach((p,i)=>{
        const distance=Math.hypot(camera.position.x-p.x,camera.position.z-p.z);
        // Hysteresis prevents rapid switching at the distance boundary.
        bands[i]=distance<(bands[i]?28:24);
        const targets=bands[i]?near:far,index=bands[i]?n++:f++;
        const model=bands[i]?high:low;
        const scale=p.height/model.size.y;
        matrix.position.set(p.x,0,p.z);matrix.rotation.set(0,p.yaw,0);matrix.scale.setScalar(scale);matrix.updateMatrix();
        for(const mesh of targets)mesh.setMatrixAt(index,matrix.matrix);
      });
      for(const [meshes,count] of [[near,n],[far,f]])for(const mesh of meshes){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
    },
    phase(name){for(const p of high.parts)p.material.color.set(name==='disrepair'?0x929581:name==='growth'?0xc4cfb6:0xffffff);},
    stats(){return {near:near[0]?.count||0,far:far[0]?.count||0};}
  };
}

export function homeModel(asset) {
  const model=parts(asset),root=new THREE.Group();root.name='imported-city-home-base';
  for(const p of model.parts){const mesh=new THREE.Mesh(p.geometry,p.material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  // Front (+Z) faces the existing east-facing Home Base approach.
  // The visible model stays within its original 4 x 7.2 collision footprint.
  root.rotation.y=Math.PI/2;
  root.scale.setScalar(Math.min(4/model.size.z,7.2/model.size.x));
  root.position.set(-17,0,5);
  return root;
}

/** A centred, grounded campus building placed at an approved town location. */
export function districtBuildingModel(asset,{name,x,z,rotation=0,scale=1}) {
  const model=parts(asset),root=new THREE.Group();root.name=name;
  for(const p of model.parts){const mesh=new THREE.Mesh(p.geometry,p.material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  // Downloaded architectural models use a much larger unit scale than the town.
  // Set the conversion at placement time so they sit beside the plaza, rather
  // than enclosing the player and camera.
  root.position.set(x,0,z);root.rotation.y=rotation;root.scale.setScalar(scale);
  return root;
}
