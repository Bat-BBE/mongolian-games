import * as THREE from "three";
import { terrainHeight, projectToScreen } from "./sceneHelpers";
import type { HorseEntry, CloudEntry, BirdEntry } from "./SceneBuilder";

export type LabelPos = { x: number; y: number; visible: boolean };

interface AnimationControllerOptions {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  container: HTMLDivElement;
  sun: THREE.DirectionalLight;
  horses: HorseEntry[];
  clouds: CloudEntry[];
  birds: BirdEntry[];
  markerMeshes: Map<string, THREE.Mesh>;
  labelAnchors: Map<string, THREE.Vector3>;
  doorAnchors?: Map<string, THREE.Vector3>;
  heroMixerRef?: { current: THREE.AnimationMixer | null };
  /** Screen projection for map overlays (direction arrows from hero). */
  heroRootRef?: { current: THREE.Object3D | null };
  /**
   * FBX walk/run нь явагчийн байрлал/эргэлтийг клипээр шилжүүлдэг тул mixer.update()
   * дараа кодоор тооцсон газар дээр буцаана.
   */
  heroKinematicRef?: {
    current: { pos: THREE.Vector3; ry: number; has: boolean };
  };
  currentStationId: string;
  /** UI шошгууд өндөр цэг; сум — газар орчмын төсөл. */
  onLabelUpdate: (
    uiPositions: Record<string, LabelPos>,
    arrowPositions: Record<string, LabelPos>,
  ) => void;
  onBeforeRender?: (elapsed: number, delta: number) => void;
}

export class AnimationController {
  private opts: AnimationControllerOptions;
  private animId = 0;
  /** When true, the RAF loop keeps scheduling but skips work (e.g. minigame modal open). */
  private paused = false;
  private clock = new THREE.Clock();
  private _tmp = new THREE.Vector3();
  private _tmpGround = new THREE.Vector3();

  private theta = 0.18;
  private tTheta = 0.18;
  private phi = 0.32;
  private tPhi = 0.32;
  private radius = 220;
  private tRadius = 220;
  private panX = 0;
  private tPanX = 0;
  private panZ = 0;
  private tPanZ = 0;

  private isDrag = false;
  private isRight = false;
  private prev = { x: 0, y: 0 };
  private lastPinchDist = 0;

  constructor(opts: AnimationControllerOptions) {
    this.opts = opts;
    if (!opts.onBeforeRender) {
      this.registerEvents();
    }
  }

