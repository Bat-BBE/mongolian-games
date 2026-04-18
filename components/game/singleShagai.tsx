"use client";

import { useRef, useEffect, useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShagaiSide, SHAGAI_INFO } from "./fourBonusType";
import {
  weightedTraditionalSide,
  buildTargetQuaternion,
  SHAGAI_SIDE_UP_AXIS,
} from "./shagai";
import { useGLTF } from "@react-three/drei";
import { pickLastShagai } from "./shagaiModel";

// Same anatomical aspect ratio as the single-shagai game, tuned to give a
// balanced traditional distribution (sheep/goat dominant but horse/camel
// still happen, onkh rare).
const PHYS_BOX: [number, number, number] = [1.35, 0.55, 2.15];

interface SingleShagaiProps {
  id: number;
  startPos: [number, number, number];
  throwVel: [number, number, number];
  throwAngVel: [number, number, number];
  isThrown: boolean;
  onSettle: (id: number, side: ShagaiSide) => void;
  highlight: boolean;
  resultSide: ShagaiSide | null;
  /**
   * Optional pre-decided outcome. When provided, the shagai will bias toward
   * this side instead of picking a random weighted one. Used for the robot's
   * turn so the visible 3D roll matches the pre-computed score.
   */
  forcedSide?: ShagaiSide | null;
}

