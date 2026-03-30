"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { COMPANY_STATS } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger);

/* ─── scroll-driven values shared via a plain object (no re-renders) ─── */
const scroll = {
  progress: 0,
  spotIntensity: 0,
  fillIntensity: 0,
  envIntensity: 0,
  modelOpacity: 0,
  wireframeOpacity: 0,
  rotationY: -0.5,
  rotationX: 0,
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  scaleBoost: 1,
  textOpacity: 0,
  wireReveal: 0,
  particleOpacity: 0,
  cameraPush: 0,
};

/* ─── shared uniforms for wireframe forming shader ─── */
const wireUniforms = {
  uReveal: { value: 0 },
  uOpacity: { value: 0 },
};

/* ─── Airplane model ─── */
function Airplane({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) {
  const { scene } = useGLTF("/airplane.glb");
  const groupRef = useRef<THREE.Group>(null);

  const scale = isMobile ? 1.8 : isTablet ? 2.2 : 2.6;

  // Clone scene for wireframe overlay with radial forming effect
  const wireframeScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.ShaderMaterial({
          wireframe: true,
          transparent: true,
          depthWrite: false,
          uniforms: {
            uColor: { value: new THREE.Color("#C8A96E") },
            uOpacity: wireUniforms.uOpacity,
            uReveal: wireUniforms.uReveal,
          },
          vertexShader: `
            varying vec3 vWorldPos;
            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldPos = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            uniform float uReveal;
            varying vec3 vWorldPos;
            void main() {
              float dist = length(vWorldPos.xz);
              float maxDist = 8.0;
              float threshold = uReveal * maxDist;
              if (dist > threshold) discard;
              float edgeDist = threshold - dist;
              float scanRing = exp(-edgeDist * 2.5);
              vec3 finalColor = uColor * (1.0 + scanRing * 1.5);
              float edgeAlpha = smoothstep(0.0, 0.2, edgeDist);
              float alpha = uOpacity * edgeAlpha;
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
        });
      }
    });
    return clone;
  }, [scene]);

  // Upgrade materials to MeshPhysicalMaterial
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const oldMat = mesh.material as THREE.MeshStandardMaterial;
        const physMat = new THREE.MeshPhysicalMaterial({
          metalness: 0.9,
          roughness: 0.1,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          transparent: true,
          opacity: 0,
        });
        if (oldMat.map) physMat.map = oldMat.map;
        if (oldMat.normalMap) physMat.normalMap = oldMat.normalMap;
        if (oldMat.aoMap) physMat.aoMap = oldMat.aoMap;
        if (oldMat.metalnessMap) physMat.metalnessMap = oldMat.metalnessMap;
        if (oldMat.roughnessMap) physMat.roughnessMap = oldMat.roughnessMap;
        mesh.material = physMat;
      }
    });
  }, [scene]);

  useFrame(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        if (mat.isMeshPhysicalMaterial) {
          mat.opacity = scroll.modelOpacity;
        }
      }
    });

    wireUniforms.uReveal.value = scroll.wireReveal;
    wireUniforms.uOpacity.value = scroll.wireframeOpacity;

    if (groupRef.current) {
      groupRef.current.rotation.y = scroll.rotationY;
      groupRef.current.rotation.x = scroll.rotationX;
      groupRef.current.position.x = scroll.positionX;
      groupRef.current.position.y = scroll.positionY + -0.3;
      groupRef.current.position.z = scroll.positionZ;
      const s = scale * scroll.scaleBoost;
      groupRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} />
      <primitive object={wireframeScene} scale={1} />
    </group>
  );
}

/* ─── Lights with spotlight sweep ─── */
function Lights() {
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.SpotLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      targetRef.current.position.set(0, 0, 0);
      spotRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(() => {
    if (spotRef.current) {
      spotRef.current.intensity = scroll.spotIntensity;
      // Sweep from side/low to above-front as light ramps
      const t = Math.min(1, scroll.spotIntensity / 120);
      spotRef.current.position.x = THREE.MathUtils.lerp(5, 0, t);
      spotRef.current.position.y = THREE.MathUtils.lerp(2, 8, t);
      spotRef.current.position.z = THREE.MathUtils.lerp(8, 4, t);
    }
    if (fillRef.current) fillRef.current.intensity = scroll.fillIntensity;
    if (ambientRef.current) {
      const wireBoost = scroll.wireframeOpacity > 0 ? 0.04 : 0;
      ambientRef.current.intensity = 0.02 + wireBoost;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.02} color="#ffffff" />
      <spotLight
        ref={spotRef}
        position={[5, 2, 8]}
        angle={0.35}
        penumbra={0.8}
        color="#FFF5E6"
        intensity={0}
      />
      <object3D ref={targetRef} />
      <spotLight
        ref={fillRef}
        position={[-4, 3, 2]}
        color="#E8F0FF"
        intensity={0}
      />
    </>
  );
}

/* ─── Gold dust particles ─── */
function GoldParticles({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 6;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.3) * 4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Color("#C8A96E") },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float drift = uTime * 0.15 + aSeed * 6.28;
          vec3 pos = position;
          pos.y += mod(uTime * 0.08 + aSeed * 10.0, 4.0) - 1.0;
          pos.x += sin(drift) * 0.3;
          pos.z += cos(drift * 0.7) * 0.2;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float twinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 12.0);
          vAlpha = twinkle * uOpacity;
          gl_PointSize = (0.8 + aSeed * 1.2) * (120.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;
          float glow = exp(-dist * 5.0);
          gl_FragColor = vec4(uColor * glow, glow * vAlpha * 0.6);
        }
      `,
    });

    return { geometry: geo, material: mat };
  }, [count]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uOpacity.value = scroll.particleOpacity;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/* ─── Environment with scroll-driven intensity ─── */
function ScrollEnvironment() {
  const { scene } = useThree();

  useFrame(() => {
    scene.environmentIntensity = scroll.envIntensity;
  });

  return <Environment files="/hangar.hdr" />;
}

/* ─── Camera with dolly push-in ─── */
function CameraSetup({ isMobile, isTablet }: { isMobile: boolean; isTablet: boolean }) {
  const { camera } = useThree();
  const baseZ = isMobile ? 12 : isTablet ? 10 : 8;

  useEffect(() => {
    camera.position.set(0, 0.8, baseZ + 3);
    (camera as THREE.PerspectiveCamera).fov = 45;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera, baseZ]);

  useFrame(() => {
    camera.position.z = baseZ + 3 - scroll.cameraPush * 3;
  });

  return null;
}

/* ─── Main section ─── */
export default function HangarSection() {
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const text = textRef.current;
    const stats = statsRef.current;
    if (!outer || !text) return;

    gsap.set(text, { opacity: 0 });
    if (stats) gsap.set(stats, { opacity: 0 });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: outer,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress;
          scroll.progress = p;

          // ─── Wireframe: immediate start, sweep 0.00–0.24, fade 0.24–0.38 ───
          if (p < 0.24) {
            const t = p / 0.24;
            scroll.wireReveal = t;
            scroll.wireframeOpacity = t * 0.7;
          } else if (p < 0.38) {
            scroll.wireReveal = 1;
            scroll.wireframeOpacity = 0.7 * (1 - (p - 0.24) / 0.14);
          } else {
            scroll.wireReveal = 1;
            scroll.wireframeOpacity = 0;
          }

          // ─── Lights: ramp 0.10–0.38, hold, dim in fly-out ───
          if (p < 0.10) {
            scroll.spotIntensity = 0;
          } else if (p < 0.38) {
            const t = (p - 0.10) / 0.28;
            scroll.spotIntensity = t * 120;
          } else if (p < 0.82) {
            scroll.spotIntensity = 120;
          } else {
            scroll.spotIntensity = 120 * (1 - ((p - 0.82) / 0.18));
          }
          scroll.fillIntensity = scroll.spotIntensity * 0.5;

          // ─── Environment intensity (0.10–0.38) ───
          if (p < 0.10) {
            scroll.envIntensity = 0;
          } else if (p < 0.38) {
            scroll.envIntensity = ((p - 0.10) / 0.28) * 1.8;
          } else {
            scroll.envIntensity = 1.8;
          }

          // ─── Solid model materializes (0.10–0.38) ───
          if (p < 0.10) {
            scroll.modelOpacity = 0;
          } else if (p < 0.38) {
            scroll.modelOpacity = (p - 0.10) / 0.28;
          } else {
            scroll.modelOpacity = 1;
          }

          // ─── Camera push-in (0.00–0.38) ───
          if (p < 0.38) {
            scroll.cameraPush = p / 0.38;
          } else {
            scroll.cameraPush = 1;
          }

          // ─── Particles: ramp 0.10–0.30, hold, fade with fly-out ───
          if (p < 0.10) {
            scroll.particleOpacity = 0;
          } else if (p < 0.30) {
            scroll.particleOpacity = (p - 0.10) / 0.20;
          } else if (p < 0.82) {
            scroll.particleOpacity = 1;
          } else {
            scroll.particleOpacity = 1 - (p - 0.82) / 0.18;
          }

          // ─── Full rotation: -0.5 → π*1.5 (~310°) over 0.04–0.82 ───
          const ROT_START = -0.5;
          const ROT_END = Math.PI * 1.5;
          if (p < 0.04) {
            scroll.rotationY = ROT_START;
          } else if (p < 0.82) {
            const t = (p - 0.04) / 0.78;
            const eased = t < 0.5
              ? 2 * t * t
              : 1 - Math.pow(-2 * t + 2, 2) / 2;
            scroll.rotationY = ROT_START + (ROT_END - ROT_START) * eased;
          } else {
            scroll.rotationY = ROT_END;
          }

          // ─── Text: fade in 0.52–0.64, hold 0.64–0.80, fade out 0.80–0.86 ───
          let textOp = 0;
          if (p >= 0.52 && p < 0.64) {
            textOp = (p - 0.52) / 0.12;
          } else if (p >= 0.64 && p < 0.80) {
            textOp = 1;
          } else if (p >= 0.80 && p < 0.86) {
            textOp = 1 - (p - 0.80) / 0.06;
          }
          scroll.textOpacity = textOp;
          if (text) text.style.opacity = String(textOp);

          // ─── Stats: fade in 0.44–0.56, hold 0.56–0.80, fade out 0.80–0.86 ───
          let statsOp = 0;
          if (p >= 0.44 && p < 0.56) {
            statsOp = (p - 0.44) / 0.12;
          } else if (p >= 0.56 && p < 0.80) {
            statsOp = 1;
          } else if (p >= 0.80 && p < 0.86) {
            statsOp = 1 - (p - 0.80) / 0.06;
          }
          if (stats) {
            stats.style.opacity = String(statsOp);
            const countProgress = Math.min(1, statsOp);
            const counters = stats.querySelectorAll<HTMLElement>("[data-count]");
            counters.forEach((el) => {
              const target = parseFloat(el.dataset.count || "0");
              el.textContent = Math.round(target * countProgress).toString();
            });
          }

          // ─── Fly-out: aircraft pitches up and ascends (0.82–1.0) ───
          if (p < 0.82) {
            scroll.rotationX = 0;
            scroll.positionX = 0;
            scroll.positionY = 0;
            scroll.positionZ = 0;
            scroll.scaleBoost = 1;
          } else {
            const t = (p - 0.82) / 0.18;
            const eased = t * t;
            scroll.rotationX = eased * 0.35;
            scroll.positionZ = -eased * 6;
            scroll.positionY = eased * eased * 4;
            scroll.scaleBoost = 1 + eased * 0.25;
          }

          // ─── Fade model out at very end (0.92–1.0) ───
          if (p > 0.92) {
            scroll.modelOpacity = Math.max(0, 1 - (p - 0.92) / 0.08);
          }
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;

  const BG_GRADIENT =
    "radial-gradient(ellipse 80% 60% at 50% 40%, #0A0D14 0%, #000000 100%)";

  return (
    <div ref={outerRef} style={{ height: "600vh", background: BG_GRADIENT }}>
      {/* Cream-to-black transition lip */}
      <div style={{ position: "relative", zIndex: 2, marginTop: -6 }}>
        <div
          className="rounded-t-[32px] md:rounded-t-[48px]"
          style={{ width: "100%", height: 70, background: "#000000", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              top: 28,
              left: "12%",
              right: "12%",
              height: 1,
              background:
                "linear-gradient(to right, transparent 0%, rgba(200,169,110,0.15) 20%, rgba(200,169,110,0.35) 50%, rgba(200,169,110,0.15) 80%, transparent 100%)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        {/* R3F Canvas */}
        <Canvas
          style={{ width: "100%", height: "100%", background: BG_GRADIENT }}
          camera={{ position: [0, 0.8, 11], fov: 45 }}
          gl={{ antialias: true }}
        >
          <CameraSetup isMobile={isMobile} isTablet={isTablet} />
          <ScrollEnvironment />
          <Lights />
          <Airplane isMobile={isMobile} isTablet={isTablet} />
          <GoldParticles count={isMobile ? 40 : 80} />
        </Canvas>

        {/* Stats overlay — positioned above the aircraft */}
        <div
          ref={statsRef}
          style={{
            position: "absolute",
            top: "16%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          {COMPANY_STATS.map((stat, i) => (
            <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && (
                <div
                  style={{
                    width: 1,
                    height: 48,
                    background: "rgba(255,255,255,0.1)",
                    margin: "0 clamp(24px, 4vw, 56px)",
                  }}
                />
              )}
              <div style={{ textAlign: "center" }}>
                <div
                  className="font-editorial"
                  style={{
                    fontSize: isMobile ? "36px" : "52px",
                    fontWeight: 300,
                    color: "#F5F2EC",
                    lineHeight: 1,
                  }}
                >
                  {stat.prefix && <span>{stat.prefix}</span>}
                  <span data-count={stat.value}>0</span>
                  {stat.suffix && <span>{stat.suffix}</span>}
                </div>
                <p
                  className="font-sans"
                  style={{
                    fontSize: "10px",
                    fontWeight: 400,
                    color: "#5A5652",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    marginTop: 6,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Text overlay — positioned below the aircraft */}
        <div
          ref={textRef}
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <p
            className="font-editorial"
            style={{
              fontSize: isMobile ? "28px" : "48px",
              fontWeight: 300,
              fontStyle: "italic",
              color: "#FFFFFF",
              letterSpacing: "0.04em",
              lineHeight: 1.0,
              margin: 0,
              textShadow: "0 4px 40px rgba(0,0,0,0.6)",
            }}
          >
            Your next aircraft awaits.
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload("/airplane.glb");
