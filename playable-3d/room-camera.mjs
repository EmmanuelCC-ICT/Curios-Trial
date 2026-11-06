// A fixed view through the open front of the small rooms. It never follows a
// character into a collision corner or rotates steering behind a wall.
export function roomCameraPose(aspect){const scale=Math.max(1,1.3/Math.max(.35,aspect));return {position:[0,10*scale,14*scale],target:[0,.8,0],fov:65,steeringYaw:0};}
