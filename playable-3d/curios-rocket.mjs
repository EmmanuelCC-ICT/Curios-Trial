import * as THREE from 'three';
import {batchStatic} from './environment/static-batching.js';
import {ROCKET_SITE, launchObstacles} from './rocket-site.mjs';

const TAU = Math.PI * 2;
const material = (color, roughness, metalness = 0) =>
  new THREE.MeshStandardMaterial({color, roughness, metalness});
const ivory = material(0xe8edf0, .32, .23);
const seam = material(0xa4b1bc, .48, .38);
const navy = material(0x102239, .35, .45);
const steel = material(0x697b88, .4, .62);
const dark = material(0x222f38, .59, .45);
const gold = material(0xb69959, .44, .56);
const teal = new THREE.MeshStandardMaterial({
  color: 0x56e3e3, emissive: 0x1ca5b8, emissiveIntensity: .65, roughness: .35
});
const lamp = new THREE.MeshBasicMaterial({color: 0xdafaff});
const amber = new THREE.MeshBasicMaterial({color: 0xffbc58});
const pavement = material(0x979b96, .91);
const curb = material(0x454d53, .85);
const paint = material(0xe1d6a8, .8);

function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const part = new THREE.Mesh(geometry, surface);
  part.position.set(x, y, z);
  part.receiveShadow = true;
  parent.add(part);
  return part;
}
const box = (parent, w, h, d, surface, x, y, z) =>
  mesh(parent, new THREE.BoxGeometry(w, h, d), surface, x, y, z);
const cylinder = (parent, top, bottom, height, surface, x, y, z, sides = 48) =>
  mesh(parent, new THREE.CylinderGeometry(top, bottom, height, sides), surface, x, y, z);
function beam(parent, from, to, width, surface) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const direction = b.clone().sub(a);
  const member = box(parent, width, direction.length(), width, surface, ...a.lerp(b, .5).toArray());
  member.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}
