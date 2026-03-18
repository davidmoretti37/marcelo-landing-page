"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

/*
  Lightweight sky + clouds.
  - Shared material pool (10 materials instead of 115) for fewer draw calls
  - Chunked initialization — clouds added across frames so main thread never blocks
*/

interface CloudData {
  x: number; y: number; z: number;
  scale: number; baseOpacity: number;
  rotAngle: number; driftSpeed: number;
}

function generateAllClouds(): CloudData[] {
  const formations = [
    { cx: -5,  cy: -2,  cz: 3,   sX: 3.0, sY: 1.0, sZ: 0.8, n: 8 },
    { cx:  6,  cy: 0,   cz: 2,   sX: 2.5, sY: 1.0, sZ: 0.6, n: 7 },
    { cx:  0,  cy: 1,   cz: 4,   sX: 3.5, sY: 1.2, sZ: 1.0, n: 8 },
    { cx: -9,  cy: -1,  cz: 1,   sX: 2.5, sY: 0.8, sZ: 0.5, n: 6 },
    { cx:  10, cy: 2,   cz: 2,   sX: 2.5, sY: 0.8, sZ: 0.7, n: 7 },
    { cx: -15, cy: 0,   cz: 3,   sX: 3.0, sY: 1.0, sZ: 0.8, n: 6 },
    { cx: -10, cy: 4,   cz: -4,  sX: 4.0, sY: 1.2, sZ: 1.0, n: 8 },
    { cx:  12, cy: 5,   cz: -6,  sX: 3.5, sY: 1.0, sZ: 0.8, n: 7 },
    { cx:  3,  cy: 6,   cz: -3,  sX: 3.0, sY: 1.0, sZ: 0.8, n: 7 },
    { cx: -6,  cy: 3,   cz: -5,  sX: 3.5, sY: 1.0, sZ: 0.7, n: 7 },
    { cx: -14, cy: 9,   cz: -11, sX: 5.0, sY: 1.5, sZ: 1.5, n: 8 },
    { cx:  0,  cy: 11,  cz: -13, sX: 5.5, sY: 1.5, sZ: 1.8, n: 8 },
    { cx:  10, cy: 10,  cz: -10, sX: 4.5, sY: 1.2, sZ: 1.2, n: 8 },
    { cx: -12, cy: 16,  cz: -20, sX: 7.0, sY: 2.0, sZ: 2.5, n: 8 },
    { cx:  8,  cy: 18,  cz: -22, sX: 6.0, sY: 1.8, sZ: 2.0, n: 8 },
    { cx:  0,  cy: 20,  cz: -25, sX: 8.0, sY: 2.0, sZ: 3.0, n: 10 },
    { cx: -18, cy: 17,  cz: -18, sX: 6.5, sY: 1.5, sZ: 2.0, n: 8 },
  ];

  // Duplicate each formation at 3 X offsets across the wrap range (-55..55)
  // so clouds cover the full width. Formations stay grouped = realistic cloud shapes.
  const clouds: CloudData[] = [];
  const offsets = [-37, 0, 37]; // spread formations across the range

  for (const f of formations) {
    for (const xOff of offsets) {
      for (let i = 0; i < f.n; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random());

        clouds.push({
          x: f.cx + xOff + f.sX * r * Math.sin(phi) * Math.cos(theta),
          y: f.cy + f.sY * r * Math.sin(phi) * Math.sin(theta),
          z: f.cz + f.sZ * r * Math.cos(phi),
          scale: THREE.MathUtils.lerp(3.5, 1.2, r) * (0.8 + Math.random() * 0.4),
          baseOpacity: THREE.MathUtils.lerp(0.25, 0.06, r) * (0.7 + Math.random() * 0.6),
          rotAngle: Math.random() * Math.PI * 2,
          driftSpeed: 0.3 + Math.random() * 0.4,
        });
      }
    }
  }
  return clouds;
}

