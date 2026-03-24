"use client";

import { useRef, useEffect, useMemo } from "react";
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ShagaiSide, SHAGAI_INFO, detectSide } from "./fourBonusType";

interface SingleShagaiProps {
  id: number;
  startPos: [number, number, number];
  throwVel: [number, number, number];
  throwAngVel: [number, number, number];
  isThrown: boolean;
  onSettle: (id: number, side: ShagaiSide) => void;
  highlight: boolean;
  resultSide: ShagaiSide | null;
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
}: SingleShagaiProps) {
  const groupRef = useRef<THREE.Group>(null);
  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const posRef = useRef<[number, number, number]>(startPos);
  const settleRef = useRef(0);
  const reportedRef = useRef(false);
  const glowRef = useRef<THREE.PointLight>(null);
  const geo = useMemo(() => buildShagaiGeo(), []);

  // Physics box
  const [ref, api] = useBox(() => ({
    mass: 0.55,
    position: startPos,
    args: [0.98, 0.7, 1.52] as [number, number, number],
    restitution: 0.2,
    friction: 0.82,
    linearDamping: 0.3,
    angularDamping: 0.25,
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

  // Шидэх
  useEffect(() => {
    if (!isThrown) return;
    reportedRef.current = false;
    settleRef.current = 0;

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
    ); // Тус бүр бага зэрэг өөр хугацаанд

    const safety = setTimeout(() => {
      if (!reportedRef.current) {
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0, 0, 0);
      }
    }, 7000);

    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
  }, [isThrown]); // eslint-disable-line

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Floor safety
    if (posRef.current[1] < 0.35) {
      api.position.set(posRef.current[0], 0.35, posRef.current[2]);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }

    if (reportedRef.current) {
      // Тогтсон шагай — glow анимац
      if (glowRef.current && highlight) {
        glowRef.current.intensity = 0.6 + Math.sin(Date.now() * 0.004) * 0.4;
      }
      return;
    }

    const [vx, vy, vz] = velRef.current;
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    if (speed < 0.07) {
      settleRef.current += delta;
      if (settleRef.current > 0.65) {
        reportedRef.current = true;
        const { x, z } = groupRef.current.rotation;
        onSettle(id, detectSide(x, z));
      }
    } else {
      settleRef.current = 0;
    }
  });

  const sideColor = resultSide ? SHAGAI_INFO[resultSide].color : "#ddd0aa";
  const sideGlow = resultSide
    ? SHAGAI_INFO[resultSide].glow
    : "rgba(255,255,255,0.1)";

  return (
    <group
      ref={(node) => {
        (ref as React.MutableRefObject<THREE.Object3D | null>).current = node;
        (groupRef as React.MutableRefObject<THREE.Group | null>).current = node;
      }}
    >
      {/* Гол бие */}
      <mesh castShadow receiveShadow geometry={geo}>
        <meshStandardMaterial
          color={highlight ? sideColor : "#ddd0aa"}
          roughness={0.5}
          metalness={highlight ? 0.12 : 0.04}
          emissive={highlight ? sideColor : "#000000"}
          emissiveIntensity={highlight ? 0.15 : 0}
        />
      </mesh>

      {/* Морийн тал тэмдэг */}
      <group position={[0, 0.3, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.65, 8]} />
          <meshStandardMaterial
            color="#b89060"
            roughness={0.45}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* Тэмээний тал тэмдэг */}
      <group position={[0, -0.3, 0]} rotation={[0, 0, Math.PI]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.11, 0.02, 8, 16, Math.PI]} />
          <meshStandardMaterial
            color="#907050"
            roughness={0.55}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* Үзүүрүүд */}
      {([-0.77, 0.77] as const).map((z, i) => (
        <mesh key={i} position={[0, 0.02, z]} castShadow>
          <sphereGeometry args={[0.09, 12, 9]} />
          <meshStandardMaterial color="#ccc0a0" roughness={0.52} />
        </mesh>
      ))}

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
