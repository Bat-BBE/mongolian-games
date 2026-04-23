import * as THREE from "three";
import { PMREMGenerator } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

export const HERO_STUDIO_HDR_EXAMPLE = "/hdr/hero-studio.hdr";

function hdrPathFromOptionsOrEnv(explicit?: string | null): string {
  const t = (explicit ?? "").trim();
  if (t) return t;
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERO_HDR) {
    return String(process.env.NEXT_PUBLIC_HERO_HDR).trim();
  }
  return "";
}

export async function attachEquirectHdrToHeroScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  url: string,
): Promise<() => void> {
  const loader = new HDRLoader();
  const texture = await loader.loadAsync(url);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  scene.environment = target.texture;
  return () => {
    scene.environment = null;
    target.dispose();
    texture.dispose();
    pmrem.dispose();
  };
}

/**
 * PBR-ийн IBL: эхлээд (заасан/ env-аас) HDR оролдоно, дараа нь `RoomEnvironment`.
 */
export async function tryAttachHeroIbl(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  options?: { hdrPath?: string | null; roomSigma?: number },
): Promise<() => void> {
  const url = hdrPathFromOptionsOrEnv(options?.hdrPath);
  if (url) {
    try {
      return await attachEquirectHdrToHeroScene(scene, renderer, url);
    } catch {
      /* алдаа: HDR байхгүй/буруу зам — доороос сэргээнэ */
    }
  }
  return attachRoomIblToHeroScene(
    scene,
    renderer,
    options?.roomSigma ?? 0.04,
  );
}

/**
 * PBR (metal/rough, leather, specular) материалууд рэнгэн тусгалгүй "бараан" харагдаж
 * болохын шалтгаан нь ихэвчлэн scene.environment (IBL) дутуу эсвэл albedo-г биш
 * data map-уудыг sRGB-ээр уншуулсан тул — studio-тай таний зургийнх шиг
 * "жинхэнэ" PBR-ийн сүүдэр/гэрлийн задрал авахын тулд энгийн "өрөө"
 * (RoomEnvironment) ашигладаг.
 */
export function attachRoomIblToHeroScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  sigma: number = 0.04,
): () => void {
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const target = pmrem.fromScene(room, sigma);
  scene.environment = target.texture;
  return () => {
    scene.environment = null;
    target.dispose();
    room.dispose();
    pmrem.dispose();
  };
}
