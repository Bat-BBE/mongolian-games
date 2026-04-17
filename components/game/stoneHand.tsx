// ═══════════════════════════════════════════════
//  StoneHand.tsx  –  3D нударга + чулуунууд
// ═══════════════════════════════════════════════
"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface StoneHandProps {
  stoneCount:  number        // Харагдах чулуу
  isOpen:      boolean       // Нударга нээгдсэн үү
  isPlayer:    boolean       // Тоглогч эсвэл компьютер
  position:    [number, number, number]
  revealAnim:  boolean       // Нударга нээх анимац
  phase?: "pick" | "guess" | "result" // тоглоомын үе (илүү амьд хөдөлгөөнд)
}

// ── Чулуу нэг бүрийн геометр ─────────────────
function Stone({
  position,
  scale,
  color,
  delay,
  visible,
}: {
  position: [number, number, number]
  scale:    number
  color:    string
  delay:    number
  visible:  boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(delay)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    timeRef.current += delta
    // Бага зэрэг хөвөх анимац
    meshRef.current.position.y =
      position[1] + Math.sin(timeRef.current * 1.5 + delay) * 0.03
    meshRef.current.rotation.y += delta * 0.4
    meshRef.current.rotation.x += delta * 0.2
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} position={position} scale={scale} castShadow>
      {/* Чулуун хэлбэр — бага зэрэг жигд бус polyhedron */}
      <dodecahedronGeometry args={[0.18, 0]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.78}
        metalness={0.08}
        clearcoat={0.45}
        clearcoatRoughness={0.5}
        envMapIntensity={0.4}
      />
    </mesh>
  )
}

// ── Нударгын хуруунууд ────────────────────────
function Finger({
  position,
  rotation,
  isOpen,
  index,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  isOpen:   boolean
  index:    number
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    // Нээхэд хуруу сунана
    const target = isOpen ? -0.9 : 0.6
    groupRef.current.rotation.x +=
      (target - groupRef.current.rotation.x) * 0.12
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Хурууны доод хэсэг */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.22, 6, 8]} />
        <meshStandardMaterial color="#c8956a" roughness={0.7} />
      </mesh>
      {/* Хурууны дээд хэсэг */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <capsuleGeometry args={[0.062, 0.18, 6, 8]} />
        <meshStandardMaterial color="#c07850" roughness={0.7} />
      </mesh>
    </group>
  )
}

// ── Бугуйны 3D загвар ─────────────────────────
export default function StoneHand({
  stoneCount,
  isOpen,
  isPlayer,
  position,
  revealAnim,
  phase = "pick",
}: StoneHandProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const rotTarget = useRef(isPlayer ? 0 : Math.PI)
  const openRef = useRef(isOpen ? 1 : 0) // 0=fist, 1=open
  const squeezeRef = useRef(0) // subtle squeeze animation

  // Чулуунуудын байршил — нударгын дотор/дээр
  const stonePositions = useMemo<[number, number, number][]>(() => [
    [ 0.00,  0.35,  0.00],
    [ 0.18,  0.28,  0.10],
    [-0.18,  0.28,  0.10],
    [ 0.10,  0.40, -0.10],
    [-0.10,  0.40, -0.10],
  ], [])

  const stoneColors = ["#6a7a6a", "#5a6a5a", "#7a8a7a", "#4a5a4a", "#8a9a8a"]

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    // Бага зэрэг хөдлөх анимац
    groupRef.current.rotation.z =
      Math.sin(t * 0.8 + (isPlayer ? 0 : Math.PI)) * 0.04

    // Open/close factor (smooth)
    const targetOpen = isOpen ? 1 : 0
    openRef.current += (targetOpen - openRef.current) * 0.14

    // Reveal: илүү кино мэт зөөлөн эргэж онгойно
    const baseRot = isPlayer ? 0 : Math.PI
    const revealRot = isPlayer ? -0.85 : Math.PI + 0.85
    rotTarget.current += ((revealAnim ? revealRot : baseRot) - rotTarget.current) * 0.09
    groupRef.current.rotation.y +=
      (rotTarget.current - groupRef.current.rotation.y) * 0.08

    // Subtle squeeze / breathing
    const squeezeTarget =
      phase === "pick"
        ? 0.35
        : phase === "guess"
          ? 0.18
          : 0.05
    squeezeRef.current += (squeezeTarget - squeezeRef.current) * 0.08
    const sq = squeezeRef.current
    groupRef.current.scale.setScalar(1 - sq * 0.035 + Math.sin(t * 1.3) * 0.003)
    groupRef.current.position.y =
      position[1] +
      Math.sin(t * 1.05 + (isPlayer ? 0 : 1.4)) * 0.015 -
      openRef.current * 0.03
  })

  const skinColor  = isPlayer ? "#c8956a" : "#8a7060"
  const knuckleClr = isPlayer ? "#b88060" : "#7a6050"

  return (
    <group ref={groupRef} position={position}>
      {/* ── Алган хэсэг ── */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.55, 0.28]} />
        <meshPhysicalMaterial
          color={skinColor}
          roughness={0.62}
          metalness={0.02}
          clearcoat={0.12}
          clearcoatRoughness={0.65}
          envMapIntensity={0.25}
        />
      </mesh>

      {/* Алганы нуман хэлбэрийн хамар */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.52, 0.10, 0.26]} />
        <meshPhysicalMaterial
          color={knuckleClr}
          roughness={0.58}
          metalness={0.03}
          clearcoat={0.08}
          clearcoatRoughness={0.7}
          envMapIntensity={0.22}
        />
      </mesh>

      {/* ── Хуруунууд (4 ширхэг) ── */}
      {[-0.20, -0.07, 0.07, 0.20].map((xOff, i) => (
        <Finger
          key={i}
          index={i}
          isOpen={isOpen}
          position={[xOff, 0.28, 0]}
          rotation={[0.6, 0, 0]}
        />
      ))}

      {/* ── Эрхий хуруу ── */}
      <group position={[0.30, 0.05, 0.05]} rotation={[0.3, 0, -0.8]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.068, 0.20, 6, 8]} />
          <meshPhysicalMaterial
            color={skinColor}
            roughness={0.62}
            metalness={0.02}
            clearcoat={0.1}
            clearcoatRoughness={0.65}
            envMapIntensity={0.22}
          />
        </mesh>
      </group>

      {/* ── Бугуй ── */}
      <mesh position={[0, -0.38, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.24, 0.30, 16]} />
        <meshPhysicalMaterial
          color={skinColor}
          roughness={0.65}
          metalness={0.02}
          clearcoat={0.08}
          clearcoatRoughness={0.75}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* ── Чулуунууд: нудрага нээлттэй үед харагдана ── */}
      {stonePositions.slice(0, stoneCount).map((pos, i) => (
        <Stone
          key={i}
          position={pos}
          scale={0.9 + Math.random() * 0.2}
          color={stoneColors[i % stoneColors.length]}
          delay={i * 0.7}
          visible={isOpen}
        />
      ))}

      {/* ── Нударга хаалттай үед чулууны тоог ?-ээр харуулна (компьютер) ── */}
      {!isOpen && !isPlayer && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#333" transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}