export const ROCKET_SITE = Object.freeze({
  x: 37,
  z: -114,
  height: 35,
  viewingZ: -93,
  roverX: 54,
  roverZ: -93,
  perimeterRadius: 17
});

// World-space collision boxes are shared with the navigation acceptance tests.
// The deck and marked footpaths are flush, with obstacles confined inside the ring.
export function launchObstacles() {
  const {x, z} = ROCKET_SITE;
  return [
    [x, .61, z, 9.8, 1.22, 7.2],
    [x, .61, z, 7.2, 1.22, 9.8],
    [x, 4, z, 6.8, 8, 6.8],
    [x + 10, 2, z - 3.5, 5.6, 4, 5.6],
    [x - 8, 1, z - 7, 2.8, 2, 2.3],
    [x + 6, 1, z - 9.5, 2.6, 2, 2.4],
    [x - 9.5, 2, z + 5.5, .7, 4, .7],
    [x + 9.5, 2, z + 5.5, .7, 4, .7]
  ];
}

export function rocketApproachFraming(position, yaw, aspect) {
  const {x, viewingZ} = ROCKET_SITE;
  const proximity = Math.max(0, 1 - Math.hypot(position.x - x, position.z - viewingZ) / 11);
  const facing = Math.max(0, (Math.cos(yaw) - .72) / .28);
  return {
    weight: proximity * facing,
    distance: 17 + Math.max(0, .85 - aspect) * 3,
    height: 4.5,
    fov: 78,
    lookY: 14
  };
}

export function isRocketViewingArea(position) {
  return Math.hypot(position.x-ROCKET_SITE.x,position.z-ROCKET_SITE.viewingZ) < 3.1;
}
