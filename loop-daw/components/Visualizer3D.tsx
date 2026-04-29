"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getAnalyserLevels } from "../lib/audioEngine";

export function Visualizer3D() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 5.4, 12);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const light = new THREE.PointLight(0x5eead4, 18, 24);
    light.position.set(0, 7, 4);
    scene.add(light);

    const bars = Array.from({ length: 32 }, (_, index) => {
      const geometry = new THREE.BoxGeometry(0.16, 1, 0.16);
      const material = new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? 0x5eead4 : index % 3 === 1 ? 0xa78bfa : 0xfbbf24,
        emissive: 0x111111,
        roughness: 0.38,
        metalness: 0.28,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const angle = (index / 32) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4);
      mesh.rotation.y = -angle;
      group.add(mesh);
      return mesh;
    });

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.015, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.34 }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = Math.max(rect.width / Math.max(rect.height, 1), 0.1);
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const levels = getAnalyserLevels();
      const idle = performance.now() * 0.001;
      bars.forEach((bar, index) => {
        const level = levels[index] ?? 0;
        const height = 0.18 + level * 3.6 + Math.sin(idle + index) * 0.035;
        bar.scale.y += (height - bar.scale.y) * 0.22;
        bar.position.y = bar.scale.y / 2 - 0.06;
      });
      group.rotation.y += 0.004;
      ring.scale.setScalar(1 + (levels[2] ?? 0) * 0.08);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
      bars.forEach((bar) => {
        bar.geometry.dispose();
        (bar.material as THREE.Material).dispose();
      });
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section className="visualizer-canvas relative min-h-0 overflow-hidden rounded-lg border border-white/10 bg-[#11151a]/85">
      <div className="pointer-events-none absolute p-3">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-teal-200">3D Output</p>
        <p className="text-xs font-bold text-slate-500">Reactive analyser</p>
      </div>
      <div ref={hostRef} className="h-full w-full" />
    </section>
  );
}
