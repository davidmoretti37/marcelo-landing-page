"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/* ── Grid vertex shader — fullscreen quad ── */
const gridVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ── Grid fragment shader — 3D perspective grid + scan pulse ──
   Metal-safe: NO loops. 4-plane raycast fully unrolled.
*/
const gridFrag = /* glsl */ `
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

    // Plane 0: Y-plane at -0.2
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
    // Plane 1: Y-plane at 0.2
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
    // Plane 2: X-plane at -0.5
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
    // Plane 3: X-plane at 0.5
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

    float lineX2 = 1.0 - smoothstep(tx2, tx2 + wx2, ax2);
    float lineY2 = 1.0 - smoothstep(ty2, ty2 + wy2, ay2);

    if (uLineStyle > 0.5) {
      float vy2m = fract(gridUV2.y * 4.0);
      float vx2m = fract(gridUV2.x * 4.0);
      if (uLineStyle < 1.5) {
        lineX2 *= step(vy2m, 0.5);
        lineY2 *= step(vx2m, 0.5);
      } else {
        float cy2 = abs(fract(gridUV2.y * 6.0) - 0.5);
        float cx2 = abs(fract(gridUV2.x * 6.0) - 0.5);
        lineX2 *= 1.0 - smoothstep(0.18, 0.18 + fwidth(gridUV2.y * 6.0), cy2);
        lineY2 *= 1.0 - smoothstep(0.18, 0.18 + fwidth(gridUV2.x * 6.0), cx2);
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

    // Scan pulse
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

    float lineVis = lineMask;
    vec3 gridCol = uLinesColor * lineVis * fade;
    vec3 scanCol = uScanColor * combinedPulse;
    vec3 scanAura = uScanColor * combinedAura;

    color = gridCol + scanCol + scanAura;

    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898, 78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;
    color = clamp(color, 0.0, 1.0);

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

/* ── Component ── */

export default function GarageScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const lookTarget = useRef(new THREE.Vector2(0, 0));
  const lookCurrent = useRef(new THREE.Vector2(0, 0));
  const lookVel = useRef(new THREE.Vector2(0, 0));

  /* ── Mouse tracking ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const onMove = (e: MouseEvent) => {
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      const rect = el.getBoundingClientRect();
      lookTarget.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      );
    };
    const onEnter = () => { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; } };
    const onLeave = () => {
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => lookTarget.current.set(0, 0), 250);
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
  }, []);

  /* ── Three.js: single-pass grid renderer ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const gridScene = new THREE.Scene();
    const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const gridUniforms = {
      iResolution: { value: new THREE.Vector3(container.clientWidth, container.clientHeight, renderer.getPixelRatio()) },
      iTime: { value: 0 },
      uSkew: { value: new THREE.Vector2(0, 0) },
      uTilt: { value: 0 },
      uYaw: { value: 0 },
      uLineThickness: { value: 1.2 },
      uLinesColor: { value: srgbColor("#c8bca8") },
      uScanColor: { value: srgbColor("#D4AA6A") },
      uGridScale: { value: 0.06 },
      uLineStyle: { value: 0 },
      uLineJitter: { value: 0.05 },
      uScanOpacity: { value: 0.75 },
      uNoise: { value: 0.003 },
      uBloomOpacity: { value: 0 },
      uScanGlow: { value: 0.9 },
      uScanSoftness: { value: 2.5 },
      uPhaseTaper: { value: 0.9 },
      uScanDuration: { value: 4.0 },
      uScanDelay: { value: 1.0 },
      uScanDirection: { value: 2 },
    };

    const gridMat = new THREE.ShaderMaterial({
      uniforms: gridUniforms,
      vertexShader: gridVert,
      fragmentShader: gridFrag,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const gridQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gridMat);
    gridScene.add(gridQuad);

    const onResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      renderer.setSize(rw, rh);
      gridUniforms.iResolution.value.set(rw, rh, renderer.getPixelRatio());
    };
    window.addEventListener("resize", onResize);

    const skewScale = 0.12;
    const yBoost = 1.4;
    const smoothTime = 0.25;

    let last = performance.now();
    function tick() {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;

      lookCurrent.current.copy(
        smoothDampVec2(lookCurrent.current, lookTarget.current, lookVel.current, smoothTime, Infinity, dt),
      );
      gridUniforms.uSkew.value.set(
        lookCurrent.current.x * skewScale,
        -lookCurrent.current.y * yBoost * skewScale,
      );
      gridUniforms.iTime.value = now / 1000;

      renderer.render(gridScene, orthoCam);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      gridMat.dispose();
      gridQuad.geometry.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
