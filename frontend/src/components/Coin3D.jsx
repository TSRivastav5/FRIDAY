import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A real rotating 3D coin — FRIDAY's mark embossed on a glassy mint-green
 * disc, lit from the top-left. This is the one genuine 3D moment in the
 * app (login/onboarding hero); everything else uses CSS/Framer Motion for
 * depth so this stays special.
 */
export function Coin3D({ size = 120, color = 0x00d09c }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.CylinderGeometry(1, 1, 0.22, 48);
    const material = new THREE.MeshPhongMaterial({
      color,
      specular: 0xffffff,
      shininess: 120,
      transparent: true,
      opacity: 0.92,
    });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.x = Math.PI / 2;
    scene.add(coin);

    // Simplified "F" mark — a bolt-like shape embossed on the coin face.
    const markShape = new THREE.Shape();
    markShape.moveTo(-0.28, 0.5);
    markShape.lineTo(0.32, 0.5);
    markShape.lineTo(0.06, 0.05);
    markShape.lineTo(0.34, 0.05);
    markShape.lineTo(-0.3, -0.5);
    markShape.lineTo(-0.06, -0.02);
    markShape.lineTo(-0.34, -0.02);
    markShape.closePath();
    const markGeo = new THREE.ExtrudeGeometry(markShape, { depth: 0.06, bevelEnabled: false });
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mark = new THREE.Mesh(markGeo, markMat);
    mark.position.z = 0.12;
    coin.add(mark);

    const keyLight = new THREE.PointLight(0xffffff, 1.1, 100);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0x606060));

    camera.position.z = 3;

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      coin.rotation.y += 0.012;
      coin.position.y = Math.sin(Date.now() * 0.0018) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth || size;
      const h = container.clientHeight || size;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      markGeo.dispose();
      markMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, color]);

  return <div ref={containerRef} style={{ width: size, height: size }} />;
}

export default Coin3D;
