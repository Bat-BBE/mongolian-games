// ============================================================
// useThreeScene.ts
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";
import { STATION_CONFIGS, JOURNEY_ORDER } from "./mapConstants";
import { terrainHeight } from "./sceneHelpers";

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  currentStationId: string;
  doneStationIds: string[];
}

// ── Камерын smooth fly-to төлөв ─────────────────────────────
interface CameraTarget {
  lookAt: THREE.Vector3;      // харах цэг
  distance: number;           // зай
  phi: number;                // босоо өнцөг
  theta: number;              // хэвтээ өнцөг
}

// ── JOURNEY_ORDER дээр тулгуурлан эхний станцыг тодорхойл ──
function getJourneyStartStation(currentId: string): string {
  const idx = JOURNEY_ORDER.indexOf(currentId);
  // Хэрэв тодорхой биш бол хамгийн зүүн буюу эхний станц
  return idx >= 0 ? currentId : JOURNEY_ORDER[0];
}

// ── Active станцын байршилд тохирсон камерын target ─────────
function buildCameraTarget(stationId: string): CameraTarget {
  const cfg = STATION_CONFIGS[stationId];
  if (!cfg) {
    return { lookAt: new THREE.Vector3(0, 0, 0), distance: 120, phi: 0.52, theta: 0.1 };
  }
  const lx = cfg.wx, lz = cfg.wz;
  const ly = terrainHeight(lx, lz) + 4;
  return {
    lookAt: new THREE.Vector3(lx, ly, lz),
    distance: 85,
    phi: 0.50,
    // Байршлаас хамааран өнцөг бага зэрэг өөрчлөх — зам дагасан мэт харагдана
    theta: Math.atan2(cfg.wz, cfg.wx) * 0.15 + 0.05,
  };
}

// ── Нарны байршлыг хугацаанаас тооцно ───────────────────────
// Нар зүүнээс (t=0) гарч, оргилдоо хүрээд (t=0.5), баруунаас жаргана (t=1)
// Тоглоомын станц дамжих дараалал нартай синхрончлогдоно:
// JOURNEY_ORDER-ын эхэнд = нар зүүнд, төгсгөлд = нар баруунд
function getSunPositionForStation(stationId: string): { angle: number } {
  const idx = JOURNEY_ORDER.indexOf(stationId);
  const total = JOURNEY_ORDER.length - 1;
  // 0..1 хувь — зүүн бүсээс баруун бүс рүү
  const progress = idx >= 0 ? idx / total : 0.5;
  // Нар: зүүнээс (PI) гарч, баруунд (0) жаргана. Хаалтны талбайн хагас нуман замаар
  const angle = Math.PI - progress * Math.PI;
  return { angle };
}

