import {renderQuality,rendererName} from './render-quality.mjs?v=ecc-ba60122';

// Probe only the backend: no shaders, scene draws or assets. The real renderer
// retains its original context attributes on accelerated devices.
export function needsSoftwarePresentation(document){
 const probe=document.createElement('canvas');let gl;
 try{gl=probe.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});return Boolean(gl)&&renderQuality(rendererName({getContext:()=>gl}),'auto',1).software;}
 catch{return false;}
 finally{gl?.getExtension('WEBGL_lose_context')?.loseContext();}
}

// Software compositors synchronously read visible WebGL canvases during paint.
// Keep the previous complete pixels visible while the next GPU frame finishes.
// Only the existing GPU fence may release a new frame to this 2D display.
export function createSoftwarePresentation(canvas,enabled,document=globalThis.document){
 if(!enabled)return null;
 const frame=document.createElement('canvas'),context=frame.getContext('2d',{alpha:false});
 if(!context)return null;
 frame.id='software-world-frame';frame.setAttribute('aria-hidden','true');
 Object.assign(frame.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
 canvas.before(frame);canvas.style.opacity='0';canvas.dataset.presentation='completed-frame';
 return {present(frameNumber){
  if(frame.width!==canvas.width||frame.height!==canvas.height){frame.width=canvas.width;frame.height=canvas.height;}
  context.drawImage(canvas,0,0);frame.dataset.presented='true';canvas.dataset.presentedFrame=String(frameNumber);
 }};
}
