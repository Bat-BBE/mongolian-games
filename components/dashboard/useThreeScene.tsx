"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";
import { STATION_CONFIGS, JOURNEY_ORDER, WORLD_SCALE } from "./mapConstants";
import { terrainBiome, terrainHeight } from "./sceneHelpers";
import { createHeroAnimator, loadFbxModel, loadHeroClips } from "../map3d/heroFbx";

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  currentStationId: string;
  doneStationIds: string[];
  homeGerLevel?: number;
  homeLivestock?: { sheep: number; horse: number; camel: number };
  onSelectStation?: (stationId: string) => void;
  onHeroArriveStation?: (stationId: string) => void;
  heroModelPath?: string | null;
  heroTargetStationId?: string | null;
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
  maxDist: 320,
};

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
  if (id && STATION_CONFIGS[id]) return id;
  return getJourneyStartStation(id);
}

function buildCameraTarget(stationId: string): CameraTarget {
  const id = resolveStationId(stationId);
  const cfg = STATION_CONFIGS[id];
  const lx = cfg.wx * WORLD_SCALE,
    lz = cfg.wz * WORLD_SCALE;
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

// Player home base — place away from major stations (more “empty steppe”).
const HOME_POS = { x: 90, z: 10 };
function buildHomeCameraTarget(): CameraTarget {
  const lx = HOME_POS.x;
  const lz = HOME_POS.z;
  const ly = terrainHeight(lx, lz) + 2.4;
  return {
    lookAt: new THREE.Vector3(lx, ly, lz),
    distance: 40,
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
  currentStationId,
  doneStationIds,
  homeGerLevel = 1,
  homeLivestock,
  onSelectStation,
  onHeroArriveStation,
  heroModelPath,
  heroTargetStationId,
}: UseThreeSceneOptions) {
  const [labelPositions, setLabelPositions] = useState<
    Record<string, LabelPos>
  >({});

  const onSelectRef = useRef<UseThreeSceneOptions["onSelectStation"]>(null);
  useEffect(() => {
    onSelectRef.current = onSelectStation ?? null;
  }, [onSelectStation]);

  const onArriveRef = useRef<UseThreeSceneOptions["onHeroArriveStation"]>(null);
  useEffect(() => {
    onArriveRef.current = onHeroArriveStation ?? null;
  }, [onHeroArriveStation]);

  const heroTargetRef = useRef<string | null>(null);
  useEffect(() => {
    heroTargetRef.current = heroTargetStationId ?? null;
  }, [heroTargetStationId]);

  const flyToStationRef = useRef<((id: string, snap?: boolean) => void) | null>(
    null,
  );
  const currentIdRef = useRef(resolveStationId(currentStationId));
  const animRef = useRef<
    import("./AnimationController").AnimationController | null
  >(null);

  useEffect(() => {
    const resolved = resolveStationId(currentStationId);
    currentIdRef.current = resolved;
    flyToStationRef.current?.(currentStationId, false);
    animRef.current?.updateCurrentStation(resolved);
  }, [currentStationId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xb9c4ce, 0.0044);

    const W = container.clientWidth,
      H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.5, 800);

    const firstStation = resolveStationId(currentStationId);
    const initTarget = buildHomeCameraTarget();
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const { angle: sunInitAngle } = getSunPositionForStation(firstStation);

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
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
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

    const builder = new SceneBuilder(scene, firstStation, doneStationIds);

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
    builder.buildGerCamps();
    builder.buildStationGers(stations);
    builder.buildRoads(stations);
    builder.buildNomadDetails();
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();

    const heroMixerRef = { current: null as THREE.AnimationMixer | null };
    const heroRootRef = { current: null as THREE.Object3D | null };
    const heroPlayRef = { current: null as ((name: string, fadeSec?: number) => void) | null };
    const heroMoveRef = {
      current: {
        lastTarget: null as string | null,
        lastArrived: null as string | null,
        pathPts: null as THREE.Vector3[] | null,
        pathLens: [] as number[],
        totalLen: 0,
        distAlong: 0,
        speed: 18,
      },
    };
    /** Гар удирдлага: хурд тэгшлэгдэнэ (гэнэтийн шилжилт багасна). */
    const heroManualVelRef = { current: new THREE.Vector3(0, 0, 0) };
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

    const stationWorldPos = (stationId: string): THREE.Vector3 => {
      const id = resolveStationId(stationId);
      const cfg = STATION_CONFIGS[id];
      const x = cfg.wx * WORLD_SCALE;
      const z = cfg.wz * WORLD_SCALE;
      const y = terrainHeight(x, z);
      return new THREE.Vector3(x, y, z);
    };

    const stationArrivalPos = (stationId: string): THREE.Vector3 => {
      const id = resolveStationId(stationId);
      const door = builder.doorAnchors.get(id);
      if (door) {
        // Station gers are oriented so the door faces +Z.
        // Stand slightly in front of the door to avoid intersecting the ger mesh.
        const pos = new THREE.Vector3(door.x, door.y, door.z + 2.2);
        pos.y = terrainHeight(pos.x, pos.z);
        return pos;
      }
      return stationWorldPos(id);
    };

    if (heroModelPath && heroModelPath.trim()) {
      void (async () => {
        try {
          const rawPath = heroModelPath.trim();
          const safePath = rawPath.endsWith(".fbx.fbx")
            ? rawPath.slice(0, -4)
            : rawPath;
          const root = await loadFbxModel(safePath);
          if (disposed) return;
          // Map scale: manual control feels better when smaller.
          root.scale.setScalar(0.02);
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
          const p = stationArrivalPos(firstStation);
          root.position.set(p.x, p.y, p.z);
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
        const sid = (cur.userData as { stationId?: unknown } | undefined)?.stationId;
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
      const cb = onSelectRef.current;
      if (!cb) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - downAt;
      // Don't treat drags as clicks.
      if (dist > 6 || dt > 900) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(mouse, camera);
      const targets = Array.from(builder.markerMeshes.values());
      const hits = raycaster.intersectObjects(targets, true);
      if (!hits.length) return;
      const sid = getStationId(hits[0].object);
      if (sid) cb(sid);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const st = manualKeysRef.current;
      if (e.key === "Shift") st.run = true;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") st.up = true;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") st.down = true;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") st.left = true;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") st.right = true;
      // Cancel station autopilot quickly.
      if (e.key === "Escape" || e.key === " ") {
        heroTargetRef.current = null;
        heroMoveRef.current.lastTarget = null;
        heroMoveRef.current.pathPts = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const st = manualKeysRef.current;
      if (e.key === "Shift") st.run = false;
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") st.up = false;
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") st.down = false;
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") st.left = false;
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") st.right = false;
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

    const cancelIntro = () => {
      cameraState.userInteracted = true;
      if (cameraState.introActive) {
        cameraState.introActive = false;
        cameraState.introT = cameraState.introDur;
      }
    };

    function flyToStation(id: string, snap = false) {
      const t = id === "home" ? buildHomeCameraTarget() : buildCameraTarget(id);
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
        cancelIntro();
      } else if (!cameraState.userInteracted) {
        cameraState.targetTheta = t.theta;
      }
    }
    flyToStationRef.current = flyToStation;

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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
      currentStationId: firstStation,
      onLabelUpdate: setLabelPositions,
      onBeforeRender: (elapsed: number, delta: number) => {
        const dt = Math.min(delta, 0.06);
        const smoothPos = 1 - Math.exp(-(cameraState.isDragging ? 18 : 9) * dt);
        const smoothRot =
          1 - Math.exp(-(cameraState.isDragging ? 22 : 11) * dt);

        cameraState.targetTheta += cameraState.thetaVel;
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

        const fogR = 0.66 + dayFrac * 0.1;
        const fogG = 0.7 + dayFrac * 0.09;
        const fogB = 0.74 + dayFrac * 0.07;
        (scene.fog as THREE.FogExp2).color.setRGB(fogR, fogG, fogB);
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
        // Keep camera above terrain to avoid "digging" into the ground.
        const floorY = terrainHeight(finalCamPos.x, finalCamPos.z) + 2.2;
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

        // --- Hero movement (manual first, then station autopilot) ---
        const root = heroRootRef.current;
        const play = heroPlayRef.current;
        if (!root || !play) return;
        const ms = heroMoveRef.current;

        // Manual: WASD/Arrows (Shift = run). Movement is camera-relative.
        const st = manualKeysRef.current;
        const mvx = (st.right ? 1 : 0) - (st.left ? 1 : 0);
        // W = forward, S = backward
        const mvz = (st.up ? 1 : 0) - (st.down ? 1 : 0);
        const len = Math.sqrt(mvx * mvx + mvz * mvz);
        const hv = heroManualVelRef.current;
        if (len <= 0.01) {
          hv.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-14 * delta));
        }
        if (len > 0.01) {
          followHeroUntilRef.current = performance.now() + 1400;
          const baseSpeed = st.run ? 22 : 12;
          const localDir = new THREE.Vector3(mvx / len, 0, mvz / len);
          const camForward = new THREE.Vector3();
          camera.getWorldDirection(camForward);
          camForward.y = 0;
          camForward.normalize();
          const camRight = new THREE.Vector3()
            .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
            .normalize();
          const worldDir = new THREE.Vector3()
            .addScaledVector(camRight, localDir.x)
            .addScaledVector(camForward, localDir.z)
            .normalize();

          const desiredVel = worldDir.clone().multiplyScalar(baseSpeed);
          hv.lerp(desiredVel, 1 - Math.exp(-16 * delta));
          root.position.addScaledVector(hv, delta);
          root.position.x = clamp(root.position.x, -820, 650);
          root.position.z = clamp(root.position.z, -520, 520);
          root.position.y = terrainHeight(root.position.x, root.position.z) + 0.02;

          const targetYaw = Math.atan2(worldDir.x, worldDir.z);
          let dy = targetYaw - root.rotation.y;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          root.rotation.y += dy * (1 - Math.exp(-14 * delta));

          play(st.run ? "run" : "walk", 0.12);

          // Manual input cancels any in-progress autopilot path.
          heroTargetRef.current = null;
          ms.pathPts = null;
          ms.lastTarget = null;
          return;
        }

        // Camera follow when manually moving (or shortly after).
        if (followHeroUntilRef.current > performance.now()) {
          cameraState.targetLook.set(root.position.x, root.position.y + 2.2, root.position.z);
        }

        // Autopilot: set by clicking labels/doors in the UI.
        const tgtRaw = heroTargetRef.current;
        if (!tgtRaw) {
          play("idle", 0.18);
          return;
        }
        const tgt = resolveStationId(tgtRaw);

        const buildAdj = () => {
          const adj = new Map<string, Set<string>>();
          for (const key of builder.roadPaths.keys()) {
            const [a, b] = key.split("->");
            if (!a || !b) continue;
            if (!adj.has(a)) adj.set(a, new Set());
            adj.get(a)!.add(b);
          }
          return adj;
        };

        const findRoute = (from: string, to: string): string[] | null => {
          if (from === to) return [from];
          const adj = buildAdj();
          const q: string[] = [from];
          const prev = new Map<string, string | null>();
          prev.set(from, null);
          while (q.length) {
            const cur = q.shift()!;
            const ns = adj.get(cur);
            if (!ns) continue;
            for (const n of ns) {
              if (prev.has(n)) continue;
              prev.set(n, cur);
              if (n === to) {
                const out: string[] = [];
                let x: string | null = to;
                while (x) {
                  out.push(x);
                  x = prev.get(x) ?? null;
                }
                out.reverse();
                return out;
              }
              q.push(n);
            }
          }
          return null;
        };

        const setPath = (fromId: string, toId: string) => {
          const route = findRoute(fromId, toId);
          if (!route || route.length < 2) {
            ms.pathPts = null;
            ms.totalLen = 0;
            ms.pathLens = [];
            ms.distAlong = 0;
            return;
          }
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i < route.length - 1; i++) {
            const seg = builder.roadPaths.get(`${route[i]}->${route[i + 1]}`);
            if (!seg) continue;
            for (let j = 0; j < seg.length; j++) {
              if (i > 0 && j === 0) continue;
              pts.push(seg[j].clone());
            }
          }
          for (const p of pts) p.y = terrainHeight(p.x, p.z);
          ms.pathPts = pts;
          ms.pathLens = [0];
          ms.totalLen = 0;
          for (let i = 1; i < pts.length; i++) {
            ms.totalLen += pts[i].distanceTo(pts[i - 1]);
            ms.pathLens.push(ms.totalLen);
          }
          ms.distAlong = 0;
          play("walk", 0.2);
        };

        const sampleAt = (d: number): { pos: THREE.Vector3; dir: THREE.Vector3 } => {
          const pts = ms.pathPts;
          if (!pts || pts.length < 2 || ms.totalLen <= 0) {
            return { pos: root.position.clone(), dir: new THREE.Vector3(0, 0, 1) };
          }
          const clamped = Math.max(0, Math.min(ms.totalLen, d));
          let i = 1;
          while (i < ms.pathLens.length && ms.pathLens[i] < clamped) i++;
          const i0 = Math.max(1, i);
          const prevLen = ms.pathLens[i0 - 1];
          const segLen = ms.pathLens[i0] - prevLen || 1;
          const t = (clamped - prevLen) / segLen;
          const a = pts[i0 - 1];
          const b = pts[i0];
          const pos = new THREE.Vector3().lerpVectors(a, b, t);
          const dir = new THREE.Vector3().subVectors(b, a);
          dir.y = 0;
          dir.normalize();
          return { pos, dir };
        };

        if (tgt !== ms.lastTarget) {
          setPath(resolveStationId(currentIdRef.current), tgt);
          ms.lastTarget = tgt;
        }

        if (!ms.pathPts || ms.totalLen <= 0) return;

        // Autopilot speed tuned for the larger world scale.
        ms.distAlong += (ms.speed * 0.75) * delta;
        const { pos, dir } = sampleAt(ms.distAlong);
        root.position.copy(pos);
        root.position.y += 0.02;
        if (dir.lengthSq() > 0) root.rotation.y = Math.atan2(dir.x, dir.z);

        if (ms.distAlong >= ms.totalLen - 0.01) {
          ms.pathPts = null;
          play("idle", 0.25);
          const sp = stationArrivalPos(tgt);
          root.position.set(sp.x, sp.y, sp.z);
          if (ms.lastArrived !== tgt) {
            ms.lastArrived = tgt;
            onArriveRef.current?.(tgt);
          }
        }
      },
    });

    anim.start();
    animRef.current = anim;

    return () => {
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
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, []);

  const flyToStation = useCallback((id: string, snap?: boolean) => {
    flyToStationRef.current?.(id, snap);
  }, []);

  return { labelPositions, flyToStation };
}
