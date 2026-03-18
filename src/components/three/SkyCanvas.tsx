"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

/*
  Sky + clouds — ported from old index.html.
  Camera looks forward, clouds drift left. Large flat pancake-shaped clouds.
  Procedural cloud texture (no external file). Chunked init for performance.
*/

export default function SkyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isMobile = window.innerWidth <= 768;
    const w = el.clientWidth;
    const h = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "low-power" });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    // Scene + sky gradient
    const scene = new THREE.Scene();
    const skyC = document.createElement("canvas");
    skyC.width = 2; skyC.height = 512;
    const skyCtx = skyC.getContext("2d")!;
    const g = skyCtx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0,    "rgb(28, 42, 68)");
    g.addColorStop(0.15, "rgb(48, 68, 105)");
    g.addColorStop(0.35, "rgb(82, 110, 148)");
    g.addColorStop(0.55, "rgb(120, 148, 178)");
    g.addColorStop(0.7,  "rgb(158, 178, 198)");
    g.addColorStop(0.85, "rgb(190, 205, 218)");
    g.addColorStop(1,    "rgb(215, 225, 235)");
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, 2, 512);
    const skyTex = new THREE.CanvasTexture(skyC);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTex;

    // Camera — looking forward, flying through clouds
    const cam = new THREE.PerspectiveCamera(65, w / h, 0.1, 300);
    cam.position.set(0, 0, 0);
    cam.lookAt(0, 0, -100);

    // Procedural cloud texture — soft radial puffs (no external file)
    const tSize = 256;
    const tCanvas = document.createElement("canvas");
    tCanvas.width = tSize; tCanvas.height = tSize;
    const tCtx = tCanvas.getContext("2d")!;

    // Base soft radial
    const radGrad = tCtx.createRadialGradient(tSize / 2, tSize / 2, 0, tSize / 2, tSize / 2, tSize / 2);
    radGrad.addColorStop(0, "rgba(255,255,255,1)");
    radGrad.addColorStop(0.2, "rgba(255,255,255,0.85)");
    radGrad.addColorStop(0.45, "rgba(255,255,255,0.35)");
    radGrad.addColorStop(0.7, "rgba(255,255,255,0.08)");
    radGrad.addColorStop(1, "rgba(255,255,255,0)");
    tCtx.fillStyle = radGrad;
    tCtx.fillRect(0, 0, tSize, tSize);

    // Overlapping puffs for organic shape
    for (let ni = 0; ni < 10; ni++) {
      const nx = tSize / 2 + (Math.random() - 0.5) * tSize * 0.45;
      const ny = tSize / 2 + (Math.random() - 0.5) * tSize * 0.45;
      const nr = tSize * (0.12 + Math.random() * 0.22);
      const nGrad = tCtx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      nGrad.addColorStop(0, "rgba(255,255,255,0.45)");
      nGrad.addColorStop(0.5, "rgba(255,255,255,0.12)");
      nGrad.addColorStop(1, "rgba(255,255,255,0)");
      tCtx.fillStyle = nGrad;
      tCtx.fillRect(0, 0, tSize, tSize);
    }

    const cloudTex = new THREE.CanvasTexture(tCanvas);
    cloudTex.colorSpace = THREE.SRGBColorSpace;

    // Cloud config
    const CLOUD_COUNT = isMobile ? 30 : 80;
    const SPREAD_X = 120;
    const SPREAD_Y = 14;
    const SPREAD_Z = 80;
    const MIN_Z = 30;
    const DRIFT_SPEED = 2;
    const halfX = SPREAD_X / 2;

    const spriteGeo = new THREE.PlaneGeometry(1, 1);

    // Cloud data
    interface CloudEntry {
      mesh: THREE.Mesh;
      rotQ: THREE.Quaternion;
    }
    const cloudMeshes: CloudEntry[] = [];

    // Chunked init — add ~20 clouds per frame
    let buildIndex = 0;
    const CHUNK = 20;

    function buildChunk() {
      const end = Math.min(buildIndex + CHUNK, CLOUD_COUNT);
      for (let i = buildIndex; i < end; i++) {
        const opacity = 0.04 + Math.random() * 0.12;
        const mat = new THREE.MeshBasicMaterial({
          map: cloudTex,
          color: new THREE.Color(0.90, 0.93, 0.96),
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.NormalBlending,
          opacity,
        });

        const mesh = new THREE.Mesh(spriteGeo, mat);
        const scale = 12 + Math.random() * 30;
        mesh.scale.set(scale, scale * (0.3 + Math.random() * 0.3), 1);
        mesh.position.x = (Math.random() - 0.5) * SPREAD_X;
        mesh.position.y = (Math.random() - 0.5) * SPREAD_Y - 3;
        mesh.position.z = -(Math.random() * SPREAD_Z + MIN_Z);

        const rotQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.random() * Math.PI * 2,
        );

        cloudMeshes.push({ mesh, rotQ });
        scene.add(mesh);
      }
      buildIndex = end;
    }

    // Resize
    function resize() {
      const nw = el!.clientWidth;
      const nh = el!.clientHeight;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener("resize", resize);

    // Render loop
    let raf = 0;
    const clock = new THREE.Clock();
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);

      // Build clouds progressively
      if (buildIndex < CLOUD_COUNT) buildChunk();

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // Gentle camera bob + subtle turbulence
      cam.position.y = Math.sin(t * 0.08) * 0.4;
      cam.position.x = Math.sin(t * 0.05) * 0.3;
      cam.rotation.z = Math.sin(t * 3.1) * 0.001;

      // Drift clouds left, recycle when they exit
      for (const c of cloudMeshes) {
        c.mesh.position.x -= DRIFT_SPEED * dt;

        if (c.mesh.position.x < -halfX - 10) {
          c.mesh.position.x = halfX + Math.random() * 20;
          c.mesh.position.y = (Math.random() - 0.5) * SPREAD_Y - 3;
          c.mesh.position.z = -(Math.random() * SPREAD_Z + MIN_Z);
        }

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
      spriteGeo.dispose();
      cloudMeshes.forEach((c) => (c.mesh.material as THREE.Material).dispose());
      cloudTex.dispose();
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
