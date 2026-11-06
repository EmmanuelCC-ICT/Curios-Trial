// Bound the network phase, including the response body, without changing a saved avatar.
export async function downloadAvatar(url, {timeoutMs=60000, headerTimeoutMs=12000, maxAttempts=2, fetchImpl=fetch}={}) {
  const deadline=Date.now()+timeoutMs;
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const controller=new AbortController(),remaining=Math.max(0,deadline-Date.now());
    const timer=setTimeout(()=>controller.abort(),remaining);
    // Retry a connection that never starts responding without spending a minute on it.
    const headerTimer=setTimeout(()=>controller.abort(),Math.min(headerTimeoutMs,remaining));
    let retryable=true;
    try {
      const response=await fetchImpl(url,{signal:controller.signal});
      clearTimeout(headerTimer);
      if(!response.ok){retryable=response.status>=500||response.status===429;throw new Error(`Avatar download failed (${response.status}).`);}
      return await response.arrayBuffer();
    } catch(error) {
      if(retryable&&attempt+1<maxAttempts&&Date.now()<deadline)continue;
      if(controller.signal.aborted)throw new Error('Your avatar download took too long. Please try again.');
      throw error;
    } finally {clearTimeout(timer);clearTimeout(headerTimer);}
  }
}
