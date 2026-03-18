"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface CrystalLogoProps {
  size?: number;
}

export default function CrystalLogo({ size = 28 }: CrystalLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(size, size);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const keyL = new THREE.DirectionalLight(0xffffff, 1.2);
    keyL.position.set(2, 3, 4);
    scene.add(keyL);
    const fillL = new THREE.DirectionalLight(0xddeeff, 0.5);
    fillL.position.set(-3, 1, 2);
    scene.add(fillL);

    let crystalModel: THREE.Object3D | null = null;
    let raf = 0;
    let cancelled = false;

    const loader = new GLTFLoader();
    loader.load("/crystal-logo.glb", (gltf) => {
      if (cancelled) return;
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.15,
            side: THREE.DoubleSide,
          });
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const bsize = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(bsize.x, bsize.y, bsize.z);
      const s = 1.8 / maxDim;
      model.scale.setScalar(s);
      model.position.sub(center.multiplyScalar(s));
      scene.add(model);
      crystalModel = model;
    });

    function animate() {
      if (cancelled) return;
      raf = requestAnimationFrame(animate);
      if (crystalModel) crystalModel.rotation.y += 0.012;
      renderer.render(scene, camera);
    }
    animate();

    // Pause when tab hidden
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!cancelled) {
        animate();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.dispose();
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size }}
    />
  );
}
