/** Default teacher showcase at the ECC entrance. Custom teacher positions stay custom. */
export const ENTRANCE_STAGE=Object.freeze({player:Object.freeze({x:8.2,z:3.2}),basil:Object.freeze({x:7.1,z:1.7}),helper:Object.freeze({x:5.8,z:2.8})});
export function usesEntranceStage(config){const basil=config.extraNpcs?.find(n=>n.id==='basil');return Boolean(basil&&Math.hypot(basil.position[0]-ENTRANCE_STAGE.basil.x,basil.position[1]-ENTRANCE_STAGE.basil.z)<.05);}
export function entranceShowcasePose(aspect){
 return aspect<.85?{position:[5,3.6,15],target:[9,1.4,-6],fov:84,shiftX:0,shiftY:.14}:{position:[5,3.4,8],target:[10,1.5,-6],fov:58,shiftX:aspect<1.9?.11:.15,shiftY:0};
}
export const basilEntranceYaw=Math.atan2(5-ENTRANCE_STAGE.basil.x,8-ENTRANCE_STAGE.basil.z);
