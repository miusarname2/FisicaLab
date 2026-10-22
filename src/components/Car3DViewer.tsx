import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Car3DViewerProps {
  massScale: number; // visual scale factor based on mass
}

export const Car3DViewer: React.FC<Car3DViewerProps> = ({ massScale }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.3, y: 0.8 });
  const roverGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 5.5);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 10);
    cyanPoint.position.set(0, 2, 3);
    scene.add(cyanPoint);

    // Pedestal Platform
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.2, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.1;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(2.1, 2.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Rover Model Group
    const rover = new THREE.Group();
    roverGroupRef.current = rover;

    // Body
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.8, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.85;
    rover.add(bodyMesh);

    // Red Center Sensor
    const sensorGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 24);
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      roughness: 0.1,
    });
    const sensorMesh = new THREE.Mesh(sensorGeo, sensorMat);
    sensorMesh.rotation.x = Math.PI / 2;
    sensorMesh.position.set(0, 0.85, 0.78);
    rover.add(sensorMesh);

    // Top PCB
    const pcbGeo = new THREE.BoxGeometry(1.2, 0.2, 0.9);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
    pcbMesh.position.set(-0.1, 1.35, 0);
    rover.add(pcbMesh);

    // Gold Pins
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 7; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), pinMat);
      pin.position.set(-0.5 + i * 0.16, 1.5, 0.35);
      rover.add(pin);
    }

    // Wires
    const curveRed = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.45, 0.2),
      new THREE.Vector3(0.4, 1.8, 0.4),
      new THREE.Vector3(0.7, 1.2, 0.6),
      new THREE.Vector3(0.8, 0.9, 0.6),
    ]);
    const wireRed = new THREE.Mesh(new THREE.TubeGeometry(curveRed, 20, 0.025, 8, false), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    rover.add(wireRed);

    const curveWhite = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 1.45, 0.25),
      new THREE.Vector3(0.25, 1.75, 0.45),
      new THREE.Vector3(0.55, 1.25, 0.65),
      new THREE.Vector3(0.65, 0.9, 0.65),
    ]);
    const wireWhite = new THREE.Mesh(new THREE.TubeGeometry(curveWhite, 20, 0.02, 8, false), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    rover.add(wireWhite);

    // 4 Wheels
    const wheelPositions = [
      { x: -0.75, z: 0.95 },
      { x: 0.75, z: 0.95 },
      { x: -0.75, z: -0.95 },
      { x: 0.75, z: -0.95 },
    ];
    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, 0.55, pos.z);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 24), new THREE.MeshStandardMaterial({ color: 0x090d16 }));
      tire.rotation.x = Math.PI / 2;
      wheelGroup.add(tire);

      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
      for (let r = 0; r < 8; r++) {
        const angle = (r / 8) * Math.PI * 2;
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 12), yellowMat);
        roller.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0);
        roller.rotation.z = angle + Math.PI / 4;
        wheelGroup.add(roller);
      }

      rover.add(wheelGroup);
    });

    scene.add(rover);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDraggingRef.current && roverGroupRef.current) {
        rotationRef.current.y += 0.006; // gentle idle turntable spin
      }
      if (roverGroupRef.current) {
        roverGroupRef.current.rotation.y = rotationRef.current.y;
        roverGroupRef.current.rotation.x = rotationRef.current.x;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update scale dynamically with mass
  useEffect(() => {
    if (roverGroupRef.current) {
      roverGroupRef.current.scale.set(massScale, massScale, massScale);
    }
  }, [massScale]);

  // Pointer drag to rotate 3D model 360 degrees
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.y += dx * 0.015;
    rotationRef.current.x = Math.max(-0.5, Math.min(0.8, rotationRef.current.x + dy * 0.01));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-56 sm:h-64 relative cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block rounded-2xl" />
      <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono text-cyan-300 pointer-events-none">
        Arrastra para girar 360°
      </div>
    </div>
  );
};
