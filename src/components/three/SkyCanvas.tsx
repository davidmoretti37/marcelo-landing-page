"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

/*
  Lightweight sky + clouds only.
  No globe, no stars, no plane, no post-processing, no HDRI.
  Camera sits among the clouds looking ahead. Static scene.
*/

interface CloudFormation {
  cx: number; cy: number; cz: number;
  spreadX: number; spreadY: number; spreadZ: number;
  count: number;
}

function generateCloudFormations(): CloudFormation[] {
  return [
    // Close clouds — fill the foreground
    { cx: -5,  cy: -2,  cz: 3,   spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 14 },
    { cx:  6,  cy: 0,   cz: 2,   spreadX: 2.5, spreadY: 1.0, spreadZ: 0.6, count: 12 },
    { cx:  0,  cy: 1,   cz: 4,   spreadX: 3.5, spreadY: 1.2, spreadZ: 1.0, count: 14 },
    { cx: -9,  cy: -1,  cz: 1,   spreadX: 2.5, spreadY: 0.8, spreadZ: 0.5, count: 10 },
    { cx:  10, cy: 2,   cz: 2,   spreadX: 2.5, spreadY: 0.8, spreadZ: 0.7, count: 12 },
    { cx: -15, cy: 0,   cz: 3,   spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 10 },
    // Near clouds
    { cx: -10, cy: 4,   cz: -4,  spreadX: 4.0, spreadY: 1.2, spreadZ: 1.0, count: 14 },
    { cx:  12, cy: 5,   cz: -6,  spreadX: 3.5, spreadY: 1.0, spreadZ: 0.8, count: 12 },
    { cx:  3,  cy: 6,   cz: -3,  spreadX: 3.0, spreadY: 1.0, spreadZ: 0.8, count: 12 },
    { cx: -6,  cy: 3,   cz: -5,  spreadX: 3.5, spreadY: 1.0, spreadZ: 0.7, count: 12 },
    { cx:  16, cy: 7,   cz: -7,  spreadX: 3.0, spreadY: 0.8, spreadZ: 0.8, count: 10 },
    // Mid clouds
    { cx: -14, cy: 9,   cz: -11, spreadX: 5.0, spreadY: 1.5, spreadZ: 1.5, count: 16 },
    { cx:  0,  cy: 11,  cz: -13, spreadX: 5.5, spreadY: 1.5, spreadZ: 1.8, count: 16 },
    { cx:  10, cy: 10,  cz: -10, spreadX: 4.5, spreadY: 1.2, spreadZ: 1.2, count: 14 },
    { cx: -8,  cy: 12,  cz: -14, spreadX: 4.0, spreadY: 1.0, spreadZ: 1.0, count: 12 },
    // Far clouds
    { cx: -12, cy: 16,  cz: -20, spreadX: 7.0, spreadY: 2.0, spreadZ: 2.5, count: 16 },
    { cx:  8,  cy: 18,  cz: -22, spreadX: 6.0, spreadY: 1.8, spreadZ: 2.0, count: 14 },
    { cx:  0,  cy: 20,  cz: -25, spreadX: 8.0, spreadY: 2.0, spreadZ: 3.0, count: 18 },
    { cx: -18, cy: 17,  cz: -18, spreadX: 6.5, spreadY: 1.5, spreadZ: 2.0, count: 14 },
    { cx:  16, cy: 21,  cz: -24, spreadX: 7.0, spreadY: 2.0, spreadZ: 2.5, count: 14 },
  ];
}

export default function SkyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    el.appendChild(renderer.domElement);

    // Scene + sky background
    const scene = new THREE.Scene();
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = 2;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext("2d")!;
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    // Draw a bright daytime sky gradient
    const g = skyCtx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0,    "rgb(28, 42, 68)");
    g.addColorStop(0.2,  "rgb(52, 72, 108)");
    g.addColorStop(0.4,  "rgb(88, 115, 152)");
    g.addColorStop(0.6,  "rgb(128, 155, 185)");
    g.addColorStop(0.75, "rgb(165, 185, 205)");
    g.addColorStop(0.9,  "rgb(195, 208, 220)");
    g.addColorStop(1,    "rgb(210, 220, 230)");
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, 2, 512);
    skyTex.needsUpdate = true;
    scene.background = skyTex;

    // Camera — positioned at Y=5 looking slightly up into the clouds
    const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 200);
    cam.position.set(0, 5, 8);
    cam.lookAt(0, 8, -10);

    // Cloud system
    const cloudTexture = new THREE.TextureLoader().load("/cloud.png");
    cloudTexture.colorSpace = THREE.SRGBColorSpace;

    const spriteGeo = new THREE.PlaneGeometry(1, 1);
    const cloudGroup = new THREE.Group();
    const cloudMeshes: { mesh: THREE.Mesh; rotQ: THREE.Quaternion }[] = [];

    for (const f of generateCloudFormations()) {
      for (let i = 0; i < f.count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random());

        const x = f.cx + f.spreadX * r * Math.sin(phi) * Math.cos(theta);
        const y = f.cy + f.spreadY * r * Math.sin(phi) * Math.sin(theta);
        const z = f.cz + f.spreadZ * r * Math.cos(phi);

        const baseScale = THREE.MathUtils.lerp(3.5, 1.2, r) * (0.8 + Math.random() * 0.4);
        const baseOpacity = THREE.MathUtils.lerp(0.25, 0.06, r) * (0.7 + Math.random() * 0.6);

        const mat = new THREE.MeshBasicMaterial({
          map: cloudTexture,
          color: new THREE.Color(0.85, 0.88, 0.92),
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

        const rotQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.random() * Math.PI * 2,
        );

        cloudMeshes.push({ mesh, rotQ });
        cloudGroup.add(mesh);
      }
    }
    scene.add(cloudGroup);

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

    // Render loop — very gentle camera drift + billboard clouds
    let raf = 0;
    const clock = new THREE.Clock();

    function tick() {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Very slow gentle drift
      cam.position.x = Math.sin(t * 0.03) * 0.5;
      cam.position.y = 5 + Math.sin(t * 0.02) * 0.3;

      // Billboard all clouds toward camera
      for (const { mesh, rotQ } of cloudMeshes) {
        mesh.quaternion.copy(cam.quaternion);
        mesh.quaternion.multiply(rotQ);
      }

      renderer.render(scene, cam);
    }
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      spriteGeo.dispose();
      cloudMeshes.forEach(({ mesh }) => (mesh.material as THREE.Material).dispose());
      cloudTexture.dispose();
      skyTex.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
