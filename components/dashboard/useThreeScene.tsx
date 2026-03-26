"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";
import { STATION_CONFIGS, JOURNEY_ORDER } from "./mapConstants";
import { terrainBiome, terrainHeight } from "./sceneHelpers";

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  currentStationId: string;
  doneStationIds: string[];
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
  minDist: 26,
  maxDist: 420,
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
  const lx = cfg.wx,
    lz = cfg.wz;
  const ly = terrainHeight(lx, lz) + 4;
  const biome = terrainBiome(lx, lz, ly - 4);
  const slopeSample =
    Math.abs(terrainHeight(lx + 3, lz) - terrainHeight(lx - 3, lz)) +
    Math.abs(terrainHeight(lx, lz + 3) - terrainHeight(lx, lz - 3));
  const terrainSteep = Math.min(slopeSample / 8, 1);
  const baseDistance =
    biome === "high_alpine" || biome === "mountain"
      ? 102
      : biome === "gobi"
        ? 96
        : biome === "forest"
          ? 88
          : 85;
  const distance = baseDistance + terrainSteep * 12;
  const phi =
    biome === "high_alpine"
      ? 0.56
      : biome === "gobi"
        ? 0.46
        : biome === "forest"
          ? 0.53
          : 0.5;
  return {
    lookAt: new THREE.Vector3(lx, ly, lz),
    distance,
    phi,
    theta: Math.atan2(cfg.wz, cfg.wx) * 0.2 + 0.08,
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
}: UseThreeSceneOptions) {
  const [labelPositions, setLabelPositions] = useState<
    Record<string, LabelPos>
  >({});

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
    const initTarget = buildCameraTarget(firstStation);
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
    builder.buildGerCamps();
    builder.buildStationGers(stations);
    builder.buildRoads(stations);
    builder.buildNomadDetails();
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();

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
      introActive: true,
      introT: 0,
      introDur: 3.6,
      lastX: 0,
      lastY: 0,
    };

    const cancelIntro = () => {
      cameraState.userInteracted = true;
      if (cameraState.introActive) {
        cameraState.introActive = false;
        cameraState.introT = cameraState.introDur;
      }
    };

    function flyToStation(id: string, snap = false) {
      const t = buildCameraTarget(id);
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
      },
    });

    anim.start();
    animRef.current = anim;

    return () => {
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