  private registerEvents(): void {
    const { renderer } = this.opts;
    renderer.domElement.addEventListener("mousedown", this.onDown);
    renderer.domElement.addEventListener("contextmenu", (e) =>
      e.preventDefault(),
    );
    window.addEventListener("mousemove", this.onMove);
    window.addEventListener("mouseup", this.onUp);
    renderer.domElement.addEventListener("wheel", this.onWheel, {
      passive: true,
    });
    window.addEventListener("resize", this.onResize);
    renderer.domElement.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchmove", this.onTouchMove, {
      passive: true,
    });
    renderer.domElement.addEventListener("touchend", () => {
      this.isDrag = false;
    });
  }

  private onDown = (e: MouseEvent): void => {
    this.isDrag = true;
    this.isRight = e.button === 2;
    this.prev = { x: e.clientX, y: e.clientY };
  };

  private onMove = (e: MouseEvent): void => {
    if (!this.isDrag) return;
    const dx = e.clientX - this.prev.x,
      dy = e.clientY - this.prev.y;
    if (this.isRight) {
      this.tPanX -= dx * 0.08;
      this.tPanZ -= dy * 0.08;
    } else {
      this.tTheta -= dx * 0.004;
      this.tPhi = Math.max(0.08, Math.min(1.3, this.tPhi - dy * 0.004));
    }
    this.prev = { x: e.clientX, y: e.clientY };
  };

  private onUp = (): void => {
    this.isDrag = false;
  };

  private onWheel = (e: WheelEvent): void => {
    this.tRadius = Math.max(25, Math.min(380, this.tRadius + e.deltaY * 0.12));
  };

  private onResize = (): void => {
    const { camera, renderer, container } = this.opts;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDrag = true;
      this.isRight = false;
      this.prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      this.lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 1 && this.isDrag) {
      const dx = e.touches[0].clientX - this.prev.x;
      const dy = e.touches[0].clientY - this.prev.y;
      this.tTheta -= dx * 0.004;
      this.tPhi = Math.max(0.08, Math.min(1.3, this.tPhi - dy * 0.004));
      this.prev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      this.tRadius = Math.max(
        25,
        Math.min(380, this.tRadius - (dist - this.lastPinchDist) * 0.22),
      );
      this.lastPinchDist = dist;
    }
  };

  updateCurrentStation(id: string): void {
    this.opts.currentStationId = id;
  }

  setPaused(value: boolean): void {
    if (!value && this.paused) {
      this.clock.getDelta();
    }
    this.paused = value;
  }

  start(): void {
    const {
      renderer,
      scene,
      camera,
      container,
      sun,
      clouds,
      birds,
      markerMeshes,
      labelAnchors,
      heroMixerRef,
      heroRootRef,
      heroKinematicRef,
      currentStationId,
      onLabelUpdate,
      onBeforeRender,
    } = this.opts;

    const loop = (): void => {
      this.animId = requestAnimationFrame(loop);
      if (this.paused) return;
      const delta = this.clock.getDelta();
      const t = this.clock.elapsedTime;
      const L = 0.05;

      if (onBeforeRender) {
        onBeforeRender(t, delta);
      } else {
        this.theta += (this.tTheta - this.theta) * L;
        this.phi += (this.tPhi - this.phi) * L;
        this.radius += (this.tRadius - this.radius) * L;
        this.panX += (this.tPanX - this.panX) * L;
        this.panZ += (this.tPanZ - this.panZ) * L;

        camera.position.set(
          Math.sin(this.theta) * Math.cos(this.phi) * this.radius + this.panX,
          Math.sin(this.phi) * this.radius,
          Math.cos(this.theta) * Math.cos(this.phi) * this.radius + this.panZ,
        );
        camera.lookAt(this.panX, 2, this.panZ);
        sun.position.x = 80 * Math.cos(t * 0.022);
        sun.position.z = 40 * Math.sin(t * 0.022);
        const sunAngle = (Math.sin(t * 0.022) + 1) * 0.5;
        sun.color.setHSL(0.09 - sunAngle * 0.04, 0.95, 0.85 - sunAngle * 0.08);
      }

      markerMeshes.forEach((marker, id) => {
        if (id === currentStationId) {
          marker.scale.setScalar(1 + Math.sin(t * 3.2) * 0.15);
          (marker.material as THREE.MeshStandardMaterial).emissiveIntensity =
            0.62 + Math.sin(t * 3.2) * 0.32;
        }
      });

      birds.forEach((bird, i) => {
        const angle = t * bird.speed + (i / birds.length) * Math.PI * 2;
        bird.arm.position.x = bird.radius;
        bird.pivot.rotation.y = angle;
        bird.pivot.position.y =
          bird.alt + Math.sin(t * 0.38 + bird.phase) * 2.5;
        bird.wingMesh.rotation.z = Math.sin(t * 5.5 + bird.phase) * 0.58;
      });

      clouds.forEach((cloud) => {
        cloud.g.position.x += cloud.speed;
        cloud.g.position.y =
          cloud.alt + Math.sin(t * 0.13 + cloud.g.position.x * 0.018) * 1.5;
        if (cloud.g.position.x > 220) cloud.g.position.x = -220;
        if (cloud.g.position.x < -220) cloud.g.position.x = 220;
      });

      heroMixerRef?.current?.update(delta);

      const kin = heroKinematicRef?.current;
      if (heroRootRef?.current && kin?.has) {
        const r = heroRootRef.current;
        r.position.copy(kin.pos);
        r.rotation.y = kin.ry;
      }

      const cw = container.clientWidth,
        ch = container.clientHeight;
      const np: Record<string, LabelPos> = {};
      const npArrow: Record<string, LabelPos> = {};
      labelAnchors.forEach((wp, id) => {
        np[id] = projectToScreen(wp, camera, cw, ch, this._tmp);
        const gy = terrainHeight(wp.x, wp.z) + 0.52;
        this._tmpGround.set(wp.x, gy, wp.z);
        npArrow[id] = projectToScreen(
          this._tmpGround,
          camera,
          cw,
          ch,
          this._tmp,
        );
      });
      if (heroRootRef?.current) {
        const hp = heroRootRef.current.position;
        np["__hero__"] = projectToScreen(hp, camera, cw, ch, this._tmp);
        const hy = terrainHeight(hp.x, hp.z) + 0.36;
        this._tmpGround.set(hp.x, hy, hp.z);
        npArrow["__hero__"] = projectToScreen(
          this._tmpGround,
          camera,
          cw,
          ch,
          this._tmp,
        );
      }
      onLabelUpdate(np, npArrow);

      renderer.render(scene, camera);
    };
    loop();
  }

  stop(): void {
    cancelAnimationFrame(this.animId);
    if (!this.opts.onBeforeRender) {
      const { renderer } = this.opts;
      renderer.domElement.removeEventListener("mousedown", this.onDown);
      window.removeEventListener("mousemove", this.onMove);
      window.removeEventListener("mouseup", this.onUp);
      window.removeEventListener("resize", this.onResize);
    }
  }
}
