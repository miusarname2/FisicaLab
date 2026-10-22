import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PhysicsParams, PhysicsInstant } from '../types/physics';
import { getPhysicsAtTime } from '../utils/physics';
import { sound } from '../utils/audio';
import { 
  Play, Pause, RotateCcw, ArrowRight, Eye, Video, 
  ChevronDown, Gauge, Compass, Sliders, Sparkles,
  Gamepad2, Zap, Star, Maximize2, Minimize2
} from 'lucide-react';

interface Simulation3DProps {
  params: PhysicsParams;
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onScrollToCharts?: () => void;
  isArcadeMode?: boolean;
  onToggleArcadeMode?: () => void;
}

type CameraPreset = 'side' | 'chase' | 'iso';

export const Simulation3D: React.FC<Simulation3DProps> = ({
  params,
  currentTime,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  onReset,
  onScrollToCharts,
  isArcadeMode = true,
  onToggleArcadeMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const roverGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const velArrowRef = useRef<THREE.Group | null>(null);
  const accArrowRef = useRef<THREE.Group | null>(null);
  const forceArrowRef = useRef<THREE.Group | null>(null);
  const orbs3DRef = useRef<THREE.Mesh[]>([]);

  const [cameraMode, setCameraMode] = useState<CameraPreset>('iso');
  const [showVectors3D, setShowVectors3D] = useState(true);
  const [isHoldingGas, setIsHoldingGas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gasIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (heroRef.current?.requestFullscreen) {
        heroRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const currentPhysics = getPhysicsAtTime(params, currentTime);
  const { position, velocity, acceleration, force, progress } = currentPhysics;

  // Track collectible 3D energy rings at 25%, 55%, 85%
  const orbRatios = [0.25, 0.55, 0.85];
  const [collectedOrbs, setCollectedOrbs] = useState<boolean[]>([false, false, false]);

  // Continuous Car Engine Sound in 3D
  useEffect(() => {
    const isMoving = isPlaying || isHoldingGas;
    const maxVel = Math.max(0.1, (params.initialVelocity || 0) + acceleration * params.totalTime);
    const speedRatio = Math.min(1, Math.max(0, velocity / maxVel));

    if (isMoving && currentTime < params.totalTime && velocity > 0.05) {
      sound.updateCarEngine(speedRatio, isHoldingGas);
    } else {
      sound.stopCarEngine();
    }

    return () => {
      sound.stopCarEngine();
    };
  }, [isPlaying, isHoldingGas, velocity, acceleration, params.totalTime, params.initialVelocity, currentTime]);

  useEffect(() => {
    orbRatios.forEach((ratio, idx) => {
      if (progress >= ratio - 0.02 && !collectedOrbs[idx]) {
        setCollectedOrbs(prev => {
          if (prev[idx]) return prev;
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });
        sound.playCollect();
      } else if (progress < ratio - 0.06 && collectedOrbs[idx]) {
        setCollectedOrbs(prev => {
          if (!prev[idx]) return prev;
          const updated = [...prev];
          updated[idx] = false;
          return updated;
        });
      }
    });
  }, [progress, collectedOrbs]);

  useEffect(() => {
    if (currentTime <= 0.01) {
      setCollectedOrbs([false, false, false]);
    }
  }, [currentTime]);

  // Keyboard shortcut: hold Space or ArrowRight to accelerate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowRight') {
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        if (!isHoldingGas && currentTime < params.totalTime) {
          setIsHoldingGas(true);
          sound.playBrumm(0.85);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowRight') {
        setIsHoldingGas(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHoldingGas, currentTime, params.totalTime]);

  // Gas pedal acceleration loop
  useEffect(() => {
    if (isHoldingGas && currentTime < params.totalTime) {
      gasIntervalRef.current = setInterval(() => {
        onTimeChange(Math.min(params.totalTime, currentTime + 0.05));
      }, 35);
    } else {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    }
    return () => {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    };
  }, [isHoldingGas, currentTime, params.totalTime, onTimeChange]);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 20);
    cyanPoint.position.set(0, 4, 2);
    scene.add(cyanPoint);

    // Track Plane & Grid
    const trackLength = Math.max(30, params.distance * 1.5);
    const planeGeo = new THREE.PlaneGeometry(trackLength * 2, 20);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x090d18,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(planeGeo, planeMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.x = trackLength / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(trackLength * 2, 80, 0x1e293b, 0x0f172a);
    gridHelper.position.set(trackLength / 2, 0.01, 0);
    scene.add(gridHelper);

    // Track Lane Strip (Horizontal asphalt lane)
    const laneGeo = new THREE.PlaneGeometry(trackLength * 1.6, 3.6);
    const laneMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.1,
    });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(trackLength / 2, 0.02, 0);
    lane.receiveShadow = true;
    scene.add(lane);

    // Track Lane Side Stripes (Cyan glowing borders)
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const topStripeGeo = new THREE.PlaneGeometry(trackLength * 1.6, 0.08);
    const topStripe = new THREE.Mesh(topStripeGeo, stripeMat);
    topStripe.rotation.x = -Math.PI / 2;
    topStripe.position.set(trackLength / 2, 0.03, 1.7);
    scene.add(topStripe);

    const bottomStripe = new THREE.Mesh(topStripeGeo, stripeMat);
    bottomStripe.rotation.x = -Math.PI / 2;
    bottomStripe.position.set(trackLength / 2, 0.03, -1.7);
    scene.add(bottomStripe);

    // Collectible 3D Energy Rings spanning across the lane
    orbs3DRef.current = [];
    orbRatios.forEach((ratio) => {
      const orbX = params.distance * ratio;
      const orbGroup = new THREE.Group();
      orbGroup.position.set(orbX, 1.2, 0);

      // Vertical Arch Ring
      const torusGeo = new THREE.TorusGeometry(0.75, 0.09, 16, 32);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xca8a04,
        roughness: 0.2,
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.y = Math.PI / 2; // Facing the car
      orbGroup.add(torus);

      const innerSphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const innerSphereMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
      orbGroup.add(innerSphere);

      scene.add(orbGroup);
      orbs3DRef.current.push(torus);
    });

    // Distance Metric Posts along the track
    const step = params.distance <= 10 ? 1 : Math.ceil(params.distance / 10);
    for (let x = 0; x <= params.distance; x += step) {
      const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);
      const postMat = new THREE.MeshStandardMaterial({ 
        color: x === params.distance ? 0x00f0ff : 0x475569,
        roughness: 0.4
      });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.3, -2.1);
      scene.add(post);

      const markerGeo = new THREE.RingGeometry(0.12, 0.18, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: x === params.distance ? 0x00f0ff : 0x334155,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(x, 0.04, -2.1);
      scene.add(marker);
    }

    // Finish Line Arch / Gate at x = distance
    const finishArchGroup = new THREE.Group();
    finishArchGroup.position.set(params.distance, 0, 0);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), pillarMat);
    pillarL.position.set(0, 1.6, 2.1);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), pillarMat);
    pillarR.position.set(0, 1.6, -2.1);

    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 4.4), bannerMat);
    crossbar.position.set(0, 3.2, 0);

    finishArchGroup.add(pillarL, pillarR, crossbar);
    scene.add(finishArchGroup);

    // ==========================================
    // BUILD 3D ROBOTIC ROVER
    // ==========================================
    const rover = new THREE.Group();
    roverGroupRef.current = rover;

    // 1. White Main Chassis
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.8, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    rover.add(bodyMesh);

    // 2. Center Red Sensor Lens
    const sensorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24);
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      roughness: 0.1,
      metalness: 0.2,
    });
    const sensorMesh = new THREE.Mesh(sensorGeo, sensorMat);
    sensorMesh.rotation.x = Math.PI / 2;
    sensorMesh.position.set(0, 0.85, 0.78);
    rover.add(sensorMesh);

    const coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0.85, 0.8);
    rover.add(coreMesh);

    // 3. Electronics Board on Top
    const pcbGeo = new THREE.BoxGeometry(1.2, 0.2, 0.9);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.position.set(-0.1, 1.35, 0);
    pcbMesh.castShadow = true;
    rover.add(pcbMesh);

    // Golden Pin Header row
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 7; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), pinMat);
      pin.position.set(-0.5 + i * 0.16, 1.5, 0.35);
      rover.add(pin);
    }

    // Curved Jumper Wires
    const curveRed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.45, 0.2),
      new THREE.Vector3(0.4, 1.8, 0.4),
      new THREE.Vector3(0.7, 1.2, 0.6),
      new THREE.Vector3(0.8, 0.9, 0.6),
    ]);
    const wireRedGeo = new THREE.TubeGeometry(curveRed, 20, 0.025, 8, false);
    const wireRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const wireRed = new THREE.Mesh(wireRedGeo, wireRedMat);
    rover.add(wireRed);

    const curveWhite = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 1.45, 0.25),
      new THREE.Vector3(0.25, 1.75, 0.45),
      new THREE.Vector3(0.55, 1.25, 0.65),
      new THREE.Vector3(0.65, 0.9, 0.65),
    ]);
    const wireWhiteGeo = new THREE.TubeGeometry(curveWhite, 20, 0.02, 8, false);
    const wireWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const wireWhite = new THREE.Mesh(wireWhiteGeo, wireWhiteMat);
    rover.add(wireWhite);

    // 4. Mecanum Wheels
    const wheelPositions = [
      { x: -0.75, z: 0.95 },
      { x: 0.75, z: 0.95 },
      { x: -0.75, z: -0.95 },
      { x: 0.75, z: -0.95 },
    ];

    wheelsRef.current = [];
    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, 0.55, pos.z);

      const tireGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 24);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3, metalness: 0.1 });
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const rollerGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.28, 12);
        const roller = new THREE.Mesh(rollerGeo, yellowMat);
        roller.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0);
        roller.rotation.z = angle + Math.PI / 4;
        wheelGroup.add(roller);
      }

      const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 16);
      const hub = new THREE.Mesh(hubGeo, yellowMat);
      hub.rotation.x = Math.PI / 2;
      wheelGroup.add(hub);

      wheelsRef.current.push(wheelGroup);
      rover.add(wheelGroup);
    });

    // 5. 3D Vector Arrows
    const create3DArrow = (colorHex: number) => {
      const group = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);
      const shaftMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.5;

      const headGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
      const headMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.05;

      group.add(shaft, head);
      group.rotation.z = -Math.PI / 2;
      return group;
    };

    const velArrow = create3DArrow(0x10b981);
    velArrow.position.set(1.2, 1.0, 0);
    velArrowRef.current = velArrow;
    rover.add(velArrow);

    const accArrow = create3DArrow(0xf59e0b);
    accArrow.position.set(1.2, 1.4, 0);
    accArrowRef.current = accArrow;
    rover.add(accArrow);

    const forceArrow = create3DArrow(0xc084fc);
    forceArrow.position.set(1.2, 0.6, 0);
    forceArrowRef.current = forceArrow;
    rover.add(forceArrow);

    scene.add(rover);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Spin collectible 3D rings slightly
      orbs3DRef.current.forEach((orb) => {
        if (orb) {
          orb.rotation.z = elapsedTime * 0.8;
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [params.distance]);

  // Update Rover Position, Wheel Rotation, Camera & Vectors in Scene
  useEffect(() => {
    if (!roverGroupRef.current || !cameraRef.current) return;

    // Update Rover X position
    roverGroupRef.current.position.x = position;

    // Rotate Wheels based on position
    const wheelAngle = -(position / 0.55);
    wheelsRef.current.forEach((w) => {
      w.rotation.z = wheelAngle;
    });

    // Hide or show collected 3D rings
    orbs3DRef.current.forEach((orb, idx) => {
      if (orb) {
        orb.visible = !collectedOrbs[idx];
      }
    });

    // Update 3D Vector scales
    if (velArrowRef.current && accArrowRef.current && forceArrowRef.current) {
      velArrowRef.current.visible = showVectors3D;
      accArrowRef.current.visible = showVectors3D;
      forceArrowRef.current.visible = showVectors3D;

      const maxSpeed = Math.max(0.1, acceleration * params.totalTime);
      const velScale = Math.max(0.1, (velocity / maxSpeed) * 2.2);
      velArrowRef.current.scale.set(1, velScale, 1);

      const accScale = Math.max(0.2, Math.min(2.5, acceleration * 0.4));
      accArrowRef.current.scale.set(1, accScale, 1);

      const forceScale = Math.max(0.2, Math.min(2.5, (force / Math.max(1, params.mass * acceleration)) * 2));
      forceArrowRef.current.scale.set(1, forceScale, 1);
    }

    // Camera Placement according to selected mode
    const roverX = position;
    if (cameraMode === 'iso') {
      cameraRef.current.position.set(roverX - 5.5, 4.5, 6.5);
      cameraRef.current.lookAt(roverX + 1.5, 1, 0);
    } else if (cameraMode === 'side') {
      cameraRef.current.position.set(roverX, 1.8, 8.5);
      cameraRef.current.lookAt(roverX, 0.8, 0);
    } else if (cameraMode === 'chase') {
      cameraRef.current.position.set(roverX - 6.0, 2.5, 0);
      cameraRef.current.lookAt(roverX + 5.0, 0.8, 0);
    }
  }, [position, velocity, acceleration, force, cameraMode, showVectors3D, params, collectedOrbs]);

  // Handle Scroll to move the car forward!
  const heroRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentTime < params.totalTime) {
      e.preventDefault();
      const dt = (e.deltaY / 400) * (params.totalTime / 10);
      const nextTime = Math.min(params.totalTime, currentTime + dt);
      onTimeChange(nextTime);
    } else if (e.deltaY < 0 && currentTime > 0) {
      e.preventDefault();
      const dt = (Math.abs(e.deltaY) / 400) * (params.totalTime / 10);
      const nextTime = Math.max(0, currentTime - dt);
      onTimeChange(nextTime);
    }
  };

  return (
    <div 
      ref={heroRef}
      onWheel={handleWheel}
      className={`relative w-full bg-slate-950 border border-slate-800 shadow-2xl flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen' : 'h-[85vh] min-h-[580px] rounded-3xl overflow-hidden'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Top Floating HUD bar replicating user image in 3D */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pointer-events-none">
        <div>
          <div className="flex items-center gap-2 mb-1 pointer-events-auto">
            <h2 className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight flex items-center gap-2">
              Movimiento 3D
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-medium">
                Scroll-Driven Hero
              </span>
              {isArcadeMode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-950/80 border border-yellow-800/60 text-yellow-300 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  <Gamepad2 className="w-3 h-3" />
                  Aros 3D Activos
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {isArcadeMode 
              ? 'Acelera con el botón de gas para escuchar el motor o rueda con el scroll para atravesar los aros.'
              : 'Gira la rueda del ratón o haz scroll sobre la escena para mover el móvil 3D.'}
          </p>
        </div>

        {/* Camera Views & Vector Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onToggleArcadeMode && (
            <button
              type="button"
              onClick={onToggleArcadeMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                isArcadeMode
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>{isArcadeMode ? 'Aros Activos' : 'Activar Aros'}</span>
            </button>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center gap-1 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCameraMode('iso');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraMode === 'iso' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Isométrica
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCameraMode('side');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraMode === 'side' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lateral 2.5D
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCameraMode('chase');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraMode === 'chase' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Seguimiento
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowVectors3D(!showVectors3D)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showVectors3D
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-800'
            }`}
            title="Mostrar/Ocultar Vectores 3D"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg backdrop-blur"
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center / Top HUD matching the user's diagram */}
      <div className="relative z-10 mx-5 sm:mx-7 pointer-events-none">
        <div className="inline-flex flex-wrap items-center gap-x-5 gap-y-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-xl font-mono text-sm text-slate-200 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">t =</span>
            <span className="font-bold text-cyan-400 tabular-nums text-base">{currentTime.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">s</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">x =</span>
            <span className="font-bold text-blue-400 tabular-nums text-base">{position.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">m</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">v =</span>
            <span className="font-bold text-emerald-400 tabular-nums text-base">{velocity.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">m/s</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">dirección</span>
            <span className="font-bold text-amber-300 tabular-nums">0°</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 inline" />
          </div>

          {isArcadeMode && (
            <div className="flex items-center gap-1 text-yellow-400 font-bold border-l border-slate-800 pl-3">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Aros: {collectedOrbs.filter(Boolean).length}/3</span>
            </div>
          )}

          <div className="text-xs text-slate-400 border-l border-slate-800 pl-3 hidden md:flex items-center gap-3">
            <span>a: <strong className="text-amber-400">{acceleration.toFixed(2)}</strong> m/s²</span>
            <span>F: <strong className="text-purple-400">{force.toFixed(2)}</strong> N</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom Interactive HUD & Scroller Controls */}
      <div className="relative z-10 p-5 sm:p-7 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Play/Pause & Arcade Gas */}
          <div className="flex items-center gap-2">
            {isArcadeMode ? (
              <button
                type="button"
                onMouseDown={() => {
                  setIsHoldingGas(true);
                  sound.playBrumm(0.85);
                }}
                onMouseUp={() => {
                  setIsHoldingGas(false);
                }}
                onMouseLeave={() => {
                  setIsHoldingGas(false);
                }}
                onTouchStart={() => {
                  setIsHoldingGas(true);
                  sound.playBrumm(0.85);
                }}
                onTouchEnd={() => {
                  setIsHoldingGas(false);
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-xl active:scale-90 select-none ${
                  isHoldingGas 
                    ? 'bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/50 scale-95' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-yellow-500/20'
                }`}
              >
                <Zap className="w-4 h-4 fill-current animate-pulse" />
                <span>{isHoldingGas ? '¡BRUMMM! ACELERANDO' : 'PISAR GAS (ESPACIO)'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (!isPlaying) {
                    sound.playBrumm(0.75);
                  }
                  onTogglePlay();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md active:scale-95"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                sound.stopCarEngine();
                onReset();
              }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Reiniciar móvil al inicio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Scrub Slider */}
          <div className="flex-1 w-full max-w-lg flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 tabular-nums">0 s</span>
            <input
              type="range"
              min="0"
              max={params.totalTime}
              step="0.01"
              value={currentTime}
              onChange={(e) => onTimeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
              {params.totalTime.toFixed(1)} s
            </span>
          </div>

          {/* Scroll Down to Graphs Indicator */}
          {onScrollToCharts && (
            <button
              type="button"
              onClick={onScrollToCharts}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
            >
              <span>Ver Gráficos D3</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          )}
        </div>

        {/* Helper badge when reached the finish line */}
        {currentTime >= params.totalTime && (
          <div className="mt-3 flex items-center justify-center">
            <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 animate-fade-in">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>¡Meta alcanzada ({params.distance} m)! Continúa abajo para interactuar con las gráficas D3.js.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