function buildShagaiGeo(): THREE.BufferGeometry {
  const RADIAL = 24;
  const ZSEGS = 32;
  const LENGTH = 1.5;

  const profileAt = (t: number) => {
    const base = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 1.7)), 0.55);
    return { rx: base * 0.48, ry: base * 0.34 };
  };

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let zi = 0; zi <= ZSEGS; zi++) {
    const t = (zi / ZSEGS) * 2 - 1;
    const z = t * LENGTH * 0.5;
    const { rx, ry } = profileAt(t);

    for (let ri = 0; ri <= RADIAL; ri++) {
      const theta = (ri / RADIAL) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const yMod = sin > 0 ? 1.0 - sin * 0.2 : 1.0 + Math.abs(sin) * 0.16;
      const xMod = 1.0 + Math.abs(cos) * 0.09;
      positions.push(cos * rx * xMod, sin * ry * yMod, z);
      const nx = cos * xMod;
      const ny = sin * yMod;
      const len = Math.sqrt(nx * nx + ny * ny) || 1;
      normals.push(nx / len, ny / len, 0);
      uvs.push(ri / RADIAL, zi / ZSEGS);
    }
  }

  const ring = RADIAL + 1;
  for (let zi = 0; zi < ZSEGS; zi++) {
    for (let ri = 0; ri < RADIAL; ri++) {
      const a = zi * ring + ri;
      const b = (zi + 1) * ring + ri;
      const c = (zi + 1) * ring + ri + 1;
      const d = zi * ring + ri + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export default function SingleShagai({
  id,
  startPos,
  throwVel,
  throwAngVel,
  isThrown,
  onSettle,
  highlight,
  resultSide,
  forcedSide,
}: SingleShagaiProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const posRef = useRef<[number, number, number]>(startPos);
  const airtimeRef = useRef(0);
  const reportedRef = useRef(false);
  const glowRef = useRef<THREE.PointLight>(null);
  // Tracks whether the player has actually thrown the shagai at least once.
  // Before the first throw we keep the bone idle on the mat so it doesn't
  // look like it's been auto-thrown when the game opens.
  const hasThrownRef = useRef(false);
  // Slightly staggered rest spot on the mat (per shagai), low enough that
  // the body sits on top of the floor plane without bouncing.
  const restPos: [number, number, number] = [
    startPos[0],
    PHYS_BOX[1] / 2 + 0.02,
    startPos[2],
  ];
  // Pre-decided outcome + smooth snap machinery (mirrors ShagaiModel).
  const decidedSideRef = useRef<ShagaiSide>("sheep");
  const snapStartQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const snapTargetQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const snapStartPosRef = useRef<[number, number, number]>(startPos);
  const snapActiveRef = useRef(false);
  const snapElapsedRef = useRef(0);
  const SNAP_DURATION = 0.22;
  const restHeightsRef = useRef<Record<ShagaiSide, number>>({
    sheep: PHYS_BOX[2] / 2,
    goat: PHYS_BOX[2] / 2,
    horse: PHYS_BOX[1] / 2,
    camel: PHYS_BOX[1] / 2,
  });
  const gltf = useGLTF("/models/shagai_model.glb");
  const model = useMemo(() => {
    const scene = (gltf as any)?.scene as THREE.Object3D | undefined;
    const wrap = pickLastShagai(scene, PHYS_BOX);
    if (!wrap) return null;
    wrap.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return wrap;
  }, [gltf]);

  // Measure the true visual rest height for each side from the real mesh
  // vertices, so the bone sits flush on the floor no matter which face
  // is up (the mesh is not symmetric around its bounding box center).
  useEffect(() => {
    if (!model) return;
    model.updateMatrix();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const sides: ShagaiSide[] = ["sheep", "goat", "horse", "camel"];
    const next: Record<ShagaiSide, number> = { ...restHeightsRef.current };
    const v = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
    for (const side of sides) {
      const alignQuat = new THREE.Quaternion().setFromUnitVectors(
        SHAGAI_SIDE_UP_AXIS[side].clone(),
        worldUp,
      );
      let minY = Infinity;
      for (const child of model.children) {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry?.attributes?.position) continue;
        mesh.updateMatrix();
        matrix.multiplyMatrices(model.matrix, mesh.matrix);
        const posAttr = mesh.geometry.attributes
          .position as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i++) {
          v.fromBufferAttribute(posAttr, i);
          v.applyMatrix4(matrix);
          v.applyQuaternion(alignQuat);
          if (v.y < minY) minY = v.y;
        }
      }
      if (Number.isFinite(minY)) {
        next[side] = -minY + 0.004;
      }
    }
    restHeightsRef.current = next;
  }, [model]);

  // Fallback geometry (in case GLB fails to load)
  const geo = useMemo(() => buildShagaiGeo(), []);

  // Physics box
  const [ref, api] = useBox(() => ({
    mass: 0.5,
    // Start the shagai resting on the mat, not mid-air. The physics
    // simulation will keep it quietly asleep until the player actually
    // presses "Throw".
    position: restPos,
    args: PHYS_BOX,
    allowSleep: true,
    sleepSpeedLimit: 0.2,
    sleepTimeLimit: 0.2,
    // Moderate values — friction low enough that the shagai can roll onto
    // its wide face, damping low enough that it tumbles for a bit before
    // coming to rest (otherwise it locks into whatever narrow side it
    // first touched).
    restitution: 0.2,
    friction: 0.55,
    linearDamping: 0.22,
    angularDamping: 0.22,
  }));

  useEffect(() => {
    const u1 = api.velocity.subscribe((v) => {
      velRef.current = v;
    });
    const u2 = api.position.subscribe((p) => {
      posRef.current = p;
    });
    return () => {
      u1();
      u2();
    };
  }, [api]);

  // Settle the bone onto the mat at mount so it doesn't jitter, then put it
  // to sleep until the player throws.
  useEffect(() => {
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    // Neutral flat resting rotation (sheep-up roughly): the exact face shown
    // isn't important before the first throw.
    api.rotation.set(0, 0, 0);
    api.position.set(restPos[0], restPos[1], restPos[2]);
    // Give the solver one frame to settle, then sleep.
    const t = setTimeout(() => api.sleep(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // Шидэх
  useEffect(() => {
    if (!isThrown) return;
    hasThrownRef.current = true;
    reportedRef.current = false;
    airtimeRef.current = 0;
    snapActiveRef.current = false;
    snapElapsedRef.current = 0;

    // Pre-decide the outcome: if a forced side was supplied (e.g. robot's
    // turn with a pre-rolled outcome), use that; otherwise fall back to the
    // weighted traditional distribution.
    decidedSideRef.current = forcedSide ?? weightedTraditionalSide();

    // Wake up the body in case a previous throw ended with api.sleep().
    api.wakeUp();
    api.position.set(...startPos);
    api.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    );
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);

    const t = setTimeout(
      () => {
        api.velocity.set(...throwVel);
        api.angularVelocity.set(...throwAngVel);
      },
      id * 60 + 40,
    );

    return () => {
      clearTimeout(t);
    };
  }, [isThrown]); // eslint-disable-line

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Before the first throw the shagai just sits on the mat — no airtime,
    // no settle detection, no bias torque.
    if (!hasThrownRef.current) return;

    airtimeRef.current += delta;

    // Floor safety: only catch the shagai if it falls BELOW the floor plane.
    if (posRef.current[1] < -0.2) {
      api.position.set(
        posRef.current[0],
        PHYS_BOX[1] / 2 + 0.01,
        posRef.current[2],
      );
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }

    if (reportedRef.current) {
      if (glowRef.current && highlight) {
        glowRef.current.intensity = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
      }
      return;
    }

    const [vx, vy, vz] = velRef.current;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    // Allow any resting orientation: widest half-dim of the box + buffer.
    const grounded = posRef.current[1] < 1.1;

    // --- Smooth orientation snap to the pre-decided side ---------------
    if (snapActiveRef.current) {
      snapElapsedRef.current += delta;
      const t = Math.min(1, snapElapsedRef.current / SNAP_DURATION);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const q = new THREE.Quaternion()
        .copy(snapStartQuatRef.current)
        .slerp(snapTargetQuatRef.current, e);
      api.quaternion.set(q.x, q.y, q.z, q.w);
      const targetY = restHeightsRef.current[decidedSideRef.current];
      const startY = snapStartPosRef.current[1];
      const py = startY + (targetY - startY) * e;
      api.position.set(
        snapStartPosRef.current[0],
        py,
        snapStartPosRef.current[2],
      );
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      if (t >= 1) {
        snapActiveRef.current = false;
        reportedRef.current = true;
        api.sleep();
        onSettle(id, decidedSideRef.current);
      }
      return;
    }

    // --- Gentle in-flight bias toward the pre-decided orientation ----------
    if (airtimeRef.current > 0.25 && speed > 0.2) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      const targetLocal = SHAGAI_SIDE_UP_AXIS[decidedSideRef.current]
        .clone()
        .applyQuaternion(currentQuat);
      const worldUp = new THREE.Vector3(0, 1, 0);
      const alignDot = targetLocal.dot(worldUp);
      if (alignDot < 0.98) {
        const torqueAxis = new THREE.Vector3()
          .crossVectors(targetLocal, worldUp)
          .normalize()
          .multiplyScalar(1.2);
        api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
      }
    }

    const nearRest = airtimeRef.current > 1.4 && speed < 0.8 && grounded;
    const forceSnap = airtimeRef.current > 4.5;
    if (nearRest || forceSnap) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      snapStartQuatRef.current.copy(currentQuat);
      snapTargetQuatRef.current.copy(
        buildTargetQuaternion(decidedSideRef.current),
      );
      snapStartPosRef.current = [
        posRef.current[0],
        posRef.current[1],
        posRef.current[2],
      ];
      snapElapsedRef.current = 0;
      snapActiveRef.current = true;
    }
  });

  const sideColor = resultSide ? SHAGAI_INFO[resultSide].color : "#ddd0aa";
  const sideGlow = resultSide
    ? SHAGAI_INFO[resultSide].glow
    : "rgba(255,255,255,0.1)";

  useEffect(() => {
    if (!model) return;
    const col = new THREE.Color(highlight ? sideColor : "#ddd0aa");
    model.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh) return;
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as
        | THREE.MeshStandardMaterial
        | THREE.MeshStandardMaterial[];
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        if (!m) continue;
        // Keep original textures, only add a gentle emissive tint when highlighted.
        m.emissive = highlight ? col : new THREE.Color(0x000000);
        m.emissiveIntensity = highlight ? 0.12 : 0;
        m.roughness = Math.min(0.9, Math.max(0.35, m.roughness ?? 0.55));
        m.metalness = Math.min(0.25, Math.max(0.0, m.metalness ?? 0.05));
        (m as any).envMapIntensity = (m as any).envMapIntensity ?? 0.45;
        m.needsUpdate = true;
      }
    });
  }, [model, highlight, sideColor]);

  return (
    <group
      ref={(node) => {
        (ref as React.MutableRefObject<THREE.Object3D | null>).current = node;
        (groupRef as React.MutableRefObject<THREE.Group | null>).current = node;
      }}
    >
      {/* Physics collider (invisible): keep stable even if the visual model changes */}
      <mesh visible={false}>
        <boxGeometry args={PHYS_BOX} />
        <meshStandardMaterial />
      </mesh>

      {/* Visual model: pick the LAST shagai (3rd child) from the GLB,
          auto-centered, auto-aligned, auto-scaled to fit the physics
          collider. */}
      {model ? (
        <primitive object={model} position={[0, 0, 0]} />
      ) : (
        // Fallback: procedural geometry if GLB not available
        <mesh castShadow receiveShadow geometry={geo}>
          <meshStandardMaterial
            color={highlight ? sideColor : "#ddd0aa"}
            roughness={0.5}
            metalness={highlight ? 0.12 : 0.04}
            emissive={highlight ? sideColor : "#000000"}
            emissiveIntensity={highlight ? 0.15 : 0}
          />
        </mesh>
      )}

      {/* Дөрвөн бэрх үед гэрэлтэх */}
      {highlight && (
        <pointLight
          ref={glowRef}
          color={sideColor}
          intensity={0.8}
          distance={2.5}
        />
      )}
    </group>
  );
}

useGLTF.preload("/models/shagai_model.glb");
