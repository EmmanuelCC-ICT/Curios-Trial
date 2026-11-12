/** Default teacher showcase at the ECC entrance. Custom teacher positions stay custom. */
export const ENTRANCE_STAGE=Object.freeze({player:Object.freeze({x:7,z:4}),basil:Object.freeze({x:7.1,z:2.2}),helper:Object.freeze({x:5.8,z:2.8})});
export function usesEntranceStage(config){return config.extraNpcs.length===0||Boolean(config.extraNpcs.find(n=>n.id==='basil'));}
export function entranceShowcasePose(aspect){
 return aspect<.85?{position:[7,7,40],target:[8,2,-8],fov:82,shiftX:0,shiftY:.05}:{position:[7,5,18],target:[8,2,-8],fov:60,shiftX:0,shiftY:0};
}
export const basilEntranceYaw=Math.atan2(5-ENTRANCE_STAGE.basil.x,8-ENTRANCE_STAGE.basil.z);
