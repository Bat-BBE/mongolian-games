'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { useHeroOrb } from '@/hooks/useHeroOrb';

interface HeroActorProps {
  className?: string;
  autoRotate?: boolean;
  backgroundColor?: string;
}

export default function HeroActor({ 
  className = '', 
  autoRotate = true,
  backgroundColor = '#111827' 
}: HeroActorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animations, setAnimations] = useState<{ [key: string]: THREE.AnimationClip }>({});
  const [currentAction, setCurrentAction] = useState<string>('idle');
  const [isSelected, setIsSelected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  useHeroOrb(
    containerRef as React.RefObject<HTMLCanvasElement | null>,
    isSelected ? '#ff3366' : '#3b82f6',
    isSelected ? '#ff0066' : '#1e3a8a',
    isSelected,
    isLocked
  );


  useEffect(() => {
    if (!containerRef.current) return;

    const loader = new FBXLoader();
    const animationFiles = [
      { name: 'idle', path: '/models/standing idle 01.fbx' },
      { name: 'walkForward', path: '/models/standing walk forward.fbx' },
      { name: 'walkBack', path: '/models/standing walk back.fbx' },
      { name: 'walkLeft', path: '/models/standing walk left.fbx' },
      { name: 'walkRight', path: '/models/standing walk right.fbx' },
      { name: 'runForward', path: '/models/standing run forward.fbx' },
      { name: 'runBack', path: '/models/standing run back.fbx' },
      { name: 'runLeft', path: '/models/standing run left.fbx' },
      { name: 'runRight', path: '/models/standing run right.fbx' },
      { name: 'turnLeft', path: '/models/standing turn 90 left.fbx' },
      { name: 'turnRight', path: '/models/standing turn 90 right.fbx' },
    ];

    loader.load('/models/X Bot.fbx', (object) => {
      modelRef.current = object;
    
      object.scale.setScalar(0.02);
      object.position.set(0, -1, 0);
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;
      
      const camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000
      );
      camera.position.set(5, 2, 8);
      camera.lookAt(0, 1, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

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
      controls.target.set(0, 1, 0);
      controlsRef.current = controls;
      
      // Add lights
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
      
      // Add ground grid and floor
      const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
      gridHelper.position.y = -1;
      scene.add(gridHelper);
      
      const planeGeometry = new THREE.CircleGeometry(8, 32);
      const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x223344,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.3
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -1;
      plane.receiveShadow = true;
      scene.add(plane);
      
      // Add character to scene
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      scene.add(object);
      
      // Setup animation mixer
      const mixer = new THREE.AnimationMixer(object);
      mixerRef.current = mixer;
      
      // Load all animations
      const loadedAnimations: { [key: string]: THREE.AnimationClip } = {};
      let loadedCount = 0;
      
      animationFiles.forEach((file) => {
        loader.load(file.path, (animObject) => {
          if (animObject.animations && animObject.animations.length > 0) {
            const clip = animObject.animations[0];
            loadedAnimations[file.name] = clip;

            const action = mixer.clipAction(clip);
            animationsRef.current.set(file.name, action);

            if (file.name === 'idle') {
              action.play();
            }
          }
          
          loadedCount++;
          if (loadedCount === animationFiles.length) {
            setAnimations(loadedAnimations);
            setIsLoading(false);
          }
        });
      });
      
      let clock = new THREE.Clock();
      
      const animate = () => {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      
      animate();
      
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current?.dispose();
      };
    });
  }, [backgroundColor, autoRotate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      if (e.code === 'Space') {
        setIsSelected(prev => !prev);
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsLocked(true);
      }
      
      let newAction: string | null = null;
      
      switch(e.code) {
        case 'KeyW': newAction = e.shiftKey ? 'runForward' : 'walkForward'; break;
        case 'KeyS': newAction = e.shiftKey ? 'runBack' : 'walkBack'; break;
        case 'KeyA': newAction = e.shiftKey ? 'runLeft' : 'walkLeft'; break;
        case 'KeyD': newAction = e.shiftKey ? 'runRight' : 'walkRight'; break;
        case 'KeyQ': newAction = 'turnLeft'; break;
        case 'KeyE': newAction = 'turnRight'; break;
        default: return;
      }
      
      if (newAction && newAction !== currentAction) {
        // Fade out current action, fade in new one
        const current = animationsRef.current.get(currentAction);
        const next = animationsRef.current.get(newAction);
        
        if (current && next) {
          current.fadeOut(0.2);
          next.reset().fadeIn(0.2).play();
          setCurrentAction(newAction);
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsLocked(false);
      }
      
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE'].includes(e.code)) {
        const idle = animationsRef.current.get('idle');
        const current = animationsRef.current.get(currentAction);
        
        if (idle && current && currentAction !== 'idle') {
          current.fadeOut(0.2);
          idle.reset().fadeIn(0.2).play();
          setCurrentAction('idle');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentAction, isLoading]);

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
        {isSelected ? '✨ Selected' : 'Click space to select'} | {isLocked ? '🔒 Locked' : 'Shift to lock'}
      </div>
      
      <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm z-20">
        Animation: {currentAction}
      </div>
      
      <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm z-20">
        WASD: Walk | Shift+WASD: Run | Q/E: Turn
      </div>
    </div>
  );
}