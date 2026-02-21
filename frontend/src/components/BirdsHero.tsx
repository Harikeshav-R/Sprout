import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const BIRD_COUNT = 200;
const VISUAL_RANGE = 250;
const SEPARATION_DIST = 180;
const SPEED_LIMIT = 6.5;
const MIN_SPEED = 3.5;

export default function BirdsHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const toggleSoundRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene - transparent background to show hero image through
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 6000);
    camera.position.set(0, 0, 1400);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 3D Audio
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const birdSound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('https://ik.imagekit.io/sqiqig7tz/birds-2.mp3', (buffer) => {
      birdSound.setBuffer(buffer);
      birdSound.setLoop(true);
      birdSound.setVolume(1.5);
      birdSound.setRefDistance(400);
      birdSound.setMaxDistance(3000);
      // Auto-start sound (may require user interaction first due to browser policy)
      const tryPlay = async () => {
        if (listener.context.state === 'suspended') {
          await listener.context.resume();
        }
        birdSound.play();
      };
      tryPlay();
    });

    const soundEmitter = new THREE.Object3D();
    soundEmitter.add(birdSound);
    scene.add(soundEmitter);

    toggleSoundRef.current = () => {
      if (!birdSound.buffer) return;
      if (birdSound.isPlaying) {
        birdSound.pause();
        setSoundEnabled(false);
      } else {
        birdSound.play();
        setSoundEnabled(true);
      }
    };

    // Mouse & hit plane
    const hitGeometry = new THREE.PlaneGeometry(20000, 20000);
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitPlane = new THREE.Mesh(hitGeometry, hitMaterial);
    scene.add(hitPlane);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetPoint = new THREE.Vector3();
    let lastMouseMoveTime = 0;
    let isMouseActive = false;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      lastMouseMoveTime = Date.now();
      isMouseActive = true;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Bird geometry
    const baseGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0.0, 0.0, 5.0, -12.5, 0.0, -2.5, 0.0, 0.0, -2.5,
      0.0, 0.0, 5.0, 0.0, 0.0, -2.5, 12.5, 0.0, -2.5,
    ]);
    baseGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const instancedGeometry = new THREE.InstancedBufferGeometry();
    const posAttr = baseGeometry.getAttribute('position');
    instancedGeometry.setAttribute('position', posAttr.clone());

    const randomAttribute = new Float32Array(BIRD_COUNT);
    for (let i = 0; i < BIRD_COUNT; i++) randomAttribute[i] = Math.random() * 5.0;
    instancedGeometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randomAttribute, 1));

    const material = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
    const userData = { time: { value: 0 } };

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = userData.time;
      shader.vertexShader = `uniform float time; attribute float aRandom;\n` + shader.vertexShader;
      const customTransform = `
        vec3 transformed = vec3( position );
        float flapSpeed = 8.0 + aRandom;
        float angle = time * flapSpeed + aRandom;
        float yOffset = sin(angle) * abs(transformed.x) * 0.45;
        transformed.y += yOffset;
      `;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', customTransform);
    };

    const mesh = new THREE.InstancedMesh(instancedGeometry, material, BIRD_COUNT);
    scene.add(mesh);

    const position: THREE.Vector3[] = [];
    const velocity: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < BIRD_COUNT; i++) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 200
      );
      position.push(p);
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * SPEED_LIMIT,
        (Math.random() - 0.5) * SPEED_LIMIT,
        (Math.random() - 0.5) * SPEED_LIMIT
      );
      velocity.push(v);
      dummy.position.copy(p);
      dummy.lookAt(p.clone().add(v));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    function updateTarget(time: number) {
      if (Date.now() - lastMouseMoveTime > 2000) isMouseActive = false;

      if (isMouseActive) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(hitPlane);
        if (intersects.length > 0) targetPoint.copy(intersects[0].point);
      } else {
        const wanderX = Math.sin(time * 0.4) * 100;
        const wanderY = Math.cos(time * 0.6) * 100;
        const wanderZ = Math.sin(time * 0.3) * 100;
        const wanderTarget = new THREE.Vector3(wanderX, wanderY, wanderZ);
        targetPoint.lerp(wanderTarget, 0.05);
      }
    }

    function updatePhysics() {
      const centerOfMass = new THREE.Vector3();

      for (let i = 0; i < BIRD_COUNT; i++) {
        const pos = position[i];
        const vel = velocity[i];
        centerOfMass.add(pos);

        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        let count = 0;

        const checkStart = (i + Math.floor(Math.random() * 10)) % BIRD_COUNT;
        for (let k = 0; k < 45; k++) {
          const j = (checkStart + k) % BIRD_COUNT;
          if (i === j) continue;

          const dSq = pos.distanceToSquared(position[j]);
          if (dSq < VISUAL_RANGE * VISUAL_RANGE) {
            const dist = Math.sqrt(dSq);
            if (dist < SEPARATION_DIST) {
              const push = new THREE.Vector3().subVectors(pos, position[j]);
              push.normalize();
              push.divideScalar(Math.max(dist * 0.4, 0.1));
              separation.add(push);
            }
            alignment.add(velocity[j]);
            cohesion.add(position[j]);
            count++;
          }
        }

        if (count > 0) {
          separation.multiplyScalar(7.0);
          alignment.divideScalar(count).normalize().multiplyScalar(1.0);
          cohesion.divideScalar(count).sub(pos).normalize().multiplyScalar(0.7);
          vel.add(separation);
          vel.add(alignment);
          vel.add(cohesion);
        }

        const targetForce = new THREE.Vector3().subVectors(targetPoint, pos);
        const distToTarget = targetForce.length();
        let pullStrength = isMouseActive ? 0.35 : 0.02;

        if (distToTarget < 200) {
          pullStrength *= distToTarget / 200;
          vel.multiplyScalar(0.92);
        }
        targetForce.normalize().multiplyScalar(pullStrength);
        vel.add(targetForce);

        if (isMouseActive) vel.multiplyScalar(0.97);

        const speed = vel.length();
        if (speed > SPEED_LIMIT) vel.multiplyScalar(SPEED_LIMIT / speed);
        if (speed < MIN_SPEED) vel.normalize().multiplyScalar(MIN_SPEED);

        pos.add(vel);
        dummy.position.copy(pos);
        dummy.lookAt(pos.clone().add(vel));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      centerOfMass.divideScalar(BIRD_COUNT);
      soundEmitter.position.lerp(centerOfMass, 0.1);
    }

    const clock = new THREE.Clock();
    let frameId: number;

    function animate() {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = Date.now() * 0.001;
      userData.time.value += delta;
      updateTarget(time);
      updatePhysics();
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      birdSound.stop();
      // Suspend AudioContext to ensure no sound leaks to other pages
      listener.context.suspend();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[1] pointer-events-auto">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleSoundRef.current?.();
        }}
        className="absolute bottom-6 right-6 z-[100] text-gray-600 font-sans text-sm select-none transition-opacity duration-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-white/20 cursor-pointer"
        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
      >
        {soundEnabled ? 'Click to disable sound' : 'Click to enable sound'}
      </button>
    </div>
  );
}
