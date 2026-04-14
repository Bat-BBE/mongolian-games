"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";
import {
  PLAYER_HOME_X,
  PLAYER_HOME_Z,
  STATION_CONFIGS,
  JOURNEY_ORDER,
  stationWorldXZ,
} from "./mapConstants";
import { terrainBiome, terrainHeight } from "./sceneHelpers";
import {
  createHeroAnimator,
  loadFbxModel,
  loadHeroClips,
} from "../map3d/heroFbx";

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  currentStationId: string;
  doneStationIds: string[];
  homeGerLevel?: number;
  homeLivestock?: { sheep: number; horse: number; camel: number };
  onSelectStation?: (stationId: string) => void;
  heroModelPath?: string | null;
  onHeroAtStationChange?: (stationId: string | null) => void;
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
  minDist: 22,
  maxDist: 520,
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
      ? 66
      : biome === "gobi"
        ? 62
        : biome === "forest"
          ? 58
          : 56;
  const distance = baseDistance + terrainSteep * 12;
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
    distance: 44,
    phi: 0.44,
    theta: 0.15,
  };
}

type HomeWayMarker = THREE.Group & {
  userData: {
    baseY: number;
    phase: number;
    pulseMats: THREE.MeshStandardMaterial[];
    stationId: string;
    sprite?: THREE.Sprite;
    homeWayMarker?: boolean;
  };
};

function findHomeWayMarkerGroup(
  obj: THREE.Object3D | null,
): HomeWayMarker | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    const u = cur.userData as { homeWayMarker?: boolean };
    if (u.homeWayMarker) return cur as HomeWayMarker;
    cur = cur.parent;
  }
  return null;
}

