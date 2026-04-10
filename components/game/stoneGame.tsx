"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import StoneHand from "./stoneHand"
import StoneGameUI from "./stoneGameUI"
import {
  GameState, INITIAL_STATE,
  computerPickStones, buildMessage, WIN_SCORE,
} from "./stoneType"

export type StoneGameProps = {
  onComplete?: (result: "win" | "lose") => void;
};

function GameTable() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0a0806" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.48, 0]}>
        <boxGeometry args={[7, 4, 0.08]} />
        <meshStandardMaterial color="#2a1a0e" roughness={0.90} metalness={0.02} />
      </mesh>

      {[
        { pos: [ 3.55, -0.44, 0] as [number,number,number], args: [0.1, 0.08, 4.05] as [number,number,number] },
        { pos: [-3.55, -0.44, 0] as [number,number,number], args: [0.1, 0.08, 4.05] as [number,number,number] },
        { pos: [0, -0.44,  2.05] as [number,number,number], args: [7.1, 0.08, 0.10] as [number,number,number] },
        { pos: [0, -0.44, -2.05] as [number,number,number], args: [7.1, 0.08, 0.10] as [number,number,number] },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} castShadow>
          <boxGeometry args={b.args} />
          <meshStandardMaterial color="#c8a030" metalness={0.7} roughness={0.2} />
        </mesh>
      ))}

      {/* Дунд шугам */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <planeGeometry args={[0.04, 4]} />
        <meshStandardMaterial color="#c8a030" metalness={0.5} opacity={0.4} transparent />
      </mesh>
    </>
  )
}

// ── Нисэж буй чулуунуудын частицын эффект ─────
function StoneBurst({ active, position }: { active: boolean; position: [number,number,number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef  = useRef(0)

  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      ),
      pos: new THREE.Vector3(),
      scale: 0.06 + Math.random() * 0.08,
    }))
  )

  useFrame((_, delta) => {
    if (!groupRef.current || !active) return
    timeRef.current += delta
    if (timeRef.current > 1.5) return

    groupRef.current.children.forEach((child, i) => {
      const p = particles.current[i]
      p.pos.addScaledVector(p.vel, delta)
      p.vel.y -= 8 * delta  // gravity
      child.position.copy(p.pos)
      const s = Math.max(0, 1 - timeRef.current / 1.2) * p.scale
        ; (child as THREE.Mesh).scale.setScalar(s)
    })
  })

  // reset
  useEffect(() => {
    if (active) {
      timeRef.current = 0
      particles.current.forEach((p) => { p.pos.set(0, 0, 0) })
    }
  }, [active])

  if (!active) return null

  return (
    <group ref={groupRef} position={position}>
      {particles.current.map((p, i) => (
        <mesh key={i} castShadow>
          <dodecahedronGeometry args={[p.scale, 0]} />
          <meshStandardMaterial color={["#6a7a6a", "#5a6a5a", "#7a8a7a"][i % 3]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ── 3D Scene агуулга ───────────────────────────
function GameScene({
  state,
  burstActive,
}: {
  state: GameState
  burstActive: boolean
}) {
  const isReveal = state.phase === "reveal" || state.phase === "guess" || state.phase === "result"
  const showPlayerStones   = isReveal && state.playerStones   !== null
  const showComputerStones = isReveal && state.computerStones !== null

  return (
    <>
      <GameTable />

      {/* Тоглогчийн нударга — зүүн тал */}
      <StoneHand
        stoneCount={showPlayerStones ? (state.playerStones ?? 0) : 0}
        isOpen={showPlayerStones}
        isPlayer={true}
        position={[-2.0, 0.1, 0.5]}
        revealAnim={isReveal}
      />

      {/* Компьютерийн нударга — баруун тал */}
      <StoneHand
        stoneCount={showComputerStones ? (state.computerStones ?? 0) : 0}
        isOpen={showComputerStones}
        isPlayer={false}
        position={[2.0, 0.1, 0.5]}
        revealAnim={isReveal}
      />

      {/* Чулуу нисэх эффект */}
      <StoneBurst active={burstActive} position={[0, 0.5, 0]} />
    </>
  )
}

// ── Үндсэн тоглоомын компонент ────────────────
export default function StoneGame({ onComplete }: StoneGameProps) {
  const [state,       setState]       = useState<GameState>(INITIAL_STATE)
  const [burstActive, setBurstActive] = useState(false)
  const sentRef = useRef(false)

  // ── Тоглогч чулуу сонгоно ──
  const handlePick = useCallback((n: number) => {
    if (state.phase !== "pick") return

    // Компьютер нэн даруй чулуу сонгоно (нуусан байна)
    const compStones = computerPickStones(state.history)

    setState((prev) => ({
      ...prev,
      playerStones:   n,
      computerStones: compStones,
      phase:          "reveal",
    }))

    // 1.2 секундын дараа нударга нээнэ
    setTimeout(() => {
      setState((prev) => ({ ...prev, phase: "guess" }))
      setBurstActive(true)
      setTimeout(() => setBurstActive(false), 1500)
    }, 1200)
  }, [state.phase, state.history])

  // ── Тоглогч нийлбэр таана ──
  const handleGuess = useCallback((guess: number) => {
    if (state.phase !== "guess") return
    if (state.playerStones === null || state.computerStones === null) return

    const total     = state.playerStones + state.computerStones
    const playerWon = guess === total

    const roundResult = {
      playerStones:   state.playerStones,
      computerStones: state.computerStones,
      total,
      playerGuess:    guess,
      playerWon,
    }

    const newScore = {
      player:   state.score.player   + (playerWon ? 1 : 0),
      computer: state.score.computer + (playerWon ? 0 : 1),
    }

    setState((prev) => ({
      ...prev,
      playerGuess: guess,
      phase:       "result",
      score:       newScore,
      history:     [...prev.history, roundResult],
      message:     buildMessage(roundResult),
    }))
  }, [state])

  // ── Дараагийн раунд ──
  const handleNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase:          "pick",
      playerStones:   null,
      computerStones: null,
      playerGuess:    null,
      round:          prev.round + 1,
      message:        "",
    }))
  }, [])

  // ── Дахин эхлэх ──
  const handleRestart = useCallback(() => {
    setState(INITIAL_STATE)
    sentRef.current = false
  }, [])

  useEffect(() => {
    if (sentRef.current) return
    const playerWins = state.score.player >= WIN_SCORE
    const computerWins = state.score.computer >= WIN_SCORE
    if (!playerWins && !computerWins) return
    sentRef.current = true
    onComplete?.(playerWins ? "win" : "lose")
  }, [onComplete, state.score.computer, state.score.player])

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#080604", overflow: "hidden" }}>
      <Canvas
        camera={{ position: [0, 4, 7], fov: 52 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 10, 5]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-3, 4, -3]} intensity={0.4} color="#ffd080" />
        <pointLight position={[ 3, 3,  3]} intensity={0.25} color="#c0d0ff" />
        {/* Тоглоомын талбайн доор нэмэлт гэрэл */}
        <pointLight position={[0, -0.2, 0]} intensity={0.3} color="#c8a030" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <GameScene state={state} burstActive={burstActive} />
        </Suspense>

        <OrbitControls
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          minDistance={4}
          maxDistance={12}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      <StoneGameUI
        state={state}
        onPick={handlePick}
        onGuess={handleGuess}
        onNext={handleNext}
        onRestart={handleRestart}
      />
    </div>
  )
}