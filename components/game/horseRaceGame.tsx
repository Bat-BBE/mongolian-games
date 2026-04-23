"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import { Suspense, useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import HorseRaceUI from "./horseRaceUI";
import { pickLastShagai } from "./shagaiModel";
import { SHAGAI_PHYS_BOX, SHAGAI_SIDE_UP_AXIS } from "./shagai";
import {
  RaceState,
  INITIAL_RACE_STATE,
  TRACK_LENGTH,
  countHorses,
} from "./horseRaceType";
import type { ShagaiSide } from "./shagai";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import {
  getShagaiThrowParams,
  SHAGAI_HORSE_RACE_THROW_START_POSITIONS,
} from "./shagaiThrowShared";

export type HorseRaceGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
};

// --------------------------------------------------------------------------
// Physics floor + decorative mat (mirrors the other shagai games).
// --------------------------------------------------------------------------
function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as any} />;
}

function RaceMat() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>

      {/* Elongated green turf "racing lane" sized to cover the 3 rows
          (player racer, track tiles, robot racer). */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.005, -3.1]}
      >
        <planeGeometry args={[13, 6.2]} />
        <meshStandardMaterial color="#243b22" roughness={0.95} />
      </mesh>

      {/* Lane borders — top and bottom edge of the turf. */}
      {[-6.2, 0].map((dz, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.008, dz / 2 + -3.1]}
        >
          <planeGeometry args={[13, 0.06]} />
          <meshStandardMaterial color="#c8a030" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Dashed center line along the track row. */}
      {Array.from({ length: 24 }).map((_, i) => {
        const x = -6 + i * 0.5;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.007, -3.1]}
          >
            <planeGeometry args={[0.22, 0.04]} />
            <meshStandardMaterial color="#a07820" roughness={0.6} />
          </mesh>
        );
      })}

      {/* Throw zone — small oval in front of the camera */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.006, 2.2]}
        scale={[1, 0.7, 1]}
      >
        <circleGeometry args={[2.8, 48]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.009, 2.2]}
        scale={[1, 0.7, 1]}
      >
        <ringGeometry args={[2.75, 2.88, 48]} />
        <meshStandardMaterial color="#c8a030" metalness={0.72} roughness={0.22} />
      </mesh>

      {/* Physics walls around the throw zone so shagai don't fly off */}
      {[
        {
          pos: [3.2, 1, 2.2] as [number, number, number],
          args: [0.2, 2, 6] as [number, number, number],
        },
        {
          pos: [-3.2, 1, 2.2] as [number, number, number],
          args: [0.2, 2, 6] as [number, number, number],
        },
        {
          pos: [0, 1, 4.6] as [number, number, number],
          args: [7, 2, 0.2] as [number, number, number],
        },
        {
          pos: [0, 1, -4.8] as [number, number, number],
          args: [14, 2, 0.2] as [number, number, number],
        },
        {
          pos: [6.8, 1, 0] as [number, number, number],
          args: [0.2, 2, 10] as [number, number, number],
        },
        {
          pos: [-6.8, 1, 0] as [number, number, number],
          args: [0.2, 2, 10] as [number, number, number],
        },
      ].map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={w.args} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// --------------------------------------------------------------------------
// Track shagai – static, no physics. Oriented with the "horse" face up.
// Length axis sticks out perpendicular to the track (along world Z) so the
// 20 shagai can be packed edge-to-edge along world X in a single row.
// All 20 share a single pre-built wrap that we clone for each tile.
// --------------------------------------------------------------------------
const TRACK_TILE_BOX = SHAGAI_PHYS_BOX;
// Match the visual size of the 4 thrown shagai (which render at scale 1.0
// through the SingleShagai component).
const TRACK_SCALE = 0.85;
const TRACK_SPACING = 0.55;
const TRACK_START_X = -((20 - 1) * TRACK_SPACING) / 2; // centered around x = 0
const TRACK_Z = -3.1;

function buildTrackTileQuaternion(): THREE.Quaternion {
  // The wrap produced by pickLastShagai has already been aligned by
  // fitToBox so the shagai's short (flat-face) anatomical axis is local
  // Y and its long axis is local Z. We only need one extra rotation to
  // bring the "horse" face (local -Y per SHAGAI_SIDE_UP_AXIS) up to
  // world +Y; no additional yaw, so the shagai's length ends up along
  // world Z and 20 tiles pack neatly in a straight row on X.
  const align = new THREE.Quaternion().setFromUnitVectors(
    SHAGAI_SIDE_UP_AXIS.horse.clone(),
    new THREE.Vector3(0, 1, 0),
  );
  return align;
}

function useTrackTileTemplate(): THREE.Object3D | null {
  const gltf = useGLTF("/models/shagai_model.glb");
  return useMemo(() => {
    const scene = (gltf as any)?.scene as THREE.Object3D | undefined;
    if (!scene) return null;
    // pickLastShagai traverses + clones meshes → safe to call repeatedly on
    // the cached scene. We keep a single processed template and clone it
    // per-tile below.
    const wrap = pickLastShagai(scene.clone(true), TRACK_TILE_BOX);
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

function TrackTile({
  x,
  z,
  highlight,
  color,
  template,
  yOffset,
}: {
  x: number;
  z: number;
  highlight: boolean;
  color: string;
  template: THREE.Object3D | null;
  yOffset: number;
}) {
  const instance = useMemo(() => {
    if (!template) return null;
    const clone = template.clone(true);
    // Make materials unique per tile so we can tint them independently
    // without bleeding color across the whole track.
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

  const quat = useMemo(() => buildTrackTileQuaternion(), []);

  useEffect(() => {
    if (!instance) return;
    const col = new THREE.Color(color);
    instance.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | THREE.MeshStandardMaterial[];
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const mm of mats) {
        if (!mm) continue;
        mm.emissive = highlight ? col : new THREE.Color(0x000000);
        mm.emissiveIntensity = highlight ? 0.45 : 0;
        mm.needsUpdate = true;
      }
    });
  }, [instance, highlight, color]);

  if (!instance) return null;

  return (
    <group
      position={[x, yOffset, z]}
      quaternion={quat}
      scale={TRACK_SCALE}
    >
      {/* IMPORTANT: do NOT put a rotation/quaternion prop on the
          primitive — its wrap already carries the fitToBox rotation
          that aligns the shagai's anatomy to the physics box axes.
          Overriding it here is what made the tiles stand on their
          end (onkh) instead of lying flat on the horse face. */}
      <primitive object={instance} />
    </group>
  );
}

function RaceTrack({
  playerPosition,
  robotPosition,
  template,
}: {
  playerPosition: number;
  robotPosition: number;
  template: THREE.Object3D | null;
}) {
  // Nearly-flush on the turf. The shagai short axis = TRACK_TILE_BOX[1]
  // after scaling.
  const yOffset = (TRACK_TILE_BOX[1] * TRACK_SCALE) / 2 + 0.01;

  return (
    <group>
      {Array.from({ length: TRACK_LENGTH }).map((_, i) => {
        const reachedByPlayer = playerPosition > i;
        const reachedByRobot = robotPosition > i;
        const isFinish = i === TRACK_LENGTH - 1;
        const color = isFinish
          ? "#f0c040"
          : reachedByPlayer
            ? "#60c060"
            : reachedByRobot
              ? "#e06050"
              : "#8a7040";
        const highlight = isFinish || reachedByPlayer || reachedByRobot;
        const x = TRACK_START_X + i * TRACK_SPACING;
        return (
          <TrackTile
            key={i}
            x={x}
            z={TRACK_Z}
            highlight={highlight}
            color={color}
            template={template}
            yOffset={yOffset}
          />
        );
      })}
    </group>
  );
}

// --------------------------------------------------------------------------
// Racer shagai – one per side (player/robot). Also static, sits above the
// track at the current square and animates smoothly when advanced.
// --------------------------------------------------------------------------
const RACER_SCALE = 0.95;
const RACER_TILE_BOX = SHAGAI_PHYS_BOX;

function Racer({
  position,
  zOffset,
  color,
  template,
  active,
}: {
  position: number;
  zOffset: number;
  color: string;
  template: THREE.Object3D | null;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetX = useRef(0);
  const currentX = useRef(0);
  const bounceRef = useRef(0);

  const instance = useMemo(() => {
    if (!template) return null;
    const clone = template.clone(true);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | THREE.MeshStandardMaterial[];
      if (Array.isArray(mat)) m.material = mat.map((mm) => mm.clone());
      else if (mat) m.material = mat.clone();
    });
    return clone;
  }, [template]);

  const quat = useMemo(() => buildTrackTileQuaternion(), []);

  useEffect(() => {
    if (!instance) return;
    const col = new THREE.Color(color);
    instance.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as
        | THREE.MeshStandardMaterial
        | THREE.MeshStandardMaterial[];
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const mm of mats) {
        if (!mm) continue;
        mm.emissive = col;
        mm.emissiveIntensity = active ? 0.7 : 0.35;
        mm.needsUpdate = true;
      }
    });
  }, [instance, color, active]);

  // Position 0 = before first tile; position N = on the Nth tile.
  const posToX = (p: number) => {
    const idx = Math.max(0, Math.min(TRACK_LENGTH - 1, p - 1));
    if (p <= 0) return TRACK_START_X - TRACK_SPACING; // idle before first tile
    return TRACK_START_X + idx * TRACK_SPACING;
  };

  useEffect(() => {
    targetX.current = posToX(position);
    bounceRef.current = 0.35; // trigger a small bounce on advance
  }, [position]);

  useEffect(() => {
    currentX.current = posToX(position);
    targetX.current = posToX(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth ease-out toward target.
    const diff = targetX.current - currentX.current;
    currentX.current += diff * Math.min(1, delta * 6);
    // Small vertical bounce when advancing.
    bounceRef.current = Math.max(0, bounceRef.current - delta);
    const bob = Math.sin(bounceRef.current * 10) * bounceRef.current * 0.35;
    groupRef.current.position.set(
      currentX.current,
      (RACER_TILE_BOX[1] * RACER_SCALE) / 2 + 0.02 + bob,
      zOffset,
    );
  });

  if (!instance) return null;

  return (
    <group ref={groupRef} scale={RACER_SCALE}>
      {/* Same fix as TrackTile: put the orientation on an outer group
          so we don't destroy the wrap's fitToBox alignment. */}
      <group quaternion={quat}>
        <primitive object={instance} />
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------
// FX.
// --------------------------------------------------------------------------
function WinLightEffect({ active }: { active: boolean }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!active) return;
    const t = state.clock.elapsedTime;
    if (light1.current) {
      light1.current.intensity = (Math.sin(t * 4) * 0.5 + 0.5) * 2;
      light1.current.position.x = Math.sin(t * 2) * 3;
    }
    if (light2.current) {
      light2.current.intensity = (Math.cos(t * 4) * 0.5 + 0.5) * 2;
      light2.current.position.x = Math.cos(t * 2) * 3;
    }
  });

  if (!active) return null;
  return (
    <>
      <pointLight
        ref={light1}
        color="#f0c040"
        intensity={2}
        distance={6}
        position={[0, 3, -1]}
      />
      <pointLight
        ref={light2}
        color="#60c0ff"
        intensity={1.5}
        distance={6}
        position={[0, 2, -1]}
      />
    </>
  );
}

