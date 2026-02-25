import { useEffect, type RefObject } from "react";
import * as THREE from "three";

export function useHeroOrb(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  color: string,
  emissive: string,
  isSelected: boolean,
  isLocked: boolean,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.clientWidth || 140;
    const H = canvas.clientHeight || 140;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const col = new THREE.Color(color);
    const pLight = new THREE.PointLight(col, isLocked ? 1 : 3, 14);
    pLight.position.set(2, 3, 3);
    scene.add(pLight);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-3, -2, -2);
    scene.add(rim);

    const orbMat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: new THREE.Color(emissive),
      emissiveIntensity: isLocked ? 0.08 : isSelected ? 1.4 : 0.7,
      metalness: 0.95,
      roughness: 0.08,
      transparent: true,
      opacity: isLocked ? 0.18 : 0.9,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.52, 40, 40), orbMat);
    scene.add(orb);

    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(emissive),
        emissive: new THREE.Color(emissive),
        emissiveIntensity: isLocked ? 0.1 : 2.5,
        transparent: true,
        opacity: isLocked ? 0.1 : 0.6,
      }),
    ));

    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.022, 16, 120),
      new THREE.MeshStandardMaterial({
        color: col, emissive: col,
        emissiveIntensity: isLocked ? 0.05 : isSelected ? 2.5 : 1.0,
        transparent: true, opacity: isLocked ? 0.12 : 0.75,
      }),
    );
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.01, 16, 120),
      new THREE.MeshStandardMaterial({
        color: col, emissive: col,
        emissiveIntensity: isLocked ? 0.04 : 0.5,
        transparent: true, opacity: isLocked ? 0.07 : 0.3,
      }),
    );
    ring2.rotation.set(Math.PI / 3, 0, Math.PI / 6);
    scene.add(ring2);

    const shardGroup = new THREE.Group();
    const shardCount = isLocked ? 5 : 14;
    for (let i = 0; i < shardCount; i++) {
      const geo = new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.16, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: col, metalness: 0.85, roughness: 0.15,
        emissive: col, emissiveIntensity: isLocked ? 0.05 : 0.4,
        transparent: true, opacity: isLocked ? 0.1 : 0.6,
      });
      const m = new THREE.Mesh(geo, mat);
      const angle = (i / shardCount) * Math.PI * 2;
      const r = 0.85 + Math.random() * 0.5;
      m.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 2.0, Math.sin(angle) * r * 0.5);
      m.userData = {
        baseY: m.position.y,
        speed: 0.3 + Math.random() * 0.8,
        rotS: (Math.random() - 0.5) * 0.025,
        orbit: angle,
        r,
      };
      shardGroup.add(m);
    }
    scene.add(shardGroup);

    if (!isLocked) {
      const pN = 80;
      const pPos = new Float32Array(pN * 3);
      for (let i = 0; i < pN; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const rr = 1.15 + Math.random() * 0.9;
        pPos[i * 3]     = rr * Math.sin(ph) * Math.cos(th);
        pPos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th);
        pPos[i * 3 + 2] = rr * Math.cos(ph);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: col, size: 0.022, transparent: true, opacity: 0.5,
      })));
    }

    let frame = 0;
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      frame++;
      const t = frame * 0.012;

      orb.rotation.y += 0.009;
      orb.rotation.x += 0.004;
      if (isSelected) {
        orb.scale.setScalar(1 + Math.sin(t * 2.5) * 0.05);
        orbMat.emissiveIntensity = 1.2 + Math.sin(t * 3) * 0.35;
      }

      ring1.rotation.z += isSelected ? 0.014 : 0.006;
      ring2.rotation.y += 0.009;
      ring2.rotation.z += 0.005;

      shardGroup.children.forEach((child) => {
        const d = (child as THREE.Mesh).userData;
        d.orbit += 0.006 * d.speed;
        child.position.x = Math.cos(d.orbit) * d.r;
        child.position.z = Math.sin(d.orbit) * d.r * 0.5;
        child.position.y = d.baseY + Math.sin(t * d.speed + d.orbit) * 0.28;
        child.rotation.x += d.rotS;
        child.rotation.y += d.rotS * 0.7;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [isSelected, isLocked]);
}