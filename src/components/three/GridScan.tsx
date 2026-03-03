"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ── Vertex shader — fullscreen quad ── */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ── Fragment shader — 3D perspective grid + scan pulse ──
   Metal-safe: NO loops. The 4-plane raycast is fully unrolled.
   Secondary scan loop removed entirely.
*/
const frag = /* glsl */ `
  precision highp float;
  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec2 uSkew;
  uniform float uTilt;
  uniform float uYaw;
  uniform float uLineThickness;
  uniform vec3 uLinesColor;
  uniform vec3 uScanColor;
  uniform float uGridScale;
  uniform float uLineStyle;
  uniform float uLineJitter;
  uniform float uScanOpacity;
  uniform float uScanDirection;
  uniform float uNoise;
  uniform float uBloomOpacity;
  uniform float uScanGlow;
  uniform float uScanSoftness;
  uniform float uPhaseTaper;
  uniform float uScanDuration;
  uniform float uScanDelay;
  varying vec2 vUv;

  float smoother01(float a, float b, float x) {
    float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    vec3 color = vec3(0.0);
    float minT = 1e20;
    float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 2.0;
    vec2 gridUV = vec2(0.0);
    float hitIsY = 1.0;

    // ═══ UNROLLED 4-plane raycast (Metal-safe, no loop) ═══

    // Plane 0: Y-plane at pos = -0.2
    {
      float num = -0.2 - ro.y;
      float den = rd.y;
      float t = num / den;
      vec3 h = ro + rd * t;
      float depthBoost = smoothstep(0.0, 3.0, h.z);
      h.xy += skew * 0.15 * depthBoost;
      bool use = t > 0.0 && t < minT;
      gridUV = use ? h.zy / gridScale : gridUV;
      minT = use ? t : minT;
      hitIsY = use ? 1.0 : hitIsY;
    }

    // Plane 1: Y-plane at pos = 0.2
    {
      float num = 0.2 - ro.y;
      float den = rd.y;
      float t = num / den;
      vec3 h = ro + rd * t;
      float depthBoost = smoothstep(0.0, 3.0, h.z);
      h.xy += skew * 0.15 * depthBoost;
      bool use = t > 0.0 && t < minT;
      gridUV = use ? h.zy / gridScale : gridUV;
      minT = use ? t : minT;
      hitIsY = use ? 1.0 : hitIsY;
    }

    // Plane 2: X-plane at pos = -0.5
    {
      float num = -0.5 - ro.x;
      float den = rd.x;
      float t = num / den;
      vec3 h = ro + rd * t;
      float depthBoost = smoothstep(0.0, 3.0, h.z);
      h.xy += skew * 0.15 * depthBoost;
      bool use = t > 0.0 && t < minT;
      gridUV = use ? h.xz / gridScale : gridUV;
      minT = use ? t : minT;
      hitIsY = use ? 0.0 : hitIsY;
    }

    // Plane 3: X-plane at pos = 0.5
    {
      float num = 0.5 - ro.x;
      float den = rd.x;
      float t = num / den;
      vec3 h = ro + rd * t;
      float depthBoost = smoothstep(0.0, 3.0, h.z);
      h.xy += skew * 0.15 * depthBoost;
      bool use = t > 0.0 && t < minT;
      gridUV = use ? h.xz / gridScale : gridUV;
      minT = use ? t : minT;
      hitIsY = use ? 0.0 : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);

    // Line jitter
    float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
    if (jitterAmt > 0.0) {
      vec2 j = vec2(
        sin(gridUV.y * 2.7 + iTime * 1.8),
        cos(gridUV.x * 2.3 - iTime * 1.6)
      ) * (0.15 * jitterAmt);
      gridUV += j;
    }

    float fx = fract(gridUV.x);
    float fy = fract(gridUV.y);
    float ax = min(fx, 1.0 - fx);
    float ay = min(fy, 1.0 - fy);
    float wx = fwidth(gridUV.x);
    float wy = fwidth(gridUV.y);
    float halfPx = max(0.0, uLineThickness) * 0.5;

    float tx = halfPx * wx;
    float ty = halfPx * wy;
    float aax = wx;
    float aay = wy;

    float lineX = 1.0 - smoothstep(tx, tx + aax, ax);
    float lineY = 1.0 - smoothstep(ty, ty + aay, ay);

    // Dashed / dotted style
    if (uLineStyle > 0.5) {
      float dashRepeat = 4.0;
      float dashDuty = 0.5;
      float vy = fract(gridUV.y * dashRepeat);
      float vx = fract(gridUV.x * dashRepeat);
      float dashMaskY = step(vy, dashDuty);
      float dashMaskX = step(vx, dashDuty);
      if (uLineStyle < 1.5) {
        lineX *= dashMaskY;
        lineY *= dashMaskX;
      } else {
        float dotRepeat = 6.0;
        float dotWidth = 0.18;
        float cy = abs(fract(gridUV.y * dotRepeat) - 0.5);
        float cx = abs(fract(gridUV.x * dotRepeat) - 0.5);
        float dotMaskY = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.y * dotRepeat), cy);
        float dotMaskX = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.x * dotRepeat), cx);
        lineX *= dotMaskY;
        lineY *= dotMaskX;
      }
    }

    float primaryMask = max(lineX, lineY);

    // Secondary grid on alternate axis
    vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
    if (jitterAmt > 0.0) {
      vec2 j2 = vec2(
        cos(gridUV2.y * 2.1 - iTime * 1.4),
        sin(gridUV2.x * 2.5 + iTime * 1.7)
      ) * (0.15 * jitterAmt);
      gridUV2 += j2;
    }

    float fx2 = fract(gridUV2.x);
    float fy2 = fract(gridUV2.y);
    float ax2 = min(fx2, 1.0 - fx2);
    float ay2 = min(fy2, 1.0 - fy2);
    float wx2 = fwidth(gridUV2.x);
    float wy2 = fwidth(gridUV2.y);
    float tx2 = halfPx * wx2;
    float ty2 = halfPx * wy2;
    float aax2 = wx2;
    float aay2 = wy2;

    float lineX2 = 1.0 - smoothstep(tx2, tx2 + aax2, ax2);
    float lineY2 = 1.0 - smoothstep(ty2, ty2 + aay2, ay2);

    if (uLineStyle > 0.5) {
      float dashRepeat2 = 4.0;
      float dashDuty2 = 0.5;
      float vy2m = fract(gridUV2.y * dashRepeat2);
      float vx2m = fract(gridUV2.x * dashRepeat2);
      float dashMaskY2 = step(vy2m, dashDuty2);
      float dashMaskX2 = step(vx2m, dashDuty2);
      if (uLineStyle < 1.5) {
        lineX2 *= dashMaskY2;
        lineY2 *= dashMaskX2;
      } else {
        float dotRepeat2 = 6.0;
        float dotWidth2 = 0.18;
        float cy2 = abs(fract(gridUV2.y * dotRepeat2) - 0.5);
        float cx2 = abs(fract(gridUV2.x * dotRepeat2) - 0.5);
        float dotMaskY2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.y * dotRepeat2), cy2);
        float dotMaskX2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.x * dotRepeat2), cx2);
        lineX2 *= dotMaskY2;
        lineY2 *= dotMaskX2;
      }
    }

    float altMask = max(lineX2, lineY2);

    float edgeDistX = min(abs(hit.x - (-0.5)), abs(hit.x - 0.5));
    float edgeDistY = min(abs(hit.y - (-0.2)), abs(hit.y - 0.2));
    float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
    float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
    altMask *= edgeGate;

    float lineMask = max(primaryMask, altMask);
    float fade = exp(-dist * fadeStrength);

    // ═══ Scan pulse (single automatic cycle, no loop) ═══
    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 2.0;
    float widthScale = max(0.1, uScanGlow);
    float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle);
    float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
    float phase = scanPhase;

    if (uScanDirection > 0.5 && uScanDirection < 1.5) {
      phase = 1.0 - phase;
    } else if (uScanDirection > 1.5) {
      float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
      phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
    }

    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float headFade = smoother01(0.0, taper, phase);
    float tailFade = 1.0 - smoother01(1.0 - taper, 1.0, phase);
    float phaseWindow = headFade * tailFade;

    float combinedPulse = lineBand * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    float combinedAura = (auraBand * 0.25) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    // Compose final color
    float lineVis = lineMask;
    vec3 gridCol = uLinesColor * lineVis * fade;
    vec3 scanCol = uScanColor * combinedPulse;
    vec3 scanAura = uScanColor * combinedAura;

    color = gridCol + scanCol + scanAura;

    // Film grain noise
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898, 78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;
    color = clamp(color, 0.0, 1.0);

    // Alpha from line visibility + scan pulse + halo
    float alpha = clamp(max(lineVis, combinedPulse), 0.0, 1.0);
    float gx = 1.0 - smoothstep(tx * 2.0, tx * 2.0 + aax * 2.0, ax);
    float gy = 1.0 - smoothstep(ty * 2.0, ty * 2.0 + aay * 2.0, ay);
    float halo = max(gx, gy) * fade;
    alpha = max(alpha, halo * clamp(uBloomOpacity, 0.0, 1.0));

    fragColor = vec4(color, alpha);
  }

  void main() {
    vec4 c;
    mainImage(c, vUv * iResolution.xy);
    gl_FragColor = c;
  }
`;