function ring(parent, radius, width, y, surface) {
  const part = mesh(parent, new THREE.RingGeometry(radius - width / 2, radius + width / 2, 96), surface, 0, y, 0);
  part.rotation.x = -Math.PI / 2;
}
function plateMaterial(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return new THREE.MeshBasicMaterial({map: texture});
}
function buildVehicle() {
  const body = new THREE.Group();
  body.name = 'Curios Rocket airframe';
  const shell = [
    [2.36, 2.05, 4.45, navy],
    [2.45, 4.45, 12.8, ivory],
    [2.47, 12.8, 15.45, navy],
    [2.45, 15.45, 25.3, ivory],
    [2.44, 25.3, 27.3, navy]
  ];
  for (const [radius, low, high, surface] of shell) {
    cylinder(body, radius, radius, high - low, surface, 0, (low + high) / 2, 0, 64);
  }
  // Tangent ogive nose with a metallic tip and clean shoulder transition.
  const length = 7.7;
  const radius = 2.44;
  const ogive = (length ** 2 + radius ** 2) / (2 * radius);
  const profile = Array.from({length: 37}, (_, i) => {
    const y = length * i / 36;
    return new THREE.Vector2(Math.max(0, Math.sqrt(ogive ** 2 - y ** 2) + radius - ogive), y);
  });
  mesh(body, new THREE.LatheGeometry(profile, 64), ivory, 0, 27.3, 0);
  cylinder(body, 0, .42, .77, steel, 0, 34.615, 0, 32);
  for (const [y, r, surface] of [
    [2.14, 2.39, steel], [4.47, 2.49, steel], [5.05, 2.48, gold],
    [8.5, 2.46, seam], [12.78, 2.49, steel], [13.08, 2.49, teal],
    [15.42, 2.49, steel], [20.25, 2.46, seam], [24.84, 2.47, seam],
    [25.55, 2.47, gold], [27.27, 2.46, teal]
  ]) {
    cylinder(body, r, r, .07, surface, 0, y, 0, 64);
  }
  // Body panels, external raceways and riveted access plates.
  for (let i = 0; i < 12; i++) {
    const angle = i * TAU / 12;
    for (const [y, h] of [[6.8, 2.6], [10.5, 3.4], [18, 4.2], [23, 3.3]]) {
      const panel = box(body, .035, h, .025, seam, Math.sin(angle) * 2.449, y, Math.cos(angle) * 2.449);
      panel.rotation.y = angle;
    }
    for (const y of [4.31, 12.65, 15.58, 25.16]) {
      const fastener = box(body, .085, .11, .045, steel, Math.sin(angle) * 2.46, y, Math.cos(angle) * 2.46);
      fastener.rotation.y = angle;
    }
  }
  for (const angle of [-1.05, 1.05, Math.PI]) {
    const x = 2.47 * Math.sin(angle);
    const z = 2.47 * Math.cos(angle);
    const raceway = box(body, .18, 6.6, .16, navy, x, 8.9, z);
    raceway.rotation.y = angle;
    const hatch = box(body, .47, .82, .09, steel, x, 23.2, z);
    hatch.rotation.y = angle;
  }
  const branding = plateMaterial(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#e8edf0';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0d3148';
    ctx.font = '800 48px Arial';
    ctx.fillText('CURIOS', w / 2, 92);
    ctx.fillStyle = '#008b92';
    ctx.font = 'italic 900 130px Arial';
    Array.from('CURIOS').forEach((letter, i) => ctx.fillText(letter, w / 2, 215 + i * 123));
    ctx.fillStyle = '#19394c';
    ctx.font = '700 31px Arial';
    ctx.fillText('BEYOND EARTH', w / 2, h - 44);
  });
  mesh(body, new THREE.CylinderGeometry(2.46, 2.46, 9.3, 32, 1, true, -.46, .92), branding, 0, 20.3, 0);
  const mission = plateMaterial(768, 352, (ctx, w, h) => {
    ctx.fillStyle = '#102239';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8a66c';
    ctx.fillRect(0, 20, w, 4);
    ctx.fillRect(0, h - 23, w, 4);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#80ebec';
    ctx.font = '800 71px Arial';
    ctx.fillText('MOON MISSION', w / 2, 122);
    ctx.fillStyle = '#eef1e9';
    ctx.font = '700 53px Arial';
    ctx.fillText('MAKE IT MATTER', w / 2, 214);
    ctx.font = '700 39px Arial';
    ctx.fillText('YEAR 8  /  2027', w / 2, 287);
  });
  mesh(body, new THREE.CylinderGeometry(2.48, 2.48, 2.05, 30, 1, true, -.73, 1.46), mission, 0, 14.26, 0);
  // Five open engine bells and structural radial fins. The bells are inert.
  const nozzle = [[.66, 0], [.73, .09], [.67, .39], [.52, .87], [.36, 1.46], [.32, 1.85],
    [.25, 1.85], [.29, 1.42], [.44, .84], [.57, .32], [.59, .06], [.66, 0]];
  for (const [x, z] of [[0, 0], [-1.12, -1.12], [1.12, -1.12], [-1.12, 1.12], [1.12, 1.12]]) {
    mesh(body, new THREE.LatheGeometry(nozzle.map(([r, y]) => new THREE.Vector2(r, y)), 32), steel, x, 0, z);
    cylinder(body, .69, .69, .09, dark, x, .075, z, 32);
    cylinder(body, .35, .35, .09, gold, x, 1.52, z, 24);
    cylinder(body, .53, .38, .38, dark, x, 1.96, z, 24);
  }
  const outline = new THREE.Shape();
  outline.moveTo(2.13, 2.3);
  outline.lineTo(3.63, 2.22);
  outline.lineTo(3.43, 3.48);
  outline.lineTo(2.21, 6.15);
  outline.closePath();
  const fin = new THREE.ExtrudeGeometry(outline, {depth: .19, bevelEnabled: true, bevelSize: .055, bevelThickness: .05, bevelSegments: 1, steps: 1});
  fin.translate(0, 0, -.095);
  for (let i = 0; i < 4; i++) mesh(body, fin, navy).rotation.y = i * Math.PI / 2 + Math.PI / 4;

  const vehicle = new THREE.Group();
  vehicle.name = 'Curios Rocket Assembly';
  vehicle.userData.heightMetres = ROCKET_SITE.height;
  vehicle.add(batchStatic(body));
  return vehicle;
}

