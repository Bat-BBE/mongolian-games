import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skelClone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type HeroClips = Record<string, THREE.AnimationClip>;

/**
 * Loaded hero model with optional embedded animation clips (GLB can carry its
 * own clips, FBX sometimes does too).
 */
export type HeroModel = {
  root: THREE.Group;
  clips: THREE.AnimationClip[];
};

const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();
const heroModelCache = new Map<
  string,
  Promise<{ root: THREE.Group; clips: THREE.AnimationClip[] }>
>();
const clipCache = new Map<string, Promise<THREE.AnimationClip>>();

function extOf(path: string): string {
  const q = path.indexOf("?");
  const clean = q >= 0 ? path.slice(0, q) : path;
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

/**
 * Measure a model's visible vertical extent. Prefer SkinnedMesh bounding
 * boxes (the actual character geometry) over props / environment helpers
 * that otherwise inflate the box and shrink the character.
 */
export function measureHeroBox(obj: THREE.Object3D): THREE.Box3 {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let foundSkin = false;
  obj.traverse((o) => {
    const sm = o as Partial<THREE.SkinnedMesh> & { isSkinnedMesh?: boolean };
    if (sm.isSkinnedMesh) {
      const mb = new THREE.Box3().setFromObject(o);
      if (!foundSkin) {
        box.copy(mb);
        foundSkin = true;
      } else {
        box.union(mb);
      }
    }
  });
  if (!foundSkin) box.setFromObject(obj);
  return box;
}

/** Normalize an object's overall scale so its vertical extent matches
 *  `targetHeight`. Also returns `feetOffsetY` the caller can use to plant
 *  the feet on the ground (`position.y = groundY + feetOffsetY`). */
export function normalizeHeroHeight(
  obj: THREE.Object3D,
  targetHeight: number,
): { scale: number; feetOffsetY: number } {
  const box = measureHeroBox(obj);
  const size = box.getSize(new THREE.Vector3());
  if (!isFinite(size.y) || size.y <= 0) {
    return { scale: 1, feetOffsetY: 0 };
  }
  const s = targetHeight / size.y;
  obj.scale.multiplyScalar(s);
  const box2 = measureHeroBox(obj);
  return { scale: s, feetOffsetY: -box2.min.y };
}

/** Find the first clip whose name contains any of `names` (case-insensitive). */
export function pickClip(
  clips: THREE.AnimationClip[],
  names: string[],
): THREE.AnimationClip | null {
  for (const clip of clips) {
    const lc = (clip.name || "").toLowerCase();
    for (const n of names) {
      if (n && lc.includes(n.toLowerCase())) return clip;
    }
  }
  return null;
}

/**
 * Adapt a clip's track names to the actual bone names of `root`. Mixamo's
 * "standing idle/walk/run" FBX exports use bone names like `mixamorigHips`,
 * while GLB models exported through glTF often have the colon-less versions
 * `Hips` (or `mixamorig:Hips`). If the track's target bone doesn't exist in
 * the skeleton, `AnimationMixer` silently does nothing, so we try a few
 * common prefix variants before giving up.
 */
/** Скелетон дээр үнэхээр холбогдсон track-ийн тоо (буруу rig-д бага байвал анимаа алгасахад). */
export function countClipTracksBindingToRig(
  clip: THREE.AnimationClip,
  root: THREE.Object3D,
): number {
  const names = new Set<string>();
  root.traverse((o) => {
    if (o.name) names.add(o.name);
  });
  let n = 0;
  for (const t of clip.tracks) {
    const dot = t.name.indexOf(".");
    if (dot < 0) continue;
    const boneName = t.name.slice(0, dot);
    if (names.has(boneName)) n++;
  }
  return n;
}

export function retargetClipToSkeleton(
  clip: THREE.AnimationClip,
  root: THREE.Object3D,
): THREE.AnimationClip {
  const names = new Set<string>();
  root.traverse((o) => {
    if (o.name) names.add(o.name);
  });
  const tryNames = (bone: string): string | null => {
    if (names.has(bone)) return bone;
    const stripped = bone.replace(/^mixamorig[:_]?/i, "");
    if (names.has(stripped)) return stripped;
    if (names.has(`mixamorig${stripped}`)) return `mixamorig${stripped}`;
    if (names.has(`mixamorig:${stripped}`)) return `mixamorig:${stripped}`;
    if (names.has(`mixamorig_${stripped}`)) return `mixamorig_${stripped}`;
    return null;
  };

  let changed = false;
  const tracks = clip.tracks.map((t) => {
    const dot = t.name.indexOf(".");
    if (dot < 0) return t;
    const boneName = t.name.slice(0, dot);
    const prop = t.name.slice(dot);
    const mapped = tryNames(boneName);
    if (!mapped || mapped === boneName) return t;
    const nt = t.clone();
    nt.name = mapped + prop;
    changed = true;
    return nt;
  });
  if (!changed) return clip;
  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  return out;
}

/**
 * Load a hero model from either FBX or GLB based on file extension. Returns
 * a cloned scene (safe to add to multiple scenes) and any embedded clips.
 */
export async function loadHeroModel(modelPath: string): Promise<HeroModel> {
  const key = modelPath.trim();
  if (!key) throw new Error("Missing modelPath");

  let p = heroModelCache.get(key);
  if (!p) {
    const ext = extOf(key);
    if (ext === "glb" || ext === "gltf") {
      p = new Promise<{ root: THREE.Group; clips: THREE.AnimationClip[] }>(
        (resolve, reject) => {
          gltfLoader.load(
            key,
            (gltf) => {
              const root = gltf.scene as unknown as THREE.Group;
              // Stash clips on the root so SkeletonUtils.clone callers can
              // retrieve them later if needed.
              (root as unknown as { animations: THREE.AnimationClip[] })
                .animations = gltf.animations ?? [];
              resolve({ root, clips: gltf.animations ?? [] });
            },
            undefined,
            (err) => reject(err),
          );
        },
      );
    } else {
      p = new Promise<{ root: THREE.Group; clips: THREE.AnimationClip[] }>(
        (resolve, reject) => {
          fbxLoader.load(
            key,
            (obj) => {
              resolve({ root: obj, clips: obj.animations ?? [] });
            },
            undefined,
            (err) => reject(err),
          );
        },
      );
    }
    heroModelCache.set(key, p);
  }

  const base = await p;
  // Clone with SkeletonUtils so multiple scenes can share the same source.
  const clone = skelClone(base.root) as THREE.Group;
  return { root: clone, clips: base.clips };
}

/** Back-compat: keep the legacy name in case external code still imports it.
 *  Only use for FBX models. */
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

