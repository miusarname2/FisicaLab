import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  ParabolicParams, 
  ParabolicInstant, 
  ParabolicResults,
  ProjectilePreset 
} from '../types/parabolic';
import { 
  calculateParabolicResults, 
  getParabolicAtTime, 
  degToRad,
  PROJECTILE_PRESETS
} from '../utils/parabolic';
import { sound } from '../utils/audio';
import { triggerFinishCelebration } from '../utils/confetti';
import { 
  Play, Pause, RotateCcw, Eye, Target, 
  Maximize2, Minimize2, Video, Zap, 
  Compass, Flame, Sparkles, Trophy, Plus, Minus
} from 'lucide-react';

interface ParabolicSimulation3DProps {
  params: ParabolicParams;
  onParamsChange: (newParams: ParabolicParams) => void;
  onLaunchCompleted?: (results: ParabolicResults) => void;
}

type CameraPreset = 'iso' | 'side' | 'chase';

export const ParabolicSimulation3D: React.FC<ParabolicSimulation3DProps> = ({
  params,
  onParamsChange,
  onLaunchCompleted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 3D Objects
  const tankGroupRef = useRef<THREE.Group | null>(null);
  const barrelGroupRef = useRef<THREE.Group | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const targetGroupRef = useRef<THREE.Group | null>(null);

  // 3D Vectors attached to ball
  const vectorsGroupRef = useRef<THREE.Group | null>(null);
  const arrowVxRef = useRef<THREE.Group | null>(null);
  const arrowVyRef = useRef<THREE.Group | null>(null);
  const arrowVRef = useRef<THREE.Group | null>(null);
  const arrowGRef = useRef<THREE.Group | null>(null);

  // State
  const [currentTime, setCurrentTime] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraPreset>('iso');
  const [showVectors3D, setShowVectors3D] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ text: string; score: number } | null>(null);

  const results = calculateParabolicResults(params);
  const currentInstant = getParabolicAtTime(params, currentTime);
  const selectedPreset = PROJECTILE_PRESETS.find(p => p.id === params.projectileId) || PROJECTILE_PRESETS[0];

  // Helper to adjust angle smoothly
  const handleSetAngle = (newAngle: number) => {
    sound.playClick();
    const clamped = Math.max(10, Math.min(90, Math.round(newAngle)));
    onParamsChange({ ...params, angleDeg: clamped });
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer with High-DPI and Antialiasing
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

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    const accentCyan = new THREE.PointLight(0x00f0ff, 2.5, 30);
    accentCyan.position.set(0, 4, 3);
    scene.add(accentCyan);

    const accentOrange = new THREE.PointLight(0xf97316, 2.0, 30);
    accentOrange.position.set(params.targetDistance, 4, 2);
    scene.add(accentOrange);

    // 5. Arena Ground & Grid
    const groundGeo = new THREE.PlaneGeometry(160, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(30, 0, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(120, 60, 0x00f0ff, 0x1e293b);
    gridHelper.position.set(30, 0.01, 0);
    scene.add(gridHelper);

    // 6. ROBOTIC TANK MODEL (Matching rover styling with turret and cannon)
    const tank = new THREE.Group();
    tank.position.set(0, 0, 0);

    // Tank Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(2.4, 0.6, 1.8);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    tank.add(chassis);

    // Cyan Neon Edge Trims
    const trimGeo = new THREE.BoxGeometry(2.45, 0.08, 1.85);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.55;
    tank.add(trim);

    // 4 Mechanum Wheels
    const wheelPositions = [
      { x: -0.85, z: 1.0 },
      { x: 0.85, z: 1.0 },
      { x: -0.85, z: -1.0 },
      { x: 0.85, z: -1.0 },
    ];
    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, 0.45, pos.z);

      const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Yellow rollers
      const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12);
      const hubMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      wheelGroup.add(hub);

      tank.add(wheelGroup);
    });

    // Turret Dome Base
    const turretBaseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.35, 24);
    const turretBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const turretBase = new THREE.Mesh(turretBaseGeo, turretBaseMat);
    turretBase.position.y = 0.95;
    turretBase.castShadow = true;
    tank.add(turretBase);

    // Cannon Barrel Pivot Group
    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0, 1.05, 0); // Elevation pivot

    // Barrel Tube
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.2, 16);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2,
    });
    const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
    barrelMesh.rotation.z = -Math.PI / 2; // Pointing forward along +X
    barrelMesh.position.x = 1.1;
    barrelMesh.castShadow = true;
    barrelPivot.add(barrelMesh);

    // Muzzle Brake Ring
    const muzzleGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const muzzleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.rotation.z = -Math.PI / 2;
    muzzle.position.x = 2.1;
    barrelPivot.add(muzzle);

    // Ping Pong Magazine Loader on Turret
    const magGeo = new THREE.BoxGeometry(0.35, 0.6, 0.4);
    const magMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.3 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(-0.35, 0.3, 0);
    barrelPivot.add(mag);

    tank.add(barrelPivot);
    barrelGroupRef.current = barrelPivot;
    tankGroupRef.current = tank;
    scene.add(tank);

    // 7. PING PONG BALL PROJECTILE
    const ballGeo = new THREE.SphereGeometry(selectedPreset.radius, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      roughness: 0.25,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    ballMesh.position.set(0, params.initialHeight, 0);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // 7.1. 3D VECTOR ARROWS GROUP DIRECTLY FOLLOWING BALL IN ALL CAMERAS
    const vectorsGroup = new THREE.Group();
    vectorsGroup.position.set(0, params.initialHeight, 0);

    const createVectorArrow = (colorHex: number) => {
      const group = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 12);
      const shaftMat = new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y = 0.5;

      const headGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
      const headMat = new THREE.MeshBasicMaterial({ color: colorHex, depthTest: false });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.05;

      group.add(shaft, head);
      return group;
    };

    // Vx Arrow (Green - Horizontal)
    const arrowVx = createVectorArrow(0x10b981);
    arrowVx.rotation.z = -Math.PI / 2;
    vectorsGroup.add(arrowVx);
    arrowVxRef.current = arrowVx;

    // Vy Arrow (Purple - Vertical)
    const arrowVy = createVectorArrow(0xc084fc);
    vectorsGroup.add(arrowVy);
    arrowVyRef.current = arrowVy;

    // V Resultant Arrow (Yellow - Tangent)
    const arrowV = createVectorArrow(0xfacc15);
    vectorsGroup.add(arrowV);
    arrowVRef.current = arrowV;

    // Gravity / Weight Arrow (Red - Downward)
    const arrowG = createVectorArrow(0xf43f5e);
    arrowG.rotation.z = Math.PI;
    arrowG.scale.set(0.65, 0.65, 0.65);
    vectorsGroup.add(arrowG);
    arrowGRef.current = arrowG;

    scene.add(vectorsGroup);
    vectorsGroupRef.current = vectorsGroup;

    // 8. 3D TARGET BASKET / HOOP
    const targetGroup = new THREE.Group();
    targetGroup.position.set(params.targetDistance, 0, 0);

    // Target Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    pole.castShadow = true;
    targetGroup.add(pole);

    // Target Hoop Ring
    const hoopGeo = new THREE.TorusGeometry(params.targetRadius, 0.08, 16, 32);
    const hoopMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      metalness: 0.4,
    });
    const hoop = new THREE.Mesh(hoopGeo, hoopMat);
    hoop.rotation.x = Math.PI / 2; // Flat horizontal hoop
    hoop.position.y = 2.4;
    targetGroup.add(hoop);

    // Target Glowing Beacon Light
    const beaconGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 2.6;
    targetGroup.add(beacon);

    targetGroupRef.current = targetGroup;
    scene.add(targetGroup);

    // 9. Resize Handler
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
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate target beacon slightly
      if (beacon) {
        beacon.rotation.y += 0.02;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Update Tank Barrel Elevation Angle in 3D
  useEffect(() => {
    if (barrelGroupRef.current) {
      barrelGroupRef.current.rotation.z = degToRad(params.angleDeg);
    }
  }, [params.angleDeg]);

  // Update Target 3D Position
  useEffect(() => {
    if (targetGroupRef.current) {
      targetGroupRef.current.position.x = params.targetDistance;
    }
  }, [params.targetDistance, params.targetRadius]);

  // Update 3D Parabolic Trajectory Curve
  useEffect(() => {
    if (!sceneRef.current) return;

    if (trajectoryLineRef.current) {
      sceneRef.current.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
    }

    const curvePoints: THREE.Vector3[] = [];
    const samples = 80;
    const dt = results.timeTotal / samples;

    for (let i = 0; i <= samples; i++) {
      const t = i * dt;
      const inst = getParabolicAtTime(params, t);
      curvePoints.push(new THREE.Vector3(inst.x, inst.y, 0));
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.6,
      gapSize: 0.3,
      linewidth: 2,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    sceneRef.current.add(line);
    trajectoryLineRef.current = line;
  }, [params, results.timeTotal]);

  // Dynamic Update of Ball Position & 3D Vectors in Real-Time
  useEffect(() => {
    if (!ballMeshRef.current) return;

    ballMeshRef.current.position.set(currentInstant.x, currentInstant.y, 0);

    // Rotate ball with forward velocity for realism
    ballMeshRef.current.rotation.z -= currentInstant.vx * 0.02;

    // 3D VECTORS UPDATE ON THE BALL (Works in all camera modes: Iso, Side, Chase)
    if (vectorsGroupRef.current) {
      vectorsGroupRef.current.position.set(currentInstant.x, currentInstant.y, 0);
      vectorsGroupRef.current.visible = showVectors3D;

      // Scale Vx (horizontal velocity)
      if (arrowVxRef.current) {
        const vxScale = Math.max(0.15, currentInstant.vx * 0.12);
        arrowVxRef.current.scale.set(1, vxScale, 1);
      }

      // Scale & Rotate Vy (vertical velocity)
      if (arrowVyRef.current) {
        const vy = currentInstant.vy;
        const vyScale = Math.max(0.08, Math.abs(vy) * 0.12);
        arrowVyRef.current.scale.set(1, vyScale, 1);
        arrowVyRef.current.rotation.z = vy >= 0 ? 0 : Math.PI;
      }

      // Scale & Rotate V (instantaneous tangent velocity)
      if (arrowVRef.current) {
        const vScale = Math.max(0.15, currentInstant.velocity * 0.12);
        arrowVRef.current.scale.set(1, vScale, 1);
        const thetaRad = Math.atan2(currentInstant.vy, currentInstant.vx);
        arrowVRef.current.rotation.z = thetaRad - Math.PI / 2;
      }
    }

    // Camera view adjustment based on mode
    if (cameraRef.current) {
      if (cameraMode === 'iso') {
        const midX = results.maxRange / 2;
        cameraRef.current.position.set(midX - 12, 16, 26);
        cameraRef.current.lookAt(midX, results.maxHeight / 2, 0);
      } else if (cameraMode === 'side') {
        const midX = results.maxRange / 2;
        cameraRef.current.position.set(midX, results.maxHeight / 2 + 2, 34);
        cameraRef.current.lookAt(midX, results.maxHeight / 2, 0);
      } else if (cameraMode === 'chase') {
        // Follow ping-pong ball in mid-air with clear view of vectors
        cameraRef.current.position.set(currentInstant.x - 7, currentInstant.y + 3.5, 11);
        cameraRef.current.lookAt(currentInstant.x + 1.5, currentInstant.y, 0);
      }
    }
  }, [currentInstant, cameraMode, showVectors3D, results.maxRange, results.maxHeight]);

  // Main 3D Flight Timer Loop
  useEffect(() => {
    if (!isFlying) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime((prev) => {
        const nextTime = prev + dt;
        if (nextTime >= results.timeTotal) {
          setIsFlying(false);
          sound.playPingPongBounce(0.9);

          if (results.hitTarget) {
            sound.playTargetHit();
            triggerFinishCelebration();
            setScorePopup({ text: '¡EN EL BLANCO 3D!', score: results.score });
          } else {
            setScorePopup({
              text: results.targetErrorMeters < 3 ? '¡Muy Cerca!' : 'Tiro Completado',
              score: results.score,
            });
          }

          if (onLaunchCompleted) {
            onLaunchCompleted(results);
          }
          return results.timeTotal;
        }
        return nextTime;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isFlying, results, onLaunchCompleted]);

  // Fire Cannon
  const handleFire = () => {
    setCurrentTime(0);
    setScorePopup(null);
    setIsFlying(true);
    sound.playCannonFire();
  };

  const handleReset = () => {
    setIsFlying(false);
    setCurrentTime(0);
    setScorePopup(null);
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
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

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl transition-all flex flex-col overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen overflow-y-auto' : 'h-[640px]'
      }`}
    >
      {/* Three.js Canvas */}
      <div className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Floating Header Overlay */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
        <div>
          <div className="flex items-center gap-2 mb-1 pointer-events-auto">
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-orange-400 to-amber-300 tracking-tight flex items-center gap-2">
              Tiro Parabólico 3D WebGL
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-bold">
                Vectores 3D Activos
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Ajusta los grados de elevación (10° a 90°) y observa los vectores en tiempo real en todas las vistas de cámara.
          </p>
        </div>

        {/* Camera Views & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Vector Toggle */}
          <button
            type="button"
            onClick={() => setShowVectors3D(!showVectors3D)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur shadow-lg ${
              showVectors3D
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-800'
            }`}
            title="Mostrar/Ocultar Vectores en 3D"
          >
            <Eye className="w-4 h-4" />
            <span>Vectores: {showVectors3D ? 'ON' : 'OFF'}</span>
          </button>

          {/* Camera selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center gap-1 backdrop-blur shadow-lg">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setCameraMode('iso');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                cameraMode === 'iso' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
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
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                cameraMode === 'side' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
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
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                cameraMode === 'chase' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Seguimiento
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-orange-400 transition-all cursor-pointer shadow-lg backdrop-blur"
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-orange-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating HUD Telemetry Overlay + Interactive 3D Degree Adjuster */}
      <div className="relative z-10 px-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Telemetry Pills */}
        <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl font-mono text-xs text-slate-200 shadow-2xl">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">t:</span>
            <span className="font-bold text-cyan-400 tabular-nums">{currentInstant.time.toFixed(2)}s</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">x:</span>
            <span className="font-bold text-blue-400 tabular-nums">{currentInstant.x.toFixed(2)}m</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">y:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{currentInstant.y.toFixed(2)}m</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">v:</span>
            <span className="font-bold text-amber-400 tabular-nums">{currentInstant.velocity.toFixed(2)}m/s</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold">vx:</span>
            <span className="text-slate-300 tabular-nums">{currentInstant.vx.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-400 font-bold">vy:</span>
            <span className="text-slate-300 tabular-nums">{currentInstant.vy.toFixed(1)}</span>
          </div>
        </div>

        {/* INTERACTIVE 3D DEGREE PROTRACTOR WIDGET */}
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-orange-500/50 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.2)] flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-mono text-slate-400 font-bold">ÁNGULO:</span>
            <span className="text-base font-mono font-black text-orange-400 tabular-nums">
              {params.angleDeg}°
            </span>
          </div>

          {/* Steppers */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetAngle(params.angleDeg - 5)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
              title="-5 Grados"
            >
              -5°
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle(params.angleDeg - 1)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
              title="-1 Grado"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle(params.angleDeg + 1)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
              title="+1 Grado"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle(params.angleDeg + 5)}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
              title="+5 Grados"
            >
              +5°
            </button>
          </div>

          {/* Quick degree buttons */}
          <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-2">
            {[30, 45, 60, 90].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => handleSetAngle(deg)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  params.angleDeg === deg
                    ? 'bg-orange-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vector Legend Badge */}
      {showVectors3D && (
        <div className="absolute top-28 left-5 z-10 pointer-events-none hidden sm:flex flex-col gap-1 bg-slate-950/80 backdrop-blur border border-slate-800/80 p-2 rounded-xl text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-1 bg-emerald-400 rounded-full" />
            <span>v⃗ₓ Horizontal: {currentInstant.vx.toFixed(1)} m/s</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400">
            <span className="w-2.5 h-1 bg-purple-400 rounded-full" />
            <span>v⃗ᵧ Vertical: {currentInstant.vy.toFixed(1)} m/s</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <span className="w-2.5 h-1 bg-yellow-400 rounded-full" />
            <span>v⃗ Tangente: {currentInstant.velocity.toFixed(1)} m/s</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-1 bg-rose-400 rounded-full" />
            <span>g⃗ Gravedad: 9.8 m/s² (Abajo)</span>
          </div>
        </div>
      )}

      {/* Score Popup */}
      {scorePopup && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border-2 border-orange-500 rounded-2xl px-6 py-3 shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center gap-4 animate-bounce">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div>
            <div className="text-sm font-black text-white uppercase">{scorePopup.text}</div>
            <div className="text-xl font-mono font-bold text-yellow-400">+{scorePopup.score} Pts</div>
          </div>
          <button
            type="button"
            onClick={handleFire}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Disparar de Nuevo
          </button>
        </div>
      )}

      {/* Bottom Launch Control Bar with Live Degree Slider */}
      <div className="mt-auto relative z-10 p-4 sm:p-5 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFire}
              disabled={isFlying}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>¡DISPARAR 3D! ({params.angleDeg}°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Continuous Angle Elevation Slider Bar */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 flex-1 max-w-xs">
            <span className="text-[11px] whitespace-nowrap">Ángulo α:</span>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={params.angleDeg}
              onChange={(e) => handleSetAngle(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="font-bold text-orange-400 text-xs tabular-nums w-8">
              {params.angleDeg}°
            </span>
          </div>

          {/* Time Scrubber */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>t:</span>
            <input
              type="range"
              min="0"
              max={results.timeTotal || 1}
              step="0.02"
              value={currentTime}
              onChange={(e) => {
                setIsFlying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="w-24 sm:w-28 accent-cyan-500 cursor-pointer"
            />
            <span className="tabular-nums text-cyan-400">{currentTime.toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
