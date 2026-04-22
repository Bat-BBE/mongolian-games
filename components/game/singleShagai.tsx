"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShagaiSide, SHAGAI_INFO } from "./fourBonusType";
import {
  biasSideForAirTorque,
  biasSideForThrow,
  detectShagaiSideFromQuaternion,
  isShagaiOnkh,
  SHAGAI_PHYS_BOX,
  SHAGAI_SIDE_UP_AXIS,
} from "./shagai";
import { useGLTF } from "@react-three/drei";
import { pickLastShagai } from "./shagaiModel";
import type { KnockBurst } from "./shagaiSevenKnock";
import { playShagaiLandSound } from "@/lib/shagaiLandSound";

const PHYS_BOX = SHAGAI_PHYS_BOX;
const DEFAULT_MAX_ONKH_RETRIES = 14;
/** Тогтоолтонд оньс хэвээр үлдэх магадлал (~1%); үлдсэн нь applyTorque/impulse-оор хазайлгана. */
const SETTLE_ONKH_ACCEPT_PROBABILITY = 0.01;

export function useShagaiThrowPieceTemplate(): THREE.Object3D | null {
  const gltf = useGLTF("/models/shagai_model.glb");
  return useMemo(() => {
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
}

interface SingleShagaiProps {
  id: number;
  startPos: [number, number, number];
  throwVel: [number, number, number];
  throwAngVel: [number, number, number];
  isThrown: boolean;
  onSettle: (id: number, side: ShagaiSide) => void;
  highlight: boolean;
  muted?: boolean;
  resultSide: ShagaiSide | null;
  /** @see useShagaiThrowPieceTemplate — нэг удаа үүсгэсэн загварыг дамжуулбал анхны ачаалал хөнгөрнө. */
  pieceTemplate?: THREE.Object3D | null;
  /** Физик тогтсоноос хойш байрлалыг тогтмол илгээнэ (жишээ нь долоон шагайн зам шалгах). */
  onPositionUpdate?: (id: number, pos: [number, number, number]) => void;
  /** Нэг кадр тутамд энэ id-д заасан байрлалд тулгах (ньсрэх анимац). */
  kinematicTargetRef?: React.MutableRefObject<
    Record<number, [number, number, number] | null>
  >;
  knockBurstRef?: React.MutableRefObject<
    Record<number, KnockBurst | undefined>
  >;
  /** false: тоглоомоос авсан — талбараас нуух, физик унтраах. */
  presentOnTable?: boolean;
  /** Оньс давталтын дээд хязгаар (анхдагч 14). */
  maxOnkhRetries?: number;
  /** `isShagaiOnkh`-д — бага утга = илүү олон тохиолдолд оньс гэж үзнэ. */
  onkhMinTipDot?: number;
}

function buildShagaiGeo(): THREE.BufferGeometry {
  const RADIAL = 20;
  const ZSEGS = 26;
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
  muted = false,
  resultSide,
  pieceTemplate,
  onPositionUpdate,
  kinematicTargetRef,
  knockBurstRef,
  presentOnTable = true,
  maxOnkhRetries = DEFAULT_MAX_ONKH_RETRIES,
  onkhMinTipDot = 0.76,
}: SingleShagaiProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastPosEmitRef = useRef(0);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const posRef = useRef<[number, number, number]>(startPos);
  const airtimeRef = useRef(0);
  const reportedRef = useRef(false);
  /** Эхний газартай мөргөлт — onSettle хүртэл 1s+ хүлээгддэг тул дууг энд тоглуулна. */
  const landSoundPlayedRef = useRef(false);
  const wasAboveImpactRef = useRef(false);
  const glowRef = useRef<THREE.PointLight>(null);
  const hasThrownRef = useRef(false);
  const restPos: [number, number, number] = [
    startPos[0],
    PHYS_BOX[1] / 2 + 0.02,
    startPos[2],
  ];
  const angVelRef = useRef<[number, number, number]>([0, 0, 0]);
  /** Нисэх үед torque-ийн чиглэл — тал хэлэхэд detect ашиглана. */
  const biasTargetRef = useRef<ShagaiSide>("sheep");
  const onkhRetryRef = useRef(0);
  const restHeightsRef = useRef<Record<ShagaiSide, number>>({
    sheep: PHYS_BOX[2] / 2,
    goat: PHYS_BOX[2] / 2,
    horse: PHYS_BOX[1] / 2,
    camel: PHYS_BOX[1] / 2,
  });
  const gltf = useGLTF("/models/shagai_model.glb");
  const model = useMemo(() => {
    if (pieceTemplate) {
      const wrap = pieceTemplate.clone(true) as THREE.Group;
      wrap.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const m = o as THREE.Mesh;
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      return wrap;
    }
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
  }, [gltf, pieceTemplate]);

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

  const geo = useMemo(() => buildShagaiGeo(), []);

  const [ref, api] = useBox(() => ({
    mass: 0.5,
    position: restPos,
    args: PHYS_BOX,
    allowSleep: true,
    sleepSpeedLimit: 0.2,
    sleepTimeLimit: 0.2,
    restitution: 0.14,
    friction: 0.72,
    linearDamping: 0.28,
    angularDamping: 0.38,
  }));

  useEffect(() => {
    const u1 = api.velocity.subscribe((v) => {
      velRef.current = v;
    });
    const u2 = api.position.subscribe((p) => {
      posRef.current = p;
    });
    const u3 = api.angularVelocity.subscribe((w) => {
      angVelRef.current = w;
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, [api]);

  useEffect(() => {
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);
    api.rotation.set(0, 0, 0);
    api.position.set(restPos[0], restPos[1], restPos[2]);
    const t = setTimeout(() => api.sleep(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    if (!isThrown) {
      onkhRetryRef.current = 0;
      return;
    }
    hasThrownRef.current = true;
    reportedRef.current = false;
    landSoundPlayedRef.current = false;
    wasAboveImpactRef.current = false;
    airtimeRef.current = 0;
    onkhRetryRef.current = 0;
    biasTargetRef.current = biasSideForAirTorque();

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
  }, [isThrown]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!presentOnTable) {
      groupRef.current.visible = false;
      api.sleep();
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.position.set(0, -45, 0);
      return;
    }
    groupRef.current.visible = true;

    if (!hasThrownRef.current) return;

    airtimeRef.current += delta;

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
      const kb = knockBurstRef?.current[id];
      if (kb) {
        delete knockBurstRef.current[id];
        api.wakeUp();
        reportedRef.current = false;
        landSoundPlayedRef.current = false;
        wasAboveImpactRef.current = false;
        airtimeRef.current = 0;
        /** Мөргөлдөөний дараах өнхрөлт: шинэ bias (дөрвөн тал) — анхны тал руу «наалдахгүй». */
        biasTargetRef.current = biasSideForThrow();
        onkhRetryRef.current = 0;
        const v = velRef.current;
        api.velocity.set(v[0] + kb.lin[0], v[1] + kb.lin[1], v[2] + kb.lin[2]);
        const w = angVelRef.current;
        api.angularVelocity.set(
          w[0] + kb.ang[0],
          w[1] + kb.ang[1],
          w[2] + kb.ang[2],
        );
        return;
      }
      const kt = kinematicTargetRef?.current[id];
      if (kt) {
        api.wakeUp();
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0, 0, 0);
        api.position.set(kt[0], kt[1], kt[2]);
        posRef.current = [kt[0], kt[1], kt[2]];
      } else if (onPositionUpdate) {
        const now = performance.now();
        if (now - lastPosEmitRef.current > 90) {
          lastPosEmitRef.current = now;
          const p = posRef.current;
          onPositionUpdate(id, [p[0], p[1], p[2]]);
        }
      }
      if (glowRef.current && highlight) {
        glowRef.current.intensity = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
      }
      return;
    }

    const [vx, vy, vz] = velRef.current;
    const [wx, wy, wz] = angVelRef.current;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const angSpeed = Math.sqrt(wx * wx + wy * wy + wz * wz);
    const grounded = posRef.current[1] < 1.1;
    const py = posRef.current[1];

    if (py > 0.68) wasAboveImpactRef.current = true;
    if (
      !landSoundPlayedRef.current &&
      !muted &&
      airtimeRef.current > 0.1 &&
      wasAboveImpactRef.current &&
      py <= 0.58 &&
      py > 0.06
    ) {
      landSoundPlayedRef.current = true;
      playShagaiLandSound();
    }

    if (airtimeRef.current > 0.22 && speed > 0.12) {
      const currentQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(currentQuat);
      const targetLocal = SHAGAI_SIDE_UP_AXIS[biasTargetRef.current]
        .clone()
        .applyQuaternion(currentQuat);
      const worldUp = new THREE.Vector3(0, 1, 0);
      const alignDot = targetLocal.dot(worldUp);
      if (alignDot < 0.91) {
        const torqueAxis = new THREE.Vector3()
          .crossVectors(targetLocal, worldUp)
          .normalize()
          .multiplyScalar(4.2);
        api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
      }
    }

    // Удаан хөдөлгөөн багатай, газарт ойрхон үед ч оньс руу «тааруулах» түлхэлт
    if (
      airtimeRef.current > 0.35 &&
      grounded &&
      speed < 0.55 &&
      angSpeed < 0.55
    ) {
      const qSlow = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(qSlow);
      if (isShagaiOnkh(qSlow, onkhMinTipDot * 0.92)) {
        biasTargetRef.current = biasSideForAirTorque();
        const targetLocal = SHAGAI_SIDE_UP_AXIS[biasTargetRef.current]
          .clone()
          .applyQuaternion(qSlow);
        const worldUp = new THREE.Vector3(0, 1, 0);
        const alignDot = targetLocal.dot(worldUp);
        if (alignDot < 0.94) {
          let torqueAxis = new THREE.Vector3()
            .crossVectors(targetLocal, worldUp)
            .normalize();
          if (torqueAxis.lengthSq() < 1e-8) {
            torqueAxis.set(
              (Math.random() - 0.5) * 2,
              0,
              (Math.random() - 0.5) * 2,
            ).normalize();
          }
          torqueAxis.multiplyScalar(5.5);
          api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
        }
      }
    }

    const nearRest =
      airtimeRef.current > 1.1 && speed < 0.28 && angSpeed < 0.22 && grounded;
    const stall = airtimeRef.current > 9;
    if (nearRest || stall) {
      const q = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(q);

      if (
        isShagaiOnkh(q, onkhMinTipDot) &&
        onkhRetryRef.current < maxOnkhRetries
      ) {
        onkhRetryRef.current += 1;
        airtimeRef.current = 0;
        biasTargetRef.current = biasSideForAirTorque();
        api.wakeUp();
        api.position.set(...startPos);
        api.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        );
        const j = (spread: number) => (Math.random() - 0.5) * spread;
        api.velocity.set(
          throwVel[0] + j(0.5),
          throwVel[1],
          throwVel[2] + j(0.5),
        );
        api.angularVelocity.set(
          throwAngVel[0] + j(3),
          throwAngVel[1] + j(3),
          throwAngVel[2] + j(3),
        );
        return;
      }

      if (
        isShagaiOnkh(q, onkhMinTipDot) &&
        !stall &&
        Math.random() > SETTLE_ONKH_ACCEPT_PROBABILITY
      ) {
        api.wakeUp();
        biasTargetRef.current = biasSideForAirTorque();
        const targetLocal = SHAGAI_SIDE_UP_AXIS[biasTargetRef.current]
          .clone()
          .applyQuaternion(q);
        const worldUp = new THREE.Vector3(0, 1, 0);
        let torqueAxis = new THREE.Vector3().crossVectors(targetLocal, worldUp);
        if (torqueAxis.lengthSq() < 1e-8) {
          torqueAxis.set(
            (Math.random() - 0.5) * 2,
            0.04,
            (Math.random() - 0.5) * 2,
          );
        }
        torqueAxis.normalize().multiplyScalar(16);
        api.applyTorque([torqueAxis.x, torqueAxis.y, torqueAxis.z]);
        api.applyImpulse([0, 0.2, 0], [0, 0, 0]);
        const j = () => (Math.random() - 0.5) * 5;
        api.angularVelocity.set(j(), j() + 1.6, j());
        airtimeRef.current = Math.max(0.62, airtimeRef.current - 0.42);
        return;
      }

      const side = detectShagaiSideFromQuaternion(q);
      const y = restHeightsRef.current[side];
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
      api.position.set(posRef.current[0], y, posRef.current[2]);
      api.sleep();
      reportedRef.current = true;
      if (!landSoundPlayedRef.current && !muted) {
        playShagaiLandSound();
        landSoundPlayedRef.current = true;
      }
      onSettle(id, side);
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
        if (muted) {
          m.emissive = new THREE.Color(0x000000);
          m.emissiveIntensity = 0;
          m.transparent = true;
          m.opacity = 0.42;
        } else {
          m.transparent = false;
          m.opacity = 1;
          m.emissive = highlight ? col : new THREE.Color(0x000000);
          m.emissiveIntensity = highlight ? 0.12 : 0;
        }
        m.roughness = Math.min(0.9, Math.max(0.35, m.roughness ?? 0.55));
        m.metalness = Math.min(0.25, Math.max(0.0, m.metalness ?? 0.05));
        (m as any).envMapIntensity = (m as any).envMapIntensity ?? 0.45;
        m.needsUpdate = true;
      }
    });
  }, [model, highlight, muted, sideColor]);

  return (
    <group
      ref={(node) => {
        (ref as React.MutableRefObject<THREE.Object3D | null>).current = node;
        (groupRef as React.MutableRefObject<THREE.Group | null>).current = node;
      }}
    >
      <mesh visible={false}>
        <boxGeometry args={PHYS_BOX} />
        <meshStandardMaterial />
      </mesh>

      {model ? (
        <primitive object={model} position={[0, 0, 0]} />
      ) : (
        <mesh castShadow receiveShadow geometry={geo}>
          <meshStandardMaterial
            color={highlight ? sideColor : "#ddd0aa"}
            roughness={0.5}
            metalness={highlight ? 0.12 : 0.04}
            emissive={highlight ? sideColor : "#000000"}
            emissiveIntensity={highlight ? 0.15 : 0}
            transparent={muted}
            opacity={muted ? 0.42 : 1}
          />
        </mesh>
      )}

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
