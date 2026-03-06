// ============================================================
// useThreeScene.ts
// Three.js renderer, scene, camera, lighting ажиллуулах hook.
// 25 станц + 480×280 terrain хувилбар.
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SceneBuilder } from "./SceneBuilder";
import { AnimationController } from "./AnimationController";
import type { LabelPos } from "./AnimationController";
import type { UrtuuStation } from "./UrtuuNode";

interface UseThreeSceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stations: UrtuuStation[];
  currentStationId: string;
  doneStationIds: string[];
}

export function useThreeScene({
  containerRef,
  stations,
  currentStationId,
  doneStationIds,
}: UseThreeSceneOptions) {
  const [labelPositions, setLabelPositions] = useState<Record<string, LabelPos>>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xc0d4e8, 0.0048); // Монголын тунгалаг агаар — fog бага

    // ── Camera ─────────────────────────────────────────────
    const W = container.clientWidth, H = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.5, 800);
    camera.position.set(0, 100, 200);
    camera.lookAt(0, 2, 0);

    // ── Renderer ───────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Гэрэл ─────────────────────────────────────────────
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.6);
    sun.position.set(80, 100, 40);
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
    builder.buildHorses();
    builder.buildCamels();
    builder.buildClouds();
    builder.buildBirds();

    // ── AnimationController ────────────────────────────────
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
    });

    anim.start();

    return () => {
      anim.stop();
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, [currentStationId, doneStationIds.join(",")]);

  return { labelPositions };
}