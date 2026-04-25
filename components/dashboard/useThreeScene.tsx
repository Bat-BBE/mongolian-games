"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";
import type { MapPresencePeer } from "@/hooks/useMapPresence";
import {
  STATION_CONFIGS,
  JOURNEY_ORDER,
  stationWorldXZ,
  playerHomeWorldAnchor,
  MAP_PERF_MAX_DPR,
  MAP_PERF_SHADOW_MAP,
  MAP_SCENE,
} from "./mapConstants";
import {
  terrainBiome,
  terrainHeight,
  terrainHeightFeet,
  pushOutOfPlayerHomeOval,
} from "./sceneHelpers";
import {
  createHeroAnimator,
  countClipTracksBindingToRig,
  loadHeroClips,
  loadHeroClipsOptional,
  loadHeroModel,
  pickClip,
  retargetClipToSkeleton,
  type HeroClips,
} from "../map3d/heroFbx";

/** Зочны баатрын walk/run — local-тай нэг, cache-ийг урьдчилан дүүргэнэ */
const MAP_PRESENCE_MOVE_FBX: Parameters<typeof loadHeroClips>[0] = {
  idle: "/models/standing idle 01.fbx",
  walk: "/models/standing walk forward.fbx",
  run: "/models/standing run forward.fbx",
};

const MAP_EMOTE_CLIP_FILES: Record<string, string> = {
  // wave: "/models/waving-gesture.fbx",
  // greet: "/models/standing-greeting.fbx",
  // kiss: "/models/blowing-a-kiss.fbx",
  // dance: "/models/hip-hop-dancing.fbx",
  boxing: "/models/Boxing.fbx",
  booty: "/models/Booty Hip Hop Dance.fbx",
  praying: "/models/Praying.fbx",
  silly_dance: "/models/Silly Dancing.fbx",
};

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  mapStationsRevision?: string;
  currentStationId: string;
  doneStationIds: string[];
  homeGerLevel?: number;
  homeLivestock?: {
    sheep: number;
    goat: number;
    cow: number;
    horse: number;
    camel: number;
  };
  onSelectStation?: (stationId: string) => void;
  heroModelPath?: string | null;
  onHeroAtStationChange?: (stationId: string | null) => void;
  userEmail?: string;
  playerHomeKey?: string;
  paused?: boolean;
  presencePublishRef?: React.MutableRefObject<
    ((x: number, z: number, ry: number) => void) | null
  >;
  remotePeersRef?: React.MutableRefObject<MapPresencePeer[]>;
}

interface CameraTarget {
  lookAt: THREE.Vector3;
  distance: number;
  phi: number;
  theta: number;
}

const CAMERA_LIMITS = {
  minPhi: 0.16,
  maxPhi: 1.2,
  // Closer camera for "hero nearby" feel.
  minDist: 14,
  maxDist: 460,
};

const MAP_OVERVIEW_SHOW_ALL_LABELS_MIN_DIST = 285;

const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

const shortestAngleDelta = (from: number, to: number): number =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

function getJourneyStartStation(currentId: string): string {
  const idx = JOURNEY_ORDER.indexOf(currentId);
  return idx >= 0 ? currentId : JOURNEY_ORDER[0];
}

function resolveStationId(stationId: string): string {
  const id = typeof stationId === "string" ? stationId.trim() : "";
  if (id === "home") return "home";
  if (id && STATION_CONFIGS[id]) return id;
  return getJourneyStartStation(id);
}

function buildCameraTarget(stationId: string): CameraTarget {
  const id = resolveStationId(stationId);
  const cfg = STATION_CONFIGS[id];
  const { x: lx, z: lz } = stationWorldXZ(cfg.wx, cfg.wz);
  const ly = terrainHeight(lx, lz) + 2.6;
  const biome = terrainBiome(lx, lz, ly - 2.6);
  const slopeSample =
    Math.abs(terrainHeight(lx + 3, lz) - terrainHeight(lx - 3, lz)) +
    Math.abs(terrainHeight(lx, lz + 3) - terrainHeight(lx, lz - 3));
  const terrainSteep = Math.min(slopeSample / 8, 1);
  const baseDistance =
    biome === "high_alpine" || biome === "mountain"
      ? 58
      : biome === "gobi"
        ? 54
        : biome === "forest"
          ? 52
          : 50;
  const distance = baseDistance + terrainSteep * 10;
  const phi =
    biome === "high_alpine"
      ? 0.48
      : biome === "gobi"
        ? 0.38
        : biome === "forest"
          ? 0.44
          : 0.42;
  return {
    lookAt: new THREE.Vector3(lx, ly, lz),
    distance,
    phi,
    theta: Math.atan2(cfg.wz, cfg.wx) * 0.2 + 0.08,
  };
}

function buildHomeCameraTarget(lookAt: THREE.Vector3): CameraTarget {
  return {
    lookAt: lookAt.clone(),
    distance: 38,
    phi: 0.44,
    theta: 0.15,
  };
}

function getSunPositionForStation(stationId: string): { angle: number } {
  const id = resolveStationId(stationId);
  const idx = JOURNEY_ORDER.indexOf(id);
  const total = JOURNEY_ORDER.length - 1;
  const progress = idx >= 0 ? idx / total : 0.5;
  const angle = Math.PI - progress * Math.PI;
  return { angle };
}

