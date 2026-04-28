"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Html } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { pickLastShagai } from "./shagaiModel";
import { SHAGAI_PHYS_BOX, SHAGAI_SIDE_UP_AXIS } from "./shagai";
import { useApp } from "@/components/AppContext";
import ShagaiGuessUI from "./shagaiGuessUI";
import {
  GuessState,
  INITIAL_GUESS_STATE,
  Player,
  TOTAL_SHAGAI,
  applyRound,
  resolveRound,
  robotPickGuess,
  robotPickHidden,
} from "./shagaiGuessType";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";

export type ShagaiGuessGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

// --------------------------------------------------------------------------
// Shared shagai template – cloned per instance so we can tint / scale freely
// without re-parsing the GLB.
// --------------------------------------------------------------------------
const TILE_BOX = SHAGAI_PHYS_BOX;

function useShagaiTemplate(): THREE.Object3D | null {
  const gltf = useGLTF("/models/shagai_model.glb");
  return useMemo(() => {
    const scene = (gltf as any)?.scene as THREE.Object3D | undefined;
    if (!scene) return null;
    const wrap = pickLastShagai(scene.clone(true), TILE_BOX);
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

function buildHorseUpQuaternion(): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    SHAGAI_SIDE_UP_AXIS.horse.clone(),
    new THREE.Vector3(0, 1, 0),
  );
}

// --------------------------------------------------------------------------
// One static shagai piece. Used to form piles, hand contents, and the
// centre reveal cluster.
// --------------------------------------------------------------------------
const PIECE_SCALE = 0.7;

function Piece({
  position,
  rotationY = 0,
  template,
  tint,
  scale = PIECE_SCALE,
  emissiveIntensity = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
  template: THREE.Object3D | null;
  tint: string;
  scale?: number;
  emissiveIntensity?: number;
}) {
  const instance = useMemo(() => {
    if (!template) return null;
    const clone = template.clone(true);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | THREE.MeshStandardMaterial[];
      if (Array.isArray(mat)) {
        m.material = mat.map((mm) => mm.clone());
      } else if (mat) {
        m.material = mat.clone();
      }
    });
    return clone;
  }, [template]);

  const quat = useMemo(() => buildHorseUpQuaternion(), []);

  useEffect(() => {
    if (!instance) return;
    const col = new THREE.Color(tint);
    instance.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as
        THREE.MeshStandardMaterial[];
      for (const mm of mats) {
        if (!mm) continue;
        mm.emissive = emissiveIntensity > 0 ? col : new THREE.Color(0x000000);
        mm.emissiveIntensity = emissiveIntensity;
        mm.needsUpdate = true;
      }
    });
  }, [instance, tint, emissiveIntensity]);

  if (!instance) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <group quaternion={quat}>
        <primitive object={instance} />
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// A row/grid of shagai laid on the mat. Used for each side's public pile.
// The pile is arranged in up to 2 rows of 8 so it fits cleanly on the mat.
// --------------------------------------------------------------------------
const PILE_SPACING_X = 0.48;
const PILE_SPACING_Z = 0.6;
const PILE_ROWS = 2;
const PILE_COLS = 8;

function Pile({
  origin,
  count,
  template,
  tint,
  facing,
}: {
  origin: [number, number, number];
  count: number;
  template: THREE.Object3D | null;
  tint: string;
  facing: "player" | "robot";
}) {
  // Arrange up to PILE_ROWS * PILE_COLS = 16 shagai. Origin sits at the
  // middle of the grid. Rows are along z, cols along x.
  const positions = useMemo(() => {
    const out: { x: number; y: number; z: number; r: number }[] = [];
    const xStart = -((PILE_COLS - 1) / 2) * PILE_SPACING_X;
    const zSign = facing === "player" ? 1 : -1;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / PILE_COLS);
      const col = i % PILE_COLS;
      const x = xStart + col * PILE_SPACING_X;
      const z = zSign * row * PILE_SPACING_Z;
      // Pseudo-random per-piece rotation (deterministic for visual
      // stability across re-renders).
      const r = ((col * 19 + row * 7) % 31) * 0.09 - 1.4;
      out.push({ x, y: (TILE_BOX[1] * PIECE_SCALE) / 2 + 0.005, z, r });
    }
    return out;
  }, [count, facing]);

  return (
    <group position={origin}>
      {positions.map((p, i) => (
        <Piece
          key={i}
          position={[p.x, p.y, p.z]}
          rotationY={p.r}
          template={template}
          tint={tint}
        />
      ))}
    </group>
  );
}

