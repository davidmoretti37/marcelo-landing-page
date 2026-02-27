"use client";

import { useRef, useEffect, useCallback, useState, createContext, useContext } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import GeoJsonGeometry from "three-geojson-geometry";
import { feature } from "topojson-client";

/*
  PROXY OBJECT — scenes animate this directly with GSAP.
  The render loop reads it every frame. No React re-renders.
*/
const PROXY_DEFAULTS = {
  camX: 0,
  camY: 0,
  camZ: 5,
  lookX: 0,
  lookY: 0,
  lookZ: 0,
  rotY: Math.PI / 2,
  posZ: 0,
  exposure: 1.0,
  autoRotate: false,
  showPlane: 0,
  globeVisible: 0,
  globePosX: 5,
  globePosY: 0,
  globeRotY: Math.PI * 1.4,
  arcProgress: 0,
  skyDarkness: 0,
  terrainOpacity: 0,
  terrainScroll: 0,
};

export const planeProxy = { ...PROXY_DEFAULTS };

function resetProxy() {
  Object.assign(planeProxy, PROXY_DEFAULTS);
}

/* React state — only for discrete changes (visibility, model swap) */
interface PlaneState {
  visible: boolean;
  modelIndex: number;
}

const Ctx = createContext<{ state: PlaneState; setState: (s: Partial<PlaneState>) => void }>({
  state: { visible: true, modelIndex: 0 },
  setState: () => {},
});

export function usePlaneControls() {
  return useContext(Ctx);
}

export function PlaneProvider({ children }: { children: React.ReactNode }) {
  const [state, setFull] = useState<PlaneState>({ visible: true, modelIndex: 0 });
  const setState = useCallback((p: Partial<PlaneState>) => setFull((s) => ({ ...s, ...p })), []);
  return <Ctx.Provider value={{ state, setState }}>{children}</Ctx.Provider>;
}


/* ── Star Shaders ── */

const starVertexShader = /* glsl */ `
  attribute float aStar;
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vColor = color;
    float twinkle = 0.6 + 0.4 * sin(uTime * (1.5 + aStar * 3.0) + aStar * 6.28);
    vAlpha = twinkle;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (0.8 + aStar * 1.5) * (200.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const starFragmentShader = /* glsl */ `
  precision highp float;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float glow = exp(-dist * 6.0);
    float edge = smoothstep(0.5, 0.15, dist);
    float alpha = glow * edge * vAlpha;
    gl_FragColor = vec4(vColor * (0.8 + glow * 0.2), alpha);
  }