/** Газрын дээрх сум + станцын нэр/дүрс — анимацыг onBeforeRender-д ажиллуулна. */
function addNearestUrtuuGroundWayMarkers(
  scene: THREE.Scene,
  homeX: number,
  homeZ: number,
  outMarkers: HomeWayMarker[],
  count = 4,
): void {
  const stationIds = Object.keys(STATION_CONFIGS);
  const scored = stationIds
    .map((id) => {
      const { x: sx, z: sz } = stationWorldXZ(
        STATION_CONFIGS[id].wx,
        STATION_CONFIGS[id].wz,
      );
      const d = Math.hypot(sx - homeX, sz - homeZ);
      return { id, d, sx, sz };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, count);

  scored.forEach((s, i) => {
    const cfg = STATION_CONFIGS[s.id];
    const ang = (i / Math.max(1, count)) * Math.PI * 2 + 0.42;
    const ox = homeX + Math.cos(ang) * 5.2;
    const oz = homeZ + Math.sin(ang) * 5.2;
    const baseY = terrainHeight(ox, oz) + 0.08;
    const dx = s.sx - ox;
    const dz = s.sz - oz;
    const yaw = Math.atan2(dx, dz);
    const hue = 0.06 + (count > 1 ? (i / (count - 1)) * 0.11 : 0);
    const col = new THREE.Color().setHSL(hue, 0.72, 0.52);
    const pulseMats: THREE.MeshStandardMaterial[] = [];

    const g = new THREE.Group() as HomeWayMarker;
    g.position.set(ox, baseY, oz);
    g.rotation.y = yaw;
    g.userData = {
      baseY,
      phase: i * 1.7,
      pulseMats,
      stationId: s.id,
      homeWayMarker: true,
    };

    const pad = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 28),
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.65,
        metalness: 0.12,
        emissive: col,
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
      }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    pulseMats.push(pad.material as THREE.MeshStandardMaterial);
    g.add(pad);

    const shaftLen = 4.2;
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.1, shaftLen),
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.55,
        metalness: 0.08,
        emissive: col,
        emissiveIntensity: 0.1,
      }),
    );
    shaft.position.set(0, 0.06, shaftLen * 0.5 + 0.35);
    pulseMats.push(shaft.material as THREE.MeshStandardMaterial);
    g.add(shaft);

    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.05, 10),
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.45,
        metalness: 0.1,
        emissive: col,
        emissiveIntensity: 0.18,
      }),
    );
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.08, shaftLen + 1.15);
    pulseMats.push(head.material as THREE.MeshStandardMaterial);
    g.add(head);

    const canvas = document.createElement("canvas");
    const cw = 300;
    const ch = 88;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const pad = 8;
      ctx.fillStyle = "rgba(6,10,18,0.92)";
      ctx.fillRect(pad, pad, cw - pad * 2, ch - pad * 2);
      ctx.strokeStyle = `rgba(${Math.floor(col.r * 255)},${Math.floor(col.g * 255)},${Math.floor(col.b * 255)},0.85)`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pad + 0.5, pad + 0.5, cw - pad * 2 - 1, ch - pad * 2 - 1);
      ctx.font = "bold 26px system-ui,Segoe UI,sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(cfg.icon, 14, 38);
      ctx.font = "600 15px system-ui,Segoe UI,sans-serif";
      const name =
        cfg.region.length > 16 ? cfg.region.slice(0, 15) + "…" : cfg.region;
      ctx.fillText(name, 46, 34);
      ctx.font = "400 12px system-ui,Segoe UI,sans-serif";
      ctx.fillStyle = "rgba(203,213,225,0.9)";
      const slug = s.id.replace(/_/g, " ");
      const slugDraw = slug.length > 22 ? slug.slice(0, 20) + "…" : slug;
      ctx.fillText(slugDraw, 46, 54);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: false,
      }),
    );
    sprite.scale.set(7.2, 2.1, 1);
    sprite.position.set(0, 2.85, shaftLen * 0.45);
    sprite.visible = false;
    g.add(sprite);
    g.userData.sprite = sprite;

    scene.add(g);
    outMarkers.push(g);
  });
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
  currentStationId,
  doneStationIds,
  homeGerLevel = 1,
  homeLivestock,
  onSelectStation,
  heroModelPath,
  onHeroAtStationChange,
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
  const showAllMapLabelsRef = useRef(false);
  const [labelZoomScale, setLabelZoomScale] = useState(1);
  const [showAllMapLabels, setShowAllMapLabels] = useState(false);
  const labelUiThrottleRef = useRef<{
    stationId: string | null;
    alpha: number;
  }>({ stationId: null, alpha: -1 });

  const onSelectRef = useRef<UseThreeSceneOptions["onSelectStation"]>(null);
  useEffect(() => {
    onSelectRef.current = onSelectStation ?? null;
  }, [onSelectStation]);

  /** Updated in the render loop when the hero enters a door radius (marker click only then). */
  const heroAtStationIdRef = useRef<string | null>(null);

  const flyToStationRef = useRef<((id: string, snap?: boolean) => void) | null>(
    null,
  );
  const goToHomeGerRef = useRef<(() => void) | null>(null);
  const currentIdRef = useRef(resolveStationId(currentStationId));
  const animRef = useRef<
    import("./AnimationController").AnimationController | null
  >(null);

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x92c4e8);
    scene.fog = new THREE.FogExp2(0xb8d0e8, 0.00105);

    const W = container.clientWidth,
      H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, W / H, 1.2, 14000);

    const hub = !currentStationId?.trim() || currentStationId.trim() === "home";
    const highlightStationId = hub ? "" : resolveStationId(currentStationId);
    const sunStationId = hub
      ? "ulaanbaatar"
      : resolveStationId(currentStationId);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const applyViewportSize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    const resizeObserver = new ResizeObserver(() => applyViewportSize());
    resizeObserver.observe(container);

    const { angle: sunInitAngle } = getSunPositionForStation(sunStationId);

    const SUN_RADIUS = 280;
    const SUN_HEIGHT_FACTOR = 0.7;

    const sun = new THREE.DirectionalLight(0xfff2dc, 2.05);
    sun.position.set(
      Math.cos(sunInitAngle) * SUN_RADIUS,
      Math.abs(Math.sin(sunInitAngle)) * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20,
      -60,
    );
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 9000;
    sun.shadow.camera.left = -3200;
    sun.shadow.camera.right = 3200;
    sun.shadow.camera.top = 3200;
    sun.shadow.camera.bottom = -3200;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x7aa8cc, 0.58));

    const fill = new THREE.DirectionalLight(0xadd4f8, 0.42);
    fill.position.set(-60, 40, -30);
    scene.add(fill);

    const backlight = new THREE.DirectionalLight(0xf0d890, 0.18);
    backlight.position.set(15, 10, 100);
    scene.add(backlight);

    scene.add(new THREE.HemisphereLight(0x7ec8e3, 0xd4c27a, 0.48));

    const builder = new SceneBuilder(scene, highlightStationId, doneStationIds);

    builder.buildSky();
    builder.buildTerrain();
    builder.buildRivers();
    builder.buildRiverReeds();
    builder.buildBridge();
    builder.buildTrees();
    builder.buildMountains();
    builder.buildGrassTufts();
    builder.buildRocks();
    builder.buildPlayerHomeGer(homeGerLevel);
    builder.buildPlayerLivestockNearHome(homeLivestock);
    builder.buildRoads(stations);
    builder.buildStationGers(stations);
    builder.buildGerCamps();
    builder.buildNomadDetails();
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();

    let homeLookAt = new THREE.Vector3(
      PLAYER_HOME_X,
      terrainHeight(PLAYER_HOME_X, PLAYER_HOME_Z) + 2.5,
      PLAYER_HOME_Z,
    );
    const doorHome = builder.doorAnchors.get("home");
    if (doorHome) {
      const hx = doorHome.x;
      const hz = doorHome.z;
      homeLookAt.set(hx, terrainHeight(hx, hz) + 2.7, hz + 2.9);
    }
    const homeWayMarkers: HomeWayMarker[] = [];
    addNearestUrtuuGroundWayMarkers(
      scene,
      PLAYER_HOME_X,
      PLAYER_HOME_Z,
      homeWayMarkers,
      0,
    );

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
    /** Гар удирдлага: хурд тэгшлэгдэнэ (гэнэтийн шилжилт багасна). */
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
    let disposed = false;

    if (heroModelPath && heroModelPath.trim()) {
      void (async () => {
        try {
          const rawPath = heroModelPath.trim();
          const safePath = rawPath.endsWith(".fbx.fbx")
            ? rawPath.slice(0, -4)
            : rawPath;
          const root = await loadFbxModel(safePath);
          if (disposed) return;
          // Гэртэй харьцуулахад жижиг харагдуулна (гэрүүдийг томруулсан)
          root.scale.setScalar(0.015);
          root.traverse((c) => {
            if (c instanceof THREE.Mesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });
          const clips = await loadHeroClips({
            idle: "/models/standing idle 01.fbx",
            walk: "/models/standing walk forward.fbx",
            run: "/models/standing run forward.fbx",
          });
          if (disposed) return;
          const { mixer, play } = createHeroAnimator(root, clips);
          heroMixerRef.current = mixer;
          heroRootRef.current = root;
          heroPlayRef.current = play;
          const dh = builder.doorAnchors.get("home");
          let sx = PLAYER_HOME_X;
          let sz = PLAYER_HOME_Z + 4;
          if (dh) {
            sx = dh.x;
            sz = dh.z + 3.4;
          }
          const sy = terrainHeight(sx, sz) + 0.02;
          root.position.set(sx, sy, sz);
          root.rotation.y = 0;
          play("idle", 0);
          scene.add(root);
        } catch {
          // If hero fails to load, map still works.
          // eslint-disable-next-line no-console
          console.warn("Hero model failed to load for map:", heroModelPath);
        }
      })();
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

      if (homeWayMarkers.length) {
        const hitsHome = raycaster.intersectObjects(homeWayMarkers, true);
        if (hitsHome.length) {
          const grp = findHomeWayMarkerGroup(hitsHome[0].object);
          if (grp?.userData.sprite) {
            const sp = grp.userData.sprite;
            const was = sp.visible;
            for (const m of homeWayMarkers) {
              m.userData.sprite && (m.userData.sprite.visible = false);
            }
            if (!was) sp.visible = true;
            return;
          }
        }
        for (const m of homeWayMarkers) {
          if (m.userData.sprite) m.userData.sprite.visible = false;
        }
      }

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
      st.run = e.shiftKey;
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
      st.run = e.shiftKey;
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
        cancelIntro();
      } else if (!cameraState.userInteracted) {
        cameraState.targetTheta = t.theta;
      }
    }
    flyToStationRef.current = flyToStation;

    function goToHomeGer() {
      flyToStation("home", true);
      followHeroUntilRef.current = performance.now() + 3200;
      heroManualVelRef.current.set(0, 0, 0);
      manualKeysRef.current.up =
        manualKeysRef.current.down =
        manualKeysRef.current.left =
        manualKeysRef.current.right =
          false;
      manualKeysRef.current.run = false;
      const root = heroRootRef.current;
      if (root) {
        const dh = builder.doorAnchors.get("home");
        let sx = PLAYER_HOME_X;
        let sz = PLAYER_HOME_Z + 4;
        if (dh) {
          sx = dh.x;
          sz = dh.z + 3.4;
        }
        const sy = terrainHeight(sx, sz) + 0.02;
        root.position.set(sx, sy, sz);
        root.rotation.y = Math.atan2(PLAYER_HOME_X - sx, PLAYER_HOME_Z - sz);
        heroPlayRef.current?.("idle", 0.12);
        heroKinematicRef.current.pos.copy(root.position);
        heroKinematicRef.current.ry = root.rotation.y;
        heroKinematicRef.current.has = true;
      }
    }
    goToHomeGerRef.current = goToHomeGer;

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
        let followSmooth = cameraState.isDragging ? 18 : 9;
        const rootCam = heroRootRef.current;
        if (rootCam && heroPlayRef.current) {
          const st = manualKeysRef.current;
          const mvx = (st.right ? 1 : 0) - (st.left ? 1 : 0);
          const mvz = (st.up ? 1 : 0) - (st.down ? 1 : 0);
          const klen = Math.sqrt(mvx * mvx + mvz * mvz);
          if (klen > 0.01) {
            followHeroUntilRef.current = performance.now() + 1800;
            cameraState.targetLook.set(
              rootCam.position.x,
              rootCam.position.y + 2.2,
              rootCam.position.z,
            );
            followSmooth = cameraState.isDragging ? 24 : 28;
          } else if (followHeroUntilRef.current > performance.now()) {
            cameraState.targetLook.set(
              rootCam.position.x,
              rootCam.position.y + 2.2,
              rootCam.position.z,
            );
            followSmooth = cameraState.isDragging ? 20 : 17;
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

        for (const m of homeWayMarkers) {
          const { baseY, phase, pulseMats } = m.userData;
          m.position.y = baseY + Math.sin(elapsed * 2.6 + phase) * 0.16;
          const pulse = 0.08 + Math.sin(elapsed * 3.4 + phase) * 0.07;
          for (const mat of pulseMats) {
            mat.emissiveIntensity = pulse;
          }
        }

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
        const floorY =
          prevF == null
            ? floorRaw
            : prevF + (floorRaw - prevF) * (1 - Math.exp(-9 * dt));
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

        // --- Hero movement (manual); door proximity runs every frame after move ---
        const root = heroRootRef.current;
        const play = heroPlayRef.current;
        if (!root || !play) {
          heroKinematicRef.current.has = false;
          return;
        }

        const st = manualKeysRef.current;
        const mvx = (st.right ? 1 : 0) - (st.left ? 1 : 0);
        const mvz = (st.up ? 1 : 0) - (st.down ? 1 : 0);
        const len = Math.sqrt(mvx * mvx + mvz * mvz);
        const hv = heroManualVelRef.current;
        if (len <= 0.01) {
          hv.multiplyScalar(Math.exp(-20 * delta));
          if (hv.lengthSq() < 0.2) hv.set(0, 0, 0);
        }
        if (len > 0.01) {
          const baseSpeed = st.run ? 22 : 12;
          const localDir = new THREE.Vector3(mvx / len, 0, mvz / len);
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
          if (st.run) {
            hv.copy(desiredVel);
          } else {
            hv.lerp(desiredVel, 1 - Math.exp(-16 * delta));
          }
          root.position.addScaledVector(hv, delta);
          root.position.x = clamp(root.position.x, -5600, 5600);
          root.position.z = clamp(root.position.z, -4700, 4700);
          root.position.y =
            terrainHeight(root.position.x, root.position.z) + 0.02;

          const targetYaw = Math.atan2(worldDir.x, worldDir.z);
          let dy = targetYaw - root.rotation.y;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          root.rotation.y += dy * (1 - Math.exp(-14 * delta));

          play(st.run ? "run" : "walk", 0.12);
        } else {
          play("idle", 0.18);
        }

        heroKinematicRef.current.pos.copy(root.position);
        heroKinematicRef.current.ry = root.rotation.y;
        heroKinematicRef.current.has = true;

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
      disposed = true;
      if (heroRootRef.current) {
        scene.remove(heroRootRef.current);
        heroRootRef.current = null;
      }
      flyToStationRef.current = null;
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
  }, []);

  const flyToStation = useCallback((id: string, snap?: boolean) => {
    flyToStationRef.current?.(id, snap);
  }, []);

  const goToHomeGer = useCallback(() => {
    goToHomeGerRef.current?.();
  }, []);

  useEffect(() => {
    onHeroAtStationChange?.(heroAtStationId);
  }, [heroAtStationId, onHeroAtStationChange]);

  return {
    labelPositions,
    flyToStation,
    goToHomeGer,
    heroAtStationId,
    labelUi,
    labelZoomScale,
    showAllMapLabels,
  };
}
