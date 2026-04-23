import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as skelClone } from "three/examples/jsm/utils/SkeletonUtils.js";

export type HeroClips = Record<string, THREE.AnimationClip>;

export type HeroModel = {
  root: THREE.Group;
  clips: THREE.AnimationClip[];
};

const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, Promise<THREE.Group>>();
const heroModelCache = new Map<
  string,
  Promise<{ root: THREE.Group; clips: THREE.AnimationClip[] }>
>();
const clipCache = new Map<string, Promise<THREE.AnimationClip>>();

function setDataTextureColorSpaces(
  mat: THREE.Material,
  sRGB: typeof THREE.SRGBColorSpace,
  linear: typeof THREE.NoColorSpace,
) {
  const setL = (tex: THREE.Texture | null | undefined) => {
    if (tex && "colorSpace" in tex) (tex as THREE.Texture).colorSpace = linear;
  };
  if (
    mat instanceof THREE.MeshStandardMaterial ||
    mat instanceof THREE.MeshPhysicalMaterial
  ) {
    if (mat.map) mat.map.colorSpace = sRGB;
    if (mat.emissiveMap) mat.emissiveMap.colorSpace = sRGB;
    setL(mat.normalMap);
    setL(mat.roughnessMap);
    setL(mat.metalnessMap);
    setL(mat.aoMap);
    setL(mat.bumpMap);
    setL(mat.alphaMap);
    setL(mat.lightMap);
    setL(mat.displacementMap);
  }
  if (mat instanceof THREE.MeshPhysicalMaterial) {
    setL(mat.clearcoatNormalMap);
    setL(mat.sheenColorMap);
    setL(mat.sheenRoughnessMap);
    setL(mat.specularColorMap);
    setL(mat.specularIntensityMap);
  }
  if (
    mat instanceof THREE.MeshLambertMaterial ||
    mat instanceof THREE.MeshPhongMaterial
  ) {
    if (mat.map) mat.map.colorSpace = sRGB;
    if (mat.emissiveMap) mat.emissiveMap.colorSpace = sRGB;
    setL(mat.normalMap);
    setL(mat.bumpMap);
    setL(mat.specularMap);
    setL(mat.lightMap);
    setL(mat.alphaMap);
  }
}

export function fixHeroMaterialsForDisplay(root: THREE.Object3D): void {
  const sRGB = THREE.SRGBColorSpace;
  const linear = THREE.NoColorSpace;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const mesh = o;
    if (!mesh.geometry) return;
    const g = mesh.geometry;
    const hasVertexColor = !!g.getAttribute("color");
    const mats: THREE.Material[] = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        if (hasVertexColor) mat.vertexColors = true;
        setDataTextureColorSpaces(mat, sRGB, linear);
        if (
          mat.envMap == null &&
          mat.metalness > 0.55 &&
          mat.metalnessMap == null
        ) {
          mat.metalness = Math.min(mat.metalness * 0.45, 0.42);
          mat.roughness = Math.max(mat.roughness, 0.28);
        }
        const sum = mat.color.r + mat.color.g + mat.color.b;
        if (sum < 0.04 && !mat.map && !hasVertexColor) {
          mat.color.setRGB(0.88, 0.88, 0.9);
        }
        if (mat.envMap == null) mat.envMapIntensity = 1.0;
      } else if (
        mat instanceof THREE.MeshLambertMaterial ||
        mat instanceof THREE.MeshPhongMaterial
      ) {
        if (hasVertexColor) mat.vertexColors = true;
        setDataTextureColorSpaces(mat, sRGB, linear);
        const sum = mat.color.r + mat.color.g + mat.color.b;
        if (sum < 0.04 && !mat.map && !hasVertexColor) {
          mat.color.setRGB(0.78, 0.78, 0.8);
        }
      }
    }
  });
}

function extractUrlBase(url: string): string {
  const clean = url.split("?")[0] ?? url;
  const i = clean.lastIndexOf("/");
  if (i <= 0) return "/";
  return clean.slice(0, i + 1);
}

function createFbxLoaderForUrl(assetUrl: string): FBXLoader {
  const loader = new FBXLoader();
  loader.setResourcePath(extractUrlBase(assetUrl));
  return loader;
}

function extOf(path: string): string {
  const q = path.indexOf("?");
  const clean = q >= 0 ? path.slice(0, q) : path;
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

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

export const MAP_HERO_HEIGHT_NORMAL = 200;
export const MAP_HERO_WORLD_UNIT = 0.015;

export function applyMapHeroWorldScale(root: THREE.Object3D): void {
  normalizeHeroHeight(root, MAP_HERO_HEIGHT_NORMAL);
  root.scale.multiplyScalar(MAP_HERO_WORLD_UNIT);
}

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
              (
                root as unknown as { animations: THREE.AnimationClip[] }
              ).animations = gltf.animations ?? [];
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
          createFbxLoaderForUrl(key).load(
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
  const clone = skelClone(base.root) as THREE.Group;
  fixHeroMaterialsForDisplay(clone);
  return { root: clone, clips: base.clips };
}

export async function loadFbxModel(modelPath: string): Promise<THREE.Group> {
  const key = modelPath.trim();
  if (!key) throw new Error("Missing modelPath");
  let p = modelCache.get(key);
  if (!p) {
    p = new Promise((resolve, reject) => {
      createFbxLoaderForUrl(key).load(
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
      createFbxLoaderForUrl(key).load(
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