export function useThreeScene({
  containerRef,
  stations,
  mapStationsRevision = "",
  currentStationId,
  doneStationIds,
  homeGerLevel = 1,
  homeLivestock,
  onSelectStation,
  heroModelPath,
  onHeroAtStationChange,
  userEmail = "",
  playerHomeKey = "",
  paused = false,
  presencePublishRef,
  remotePeersRef,
}: UseThreeSceneOptions) {
  const [labelPositions, setLabelPositions] = useState<
    Record<string, LabelPos>
  >({});
  const [heroAtStationId, setHeroAtStationId] = useState<string | null>(null);
  const [labelUi, setLabelUi] = useState<{
    stationId: string | null;
    alpha: number;
  }>({ stationId: null, alpha: 0 });
  const orbitCameraDistRef = useRef(120);
  const homeGerLevelMapRef = useRef(homeGerLevel);
  homeGerLevelMapRef.current = homeGerLevel;
  const showAllMapLabelsRef = useRef(false);
  const [labelZoomScale, setLabelZoomScale] = useState(1);
  const [showAllMapLabels, setShowAllMapLabels] = useState(false);
  const [mapHeroEmoteIds, setMapHeroEmoteIds] = useState<string[]>([]);
  const playMapHeroEmoteRef = useRef<((id: string) => void) | null>(null);
  const mapVirtualStickRef = useRef({ x: 0, z: 0, run: false });
  const labelUiThrottleRef = useRef<{
    stationId: string | null;
    alpha: number;
  }>({ stationId: null, alpha: -1 });

  const onSelectRef = useRef<UseThreeSceneOptions["onSelectStation"]>(null);
  const builderRef = useRef<SceneBuilder | null>(null);
  useEffect(() => {
    onSelectRef.current = onSelectStation ?? null;
  }, [onSelectStation]);
  const heroAtStationIdRef = useRef<string | null>(null);

  const flyToStationRef = useRef<((id: string, snap?: boolean) => void) | null>(
    null,
  );
  const goToHomeGerRef = useRef<(() => void) | null>(null);
  const travelToStationRef = useRef<((stationId: string) => void) | null>(null);
  const currentIdRef = useRef(resolveStationId(currentStationId));
  const animRef = useRef<
    import("./AnimationController").AnimationController | null
  >(null);

  useEffect(() => {
    animRef.current?.setPaused(!!paused);
  }, [paused]);

  useEffect(() => {
    const hub = !currentStationId?.trim() || currentStationId.trim() === "home";
    const resolved = hub ? "ulaanbaatar" : resolveStationId(currentStationId);
    currentIdRef.current = resolved;
    flyToStationRef.current?.(currentStationId, false);
    animRef.current?.updateCurrentStation(
      hub ? "" : resolveStationId(currentStationId),
    );
  }, [currentStationId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const homeKey =
      (playerHomeKey && playerHomeKey.trim()) || userEmail || "guest";
    const { x: playerHomeX, z: playerHomeZ } = playerHomeWorldAnchor(homeKey);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(MAP_SCENE.background);
    scene.fog = new THREE.FogExp2(MAP_SCENE.fog, MAP_SCENE.fogDensity);

    const W = container.clientWidth,
      H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, W / H, 1.2, 14000);

    const hub = !currentStationId?.trim() || currentStationId.trim() === "home";
    const highlightStationId = hub ? "" : resolveStationId(currentStationId);
    const sunStationId = hub
      ? "ulaanbaatar"
      : resolveStationId(currentStationId);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = MAP_SCENE.toneMappingExposure;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAP_PERF_MAX_DPR),
    );
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const prePresenceMove = () => {
      void loadHeroClips(MAP_PRESENCE_MOVE_FBX).catch(() => undefined);
    };
    {
      const ric = globalThis.requestIdleCallback;
      if (typeof ric === "function") {
        ric(() => prePresenceMove(), { timeout: 2_000 });
      } else {
        setTimeout(prePresenceMove, 0);
      }
    }

    const applyViewportSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAP_PERF_MAX_DPR),
      );
    };
    const resizeObserver = new ResizeObserver(() => applyViewportSize());
    resizeObserver.observe(container);

    const { angle: sunInitAngle } = getSunPositionForStation(sunStationId);

    const SUN_RADIUS = 280;
    const SUN_HEIGHT_FACTOR = 0.7;

    const sun = new THREE.DirectionalLight(MAP_SCENE.sun, MAP_SCENE.sunInt);
    sun.position.set(
      Math.cos(sunInitAngle) * SUN_RADIUS,
      Math.abs(Math.sin(sunInitAngle)) * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20,
      -60,
    );
    sun.castShadow = true;
    sun.shadow.mapSize.set(MAP_PERF_SHADOW_MAP, MAP_PERF_SHADOW_MAP);
    sun.shadow.radius = 2.8;
    sun.shadow.bias = -0.00028;
    sun.shadow.normalBias = 0.025;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 9000;
    sun.shadow.camera.left = -3200;
    sun.shadow.camera.right = 3200;
    sun.shadow.camera.top = 3200;
    sun.shadow.camera.bottom = -3200;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(MAP_SCENE.ambient, MAP_SCENE.ambientInt));

    const fill = new THREE.DirectionalLight(MAP_SCENE.fill, MAP_SCENE.fillInt);
    fill.position.set(-60, 40, -30);
    scene.add(fill);

    const backlight = new THREE.DirectionalLight(MAP_SCENE.back, MAP_SCENE.backInt);
    backlight.position.set(15, 10, 100);
    scene.add(backlight);

    scene.add(
      new THREE.HemisphereLight(
        MAP_SCENE.hemiSky,
        MAP_SCENE.hemiGround,
        MAP_SCENE.hemiInt,
      ),
    );

    const builder = new SceneBuilder(
      scene,
      highlightStationId,
      doneStationIds,
      {
        x: playerHomeX,
        z: playerHomeZ,
      },
    );
    builderRef.current = builder;

    builder.buildSky();
    builder.buildTerrain();
    builder.buildRivers();
    builder.buildRiverReeds();
    builder.buildBridge();
    builder.buildTrees();
    builder.buildMountains();
    builder.buildGrassTufts();
    builder.buildRocks();
    builder.buildRoads(stations);
    builder.buildStationGers(stations);
    builder.buildGerCamps();
    builder.buildNomadDetails();
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();
    builder.buildPlayerHomeGer(homeGerLevel);
    builder.buildPlayerLivestockNearHome(homeLivestock);

    const remotePeerGroup = new THREE.Group();
    remotePeerGroup.name = "remote_peers";
    scene.add(remotePeerGroup);
    const remoteAvatarById = new Map<string, THREE.Group>();
    const remoteCampById = new Map<string, THREE.Object3D>();
    const remoteEnclosureById = new Map<string, THREE.Mesh>();
    const remoteHeroMixers = new Set<THREE.AnimationMixer>();
    const hashPeerId = (id: string): number => {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
      return h;
    };

    function disposeMeshSubtree(obj: THREE.Object3D): void {
      obj.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry?.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }

    function clearRemoteHeroSlot(slot: THREE.Group): void {
      const mx = slot.userData.remoteHeroMixer as
        | THREE.AnimationMixer
        | undefined;
      if (mx) {
        remoteHeroMixers.delete(mx);
        mx.stopAllAction();
      }
      slot.userData.remoteHeroMixer = undefined;
      (slot.userData as { remoteHeroPlay?: unknown }).remoteHeroPlay =
        undefined;
      (slot.userData as { remoteHeroAnimActions?: unknown })
        .remoteHeroAnimActions = undefined;
      while (slot.children.length > 0) {
        const c = slot.children[0]!;
        slot.remove(c);
        disposeMeshSubtree(c);
      }
    }

    function disposeRemoteAvatar(g: THREE.Group): void {
      const slot = g.getObjectByName("remote_hero_slot") as
        | THREE.Group
        | undefined;
      if (slot) clearRemoteHeroSlot(slot);
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry?.dispose();
          const mat = o.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }

    type RemotePosSmooth = { x: number; z: number; ry: number };
    const REMOTE_PEER_POS_RATE = 12;
    const REMOTE_PEER_ANG_RATE = 15;
    /** p→sm дагуул: зай = алхалтын дохио (гөлрүүсэн d(sm)/dt нь бага) */
    const REMOTE_ANIM_GAP_TO_SPEED = REMOTE_PEER_POS_RATE + 6;
    /** Алхалтын хурд дээр идэвхтэн анимацийг гөлрүүлэх (flicker багасгана) */
    const REMOTE_ANIM_EMA = 0.2;

    function buildRemotePlayerAvatar(id: string): THREE.Group {
      const hue = (hashPeerId(id) % 360) / 360;
      const col = new THREE.Color().setHSL(hue, 0.55, 0.5);
      const g = new THREE.Group();
      g.name = `remote_peer_${id.slice(0, 8)}`;
      const fallback = new THREE.Group();
      fallback.name = "remote_fallback";
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 12, 10),
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.62,
          roughness: 0.35,
          metalness: 0.1,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      beacon.position.y = 7;
      beacon.castShadow = false;
      fallback.add(beacon);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.2, 8, 22),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.35;
      fallback.add(ring);
      g.add(fallback);
      const heroSlot = new THREE.Group();
      heroSlot.name = "remote_hero_slot";
      g.add(heroSlot);
      return g;
    }

    function normalizeRemoteHeroPath(raw: string | undefined | null): string {
      const d = raw?.trim() ? raw.trim() : "/models/hero-22.fbx";
      return d.endsWith(".fbx.fbx") ? d.slice(0, -4) : d;
    }

    let homeLookAt = new THREE.Vector3(
      playerHomeX,
      terrainHeight(playerHomeX, playerHomeZ) + 2.5,
      playerHomeZ,
    );
    const doorHome = builder.doorAnchors.get("home");
    if (doorHome) {
      const hx = doorHome.x;
      const hz = doorHome.z;
      homeLookAt.set(hx, terrainHeight(hx, hz) + 2.7, hz + 2.9);
    }
    const initTarget = buildHomeCameraTarget(homeLookAt);
    camera.position.set(
      initTarget.lookAt.x +
        Math.sin(initTarget.theta) *
          Math.cos(initTarget.phi) *
          initTarget.distance,
      initTarget.lookAt.y + Math.sin(initTarget.phi) * initTarget.distance,
      initTarget.lookAt.z +
        Math.cos(initTarget.theta) *
          Math.cos(initTarget.phi) *
          initTarget.distance,
    );
    camera.lookAt(initTarget.lookAt);

    const heroMixerRef = { current: null as THREE.AnimationMixer | null };
    const heroRootRef = { current: null as THREE.Object3D | null };
    const heroPlayRef = {
      current: null as ((name: string, fadeSec?: number) => void) | null,
    };
    const heroEmotePlayingRef = { current: false };
    const heroManualVelRef = { current: new THREE.Vector3(0, 0, 0) };
    const heroKinematicRef = {
      current: {
        pos: new THREE.Vector3(),
        ry: 0,
        has: false,
      },
    };
    const manualKeysRef = {
      current: {
        up: false,
        down: false,
        left: false,
        right: false,
        run: false,
      },
    };
    /** Shift-гүй/Shift — нэг кадрт 0/1: камер+хурд "цачигдана" → 0…1-ээр зөөлрүүлнэ */
    const runIntentSmoothedRef = { current: 0 };
    const lastLocomotionAnimRef = { current: "" as string };
    /** `terrainHeightFeet`+зөөлрүүлэлт: телепорт/эхлэлт дээр null болгоно */
    const heroGroundYRef = { current: null as number | null };
    let disposed = false;

    if (heroModelPath && heroModelPath.trim()) {
      const run = () => {
        void (async () => {
          try {
            const rawPath = heroModelPath.trim();
            const safePath = rawPath.endsWith(".fbx.fbx")
              ? rawPath.slice(0, -4)
              : rawPath;
            const { root, clips: embeddedClips } =
              await loadHeroModel(safePath);
            if (disposed) return;
            root.scale.setScalar(0.015);
            root.traverse((c) => {
              if (c instanceof THREE.Mesh) {
                c.castShadow = true;
                c.receiveShadow = true;
              }
            });
            const ext = await loadHeroClips({
              idle: "/models/standing idle 01.fbx",
              walk: "/models/standing walk forward.fbx",
              run: "/models/standing run forward.fbx",
            });
            if (disposed) return;
            const MIN_MOVE_BONES = 8;
            const MIN_EMBEDDED_IDLE_BONES = 3;

            const retargeted: HeroClips = {};
            for (const [name, clip] of Object.entries(ext)) {
              if (name === "idle") continue;
              const r = retargetClipToSkeleton(clip, root);
              if (countClipTracksBindingToRig(r, root) >= MIN_MOVE_BONES) {
                retargeted[name] = r;
              }
            }

            const embeddedIdle = pickClip(embeddedClips, [
              "idle",
              "stand",
              "breathing",
              "rest",
            ]);
            let idleClip: THREE.AnimationClip | undefined;
            if (embeddedIdle) {
              const r = retargetClipToSkeleton(embeddedIdle, root);
              if (
                countClipTracksBindingToRig(r, root) >= MIN_EMBEDDED_IDLE_BONES
              ) {
                idleClip = r;
              }
            }
            if (!idleClip && ext.idle) {
              const r = retargetClipToSkeleton(ext.idle, root);
              if (countClipTracksBindingToRig(r, root) >= MIN_MOVE_BONES) {
                idleClip = r;
              }
            }
            if (idleClip) retargeted.idle = idleClip;

            const optClips = await loadHeroClipsOptional(MAP_EMOTE_CLIP_FILES);
            if (disposed) return;
            const MIN_EMOTE_BONES = 5;
            for (const [name, clip] of Object.entries(optClips)) {
              const r = retargetClipToSkeleton(clip, root);
              if (countClipTracksBindingToRig(r, root) >= MIN_EMOTE_BONES) {
                retargeted[name] = r;
              }
            }

            const emoteIds = (
              [
                "wave",
                "greet",
                "kiss",
                "dance",
                "boxing",
                "booty",
                "hip_hop",
                "praying",
                "silly_dance",
              ] as const
            ).filter((k) => Boolean(retargeted[k]));

            const { mixer, play } = createHeroAnimator(root, retargeted, {
              loopNames: ["idle", "walk", "run"],
              onFiniteEnd: () => {
                heroEmotePlayingRef.current = false;
              },
            });
            heroMixerRef.current = mixer;
            heroRootRef.current = root;
            heroPlayRef.current = play;

            const loadedEmoteSet = new Set<string>(emoteIds);
            playMapHeroEmoteRef.current = (id: string) => {
              if (disposed || !heroPlayRef.current) return;
              if (id === "idle") {
                heroEmotePlayingRef.current = false;
                heroPlayRef.current("idle", 0.15);
                return;
              }
              if (!loadedEmoteSet.has(id)) return;
              heroEmotePlayingRef.current = true;
              heroPlayRef.current(id, 0.22);
            };
            setMapHeroEmoteIds([...emoteIds]);
            const dh = builder.doorAnchors.get("home");
            let sx = playerHomeX;
            let sz = playerHomeZ + 4;
            if (dh) {
              sx = dh.x;
              sz = dh.z + 3.4;
            }
            const sy = terrainHeightFeet(sx, sz, 0) + 0.02;
            root.position.set(sx, sy, sz);
            root.rotation.y = 0;
            heroGroundYRef.current = sy;
            play("idle", 0);
            scene.add(root);
          } catch {
            console.warn("Hero model failed to load for map:", heroModelPath);
            setMapHeroEmoteIds([]);
            playMapHeroEmoteRef.current = null;
          }
        })();
      };
      const ric = (globalThis as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout?: number }) => void)
        | undefined;
      if (typeof ric === "function") {
        ric(run, { timeout: 1500 });
      } else {
        setTimeout(run, 0);
      }
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let downAt = 0;

    const getStationId = (obj: THREE.Object3D | null): string | null => {
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const sid = (cur.userData as { stationId?: unknown } | undefined)
          ?.stationId;
        if (typeof sid === "string" && sid.trim()) return sid;
        cur = cur.parent;
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downAt = performance.now();
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - downAt;
      if (dist > 6 || dt > 900) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(mouse, camera);

      const cb = onSelectRef.current;
      if (!cb) return;
      const targets = Array.from(builder.markerMeshes.values());
      const hits = raycaster.intersectObjects(targets, true);
      if (!hits.length) return;
      const sid = getStationId(hits[0].object);
      if (sid && sid === heroAtStationIdRef.current) cb(sid);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const st = manualKeysRef.current;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        st.run = true;
      }
      if (
        e.code === "KeyW" ||
        e.key === "w" ||
        e.key === "W" ||
        e.key === "ArrowUp"
      )
        st.up = true;
      if (
        e.code === "KeyS" ||
        e.key === "s" ||
        e.key === "S" ||
        e.key === "ArrowDown"
      )
        st.down = true;
      if (
        e.code === "KeyA" ||
        e.key === "a" ||
        e.key === "A" ||
        e.key === "ArrowLeft"
      )
        st.left = true;
      if (
        e.code === "KeyD" ||
        e.key === "d" ||
        e.key === "D" ||
        e.key === "ArrowRight"
      )
        st.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const st = manualKeysRef.current;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        st.run = false;
      }
      if (
        e.code === "KeyW" ||
        e.key === "w" ||
        e.key === "W" ||
        e.key === "ArrowUp"
      )
        st.up = false;
      if (
        e.code === "KeyS" ||
        e.key === "s" ||
        e.key === "S" ||
        e.key === "ArrowDown"
      )
        st.down = false;
      if (
        e.code === "KeyA" ||
        e.key === "a" ||
        e.key === "A" ||
        e.key === "ArrowLeft"
      )
        st.left = false;
      if (
        e.code === "KeyD" ||
        e.key === "d" ||
        e.key === "D" ||
        e.key === "ArrowRight"
      )
        st.right = false;
    };

    const cameraState = {
      currentLook: initTarget.lookAt.clone(),
      currentDist: initTarget.distance,
      currentPhi: initTarget.phi,
      currentTheta: initTarget.theta,
      targetLook: initTarget.lookAt.clone(),
      targetDist: initTarget.distance,
      targetPhi: initTarget.phi,
      targetTheta: initTarget.theta,
      thetaVel: 0,
      phiVel: 0,
      distVel: 0,
      isDragging: false,
      userInteracted: false,
      introActive: false,
      introT: 0,
      introDur: 0,
      lastX: 0,
      lastY: 0,
    };

    // When the player manually drives the hero, keep camera centered on hero for a bit.
    const followHeroUntilRef = { current: 0 };
    /** Камерын lookAt: XZ баатарт наалдана, Y-г газраас тооцоод зөөлөн дагана (гүйхэд цочирдол багасна). */
    const heroCamPivotSmoothedRef = { current: null as THREE.Vector3 | null };
    /** Газрын өндрийн лимитийг зөөлөн дагаж, эргүүлэхэд камер гэнэт үсрэхгүй. */
    const cameraFloorSmoothedRef = { current: null as number | null };

    const cancelIntro = () => {
      cameraState.userInteracted = true;
      if (cameraState.introActive) {
        cameraState.introActive = false;
        cameraState.introT = cameraState.introDur;
      }
    };

    function flyToStation(id: string, snap = false) {
      const t =
        id === "home"
          ? buildHomeCameraTarget(homeLookAt)
          : buildCameraTarget(id);
      cameraState.targetLook.copy(t.lookAt);
      cameraState.targetDist = t.distance;
      cameraState.targetPhi = t.phi;
      if (snap) {
        cameraState.targetTheta = t.theta;
        cameraState.currentLook.copy(t.lookAt);
        cameraState.currentDist = t.distance;
        cameraState.currentPhi = t.phi;
        cameraState.currentTheta = t.theta;
        cameraState.thetaVel = 0;
        cameraState.phiVel = 0;
        cameraState.distVel = 0;
        cameraFloorSmoothedRef.current = null;
        heroCamPivotSmoothedRef.current = null;
        cancelIntro();
      } else if (!cameraState.userInteracted) {
        cameraState.targetTheta = t.theta;
      }
    }
    flyToStationRef.current = flyToStation;

    function goToHomeGer() {
      flyToStation("home", true);
      followHeroUntilRef.current = performance.now() + 200;
      heroManualVelRef.current.set(0, 0, 0);
      manualKeysRef.current.up =
        manualKeysRef.current.down =
        manualKeysRef.current.left =
        manualKeysRef.current.right =
          false;
      manualKeysRef.current.run = false;
      mapVirtualStickRef.current.x = 0;
      mapVirtualStickRef.current.z = 0;
      mapVirtualStickRef.current.run = false;
      const root = heroRootRef.current;
      if (root) {
        const dh = builder.doorAnchors.get("home");
        let sx = playerHomeX;
        let sz = playerHomeZ + 4;
        if (dh) {
          sx = dh.x;
          sz = dh.z + 3.4;
        }
        const rhy = Math.atan2(playerHomeX - sx, playerHomeZ - sz);
        const sy = terrainHeightFeet(sx, sz, rhy) + 0.02;
        root.position.set(sx, sy, sz);
        root.rotation.y = rhy;
        heroGroundYRef.current = sy;
        heroEmotePlayingRef.current = false;
        heroPlayRef.current?.("idle", 0.12);
        heroKinematicRef.current.pos.copy(root.position);
        heroKinematicRef.current.ry = root.rotation.y;
        heroKinematicRef.current.has = true;
      }
    }
    goToHomeGerRef.current = goToHomeGer;

    function travelHeroToStation(stationId: string) {
      const raw = typeof stationId === "string" ? stationId.trim() : "";
      if (!raw || raw === "home") {
        goToHomeGer();
        return;
      }
      const sid = resolveStationId(raw);
      flyToStation(sid, false);
      followHeroUntilRef.current = performance.now() + 500;
      heroManualVelRef.current.set(0, 0, 0);
      manualKeysRef.current.up =
        manualKeysRef.current.down =
        manualKeysRef.current.left =
        manualKeysRef.current.right =
          false;
      manualKeysRef.current.run = false;
      mapVirtualStickRef.current.x = 0;
      mapVirtualStickRef.current.z = 0;
      mapVirtualStickRef.current.run = false;
      const root = heroRootRef.current;
      if (!root) return;
      const door = builder.doorAnchors.get(sid);
      if (!door) return;
      const sx = door.x;
      const sz = door.z + 3.4;
      const camT = buildCameraTarget(sid);
      const dx = camT.lookAt.x - sx;
      const dz = camT.lookAt.z - sz;
      const rhy = Math.atan2(dx, dz);
      const sy = terrainHeightFeet(sx, sz, rhy) + 0.02;
      root.position.set(sx, sy, sz);
      root.rotation.y = rhy;
      heroGroundYRef.current = sy;
      heroEmotePlayingRef.current = false;
      heroPlayRef.current?.("idle", 0.12);
      heroKinematicRef.current.pos.copy(root.position);
      heroKinematicRef.current.ry = root.rotation.y;
      heroKinematicRef.current.has = true;
    }
    travelToStationRef.current = travelHeroToStation;

    const onMouseDown = (e: MouseEvent) => {
      cancelIntro();
      cameraState.isDragging = true;
      cameraState.lastX = e.clientX;
      cameraState.lastY = e.clientY;
    };
    const onMouseUp = () => {
      cameraState.isDragging = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!cameraState.isDragging) return;
      const dx = e.clientX - cameraState.lastX;
      const dy = e.clientY - cameraState.lastY;
      const rotSpeed = 0.0043;
      cameraState.targetTheta -= dx * rotSpeed;
      cameraState.targetPhi = clamp(
        cameraState.targetPhi - dy * rotSpeed,
        CAMERA_LIMITS.minPhi,
        CAMERA_LIMITS.maxPhi,
      );
      cameraState.thetaVel = -dx * rotSpeed * 0.25;
      cameraState.phiVel = -dy * rotSpeed * 0.2;
      cameraState.lastX = e.clientX;
      cameraState.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      cancelIntro();
      cameraState.targetDist = clamp(
        cameraState.targetDist + e.deltaY * 0.12,
        CAMERA_LIMITS.minDist,
        CAMERA_LIMITS.maxDist,
      );
      cameraState.distVel += e.deltaY * 0.0009;
      e.preventDefault();
    };

    let lastTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      cancelIntro();
      if (e.touches.length === 1) {
        cameraState.isDragging = true;
        cameraState.lastX = e.touches[0].clientX;
        cameraState.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && cameraState.isDragging) {
        const dx = e.touches[0].clientX - cameraState.lastX;
        const dy = e.touches[0].clientY - cameraState.lastY;
        const rotSpeed = 0.0046;
        cameraState.targetTheta -= dx * rotSpeed;
        cameraState.targetPhi = clamp(
          cameraState.targetPhi - dy * rotSpeed,
          CAMERA_LIMITS.minPhi,
          CAMERA_LIMITS.maxPhi,
        );
        cameraState.thetaVel = -dx * rotSpeed * 0.22;
        cameraState.phiVel = -dy * rotSpeed * 0.2;
        cameraState.lastX = e.touches[0].clientX;
        cameraState.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const d = Math.sqrt(dx * dx + dy * dy);
        cameraState.targetDist = clamp(
          cameraState.targetDist - (d - lastTouchDist) * 0.27,
          CAMERA_LIMITS.minDist,
          CAMERA_LIMITS.maxDist,
        );
        cameraState.distVel += -(d - lastTouchDist) * 0.001;
        lastTouchDist = d;
      }
    };
    const onDoubleClick = () => {
      const t = buildCameraTarget(currentIdRef.current);
      cameraState.targetLook.copy(t.lookAt);
      cameraState.targetDist = t.distance;
      cameraState.targetPhi = t.phi;
      cameraState.targetTheta = t.theta;
      cameraState.thetaVel = 0;
      cameraState.phiVel = 0;
      cameraState.distVel = 0;
      cancelIntro();
    };
    const onTouchEnd = () => {
      cameraState.isDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchmove", onTouchMove, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("dblclick", onDoubleClick);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    const onWindowBlur = () => {
      const st = manualKeysRef.current;
      st.up = st.down = st.left = st.right = false;
      st.run = false;
      mapVirtualStickRef.current.x = 0;
      mapVirtualStickRef.current.z = 0;
      mapVirtualStickRef.current.run = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

    const anim = new AnimationController({
      renderer,
      scene,
      camera,
      container,
      sun,
      horses: builder.horses,
      clouds: builder.clouds,
      birds: builder.birds,
      markerMeshes: builder.markerMeshes,
      labelAnchors: builder.labelAnchors,
      doorAnchors: builder.doorAnchors,
      heroMixerRef,
      heroRootRef,
      heroKinematicRef,
      currentStationId: highlightStationId,
      onLabelUpdate: (ui) => {
        setLabelPositions(ui);
        const d = orbitCameraDistRef.current;
        const t =
          (d - CAMERA_LIMITS.minDist) /
          (CAMERA_LIMITS.maxDist - CAMERA_LIMITS.minDist || 1);
        const s = Math.max(
          0.46,
          Math.min(1.08, 1.05 - Math.max(0, Math.min(1, t)) * 0.58),
        );
        setLabelZoomScale(s);
        const showAll = d > MAP_OVERVIEW_SHOW_ALL_LABELS_MIN_DIST;
        if (showAllMapLabelsRef.current !== showAll) {
          showAllMapLabelsRef.current = showAll;
          setShowAllMapLabels(showAll);
        }
      },
      onBeforeRender: (elapsed: number, delta: number) => {
        const dt = Math.min(delta, 0.06);
        for (const mx of remoteHeroMixers) mx.update(dt);
        const stKeys = manualKeysRef.current;
        const stick = mapVirtualStickRef.current;
        const mvxKeys = (stKeys.right ? 1 : 0) - (stKeys.left ? 1 : 0);
        const mvzKeys = (stKeys.up ? 1 : 0) - (stKeys.down ? 1 : 0);
        let mvx = mvxKeys + stick.x;
        let mvz = mvzKeys + stick.z;
        let klenInput = Math.hypot(mvx, mvz);
        if (klenInput > 1) {
          mvx /= klenInput;
          mvz /= klenInput;
          klenInput = 1;
        }
        const wantsRun = stKeys.run || stick.run;
        {
          const runTgt = wantsRun && klenInput > 0.01 ? 1 : 0;
          const s = runIntentSmoothedRef.current;
          runIntentSmoothedRef.current = s + (runTgt - s) * (1 - Math.exp(-12 * dt));
        }
        const runS = runIntentSmoothedRef.current;
        const runAnimMode = klenInput > 0.01 && runS > 0.5;

        const rootMove = heroRootRef.current;
        const playMove = heroPlayRef.current;
        if (rootMove && playMove) {
          const hv = heroManualVelRef.current;
          if (klenInput <= 0.01) {
            runIntentSmoothedRef.current *= 1 - Math.min(1, 18 * dt);
            if (runIntentSmoothedRef.current < 0.02) runIntentSmoothedRef.current = 0;
            hv.multiplyScalar(Math.exp(-20 * delta));
            if (hv.lengthSq() < 0.2) hv.set(0, 0, 0);
          }
          if (klenInput > 0.01) {
            const baseSpeed = 12 + runS * 10;
            const localDir = new THREE.Vector3(mvx, 0, mvz);
            const camForward = new THREE.Vector3();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            if (camForward.lengthSq() < 1e-8) camForward.set(0, 0, 1);
            camForward.normalize();
            const camRight = new THREE.Vector3()
              .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
              .normalize();
            const worldDir = new THREE.Vector3()
              .addScaledVector(camRight, localDir.x)
              .addScaledVector(camForward, localDir.z)
              .normalize();

            const desiredVel = worldDir.clone().multiplyScalar(baseSpeed);
            const velRate = 16 + runS * 6;
            const velBlend = 1 - Math.exp(-velRate * delta);
            hv.lerp(desiredVel, velBlend);
            rootMove.position.addScaledVector(hv, delta);
            rootMove.position.x = clamp(rootMove.position.x, -5600, 5600);
            rootMove.position.z = clamp(rootMove.position.z, -4700, 4700);
            {
              const pushed = pushOutOfPlayerHomeOval(
                rootMove.position.x,
                rootMove.position.z,
                playerHomeX,
                playerHomeZ,
                homeGerLevelMapRef.current,
              );
              if (pushed.pushed) {
                rootMove.position.x = pushed.x;
                rootMove.position.z = pushed.z;
                hv.multiplyScalar(0.68);
              }
            }
            {
              const rawG = terrainHeightFeet(
                rootMove.position.x,
                rootMove.position.z,
                rootMove.rotation.y,
              );
              const targetY = rawG + 0.02;
              const prev = heroGroundYRef.current;
              const gy =
                prev == null
                  ? targetY
                  : prev + (targetY - prev) * (1 - Math.exp(-26 * dt));
              heroGroundYRef.current = gy;
              rootMove.position.y = gy;
            }

            const targetYaw = Math.atan2(worldDir.x, worldDir.z);
            let dy = targetYaw - rootMove.rotation.y;
            while (dy > Math.PI) dy -= Math.PI * 2;
            while (dy < -Math.PI) dy += Math.PI * 2;
            rootMove.rotation.y += dy * (1 - Math.exp(-14 * delta));

            if (!heroEmotePlayingRef.current) {
              const wantLoco: "run" | "walk" = runAnimMode ? "run" : "walk";
              if (wantLoco !== lastLocomotionAnimRef.current) {
                playMove(wantLoco, 0.12);
                lastLocomotionAnimRef.current = wantLoco;
              }
            }
          } else {
            if (!heroEmotePlayingRef.current) {
              if (lastLocomotionAnimRef.current !== "idle") {
                playMove("idle", 0.18);
                lastLocomotionAnimRef.current = "idle";
              }
            }
          }

          heroKinematicRef.current.pos.copy(rootMove.position);
          heroKinematicRef.current.ry = rootMove.rotation.y;
          heroKinematicRef.current.has = true;
        } else {
          heroKinematicRef.current.has = false;
        }

        const runSForCam = runIntentSmoothedRef.current;

        let followSmooth = cameraState.isDragging ? 18 : 9;
        const rootCam = heroRootRef.current;
        if (rootCam && heroPlayRef.current) {
          const followingHeroWindow =
            followHeroUntilRef.current > performance.now();
          if (klenInput > 0.01) {
            followHeroUntilRef.current = performance.now() + 120;
          }
          if (klenInput > 0.01 || followingHeroWindow) {
            const tx = rootCam.position.x;
            const tz = rootCam.position.z;
            const eyeY = terrainHeight(tx, tz) + 2.35;
            let p = heroCamPivotSmoothedRef.current;
            if (!p) {
              p = new THREE.Vector3(tx, eyeY, tz);
              heroCamPivotSmoothedRef.current = p;
            } else {
              const pivotRate = klenInput > 0.01 ? 50 + runSForCam * 10 : 40;
              const a = 1 - Math.exp(-pivotRate * dt);
              p.x += (tx - p.x) * a;
              p.y += (eyeY - p.y) * a;
              p.z += (tz - p.z) * a;
            }
            cameraState.targetLook.copy(p);

            if (klenInput > 0.01) {
              cameraState.currentLook.copy(p);
            }
            followSmooth = cameraState.isDragging ? 24 : 45 + runSForCam * 10;
          }
        }
        const smoothPos = 1 - Math.exp(-followSmooth * dt);
        const smoothRot =
          1 - Math.exp(-(cameraState.isDragging ? 22 : 11) * dt);

        cameraState.targetTheta += cameraState.thetaVel;
        while (cameraState.targetTheta > Math.PI)
          cameraState.targetTheta -= Math.PI * 2;
        while (cameraState.targetTheta < -Math.PI)
          cameraState.targetTheta += Math.PI * 2;

        cameraState.targetPhi = clamp(
          cameraState.targetPhi + cameraState.phiVel,
          CAMERA_LIMITS.minPhi,
          CAMERA_LIMITS.maxPhi,
        );
        cameraState.targetDist = clamp(
          cameraState.targetDist + cameraState.distVel,
          CAMERA_LIMITS.minDist,
          CAMERA_LIMITS.maxDist,
        );

        cameraState.thetaVel *= 0.86;
        cameraState.phiVel *= 0.84;
        cameraState.distVel *= 0.82;

        cameraState.currentLook.lerp(cameraState.targetLook, smoothPos);
        cameraState.currentDist +=
          (cameraState.targetDist - cameraState.currentDist) * smoothPos;
        cameraState.currentPhi +=
          (cameraState.targetPhi - cameraState.currentPhi) * smoothRot;
        cameraState.currentTheta +=
          shortestAngleDelta(
            cameraState.currentTheta,
            cameraState.targetTheta,
          ) * smoothRot;
        cameraState.currentPhi = clamp(
          cameraState.currentPhi,
          CAMERA_LIMITS.minPhi,
          CAMERA_LIMITS.maxPhi,
        );

        if (cameraState.introActive) {
          cameraState.introT += delta;
          if (cameraState.introT >= cameraState.introDur) {
            cameraState.introT = cameraState.introDur;
            cameraState.introActive = false;
          }
        }

        const { angle } = getSunPositionForStation(currentIdRef.current);
        const sunAnim = angle + Math.sin(elapsed * 0.22) * 0.04;
        const dayFrac = Math.abs(Math.sin(sunAnim));
        sun.position.set(
          Math.cos(sunAnim) * SUN_RADIUS,
          Math.max(8, dayFrac * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20),
          -60,
        );
        sun.intensity = 0.85 + dayFrac * 1.35;

        const fogR = 0.58 + dayFrac * 0.1;
        const fogG = 0.7 + dayFrac * 0.1;
        const fogB = 0.84 + dayFrac * 0.08;
        const fog = scene.fog as THREE.FogExp2;
        fog.color.setRGB(fogR, fogG, fogB);
        fog.density = 0.00105 + (1 - dayFrac) * 0.00012;
        renderer.toneMappingExposure = 0.86 + dayFrac * 0.24;

        const finalCamPos = new THREE.Vector3(
          cameraState.currentLook.x +
            Math.sin(cameraState.currentTheta) *
              Math.cos(cameraState.currentPhi) *
              cameraState.currentDist,
          cameraState.currentLook.y +
            Math.sin(cameraState.currentPhi) * cameraState.currentDist,
          cameraState.currentLook.z +
            Math.cos(cameraState.currentTheta) *
              Math.cos(cameraState.currentPhi) *
              cameraState.currentDist,
        );
        // Keep camera above terrain — зөөлөн дагах (хурц уул/газар дээр гэнэт өсөхгүй).
        const floorRaw = terrainHeight(finalCamPos.x, finalCamPos.z) + 2.55;
        const prevF = cameraFloorSmoothedRef.current;
        const floorBlend = klenInput > 0.01 ? 6.5 : 9;
        const floorY =
          prevF == null
            ? floorRaw
            : prevF + (floorRaw - prevF) * (1 - Math.exp(-floorBlend * dt));
        cameraFloorSmoothedRef.current = floorY;
        if (finalCamPos.y < floorY) finalCamPos.y = floorY;
        if (cameraState.introActive) {
          const t = Math.min(1, cameraState.introT / cameraState.introDur);
          const e = 1 - Math.pow(1 - t, 3);
          const introPos = new THREE.Vector3(
            finalCamPos.x - 38,
            finalCamPos.y + 64,
            finalCamPos.z + 46,
          );
          camera.position.lerpVectors(introPos, finalCamPos, e);
          const introLook = new THREE.Vector3(
            cameraState.currentLook.x - 10,
            cameraState.currentLook.y + 6,
            cameraState.currentLook.z + 8,
          );
          const look = new THREE.Vector3().lerpVectors(
            introLook,
            cameraState.currentLook,
            e,
          );
          camera.lookAt(look);
        } else {
          camera.position.copy(finalCamPos);
          camera.lookAt(cameraState.currentLook);
        }
        camera.updateMatrixWorld();
        orbitCameraDistRef.current = cameraState.currentDist;

        if (remotePeersRef) {
          const list = remotePeersRef.current;
          const seen = new Set<string>();
          for (const p of list) {
            seen.add(p.id);
            let av = remoteAvatarById.get(p.id);
            if (!av) {
              av = buildRemotePlayerAvatar(p.id);
              remoteAvatarById.set(p.id, av);
              remotePeerGroup.add(av);
            }
            const wantPath = normalizeRemoteHeroPath(p.heroModelPath);
            const ud = av.userData as {
              remoteHeroPath?: string;
              remoteLoadGen?: number;
              remotePosSmooth?: RemotePosSmooth;
              remoteAnimPrevX?: number;
              remoteAnimPrevZ?: number;
              remoteAnimSpeedEma?: number;
            };
            const slot = av.getObjectByName("remote_hero_slot") as THREE.Group;
            const fallback = av.getObjectByName(
              "remote_fallback",
            ) as THREE.Group;
            if (ud.remoteHeroPath !== wantPath) {
              ud.remoteHeroPath = wantPath;
              ud.remoteLoadGen = (ud.remoteLoadGen ?? 0) + 1;
              ud.remoteAnimPrevX = undefined;
              ud.remoteAnimPrevZ = undefined;
              ud.remoteAnimSpeedEma = undefined;
              const gen = ud.remoteLoadGen;
              clearRemoteHeroSlot(slot);
              fallback.visible = true;
              void (async () => {
                try {
                  const { root, clips: embeddedClips } =
                    await loadHeroModel(wantPath);
                  if (disposed || ud.remoteLoadGen !== gen) {
                    disposeMeshSubtree(root);
                    return;
                  }
                  root.scale.setScalar(0.015);
                  root.traverse((c) => {
                    if (c instanceof THREE.Mesh) {
                      c.castShadow = true;
                      c.receiveShadow = true;
                    }
                  });
                  const ext = await loadHeroClips(MAP_PRESENCE_MOVE_FBX);
                  if (disposed || ud.remoteLoadGen !== gen) {
                    disposeMeshSubtree(root);
                    return;
                  }
                  const MIN_MOVE_BONES = 8;
                  const MIN_WALK_BONES = 5;
                  const MIN_EMBEDDED_IDLE_BONES = 3;
                  const retargeted: HeroClips = {};
                  for (const [name, clip] of Object.entries(ext)) {
                    if (name === "idle") continue;
                    const r = retargetClipToSkeleton(clip, root);
                    const minB =
                      name === "walk" || name === "run" ? MIN_WALK_BONES : MIN_MOVE_BONES;
                    if (countClipTracksBindingToRig(r, root) >= minB) {
                      retargeted[name] = r;
                    }
                  }
                  const embeddedIdle = pickClip(embeddedClips, [
                    "idle",
                    "stand",
                    "breathing",
                    "rest",
                  ]);
                  let idleClip: THREE.AnimationClip | undefined;
                  if (embeddedIdle) {
                    const r = retargetClipToSkeleton(embeddedIdle, root);
                    if (
                      countClipTracksBindingToRig(r, root) >=
                      MIN_EMBEDDED_IDLE_BONES
                    ) {
                      idleClip = r;
                    }
                  }
                  if (!idleClip && ext.idle) {
                    const r = retargetClipToSkeleton(ext.idle, root);
                    if (countClipTracksBindingToRig(r, root) >= MIN_MOVE_BONES) {
                      idleClip = r;
                    }
                  }
                  if (idleClip) retargeted.idle = idleClip;
                  if (!retargeted.idle) {
                    if (disposed || ud.remoteLoadGen !== gen) {
                      disposeMeshSubtree(root);
                      return;
                    }
                    if (!disposed && ud.remoteLoadGen === gen) {
                      fallback.visible = true;
                    }
                    disposeMeshSubtree(root);
                    return;
                  }
                  const { mixer, play, actions } = createHeroAnimator(
                    root,
                    retargeted,
                    { loopNames: ["idle", "walk", "run"] },
                  );
                  if (disposed || ud.remoteLoadGen !== gen) {
                    mixer.stopAllAction();
                    disposeMeshSubtree(root);
                    return;
                  }
                  remoteHeroMixers.add(mixer);
                  slot.userData.remoteHeroMixer = mixer;
                  (
                    slot.userData as {
                      remoteHeroPlay?: (n: string, f?: number) => void;
                      remoteHeroAnimActions?: Map<string, THREE.AnimationAction>;
                    }
                  ).remoteHeroPlay = play;
                  slot.userData.remoteHeroAnimActions = actions;
                  play("idle", 0);
                  if (disposed || ud.remoteLoadGen !== gen) {
                    const mx = slot.userData.remoteHeroMixer as
                      | THREE.AnimationMixer
                      | undefined;
                    if (mx) {
                      remoteHeroMixers.delete(mx);
                      mx.stopAllAction();
                      slot.userData.remoteHeroMixer = undefined;
                    }
                    (slot.userData as { remoteHeroPlay?: (n: string, f?: number) => void }).remoteHeroPlay =
                      undefined;
                    (slot.userData as { remoteHeroAnimActions?: unknown }).remoteHeroAnimActions =
                      undefined;
                    disposeMeshSubtree(root);
                    return;
                  }
                  fallback.visible = false;
                  slot.add(root);
                } catch {
                  if (!disposed && ud.remoteLoadGen === gen) {
                    fallback.visible = true;
                  }
                }
              })();
            }
            // Сүлжээ — цэгцгүй, ~4 Гц-ийн throttled pose: шууд set = хоцорсон алхам мэт. Гөлрүүлнэ.
            let sm = ud.remotePosSmooth;
            if (!sm) {
              sm = { x: p.x, z: p.z, ry: p.ry };
              ud.remotePosSmooth = sm;
            } else {
              const tP = 1 - Math.exp(-REMOTE_PEER_POS_RATE * dt);
              sm.x += (p.x - sm.x) * tP;
              sm.z += (p.z - sm.z) * tP;
              let dyr = p.ry - sm.ry;
              while (dyr > Math.PI) dyr -= Math.PI * 2;
              while (dyr < -Math.PI) dyr += Math.PI * 2;
              sm.ry += dyr * (1 - Math.exp(-REMOTE_PEER_ANG_RATE * dt));
            }
            const ground = terrainHeightFeet(sm.x, sm.z, sm.ry);
            av.position.set(sm.x, ground + 0.02, sm.z);
            av.rotation.y = sm.ry;
            const rPlay = (
              slot.userData as {
                remoteHeroPlay?: (n: string, f?: number) => void;
              }
            ).remoteHeroPlay;
            if (rPlay) {
              const actMap = (
                slot.userData as {
                  remoteHeroAnimActions?: Map<string, THREE.AnimationAction>;
                }
              ).remoteHeroAnimActions;
              if (
                ud.remoteAnimPrevX === undefined ||
                ud.remoteAnimPrevZ === undefined
              ) {
                ud.remoteAnimPrevX = sm.x;
                ud.remoteAnimPrevZ = sm.z;
                rPlay("idle", 0.1);
                ud.remoteAnimSpeedEma = 0;
                actMap?.get("idle")?.setEffectiveTimeScale(1);
              } else {
                const invDt = dt > 1e-6 ? 1 / dt : 0;
                const px = ud.remoteAnimPrevX;
                const pz = ud.remoteAnimPrevZ;
                const vSmx = (sm.x - px) * invDt;
                const vSmz = (sm.z - pz) * invDt;
                ud.remoteAnimPrevX = sm.x;
                ud.remoteAnimPrevZ = sm.z;
                const speedFromSm = Math.hypot(vSmx, vSmz);
                const distToNet = Math.hypot(p.x - sm.x, p.z - sm.z);
                const speedFromChase = distToNet * REMOTE_ANIM_GAP_TO_SPEED;
                const speed = Math.max(speedFromSm, speedFromChase);
                const prevE = ud.remoteAnimSpeedEma ?? 0;
                const ema =
                  prevE + (speed - prevE) * REMOTE_ANIM_EMA;
                ud.remoteAnimSpeedEma = ema;
                let want: "idle" | "walk" | "run" = "idle";
                if (ema >= 7.2) want = "run";
                else if (ema >= 0.3) want = "walk";
                rPlay(want, 0.1);
                if (actMap) {
                  for (const n of ["idle", "walk", "run"] as const) {
                    const a = actMap.get(n);
                    if (!a) continue;
                    if (n === want) {
                      if (n === "walk") {
                        a.setEffectiveTimeScale(
                          clamp(0.62 + ema * 0.085, 0.64, 1.34),
                        );
                      } else if (n === "run") {
                        a.setEffectiveTimeScale(
                          clamp(0.76 + ema * 0.04, 0.82, 1.45),
                        );
                      } else {
                        a.setEffectiveTimeScale(1);
                      }
                    } else {
                      a.setEffectiveTimeScale(1);
                    }
                  }
                }
              }
            }
            builderRef.current?.syncRemoteVisitorCamp(
              remotePeerGroup,
              p.id,
              sm.x,
              sm.z,
              sm.ry,
              remoteCampById,
              remoteEnclosureById,
              {
                homeKey: p.homeKey?.trim() || undefined,
                gerLevel: p.gerLevel ?? 1,
                livestock: p.livestock ?? {
                  sheep: 0,
                  goat: 0,
                  cow: 0,
                  horse: 0,
                  camel: 0,
                },
              },
            );
          }
          for (const [pid, grp] of remoteAvatarById) {
            if (!seen.has(pid)) {
              remotePeerGroup.remove(grp);
              disposeRemoteAvatar(grp);
              remoteAvatarById.delete(pid);
              const camp = remoteCampById.get(pid);
              if (camp) {
                remotePeerGroup.remove(camp);
                disposeMeshSubtree(camp);
                remoteCampById.delete(pid);
              }
              const enc = remoteEnclosureById.get(pid);
              if (enc) {
                remotePeerGroup.remove(enc);
                enc.geometry.dispose();
                const m = enc.material;
                if (Array.isArray(m)) m.forEach((x) => x.dispose());
                else m.dispose();
                remoteEnclosureById.delete(pid);
              }
            }
          }
        }

        const root = heroRootRef.current;
        const play = heroPlayRef.current;
        if (root && play) {
          presencePublishRef?.current?.(
            root.position.x,
            root.position.z,
            root.rotation.y,
          );
        }
        if (!root || !play) {
          return;
        }

        const INNER_R = 58;
        const OUTER_R = 228;
        const INNER_R2 = INNER_R * INNER_R;
        const OUTER_R2 = OUTER_R * OUTER_R;

        let nearestId: string | null = null;
        let bestD2 = Infinity;
        builder.doorAnchors.forEach((door, id) => {
          const dx = root.position.x - door.x;
          const dz = root.position.z - door.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < bestD2) {
            bestD2 = d2;
            nearestId = id;
          }
        });

        const dist = Math.sqrt(bestD2);
        const innerId =
          nearestId != null && bestD2 <= INNER_R2 ? nearestId : null;
        const labelId =
          nearestId != null && bestD2 <= OUTER_R2 ? nearestId : null;
        let approachAlpha = 0;
        if (labelId != null && nearestId != null) {
          if (bestD2 <= INNER_R2) approachAlpha = 1;
          else {
            approachAlpha = Math.max(
              0,
              Math.min(1, (OUTER_R - dist) / (OUTER_R - INNER_R)),
            );
          }
        }

        if (innerId !== heroAtStationIdRef.current) {
          heroAtStationIdRef.current = innerId;
          setHeroAtStationId(innerId);
        }

        const th = labelUiThrottleRef.current;
        if (
          th.stationId !== labelId ||
          Math.abs(th.alpha - approachAlpha) > 0.035
        ) {
          labelUiThrottleRef.current = {
            stationId: labelId,
            alpha: approachAlpha,
          };
          setLabelUi({ stationId: labelId, alpha: approachAlpha });
        }
      },
    });

    anim.start();
    animRef.current = anim;

    return () => {
      resizeObserver.disconnect();
      builderRef.current = null;
      disposed = true;
      setMapHeroEmoteIds([]);
      playMapHeroEmoteRef.current = null;
      for (const [, camp] of remoteCampById) {
        remotePeerGroup.remove(camp);
        disposeMeshSubtree(camp);
      }
      remoteCampById.clear();
      for (const [, enc] of remoteEnclosureById) {
        remotePeerGroup.remove(enc);
        enc.geometry.dispose();
        const m = enc.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
      remoteEnclosureById.clear();
      for (const [, grp] of remoteAvatarById) {
        remotePeerGroup.remove(grp);
        disposeRemoteAvatar(grp);
      }
      remoteAvatarById.clear();
      scene.remove(remotePeerGroup);
      if (heroRootRef.current) {
        scene.remove(heroRootRef.current);
        heroRootRef.current = null;
      }
      flyToStationRef.current = null;
      travelToStationRef.current = null;
      animRef.current = null;
      anim.stop();
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
    // mapStationsRevision, userEmail: 3D шинэчлэл / тоглогчийн тусдаа гэрийн байр.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStationsRevision, userEmail, playerHomeKey]);

  const homeLivestockKey = homeLivestock
    ? `${homeLivestock.sheep},${homeLivestock.goat},${homeLivestock.cow},${homeLivestock.horse},${homeLivestock.camel}`
    : "";
  useEffect(() => {
    builderRef.current?.buildPlayerLivestockNearHome(homeLivestock);
    // Intentionally keyed by homeLivestockKey only (stable counts fingerprint).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeLivestockKey]);

  const homeGerLevelKey = String(homeGerLevel);
  useEffect(() => {
    builderRef.current?.buildPlayerHomeGer(homeGerLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeGerLevelKey]);

  const flyToStation = useCallback((id: string, snap?: boolean) => {
    flyToStationRef.current?.(id, snap);
  }, []);

  const goToHomeGer = useCallback(() => {
    goToHomeGerRef.current?.();
  }, []);

  const travelToStation = useCallback((stationId: string) => {
    travelToStationRef.current?.(stationId);
  }, []);

  const playMapHeroEmote = useCallback((id: string) => {
    playMapHeroEmoteRef.current?.(id);
  }, []);

  useEffect(() => {
    onHeroAtStationChange?.(heroAtStationId);
  }, [heroAtStationId, onHeroAtStationChange]);

  return {
    labelPositions,
    flyToStation,
    goToHomeGer,
    travelToStation,
    heroAtStationId,
    labelUi,
    labelZoomScale,
    showAllMapLabels,
    mapHeroEmoteIds,
    playMapHeroEmote,
    mapVirtualStickRef,
  };
}
