import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BrainCanvas = ({ theme }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let renderer = null;
    let scene = null;
    let camera = null;
    let animationFrameId = null;

    try {
      // 1. Scene Setup
      scene = new THREE.Scene();
      
      // 2. Camera Setup (using direct viewport dimensions)
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        100
      );
      camera.position.z = 5.2;

      // 3. Renderer Setup
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      containerRef.current.appendChild(renderer.domElement);

      console.warn('🧠 [BrainCanvas] Three.js WebGL Renderer successfully initialized.');
      console.warn(`🧠 [BrainCanvas] Viewport size: ${width}x${height}`);

      // 4. Create Brain Group
      const brainGroup = new THREE.Group();
      scene.add(brainGroup);

      // 5. Generate Brain Particles
      const particleCount = 480;
      const positions = [];
      const originalPositions = [];
      const colors = [];
      const sizes = [];
      const offsets = [];

      // Helper for circular glow texture
      const createGlowTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Solid center core, fading to bright color, then translucent purple, then transparent
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.18, 'rgba(0, 243, 255, 0.95)');
        gradient.addColorStop(0.55, 'rgba(139, 92, 246, 0.45)');
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true; // Force upload immediately
        return texture;
      };

      const particleTexture = createGlowTexture();

      // Color definitions based on role
      // Student: Cyan/Blue, Teacher: Purple/Magenta
      const colorStudent = new THREE.Color(0x00f3ff); // Neon Cyan
      const colorTeacher = new THREE.Color(0xec4899); // Hot Pink
      const colorBridge = new THREE.Color(0x8b5cf6);   // Violet

      // Build the brain coordinates mathematically
      for (let i = 0; i < particleCount; i++) {
        let x = 0, y = 0, z = 0;
        const type = Math.random();

        if (type < 0.78) {
          // Main Cerebrum Hemispheres
          const u = Math.random() * Math.PI;
          const v = Math.random() * Math.PI * 2;
          
          // Modulate radius with high frequency sin/cos to make organic brain folds (gyri & sulci)
          const r = 1.15 + 0.12 * Math.sin(6 * v) * Math.cos(6 * u) + 0.05 * Math.sin(14 * v) * Math.sin(14 * u);
          
          x = r * Math.sin(u) * Math.cos(v);
          y = r * Math.cos(u);
          z = r * Math.sin(u) * Math.sin(v);

          // Reshape to look like a cerebrum (rounder side-to-side, uncompressed)
          x *= 0.86;
          y *= 0.82;
          z *= 1.10;

          // Hemispheric division (left/right split fissure)
          if (x > 0) {
            x += 0.07;
          } else {
            x -= 0.07;
          }
        } else if (type < 0.91) {
          // Cerebellum (bottom back)
          const u = Math.random() * Math.PI * 0.4 + Math.PI * 0.55; // lower half
          const v = Math.random() * Math.PI + Math.PI; // back side
          const r = 0.55 + 0.05 * Math.sin(10 * v) * Math.cos(10 * u);

          x = r * Math.sin(u) * Math.cos(v);
          y = r * Math.cos(u) - 0.45;
          z = r * Math.sin(u) * Math.sin(v) - 0.35;

          x *= 0.65;
          y *= 0.45;
          z *= 0.65;
        } else {
          // Brainstem (cylinder extending down from center)
          const radius = 0.12 * (1.0 - Math.random() * 0.4);
          const angle = Math.random() * Math.PI * 2;
          x = radius * Math.cos(angle);
          z = radius * Math.sin(angle) - 0.1;
          y = -0.7 - Math.random() * 0.6;
        }

        positions.push(x, y, z);
        originalPositions.push(x, y, z);

        // Distribute colors: left side Student-like, right side Teacher-like, brainstem purple
        let particleColor = new THREE.Color();
        if (y < -0.6) {
          particleColor.copy(colorBridge);
        } else if (x > 0) {
          particleColor.lerpColors(colorTeacher, colorBridge, Math.random() * 0.4);
        } else {
          particleColor.lerpColors(colorStudent, colorBridge, Math.random() * 0.4);
        }

        colors.push(particleColor.r, particleColor.g, particleColor.b);
        sizes.push(Math.random() * 0.15 + 0.05);
        offsets.push(Math.random() * Math.PI * 2);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      // Make size significantly larger (from 0.12 to 0.26) for strong visibility
      const material = new THREE.PointsMaterial({
        size: 0.26,
        map: particleTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
      });

      const particles = new THREE.Points(geometry, material);
      brainGroup.add(particles);

      // 6. Connect Nodes with Lines
      const maxDistance = 0.36;
      const linePositions = [];
      const lineColors = [];
      const originalLinePositions = [];
      const lineIndices = [];

      const posArray = geometry.attributes.position.array;
      const colorArray = geometry.attributes.color.array;

      for (let i = 0; i < particleCount; i++) {
        const p1 = new THREE.Vector3(posArray[i*3], posArray[i*3+1], posArray[i*3+2]);
        const c1 = new THREE.Color(colorArray[i*3], colorArray[i*3+1], colorArray[i*3+2]);
        
        let connections = 0;
        for (let j = i + 1; j < particleCount; j++) {
          if (connections > 4) break;
          
          const p2 = new THREE.Vector3(posArray[j*3], posArray[j*3+1], posArray[j*3+2]);
          const dist = p1.distanceTo(p2);
          
          if (dist < maxDistance) {
            const c2 = new THREE.Color(colorArray[j*3], colorArray[j*3+1], colorArray[j*3+2]);
            
            linePositions.push(p1.x, p1.y, p1.z);
            linePositions.push(p2.x, p2.y, p2.z);
            
            originalLinePositions.push(p1.x, p1.y, p1.z);
            originalLinePositions.push(p2.x, p2.y, p2.z);

            // Line color is a gradient between node colors
            lineColors.push(c1.r, c1.g, c1.b);
            lineColors.push(c2.r, c2.g, c2.b);

            lineIndices.push(i, j);
            connections++;
          }
        }
      }

      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

      // Make line basic opacity stronger for visibility (from 0.16 to 0.32)
      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      brainGroup.add(lines);

      // 7. Interactive Drag/Swipe Rotation Setup
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let targetRotationY = 0.5; // Starts at a slight angle
      let targetRotationX = 0.15;
      
      brainGroup.rotation.y = 0.5;
      brainGroup.rotation.x = 0.15;

      const handleMouseDown = (e) => {
        if (e.target.closest('.login-card') || e.target.closest('button') || e.target.closest('input')) return;
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        targetRotationY += deltaX * 0.007;
        targetRotationX += deltaY * 0.007;
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      // Touch events for mobile dragging
      const handleTouchStart = (e) => {
        if (e.target.closest('.login-card') || e.target.closest('button') || e.target.closest('input')) return;
        isDragging = true;
        previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      };

      const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        
        targetRotationY += deltaX * 0.007;
        targetRotationX += deltaY * 0.007;
        
        previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      };

      const handleTouchEnd = () => {
        isDragging = false;
      };

      const dom = containerRef.current;
      dom.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      dom.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      // 8. Animation Loop
      let clock = new THREE.Clock();
      let logLoopCounter = 0;

      const animate = () => {
        if (!isMounted) return; // Exit loop if component is unmounted
        
        animationFrameId = requestAnimationFrame(animate);
        
        const time = clock.getElapsedTime();
        
        // Log loop execution once in terminal to confirm active render thread
        if (logLoopCounter === 0) {
          console.warn('🧠 [BrainCanvas] Three.js active render loop started successfully.');
          logLoopCounter++;
        }
        
        // Auto slowly rotate when not dragging
        if (!isDragging) {
          targetRotationY += 0.0015;
        }
        
        // Smooth lerp rotation for inertia effect
        brainGroup.rotation.y += (targetRotationY - brainGroup.rotation.y) * 0.06;
        brainGroup.rotation.x += (targetRotationX - brainGroup.rotation.x) * 0.06;
        
        // Clamp X rotation to avoid flipping upside down
        brainGroup.rotation.x = Math.max(-Math.PI / 4.5, Math.min(Math.PI / 4.5, brainGroup.rotation.x));

        // Pulse particles: gentle breathing cycle
        const particlePosAttr = geometry.attributes.position;
        const linePosAttr = lineGeometry.attributes.position;

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          const offset = offsets[i];
          
          const origX = originalPositions[idx];
          const origY = originalPositions[idx+1];
          const origZ = originalPositions[idx+2];
          
          // Breathing pulse amplitude
          const pulse = 1.0 + Math.sin(time * 1.8 + offset) * 0.025;
          
          particlePosAttr.array[idx] = origX * pulse;
          particlePosAttr.array[idx+1] = origY * pulse;
          particlePosAttr.array[idx+2] = origZ * pulse;
        }
        particlePosAttr.needsUpdate = true;

        // Update connected lines corresponding to the new particle nodes
        let lineIdx = 0;
        for (let k = 0; k < lineIndices.length; k += 2) {
          const i1 = lineIndices[k];
          const i2 = lineIndices[k+1];

          // Start node coords
          linePosAttr.array[lineIdx * 3] = particlePosAttr.array[i1 * 3];
          linePosAttr.array[lineIdx * 3 + 1] = particlePosAttr.array[i1 * 3 + 1];
          linePosAttr.array[lineIdx * 3 + 2] = particlePosAttr.array[i1 * 3 + 2];

          // End node coords
          linePosAttr.array[(lineIdx + 1) * 3] = particlePosAttr.array[i2 * 3];
          linePosAttr.array[(lineIdx + 1) * 3 + 1] = particlePosAttr.array[i2 * 3 + 1];
          linePosAttr.array[(lineIdx + 1) * 3 + 2] = particlePosAttr.array[i2 * 3 + 2];
          
          lineIdx += 2;
        }
        linePosAttr.needsUpdate = true;

        // Line pulsing and glow adjustment (more prominent)
        lineMaterial.opacity = 0.28 + Math.sin(time * 2.5) * 0.08;

        // Size adjustment based on the active role theme (much larger particles)
        if (theme === 'teacher') {
          material.size = 0.28 + Math.sin(time * 1.5) * 0.04;
        } else if (theme === 'student') {
          material.size = 0.28 + Math.sin(time * 3.0) * 0.04;
        } else {
          material.size = 0.26;
        }

        renderer.render(scene, camera);
      };

      animate();

      // 9. Resize Handling via ResizeObserver
      const resizeObserver = new ResizeObserver((entries) => {
        if (!isMounted) return;
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (width === 0 || height === 0) continue;
          
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          
          renderer.setSize(width, height);
        }
      });

      resizeObserver.observe(containerRef.current);

      // Cleanup on unmount
      return () => {
        isMounted = false;
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
        dom.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        
        dom.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        scene.clear();
        renderer.dispose();
      };

    } catch (err) {
      console.error('🧠 [BrainCanvas] WebGL failed or threw error:', err);
      
      // Inject CSS + HTML animated particle fallback
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="fallback-particles-wrapper" style="
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
          ">
            <style>
              @keyframes float-around {
                0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
                50% { transform: translateY(-100px) translateX(50px) scale(1.1); opacity: 0.6; }
                100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
              }
              .fallback-node {
                position: absolute;
                border-radius: 50%;
                filter: blur(1px);
                animation: float-around 20s infinite ease-in-out;
              }
            </style>
            <!-- Render 15 animated glowing nodes as a safe layout fallback -->
            <div class="fallback-node" style="width: 12px; height: 12px; background: rgba(0, 243, 255, 0.4); left: 15%; top: 20%; animation-duration: 22s; box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);"></div>
            <div class="fallback-node" style="width: 8px; height: 8px; background: rgba(139, 92, 246, 0.3); left: 25%; top: 60%; animation-duration: 18s; animation-delay: -2s; box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);"></div>
            <div class="fallback-node" style="width: 16px; height: 16px; background: rgba(236, 72, 153, 0.3); left: 75%; top: 30%; animation-duration: 25s; animation-delay: -5s; box-shadow: 0 0 20px rgba(236, 72, 153, 0.5);"></div>
            <div class="fallback-node" style="width: 10px; height: 10px; background: rgba(0, 243, 255, 0.4); left: 65%; top: 75%; animation-duration: 21s; animation-delay: -1s; box-shadow: 0 0 15px rgba(0, 243, 255, 0.5);"></div>
            <div class="fallback-node" style="width: 14px; height: 14px; background: rgba(139, 92, 246, 0.3); left: 40%; top: 15%; animation-duration: 28s; animation-delay: -8s; box-shadow: 0 0 18px rgba(139, 92, 246, 0.4);"></div>
            <div class="fallback-node" style="width: 7px; height: 7px; background: rgba(236, 72, 153, 0.4); left: 48%; top: 85%; animation-duration: 15s; animation-delay: -3s; box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);"></div>
            <div class="fallback-node" style="width: 11px; height: 11px; background: rgba(0, 243, 255, 0.3); left: 85%; top: 65%; animation-duration: 24s; animation-delay: -11s; box-shadow: 0 0 14px rgba(0, 243, 255, 0.4);"></div>
            <div class="fallback-node" style="width: 9px; height: 9px; background: rgba(139, 92, 246, 0.4); left: 10%; top: 50%; animation-duration: 19s; animation-delay: -4s; box-shadow: 0 0 12px rgba(139, 92, 246, 0.5);"></div>
          </div>
        `;
      }
    }
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className="brain-bg-canvas"
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1, 
        cursor: 'grab', 
        userSelect: 'none',
        pointerEvents: 'auto'
      }} 
    />
  );
};

export default BrainCanvas;
