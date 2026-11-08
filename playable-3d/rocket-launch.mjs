import * as THREE from 'three';
import {ROCKET_SITE, isRocketViewingArea} from './rocket-site.mjs?v=rocket-launch-1';

const COUNTDOWN = 8;
const IGNITION = 1.5;
const FLIGHT = 9;

export function launchFrame(elapsed) {
  if (elapsed < COUNTDOWN) return {phase:'countdown', count:Math.ceil(COUNTDOWN-elapsed), rise:0, thrust:0};
  if (elapsed < COUNTDOWN + IGNITION) {
    return {phase:'ignition', rise:0, thrust:.4+.6*(elapsed-COUNTDOWN)/IGNITION};
  }
  const flight = elapsed-COUNTDOWN-IGNITION;
  if (flight < FLIGHT) return {phase:'flight', rise:1.65*flight*flight, thrust:1};
  return {phase:'complete', rise:0, thrust:0};
}

export function createRocketLaunch(site, status) {
  const rocket = site.getObjectByName('Curios Rocket Assembly');
  const restingY = rocket.position.y;
  const exhaust = new THREE.Group();
  rocket.add(exhaust);
  const flame = new THREE.ConeGeometry(.55, 1, 20, 1, true);
  flame.rotateZ(Math.PI);
  flame.translate(0,-.5,0);
  const halo = new THREE.MeshBasicMaterial({color:0xff9635,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const core = new THREE.MeshBasicMaterial({color:0xfff2b2});
  const hotGas = new THREE.SphereGeometry(.58,16,8);
  for (const [x,z] of [[0,0],[-1.12,-1.12],[1.12,-1.12],[-1.12,1.12],[1.12,1.12]]) {
    const outer = new THREE.Mesh(flame, halo), inner = new THREE.Mesh(flame, core);
    outer.position.set(x,.08,z);
    inner.position.copy(outer.position);
    inner.scale.set(.66,.65,.66);
    const glow = new THREE.Mesh(hotGas,core);
    glow.position.set(x,.025,z);
    glow.scale.y=.24;
    exhaust.add(outer,inner,glow);
  }
  const light = new THREE.PointLight(0xffae51,0,22);
  light.position.y = -.2;
  exhaust.add(light);
  exhaust.visible = false;

  // One draw call for the drifting exhaust cloud, with a soft edge and
  // per-particle spread/fade. No external textures or per-frame allocations.
  const capacity = 96;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(capacity*3);
  const sizes = new Float32Array(capacity);
  const opacity = new Float32Array(capacity);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('puffSize',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('opacity',new THREE.BufferAttribute(opacity,1).setUsage(THREE.DynamicDrawUsage));
  const smoke = new THREE.Points(geometry,new THREE.ShaderMaterial({
    transparent:true, depthWrite:false,
    uniforms:{viewportHeight:{value:720}},
    vertexShader:`
      uniform float viewportHeight;
      attribute float puffSize;
      attribute float opacity;
      varying float alpha;
      void main(){
        vec4 view = modelViewMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(puffSize * projectionMatrix[1][1] * viewportHeight / max(2.0,-2.0*view.z), 1.0, 180.0);
        alpha = opacity;
      }`,
    fragmentShader:`
      varying float alpha;
      void main(){
        vec2 p = gl_PointCoord-.5;
        float edge = 1.0-smoothstep(.08,.49,length(p));
        float detail = .86+.14*cos(p.x*20.0)*sin(p.y*19.0);
        gl_FragColor = vec4(vec3(.78,.78,.75)*detail,alpha*edge);
      }`
  }));
  smoke.frustumCulled = false;
  smoke.visible = false;
  smoke.onBeforeRender = renderer => { smoke.material.uniforms.viewportHeight.value = renderer.domElement.height; };
  site.add(smoke);

  let frame = null;
  let elapsed = 0;
  let label = '';
  function update(dt, viewing, reducedMotion) {
    if (frame && frame.phase !== 'complete') frame = launchFrame(elapsed += dt);
    const {phase, count, rise, thrust} = frame || {rise:0,thrust:0};
    rocket.visible = phase !== 'complete';
    rocket.position.y = restingY + rise;
    exhaust.visible = thrust > 0;
    smoke.visible = thrust > 0;
    if (thrust) {
      const flicker = reducedMotion ? 1 : 1+.12*Math.sin(elapsed*36);
      exhaust.scale.y = (rise ? 5+thrust*5 : 2.2)*flicker;
      light.intensity = 120*thrust*flicker;
      const burn = elapsed-COUNTDOWN;
      for (let i=0;i<capacity;i++) {
        const age = (i+.5)*4/capacity;
        const angle = i*2.399963 + (reducedMotion ? 0 : burn*.65);
        const spread = age*(3.1+(i%5)*.3);
        const emissionFlight = Math.max(0,burn-age-IGNITION);
        const emissionY = 1.65*emissionFlight*emissionFlight;
        positions[i*3] = Math.cos(angle)*spread + age*.6;
        positions[i*3+1] = Math.max(.4,emissionY+1-age*4) + age*.5;
        positions[i*3+2] = Math.sin(angle)*spread;
        sizes[i] = 1.2+age*2.6;
        opacity[i] = burn > age ? (1-age/4)*.43 : 0;
      }
      for (const attribute of Object.values(geometry.attributes)) attribute.needsUpdate = true;
    }
    const next = phase==='countdown' ? `T−${count} · Launch countdown` :
      phase==='ignition' ? 'Engine ignition' : phase==='flight' ? 'Liftoff!' : '';
    if (next !== label) status.textContent = label = next;
    status.hidden = !viewing || !label;
  }
  function interaction(position) {
    if (!isRocketViewingArea(position)) return null;
    if (!frame) return {label:'Start launch countdown · E', action:()=>{ if (!frame) frame = launchFrame(elapsed=0); }};
    if (frame.phase==='complete') return {label:'Reset rocket for another launch · E', action:()=>{ if (frame?.phase==='complete') frame = null; }};
    return null;
  }
  function cameraPose(position) {
    if (!isRocketViewingArea(position) || !frame || frame.phase==='complete') return null;
    const rise = frame.rise;
    return {
      eye:[ROCKET_SITE.x,4.5,ROCKET_SITE.viewingZ+17],
      target:[ROCKET_SITE.x,15+rise*.86,ROCKET_SITE.z+10],
      fov:78
    };
  }
  return {update,interaction,cameraPose};
}
