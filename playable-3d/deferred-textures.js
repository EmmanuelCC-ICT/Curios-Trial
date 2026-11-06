import {withAssetDeadline} from './startup-assets.mjs?v=ecc-ba60122';
import * as THREE from 'three';

// Keep texture identity/UV settings stable for cloned materials. Only the image
// arrives later; the accepted full-detail artwork is still the final result.
export function createDeferredTextures({onFailure=()=>{},scheduleHydration=hydrate=>Promise.resolve(hydrate())}={}){
  const jobs=[];let running,retrying;const active=new Set();
  function defer(loader,url,{normal=false,transparent=false,hdr=false,colour='#ffffff',target,flipY,shareSource=false}={}){
    let texture=target;
    // PMREM derives its cube size from width/4; a 1px HDR creates an invalid
    // subpixel cube and integer shader constants. Keep the same neutral white
    // fallback at the minimum 16px cube size until the original HDR arrives.
    if(!target){
    if(hdr)texture=new THREE.DataTexture(new Uint16Array(64*32*4).fill(15360),64,32,THREE.RGBAFormat,THREE.HalfFloatType);
    else{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
      const ctx=canvas.getContext('2d');ctx.fillStyle=normal?'#8080ff':colour;
      if(!transparent)ctx.fillRect(0,0,1,1);
      texture=new THREE.Texture(canvas);
    }
    }
    if(hdr){texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.colorSpace=THREE.LinearSRGBColorSpace;}
    texture.needsUpdate=true;
    jobs.push({loader,url,texture,flipY,shareSource,done:false,failed:false,inFlight:false});
    return texture;
  }
  const load=(...args)=>Promise.resolve(defer(...args));
  async function perform(job){
    job.inFlight=true;job.failed=false;
    try{
      // A late bounded request still hydrates the original shared texture.
      const request=job.loader.loadAsync(job.url);
      // Separate the network deadline from the upload budget. A decoded image
      // waiting for a frame is not a missing download; late responses still hydrate.
      const hydration=request.then(loaded=>scheduleHydration(()=>{
        const target=job.texture;
        target.dispose();if(job.shareSource)target.source.data=loaded.source.data;else target.source=loaded.source;target.format=loaded.format;target.type=loaded.type;
        target.internalFormat=loaded.internalFormat;target.flipY=job.flipY??loaded.flipY;
        target.generateMipmaps=loaded.generateMipmaps;
        target.needsUpdate=true;target.needsPMREMUpdate=true;
        return target;
      },{priority:/grass|limestone/.test(job.url)?1:0})).then(()=>{job.done=true;job.failed=false;});
      hydration.catch(()=>{});
      await withAssetDeadline(request);
      await hydration;
      await new Promise(resolve=>setTimeout(resolve,0));
    }catch(error){if(!job.done){job.failed=true;onFailure(error);}}
    finally{job.inFlight=false;}
  }
  function launch(job){
    const promise=perform(job);active.add(promise);
    promise.finally(()=>active.delete(promise));return promise;
  }
  async function drain(retryOnly){
    const attempted=new Set();
    async function worker(){
      for(let job;job=jobs.find(job=>!job.done&&!job.inFlight&&!attempted.has(job)&&(!retryOnly||job.failed));){
        attempted.add(job);await launch(job);
      }
    }
    // Retry only the failed jobs, never duplicate another worker's download.
    await Promise.all(Array.from({length:retryOnly?1:4},worker));
    if(!retryOnly)while(active.size)await Promise.all([...active]);
    if(jobs.some(job=>job.failed&&!job.done))throw new Error('Some campus detail could not download. Please retry.');
  }
  function start(){
    if(running)return running;
    running=drain(false).finally(()=>{running=null;});return running;
  }
  function retry(){
    if(retrying)return retrying;
    retrying=drain(true).finally(()=>{retrying=null;});return retrying;
  }
  return {load,defer,start,retry,startMatching:async matches=>{await Promise.all(jobs.filter(job=>matches(job.url)&&!job.done&&!job.inFlight).map(launch));if(jobs.some(job=>matches(job.url)&&job.failed&&!job.done))throw new Error('Requested campus artwork could not load. Please retry.');},get failed(){return jobs.filter(job=>job.failed&&!job.done).length;},get pending(){return jobs.filter(job=>!job.done).length;}};
}

// Two animation ticks allow the first playable frame to be presented before
// beginning optional scenery work. A background tab need not load more scenery.
export const afterFirstPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
