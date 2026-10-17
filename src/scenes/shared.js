// Shapes and camera constants shared by the hero, the scroll morph, and the
// language sphere, so particles land exactly where the 3D objects are.
import * as THREE from 'three';

export const HERO_CAMERA_Z = 9;
export const HERO_FOV = 45;
export const GLOBE_RADIUS = 1.45;
export const LANG_FOV = 40;

/** Language-sphere camera distance (pulled back on narrow canvases). */
export function languageCameraZ(aspect) {
  return aspect < 1 ? 8.2 / Math.max(aspect, 0.65) : 8.2;
}

/** The hero's low-poly crystal: an icosahedron with jittered vertices. */
export function makeCrystalGeometry() {
  const geo = new THREE.IcosahedronGeometry(1.5, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) * 0.12;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x, v.y * 1.15, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Random points spread along a geometry's edges (reads as a wireframe). */
export function samplePointsOnEdges(edgeGeometry, count, jitter = 0) {
  const p = edgeGeometry.attributes.position;
  const segs = p.count / 2;
  const out = new Float32Array(count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const s = Math.floor(Math.random() * segs);
    a.fromBufferAttribute(p, s * 2);
    b.fromBufferAttribute(p, s * 2 + 1);
    a.lerp(b, Math.random());
    out[i * 3] = a.x + (Math.random() - 0.5) * jitter;
    out[i * 3 + 1] = a.y + (Math.random() - 0.5) * jitter;
    out[i * 3 + 2] = a.z + (Math.random() - 0.5) * jitter;
  }
  return out;
}

/** Random points on a geometry's triangle faces. */
export function samplePointsOnFaces(geometry, count) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const p = g.attributes.position;
  const tris = p.count / 3;
  const out = new Float32Array(count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = Math.floor(Math.random() * tris);
    a.fromBufferAttribute(p, t * 3);
    b.fromBufferAttribute(p, t * 3 + 1);
    c.fromBufferAttribute(p, t * 3 + 2);
    let u = Math.random();
    let w = Math.random();
    if (u + w > 1) [u, w] = [1 - u, 1 - w];
    a.multiplyScalar(1 - u - w).addScaledVector(b, u).addScaledVector(c, w);
    out.set([a.x, a.y, a.z], i * 3);
  }
  return out;
}
