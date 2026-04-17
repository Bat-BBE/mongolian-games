import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone as skelClone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type HeroClips = Record<string, THREE.AnimationClip>;

const fbxLoader = new FBXLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();
const clipCache = new Map<string, Promise<THREE.AnimationClip>>();

export async function loadFbxModel(modelPath: string): Promise<THREE.Group> {
  const key = modelPath.trim();
  if (!key) throw new Error("Missing modelPath");
  let p = modelCache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      fbxLoader.load(
        key,
        (obj) => resolve(obj),
        undefined,
        (err) => reject(err),
      );
    });
    modelCache.set(key, p);
  }
  const base = await p;
  // FBX models often include skeletons; use SkeletonUtils.clone for safe reuse.
  return skelClone(base) as THREE.Group;
}

export async function loadFbxClip(path: string): Promise<THREE.AnimationClip> {
  const key = path.trim();
  if (!key) throw new Error("Missing clip path");
  let p = clipCache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      fbxLoader.load(
        key,
        (animObj) => {
          const clip = animObj.animations?.[0];
          if (!clip) reject(new Error(`Missing animation clip in ${key}`));
          else resolve(clip);
        },
        undefined,
        (err) => reject(err),
      );
    });
    clipCache.set(key, p);
  }
  return await p;
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

