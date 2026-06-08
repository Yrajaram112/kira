/**
 * Orb — the centrepiece visual.
 *
 * Three.js sphere with a custom GLSL vertex+fragment shader that:
 *   - Displaces the surface with curl-like noise (intensity scales with state)
 *   - Glows from the inside with a state-tinted colour
 *   - Is wrapped in a 400-particle halo that orbits + drifts
 *
 * State transitions lerp smoothly:
 *   IDLE        slow, dim, barely moving
 *   LISTENING   bright cyan, fast ripple
 *   PROCESSING  purple swirl
 *   EXECUTING   amber, expanding directional shimmer
 *   SPEAKING    green, surface ripples with waveform amplitude
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { stateColor, THEME } from '../styles/theme.js';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAmplitude;
  varying vec3  vNormal;
  varying float vDisplacement;

  // 3D simplex-ish noise (Ashima implementation, abbreviated)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;
    float n = snoise(pos * 1.8 + vec3(uTime * 0.35, 0.0, uTime * 0.21));
    float ripple = snoise(pos * 4.0 + uTime * 1.4);
    float displacement = (n * 0.12 + ripple * 0.04) * uIntensity
                        + uAmplitude * 0.15 * sin(uTime * 6.0 + n * 6.0);
    vec3 displaced = pos + normal * displacement;
    vDisplacement = displacement;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3  vNormal;
  varying float vDisplacement;

  void main() {
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    float coreGlow = 0.55 + 0.4 * sin(uTime * 1.4);
    vec3 base = uColor * (0.45 + vDisplacement * 1.6);
    vec3 rimColor = uColor * (1.0 + uIntensity);
    vec3 color = mix(base, rimColor, rim * 0.9) + uColor * coreGlow * 0.18;
    float alpha = 0.82 + rim * 0.18;
    gl_FragColor = vec4(color, alpha);
  }
`;

const STATE_INTENSITY = {
  IDLE:       0.25,
  LISTENING:  1.0,
  PROCESSING: 0.85,
  EXECUTING:  0.95,
  SPEAKING:   0.9,
};

export default function Orb({ state = 'IDLE', amplitude = 0, onClick }) {
  const mountRef = useRef(null);
  const stateRef = useRef(state);
  const amplitudeRef = useRef(amplitude);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { amplitudeRef.current = amplitude; }, [amplitude]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      uTime:      { value: 0 },
      uIntensity: { value: STATE_INTENSITY.IDLE },
      uAmplitude: { value: 0 },
      uColor:     { value: new THREE.Color(stateColor('IDLE')) },
    };

    const geometry = new THREE.SphereGeometry(1.15, 96, 96);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:   VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    const particles = buildParticles();
    scene.add(particles.points);

    let intensityCurrent = uniforms.uIntensity.value;
    let colorCurrent = new THREE.Color(stateColor('IDLE'));
    let amplitudeCurrent = 0;

    let raf = 0;
    const clock = new THREE.Clock();

    const render = () => {
      const dt = clock.getDelta();
      const t  = clock.getElapsedTime();

      const targetIntensity = STATE_INTENSITY[stateRef.current] ?? 0.4;
      const targetColor = new THREE.Color(stateColor(stateRef.current));

      intensityCurrent += (targetIntensity - intensityCurrent) * Math.min(dt * 4.5, 1);
      colorCurrent.lerp(targetColor, Math.min(dt * 4.5, 1));
      amplitudeCurrent += (amplitudeRef.current - amplitudeCurrent) * Math.min(dt * 12, 1);

      uniforms.uTime.value      = t;
      uniforms.uIntensity.value = intensityCurrent;
      uniforms.uAmplitude.value = amplitudeCurrent;
      uniforms.uColor.value     = colorCurrent;

      orb.rotation.y += dt * (0.18 + intensityCurrent * 0.4);
      orb.rotation.x = Math.sin(t * 0.4) * 0.15;

      particles.tick(dt, intensityCurrent, colorCurrent);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      particles.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="orb-container"
      onClick={onClick}
      title="Click to toggle log"
      style={{ borderRadius: '50%' }}
    />
  );
}

function buildParticles() {
  const COUNT = 400;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    const radius = 1.55 + Math.random() * 0.8;
    const theta  = Math.random() * Math.PI * 2;
    const phi    = Math.acos(2 * Math.random() - 1);
    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
    seeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.025,
    color: new THREE.Color(THEME.states.IDLE),
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);

  const original = positions.slice(0);
  return {
    points,
    dispose() { geometry.dispose(); material.dispose(); },
    tick(dt, intensity, color) {
      material.color.lerp(color, Math.min(dt * 4.5, 1));
      material.opacity = 0.4 + intensity * 0.5;
      const pos = geometry.attributes.position.array;
      const time = performance.now() * 0.001;
      for (let i = 0; i < COUNT; i += 1) {
        const seed = seeds[i];
        const swirl = time * (0.3 + seed * 0.6) * (0.4 + intensity);
        const ox = original[i * 3 + 0];
        const oy = original[i * 3 + 1];
        const oz = original[i * 3 + 2];
        const cs = Math.cos(swirl);
        const sn = Math.sin(swirl);
        pos[i * 3 + 0] = ox * cs - oy * sn;
        pos[i * 3 + 1] = ox * sn + oy * cs;
        pos[i * 3 + 2] = oz + Math.sin(time * 1.4 + seed * 9) * 0.04 * intensity;
      }
      geometry.attributes.position.needsUpdate = true;
      points.rotation.x = Math.sin(time * 0.3) * 0.2;
    },
  };
}
