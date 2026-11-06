// Bound an asset's scheduling priority; an unavailable saved character must not
// prevent the playable fallback and arrival scenery from completing.
export async function waitForPriorityAsset(ready,budgetMs=8000){
 let timer;try{return await Promise.race([Promise.resolve(ready).catch(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),budgetMs);})]);}finally{clearTimeout(timer);}
}
export async function withAssetDeadline(ready,timeoutMs=15000,message='Surface download is taking too long. Retry missing detail.',signal){
 let timer,onAbort;
 try{const jobs=[ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),timeoutMs);})];
  if(signal)jobs.push(new Promise((_,reject)=>{onAbort=()=>reject(signal.reason||new Error('Request cancelled'));if(signal.aborted)onAbort();else signal.addEventListener('abort',onAbort,{once:true});}));
  return await Promise.race(jobs);
 }finally{clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
}

// Late texture recovery must not wait for optional full-campus scenery.
export function canClearDetailWarning({entryReady,campusReady,campusLoading,pending,campusFailed=false}){
 return !campusFailed&&pending===0&&(campusReady||(entryReady&&!campusLoading));
}