// --------------------------------------------------------------------------
// "Hand" zone – an illuminated disc with the hidden shagai on top. When
// `reveal` is false we show a closed-fist emoji via Html; when true the
// shagai are drawn directly on the mat so the viewer can count them.
// --------------------------------------------------------------------------
function Hand({
  origin,
  count,
  template,
  tint,
  reveal,
  label,
  accent,
}: {
  origin: [number, number, number];
  count: number;
  template: THREE.Object3D | null;
  tint: string;
  reveal: boolean;
  label: string;
  accent: string;
}) {
  const positions = useMemo(() => {
    // Arrange up to 16 shagai in a tidy 4×4 grid inside the circle.
    const out: { x: number; y: number; z: number; r: number }[] = [];
    const cols = 4;
    const spacing = 0.42;
    const xStart = -((cols - 1) / 2) * spacing;
    const zStart = -((cols - 1) / 2) * spacing;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = xStart + col * spacing;
      const z = zStart + row * spacing;
      const r = ((col * 11 + row * 17) % 29) * 0.11 - 1.6;
      out.push({ x, y: (TILE_BOX[1] * PIECE_SCALE) / 2 + 0.005, z, r });
    }
    return out;
  }, [count]);

  return (
    <group position={origin}>
      {/* Illuminated base disc. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[1.4, 48]} />
        <meshStandardMaterial
          color={reveal ? accent : "#1a1208"}
          emissive={accent}
          emissiveIntensity={reveal ? 0.35 : 0.12}
          roughness={0.8}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.35, 1.42, 48]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.6}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Label hovering above the disc. */}
      <Html
        position={[0, 1.1, 0]}
        center
        zIndexRange={[2, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            padding: "3px 10px",
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${accent}55`,
            borderRadius: 6,
            color: accent,
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            fontFamily:
              "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {label}
          {reveal && count >= 0 ? `  ·  ${count}` : ""}
        </div>
      </Html>

      {/* Closed-fist placeholder when not revealed. */}
      {!reveal && (
        <Html position={[0, 0.35, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontSize: 42,
              filter: `drop-shadow(0 0 8px ${accent})`,
            }}
          >
            ✊
          </div>
        </Html>
      )}

      {reveal &&
        positions.map((p, i) => (
          <Piece
            key={i}
            position={[p.x, p.y, p.z]}
            rotationY={p.r}
            template={template}
            tint={tint}
            emissiveIntensity={0.18}
          />
        ))}
    </group>
  );
}

// --------------------------------------------------------------------------
// Table + mat.
// --------------------------------------------------------------------------
function GuessMat() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>

      {/* Centre round arena where the two hands meet. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
        scale={[1, 0.85, 1]}
      >
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.93} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
        scale={[1, 0.85, 1]}
      >
        <ringGeometry args={[6.08, 6.3, 64]} />
        <meshStandardMaterial color="#c8a030" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Subtle dividing line between the two halves. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
        <planeGeometry args={[11.4, 0.04]} />
        <meshStandardMaterial color="#a07820" metalness={0.5} roughness={0.4} />
      </mesh>
    </>
  );
}

// --------------------------------------------------------------------------
// Victory lights.
// --------------------------------------------------------------------------
function WinLights({ active, side }: { active: boolean; side: Player | null }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (!active || !side) return;
    const t = s.clock.elapsedTime;
    if (light1.current) {
      light1.current.intensity = (Math.sin(t * 4) * 0.5 + 0.5) * 2.5;
      light1.current.position.x = Math.sin(t * 2) * 3;
    }
    if (light2.current) {
      light2.current.intensity = (Math.cos(t * 4) * 0.5 + 0.5) * 1.8;
      light2.current.position.x = Math.cos(t * 2) * 3;
    }
  });
  if (!active || !side) return null;
  const color = side === "player" ? "#60ff90" : "#ff6060";
  return (
    <>
      <pointLight
        ref={light1}
        color={color}
        intensity={2}
        distance={8}
        position={[0, 3, 0]}
      />
      <pointLight
        ref={light2}
        color="#f0c040"
        intensity={1.5}
        distance={8}
        position={[0, 2, 0]}
      />
    </>
  );
}

// --------------------------------------------------------------------------
// Scene root (reused in online 1v1).
// --------------------------------------------------------------------------
export function ShagaiGuessGameScene({
  state,
  hiddenReveal,
  robotThinking,
  leftName,
  rightName,
}: {
  state: GuessState;
  hiddenReveal: { player: number; robot: number } | null;
  robotThinking: boolean;
  /** Hand labels (solo: ТА/РОБОТ vs YOU/ROBOT by app language; online: names). */
  leftName?: string;
  rightName?: string;
}) {
  const { language } = useApp();
  const leftLabel = leftName ?? (language === "en" ? "YOU" : "ТА");
  const rightLabel = rightName ?? (language === "en" ? "ROBOT" : "РОБОТ");
  const thinkingText =
    language === "en" ? "🤖 thinking…" : "🤖 бодож байна…";
  const template = useShagaiTemplate();
  const reveal =
    state.phase === "revealing" ||
    state.phase === "result" ||
    state.phase === "matchOver";

  // Remaining pile = overall stack minus the number currently held in fist
  // while hiding/revealing.
  const heldPlayer = hiddenReveal?.player ?? 0;
  const heldRobot = hiddenReveal?.robot ?? 0;
  const playerPile = Math.max(0, state.playerStack - heldPlayer);
  const robotPile = Math.max(0, state.robotStack - heldRobot);

  return (
    <>
      <GuessMat />
      <WinLights active={state.phase === "matchOver"} side={state.winner} />

      {/* Player pile near the camera. */}
      <Pile
        origin={[0, 0, 3.4]}
        count={playerPile}
        template={template}
        tint="#b0e8b0"
        facing="player"
      />

      {/* Robot pile on the far side. */}
      <Pile
        origin={[0, 0, -3.4]}
        count={robotPile}
        template={template}
        tint="#f0b8a8"
        facing="robot"
      />

      {/* Two hand zones side by side in the centre, player on the left. */}
      <Hand
        origin={[-1.8, 0, 0]}
        count={heldPlayer}
        template={template}
        tint="#b0e8b0"
        reveal={reveal}
        label={leftLabel}
        accent="#60c060"
      />
      <Hand
        origin={[1.8, 0, 0]}
        count={heldRobot}
        template={template}
        tint="#f0b8a8"
        reveal={reveal}
        label={rightLabel}
        accent="#e06050"
      />

      {/* Running-total display while revealing. */}
      {reveal && hiddenReveal && (
        <Html position={[0, 2.4, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(200,160,48,0.55)",
              borderRadius: 999,
              color: "#f0c040",
              fontSize: 16,
              letterSpacing: 2,
              fontFamily:
                "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              fontWeight: 700,
              whiteSpace: "nowrap",
              textShadow: "0 0 8px rgba(240,192,64,0.6)",
            }}
          >
            {hiddenReveal.player} + {hiddenReveal.robot} ={" "}
            <span style={{ color: "#fff" }}>
              {hiddenReveal.player + hiddenReveal.robot}
            </span>
          </div>
        </Html>
      )}

      {/* Robot thinking shimmer. */}
      {robotThinking && (
        <Html position={[1.8, 1.8, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              padding: "3px 10px",
              background: "rgba(0,0,0,0.6)",
              border: "1px dashed rgba(224,96,80,0.5)",
              borderRadius: 999,
              color: "#ffb0a0",
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontFamily:
                "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
              whiteSpace: "nowrap",
              animation: "pulse 1.2s ease-in-out infinite",
            }}
          >
            {thinkingText}
          </div>
        </Html>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// Root component.
// --------------------------------------------------------------------------
export default function ShagaiGuessGame({ onComplete }: ShagaiGuessGameProps) {
  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<GuessState>(INITIAL_GUESS_STATE);
  const [robotThinking, setRobotThinking] = useState(false);
  const [revealHidden, setRevealHidden] = useState<{
    player: number;
    robot: number;
  } | null>(null);
  const matchSentRef = useRef(false);

  // Match-over side-effect.
  useEffect(() => {
    if (state.phase !== "matchOver") return;
    if (matchSentRef.current) return;
    matchSentRef.current = true;
    const won = state.winner === "player";
    const progressPct = Math.max(
      0,
      Math.min(100, Math.round((state.playerStack / TOTAL_SHAGAI) * 100)),
    );
    onComplete?.(won ? "win" : "lose", progressPct);
  }, [state.phase, state.winner, state.playerStack, onComplete]);

  // -- Round flow --------------------------------------------------------
  useEffect(() => {
    if (state.phase !== "idle" || state.round !== 0) return;
    setState((prev) => ({ ...prev, phase: "hiding", round: 1 }));
  }, [state.phase, state.round]);

  useEffect(() => {
    if (state.phase !== "result" || state.winner) return;
    const t = setTimeout(() => {
      setState((prev) => ({ ...prev, phase: "hiding", round: prev.round + 1 }));
      setRevealHidden(null);
    }, 1000);
    return () => clearTimeout(t);
  }, [state.phase, state.winner]);

  const onCommit = useCallback(
    (playerHidden: number, playerGuess: number) => {
      // Robot locks its choices silently.
      const robotHidden = robotPickHidden(state.robotStack);
      const robotGuess = robotPickGuess(robotHidden, state.playerStack);

      setRobotThinking(true);
      setState((prev) => ({ ...prev, phase: "robotThinking" }));

      // After a short beat, reveal hands and resolve the round.
      const t1 = setTimeout(() => {
        setRobotThinking(false);
        setRevealHidden({ player: playerHidden, robot: robotHidden });
        setState((prev) => ({ ...prev, phase: "revealing" }));

        const t2 = setTimeout(() => {
          const record = resolveRound({
            playerHeld: playerHidden,
            playerGuess,
            robotHeld: robotHidden,
            robotGuess,
            playerStack: state.playerStack,
            robotStack: state.robotStack,
            round: state.round,
          });
          // Small coin reward when the player takes shagai from the robot.
          if (record.transferredTo === "player" && record.transferredAmount > 0) {
            if (record.transferredAmount > 0)
              grant({ coins: STONE_ROUND_COINS });
          }
          setState((prev) => applyRound(prev, record));
        }, 900);
        return () => clearTimeout(t2);
      }, 900);
      return () => clearTimeout(t1);
    },
    [state.playerStack, state.robotStack, state.round, grant],
  );

  const onReset = useCallback(() => {
    setState(INITIAL_GUESS_STATE);
    setRevealHidden(null);
    setRobotThinking(false);
    matchSentRef.current = false;
    resetGrants();
  }, [resetGrants]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 50%, #3a2a1a 0%, #241810 45%, #160e08 100%)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 7.5, 9], fov: 48 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 14, 6]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-4, 5, -4]} intensity={0.3} color="#ffd080" />
        <pointLight position={[4, 4, 4]} intensity={0.2} color="#c0d4ff" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <ShagaiGuessGameScene
            state={state}
            hiddenReveal={revealHidden}
            robotThinking={robotThinking}
          />
        </Suspense>

        <OrbitControls
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={16}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      <ShagaiGuessUI
        state={state}
        onCommit={onCommit}
        robotThinking={robotThinking}
        revealHidden={revealHidden}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
      />
    </div>
  );
}

useGLTF.preload("/models/shagai_model.glb");
