"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Physics, usePlane } from "@react-three/cannon";
import {
  Suspense,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import SingleShagai, { useShagaiThrowPieceTemplate } from "./singleShagai";
import HorseRaceUI, { HORSE_MP_COLORS } from "./horseRaceUI";
import { pickLastShagai } from "./shagaiModel";
import { SHAGAI_PHYS_BOX, SHAGAI_SIDE_UP_AXIS } from "./shagai";
import {
  RaceState,
  INITIAL_RACE_STATE,
  TRACK_LENGTH,
  countHorses,
  type RaceTurnResult,
} from "./horseRaceType";
import type { ShagaiSide } from "./shagai";
import { useInventoryGrant } from "./useInventoryGrant";
import { STONE_ROUND_COINS } from "./gameRewardConstants";
import {
  getShagaiThrowParams,
  SHAGAI_HORSE_RACE_THROW_START_POSITIONS,
} from "./shagaiThrowShared";
import type { MatchRoomControls, PeerRelayEvent } from "@/hooks/useMatchRoom";
import { useApp } from "@/components/AppContext";

const RELAY_CH = "horse_race_mp_v1";

type HorseRaceMpRelay = {
  v: number;
  throwerId: string;
  sides: ShagaiSide[];
  positions: Record<string, number>;
  nextTurnPlayerId: string;
  totalThrows: number;
  lastHistory: RaceTurnResult;
  matchOver: boolean;
  winnerId: string | null;
  lastPlayerHorseCount: number;
};

type GameStateX = RaceState & { mpWinnerId?: string | null };

function PhysicsFloor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    friction: 0.85,
    restitution: 0.18,
  }));
  return <mesh ref={ref as React.LegacyRef<THREE.Mesh> | undefined} />;
}

