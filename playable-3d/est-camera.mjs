// A rear wall can shorten the indoor chase distance. Keep that nearer view low
// enough to frame the player and the real briefing screen together.
export function estEyeHeight(horizontalDistance){
 return Math.max(1.2,Math.min(3,3*Math.max(0,horizontalDistance)/4.2));
}

// The wall control must remain reachable below the wrapping phone banner.
export function estPlayTop(projectedY,viewportHeight,headerBottom,buttonHeight){
 const half=buttonHeight/2;
 return Math.min(viewportHeight-half-8,Math.max((1-projectedY)*.5*viewportHeight,headerBottom+half+8));
}
