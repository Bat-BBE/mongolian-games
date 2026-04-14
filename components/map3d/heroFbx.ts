import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export type HeroClips = Record<string, THREE.AnimationClip>;

export async function loadFbxModel(modelPath: string): Promise<THREE.Group> {
  const loader = new FBXLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (obj) => resolve(obj),
      undefined,
      (err) => reject(err),
    );
  });
}

export async function loadFbxClip(path: string): Promise<THREE.AnimationClip> {
  const loader = new FBXLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (animObj) => {
        const clip = animObj.animations?.[0];
        if (!clip) reject(new Error(`Missing animation clip in ${path}`));
        else resolve(clip);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

export async function loadHeroClips(
  clipsByName: Record<string, string>,
): Promise<HeroClips> {
  const entries = await Promise.all(
    Object.entries(clipsByName).map(async ([name, path]) => {
      const clip = await loadFbxClip(path);
      clip.name = name;
      return [name, clip] as const;
    }),
  );
  return Object.fromEntries(entries) as HeroClips;
}

export function createHeroAnimator(
  root: THREE.Object3D,
  clips: HeroClips,
): {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  play: (name: string, fadeSec?: number) => void;
} {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map<string, THREE.AnimationAction>();
  for (const [name, clip] of Object.entries(clips)) {
    const action = mixer.clipAction(clip);
    action.clampWhenFinished = false;
    if (name === "walk" || name === "run" || name === "idle") {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    actions.set(name, action);
  }

  let current = "";
  const play = (name: string, fadeSec = 0.25) => {
    const next = actions.get(name);
    if (!next) return;
    if (current === name) {
      if (!next.isRunning()) {
        next.reset().fadeIn(0.08).play();
      }
      return;
    }
    const cur = current ? actions.get(current) : undefined;
    if (cur && cur !== next) cur.fadeOut(fadeSec);
    next.reset().fadeIn(fadeSec).play();
    current = name;
  };

  return { mixer, actions, play };
}

