// Home hero: Thong's own Đà Nẵng skyline photo, rebuilt as a 3D point cloud of city lights.
// Loaded only on Home, after the page is visible. If anything fails, the plain photo stays.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("city");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Sample the photo: bright pixels become lights, a sparse sample of the rest gives the city its shape
const img = new Image();
img.src = canvas.dataset.src;
await img.decode();
const SW = 420, SH = Math.round(SW * img.height / img.width);
const off = document.createElement("canvas"); off.width = SW; off.height = SH;
const c2 = off.getContext("2d", { willReadFrequently: true }); c2.drawImage(img, 0, 0, SW, SH);
const px = c2.getImageData(0, 0, SW, SH).data;

const targets = [], starts = [], colors = [], delays = [], sizes = [];
const W3 = 22, H3 = W3 * SH / SW;
const HORIZON = Math.round(SH * .3);                                        // skip the sky: only the city below it
for (let y = HORIZON; y < SH; y++) for (let x = 0; x < SW; x++) {
  const i = (y * SW + x) * 4, r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
  const lum = .2126 * r + .7152 * g + .0722 * b;
  const warmth = r - b;                                                        // street lights and windows are warm
  const bright = lum > .55 || (lum > .38 && warmth > .08);
  const keep = bright || (lum > .16 && Math.random() < .05);
  if (!keep) continue;
  const v = (y - HORIZON) / (SH - HORIZON);                                   // 0 at horizon, 1 at bottom
  const depth = (1 - v) * -5 + (Math.random() - .5) * 1.2;                     // further back near the horizon
  targets.push((x / SW - .5) * W3, -v * H3 * .8, depth + (bright ? lum * 1.2 : 0));
  const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rad = 14 + Math.random() * 10;
  starts.push(rad * Math.sin(ph) * Math.cos(th), rad * Math.sin(ph) * Math.sin(th), rad * Math.cos(ph) - 8);
  // tint toward the site palette: warm lights go gold, cool ones go river-blue
  const warm = r > b;
  const tint = warm ? [1, .78, .38] : [.5, .7, 1];
  const k = bright ? .65 : .3;
  colors.push(r * (1 - k) + tint[0] * k, g * (1 - k) + tint[1] * k, b * (1 - k) + tint[2] * k);
  delays.push(Math.random() * .45 + (x / SW) * .25);                       // assembles left to right, with jitter
  sizes.push(bright ? 1.4 + lum * 1.6 : .8);
}

// 2. Scene
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
camera.position.set(0, -.6, 13);

const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(targets, 3));
geo.setAttribute("aStart", new THREE.Float32BufferAttribute(starts, 3));
geo.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
geo.setAttribute("aDelay", new THREE.Float32BufferAttribute(delays, 1));
geo.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));

const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uT: { value: reduce ? 1 : 0 }, uTime: { value: 0 }, uScale: { value: 1 } },
  vertexShader: `
    attribute vec3 aStart; attribute vec3 aColor; attribute float aDelay; attribute float aSize;
    uniform float uT; uniform float uTime; uniform float uScale;
    varying vec3 vColor; varying float vA;
    float ease(float t) { return 1.0 - pow(1.0 - t, 4.0); }
    void main() {
      float t = ease(clamp((uT - aDelay) / 0.55, 0.0, 1.0));
      vec3 p = mix(aStart, position, t);
      p.y += sin(uTime * 0.8 + position.x * 1.7) * 0.03 * t;               // gentle shimmer once assembled
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float tw = 0.75 + 0.25 * sin(uTime * 2.0 + position.x * 9.0 + position.y * 7.0);
      gl_PointSize = aSize * uScale * tw * (18.0 / -mv.z);
      vColor = aColor; vA = mix(0.35, 1.0, t);
    }`,
  fragmentShader: `
    varying vec3 vColor; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * vA);
    }`,
});
const points = new THREE.Points(geo, mat);
points.position.y = -.4;                                                       // city sits low, under the name
scene.add(points);

// 3. Size, input, loop
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  mat.uniforms.uScale.value = Math.min(w, 1400) / 900 * renderer.getPixelRatio();
  camera.position.z = w < 700 ? 17 : 13;
}
resize(); addEventListener("resize", resize);

let mx = 0, my = 0, visible = true, raf = 0;
addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduce) loop(); }).observe(canvas);
document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf && !reduce) loop(); });

const clock = new THREE.Clock();
const baseZ = () => (canvas.clientWidth < 700 ? 17 : 13);
function loop() {
  raf = 0;
  if (!visible || document.hidden) return;
  const dt = Math.min(clock.getDelta(), .05);
  mat.uniforms.uTime.value += dt;
  if (mat.uniforms.uT.value < 1.4) mat.uniforms.uT.value += dt / 2.2;    // ~2s assembly
  // camera drifts, follows the cursor, and pushes into the city as you scroll
  const s = Math.min(scrollY / innerHeight, 1);
  points.rotation.y += ((mx * .35 + Math.sin(mat.uniforms.uTime.value * .15) * .08) - points.rotation.y) * .04;
  points.rotation.x += ((my * .15) - points.rotation.x) * .04;
  camera.position.z += ((baseZ() - s * 5) - camera.position.z) * .08;
  renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);
}
canvas.classList.add("ready");
if (reduce) renderer.render(scene, camera); else loop();