function buildFacility() {
  const facility = new THREE.Group();
  facility.name = 'Launch pad and service infrastructure';
  cylinder(facility, 11, 11.15, .14, pavement, 0, -.045, 0, 96);
  ring(facility, 10.55, .19, .03, paint);
  ring(facility, 17, 2.25, .018, pavement);
  ring(facility, 16.07, .065, .023, paint);
  ring(facility, 17.93, .065, .023, paint);
  cylinder(facility, 4.95, 5.08, 1.18, curb, 0, .59, 0, 64);
  cylinder(facility, 4.25, 4.58, .22, steel, 0, 1.18, 0, 64);
  ring(facility, 4.28, .17, 1.297, gold);
  for (let i = 0; i < 24; i++) {
    const angle = i * TAU / 24;
    const mark = box(facility, .34, .014, 1.05, i % 3 === 0 ? paint : ivory, Math.sin(angle) * 9.75, .033, Math.cos(angle) * 9.75);
    mark.rotation.y = angle;
  }
  for (const x of [-3.35, 3.35]) {
    for (const z of [-2.7, 2.7]) {
      box(facility, .46, .95, .62, steel, x, 1.57, z);
      beam(facility, [x, 1.35, z], [x * .64, 2.1, z * .64], .23, gold);
    }
  }

  const towerX = 10;
  const towerZ = -3.5;
  box(facility, 5.6, .39, 5.6, pavement, towerX, .195, towerZ);
  for (const x of [-2.14, 2.14]) {
    for (const z of [-2.14, 2.14]) {
      box(facility, .33, 32.8, .33, steel, towerX + x, 16.4, towerZ + z);
      box(facility, .78, .55, .78, curb, towerX + x, .55, towerZ + z);
    }
  }
  for (let level = 0; level < 8; level++) {
    const low = .6 + level * 4.02;
    const high = low + 4.02;
    for (const side of [-1, 1]) {
      const z = towerZ + side * 2.14;
      const x = towerX + side * 2.14;
      beam(facility, [towerX - 2.14, low, z], [towerX + 2.14, low, z], .22, navy);
      beam(facility, [x, low, towerZ - 2.14], [x, low, towerZ + 2.14], .22, navy);
      beam(facility, [towerX - 2.14, low, z], [towerX + 2.14, high, z], .125, steel);
      beam(facility, [towerX + 2.14, low, z], [towerX - 2.14, high, z], .125, steel);
      beam(facility, [x, low, towerZ - 2.14], [x, high, towerZ + 2.14], .125, steel);
      beam(facility, [x, low, towerZ + 2.14], [x, high, towerZ - 2.14], .125, steel);
    }
  }
  box(facility, 1.19, 31.1, 1.16, navy, towerX + .82, 15.9, towerZ);
  for (const y of [8.65, 16.68, 24.72, 32.65]) {
    box(facility, 4.82, .22, 4.82, dark, towerX, y, towerZ);
    for (const side of [-1, 1]) {
      box(facility, 4.8, .07, .075, gold, towerX, y + .94, towerZ + side * 2.34);
      box(facility, .075, .07, 4.8, gold, towerX + side * 2.34, y + .94, towerZ);
      for (const offset of [-2.3, 0, 2.3]) box(facility, .06, .91, .06, steel, towerX + offset, y + .47, towerZ + side * 2.34);
    }
  }
  // Service bridge stays attached to the tower with clearance from the airframe.
  for (const y of [16.68, 24.72]) {
    box(facility, 4.92, .19, 1.48, dark, 5.66, y, -.65);
    for (const z of [-1.39, .09]) {
      beam(facility, [3.2, y + .92, z], [8.12, y + .92, z], .065, gold);
      beam(facility, [3.2, y, z], [8.12, y - 2.1, z], .13, steel);
      for (const x of [3.2, 4.85, 6.5, 8.12]) box(facility, .06, .92, .06, steel, x, y + .46, z);
    }
  }
  cylinder(facility, .045, .12, 3.4, steel, towerX, 34.35, towerZ, 12);
  cylinder(facility, .15, .15, .19, amber, towerX, 36.1, towerZ, 12);

  for (const [x, z] of [[-9.5, 5.5], [9.5, 5.5]]) {
    cylinder(facility, .09, .16, 6.1, steel, x, 3.05, z, 12);
    box(facility, 1.5, .11, .16, steel, x, 6.05, z);
    for (const dx of [-.52, .52]) {
      const housing = box(facility, .68, .34, .32, navy, x + dx, 6.06, z);
      housing.rotation.x = -.25;
      const lens = box(facility, .58, .25, .055, lamp, x + dx, 6.06, z - .173);
      lens.rotation.x = -.25;
    }
  }
  for (const [x, z] of [[-8, -7], [6, -9.5]]) {
    box(facility, 2.58, .2, 2.25, curb, x, .1, z);
    for (const dx of [-.53, .53]) {
      cylinder(facility, .43, .43, 1.28, ivory, x + dx, .88, z, 24);
      cylinder(facility, .28, .42, .19, steel, x + dx, 1.605, z, 24);
      cylinder(facility, .445, .445, .12, navy, x + dx, .77, z, 24);
      beam(facility, [x + dx, 1.71, z], [x + dx, 1.71, z + .65], .09, gold);
    }
    box(facility, 2.46, .72, .48, navy, x, .46, z + .79);
    for (let i = 0; i < 8; i++) box(facility, .18, .1, .035, i % 2 ? paint : dark, x - .83 + i * .24, .57, z + 1.04);
  }
  // Low pedestrian link from the Lab, plus a separate rover pull-off.
  box(facility, 3.4, .024, 19.7, pavement, 0, .008, 25.7);
  box(facility, 8, .026, 3.8, pavement, 0, .011, 21);
  box(facility, 6.2, .024, 5.2, curb, 17, .011, 21);
  box(facility, 13.3, .023, 1.65, pavement, 8.65, .009, 21);
  for (const x of [-2.8, 2.8]) box(facility, .12, .008, 4.65, paint, 17 + x, .03, 21);
  const signFace = plateMaterial(1024, 384, (ctx, w, h) => {
    ctx.fillStyle = '#102239';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b69959';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#72e6e4';
    ctx.font = '800 85px Arial';
    ctx.fillText('ROCKET LAUNCH PAD', w / 2, 146);
    ctx.fillStyle = '#f0efe7';
    ctx.font = '700 53px Arial';
    ctx.fillText('BEYOND EARTH  /  YEAR 8', w / 2, 233);
    ctx.font = '700 37px Arial';
    ctx.fillText('VIEWING AREA  •  MAKE IT MATTER', w / 2, 310);
  });
  const sign = mesh(facility, new THREE.PlaneGeometry(5.1, 1.91), signFace, 0, .047, 21.85);
  sign.rotation.x = -Math.PI / 2;
  return batchStatic(facility);
}

export function installRocketLaunchPad(scene, physics) {
  const existing = scene.getObjectByName('Curios Rocket Launch Pad');
  if (existing) return existing;

  const root = new THREE.Group();
  root.name = 'Curios Rocket Launch Pad';
  root.position.set(ROCKET_SITE.x, 0, ROCKET_SITE.z);
  const rocket = buildVehicle();
  rocket.position.y = 1.3;
  root.add(buildFacility(), rocket);
  for (const obstacle of launchObstacles()) physics.block(...obstacle);
  scene.add(root);
  return root;
}