`;

/* ── Terrain Shaders ── */

const terrainVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;
  varying float vElevation;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  void main() {
    vec3 pos = position;
    vec3 noisePos = pos + vec3(0.0, 0.0, uTime * -30.0);
    float noise1 = cnoise(noisePos * 0.08);
    float noise2 = cnoise(noisePos * 0.06);
    float noise3 = cnoise(noisePos * 0.4);
    float edge = sin(radians(clamp(pos.x / 30.0, -1.0, 1.0) * 90.0));
    float elevation = noise1 * edge * 2.0
                    + noise2 * edge * 2.0
                    + noise3 * (abs(edge) * 0.5 + 0.1);
    pos.z += elevation;
    vElevation = clamp(elevation / 3.0, 0.0, 1.0);
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const terrainFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  varying vec3 vPosition;
  varying float vElevation;

  void main() {
    float distFade = clamp((50.0 - length(vPosition.xy)) / 50.0, 0.0, 1.0);
    vec3 navy = vec3(0.047, 0.071, 0.125);
    vec3 gold = vec3(0.722, 0.592, 0.416);
    float heightMix = smoothstep(0.0, 1.0, vElevation);
    vec3 color = mix(navy, gold, heightMix * 0.6);
    color += gold * 0.1 * pow(distFade, 3.0);
    float alpha = distFade * 0.5 * uOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Starfield factory ── */

function createStarfield(scene: THREE.Scene) {
  const COUNT = 300;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);

  // Color palette: white (70%), warm gold (15%), cool blue (15%)
  const palette = [
    { r: 1.0, g: 1.0, b: 1.0, weight: 0.70 },
    { r: 1.0, g: 0.9, b: 0.7, weight: 0.15 },
    { r: 0.7, g: 0.8, b: 1.0, weight: 0.15 },
  ];

  for (let i = 0; i < COUNT; i++) {
    // Full sphere of stars centered at Y=60 (via group offset)
    // R=30-50 — spacious spread. Bottom at Y=60-50=10, but camera
    // only looks up toward stars when camY>25, so no overlap with clouds.
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1); // full sphere
    const radius = 30 + Math.random() * 20;

    positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta); // X
    positions[i * 3 + 1] = radius * Math.cos(phi);                    // Y (up axis)
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta); // Z

    // Pick color from weighted palette
    const roll = Math.random();
    let cumulative = 0;
    let chosen = palette[0];
    for (const p of palette) {
      cumulative += p.weight;
      if (roll < cumulative) { chosen = p; break; }
    }
    colors[i * 3] = chosen.r;
    colors[i * 3 + 1] = chosen.g;
    colors[i * 3 + 2] = chosen.b;

    seeds[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aStar", new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    uniforms: {
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  // Position star sphere high above clouds — camera enters it during space section
  points.position.y = 110;
  scene.add(points);

  return {
    update(time: number) {
      mat.uniforms.uTime.value = time;
    },
    dispose() {
      scene.remove(points);
      geo.dispose();
      mat.dispose();
    },
  };
}

/* ── Sky gradient background (supports darkness transition) ── */

function createSkySystem() {
  const c = document.createElement("canvas");
  c.width = 2;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Sky color stops [r, g, b] — refined high-altitude palette
  // Desaturated steel-blues, like looking out a jet window at FL410
  const skyStops = [
    { pos: 0,    sky: [28, 42, 68],    space: [4, 4, 12] },
    { pos: 0.2,  sky: [52, 72, 108],   space: [4, 6, 16] },
    { pos: 0.4,  sky: [88, 115, 152],  space: [5, 8, 20] },
    { pos: 0.6,  sky: [128, 155, 185], space: [5, 8, 18] },
    { pos: 0.75, sky: [165, 185, 205], space: [4, 6, 14] },
    { pos: 0.9,  sky: [195, 208, 220], space: [3, 5, 12] },
    { pos: 1,    sky: [210, 220, 230], space: [3, 5, 12] },
  ];

  let lastDarkness = -1;

  function update(darkness: number) {
    const d = Math.max(0, Math.min(1, darkness));
    // Only redraw when value changes meaningfully
    if (Math.abs(d - lastDarkness) < 0.005) return;
    lastDarkness = d;

    const g = ctx.createLinearGradient(0, 0, 0, 512);
    for (const s of skyStops) {
      const r = Math.round(s.sky[0] + (s.space[0] - s.sky[0]) * d);
      const gv = Math.round(s.sky[1] + (s.space[1] - s.sky[1]) * d);
      const b = Math.round(s.sky[2] + (s.space[2] - s.sky[2]) * d);
      g.addColorStop(s.pos, `rgb(${r},${gv},${b})`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 512);
    tex.needsUpdate = true;
  }

  update(0); // Initial sky
  return { tex, update };
}

/* ── Cloud formation layout — stacked sprite approach ── */

interface CloudFormation {
  cx: number; cy: number; cz: number;
  spreadX: number; spreadY: number; spreadZ: number;
  count: number;
}

function generateCloudFormations(): CloudFormation[] {
  return [
    // ── CLOSE CLOUDS (Y: -3 to 2) — Z: 0 to +4 — rush past first ──
    { cx: -5,  cy: -2,  cz: 3,   spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 14 },
    { cx:  6,  cy: 0,   cz: 2,   spreadX: 2.5, spreadY: 1.0, spreadZ: 0.6, count: 12 },
    { cx:  0,  cy: 1,   cz: 4,   spreadX: 3.5, spreadY: 1.2, spreadZ: 1.0, count: 14 },
    { cx: -9,  cy: -1,  cz: 1,   spreadX: 2.5, spreadY: 0.8, spreadZ: 0.5, count: 10 },
    { cx:  10, cy: 2,   cz: 2,   spreadX: 2.5, spreadY: 0.8, spreadZ: 0.7, count: 12 },
    { cx: -15, cy: 0,   cz: 3,   spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 10 },

    // ── NEAR CLOUDS (Y: 3 to 7) — Z: -3 to -8 — second wave ──
    { cx: -10, cy: 4,   cz: -4,  spreadX: 4.0, spreadY: 1.2, spreadZ: 1.0, count: 14 },
    { cx:  12, cy: 5,   cz: -6,  spreadX: 3.5, spreadY: 1.0, spreadZ: 0.8, count: 12 },
    { cx:  3,  cy: 6,   cz: -3,  spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 12 },
    { cx: -6,  cy: 3,   cz: -5,  spreadX: 3.5, spreadY: 1.0, spreadZ: 0.7, count: 12 },
    { cx:  16, cy: 7,   cz: -7,  spreadX: 3.0, spreadY: 0.8, spreadZ: 0.8, count: 10 },

    // ── MID CLOUDS (Y: 8 to 13) — Z: -10 to -16 — slower pass ──
    { cx: -14, cy: 9,   cz: -11, spreadX: 5.0, spreadY: 1.5, spreadZ: 1.5, count: 16 },
    { cx:  0,  cy: 11,  cz: -13, spreadX: 5.5, spreadY: 1.5, spreadZ: 1.8, count: 16 },
    { cx:  10, cy: 10,  cz: -10, spreadX: 4.5, spreadY: 1.2, spreadZ: 1.2, count: 14 },
    { cx: -8,  cy: 12,  cz: -14, spreadX: 4.0, spreadY: 1.0, spreadZ: 1.0, count: 12 },
    { cx:  18, cy: 8,   cz: -12, spreadX: 4.0, spreadY: 1.2, spreadZ: 1.2, count: 12 },

    // ── FAR CLOUDS (Y: 15 to 22) — Z: -18 to -28 — majestic slow pass ──
    { cx: -12, cy: 16,  cz: -20, spreadX: 7.0, spreadY: 2.0, spreadZ: 2.5, count: 16 },
    { cx:  8,  cy: 18,  cz: -22, spreadX: 6.0, spreadY: 1.8, spreadZ: 2.0, count: 14 },
    { cx:  0,  cy: 20,  cz: -25, spreadX: 8.0, spreadY: 2.0, spreadZ: 3.0, count: 18 },
    { cx: -18, cy: 17,  cz: -18, spreadX: 6.5, spreadY: 1.5, spreadZ: 2.0, count: 14 },
    { cx:  16, cy: 21,  cz: -24, spreadX: 7.0, spreadY: 2.0, spreadZ: 2.5, count: 14 },
    { cx: -5,  cy: 15,  cz: -28, spreadX: 9.0, spreadY: 2.5, spreadZ: 3.5, count: 16 },
  ];
}

/* ── The Three.js canvas ── */
export default function PlaneCanvas() {
  const box = useRef<HTMLDivElement>(null);
  const { state } = usePlaneControls();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const curIdx = useRef(-1);
  const loaderRef = useRef<GLTFLoader | null>(null);
  const rafRef = useRef<number>(0);
  const modelsPath = useRef(["/airplane.glb", "/airplane2.glb"]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    resetProxy();

    // ── Renderer ──
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping; // preserve sky & cloud colors exactly
    rendererRef.current = r;

    // ── Scene ──
    const sc = new THREE.Scene();
    const sky = createSkySystem();
    sc.background = sky.tex;
    sceneRef.current = sc;

    // ── Camera (looking straight ahead into the clouds) ──
    const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
    cam.position.set(0, 0, 5);
    cam.lookAt(0, 0, 0);
    cameraRef.current = cam;

    // ── Cloud system — stacked texture sprites for volumetric look ──
    const cloudTexture = new THREE.TextureLoader().load("/cloud.png");
    cloudTexture.colorSpace = THREE.SRGBColorSpace;

    interface CloudSpriteData {
      mesh: THREE.Mesh;
      homeX: number;
      homeY: number;
      homeZ: number;
      baseOpacity: number;
      rotQ: THREE.Quaternion;
    }

    const cloudSprites: CloudSpriteData[] = [];
    const cloudGroup = new THREE.Group();
    const spriteGeo = new THREE.PlaneGeometry(1, 1);
    const formations = generateCloudFormations();

    for (const f of formations) {
      for (let i = 0; i < f.count; i++) {
        // Uniform distribution within ellipsoid (cube root for even volume fill)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random());

        const ox = f.spreadX * r * Math.sin(phi) * Math.cos(theta);
        const oy = f.spreadY * r * Math.sin(phi) * Math.sin(theta);
        const oz = f.spreadZ * r * Math.cos(phi);

        const x = f.cx + ox;
        const y = f.cy + oy;
        const z = f.cz + oz;

        // Core sprites (near center): larger + more opaque
        // Edge sprites (far from center): smaller + wispy
        const baseScale = THREE.MathUtils.lerp(3.5, 1.2, r) * (0.8 + Math.random() * 0.4);
        const baseOpacity = THREE.MathUtils.lerp(0.25, 0.06, r) * (0.7 + Math.random() * 0.6);

        const mat = new THREE.MeshBasicMaterial({
          map: cloudTexture,
          color: new THREE.Color(0.85, 0.88, 0.92), // subtle cool blue-gray tint
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
          blending: THREE.NormalBlending,
          toneMapped: false,
          opacity: baseOpacity,
        });

        const mesh = new THREE.Mesh(spriteGeo, mat);
        mesh.position.set(x, y, z);
        mesh.scale.setScalar(baseScale);

        // Pre-compute local z-rotation quaternion (each sprite rotated differently)
        const rotQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.random() * Math.PI * 2,
        );

        cloudSprites.push({ mesh, homeX: x, homeY: y, homeZ: z, baseOpacity, rotQ });
        cloudGroup.add(mesh);
      }
    }
    sc.add(cloudGroup);

    // ── Starfield (THREE.Points inside this scene) ──
    const starfield = createStarfield(sc);

    // ── GLSL Terrain Hills ──
    const terrainGeo = new THREE.PlaneGeometry(60, 120, 128, 128);
    const terrainMat = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.set(0, -2, -30);
    terrainMesh.renderOrder = -1;
    terrainMesh.frustumCulled = false;
    terrainMesh.visible = false;
    sc.add(terrainMesh);

    // ── Premium Globe ──
    const GLOBE_R = 1.5;
    const globeGroup = new THREE.Group();
    globeGroup.visible = false;
    sc.add(globeGroup);

    // Globe sphere — MeshStandardMaterial with emissiveMap for glowing city lights
    const globeGeo = new THREE.SphereGeometry(GLOBE_R, 64, 32);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      roughness: 0.85,
      metalness: 0.1,
      emissive: new THREE.Color(0xffaa44),
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    new THREE.TextureLoader().load("/earth-night.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      globeMat.map = tex;
      globeMat.emissiveMap = tex; // City lights GLOW
      globeMat.needsUpdate = true;
    });

    // Fresnel atmosphere — view-dependent rim glow, gold tint
    const atmosGeo = new THREE.SphereGeometry(GLOBE_R * 1.03, 64, 32);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          rim = pow(rim, 5.0) * 0.8;
          gl_FragColor = vec4(glowColor * rim, rim);
        }
      `,
      uniforms: {
        glowColor: { value: new THREE.Color(0xb8976a) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    // Country outlines — GeoJSON → LineSegments on the sphere
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then((world: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = world as any;
        const countries = feature(w, w.objects.countries) as unknown as {
          type: string;
          features: Array<{ geometry: object }>;
        };
        for (const feat of countries.features) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const geo = new GeoJsonGeometry(feat.geometry as any, GLOBE_R, 3);
          const outlineMat = new THREE.LineBasicMaterial({
            color: 0xb8976a,
            transparent: true,
            opacity: 0.12,
          });
          (outlineMat as any)._baseOpacity = 0.12;
          const line = new THREE.LineSegments(geo, outlineMat);
          globeGroup.add(line);
        }
      })
      .catch(() => {});

    // Animated flight arcs — dashed lines with flowing animation
    function latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    const arcRoutes = [
      { from: [26.36, -80.08], to: [-23.55, -46.63] },
      { from: [26.36, -80.08], to: [32.78, -96.8] },
      { from: [-23.55, -46.63], to: [32.78, -96.8] },
    ];

    const arcMaterials: THREE.LineDashedMaterial[] = [];
    for (const route of arcRoutes) {
      const start = latLngToVec3(route.from[0], route.from[1], GLOBE_R);
      const end = latLngToVec3(route.to[0], route.to[1], GLOBE_R);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_R + 0.6);
      const ctrl1 = start.clone().lerp(mid, 0.5);
      ctrl1.normalize().multiplyScalar(GLOBE_R + 0.48);
      const ctrl2 = end.clone().lerp(mid, 0.5);
      ctrl2.normalize().multiplyScalar(GLOBE_R + 0.48);
      const curve = new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
      const pts = curve.getPoints(64);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const arcMat = new THREE.LineDashedMaterial({
        color: 0xb8976a,
        dashSize: 0.08,
        gapSize: 0.04,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Line(arcGeo, arcMat);
      line.computeLineDistances();
      arcMaterials.push(arcMat);
      globeGroup.add(line);
    }

    // City markers — glowing gold dots
    const cities = [
      { lat: 26.36, lng: -80.08 },
      { lat: -23.55, lng: -46.63 },
      { lat: 32.78, lng: -96.8 },
    ];
    for (const city of cities) {
      const pos = latLngToVec3(city.lat, city.lng, GLOBE_R + 0.02);
      const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xb8976a, transparent: true, opacity: 1.0 });
      (dotMat as any)._baseOpacity = 1.0;
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globeGroup.add(dot);
    }

    // ── Loader (for later use when plane is needed) ──
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    const gl = new GLTFLoader();
    gl.setDRACOLoader(draco);
    loaderRef.current = gl;

    // ── HDRI Environment (for plane reflections — loaded but not used as background) ──
    const pmrem = new THREE.PMREMGenerator(r);
    pmrem.compileEquirectangularShader();
    new RGBELoader().load("/hangar.hdr", (hdr) => {
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const envMap = pmrem.fromEquirectangular(hdr).texture;
      sc.environment = envMap;
      sc.environmentIntensity = 1.0;
      hdr.dispose();
      pmrem.dispose();
    });

    // ── Accent lights (for when plane appears later) ──
    const key = new THREE.DirectionalLight(0xffeedd, 1.0);
    key.position.set(1, 3, 4);
    sc.add(key);

    const rim = new THREE.DirectionalLight(0xb8976a, 0.4);
    rim.position.set(-2, 1, -4);
    sc.add(rim);

    // Globe illumination — ambient light so MeshPhongMaterial is visible
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    sc.add(ambient);

    // Globe illumination — point light for specular highlights
    const globeLight = new THREE.PointLight(0x4488cc, 2.0, 20);
    globeLight.position.set(5, 3, 5);
    sc.add(globeLight);

    // ── Mount ──
    el.appendChild(r.domElement);
    r.domElement.style.width = "100%";
    r.domElement.style.height = "100%";

    // ── Post-processing ──
    const w = el.clientWidth, h = el.clientHeight;
    const composer = new EffectComposer(r);
    composer.addPass(new RenderPass(sc, cam));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(w, h),
      0.15,  // gentle bloom on cloud edges
      0.8,
      0.85
    ));
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    function resize() {
      const rw = el!.clientWidth, rh = el!.clientHeight;
      r.setSize(rw, rh);
      composer.setSize(rw, rh);
      cam.aspect = rw / rh;
      cam.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Render loop ──
    const startTime = performance.now() * 0.001;

    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const p = planeProxy;
      const elapsed = performance.now() * 0.001 - startTime;

      cam.position.set(p.camX, p.camY, p.camZ);
      cam.lookAt(p.lookX, p.lookY, p.lookZ);

      // ── Model (hidden by default, showPlane controls it) ──
      if (modelRef.current) {
        modelRef.current.visible = p.showPlane > 0.5;
        if (p.autoRotate) {
          modelRef.current.rotation.y += 0.004;
        } else {
          modelRef.current.rotation.y = p.rotY;
        }
        modelRef.current.position.z = p.posZ;
      }

      // ── Update clouds — always fully opaque, camera scrolls past them ──
      for (const sp of cloudSprites) {
        // Billboard toward camera + local z-rotation for variety
        sp.mesh.quaternion.copy(cam.quaternion);
        sp.mesh.quaternion.multiply(sp.rotQ);
      }

      // ── Update globe — continuous opacity fade ──
      const gv = p.globeVisible; // 0→1 continuous
      globeGroup.visible = gv > 0.01;
      if (globeGroup.visible) {
        globeGroup.position.set(p.globePosX, p.globePosY, 0);
        globeGroup.rotation.y = p.globeRotY;
        // Fade globe materials by globeVisible value
        globeMat.opacity = gv;
        globeMat.transparent = gv < 0.99;
        atmosMat.opacity = gv;
        for (const am of arcMaterials) {
          am.opacity = 0.9 * gv;
          am.dashOffset -= 0.003;
        }
        // Fade outlines + dots via stored base opacity
        globeGroup.traverse((child) => {
          const m = (child as THREE.Mesh).material;
          if (m && (m as any)._baseOpacity !== undefined) {
            (m as any).opacity = (m as any)._baseOpacity * gv;
          }
        });
      }

      // ── Update starfield — just twinkle, always full brightness ──
      starfield.update(elapsed);

      // ── Update terrain ──
      terrainMesh.visible = p.terrainOpacity > 0.01;
      if (terrainMesh.visible) {
        const baseTime = elapsed * 0.2;
        const scrollTime = p.terrainScroll * 40;
        terrainMat.uniforms.uTime.value = baseTime + scrollTime;
        terrainMat.uniforms.uOpacity.value = p.terrainOpacity;
      }

      // ── Sky darkness ──
      sky.update(p.skyDarkness);

      composer.render();
    }
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      spriteGeo.dispose();
      cloudSprites.forEach((sp) => (sp.mesh.material as THREE.Material).dispose());
      cloudTexture.dispose();
      sc.remove(cloudGroup);
      // Starfield cleanup
      starfield.dispose();
      // Terrain cleanup
      sc.remove(terrainMesh);
      terrainGeo.dispose();
      terrainMat.dispose();
      // Globe cleanup
      sc.remove(globeGroup);
      sky.tex.dispose();
      composer.dispose();
      r.dispose();
      el.removeChild(r.domElement);
      curIdx.current = -1;
      modelRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Model swap (kept for later scenes) ── */
  useEffect(() => {
    const sc = sceneRef.current;
    const gl = loaderRef.current;
    if (!sc || !gl || curIdx.current === state.modelIndex) return;
    curIdx.current = state.modelIndex;

    if (modelRef.current) { sc.remove(modelRef.current); modelRef.current = null; }

    gl.load(modelsPath.current[state.modelIndex], (gltf) => {
      const m = gltf.scene;
      const b = new THREE.Box3().setFromObject(m);
      const c = b.getCenter(new THREE.Vector3());
      const sz = b.getSize(new THREE.Vector3());
      const scale = 5.0 / Math.max(sz.x, sz.y, sz.z);
      m.scale.setScalar(scale);
      m.position.sub(c.multiplyScalar(scale));
      m.position.y = 0;
      m.rotation.y = planeProxy.rotY;
      m.position.z = planeProxy.posZ;
      m.visible = false; // Hidden until GSAP sets showPlane > 0.5

      m.traverse((n) => {
        if (!(n as THREE.Mesh).isMesh) return;
        const mesh = n as THREE.Mesh;
        const oldMat = mesh.material as THREE.MeshStandardMaterial;

        const newMat = new THREE.MeshPhysicalMaterial({
          map: oldMat.map,
          normalMap: oldMat.normalMap,
          aoMap: oldMat.aoMap,
          color: oldMat.color,
          metalness: 0.0,
          roughness: 0.35,
          clearcoat: 0.6,
          clearcoatRoughness: 0.15,
          envMapIntensity: 1.0,
          reflectivity: 0.3,
        });

        mesh.material = newMat;
        oldMat.dispose();
      });

      sc.add(m);
      modelRef.current = m;
    });
  }, [state.modelIndex]);

  return (
    <div
      ref={box}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#0b1a35",
        opacity: state.visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    />
  );
}
