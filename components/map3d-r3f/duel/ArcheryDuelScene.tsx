"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { materialLibrary } from "@/components/dashboard/MaterialLibrary";
import { terrainHeight } from "@/components/dashboard/sceneHelpers";
import type { HeroKinematic } from "../controls/heroKinematic";
import type { MapPresencePeer } from "@/hooks/useMapPresence";
import type { DuelDrawState } from "./duelDrawState";
import type { DuelPhase, DuelShot } from "./useArcheryDuel";

const ARROW_FLIGHT_MS = 550;
const IMPACT_FX_MS = 450;
/** How far the nock pulls back (meters) at full draw power. */
const MAX_DRAW = 0.42;
const ARCHER_HEIGHT = 1.25;

type FlyingArrow = {
  group: THREE.Group;
  from: THREE.Vector3;
  to: THREE.Vector3;
  startedAt: number;
  arcHeight: number;
  mine: boolean;
};

type ImpactFx = {
  mesh: THREE.Mesh;
  startedAt: number;
};

function buildBow(): THREE.Group {
  const group = new THREE.Group();
  const wood = materialLibrary.getWoodMaterial();
  const arc = Math.PI * 0.92;
  const limb = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.024, 6, 16, arc), wood);
  limb.rotation.z = Math.PI / 2 - arc / 2;
  group.add(limb);
  return group;
}

function buildStringLine(): THREE.Line {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9), 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xe8e2cf });
  return new THREE.Line(geo, mat);
}

function buildArrow(): THREE.Group {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6),
    materialLibrary.getWoodMaterial(),
  );
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.09, 6),
    materialLibrary.getColorMaterial(0x8a8a8a, 0.4, 0.5),
  );
  head.rotation.z = -Math.PI / 2;
  head.position.x = 0.32;
  group.add(head);

  const finMat = materialLibrary.getColorMaterial(0x7a1f1f, 0.8, 0);
  const finGeo = new THREE.BoxGeometry(0.1, 0.002, 0.06);
  const finA = new THREE.Mesh(finGeo, finMat);
  finA.position.set(-0.24, 0, 0);
  group.add(finA);
  const finB = new THREE.Mesh(finGeo, finMat);
  finB.position.set(-0.24, 0, 0);
  finB.rotation.x = Math.PI / 2;
  group.add(finB);

  return group;
}

function buildImpact(hit: boolean): THREE.Mesh {
  const base = materialLibrary.getEmissiveMaterial(hit ? 0xf3c23c : 0x9a9a9a, hit ? 1.4 : 0.6);
  const mat = base.clone();
  mat.transparent = true;
  return new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat);
}

/** Positions one archer's bow+string+nocked-arrow, facing `yaw`, at world
 * position `pos`, with the string pulled back by `drawAmount` meters. */
function placeArcher(
  bow: THREE.Group,
  line: THREE.Line,
  heldArrow: THREE.Group,
  pos: THREE.Vector3,
  yaw: number,
  drawAmount: number,
  showHeld: boolean,
) {
  bow.position.copy(pos);
  bow.rotation.set(0, yaw, 0);

  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
  const topLocal = new THREE.Vector3(0, 0.32, 0).addScaledVector(forward, 0.08);
  const bottomLocal = new THREE.Vector3(0, -0.32, 0).addScaledVector(forward, 0.08);
  const nockLocal = forward.clone().multiplyScalar(0.08 - drawAmount);

  const posAttr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
  posAttr.setXYZ(0, topLocal.x, topLocal.y, topLocal.z);
  posAttr.setXYZ(1, nockLocal.x, nockLocal.y, nockLocal.z);
  posAttr.setXYZ(2, bottomLocal.x, bottomLocal.y, bottomLocal.z);
  posAttr.needsUpdate = true;
  line.position.copy(pos);

  heldArrow.visible = showHeld;
  heldArrow.position.copy(pos).add(nockLocal);
  heldArrow.rotation.set(0, yaw, 0);
}

/**
 * In-world visuals for the duel: a bow+string for each archer (string pulls
 * back live while charging), a flying-arrow projectile spawned on release,
 * and a small hit/miss burst on arrival. No new GLB assets — primitive
 * geometry + the existing MaterialLibrary, matching the rest of the map's
 * procedural props (ger/ovoo/etc).
 */