interface SceneProps {
  throwParams: {
    vel: [number, number, number];
    angVel: [number, number, number];
  }[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  isWin: boolean;
  playerPosition: number;
  robotPosition: number;
  currentTurn: "player" | "robot";
}

function GameScene({
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  isWin,
  playerPosition,
  robotPosition,
  currentTurn,
}: SceneProps) {
  const template = useTrackTileTemplate();
  const pieceTemplate = useShagaiThrowPieceTemplate();

  return (
    <>
      <RaceMat />
      <WinLightEffect active={isWin} />

      <RaceTrack
        playerPosition={playerPosition}
        robotPosition={robotPosition}
        template={template}
      />

      {/* Player racer sits in front of the track (closer to camera).
          Tile half-extent in Z is ~SHAGAI_PHYS_BOX[2]·TRACK_SCALE; zOffset keeps
          racers clear of the track mesh. */}
      <Racer
        position={playerPosition}
        zOffset={TRACK_Z + 2.1}
        color="#60c060"
        template={template}
        active={currentTurn === "player"}
      />

      {/* Robot racer sits behind the track. */}
      <Racer
        position={robotPosition}
        zOffset={TRACK_Z - 2.1}
        color="#e06050"
        template={template}
        active={currentTurn === "robot"}
      />

      {/* Оньс дээр дахин шидэхгүй (maxOnkhRetries=0); оньс → хонь/ямаа нь shagai.ts-ийн detect-тэй ижил. */}
      {[0, 1, 2, 3].map((i) => (
        <SingleShagai
          key={i}
          id={i}
          startPos={SHAGAI_HORSE_RACE_THROW_START_POSITIONS[i]}
          throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
          throwAngVel={throwParams[i]?.angVel ?? [5, 5, 5]}
          isThrown={isThrown}
          onSettle={onSettle}
          highlight={settledSides[i] === "horse"}
          resultSide={settledSides[i]}
          pieceTemplate={pieceTemplate}
          maxOnkhRetries={0}
        />
      ))}
    </>
  );
}

// --------------------------------------------------------------------------
// Root component.
// --------------------------------------------------------------------------
export default function HorseRaceGame({ onComplete }: HorseRaceGameProps) {
  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<RaceState>(INITIAL_RACE_STATE);
  const [isThrown, setIsThrown] = useState(false);
  const [throwParams, setThrowParams] = useState<
    ReturnType<typeof getShagaiThrowParams>[]
  >([0, 1, 2, 3].map(() => getShagaiThrowParams()));
  const [settledSides, setSettledSides] = useState<(ShagaiSide | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [currentTurn, setCurrentTurn] = useState<"player" | "robot">("player");
  const currentTurnRef = useRef<"player" | "robot">("player");
  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultSentRef = useRef(false);
  const matchSentRef = useRef(false);

  useEffect(() => {
    if (state.phase !== "matchOver") return;
    if (matchSentRef.current) return;
    matchSentRef.current = true;
    const won = state.winner === "player";
    onComplete?.(won ? "win" : "lose", won ? 100 : 0);
  }, [state.phase, state.winner, onComplete]);

  const startThrow = useCallback(
    (turn: "player" | "robot") => {
      const params = [0, 1, 2, 3].map(() => getShagaiThrowParams());
      setThrowParams(params);
      settledRef.current = [null, null, null, null];
      settledCount.current = 0;
      resultSentRef.current = false;
      setSettledSides([null, null, null, null]);
      setCurrentTurn(turn);
      currentTurnRef.current = turn;

      setState((prev) => ({
        ...prev,
        phase: "throwing",
        totalThrows:
          turn === "player" ? prev.totalThrows + 1 : prev.totalThrows,
        robotSides: turn === "robot" ? prev.robotSides : null,
        robotHorseCount: turn === "robot" ? prev.robotHorseCount : 0,
      }));

      setIsThrown(false);
      setTimeout(() => setIsThrown(true), 50);
    },
    [],
  );

  const handleThrow = useCallback(() => {
    if (
      state.phase !== "idle" &&
      state.phase !== "playerResult" &&
      state.phase !== "robotResult"
    )
      return;
    if (state.winner !== null) return;
    startThrow("player");
  }, [state.phase, state.winner, startThrow]);

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      if (settledRef.current[id] !== null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;

      setSettledSides([...settledRef.current]);
      setState((prev) => ({ ...prev, phase: "settling" }));

      if (settledCount.current >= 4 && !resultSentRef.current) {
        resultSentRef.current = true;

        setTimeout(() => {
          const sides = settledRef.current.filter(Boolean) as ShagaiSide[];
          const horses = countHorses(sides);
          const turn = currentTurnRef.current;

          if (turn === "player") {
            if (horses > 0) grant({ coins: STONE_ROUND_COINS });

            setState((prev) => {
              const from = prev.playerPosition;
              const to = Math.min(TRACK_LENGTH, from + horses);
              const winNow = to >= TRACK_LENGTH;
              return {
                ...prev,
                phase: winNow ? "matchOver" : "playerResult",
                history: [
                  ...prev.history,
                  {
                    turn: "player",
                    sides,
                    horseCount: horses,
                    fromPosition: from,
                    toPosition: to,
                    throwNumber: prev.totalThrows,
                  },
                ],
                playerPosition: to,
                lastPlayerHorseCount: horses,
                winner: winNow ? "player" : prev.winner,
              };
            });
          } else {
            setState((prev) => {
              const from = prev.robotPosition;
              const to = Math.min(TRACK_LENGTH, from + horses);
              const winNow = to >= TRACK_LENGTH;
              return {
                ...prev,
                phase: winNow ? "matchOver" : "robotResult",
                robotSides: sides,
                robotHorseCount: horses,
                history: [
                  ...prev.history,
                  {
                    turn: "robot",
                    sides,
                    horseCount: horses,
                    fromPosition: from,
                    toPosition: to,
                    throwNumber: prev.totalThrows,
                  },
                ],
                robotPosition: to,
                winner: winNow ? "robot" : prev.winner,
              };
            });
          }
        }, 500);
      }
    },
    [grant],
  );

  // playerResult → robot takes a turn.
  useEffect(() => {
    if (state.phase !== "playerResult") return;
    const t1 = setTimeout(() => {
      setState((prev) => ({ ...prev, phase: "robotThinking" }));
    }, 1300);
    return () => clearTimeout(t1);
  }, [state.phase]);

  // Robot thinks → throws.
  useEffect(() => {
    if (state.phase !== "robotThinking") return;
    const t1 = setTimeout(() => {
      startThrow("robot");
    }, 1100);
    return () => clearTimeout(t1);
  }, [state.phase, startThrow]);

  const handleReset = useCallback(() => {
    setState(INITIAL_RACE_STATE);
    setSettledSides([null, null, null, null]);
    setCurrentTurn("player");
    currentTurnRef.current = "player";
    settledCount.current = 0;
    setIsThrown(false);
    resultSentRef.current = false;
    matchSentRef.current = false;
    resetGrants();
  }, [resetGrants]);

  const isWin = state.phase === "matchOver" && state.winner === "player";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 45%, #3a2a1a 0%, #241810 45%, #160e08 100%)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 10.5, 13.5], fov: 55 }}
        shadows
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.28} />
        <directionalLight
          position={[5, 14, 6]}
          intensity={1.4}
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
        <pointLight position={[-4, 5, -4]} intensity={0.35} color="#ffd080" />
        <pointLight position={[4, 4, 4]} intensity={0.2} color="#c0d4ff" />

        <Suspense fallback={null}>
          <Environment preset="night" />
          <Physics
            gravity={[0, -14, 0]}
            defaultContactMaterial={{ friction: 0.88, restitution: 0.12 }}
          >
            <PhysicsFloor />
            <GameScene
              throwParams={throwParams}
              isThrown={isThrown}
              settledSides={settledSides}
              onSettle={handleSettle}
              isWin={isWin}
              playerPosition={state.playerPosition}
              robotPosition={state.robotPosition}
              currentTurn={currentTurn}
            />
          </Physics>
        </Suspense>

        <OrbitControls
          minPolarAngle={Math.PI / 9}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={6}
          maxDistance={22}
          enablePan={false}
          target={[0, 0, -1.5]}
        />
      </Canvas>

      <HorseRaceUI
        state={state}
        onThrow={handleThrow}
        onReset={handleReset}
        settledSides={settledSides}
        currentTurn={currentTurn}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
      />
    </div>
  );
}

useGLTF.preload("/models/shagai_model.glb");