/* ── Helpers ── */

function srgbColor(hex: string): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function smoothDampVec2(
  current: THREE.Vector2,
  target: THREE.Vector2,
  vel: THREE.Vector2,
  smoothTime: number,
  maxSpeed: number,
  dt: number,
): THREE.Vector2 {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  const change = current.clone().sub(target);
  const originalTo = target.clone();
  const maxChange = maxSpeed * smoothTime;
  if (change.length() > maxChange) change.setLength(maxChange);

  const tgt = current.clone().sub(change);
  const temp = vel.clone().addScaledVector(change, omega).multiplyScalar(dt);
  vel.sub(temp.clone().multiplyScalar(omega)).multiplyScalar(exp);

  const out = tgt.clone().add(change.add(temp).multiplyScalar(exp));

  if (originalTo.clone().sub(current).dot(out.clone().sub(originalTo)) > 0) {
    out.copy(originalTo);
    vel.set(0, 0);
  }
  return out;
}

/* ── Props ── */

interface GridScanProps {
  lineThickness?: number;
  linesColor?: string;
  scanColor?: string;
  scanOpacity?: number;
  gridScale?: number;
  lineStyle?: "solid" | "dashed" | "dotted";
  lineJitter?: number;
  scanDirection?: "forward" | "backward" | "pingpong";
  noiseIntensity?: number;
  bloomIntensity?: number;
  scanGlow?: number;
  scanSoftness?: number;
  scanPhaseTaper?: number;
  scanDuration?: number;
  scanDelay?: number;
  sensitivity?: number;
  snapBackDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function GridScan({
  lineThickness = 1,
  linesColor = "#1a150f",
  scanColor = "#B8976A",
  scanOpacity = 0.5,
  gridScale = 0.08,
  lineStyle = "solid",
  lineJitter = 0.1,
  scanDirection = "pingpong",
  noiseIntensity = 0.008,
  bloomIntensity = 0,
  scanGlow = 0.5,
  scanSoftness = 2,
  scanPhaseTaper = 0.9,
  scanDuration = 2.0,
  scanDelay = 2.0,
  sensitivity = 0.55,
  snapBackDelay = 250,
  className,
  style,
}: GridScanProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rafRef = useRef<number>(0);

  const lookTarget = useRef(new THREE.Vector2(0, 0));
  const lookCurrent = useRef(new THREE.Vector2(0, 0));
  const lookVel = useRef(new THREE.Vector2(0, 0));

  const s = THREE.MathUtils.clamp(sensitivity, 0, 1);
  const skewScale = THREE.MathUtils.lerp(0.06, 0.2, s);
  const smoothTime = THREE.MathUtils.lerp(0.45, 0.12, s);
  const yBoost = THREE.MathUtils.lerp(1.2, 1.6, s);

  /* ── Mouse tracking ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;

    const onMove = (e: MouseEvent) => {
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      lookTarget.current.set(nx, ny);
    };
    const onEnter = () => { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; } };
    const onLeave = () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        lookTarget.current.set(0, 0);
      }, Math.max(0, snapBackDelay));
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [snapBackDelay]);

  /* ── Three.js setup ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const uniforms = {
      iResolution: { value: new THREE.Vector3(container.clientWidth, container.clientHeight, renderer.getPixelRatio()) },
      iTime: { value: 0 },
      uSkew: { value: new THREE.Vector2(0, 0) },
      uTilt: { value: 0 },
      uYaw: { value: 0 },
      uLineThickness: { value: lineThickness },
      uLinesColor: { value: srgbColor(linesColor) },
      uScanColor: { value: srgbColor(scanColor) },
      uGridScale: { value: gridScale },
      uLineStyle: { value: lineStyle === "dashed" ? 1 : lineStyle === "dotted" ? 2 : 0 },
      uLineJitter: { value: Math.max(0, Math.min(1, lineJitter)) },
      uScanOpacity: { value: scanOpacity },
      uNoise: { value: noiseIntensity },
      uBloomOpacity: { value: bloomIntensity },
      uScanGlow: { value: scanGlow },
      uScanSoftness: { value: scanSoftness },
      uPhaseTaper: { value: scanPhaseTaper },
      uScanDuration: { value: scanDuration },
      uScanDelay: { value: scanDelay },
      uScanDirection: { value: scanDirection === "backward" ? 1 : scanDirection === "pingpong" ? 2 : 0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    materialRef.current = material;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      material.uniforms.iResolution.value.set(
        container.clientWidth,
        container.clientHeight,
        renderer.getPixelRatio(),
      );
    };
    window.addEventListener("resize", onResize);

    let last = performance.now();
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;

      lookCurrent.current.copy(
        smoothDampVec2(lookCurrent.current, lookTarget.current, lookVel.current, smoothTime, Infinity, dt),
      );

      const skew = new THREE.Vector2(
        lookCurrent.current.x * skewScale,
        -lookCurrent.current.y * yBoost * skewScale,
      );
      material.uniforms.uSkew.value.set(skew.x, skew.y);
      material.uniforms.uTilt.value = 0;
      material.uniforms.uYaw.value = 0;
      material.uniforms.iTime.value = now / 1000;

      renderer.clear(true, true, true);
      renderer.render(scene, camera);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Update uniforms when props change ── */
  useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    const u = m.uniforms;
    u.uLineThickness.value = lineThickness;
    u.uLinesColor.value.copy(srgbColor(linesColor));
    u.uScanColor.value.copy(srgbColor(scanColor));
    u.uGridScale.value = gridScale;
    u.uLineStyle.value = lineStyle === "dashed" ? 1 : lineStyle === "dotted" ? 2 : 0;
    u.uLineJitter.value = Math.max(0, Math.min(1, lineJitter));
    u.uBloomOpacity.value = Math.max(0, bloomIntensity);
    u.uNoise.value = Math.max(0, noiseIntensity);
    u.uScanGlow.value = scanGlow;
    u.uScanOpacity.value = Math.max(0, Math.min(1, scanOpacity));
    u.uScanDirection.value = scanDirection === "backward" ? 1 : scanDirection === "pingpong" ? 2 : 0;
    u.uScanSoftness.value = scanSoftness;
    u.uPhaseTaper.value = scanPhaseTaper;
    u.uScanDuration.value = Math.max(0.05, scanDuration);
    u.uScanDelay.value = Math.max(0, scanDelay);
  }, [
    lineThickness, linesColor, scanColor, gridScale, lineStyle, lineJitter,
    bloomIntensity, noiseIntensity, scanGlow, scanOpacity, scanDirection,
    scanSoftness, scanPhaseTaper, scanDuration, scanDelay,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
