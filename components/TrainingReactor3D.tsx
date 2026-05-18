import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TrainingReactor3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.domElement.className = 'training-reactor-canvas';
    renderer.domElement.dataset.reactorCanvas = 'true';
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const keyLight = new THREE.PointLight(0xff7a1a, 4.2, 18);
    keyLight.position.set(-2.4, 2.1, 4);
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x4fc3ff, 1.5, 16);
    cyanLight.position.set(2.8, -1.6, 3.2);
    scene.add(cyanLight);

    const limeLight = new THREE.PointLight(0x9cff6a, 0.8, 12);
    limeLight.position.set(0.2, -2.4, 3.6);
    scene.add(limeLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambientLight);

    const orangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7a1a,
      emissive: 0xff7a1a,
      emissiveIntensity: 0.62,
      metalness: 0.7,
      roughness: 0.24,
    });

    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0x9fb2c8,
      emissive: 0x1f3148,
      emissiveIntensity: 0.22,
      metalness: 0.92,
      roughness: 0.18,
    });

    const cyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x2ee9ff,
      emissive: 0x2ee9ff,
      emissiveIntensity: 0.36,
      metalness: 0.42,
      roughness: 0.2,
      transparent: true,
      opacity: 0.78,
    });

    const limeMaterial = new THREE.MeshStandardMaterial({
      color: 0x9cff6a,
      emissive: 0x9cff6a,
      emissiveIntensity: 0.28,
      metalness: 0.32,
      roughness: 0.24,
      transparent: true,
      opacity: 0.66,
    });

    const ghostMaterial = new THREE.MeshBasicMaterial({
      color: 0xff7a1a,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
    });
    const cyanGhostMaterial = new THREE.MeshBasicMaterial({
      color: 0x2ee9ff,
      transparent: true,
      opacity: 0.16,
      wireframe: true,
    });

    const ringGroup = new THREE.Group();
    const ringGeometry = new THREE.TorusGeometry(2.35, 0.018, 10, 144);
    const ringGeometryWide = new THREE.TorusGeometry(1.72, 0.035, 14, 144);
    const ringGeometryCyan = new THREE.TorusGeometry(2.58, 0.014, 10, 160);
    const ringA = new THREE.Mesh(ringGeometry, ghostMaterial);
    const ringB = new THREE.Mesh(ringGeometryWide, orangeMaterial);
    const ringCGeometry = new THREE.TorusGeometry(2.86, 0.01, 8, 160);
    const ringC = new THREE.Mesh(ringCGeometry, cyanGhostMaterial);
    const ringD = new THREE.Mesh(ringGeometryCyan, cyanMaterial);
    ringA.rotation.x = Math.PI / 2.6;
    ringB.rotation.x = Math.PI / 2;
    ringC.rotation.x = Math.PI / 2.1;
    ringD.rotation.x = Math.PI / 2.28;
    ringGroup.add(ringA, ringB, ringC, ringD);
    root.add(ringGroup);

    const tickGroup = new THREE.Group();
    const tickGeometry = new THREE.BoxGeometry(0.035, 0.08, 0.34);
    for (let index = 0; index < 28; index += 1) {
      const angle = (index / 28) * Math.PI * 2;
      const radius = index % 7 === 0 ? 2.88 : 2.72;
      const tick = new THREE.Mesh(tickGeometry, index % 7 === 0 ? limeMaterial : cyanMaterial);
      tick.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.26, Math.sin(angle) * 0.8);
      tick.rotation.z = angle;
      tick.rotation.x = Math.PI / 2.8;
      tickGroup.add(tick);
    }
    root.add(tickGroup);

    const barbell = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.8, 24), steelMaterial);
    shaft.rotation.z = Math.PI / 2;
    barbell.add(shaft);

    [-1.65, -1.42, 1.42, 1.65].forEach((x, index) => {
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(index % 2 === 0 ? 0.42 : 0.34, index % 2 === 0 ? 0.42 : 0.34, 0.18, 36),
        index % 2 === 0 ? orangeMaterial : steelMaterial,
      );
      plate.rotation.z = Math.PI / 2;
      plate.position.x = x;
      barbell.add(plate);
    });
    barbell.rotation.z = -0.36;
    root.add(barbell);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), orangeMaterial);
    root.add(core);

    const grid = new THREE.GridHelper(18, 36, 0xff7a1a, 0x173348);
    grid.position.y = -2.45;
    grid.position.z = -2;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    root.add(grid);

    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 2.8 + Math.random() * 4.6;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.4;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 1.2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xff8a1f,
        size: 0.035,
        transparent: true,
        opacity: 0.64,
        depthWrite: false,
      }),
    );
    root.add(particles);

    const pointer = { x: 0, y: 0, pulse: 0 };

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * -2;
    };

    const handlePointerDown = () => {
      pointer.pulse = 1;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    const startTime = performance.now();
    let frameId = 0;

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const pulse = pointer.pulse;
      pointer.pulse *= 0.91;

      root.rotation.y = elapsed * 0.08 + pointer.x * 0.12;
      root.rotation.x = pointer.y * 0.08;
      ringA.rotation.z = elapsed * 0.33;
      ringB.rotation.z = -elapsed * 0.52;
      ringC.rotation.z = elapsed * 0.18;
      ringD.rotation.z = -elapsed * 0.28 + pointer.x * 0.08;
      tickGroup.rotation.z = -elapsed * 0.08;
      tickGroup.scale.setScalar(1 + pulse * 0.08);
      core.rotation.x = elapsed * 0.7;
      core.rotation.y = elapsed * 0.45;
      core.scale.setScalar(1 + pulse * 0.22 + Math.sin(elapsed * 2) * 0.035);
      barbell.rotation.y = Math.sin(elapsed * 0.7) * 0.18 + pointer.x * 0.12;
      particles.rotation.y = elapsed * 0.025;
      keyLight.intensity = 4.2 + pulse * 3.4;
      cyanLight.intensity = 1.5 + pulse * 2.2;
      limeLight.intensity = 0.8 + pulse * 1.1;

      renderer.render(scene, camera);
      if (!reducedMotion) frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      mount.removeChild(renderer.domElement);
      ringGeometry.dispose();
      ringGeometryWide.dispose();
      ringGeometryCyan.dispose();
      ringCGeometry.dispose();
      tickGeometry.dispose();
      particleGeometry.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
        }
      });
      orangeMaterial.dispose();
      steelMaterial.dispose();
      cyanMaterial.dispose();
      limeMaterial.dispose();
      ghostMaterial.dispose();
      cyanGhostMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="training-reactor"
      aria-hidden="true"
      data-reactor-root="true"
    />
  );
};

export default TrainingReactor3D;
