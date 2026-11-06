// Translate in whole shadow texels, keeping the courtyard anchor continuous.
export function shadowAnchor(position, light, camera, mapSize) {
  const x = position.x - Math.max(-18, Math.min(18, position.x));
  const z = position.z - Math.max(-22, Math.min(22, position.z));
  const length = Math.hypot(...light), horizontal = Math.hypot(light[0], light[2]);
  const back = light.map(v => v / length);
  const right = [light[2] / horizontal, 0, -light[0] / horizontal];
  const up = [-back[1] * right[2], back[2] * right[0] - back[0] * right[2], back[1] * right[0]];
  const sx = (camera.right - camera.left) / mapSize.x;
  const sy = (camera.top - camera.bottom) / mapSize.y;
  const r = Math.round((x * right[0] + z * right[2]) / sx) * sx;
  const u = Math.round((x * up[0] + z * up[2]) / sy) * sy;
  const b = x * back[0] + z * back[2];
  return right.map((v, i) => v * r + up[i] * u + back[i] * b);
}
