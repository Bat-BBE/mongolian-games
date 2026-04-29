"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { useHeroOrb } from "@/hooks/useHeroOrb";
import {
  loadHeroModel,
  normalizeHeroHeight,
  pickClip,
} from "@/components/map3d/heroFbx";
import { tryAttachHeroIbl } from "@/components/map3d/heroIbl";

/** Одоогийн анимын нэр хажууд харуулах emoji — товч, заавартай нийцнэ. */
function heroActionIcon(action: string): string {
  if (action === "idle") return "🧍";
  if (action === "boxing") return "🥊";
  if (action === "dancing") return "💃";
  if (action.startsWith("run")) return "🏃";
  if (action.startsWith("walk")) return "🚶";
  if (action.startsWith("turn")) return "↩️";
  return "🎬";
}

interface HeroActorProps {
  className?: string;
  autoRotate?: boolean;
  backgroundColor?: string;
  modelPath?: string;
}

export default function HeroActor({
  className = "",
  autoRotate = true,
  backgroundColor = "#111827",
  modelPath = "/models/hero-select.fbx",
}: HeroActorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animations, setAnimations] = useState<{
    [key: string]: THREE.AnimationClip;
  }>({});
  const [currentAction, setCurrentAction] = useState<string>("idle");
  const [isSelected, setIsSelected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const currentActionRef = useRef(currentAction);
  currentActionRef.current = currentAction;
  const playingBoxingRef = useRef(false);
  const playingDanceRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  useHeroOrb(
    containerRef as React.RefObject<HTMLCanvasElement | null>,
    isSelected ? "#ff3366" : "#3b82f6",
    isSelected ? "#ff0066" : "#1e3a8a",
    isSelected,
    isLocked,
  );

  const triggerBoxing = useCallback(() => {
    if (isLoading) return;
    if (playingBoxingRef.current || playingDanceRef.current) return;
    const mixer = mixerRef.current;
    const boxing = animationsRef.current.get("boxing");
    const idle = animationsRef.current.get("idle");
    if (!mixer || !boxing || !idle) return;

    playingBoxingRef.current = true;
    const prevName = currentActionRef.current;
    const prev = animationsRef.current.get(prevName);
    if (prev && prev !== boxing) prev.fadeOut(0.15);

    boxing.stop();
    boxing.reset();
    boxing.setLoop(THREE.LoopOnce, 1);
    boxing.clampWhenFinished = true;
    boxing.fadeIn(0.15).play();
    setCurrentAction("boxing");

    const onFinished = (evt: object) => {
      const action = (evt as { action?: THREE.AnimationAction }).action;
      if (action !== boxing) return;
      mixer.removeEventListener("finished", onFinished);
      playingBoxingRef.current = false;
      boxing.fadeOut(0.2);
      idle.reset().fadeIn(0.2).play();
      setCurrentAction("idle");
    };
    mixer.addEventListener("finished", onFinished);
  }, [isLoading]);

  const triggerDance = useCallback(() => {
    if (isLoading) return;
    if (playingBoxingRef.current || playingDanceRef.current) return;
    const mixer = mixerRef.current;
    const dancing = animationsRef.current.get("dancing");
    const idle = animationsRef.current.get("idle");
    if (!mixer || !dancing || !idle) return;

    playingDanceRef.current = true;
    const prevName = currentActionRef.current;
    const prev = animationsRef.current.get(prevName);
    if (prev && prev !== dancing) prev.fadeOut(0.15);

    dancing.stop();
    dancing.reset();
    dancing.setLoop(THREE.LoopOnce, 1);
    dancing.clampWhenFinished = true;
    dancing.fadeIn(0.15).play();
    setCurrentAction("dancing");

    const onFinished = (evt: object) => {
      const action = (evt as { action?: THREE.AnimationAction }).action;
      if (action !== dancing) return;
      mixer.removeEventListener("finished", onFinished);
      playingDanceRef.current = false;
      dancing.fadeOut(0.2);
      idle.reset().fadeIn(0.2).play();
      setCurrentAction("idle");
    };
    mixer.addEventListener("finished", onFinished);
  }, [isLoading]);

  useEffect(() => {
    if (!containerRef.current) return;
    const fallbackAnimFiles = [
      { name: "idle", path: "/models/standing idle 01.fbx" },
      { name: "walkForward", path: "/models/standing walk forward.fbx" },
      { name: "walkBack", path: "/models/standing walk back.fbx" },
      { name: "walkLeft", path: "/models/standing walk left.fbx" },
      { name: "walkRight", path: "/models/standing walk right.fbx" },
      { name: "runForward", path: "/models/standing run forward.fbx" },
      { name: "runBack", path: "/models/standing run back.fbx" },
      { name: "runLeft", path: "/models/standing run left.fbx" },
      { name: "runRight", path: "/models/standing run right.fbx" },
      { name: "turnLeft", path: "/models/standing turn 90 left.fbx" },
      { name: "turnRight", path: "/models/standing turn 90 right.fbx" },
      { name: "boxing", path: "/models/Boxing.fbx" },
      {
        name: "dancing",
        path: `/models/${encodeURIComponent("Silly Dancing.fbx")}`,
      },
    ];

    let disposed = false;
    let releaseIbl: (() => void) | null = null;

    const init = async () => {
      const { root: object, clips: embeddedClips } =
        await loadHeroModel(modelPath);
      if (disposed) return;
      modelRef.current = object;

      // Normalize to ~2.0 units tall (character height) and plant feet on y=-1.
      const { feetOffsetY } = normalizeHeroHeight(object, 2.0);
      object.position.set(0, -1 + feetOffsetY, 0);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        38,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000,
      );
      camera.position.set(3.2, 0.6, 5.2);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
      });
      renderer.setSize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight,
      );
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      releaseIbl = await tryAttachHeroIbl(scene, renderer);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 2.0;
      controls.enableZoom = true;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI / 2;
      controls.minDistance = 3;
      controls.maxDistance = 15;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0x404060);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
      mainLight.position.set(5, 10, 7);
      mainLight.castShadow = true;
      mainLight.receiveShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      const d = 10;
      mainLight.shadow.camera.left = -d;
      mainLight.shadow.camera.right = d;
      mainLight.shadow.camera.top = d;
      mainLight.shadow.camera.bottom = -d;
      mainLight.shadow.camera.near = 2;
      mainLight.shadow.camera.far = 20;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xffaa88, 0.8);
      fillLight.position.set(-5, 3, 5);
      scene.add(fillLight);

      const backLight = new THREE.DirectionalLight(0x88aaff, 0.5);
      backLight.position.set(0, 2, -10);
      scene.add(backLight);

      const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
      gridHelper.position.y = -1;
      scene.add(gridHelper);

      const planeGeometry = new THREE.CircleGeometry(8, 32);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x223344,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.3,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -1;
      plane.receiveShadow = true;
      scene.add(plane);

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(object);

      const mixer = new THREE.AnimationMixer(object);
      mixerRef.current = mixer;

      const loadedAnimations: { [key: string]: THREE.AnimationClip } = {};

      const tryRegister = (
        actionName: string,
        clip: THREE.AnimationClip | null,
      ) => {
        if (!clip) return false;
        loadedAnimations[actionName] = clip;
        const action = mixer.clipAction(clip);
        animationsRef.current.set(actionName, action);
        if (actionName === "idle") action.play();
        return true;
      };

      const embedIdle = pickClip(embeddedClips, ["idle"]);
      if (embedIdle) {
        tryRegister("idle", embedIdle);
        tryRegister(
          "walkForward",
          pickClip(embeddedClips, [
            "walkforward",
            "walk_forward",
            "walk",
            "forward",
          ]) ?? embedIdle,
        );
        tryRegister(
          "walkBack",
          pickClip(embeddedClips, ["walkback", "walk_back", "back"]) ??
            embedIdle,
        );
        tryRegister(
          "walkLeft",
          pickClip(embeddedClips, ["walkleft", "walk_left", "left"]) ??
            embedIdle,
        );
        tryRegister(
          "walkRight",
          pickClip(embeddedClips, ["walkright", "walk_right", "right"]) ??
            embedIdle,
        );
        tryRegister(
          "runForward",
          pickClip(embeddedClips, ["runforward", "run"]) ?? embedIdle,
        );
        tryRegister(
          "runBack",
          pickClip(embeddedClips, ["runback"]) ?? embedIdle,
        );
        tryRegister(
          "runLeft",
          pickClip(embeddedClips, ["runleft"]) ?? embedIdle,
        );
        tryRegister(
          "runRight",
          pickClip(embeddedClips, ["runright"]) ?? embedIdle,
        );
        tryRegister(
          "turnLeft",
          pickClip(embeddedClips, ["turnleft", "turn_left"]) ?? embedIdle,
        );
        tryRegister(
          "turnRight",
          pickClip(embeddedClips, ["turnright", "turn_right"]) ?? embedIdle,
        );
        const boxingClip = pickClip(embeddedClips, [
          "boxing",
          "box",
          "punch",
          "fight",
          "jab",
          "hook",
        ]);
        if (boxingClip) tryRegister("boxing", boxingClip);
        const danceClip = pickClip(embeddedClips, [
          "dance",
          "dancing",
          "silly",
          "groove",
          "hiphop",
          "hip_hop",
        ]);
        if (danceClip) tryRegister("dancing", danceClip);
        setAnimations({ ...loadedAnimations });
        setIsLoading(false);
        if (!loadedAnimations["boxing"]) {
          new FBXLoader().load("/models/Boxing.fbx", (animObject) => {
            if (disposed) return;
            const clip = animObject.animations?.[0];
            if (!clip) return;
            tryRegister("boxing", clip);
            setAnimations({ ...loadedAnimations });
          });
        }
        if (!loadedAnimations["dancing"]) {
          new FBXLoader().load(
            `/models/${encodeURIComponent("Silly Dancing.fbx")}`,
            (animObject) => {
              if (disposed) return;
              const clip = animObject.animations?.[0];
              if (!clip) return;
              tryRegister("dancing", clip);
              setAnimations({ ...loadedAnimations });
            },
          );
        }
      } else {
        const fbxLoader = new FBXLoader();
        let loadedCount = 0;
        fallbackAnimFiles.forEach((file) => {
          fbxLoader.load(file.path, (animObject) => {
            if (animObject.animations && animObject.animations.length > 0) {
              tryRegister(file.name, animObject.animations[0]);
            }
            loadedCount++;
            if (loadedCount === fallbackAnimFiles.length) {
              setAnimations(loadedAnimations);
              setIsLoading(false);
            }
          });
        });
      }

      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixerRef.current) mixerRef.current.update(delta);
        if (controlsRef.current) controlsRef.current.update();
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current)
          return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };
      window.addEventListener("resize", handleResize);

      resizeCleanupRef.current = () => {
        window.removeEventListener("resize", handleResize);
        releaseIbl?.();
        releaseIbl = null;
        if (rendererRef.current && containerRef.current) {
          if (containerRef.current.contains(rendererRef.current.domElement)) {
            containerRef.current.removeChild(rendererRef.current.domElement);
          }
        }
        rendererRef.current?.dispose();
      };
    };

    const resizeCleanupRef: { current: null | (() => void) } = {
      current: null,
    };
    void init().catch((err) => {
      console.warn("HeroActor: failed to load model", modelPath, err);
      setIsLoading(false);
    });

    return () => {
      disposed = true;
      resizeCleanupRef.current?.();
    };
  }, [backgroundColor, autoRotate, modelPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsSelected((prev) => !prev);
      }

      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setIsLocked(true);
      }

      if (e.code === "KeyF") {
        e.preventDefault();
        triggerBoxing();
        return;
      }

      if (e.code === "Digit1" || e.code === "Numpad1") {
        e.preventDefault();
        triggerDance();
        return;
      }

      if (
        currentActionRef.current === "boxing" ||
        currentActionRef.current === "dancing"
      )
        return;

      let newAction: string | null = null;

      switch (e.code) {
        case "KeyW":
          newAction = e.shiftKey ? "runForward" : "walkForward";
          break;
        case "KeyS":
          newAction = e.shiftKey ? "runBack" : "walkBack";
          break;
        case "KeyA":
          newAction = e.shiftKey ? "runLeft" : "walkLeft";
          break;
        case "KeyD":
          newAction = e.shiftKey ? "runRight" : "walkRight";
          break;
        case "KeyQ":
          newAction = "turnLeft";
          break;
        case "KeyE":
          newAction = "turnRight";
          break;
        default:
          return;
      }

      if (newAction && newAction !== currentActionRef.current) {
        const current = animationsRef.current.get(
          currentActionRef.current,
        );
        const next = animationsRef.current.get(newAction);

        if (current && next) {
          current.fadeOut(0.2);
          next.reset().fadeIn(0.2).play();
          setCurrentAction(newAction);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setIsLocked(false);
      }

      if (["KeyW", "KeyS", "KeyA", "KeyD", "KeyQ", "KeyE"].includes(e.code)) {
        if (
          currentActionRef.current === "boxing" ||
          currentActionRef.current === "dancing"
        )
          return;
        const idle = animationsRef.current.get("idle");
        const current = animationsRef.current.get(currentAction);

        if (idle && current && currentActionRef.current !== "idle") {
          current.fadeOut(0.2);
          idle.reset().fadeIn(0.2).play();
          setCurrentAction("idle");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentAction, isLoading, triggerBoxing, triggerDance]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[500px] overflow-hidden ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="text-white text-xl">Loading Hero Actor...</div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm z-20">
        {isSelected ? "✨ Selected" : "Click space to select"} |{" "}
        {isLocked ? "🔒 Locked" : "Shift to lock"}
      </div>

      <div className="absolute bottom-4 right-4 z-20 max-w-[min(100%,14rem)] rounded bg-black/50 px-2.5 py-1.5 text-left text-[11px] text-white sm:text-xs">
        <span className="text-zinc-500">Анимаци</span>
        <div className="mt-0.5 flex items-center gap-1.5 font-medium leading-tight text-amber-100/95">
          <span className="shrink-0 text-base" aria-hidden>
            {heroActionIcon(currentAction)}
          </span>
          <span className="min-w-0 truncate">{currentAction}</span>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-20 max-w-[min(100%,22rem)] text-wrap rounded bg-black/50 px-3 py-2 text-[10px] leading-snug text-white sm:text-[11px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            <span aria-hidden>🚶</span> WASD алхах
          </span>
          <span className="text-zinc-500">·</span>
          <span>
            <span aria-hidden>🏃</span> Shift+WASD гүйх
          </span>
          <span className="text-zinc-500">·</span>
          <span>
            <span aria-hidden>↩️</span> Q/E эргэх
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 pt-1.5">
          <span className="font-semibold text-amber-200/95">
            <span aria-hidden>💃</span> 1 бүжиг
          </span>
          <span className="text-zinc-500">·</span>
          <span className="font-semibold text-amber-200/95">
            <span aria-hidden>🥊</span> F бокс
          </span>
        </div>
      </div>

      {(animations.boxing || animations.dancing) && (
        <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 touch-manipulation gap-3 sm:bottom-24">
          {animations.dancing && (
            <button
              type="button"
              aria-label="Бүжгийн хөдөлгөөн тоглуулах"
              title="1 — бүжиг"
              disabled={isLoading}
              onClick={() => triggerDance()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-fuchsia-500/45 bg-black/60 text-2xl leading-none shadow-lg transition hover:bg-fuchsia-950/35 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              💃
            </button>
          )}
          {animations.boxing && (
            <button
              type="button"
              aria-label="Боксын хөдөлгөөн тоглуулах"
              title="F — бокс"
              disabled={isLoading}
              onClick={() => triggerBoxing()}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/50 bg-black/60 text-2xl leading-none text-amber-100 shadow-lg transition hover:bg-amber-950/50 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              🥊
            </button>
          )}
        </div>
      )}
    </div>
  );
}
