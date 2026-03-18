"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AltitudeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = canvasRef.current;
    if (!section || !container) return;

    /* ── Three.js renderer (transparent over white CSS bg) ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.position.set(0, 1.5, 18);
    camera.lookAt(0, 0, 0);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const key = new THREE.DirectionalLight(0xffeedd, 1.2);
    key.position.set(3, 5, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xddeeff, 0.5);
    fill.position.set(-4, 2, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(0, -2, -6);
    scene.add(rim);

    /* ── Shadow (radial gradient plane beneath the airplane) ── */
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext("2d")!;
    const grad = sCtx.createRadialGradient(128, 64, 0, 128, 64, 120);
    grad.addColorStop(0, "rgba(0,0,0,0.08)");
    grad.addColorStop(0.4, "rgba(0,0,0,0.05)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.2;
    scene.add(shadowMesh);

    /* ── Compute visible scene dimensions ── */
    function getVisibleDims() {
      const vFov = (camera.fov * Math.PI) / 180;
      const dist = camera.position.z;
      const h = 2 * Math.tan(vFov / 2) * dist;
      const w = h * camera.aspect;
      return { h, w };
    }

    /* ── Responsive plane size (vh fraction) ── */
    function getPlaneVhFraction() {
      const vw = window.innerWidth;
      if (vw >= 1024) return 0.4; // 40vh desktop
      if (vw >= 768) return 0.3;  // 30vh tablet
      return 0.2;                  // 20vh mobile
    }

    /* ── Load airplane model ── */
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    let planeGroup: THREE.Group | null = null;
    let baseScale = 1;

    // Mutable scroll state (no React re-renders)
    const scrollState = { progress: 0 };

    loader.load("/airplane.glb", (gltf) => {
      const m = gltf.scene;
      const bbox = new THREE.Box3().setFromObject(m);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Scale to fill target vh fraction
      const { h: visH } = getVisibleDims();
      const targetSize = getPlaneVhFraction() * visH;
      baseScale = targetSize / maxDim;

      m.scale.setScalar(baseScale);
      m.position.sub(center.multiplyScalar(baseScale));
      m.position.y = 0;

      // Orient: face left (-X direction) with banking
      m.rotation.order = "YZX";
      m.rotation.y = -Math.PI / 2;
      m.rotation.z = THREE.MathUtils.degToRad(-8);

      // Upgrade materials
      m.traverse((n) => {
        if (!(n as THREE.Mesh).isMesh) return;
        const mesh = n as THREE.Mesh;
        const old = mesh.material as THREE.MeshStandardMaterial;
        mesh.material = new THREE.MeshPhysicalMaterial({
          map: old.map,
          normalMap: old.normalMap,
          aoMap: old.aoMap,
          color: old.color,
          metalness: 0.0,
          roughness: 0.35,
          clearcoat: 0.5,
          clearcoatRoughness: 0.2,
        });
        old.dispose();
      });

      scene.add(m);
      planeGroup = m;

      // Set initial position
      const { w: visW } = getVisibleDims();
      const startX = 1.2 * visW;
      const endX = -1.2 * visW;
      const x = THREE.MathUtils.lerp(startX, endX, scrollState.progress);
      m.position.x = x;
      shadowMesh.position.x = x;
    });

    /* ── Resize handler ── */
    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Rescale plane for new viewport
      if (planeGroup) {
        const { h: visH } = getVisibleDims();
        const targetSize = getPlaneVhFraction() * visH;
        const bbox = new THREE.Box3().setFromObject(planeGroup);
        // Undo current scale to get original size
        const currentScale = planeGroup.scale.x;
        const origMaxDim =
          Math.max(
            bbox.getSize(new THREE.Vector3()).x,
            bbox.getSize(new THREE.Vector3()).y,
            bbox.getSize(new THREE.Vector3()).z,
          ) / currentScale;
        const newScale = targetSize / origMaxDim;
        planeGroup.scale.setScalar(newScale);
        baseScale = newScale;
      }

      ScrollTrigger.refresh();
    }
    window.addEventListener("resize", resize);
    resize();

    /* ── Render loop ── */
    let raf = 0;
    function tick() {
      raf = requestAnimationFrame(tick);
      const p = scrollState.progress;

      if (planeGroup) {
        const { w: visW } = getVisibleDims();
        const startX = 1.2 * visW;
        const endX = -1.2 * visW;
        planeGroup.position.x = THREE.MathUtils.lerp(startX, endX, p);
        shadowMesh.position.x = planeGroup.position.x;
      }

      renderer.render(scene, camera);
    }
    tick();

    /* ── ScrollTrigger ── */
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;

        // Text opacity: invisible 0→0.35, fade in 0.35→0.5, hold 0.5→0.65, fade out 0.65→0.8, invisible 0.8→1
        if (textRef.current) {
          const t = self.progress;
          let opacity = 0;
          if (t >= 0.35 && t < 0.5) {
            opacity = (t - 0.35) / 0.15;
          } else if (t >= 0.5 && t < 0.65) {
            opacity = 1;
          } else if (t >= 0.65 && t < 0.8) {
            opacity = 1 - (t - 0.65) / 0.15;
          }
          textRef.current.style.opacity = String(opacity);
        }
      },
    });

    /* ── Cleanup ── */
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      trigger.kill();
      if (planeGroup) {
        planeGroup.traverse((n) => {
          if ((n as THREE.Mesh).isMesh) {
            const mesh = n as THREE.Mesh;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        scene.remove(planeGroup);
      }
      shadowTex.dispose();
      shadowMat.dispose();
      shadowMesh.geometry.dispose();
      scene.remove(shadowMesh);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      draco.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "300vh", background: "#F8F7F4" }}
    >
      {/* Sticky viewport container */}
      <div className="sticky top-0 h-screen w-screen overflow-hidden">
        {/* Text — behind the plane (lower z-index) */}
        <div
          ref={textRef}
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <p className="font-editorial italic font-light tracking-[0.08em] text-[#1A1714] text-center text-[28px] md:text-[36px] lg:text-[72px]">
            Every detail. Considered.
          </p>
        </div>

        {/* 3D Canvas — in front of text (higher z-index) */}
        <div
          ref={canvasRef}
          className="absolute inset-0 z-20 pointer-events-none"
        />
      </div>
    </section>
  );
}