export function useThreeScene({
  containerRef,
  stations,
  currentStationId,
  doneStationIds,
}: UseThreeSceneOptions) {
  const [labelPositions, setLabelPositions] = useState<Record<string, LabelPos>>({});

  const flyToRef    = useRef<((id: string) => void) | null>(null);
  const currentIdRef = useRef(currentStationId);
  const animRef     = useRef<import("./AnimationController").AnimationController | null>(null);

  // ── Станц солигдоход зөвхөн камер нисэнэ — scene rebuild хийхгүй ──
  useEffect(() => {
    currentIdRef.current = currentStationId;
    flyToRef.current?.(currentStationId);
    animRef.current?.updateCurrentStation(currentStationId);
  }, [currentStationId]);

  // ── Scene нэг л удаа mount хийнэ ─────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xc0d4e8, 0.0048);

    // ── Camera ─────────────────────────────────────────────
    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.5, 800);

    // Тоглоом үргэлж JOURNEY_ORDER-ын эхний станц (хамгийн зүүн)-аас эхэлнэ.
    // Камер эхэнд choibalsan дээр зогсоод, дараа currentStationId руу fly-to хийнэ.
    const firstStation = JOURNEY_ORDER[0]; // "choibalsan" wx:538
    const initTarget   = buildCameraTarget(firstStation);
    camera.position.set(
      initTarget.lookAt.x + Math.sin(initTarget.theta) * Math.cos(initTarget.phi) * initTarget.distance,
      initTarget.lookAt.y + Math.sin(initTarget.phi) * initTarget.distance,
      initTarget.lookAt.z + Math.cos(initTarget.theta) * Math.cos(initTarget.phi) * initTarget.distance
    );
    camera.lookAt(initTarget.lookAt);

    // ── Renderer ───────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Нарны эхний байршил — JOURNEY_ORDER-оос тооцно ────
    const { angle: sunInitAngle } = getSunPositionForStation(currentStationId);

    // Нар: хаалтны нуман замаар явна (XZ хавтгайд)
    // sunAngle=PI → зүүнд, sunAngle=PI/2 → дундад дээд, sunAngle=0 → баруунд
    const SUN_RADIUS = 280;
    const SUN_HEIGHT_FACTOR = 0.7; // нарны өндрийн хамгийн их утга

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.6);
    // Эхний байршлыг тохируулна
    sun.position.set(
      Math.cos(sunInitAngle) * SUN_RADIUS,
      Math.abs(Math.sin(sunInitAngle)) * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20,
      -60
    );
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near   = 1;
    sun.shadow.camera.far    = 600;
    sun.shadow.camera.left   = -200;
    sun.shadow.camera.right  =  200;
    sun.shadow.camera.top    =  200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x7aa8cc, 0.72));

    const fill = new THREE.DirectionalLight(0xadd4f8, 0.48);
    fill.position.set(-60, 40, -30);
    scene.add(fill);

    const backlight = new THREE.DirectionalLight(0xf0d890, 0.22);
    backlight.position.set(15, 10, 100);
    scene.add(backlight);

    scene.add(new THREE.HemisphereLight(0x7ec8e3, 0xd4c27a, 0.48));

    // ── SceneBuilder ───────────────────────────────────────
    const builder = new SceneBuilder(scene, currentStationId, doneStationIds);

    builder.buildSky();
    builder.buildTerrain();
    builder.buildRivers();
    builder.buildBridge();
    builder.buildTrees();
    builder.buildMountains();
    builder.buildGrassTufts();
    builder.buildRocks();
    builder.buildGerCamps();
    builder.buildStationGers(stations);
    builder.buildRoads(stations);
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();

    // ── Камерын smooth fly-to систем ──────────────────────
    const cameraState = {
      currentLook:    initTarget.lookAt.clone(),
      currentDist:    initTarget.distance,
      currentPhi:     initTarget.phi,
      currentTheta:   initTarget.theta,
      targetLook:     initTarget.lookAt.clone(),
      targetDist:     initTarget.distance,
      targetPhi:      initTarget.phi,
      targetTheta:    initTarget.theta,
      dragTheta:      0,
      dragPhi:        0,
      dragDist:       0,
      isDragging:     false,
      lastX:          0,
      lastY:          0,
      // Удаан, кино мэт нисэлт — 0.012 = ~5 секунд
      flySpeed:       0.012,
    };

    // ── Active станц руу fly-to ────────────────────────────
    function flyToStation(id: string) {
      const t = buildCameraTarget(id);
      cameraState.targetLook.copy(t.lookAt);
      cameraState.targetDist  = t.distance;
      cameraState.targetPhi   = t.phi;
      cameraState.targetTheta = t.theta + cameraState.dragTheta;
    }
    // Гадаас дуудах боломжтой болгоно
    flyToRef.current = flyToStation;

    // 1.2 секунд зүүн талыг харуулаад одоогийн станц руу нисэнэ

    // Drag хяналт
    const onMouseDown = (e: MouseEvent) => {
      cameraState.isDragging = true;
      cameraState.lastX = e.clientX;
      cameraState.lastY = e.clientY;
    };
    const onMouseUp = () => { cameraState.isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!cameraState.isDragging) return;
      const dx = e.clientX - cameraState.lastX;
      const dy = e.clientY - cameraState.lastY;
      cameraState.dragTheta -= dx * 0.005;
      cameraState.dragPhi    = Math.max(0.18, Math.min(1.18, cameraState.dragPhi - dy * 0.005));
      cameraState.targetTheta = cameraState.currentTheta - dx * 0.005;
      cameraState.targetPhi   = Math.max(0.18, Math.min(1.18, cameraState.currentPhi - dy * 0.005));
      cameraState.lastX = e.clientX;
      cameraState.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      cameraState.targetDist = Math.max(18, Math.min(220, cameraState.targetDist + e.deltaY * 0.08));
      e.preventDefault();
    };

    // Touch дэмжлэг
    let lastTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        cameraState.isDragging = true;
        cameraState.lastX = e.touches[0].clientX;
        cameraState.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx*dx + dy*dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && cameraState.isDragging) {
        const dx = e.touches[0].clientX - cameraState.lastX;
        const dy = e.touches[0].clientY - cameraState.lastY;
        cameraState.targetTheta -= dx * 0.005;
        cameraState.targetPhi = Math.max(0.18, Math.min(1.18, cameraState.targetPhi - dy * 0.005));
        cameraState.lastX = e.touches[0].clientX;
        cameraState.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const d = Math.sqrt(dx*dx + dy*dy);
        cameraState.targetDist = Math.max(18, Math.min(220, cameraState.targetDist - (d - lastTouchDist) * 0.2));
        lastTouchDist = d;
      }
    };
    const onTouchEnd = () => { cameraState.isDragging = false; };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // ── AnimationController — камерын smooth update нэмсэн ─
    const anim = new AnimationController({
      renderer,
      scene,
      camera,
      container,
      sun,
      horses:       builder.horses,
      clouds:       builder.clouds,
      birds:        builder.birds,
      markerMeshes: builder.markerMeshes,
      labelAnchors: builder.labelAnchors,
      currentStationId,
      onLabelUpdate: setLabelPositions,
      // ── Камер smooth update callback ──────────────────────
      onBeforeRender: (dt: number) => {
        // ── Динамик fly speed — холоос хурдан эхэлж ойртох тусам удаашрана
        const lookDist = cameraState.currentLook.distanceTo(cameraState.targetLook);
        const distDiff = Math.abs(cameraState.currentDist - cameraState.targetDist);
        // Хол байх тусам хурдан (0.03 хүртэл), ойртох тусам аяндаа удаашрана (0.008)
        const dynamicSpeed = Math.min(0.03, Math.max(0.008, lookDist * 0.0004 + distDiff * 0.001));
        const sp = cameraState.isDragging ? 0.18 : dynamicSpeed;

        // Smooth lerp
        cameraState.currentLook.lerp(cameraState.targetLook, sp);
        cameraState.currentDist  += (cameraState.targetDist  - cameraState.currentDist)  * sp;
        cameraState.currentPhi   += (cameraState.targetPhi   - cameraState.currentPhi)   * sp;
        cameraState.currentTheta += (cameraState.targetTheta - cameraState.currentTheta) * sp;

        // Нар — JOURNEY_ORDER-ын дарааллаар аажим хөдөлнө (анимац дотор бага зэрэг шилжинэ)
        // Станц солигдоход нарны байршил өөрчлөгдөнө — тэр нь аниматорт ирнэ
        // (Жижиг ambient хэлбэлзэл нэмнэ)
        const { angle } = getSunPositionForStation(currentIdRef.current);
        const sunAnim = angle + Math.sin(dt * 0.0008) * 0.04;
        const dayFrac = Math.abs(Math.sin(sunAnim));
        sun.position.set(
          Math.cos(sunAnim) * SUN_RADIUS,
          Math.max(8, dayFrac * SUN_RADIUS * SUN_HEIGHT_FACTOR + 20),
          -60
        );
        sun.intensity = 1.0 + dayFrac * 2.0;

        // Tendering тэнгэрийн өнгийг нарны байршлаас тохируулна
        const fogR = 0.62 + dayFrac * 0.15;
        const fogG = 0.72 + dayFrac * 0.08;
        const fogB = 0.80 + dayFrac * 0.08;
        (scene.fog as THREE.FogExp2).color.setRGB(fogR, fogG, fogB);
        renderer.toneMappingExposure = 0.9 + dayFrac * 0.35;

        // Камер байршил тооцно
        camera.position.set(
          cameraState.currentLook.x + Math.sin(cameraState.currentTheta) * Math.cos(cameraState.currentPhi) * cameraState.currentDist,
          cameraState.currentLook.y + Math.sin(cameraState.currentPhi) * cameraState.currentDist,
          cameraState.currentLook.z + Math.cos(cameraState.currentTheta) * Math.cos(cameraState.currentPhi) * cameraState.currentDist
        );
        camera.lookAt(cameraState.currentLook);
        // projectToScreen-д зөв матриц хэрэгтэй — lookAt дараа заавал дуудах
        camera.updateMatrixWorld();
      },
    });

    anim.start();
    animRef.current = anim;

    return () => {
      flyToRef.current = null;
      animRef.current  = null;
      anim.stop();
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, []);

  return { labelPositions };
}