// Fixed-step intent smoothing. Collision-resolved distance drives the gait.
export const STEP = 1 / 60;
// Retain fixed collision steps during slow renders, with at most half a second
// of catch-up. Hidden views and paused dialogs still reset their accumulator.
export function accumulateTravelTime(previous,elapsed){return Math.min(previous+Math.max(0,elapsed),.5);}
export function createLocomotion() {
  let x = 0, z = 0;
  return {
    reset() { x = z = 0; },
    step(inputX, inputZ, yaw, running) {
      const magnitude = Math.hypot(inputX, inputZ);
      const scale = (running ? 4.6 : 2.8) / Math.max(1, magnitude);
      const targetX = (inputX * Math.cos(yaw) + inputZ * Math.sin(yaw)) * scale;
      const targetZ = (-inputX * Math.sin(yaw) + inputZ * Math.cos(yaw)) * scale;
      const dx = targetX - x, dz = targetZ - z, distance = Math.hypot(dx, dz);
      const amount = Math.min(1, (magnitude ? 20 : 28) * STEP / (distance || 1));
      x += dx * amount; z += dz * amount;
      return {x: x * STEP, z: z * STEP};
    }
  };
}
export function turnTowards(current, x, z, dt) {
  if (Math.hypot(x, z) < .00001) return current;
  const difference = Math.atan2(Math.sin(Math.atan2(x, z) - current), Math.cos(Math.atan2(x, z) - current));
  return current + difference * (1 - Math.exp(-12 * dt));
}
