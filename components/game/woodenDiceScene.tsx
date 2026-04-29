"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, RoundedBox } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { pipCenters3D } from "./woodenDicePipLayout";

const VALUE_UP_NORMAL: [number, number, number][] = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 0, -1],
  [0, -1, 0],
];
const FACE_PIPS: { out: "+y" | "-y" | "+x" | "-x" | "+z" | "-z"; n: 1 | 2 | 3 | 4 | 5 | 6 }[] = [
  { out: "+y", n: 1 },
  { out: "-y", n: 6 },
  { out: "+x", n: 3 },
  { out: "-x", n: 4 },
  { out: "+z", n: 2 },
  { out: "-z", n: 5 },
];

function quatToShowValueOnUp(v: number) {
  const c = Math.max(1, Math.min(6, Math.round(v))) as 1 | 2 | 3 | 4 | 5 | 6;
  const [nx, ny, nz] = VALUE_UP_NORMAL[(c as number) - 1]!;
  const a = new THREE.Vector3(nx, ny, nz);
  const q = new THREE.Quaternion();
  q.setFromUnitVectors(a, new THREE.Vector3(0, 1, 0));
  return q;
}

function PippedDie3D({
  value,
  spinning,
  offset,
}: {
  value: number;
  spinning: boolean;
  offset: number;
}) {
  const g = useRef<THREE.Group | null>(null);
  const target = useRef(new THREE.Quaternion());
  const tWorld = new THREE.Quaternion();
  const spinEul = useRef(new THREE.Euler(0, 0, 0, "XYZ"));
  const wasSpin = useRef(false);

  useFrame((_, dt) => {
    const o = g.current;
    if (!o) return;
    if (spinning) {
      if (!wasSpin.current) {
        spinEul.current.setFromQuaternion(o.quaternion, "YXZ");
        wasSpin.current = true;
      }
      spinEul.current.set(
        spinEul.current.x + dt * (6.5 + offset * 0.1),
        spinEul.current.y + dt * (4.2 + offset * 0.05),
        spinEul.current.z + dt * 3.0,
      );
      tWorld.setFromEuler(spinEul.current);
      o.quaternion.copy(tWorld);
      return;
    }
    wasSpin.current = false;
    target.current.copy(quatToShowValueOnUp(value));
    o.quaternion.slerp(
      target.current,
      1 - 0.05 ** (22 * Math.min(dt, 0.1)),
    );
  });

  const pipM = { color: "#0e0604", roughness: 0.5, metalness: 0.1 };

  return (
    <group ref={g}>
      <RoundedBox
        args={[0.48, 0.48, 0.48]}
        radius={0.06}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#4a2f18"
          roughness={0.75}
          metalness={0.1}
        />
      </RoundedBox>
      {FACE_PIPS.map(({ out, n }) => (
        <group key={out + n}>
          {pipCenters3D(out, n).map((p, k) => (
            <mesh key={k} position={p} castShadow>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial {...pipM} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function FeltField() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#0d1410" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
        <planeGeometry args={[3.8, 1.65]} />
        <meshStandardMaterial
          color="#1e2a1a"
          roughness={0.95}
          emissive="#0a1008"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
}

type T = [number, number, number];
const IDLE: T = [1, 1, 1];

function cupTriples(
  left: T,
  right: T,
  spin: boolean,
) {
  /** Per side: 3 шоо нэг мөрөнд (Z тэнхлэг), төвөөс зай — шоо хэмжээ ~0.48, хоорондын зай ~0.08 */
  const zGap = 0.52;
  const ppos: T[] = [
    [-0.7, 0, -zGap] as T,
    [-0.7, 0, 0] as T,
    [-0.7, 0, zGap] as T,
  ];
  const qpos: T[] = [
    [0.7, 0, -zGap] as T,
    [0.7, 0, 0] as T,
    [0.7, 0, zGap] as T,
  ];
  return (
    <group>
      {ppos.map((pos, i) => (
        <group key={`l${i}`} position={pos}>
          <PippedDie3D value={left[i]!} spinning={spin} offset={i * 0.2} />
        </group>
      ))}
      {qpos.map((pos, i) => (
        <group key={`r${i}`} position={pos}>
          <PippedDie3D
            value={right[i]!}
            spinning={spin}
            offset={i * 0.2 + 1.6}
          />
        </group>
      ))}
    </group>
  );
}

export function WoodenDiceSceneCanvas({
  spin,
  leftTriple = IDLE,
  rightTriple = IDLE,
}: {
  spin: boolean;
  leftTriple?: T;
  rightTriple?: T;
}) {
  const l = leftTriple ?? IDLE;
  const r = rightTriple ?? IDLE;
  return (
    <Canvas
      camera={{ position: [0, 2.35, 3.65], fov: 48, near: 0.12, far: 80 }}
      shadows
      className="h-full w-full"
    >
      <color attach="background" args={["#060805"]} />
      <ambientLight intensity={0.52} />
      <hemisphereLight color="#2a1f10" groundColor="#050608" intensity={0.35} />
      <directionalLight
        position={[2.6, 6, 2.4]}
        intensity={1.05}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-2, 3.5, 2.5]} intensity={0.4} color="#b8a078" />
      <pointLight position={[-1.2, 1.5, 1.2]} intensity={0.38} color="#c8a030" />
      <pointLight position={[1.6, 1.2, 1.4]} intensity={0.42} color="#d4c4a0" />
      {/** Ширээ + шоо бага зэрэг дээш/урд — кадрын төв */}
      <group position={[0, 0.06, 0.1]}>
        <FeltField />
        <Suspense fallback={null}>
          <Environment preset="night" />
          {cupTriples(l, r, spin)}
        </Suspense>
      </group>
    </Canvas>
  );
}