function RaceMat() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2a1d12" roughness={1} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0.005, -3.1]}
      >
        <planeGeometry args={[13, 6.2]} />
        <meshStandardMaterial color="#243b22" roughness={0.95} />
      </mesh>
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
      {(
        [
          [[3.2, 1, 2.2] as [number, number, number], [0.2, 2, 6] as [number, number, number]],
          [[-3.2, 1, 2.2] as [number, number, number], [0.2, 2, 6] as [number, number, number]],
          [[0, 1, 4.6] as [number, number, number], [7, 2, 0.2] as [number, number, number]],
          [[0, 1, -4.8] as [number, number, number], [14, 2, 0.2] as [number, number, number]],
          [[6.8, 1, 0] as [number, number, number], [0.2, 2, 10] as [number, number, number]],
          [[-6.8, 1, 0] as [number, number, number], [0.2, 2, 10] as [number, number, number]],
        ] as const
      ).map((w, i) => (
        <mesh key={i} position={w[0]}>
          <boxGeometry args={w[1]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

const TRACK_TILE_BOX = SHAGAI_PHYS_BOX;
const TRACK_SCALE = 0.85;
const TRACK_SPACING = 0.55;
const TRACK_START_X = -((20 - 1) * TRACK_SPACING) / 2;
const TRACK_Z = -3.1;

function buildTrackTileQuaternion(): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    SHAGAI_SIDE_UP_AXIS.horse.clone(),
    new THREE.Vector3(0, 1, 0),
  );
}

function useTrackTileTemplate(): THREE.Object3D | null {
  const gltf = useGLTF("/models/shagai_model.glb");
  return useMemo(() => {
    const scene = (gltf as { scene?: THREE.Object3D })?.scene;
    if (!scene) return null;
    const wrap = pickLastShagai(scene.clone(true), TRACK_TILE_BOX);
    if (!wrap) return null;
    wrap.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
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
      <primitive object={instance} />
    </group>
  );
}

function RaceTrackLead({
  leadPosition,
  template,
}: {
  leadPosition: number;
  template: THREE.Object3D | null;
}) {
  const yOffset = (TRACK_TILE_BOX[1] * TRACK_SCALE) / 2 + 0.01;
  return (
    <group>
      {Array.from({ length: TRACK_LENGTH }).map((_, i) => {
        const reached = leadPosition > i;
        const isFinish = i === TRACK_LENGTH - 1;
        const color = isFinish
          ? "#f0c040"
          : reached
            ? "#5a9a5a"
            : "#8a7040";
        const highlight = isFinish || reached;
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

const RACER_SCALE = 0.95;
const RACER_TILE_BOX = SHAGAI_PHYS_BOX;

function laneZ(n: number, idx: number): number {
  if (n === 1) return TRACK_Z + 2.1;
  if (n === 2) return idx === 0 ? TRACK_Z + 2.1 : TRACK_Z - 2.1;
  if (n === 3) return [TRACK_Z + 2.2, TRACK_Z + 0.15, TRACK_Z - 2.0][idx]!;
  return [TRACK_Z + 2.45, TRACK_Z + 0.9, TRACK_Z - 0.65, TRACK_Z - 2.1][idx]!;
}

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

  const posToX = (p: number) => {
    const idx = Math.max(0, Math.min(TRACK_LENGTH - 1, p - 1));
    if (p <= 0) return TRACK_START_X - TRACK_SPACING;
    return TRACK_START_X + idx * TRACK_SPACING;
  };

  useEffect(() => {
    targetX.current = posToX(position);
    bounceRef.current = 0.35;
  }, [position]);

  useEffect(() => {
    currentX.current = posToX(position);
    targetX.current = posToX(position);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const diff = targetX.current - currentX.current;
    currentX.current += diff * Math.min(1, delta * 6);
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
      <group quaternion={quat}>
        <primitive object={instance} />
      </group>
    </group>
  );
}

function WinLightEffect({ active }: { active: boolean }) {
  const light1 = useRef<THREE.PointLight>(null);
  const light2 = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    if (!active) return;
    const t = s.clock.elapsedTime;
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseRelay(raw: unknown): HorseRaceMpRelay | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.v !== "number") return null;
  if (typeof raw.throwerId !== "string") return null;
  if (!Array.isArray(raw.sides) || raw.sides.length !== 4) return null;
  if (!isRecord(raw.positions)) return null;
  if (typeof raw.nextTurnPlayerId !== "string") return null;
  if (typeof raw.totalThrows !== "number") return null;
  if (typeof raw.lastPlayerHorseCount !== "number") return null;
  if (typeof raw.matchOver !== "boolean") return null;
  if (raw.winnerId !== null && typeof raw.winnerId !== "string")
    return null;
  if (!isRecord(raw.lastHistory)) return null;
  return raw as unknown as HorseRaceMpRelay;
}

type SceneProps = {
  throwParams: {
    vel: [number, number, number];
    angVel: [number, number, number];
  }[];
  isThrown: boolean;
  settledSides: (ShagaiSide | null)[];
  onSettle: (id: number, side: ShagaiSide) => void;
  isWin: boolean;
  order: string[];
  positions: Record<string, number>;
  turnPlayerId: string;
};

function GameScene({
  throwParams,
  isThrown,
  settledSides,
  onSettle,
  isWin,
  order,
  positions,
  turnPlayerId,
}: SceneProps) {
  const template = useTrackTileTemplate();
  const pieceTemplate = useShagaiThrowPieceTemplate();
  const n = order.length;
  const lead = useMemo(
    () => order.reduce((m, id) => Math.max(m, positions[id] ?? 0), 0),
    [order, positions],
  );

  return (
    <>
      <RaceMat />
      <WinLightEffect active={isWin} />
      <RaceTrackLead leadPosition={lead} template={template} />
      {order.map((id, i) => (
        <Racer
          key={id}
          position={positions[id] ?? 0}
          zOffset={laneZ(n, i)}
          color={HORSE_MP_COLORS[i % HORSE_MP_COLORS.length]!}
          template={template}
          active={turnPlayerId === id}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <SingleShagai
          key={i}
          id={i}
          startPos={SHAGAI_HORSE_RACE_THROW_START_POSITIONS[i]!}
          throwVel={throwParams[i]?.vel ?? [0, 5, 0]}
          throwAngVel={throwParams[i]?.angVel ?? [5, 5, 5]}
          isThrown={isThrown}
          onSettle={onSettle}
          highlight={settledSides[i] === "horse"}
          resultSide={settledSides[i] ?? null}
          pieceTemplate={pieceTemplate}
          maxOnkhRetries={0}
        />
      ))}
    </>
  );
}

type Props = {
  onComplete: (result: "win" | "lose", progressPct?: number) => void;
  mp: MatchRoomControls;
  lastPeerRelay: PeerRelayEvent | null;
  sendRelay: (ch: string, p: unknown) => void;
};

export function HorseRaceOnlineLobby() {
  const { language } = useApp();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 20,
        color: "rgba(255,255,255,0.85)",
        fontSize: 14,
        lineHeight: 1.5,
        background:
          "radial-gradient(circle at 50% 45%, #1a1410 0%, #0a0806 100%)",
      }}
    >
      {language === "en" ? (
        <span>
          In the room — Ready, then host starts. 2–4: same track, first to
          finish wins. 1: race vs bot.
        </span>
      ) : (
        <span>
          Өрөөнд: бүгд «Бэлэн» → эзэн «Эхлүүлэх» (2–4). 1: «Роботтой эхлэх».
        </span>
      )}
    </div>
  );
}

export default function HorseRaceGameMulti({
  onComplete,
  mp,
  lastPeerRelay,
  sendRelay,
}: Props) {
  const { language } = useApp();
  const myId = mp.playerId ?? "";
  const order = useMemo(
    () => mp.players.map((p) => p.id).filter(Boolean),
    [mp.players],
  );
  const nameById = useMemo(
    () =>
      Object.fromEntries(mp.players.map((p) => [p.id, p.displayName] as const)),
    [mp.players],
  );

  const { grant, rewardEvents, sessionGain, resetGrants } =
    useInventoryGrant();
  const [state, setState] = useState<GameStateX>(() => ({
    ...INITIAL_RACE_STATE,
    mpWinnerId: null,
  }));
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
  const [turnPlayerId, setTurnPlayerId] = useState(() => order[0] ?? "");
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [mpToast, setMpToast] = useState<string | null>(null);

  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const stateRef = useRef(state);
  stateRef.current = state;
  const currentTurnRef = useRef(turnPlayerId);
  const settledRef = useRef<(ShagaiSide | null)[]>([null, null, null, null]);
  const settledCount = useRef(0);
  const resultSentRef = useRef(false);
  const matchSentRef = useRef(false);
  const appliedV = useRef(0);
  const lastRelayId = useRef(-1);
  const lastThrowRef = useRef(0);
  const syncGen = useRef(0);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    currentTurnRef.current = turnPlayerId;
  }, [turnPlayerId]);

  useEffect(() => {
    setTurnPlayerId(order[0] ?? "");
    const z = Object.fromEntries(order.map((id) => [id, 0]));
    setPositions(z);
    positionsRef.current = z;
    setState({ ...INITIAL_RACE_STATE, mpWinnerId: null });
    appliedV.current = 0;
    syncGen.current += 1;
  }, [order, mp.matchStartedAt, mp.roomStatus]);

  useEffect(() => {
    if (state.phase !== "matchOver" || matchSentRef.current) return;
    const w = state.mpWinnerId;
    if (w == null) return;
    matchSentRef.current = true;
    onComplete(w === myId ? "win" : "lose", w === myId ? 100 : 0);
  }, [state.phase, state.mpWinnerId, onComplete, myId]);

  const pushToast = useCallback((text: string) => {
    if (toastT.current) clearTimeout(toastT.current);
    setMpToast(text);
    toastT.current = setTimeout(() => {
      setMpToast(null);
      toastT.current = null;
    }, 2800);
  }, []);

  const applyRemoteRelay = useCallback(
    (h: HorseRaceMpRelay) => {
      if (h.v <= appliedV.current) return;
      appliedV.current = h.v;
      setPositions(h.positions);
      positionsRef.current = h.positions;
      setState((prev) => ({
        ...prev,
        history: [...prev.history, h.lastHistory],
        totalThrows: h.totalThrows,
        playerPosition: h.positions[myId] ?? 0,
        robotPosition: 0,
        lastPlayerHorseCount: h.lastPlayerHorseCount,
        phase: h.matchOver ? "matchOver" : "playerResult",
        winner:
          h.matchOver && h.winnerId
            ? h.winnerId === myId
              ? "player"
              : "robot"
            : null,
        mpWinnerId: h.matchOver ? h.winnerId : null,
        robotSides: null,
        robotHorseCount: 0,
      }));
      setTurnPlayerId(
        h.matchOver ? h.throwerId : h.nextTurnPlayerId,
      );
      setSettledSides(
        h.sides.slice(0, 4) as (ShagaiSide | null)[],
      );
      setIsThrown(true);
      if (!h.matchOver) {
        setTimeout(() => {
          setSettledSides([null, null, null, null]);
          setIsThrown(false);
          setState((p) => ({
            ...p,
            phase: "idle",
            lastPlayerHorseCount: 0,
          }));
        }, 1200);
      } else {
        setIsThrown(false);
      }
      const who = nameById[h.throwerId] ?? "?";
      if (h.lastPlayerHorseCount > 0) {
        pushToast(
          language === "en"
            ? `${who}: +${h.lastPlayerHorseCount} horses`
            : `${who}: +${h.lastPlayerHorseCount} морь`,
        );
      } else {
        pushToast(
          language === "en" ? `${who}: 0 horses` : `${who}: морьгүй`,
        );
      }
    },
    [myId, nameById, pushToast, language],
  );

  const startThrow = useCallback(
    (forId: string) => {
      if (forId !== myId) return;
      const params = [0, 1, 2, 3].map(() => getShagaiThrowParams());
      setThrowParams(params);
      settledRef.current = [null, null, null, null];
      settledCount.current = 0;
      resultSentRef.current = false;
      setSettledSides([null, null, null, null]);
      setState((prev) => {
        const nt = prev.totalThrows + 1;
        lastThrowRef.current = nt;
        return {
          ...prev,
          totalThrows: nt,
          phase: "throwing",
          robotSides: null,
          robotHorseCount: 0,
        };
      });
      setIsThrown(false);
      setTimeout(() => setIsThrown(true), 50);
    },
    [myId],
  );

  const handleThrow = useCallback(() => {
    if (
      state.phase !== "idle" &&
      state.phase !== "playerResult" &&
      state.phase !== "robotResult"
    )
      return;
    if (turnPlayerId !== myId) return;
    if (state.winner != null) return;
    startThrow(myId);
  }, [state.phase, state.winner, startThrow, turnPlayerId, myId]);

  const handleSettle = useCallback(
    (id: number, side: ShagaiSide) => {
      if (turnPlayerId !== myId) return;
      if (settledRef.current[id] !== null) return;
      settledRef.current[id] = side;
      settledCount.current += 1;
      setSettledSides([...settledRef.current]);
      setState((prev) => ({ ...prev, phase: "settling" }));

      if (settledCount.current < 4 || resultSentRef.current) return;
      resultSentRef.current = true;
      const gen = syncGen.current;
      setTimeout(() => {
        if (gen !== syncGen.current) return;
        const sides = settledRef.current.filter(Boolean) as ShagaiSide[];
        const horses = countHorses(sides);
        const thrower = myId;
        if (horses > 0) grant({ coins: STONE_ROUND_COINS });

        const o = orderRef.current;
        const before = { ...positionsRef.current };
        const from = before[thrower] ?? 0;
        const to = Math.min(TRACK_LENGTH, from + horses);
        const matchOver = to >= TRACK_LENGTH;
        const winnerId = matchOver ? thrower : null;
        const newScores = { ...before, [thrower]: to };
        const tr = lastThrowRef.current;
        const idx = o.indexOf(thrower);
        const nextTurn = o[(idx + 1) % o.length] ?? thrower;

        const hist: RaceTurnResult = {
          turn: "player",
          throwerId: thrower,
          sides,
          horseCount: horses,
          fromPosition: from,
          toPosition: to,
          throwNumber: tr,
        };

        setPositions(newScores);
        positionsRef.current = newScores;
        setTurnPlayerId(matchOver ? thrower : nextTurn);
        appliedV.current += 1;
        sendRelay(RELAY_CH, {
          v: appliedV.current,
          throwerId: thrower,
          sides,
          positions: newScores,
          nextTurnPlayerId: matchOver ? thrower : nextTurn,
          totalThrows: tr,
          lastPlayerHorseCount: horses,
          lastHistory: hist,
          matchOver,
          winnerId,
        } satisfies HorseRaceMpRelay);

        if (!matchOver) {
          setTimeout(() => {
            if (gen !== syncGen.current) return;
            setSettledSides([null, null, null, null]);
            setState((p) => ({
              ...p,
              phase: "idle",
              lastPlayerHorseCount: 0,
            }));
            setIsThrown(false);
          }, 1200);
        } else {
          setIsThrown(false);
        }

        setState((p) => ({
          ...p,
          history: [...p.history, hist],
          phase: matchOver ? "matchOver" : "playerResult",
          playerPosition: newScores[myId] ?? 0,
          robotPosition: 0,
          lastPlayerHorseCount: horses,
          winner: matchOver && winnerId
            ? winnerId === myId
              ? "player"
              : "robot"
            : null,
          mpWinnerId: matchOver ? winnerId : null,
          robotSides: null,
        }));
      }, 500);
    },
    [turnPlayerId, myId, grant, sendRelay],
  );

  useEffect(() => {
    if (!lastPeerRelay || lastPeerRelay.id === lastRelayId.current) return;
    if (lastPeerRelay.channel !== RELAY_CH) return;
    lastRelayId.current = lastPeerRelay.id;
    if (lastPeerRelay.from === myId) return;
    const p = parseRelay(lastPeerRelay.payload);
    if (p) applyRemoteRelay(p);
  }, [lastPeerRelay, myId, applyRemoteRelay]);

  const handleReset = useCallback(() => {
    setState({ ...INITIAL_RACE_STATE, mpWinnerId: null });
    setSettledSides([null, null, null, null]);
    setTurnPlayerId(order[0] ?? "");
    const z = Object.fromEntries(order.map((id) => [id, 0]));
    setPositions(z);
    positionsRef.current = z;
    settledCount.current = 0;
    setIsThrown(false);
    resultSentRef.current = false;
    matchSentRef.current = false;
    appliedV.current = 0;
    lastRelayId.current = -1;
    syncGen.current += 1;
    resetGrants();
  }, [order, resetGrants]);

  const isWin = state.phase === "matchOver" && state.mpWinnerId === myId;
  const currentTurnUi: "player" | "robot" =
    turnPlayerId === myId ? "player" : "robot";

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
              order={order}
              positions={positions}
              turnPlayerId={turnPlayerId}
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
        currentTurn={currentTurnUi}
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
        uiMode="mp"
        mp={{
          myId,
          nameById,
          order,
          turnPlayerId,
          positions,
        }}
        mpToastText={mpToast}
        mpWinnerId={state.mpWinnerId ?? null}
      />
    </div>
  );
}

useGLTF.preload("/models/shagai_model.glb");
