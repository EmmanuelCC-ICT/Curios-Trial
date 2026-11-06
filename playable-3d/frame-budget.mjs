// Keep a constrained GPU to one submitted scene frame. Poll without waiting on
// the CPU so downloads, input and UI can run while that frame finishes.
export function createGpuFrameGate(renderer,enabled=false,onComplete=()=>{}){
 const gl=renderer.getContext();let fence=null,submittedFrame=0,completedFrame=0,releasedFrame=0,nextDrawAt=0,presentFrame=true,pendingIsFrame=true;
 const supported=enabled&&typeof gl.fenceSync==='function'&&typeof gl.clientWaitSync==='function';
 function ready(){
  if(!fence)return true;
  const status=gl.clientWaitSync(fence,0,0);
  if(status===gl.TIMEOUT_EXPIRED)return false;
  gl.deleteSync(fence);fence=null;if(pendingIsFrame){completedFrame=submittedFrame;if(presentFrame)onComplete(completedFrame);}return true;
 }
 // Leave consecutive browser animation ticks free for layout/input after a
 // slow GPU finishes. Asset uploads and requested captures can still use ready().
 function readyForDraw(now=performance.now()){
  if(!ready())return false;
  if(!supported)return true;
  if(completedFrame!==releasedFrame){releasedFrame=completedFrame;nextDrawAt=now+48;return false;}
  return now>=nextDrawAt;
 }
 function submitted(present=true){
  if(supported&&fence)throw new Error('GPU frame submitted before the preceding frame completed');
  pendingIsFrame=true;presentFrame=present;submittedFrame++;if(!supported){completedFrame=submittedFrame;return;}
  fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
 }
 // Uploads share the one-in-flight budget but are not rendered frames.
 function uploadSubmitted(){
  if(!supported)return;
  if(fence)throw new Error('GPU upload submitted before preceding work completed');
  pendingIsFrame=false;presentFrame=false;fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
 }
 return {ready,readyForDraw,submitted,uploadSubmitted,constrained:supported,get submittedFrame(){return submittedFrame;},get completedFrame(){return completedFrame;}};
}

// Decoded decorative images retain their original pixels, but become visible
// one at a time, after a frame can run. Downloads remain independently concurrent.
export function createTextureUploadQueue({waitForFrame,upload}){
 const pending=[];let running=false,waitingForFrame=false,worldFrameDue=false;
 async function drain(){
  running=true;
  while(pending.length){
   pending.sort((a,b)=>b.priority-a.priority);
   const task=pending.shift();
   try{waitingForFrame=true;await waitForFrame();waitingForFrame=false;const texture=task.hydrate();upload(texture);worldFrameDue=true;task.resolve();}
   catch(error){task.reject(error);}
   finally{waitingForFrame=false;}
  }
  running=false;
 }
 function schedule(hydrate,{priority=0}={}){
  const promise=new Promise((resolve,reject)=>pending.push({hydrate,priority,resolve,reject}));
  if(!running)drain();return promise;
 }
 return {schedule,worldSubmitted(){worldFrameDue=false;},get worldFrameDue(){return worldFrameDue;},get waitingForFrame(){return waitingForFrame;}};
}