export function ArcheryDuelScene({
  phase,
  opponentPresenceId,
  myShot,
  opponentShot,
  myHit,
  opponentHit,
  myDrawRef,
  heroKinematicRef,
  remotePeersRef,
}: {
  phase: DuelPhase;
  opponentPresenceId: string | null;
  myShot: DuelShot | null;
  opponentShot: DuelShot | null;
  myHit: boolean | null;
  opponentHit: boolean | null;
  myDrawRef: React.RefObject<DuelDrawState>;
  heroKinematicRef: React.RefObject<HeroKinematic>;
  remotePeersRef: React.RefObject<MapPresencePeer[]>;
}) {
  const { scene } = useThree();
  const active = phase === "countdown" || phase === "aiming" || phase === "resolved";

  const rigRef = useRef<{
    myBow: THREE.Group;
    myString: THREE.Line;
    myArrow: THREE.Group;
    oppBow: THREE.Group;
    oppString: THREE.Line;
    oppArrow: THREE.Group;
  } | null>(null);
  const myFiredRef = useRef(false);
  const oppFiredRef = useRef(false);
  const flyingRef = useRef<FlyingArrow[]>([]);
  const impactsRef = useRef<ImpactFx[]>([]);

  useEffect(() => {
    if (!active) return;
    const rig = {
      myBow: buildBow(),
      myString: buildStringLine(),
      myArrow: buildArrow(),
      oppBow: buildBow(),
      oppString: buildStringLine(),
      oppArrow: buildArrow(),
    };
    scene.add(rig.myBow, rig.myString, rig.myArrow, rig.oppBow, rig.oppString, rig.oppArrow);
    rigRef.current = rig;
    myFiredRef.current = false;
    oppFiredRef.current = false;

    return () => {
      scene.remove(rig.myBow, rig.myString, rig.myArrow, rig.oppBow, rig.oppString, rig.oppArrow);
      for (const f of flyingRef.current) scene.remove(f.group);
      for (const fx of impactsRef.current) scene.remove(fx.mesh);
      flyingRef.current = [];
      impactsRef.current = [];
      rigRef.current = null;
    };
  }, [active, scene]);

  useFrame(() => {
    if (!active) return;
    const rig = rigRef.current;
    if (!rig) return;

    const kin = heroKinematicRef.current;
    const opp = opponentPresenceId
      ? remotePeersRef.current.find((p) => p.id === opponentPresenceId) ?? null
      : null;

    const myPos = kin?.has
      ? new THREE.Vector3(kin.pos.x, terrainHeight(kin.pos.x, kin.pos.z) + ARCHER_HEIGHT, kin.pos.z)
      : null;
    const oppPos = opp
      ? new THREE.Vector3(opp.x, terrainHeight(opp.x, opp.z) + ARCHER_HEIGHT, opp.z)
      : null;

    if (myPos && oppPos) {
      const myYaw = Math.atan2(oppPos.x - myPos.x, oppPos.z - myPos.z);
      const oppYaw = Math.atan2(myPos.x - oppPos.x, myPos.z - oppPos.z);

      const myDrawAmount =
        phase === "aiming" && !myFiredRef.current ? (myDrawRef.current?.power ?? 0) * MAX_DRAW : 0;
      placeArcher(rig.myBow, rig.myString, rig.myArrow, myPos, myYaw, myDrawAmount, phase === "aiming" && !myFiredRef.current);
      placeArcher(rig.oppBow, rig.oppString, rig.oppArrow, oppPos, oppYaw, 0, phase === "aiming" && !oppFiredRef.current);

      if (myShot && !myFiredRef.current) {
        myFiredRef.current = true;
        flyingRef.current.push(spawnFlight(scene, myPos, oppPos, myShot.power, true));
      }
      if (opponentShot && !oppFiredRef.current) {
        oppFiredRef.current = true;
        flyingRef.current.push(spawnFlight(scene, oppPos, myPos, opponentShot.power, false));
      }
    }

    const now = performance.now();
    flyingRef.current = flyingRef.current.filter((f) => {
      const t = Math.min(1, (now - f.startedAt) / ARROW_FLIGHT_MS);
      const pos = f.from.clone().lerp(f.to, t);
      pos.y += Math.sin(Math.PI * t) * f.arcHeight;
      f.group.position.copy(pos);
      const dir = f.to.clone().sub(f.from);
      f.group.rotation.set(0, Math.atan2(dir.x, dir.z), 0);
      if (t >= 1) {
        scene.remove(f.group);
        const hit = (f.mine ? myHit : opponentHit) ?? false;
        const mesh = buildImpact(hit);
        mesh.position.copy(f.to);
        scene.add(mesh);
        impactsRef.current.push({ mesh, startedAt: now });
        return false;
      }
      return true;
    });

    impactsRef.current = impactsRef.current.filter((fx) => {
      const t = (now - fx.startedAt) / IMPACT_FX_MS;
      if (t >= 1) {
        scene.remove(fx.mesh);
        return false;
      }
      fx.mesh.scale.setScalar(0.3 + t * 1.6);
      (fx.mesh.material as THREE.MeshStandardMaterial).opacity = 1 - t;
      return true;
    });
  });

  return null;
}

function spawnFlight(
  scene: THREE.Scene,
  from: THREE.Vector3,
  to: THREE.Vector3,
  power: number,
  mine: boolean,
): FlyingArrow {
  const group = buildArrow();
  scene.add(group);
  return {
    group,
    from: from.clone(),
    to: to.clone(),
    startedAt: performance.now(),
    arcHeight: 0.5 + power * 1.3,
    mine,
  };
}
