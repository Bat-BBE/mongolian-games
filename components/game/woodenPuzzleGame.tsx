"use client";

import { Canvas, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as THREE from "three";
import {
  ALL_LEVELS,
  SNAP_ANGLE_RAD,
  SNAP_DISTANCE,
  angleDiff,
  getBoundsXZ,
  getDefFootprintRadius,
  getMeshParts,
  randomScatterPosition,
  type PieceDef,
  type PuzzleLevel,
} from "./woodenPuzzleType";
import { useInventoryGrant } from "./useInventoryGrant";
import InventoryRewardOverlay from "./InventoryRewardOverlay";
import { playButtonClick } from "@/lib/uiSounds";
import { useApp } from "@/components/AppContext";

export type WoodenPuzzleGameProps = {
  onComplete?: (result: "win" | "lose", progressPct?: number) => void;
  onProgressChange?: (locked: number, total: number) => void;
  onSolved?: (meta: { elapsedMs: number; moves: number }) => void;
  showGuidePanel?: boolean;
};

type PieceRuntime = {
  def: PieceDef;
  position: THREE.Vector3;
  rotY: number;
  locked: boolean;
};

export function pieceLabel(def: PieceDef, lang: "mn" | "en") {
  return lang === "mn" ? def.labelMn : def.labelEn;
}

export type WoodenUi = {
  gameTitle: string;
  piecesWord: string;
  nextStep: string;
  allLocked: string;
  orderHeader: string;
  instructions: ReactNode;
  qeHint: string;
  winTitle: string;
  winSub: string;
  playAgain: string;
  guideAbout: string;
  guideIntro: (level: PuzzleLevel) => ReactNode;
  guideOrderLabel: string;
  guideTargetShape: string;
  requiresLabel: string;
  targetRotLabel: string;
  snapFooter: string;
};

function useWoodenPuzzleUi(): WoodenUi & { lang: "mn" | "en" } {
  const { language } = useApp();
  const lang: "mn" | "en" = language === "mn" ? "mn" : "en";
  return useMemo(() => {
    if (lang === "mn") {
      return {
        lang,
        gameTitle: "МОДОН ОНЬС",
        piecesWord: "хэсэг",
        nextStep: "Дараагийн алхам",
        allLocked: "Бүх хэсэг түгжигдлээ.",
        orderHeader: "Дараалал (заавал):",
        instructions: (
          <span>
            Хэсгийг дарж сонгоно → чирнэ. Бусад хэсгийг түр хөдөлгөж болно,
            гэхдээ <strong>түгжих</strong> нь зөвхөн дээрх дарааллаар. Түгжихийн
            тулд зорилтот алтлаг дугуй руу ойртуулаад{" "}
            <strong>гар тавина</strong> (хулганы товчийг тавих).
          </span>
        ),
        qeHint: "Q / E — нарийвчлан эргүүлэх",
        winTitle: "Бүх хэсэг түгжигдлээ!",
        winSub: "Модон оньсны бүтэц бүрэн тогтсон.",
        playAgain: "Дахин тоглох",
        guideAbout: "ТОГЛООМЫН ТУХАЙ",
        guideIntro: (level: PuzzleLevel) => (
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#c8a030" }}>Модон оньс</strong> —{" "}
            {level.pieces.length} хэсгийг зорилтот байрлал, эргэлтээр{" "}
            <strong>нэг бүтэц</strong> болгоно (хажуу, давхар, өөр өнцөг).{" "}
            <strong>Дараагийг</strong> түгжихийн өмнөх нь түгжигдсэн байх ёстой.
          </p>
        ),
        guideOrderLabel: "Дараалал",
        guideTargetShape: "Зорилтот хэлбэр (дээрээс харах)",
        requiresLabel: "Өмнө нь:",
        targetRotLabel: "Зорилтот эргэлт Y:",
        snapFooter:
          "Snap хатуу — ойртуулаад гар тавих, хэрэгтэй бол Q/E-ээр эргүүл.",
      };
    }
    return {
      lang,
      gameTitle: "WOODEN INTERLOCK",
      piecesWord: "pieces",
      nextStep: "Next step",
      allLocked: "All pieces locked.",
      orderHeader: "Order (required):",
      instructions: (
        <span>
          Click to select → drag. You may move other pieces freely, but{" "}
          <strong>locking</strong> follows the order above. Near the gold ring,{" "}
          <strong>release</strong> the mouse button to lock.
        </span>
      ),
      qeHint: "Q / E — fine rotation",
      winTitle: "All pieces locked!",
      winSub: "The wooden interlock structure is complete.",
      playAgain: "Play again",
      guideAbout: "ABOUT THE GAME",
      guideIntro: (level: PuzzleLevel) => (
        <p style={{ margin: 0 }}>
          <strong style={{ color: "#c8a030" }}>{level.titleEn}</strong> —{" "}
          {level.pieces.length} pieces into one structure by position and
          rotation (side, stack, angles). The <strong>previous</strong> piece
          must be locked before the next.
        </p>
      ),
      guideOrderLabel: "Order",
      guideTargetShape: "Target shape (top view)",
      requiresLabel: "Requires:",
      targetRotLabel: "Target rotation Y:",
      snapFooter:
        "Snap is strict — get close, release; use Q/E to rotate when needed.",
    };
  }, [lang]);
}

function bottomBarExtraHint(id: string, lang: "mn" | "en"): string {
  if (id === "B") {
    return lang === "mn"
      ? " «Хажуу»-д зорилтот өнцөг (~18°) — Q/E."
      : " «Side» needs the target angle (~18°) — Q/E.";
  }
  if (id === "C") {
    return lang === "mn"
      ? " «Давхар»-ыг ширээн дээр зөв XZ-ээр авчирна."
      : " Place «Cap» on the table in XZ; it snaps to height when correct.";
  }
  if (["D", "E", "F", "G"].includes(id)) {
    return lang === "mn"
      ? " Зарим хэсэгт зорилтот эргэлт шаардна — Q/E."
      : " Some pieces need target rotation — Q/E.";
  }
  return "";
}

const TABLE_Y = 0.18;

function buildInitialPieces(level: PuzzleLevel): PieceRuntime[] {
  const list: PieceRuntime[] = [];
  for (let i = 0; i < level.pieces.length; i++) {
    const def = level.pieces[i];
    let pos = new THREE.Vector3();
    let tries = 0;
    do {
      const [x, y, z] = randomScatterPosition(i * 17 + tries * 7);
      pos.set(x, y, z);
      tries++;
    } while (
      tries < 50 &&
      list.some((o) => {
        const r1 = getDefFootprintRadius(def);
        const r2 = getDefFootprintRadius(o.def);
        return (
          Math.hypot(o.position.x - pos.x, o.position.z - pos.z) <
          r1 + r2 + 0.12
        );
      })
    );
    /** Эхний 3 хэсэг: бага эргэлт. Зорилтод эргэлттэй (жишээ нь B) — эхлээд зорилтод ойртуулна,
     *  эсвэл ±8° эргэлт + 8° snap-аас давж «2 дахь хэсэг» түгжигдэхгүй үлдэнэ. */
    let rotY: number;
    if (i < 3) {
      const u = randomScatterPosition(i * 31 + 1)[0] / 1.3;
      if (Math.abs(def.targetRotY) > 1e-5) {
        rotY = def.targetRotY + u * THREE.MathUtils.degToRad(7);
      } else {
        rotY = u * THREE.MathUtils.degToRad(8);
      }
    } else {
      rotY = (randomScatterPosition(i * 31 + 1)[0] * 0.8 - 0.4) * Math.PI;
    }
    list.push({
      def,
      position: pos.clone(),
      rotY,
      locked: false,
    });
  }
  return list;
}

function depsSatisfied(def: PieceDef, lockedIds: Set<string>): boolean {
  return def.requires.every((id) => lockedIds.has(id));
}

function canSnap(
  def: PieceDef,
  pos: THREE.Vector3,
  rotY: number,
  lockedIds: Set<string>,
  snapDist: number,
  snapAng: number,
): boolean {
  if (!depsSatisfied(def, lockedIds)) return false;
  const t = new THREE.Vector3(...def.target);
  if (def.snapXZOnly) {
    const dx = pos.x - t.x;
    const dz = pos.z - t.z;
    if (Math.hypot(dx, dz) > snapDist) return false;
    if (Math.abs(pos.y - TABLE_Y) > 0.09) return false;
  } else if (pos.distanceTo(t) > snapDist) {
    return false;
  }
  if (angleDiff(rotY, def.targetRotY) > snapAng) return false;
  return true;
}

function PieceMesh({
  piece,
  selected,
  onPointerDown,
}: {
  piece: PieceRuntime;
  selected: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const { def, position, rotY, locked } = piece;
  const parts = getMeshParts(def);
  const emissive = locked ? "#2a5018" : selected ? "#4a3810" : "#000000";

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[0, rotY, 0]}
    >
      {parts.map((part, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={part.offset}
          onPointerDown={(e) => {
            e.stopPropagation();
            onPointerDown(e);
          }}
        >
          <boxGeometry args={part.size} />
          <meshStandardMaterial
            color={def.color}
            roughness={0.75}
            metalness={0.08}
            emissive={emissive}
            emissiveIntensity={locked ? 0.12 : selected ? 0.06 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

function PuzzleScene({
  pieces,
  setPieces,
  selectedId,
  setSelectedId,
  draggingId,
  setDraggingId,
  lockedIds,
  phase,
  snapDistance,
  snapAngleRad,
  frozen,
  nextActiveId,
  levelId,
}: {
  pieces: PieceRuntime[];
  setPieces: React.Dispatch<React.SetStateAction<PieceRuntime[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  lockedIds: Set<string>;
  phase: "playing" | "won";
  snapDistance: number;
  snapAngleRad: number;
  frozen: boolean;
  nextActiveId: string | null;
  levelId: string;
}) {
  const { camera, gl, raycaster } = useThree();

  const lvl1PathKey = pieces.map((p) => p.def.target.join(",")).join("|");
  const lvl1StackKey = pieces
    .map((p) => (p.def.snapXZOnly ? `${p.def.id}:${p.locked}` : ""))
    .filter(Boolean)
    .join(";");

  const lvl1AssemblyPath = useMemo(() => {
    if (levelId !== "lvl1") return null;
    const pts = lvl1PathKey.split("|").map((s) => {
      const [x, , z] = s.split(",").map(Number);
      return new THREE.Vector3(x, 0.022, z);
    });
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color: "#c8a030",
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    return new THREE.Line(g, m);
  }, [levelId, lvl1PathKey]);

  const lvl1StackGuides = useMemo(() => {
    if (levelId !== "lvl1") return [] as THREE.Line[];
    const lines: THREE.Line[] = [];
    for (const p of pieces) {
      if (!p.def.snapXZOnly || p.locked) continue;
      const [tx, ty, tz] = p.def.target;
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(tx, 0.022, tz),
        new THREE.Vector3(tx, ty, tz),
      ]);
      const m = new THREE.LineBasicMaterial({
        color: "#a08040",
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      lines.push(new THREE.Line(g, m));
    }
    return lines;
  }, [levelId, lvl1StackKey, pieces]);

  const dragRef = useRef<{
    id: string;
    offset: THREE.Vector3;
  } | null>(null);

  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -TABLE_Y),
    [],
  );
  const hit = useMemo(() => new THREE.Vector3(), []);

  const trySnapPiece = useCallback(
    (p: PieceRuntime, lockedOverride?: Set<string>): PieceRuntime | null => {
      if (p.locked) return null;
      const ids = lockedOverride ?? lockedIds;
      if (!canSnap(p.def, p.position, p.rotY, ids, snapDistance, snapAngleRad))
        return null;
      return {
        ...p,
        position: new THREE.Vector3(...p.def.target),
        rotY: p.def.targetRotY,
        locked: true,
      };
    },
    [lockedIds, snapDistance, snapAngleRad],
  );

  useEffect(() => {
    if (!draggingId || !dragRef.current) return;

    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;

      setPieces((prev) => {
        /** Зөвхөн түгжээгүй хоорондын давхцлыг хорино — түгжигдсэн суурь дээр
         *  дараагийн хэсгийг чирэхэд зам дээр «гацах»-аас сэргийлнэ. */
        const overlaps = (id: string, pos: THREE.Vector3) => {
          const curDef = prev.find((x) => x.def.id === id)?.def;
          if (!curDef) return false;
          const r1 = getDefFootprintRadius(curDef);
          for (const o of prev) {
            if (o.def.id === id) continue;
            if (o.locked) continue;
            const r2 = getDefFootprintRadius(o.def);
            const dx = pos.x - o.position.x;
            const dz = pos.z - o.position.z;
            if (Math.hypot(dx, dz) < r1 + r2 + 0.1) return true;
          }
          return false;
        };
        return prev.map((p) => {
          if (p.def.id !== d.id || p.locked) return p;
          const np = hit.clone().add(d.offset);
          np.y = p.position.y;
          if (overlaps(d.id, np)) return p;
          return { ...p, position: np };
        });
      });
    };

    const up = () => {
      const d = dragRef.current;
      dragRef.current = null;
      setDraggingId(null);

      if (!d) return;
      setPieces((prev) => {
        const cur = prev.find((x) => x.def.id === d.id);
        if (!cur || cur.locked) return prev;

        const idsFromPrev = new Set<string>();
        for (const o of prev) {
          if (o.locked) idsFromPrev.add(o.def.id);
        }
        const snapped = trySnapPiece(cur, idsFromPrev);
        if (snapped) {
          return prev.map((x) => (x.def.id === d.id ? snapped : x));
        }

        return prev;
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [
    draggingId,
    camera,
    gl,
    raycaster,
    plane,
    hit,
    setPieces,
    setDraggingId,
    trySnapPiece,
  ]);

  const handlePointerDown = (
    piece: PieceRuntime,
    e: ThreeEvent<PointerEvent>,
  ) => {
    if (frozen || phase !== "playing" || piece.locked) return;
    playButtonClick();
    setSelectedId(piece.def.id);
    const rect = gl.domElement.getBoundingClientRect();
    const ev = e.nativeEvent;
    const ndc = new THREE.Vector2(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return;
    const offset = piece.position.clone().sub(hit);
    dragRef.current = { id: piece.def.id, offset };
    setDraggingId(piece.def.id);
  };

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight
        position={[4, 9, 5]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 4, -2]} intensity={0.35} color="#ffd8a8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#1e1610" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 2.4, 64]} />
        <meshStandardMaterial
          color="#3d2e18"
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {lvl1AssemblyPath && <primitive object={lvl1AssemblyPath} />}
      {lvl1StackGuides.map((ln, i) => (
        <primitive key={`stack-${i}`} object={ln} />
      ))}

      {pieces.map((p) => {
        if (p.locked) return null;
        const isNext = p.def.id === nextActiveId;
        const [tx, , tz] = p.def.target;
        if (levelId === "lvl1" && !isNext) return null;
        return (
          <mesh
            key={`slot-${p.def.id}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[tx, 0.018, tz]}
            renderOrder={-2}
          >
            <ringGeometry
              args={[isNext ? 0.1 : 0.07, isNext ? 0.28 : 0.18, 48]}
            />
            <meshStandardMaterial
              color={isNext ? "#f0c040" : p.def.color}
              transparent
              opacity={isNext ? 0.5 : 0.22}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {pieces.map((p) => {
        const t = new THREE.Vector3(...p.def.target);
        const posOk = p.def.snapXZOnly
          ? Math.hypot(p.position.x - t.x, p.position.z - t.z) <=
              snapDistance * 1.15 && Math.abs(p.position.y - TABLE_Y) < 0.08
          : p.position.distanceTo(t) <= snapDistance * 1.15;
        const ghostOk =
          !!selectedId &&
          p.def.id === selectedId &&
          !p.locked &&
          depsSatisfied(p.def, lockedIds) &&
          posOk &&
          angleDiff(p.rotY, p.def.targetRotY) <= snapAngleRad * 1.2;

        const parts = getMeshParts(p.def);

        return (
          <group key={p.def.id}>
            {ghostOk && (
              <group
                position={p.def.target}
                rotation={[0, p.def.targetRotY, 0]}
                renderOrder={-1}
              >
                {parts.map((part, i) => (
                  <mesh key={i} position={part.offset}>
                    <boxGeometry
                      args={[
                        part.size[0] * 1.06,
                        part.size[1] * 1.04,
                        part.size[2] * 1.06,
                      ]}
                    />
                    <meshStandardMaterial
                      color="#40c060"
                      transparent
                      opacity={0.22}
                      depthWrite={false}
                    />
                  </mesh>
                ))}
              </group>
            )}
            <PieceMesh
              piece={p}
              selected={selectedId === p.def.id}
              onPointerDown={(e) => handlePointerDown(p, e)}
            />
          </group>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={8}
        minPolarAngle={Math.PI / 4.5}
        maxPolarAngle={Math.PI / 2.15}
        target={levelId === "lvl1" ? [0.05, 0.28, 0] : [0.35, 0.15, 0]}
        enabled={!draggingId && !frozen}
      />
    </>
  );
}

export default function WoodenPuzzleGame({
  onComplete,
  onProgressChange,
  onSolved,
  showGuidePanel = false,
}: WoodenPuzzleGameProps) {
  const { rewardEvents, sessionGain, resetGrants } = useInventoryGrant();
  const level = ALL_LEVELS[0];
  const snapDistance = level.snapDistance ?? SNAP_DISTANCE;
  const snapAngleRad = level.snapAngleRad ?? SNAP_ANGLE_RAD;

  const [pieces, setPieces] = useState<PieceRuntime[]>(() =>
    buildInitialPieces(ALL_LEVELS[0]),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"playing" | "won">("playing");
  const [moves, setMoves] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const submittedRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  const lockedIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of pieces) {
      if (p.locked) s.add(p.def.id);
    }
    return s;
  }, [pieces]);
  const lockedCount = lockedIds.size;
  const totalCount = level.pieces.length;

  /** Одоо зөвхөн энэ хэсгийг зөв байрлуулж болно (дараалал). */
  const nextActivePiece = useMemo(() => {
    for (const p of pieces) {
      if (p.locked) continue;
      if (depsSatisfied(p.def, lockedIds)) return p;
    }
    return null;
  }, [pieces, lockedIds]);
  const nextActiveId = nextActivePiece?.def.id ?? null;

  const onWin = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("won");
    onSolved?.({ elapsedMs, moves });
    onComplete?.("win", 100);
  }, [elapsedMs, moves, onComplete, onSolved]);

  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;
  const levelWinEmittedRef = useRef(false);

  useEffect(() => {
    levelWinEmittedRef.current = false;
  }, [level.id]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (pieces.length === 0) return;
    if (!pieces.every((p) => p.locked)) return;
    if (levelWinEmittedRef.current) return;
    levelWinEmittedRef.current = true;
    queueMicrotask(() => onWinRef.current());
  }, [pieces, phase]);

  useEffect(() => {
    onProgressChange?.(lockedCount, totalCount);
  }, [lockedCount, totalCount, onProgressChange]);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = window.setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startedAtRef.current));
    }, 250);
    return () => window.clearInterval(t);
  }, [phase]);

  const rotateSelected = useCallback(
    (deltaDeg: number) => {
      if (!selectedId || phase !== "playing") return;
      playButtonClick();
      const dr = THREE.MathUtils.degToRad(deltaDeg);
      setPieces((prev) =>
        prev.map((p) => {
          if (p.def.id !== selectedId || p.locked) return p;
          return { ...p, rotY: p.rotY + dr };
        }),
      );
      setMoves((m) => m + 1);
    },
    [selectedId, phase],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      if (e.key === "q" || e.key === "Q") rotateSelected(-8);
      if (e.key === "e" || e.key === "E") rotateSelected(8);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, rotateSelected]);

  const resetRound = useCallback(() => {
    playButtonClick();
    resetGrants();
    submittedRef.current = false;
    levelWinEmittedRef.current = false;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    setMoves(0);
    setPieces(buildInitialPieces(ALL_LEVELS[0]));
    setSelectedId(null);
    setDraggingId(null);
    setPhase("playing");
  }, [resetGrants]);

  const frozen = phase !== "playing";

  const ui = useWoodenPuzzleUi();

  const mm = String(Math.floor(elapsedMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, "0");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#080604",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0.45, 3.9, 6.2], fov: 42 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a0806"]} />
        <PuzzleScene
          pieces={pieces}
          setPieces={setPieces}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          lockedIds={lockedIds}
          phase={phase === "playing" ? "playing" : "won"}
          snapDistance={snapDistance}
          snapAngleRad={snapAngleRad}
          frozen={frozen}
          nextActiveId={nextActiveId}
          levelId={level.id}
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          maxWidth: 320,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(8,6,4,0.9)",
          border: "1px solid rgba(200,160,48,0.26)",
          color: "#ddd",
          fontSize: 12,
          lineHeight: 1.4,
          fontFamily:
            "var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {/* <div style={{ color: "#c8a030", fontSize: 11, letterSpacing: 1.5 }}>
            {ui.gameTitle}
          </div> */}
          <div style={{ fontSize: 11, color: "#a89a88" }}>
            {mm}:{ss} · {moves} {ui.lang === "mn" ? "алхам" : "moves"}
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "#7a6a58" }}>
          {lockedCount}/{totalCount} {ui.piecesWord}
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(200,140,40,0.11)",
            border: "1px solid rgba(200,160,48,0.3)",
          }}
        >
          <div style={{ fontSize: 10, color: "#c8a030", marginBottom: 4 }}>
            {ui.nextStep}
          </div>
          <div style={{ fontSize: 11, color: "#e2d4c3" }}>
            {nextActivePiece
              ? `${pieceLabel(nextActivePiece.def, ui.lang)} (${nextActivePiece.def.id})`
              : ui.allLocked}
          </div>
        </div>
        <details
          style={{
            marginTop: 8,
            padding: "7px 9px",
            borderRadius: 8,
            border: "1px solid rgba(120, 180, 220, 0.2)",
            background: "rgba(0,0,0,0.2)",
            fontSize: 10,
            color: "#8a8a78",
            lineHeight: 1.45,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 600,
              color: "rgba(200, 210, 180, 0.95)",
            }}
          >
            {ui.lang === "mn" ? "Хурдан тайлбар" : "Quick how-to"}
          </summary>
          <div style={{ marginTop: 6 }}>{ui.instructions}</div>
        </details>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            onClick={() => rotateSelected(-10)}
            disabled={phase !== "playing" || !selectedId}
            style={btnMini(phase === "playing" && !!selectedId)}
          >
            ↺ −10°
          </button>
          <button
            type="button"
            onClick={() => rotateSelected(10)}
            disabled={phase !== "playing" || !selectedId}
            style={btnMini(phase === "playing" && !!selectedId)}
          >
            ↻ +10°
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "#666" }}>
          {ui.qeHint}
        </div>
      </div>

      {showGuidePanel ? (
        <WoodenGuidePanel level={level} lockedIds={lockedIds} ui={ui} />
      ) : null}

      {phase === "playing" && nextActivePiece && (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "min(520px, 92vw)",
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(12,10,8,0.92)",
            border: "1px solid rgba(200,160,48,0.35)",
            color: "#d8c8b8",
            fontSize: 12,
            textAlign: "center",
            lineHeight: 1.45,
            pointerEvents: "none",
            fontFamily:
              "var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          }}
        >
          <span style={{ color: ui.lang === "mn" ? "#d8c8b8" : "#a8a0a8" }}>
            <span style={{ color: "#c8a030" }}>→ </span>«
            {pieceLabel(nextActivePiece.def, ui.lang)}» —
            {ui.lang === "mn" ? (
              <>
                шугам ба шар дугуй руу ойртуулна. Ногоон хэсэг гарвал{" "}
                <strong>гар тавихад</strong> түгжигдэнэ.
              </>
            ) : (
              <>
                follow the line to the gold ring; when the green ghost shows,{" "}
                <strong>release</strong> to lock.
              </>
            )}
            {bottomBarExtraHint(nextActivePiece.def.id, ui.lang)}
          </span>
        </div>
      )}

      {phase === "won" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "24px 32px",
              borderRadius: 16,
              border: "1px solid rgba(200,160,48,0.4)",
              background: "rgba(12,10,8,0.95)",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div
              style={{
                color: "#c8a030",
                fontSize: 18,
                letterSpacing: ui.lang === "mn" ? 2 : 1,
              }}
            >
              {ui.winTitle}
            </div>
            <p
              style={{
                color: "#8a7a68",
                fontSize: 12,
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              {ui.winSub}
            </p>
            <button
              type="button"
              onClick={resetRound}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(180deg, #c8a030, #8a6820)",
                color: "#1a1208",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {ui.playAgain}
            </button>
          </div>
        </div>
      )}

      <InventoryRewardOverlay
        rewardEvents={rewardEvents}
        sessionGain={sessionGain}
      />
    </div>
  );
}

function WoodenGuidePanel({
  level,
  lockedIds,
  ui,
}: {
  level: PuzzleLevel;
  lockedIds: Set<string>;
  ui: WoodenUi & { lang: "mn" | "en" };
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        top: 10,
        width: "min(300px, calc(100vw - 32px))",
        maxHeight: "calc(100% - 72px)",
        overflowY: "auto",
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(8,6,4,0.9)",
        border: "1px solid rgba(200,160,48,0.28)",
        color: "#c8c0b8",
        fontSize: 11,
        lineHeight: 1.5,
        fontFamily:
          "var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          color: "#c8a030",
          letterSpacing: 2,
          fontSize: 10,
          marginBottom: 8,
        }}
      >
        {ui.guideAbout}
      </div>
      <div style={{ margin: "0 0 10px", color: "#9a9088" }}>
        {ui.guideIntro(level)}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "#7a7068",
          marginBottom: 10,
          padding: "8px 10px",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 8,
        }}
      >
        <div style={{ color: "#a89880", marginBottom: 4 }}>
          {ui.guideOrderLabel}
        </div>
        <div>{level.pieces.map((p) => pieceLabel(p, ui.lang)).join(" → ")}</div>
      </div>
      <div style={{ color: "#a89880", marginBottom: 6, fontSize: 10 }}>
        {ui.guideTargetShape}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {level.pieces.map((def) => {
          const locked = lockedIds.has(def.id);
          const req =
            def.requires.length === 0
              ? "—"
              : def.requires
                  .map((id) => {
                    const p = level.pieces.find((x) => x.id === id);
                    return p ? pieceLabel(p, ui.lang) : id;
                  })
                  .join(", ");
          const deg = Math.round((def.targetRotY * 180) / Math.PI);
          return (
            <div
              key={def.id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "6px 8px",
                borderRadius: 8,
                background: locked
                  ? "rgba(40,80,40,0.2)"
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${locked ? "rgba(80,160,80,0.35)" : "rgba(200,160,48,0.15)"}`,
              }}
            >
              <PieceTopPreview def={def} lang={ui.lang} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#e8d8c8" }}>
                  {pieceLabel(def, ui.lang)}{" "}
                  <span style={{ color: "#666", fontWeight: 400 }}>
                    ({def.id})
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#7a7068", marginTop: 4 }}>
                  {ui.requiresLabel} {req}
                </div>
                <div style={{ fontSize: 10, color: "#8a8078", marginTop: 2 }}>
                  {ui.targetRotLabel} ~{deg}°
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ margin: "12px 0 0", fontSize: 10, color: "#5a5048" }}>
        {ui.snapFooter}
      </div>
    </div>
  );
}

function PieceTopPreview({ def, lang }: { def: PieceDef; lang: "mn" | "en" }) {
  const { minX, maxX, minZ, maxZ } = getBoundsXZ(def);
  const w = maxX - minX;
  const d = maxZ - minZ;
  const scale = 38 / Math.max(w, d, 0.01);
  const parts = getMeshParts(def);
  return (
    <div
      title={`${pieceLabel(def, lang)} — top view`}
      style={{
        width: 44,
        height: 44,
        position: "relative",
        flexShrink: 0,
        background: "rgba(0,0,0,0.28)",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
        overflow: "hidden",
        transform: `rotate(${-(def.targetRotY * 180) / Math.PI}deg)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {parts.map((part, i) => {
        const [sx, , sz] = part.size;
        const [ox, , oz] = part.offset;
        const left = (ox - sx / 2 - minX) * scale;
        const top = (maxZ - (oz + sz / 2)) * scale;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left,
              top,
              width: sx * scale,
              height: sz * scale,
              background: `linear-gradient(135deg, ${def.color}dd, ${def.color}88)`,
            }}
          />
        );
      })}
    </div>
  );
}

function btnMini(active: boolean): React.CSSProperties {
  return {
    padding: "6px 10px",
    fontSize: 11,
    borderRadius: 8,
    border: "1px solid rgba(200,160,48,0.35)",
    background: active ? "rgba(200,160,48,0.2)" : "rgba(40,35,28,0.5)",
    color: active ? "#f0d080" : "#555",
    cursor: active ? "pointer" : "not-allowed",
  };
}