export default function SkyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // --- Lightweight setup (fast, no blocking) ---
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Sky background
    const skyC = document.createElement("canvas");
    skyC.width = 2; skyC.height = 512;
    const ctx2d = skyC.getContext("2d")!;
    const grad = ctx2d.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0,    "rgb(28, 42, 68)");
    grad.addColorStop(0.2,  "rgb(52, 72, 108)");
    grad.addColorStop(0.4,  "rgb(88, 115, 152)");
    grad.addColorStop(0.6,  "rgb(128, 155, 185)");
    grad.addColorStop(0.75, "rgb(165, 185, 205)");
    grad.addColorStop(0.9,  "rgb(195, 208, 220)");
    grad.addColorStop(1,    "rgb(210, 220, 230)");
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, 2, 512);
    const skyTex = new THREE.CanvasTexture(skyC);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTex;

    const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
    cam.position.set(0, 5, 8);
    cam.lookAt(0, 8, -10);

    const cloudTexture = new THREE.TextureLoader().load("/cloud.png");
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(1, 1);

    // Material pool — 10 shared materials instead of 115 individual ones
    const MAT_COUNT = 10;
    const matPool: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < MAT_COUNT; i++) {
      matPool.push(new THREE.MeshBasicMaterial({
        map: cloudTexture,
        color: new THREE.Color(0.85, 0.88, 0.92),
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        toneMapped: false,
        opacity: 0.03 + (i / (MAT_COUNT - 1)) * 0.22, // 0.03 to 0.25
      }));
    }

    // Resize
    function resize() {
      const w = el!.clientWidth;
      const h = el!.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    // --- Generate cloud data (pure math, no DOM) ---
    const allCloudData = generateAllClouds();
    const totalClouds = allCloudData.length;

    interface LiveCloud {
      mesh: THREE.Mesh;
      rotQ: THREE.Quaternion;
      baseX: number;
      baseScale: number;
      driftSpeed: number;
    }
    const liveClouds: LiveCloud[] = [];

    // Wrap constants
    const wrapMin = -55;
    const wrapMax = 55;
    const wrapRange = wrapMax - wrapMin;

    // --- Chunked cloud creation: add ~20 clouds per frame ---
    let buildIndex = 0;
    const CHUNK_SIZE = 40;
    const zAxis = new THREE.Vector3(0, 0, 1);

    function buildChunk() {
      const end = Math.min(buildIndex + CHUNK_SIZE, totalClouds);
      for (let i = buildIndex; i < end; i++) {
        const d = allCloudData[i];
        // Find nearest material in pool
        const matIdx = Math.round(((d.baseOpacity - 0.03) / 0.22) * (MAT_COUNT - 1));
        const clampedIdx = Math.max(0, Math.min(MAT_COUNT - 1, matIdx));

        const mesh = new THREE.Mesh(geo, matPool[clampedIdx]);
        mesh.position.set(d.x, d.y, d.z);
        mesh.scale.setScalar(d.scale);
        scene.add(mesh);

        liveClouds.push({
          mesh,
          rotQ: new THREE.Quaternion().setFromAxisAngle(zAxis, d.rotAngle),
          baseX: d.x,
          baseScale: d.scale,
          driftSpeed: d.driftSpeed,
        });
      }
      buildIndex = end;
    }

    // --- Render loop — starts immediately showing sky, clouds appear progressively ---
    let raf = 0;
    const clock = new THREE.Clock();
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);

      // Build next chunk of clouds (if any remaining)
      if (buildIndex < totalClouds) {
        buildChunk();
      }

      const t = clock.getElapsedTime();

      // Camera
      const turbX = Math.sin(t * 2.3) * 0.008 + Math.sin(t * 5.1) * 0.004;
      const turbY = Math.sin(t * 2.7) * 0.006 + Math.sin(t * 6.3) * 0.003;
      cam.position.x = Math.sin(t * 0.06) * 1.2 + turbX;
      cam.position.y = 5 + Math.sin(t * 0.04) * 0.6 + turbY;
      cam.rotation.z = Math.sin(t * 3.1) * 0.002;

      // Update live clouds — no edge fade needed, wrap bounds (-55..55) are far offscreen
      for (const c of liveClouds) {
        let x = c.baseX + t * c.driftSpeed;
        x = ((x - wrapMin) % wrapRange + wrapRange) % wrapRange + wrapMin;
        c.mesh.position.x = x;

        // Billboard
        c.mesh.quaternion.copy(cam.quaternion);
        c.mesh.quaternion.multiply(c.rotQ);
      }

      renderer.render(scene, cam);
    }
    tick();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geo.dispose();
      matPool.forEach((m) => m.dispose());
      cloudTexture.dispose();
      skyTex.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}
