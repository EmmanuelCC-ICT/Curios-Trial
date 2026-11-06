# Career Empire — Daytime Plaza Ground + Paths Texture Kit

Seamless **1024×1024** PNGs for the playable-3d campus plaza (daytime look).
Generated with Python/Pillow (no external APIs).

## Files

| File | Mode | Use |
|------|------|-----|
| `grass_day.png` | RGB | Bright manicured lawn albedo |
| `stone_flag_day.png` | RGB | Irregular light-grey flagstone albedo |
| `asphalt_day.png` | RGB | Dark charcoal road albedo |
| `asphalt_dash_overlay.png` | RGBA | Yellow dashed centre-line (transparent bg) |
| `crosswalk_overlay.png` | RGBA | White zebra stripes (transparent bg) |
| `curb_cyan_trim.png` | RGBA | Restrained cyan curb edge strip |
| `plaza_textures_contact_sheet.png` | RGB | Preview of all six maps |
| `ce-plaza-ground-paths-day-topdown.png` | RGB | Layout reference (if present) |

## Three.js plug-in (MeshStandardMaterial)

```js
const loader = new THREE.TextureLoader();
function loadMap(url, repeatX = 1, repeatY = 1) {
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(repeatX, repeatY);
  return t;
}

// Ground lawn
materials.ground.map = loadMap('./assets/plaza/grass_day.png', 85, 85);

// Flagstone paths / plaza
materials.path.map = loadMap('./assets/plaza/stone_flag_day.png', 4, 12);
materials.path.bumpMap = materials.path.map;
materials.path.bumpScale = 0.028;

// Asphalt roads
materials.asphalt = new THREE.MeshStandardMaterial({
  map: loadMap('./assets/plaza/asphalt_day.png', 8, 2),
  roughness: 0.92,
  color: 0xffffff,
});

// Transparent overlays on thin planes slightly above the road
materials.dash = new THREE.MeshStandardMaterial({
  map: loadMap('./assets/plaza/asphalt_dash_overlay.png', 1, 6),
  transparent: true,
  depthWrite: false,
  roughness: 0.85,
});
materials.crosswalk = new THREE.MeshStandardMaterial({
  map: loadMap('./assets/plaza/crosswalk_overlay.png', 1, 1),
  transparent: true,
  depthWrite: false,
  roughness: 0.8,
});
materials.curb = new THREE.MeshStandardMaterial({
  map: loadMap('./assets/plaza/curb_cyan_trim.png', 8, 1),
  transparent: true,
  depthWrite: false,
  roughness: 0.55,
  metalness: 0.15,
});
```

Copy this folder into `playable-3d/assets/plaza/` (or the plaza playable copy).
`world.js` loads these when present and falls back to procedural canvas textures otherwise.

## Still needs Tripo / Blender

- Town Hall / campus building meshes (GLB)
- Hero fountain / monument sculpt beyond primitives
- Detailed curb geometry, bridges, waterfalls from concept art
- Baked lightmaps / AO if desired later

## Done in Cursor

- Daytime tileable ground + path + road + marking textures
- Expanded plaza path network hooks in playable `world.js`
- Brighter daytime sky / fog / sun defaults
