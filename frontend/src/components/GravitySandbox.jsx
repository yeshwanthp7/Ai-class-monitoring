import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Trash2, RotateCcw } from 'lucide-react';

const GravitySandbox = () => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  
  // Predefined topics to spawn on click
  const topicsList = [
    'React', 'MERN Stack', 'Automated Grading', 'Lesson Planner', 
    'Linear Algebra', 'Physics', 'Three.js', 'Express.js', 
    'MongoDB', 'Node.js', 'Quantum Computing', 'Data Structures',
    'Algorithm Design', 'Prompt Engineering', 'AI Tutor Hub'
  ];
  
  const spawnedCountRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Make canvas fit the container size
    const resizeCanvas = () => {
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 400; // Fixed height for sandbox container
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // AI Core Properties (Fixed in center)
    const getCenter = () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 40
    });

    // Node generation helper
    const createNode = (name, x, y) => {
      // Pick random colors: Student (cyan) or Teacher (pink/purple) themes
      const isStudentTheme = Math.random() > 0.5;
      const color = isStudentTheme ? '#00f3ff' : '#ec4899';
      const shadowColor = isStudentTheme ? 'rgba(0, 243, 255, 0.4)' : 'rgba(236, 72, 153, 0.4)';
      
      return {
        id: Math.random().toString(),
        name,
        x: x || Math.random() * canvas.width,
        y: y || Math.random() * canvas.height,
        radius: Math.max(name.length * 4.5, 30),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        mass: name.length * 2,
        color,
        shadowColor,
        isDragged: false
      };
    };

    // Spawn 5 initial nodes
    const initialNodes = [
      createNode('MERN Stack', canvas.width * 0.2, canvas.height * 0.25),
      createNode('AI Tutor Hub', canvas.width * 0.3, canvas.height * 0.75),
      createNode('Lesson Planner', canvas.width * 0.75, canvas.height * 0.3),
      createNode('Automated Grading', canvas.width * 0.8, canvas.height * 0.7),
      createNode('Physics', canvas.width * 0.5, canvas.height * 0.15)
    ];

    let activeNodes = [...initialNodes];
    setNodes(activeNodes);

    // Physics parameters
    const gravityConstant = 0.25;
    const damping = 0.985;
    let draggedNode = null;
    let mouse = { x: 0, y: 0 };
    let previousMouse = { x: 0, y: 0 };

    // Mouse handlers
    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseDown = (e) => {
      const pos = getMousePos(e);
      mouse = pos;
      previousMouse = pos;

      // Check if clicked on any node
      for (let node of activeNodes) {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < node.radius) {
          draggedNode = node;
          node.isDragged = true;
          node.vx = 0;
          node.vy = 0;
          break;
        }
      }

      // If clicked on empty space, spawn a new node!
      if (!draggedNode) {
        const center = getCenter();
        const dx = pos.x - center.x;
        const dy = pos.y - center.y;
        const distToCore = Math.sqrt(dx * dx + dy * dy);

        // Don't spawn on top of AI Core
        if (distToCore > center.radius + 10) {
          const name = topicsList[spawnedCountRef.current % topicsList.length];
          spawnedCountRef.current++;
          const newNode = createNode(name, pos.x, pos.y);
          activeNodes.push(newNode);
          setNodes([...activeNodes]);
        }
      }
    };

    const handleMouseMove = (e) => {
      const pos = getMousePos(e);
      mouse = pos;
    };

    const handleMouseUp = () => {
      if (draggedNode) {
        // Calculate throw speed
        draggedNode.vx = (mouse.x - previousMouse.x) * 0.8;
        draggedNode.vy = (mouse.y - previousMouse.y) * 0.8;
        draggedNode.isDragged = false;
        draggedNode = null;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    let animationFrameId;

    const updatePhysics = () => {
      const center = getCenter();
      
      // Update mouse position memory for throw speed calculation
      if (draggedNode) {
        draggedNode.x = mouse.x;
        draggedNode.y = mouse.y;
        draggedNode.vx = 0;
        draggedNode.vy = 0;
      }

      // Physics steps
      for (let i = 0; i < activeNodes.length; i++) {
        const node = activeNodes[i];
        if (node.isDragged) continue;

        // 1. Gravitational pull towards central AI core
        const dx = center.x - node.x;
        const dy = center.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > center.radius) {
          // Gravity pull force: F = G * m / r^2
          const force = (gravityConstant * node.mass) / (dist + 50);
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        } else {
          // Push back if colliding with the core
          const overlap = center.radius - dist;
          node.x -= (dx / (dist || 1)) * overlap;
          node.y -= (dy / (dist || 1)) * overlap;
          node.vx = -node.vx * 0.5;
          node.vy = -node.vy * 0.5;
        }

        // 2. Damping (friction)
        node.vx *= damping;
        node.vy *= damping;

        // 3. Move coordinates
        node.x += node.vx;
        node.y += node.vy;

        // 4. Edge collisions
        const leftLimit = node.radius;
        const rightLimit = canvas.width - node.radius;
        const topLimit = node.radius;
        const bottomLimit = canvas.height - node.radius;

        if (node.x < leftLimit) { node.x = leftLimit; node.vx *= -0.6; }
        if (node.x > rightLimit) { node.x = rightLimit; node.vx *= -0.6; }
        if (node.y < topLimit) { node.y = topLimit; node.vy *= -0.6; }
        if (node.y > bottomLimit) { node.y = bottomLimit; node.vy *= -0.6; }

        // 5. Node-to-Node collisions (simple bounce)
        for (let j = i + 1; j < activeNodes.length; j++) {
          const other = activeNodes[j];
          const collisionDx = other.x - node.x;
          const collisionDy = other.y - node.y;
          const distance = Math.sqrt(collisionDx * collisionDx + collisionDy * collisionDy);
          const minDistance = node.radius + other.radius + 5;

          if (distance < minDistance) {
            const overlap = minDistance - distance;
            const pushX = (collisionDx / (distance || 1)) * overlap * 0.5;
            const pushY = (collisionDy / (distance || 1)) * overlap * 0.5;
            
            node.x -= pushX;
            node.y -= pushY;
            other.x += pushX;
            other.y += pushY;

            // Bounce vectors swapping
            const tempVx = node.vx;
            const tempVy = node.vy;
            node.vx = other.vx * 0.7;
            node.vy = other.vy * 0.7;
            other.vx = tempVx * 0.7;
            other.vy = tempVy * 0.7;
          }
        }
      }

      previousMouse = { ...mouse };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const center = getCenter();

      // 1. Draw Synaptic Glow Connections (lines to center)
      activeNodes.forEach(node => {
        const dx = center.x - node.x;
        const dy = center.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Render glowing line connections when within gravitational proximity (350px)
        if (dist < 320) {
          const opacity = (1.0 - (dist / 320)) * 0.35;
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = opacity;
          
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(center.x, center.y);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Draw small flowing light packets along lines
          const percent = (Date.now() % 2000) / 2000; // 0 to 1 loop
          const packetX = node.x + (center.x - node.x) * percent;
          const packetY = node.y + (center.y - node.y) * percent;

          ctx.beginPath();
          ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
        }
      });

      // 2. Draw Subject Nodes
      activeNodes.forEach(node => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        
        // Node fill (glassmorphic dark backdrop)
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.fill();

        // Node glowing border
        ctx.shadowBlur = node.isDragged ? 20 : 10;
        ctx.shadowColor = node.color;
        ctx.strokeStyle = node.color;
        ctx.lineWidth = node.isDragged ? 2.5 : 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset

        // Node Name text
        ctx.fillStyle = '#ffffff';
        ctx.font = '500 12px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, node.x, node.y);
        ctx.restore();
      });

      // 3. Draw AI Neural Core (Center node)
      ctx.save();
      // Draw ambient pulsing glow back ring
      const pulseFactor = 1.0 + Math.sin(Date.now() / 300) * 0.08;
      const coreGlowRad = center.radius * pulseFactor;

      const radialGrad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, coreGlowRad + 15);
      radialGrad.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      radialGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
      radialGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, coreGlowRad + 15, 0, Math.PI * 2);
      ctx.fill();

      // Main core body
      ctx.beginPath();
      ctx.arc(center.x, center.y, center.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 10, 30, 0.95)';
      ctx.fill();
      ctx.strokeStyle = '#a78bfa'; // Purple core border
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#a78bfa';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Text in Core
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MIND-CORE', center.x, center.y - 6);
      ctx.fillStyle = '#a78bfa';
      ctx.font = '700 9px "Outfit", sans-serif';
      ctx.fillText('ACTIVE', center.x, center.y + 8);
      ctx.restore();
    };

    const animateLoop = () => {
      updatePhysics();
      draw();
      animationFrameId = requestAnimationFrame(animateLoop);
    };

    animateLoop();

    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Quick action panel controls
  const handleClear = () => {
    spawnedCountRef.current = 0;
    // Set empty array
    const canvas = canvasRef.current;
    if (canvas) {
      // Clear nodes
      setNodes([]);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="sandbox-outer-wrapper">
      <div className="sandbox-header">
        <div className="header-info">
          <Sparkles className="hud-accent-sparkle" size={16} />
          <h4>Gravity Sandbox Workspace</h4>
          <span className="sandbox-counter">{nodes.length} Nodes Simulated</span>
        </div>
        <div className="sandbox-controls">
          <button onClick={handleClear} className="control-btn" title="Clear Sandbox">
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
          <button onClick={handleReset} className="control-btn" title="Reset Sandbox">
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
      
      <p className="sandbox-instruction">
        💡 **Gravity Creativity**: Click anywhere inside the grid canvas to spawn new subject files. Drag them around to toss them, and watch them gravitate toward the Central AI Mind Core to consolidate course knowledge.
      </p>

      <div ref={containerRef} className="sandbox-canvas-container">
        {/* Background grids */}
        <div className="sandbox-grid-line-vertical" />
        <div className="sandbox-grid-line-horizontal" />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default GravitySandbox;
