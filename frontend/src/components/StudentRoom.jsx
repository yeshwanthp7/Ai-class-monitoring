import React, { useState, useEffect, useRef } from 'react';
import { Brain, Camera, Mic, Volume2, VolumeX, Eye, BookOpen, AlertTriangle, Play, Sparkles } from 'lucide-react';

const StudentRoom = ({ roomId, user, onLeave }) => {
  const [roomData, setRoomData] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cvState, setCvState] = useState('Attentive'); // 'Attentive', 'Sleeping', 'Looking Away', 'Phone Detected'
  const [overrideMode, setOverrideMode] = useState(true); // default true for clean demo triggers
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [engagementScore, setEngagementScore] = useState(100);

  const videoRef = useRef(null);
  const cvCanvasRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const localStreamRef = useRef(null);
  const cvLoopRef = useRef(null);

  // 1. Fetch Room State from backend (poll every 1.5 seconds)
  useEffect(() => {
    const fetchRoomState = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Room disconnected');
        }
        const data = await response.json();
        setRoomData(data);

        // Sync slide index with teacher
        if (data.currentSlideIndex !== undefined && data.currentSlideIndex !== activeSlide) {
          setActiveSlide(data.currentSlideIndex);
        }
      } catch (err) {
        console.error('Error fetching room state:', err);
      }
    };

    fetchRoomState();
    const interval = setInterval(fetchRoomState, 1500);

    return () => clearInterval(interval);
  }, [roomId, activeSlide]);

  // 2. Initialize Student Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 160, height: 120 },
          audio: false
        });
        setCameraStream(stream);
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Could not grab webcam stream for room overlay:', err);
      }
    };

    startCamera();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 3. Text-to-Speech narration when slide updates
  useEffect(() => {
    if (!roomData || isMuted) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // stop current speech

    // Narrate active slide bullets or full transcript
    const currentSlide = roomData.slides[activeSlide];
    if (!currentSlide) return;

    let textToSpeak = "";
    if (activeSlide === 0) {
      textToSpeak = roomData.aiScript; // Read full lecture overview on first slide
    } else {
      textToSpeak = `Slide ${activeSlide + 1}: ${currentSlide.title}. ${currentSlide.bullets.join('. ')}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en')) || null;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [roomData, activeSlide, isMuted]);

  // 4. Client-side Computer Vision overlay loop (canvas render)
  useEffect(() => {
    let frameId;
    const ctx = cvCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    let xDir = 1;
    let scanY = 10;
    let landmarkPulse = 0;

    const renderCV = () => {
      const canvas = cvCanvasRef.current;
      if (!canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      landmarkPulse += 0.15;

      // Draw bounding box
      let boxColor = '#00f3ff'; // cyan
      let statusText = 'FOCUS: EXCELLENT';

      if (cvState === 'Sleeping') {
        boxColor = '#ef4444'; // red
        statusText = 'ALARM: SLEEP DETECTED';
      } else if (cvState === 'Looking Away') {
        boxColor = '#f59e0b'; // orange
        statusText = 'WARNING: DISTRACTED';
      } else if (cvState === 'Phone Detected') {
        boxColor = '#ec4899'; // pink
        statusText = 'ALARM: SMARTPHONE DETECTED';
      }

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      
      // Box coords (centered face outline)
      const bx = w * 0.25;
      const by = h * 0.20;
      const bw = w * 0.50;
      const bh = h * 0.60;

      ctx.strokeRect(bx, by, bw, bh);

      // Corner accent brackets
      ctx.fillStyle = boxColor;
      ctx.fillRect(bx - 4, by - 4, 12, 3);
      ctx.fillRect(bx - 4, by - 4, 3, 12);
      ctx.fillRect(bx + bw - 8, by - 4, 12, 3);
      ctx.fillRect(bx + bw + 1, by - 4, 3, 12);
      ctx.fillRect(bx - 4, by + bh - 8, 3, 12);
      ctx.fillRect(bx - 4, by + bh + 1, 12, 3);
      ctx.fillRect(bx + bw + 1, by + bh - 8, 3, 12);
      ctx.fillRect(bx + bw - 8, by + bh + 1, 12, 3);

      // Scan bar
      scanY += xDir * 2.5;
      if (scanY > by + bh || scanY < by) {
        xDir *= -1;
      }
      ctx.fillStyle = `rgba(${cvState === 'Sleeping' ? '239, 68, 68' : '0, 243, 255'}, 0.25)`;
      ctx.fillRect(bx, scanY - 1, bw, 2);

      // Draw fake facial landmarks (nodes)
      const landmarks = [
        { x: w * 0.5, y: h * 0.45 }, // Nose
        { x: w * 0.4, y: h * 0.38 }, // Left eye
        { x: w * 0.6, y: h * 0.38 }, // Right eye
        { x: w * 0.5, y: h * 0.65 }, // Mouth
        { x: w * 0.38, y: h * 0.52 }, // Left cheek
        { x: w * 0.62, y: h * 0.52 }, // Right cheek
      ];

      ctx.fillStyle = boxColor;
      landmarks.forEach((pt, idx) => {
        // Pulse eyes specifically
        let ptSize = 3;
        if ((idx === 1 || idx === 2) && cvState === 'Sleeping') {
          // Sleeping -> draw flat line for eyes
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(pt.x - 6, pt.y);
          ctx.lineTo(pt.x + 6, pt.y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, ptSize + Math.sin(landmarkPulse + idx) * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw overlay text info
      ctx.fillStyle = boxColor;
      ctx.font = 'bold 8px Courier New';
      ctx.fillText(statusText, bx, by - 6);

      // If phone active, draw phone box mock
      if (cvState === 'Phone Detected') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
        ctx.strokeStyle = '#ec4899';
        ctx.fillRect(w * 0.65, h * 0.55, 20, 35);
        ctx.strokeRect(w * 0.65, h * 0.55, 20, 35);
        ctx.fillStyle = '#ec4899';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('DEVICE', w * 0.61, h * 0.52);
      }

      frameId = requestAnimationFrame(renderCV);
    };

    renderCV();
    return () => cancelAnimationFrame(frameId);
  }, [cvState]);

  // 5. Send Telemetry Updates to Backend every 1.5 seconds
  useEffect(() => {
    let score = 100;
    if (cvState === 'Sleeping') score = 15;
    else if (cvState === 'Phone Detected') score = 30;
    else if (cvState === 'Looking Away') score = 55;

    setEngagementScore(score);

    const sendTelemetry = async () => {
      try {
        await fetch(`http://localhost:5000/api/rooms/${roomId}/engage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentEmail: user.email,
            state: cvState,
            engagementScore: score,
            isCameraOn: true,
            isMicOn: true
          }),
        });
      } catch (err) {
        console.error('Telemetry report failed:', err);
      }
    };

    // Send immediately when CV State changes, and then periodically
    sendTelemetry();
    const interval = setInterval(sendTelemetry, 1500);

    return () => clearInterval(interval);
  }, [roomId, user.email, cvState]);

  // 6. Draw dynamic slide vector SVGs based on category
  const renderSlideDiagram = (type) => {
    const svgClass = "slide-diagram-svg";
    
    if (type?.startsWith('photosynthesis')) {
      return (
        <svg className={svgClass} viewBox="0 0 200 120">
          <defs>
            <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Sunlight */}
          <circle cx="30" cy="30" r="18" fill="url(#sun-glow)" className="sun-pulse" />
          <line x1="30" y1="30" x2="65" y2="55" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
          {/* Leaf */}
          <path d="M 60,80 C 60,50 110,40 140,60 C 140,80 110,100 60,80 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
          <path d="M 60,80 L 140,60" stroke="#047857" strokeWidth="1.5" />
          {/* Energy indicators */}
          <text x="15" y="65" fill="#f3f4f6" fontSize="6" fontWeight="bold">Sunlight Energy</text>
          <text x="90" y="45" fill="#00f3ff" fontSize="7" fontWeight="bold">H₂O + CO₂</text>
          <text x="135" y="85" fill="#ec4899" fontSize="7" fontWeight="bold">O₂ + Glucose</text>
        </svg>
      );
    }

    if (type?.startsWith('quantum')) {
      return (
        <svg className={svgClass} viewBox="0 0 200 120">
          <circle cx="100" cy="60" r="30" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="2,2" />
          {/* Qubit Sphere axis */}
          <ellipse cx="100" cy="60" rx="30" ry="10" fill="none" stroke="#5b21b6" strokeWidth="1" strokeDasharray="4,4" />
          <ellipse cx="100" cy="60" rx="10" ry="30" fill="none" stroke="#5b21b6" strokeWidth="1" strokeDasharray="4,4" />
          {/* Superposition vectors */}
          <line x1="100" y1="60" x2="118" y2="38" stroke="#00f3ff" strokeWidth="2" />
          <circle cx="118" cy="38" r="4" fill="#00f3ff" className="qubit-pulse" />
          
          <line x1="100" y1="60" x2="82" y2="82" stroke="#ec4899" strokeWidth="1.5" />
          <circle cx="82" cy="82" r="3" fill="#ec4899" />
          
          <text x="92" y="24" fill="#f3f4f6" fontSize="7">|0⟩ Ket State</text>
          <text x="92" y="103" fill="#f3f4f6" fontSize="7">|1⟩ Ket State</text>
        </svg>
      );
    }

    // Generic abstract graph
    return (
      <svg className={svgClass} viewBox="0 0 200 120">
        <circle cx="50" cy="40" r="10" fill="rgba(0, 243, 255, 0.15)" stroke="#00f3ff" strokeWidth="1.5" />
        <circle cx="150" cy="40" r="10" fill="rgba(236, 72, 153, 0.15)" stroke="#ec4899" strokeWidth="1.5" />
        <circle cx="100" cy="85" r="12" fill="rgba(139, 92, 246, 0.15)" stroke="#8b5cf6" strokeWidth="1.5" />

        <line x1="60" y1="40" x2="140" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <line x1="50" y1="50" x2="90" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <line x1="150" y1="50" x2="110" y2="80" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

        <text x="44" y="43" fill="#f3f4f6" fontSize="8" fontWeight="bold">IN</text>
        <text x="141" y="43" fill="#f3f4f6" fontSize="8" fontWeight="bold">OUT</text>
        <text x="94" y="88" fill="#f3f4f6" fontSize="8" fontWeight="bold">AI</text>
      </svg>
    );
  };

  if (!roomData) {
    return (
      <div className="classroom-loading-screen">
        <Brain className="animate-spin-slow text-student" size={48} />
        <h2>Connecting to AI Tutoring Session...</h2>
        <p>Syncing slides and configuring audio pipelines.</p>
      </div>
    );
  }

  const currentSlide = roomData.slides[activeSlide] || roomData.slides[0];

  return (
    <div className="classroom-layout-container animate-fade-in">
      {/* Top Banner Bar */}
      <header className="classroom-header-bar glass">
        <div className="header-logo-group" onClick={onLeave}>
          <Brain className="sidebar-logo-icon" size={22} />
          <h2>MindBridge AI Classroom</h2>
        </div>
        <div className="header-middle-topic">
          <span>Active Topic: <strong>{roomData.topic}</strong></span>
        </div>
        <div className="header-right-actions">
          <button 
            type="button" 
            onClick={() => setIsMuted(!isMuted)} 
            className={`action-btn ${isMuted ? 'muted' : ''}`}
            title={isMuted ? "Unmute AI Assistant" : "Mute AI Assistant"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="room-badge student">ROOM: {roomId}</span>
          <button onClick={onLeave} className="leave-classroom-btn">
            Leave Meeting
          </button>
        </div>
      </header>

      {/* Main Grid: Visuals left, details/CV right */}
      <div className="classroom-grid">
        {/* LEFT COLUMN: PPT Presentation Deck */}
        <div className="presentation-deck glass">
          <div className="presentation-slide animate-fade-in">
            <span className="slide-number-indicator">Slide {activeSlide + 1} of {roomData.slides.length}</span>
            <h3>{currentSlide.title}</h3>
            
            {/* Visual Vector graphic canvas */}
            <div className="slide-visual-diagram">
              {renderSlideDiagram(currentSlide.diagramType)}
            </div>

            <div className="slide-content-bullets">
              <ul>
                {currentSlide.bullets.map((bullet, idx) => (
                  <li key={idx} className="animate-slide-down" style={{ animationDelay: `${idx * 0.15}s` }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Narration Audio Waveform Indicator */}
          {isSpeaking && (
            <div className="narrator-speaking-waveform">
              <div className="waveform-bar bar-1 student" />
              <div className="waveform-bar bar-2 student" />
              <div className="waveform-bar bar-3 student" />
              <div className="waveform-bar bar-4 student" />
              <div className="waveform-bar bar-5 student" />
              <span>AI Assistant Lecturing Voice Active...</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Camera Stream & Local Computer Vision telemetry */}
        <div className="telemetry-deck">
          {/* Webcam bubble feed */}
          <div className="webcam-feed-container glass">
            <div className="feed-header">
              <Camera size={14} />
              <span>Live Student Focus Telemetry</span>
            </div>
            
            <div className="camera-view-window">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="raw-video-feed"
              />
              <canvas 
                ref={cvCanvasRef} 
                width={160} 
                height={120} 
                className="cv-overlay-canvas"
              />
              
              {/* Scan box frame */}
              <div className={`scan-bounding-box-visual ${cvState}`} />
            </div>
            
            <div className="feed-stats-bar">
              <div className="stat-node">
                <span className="label">Status</span>
                <span className={`value status-text-color-${cvState}`}>{cvState}</span>
              </div>
              <div className="stat-node">
                <span className="label">Attention index</span>
                <span className="value">{engagementScore}%</span>
              </div>
            </div>
          </div>

          {/* Computer Vision Simulation controller */}
          <div className="telemetry-debug-controls glass">
            <h4>
              <Eye size={14} className="student-glow" />
              <span>Attentiveness Calibration (Simulation Console)</span>
            </h4>
            <p className="debug-help-text">
              Manually trigger different postures below to transmit alert telemetry values to the teacher's dashboard:
            </p>
            
            <div className="debug-buttons-row">
              <button 
                type="button" 
                onClick={() => setCvState('Attentive')} 
                className={`debug-btn btn-attentive ${cvState === 'Attentive' ? 'active' : ''}`}
              >
                Fully Attentive
              </button>
              <button 
                type="button" 
                onClick={() => setCvState('Sleeping')} 
                className={`debug-btn btn-sleeping ${cvState === 'Sleeping' ? 'active' : ''}`}
              >
                Simulate Sleeping
              </button>
              <button 
                type="button" 
                onClick={() => setCvState('Looking Away')} 
                className={`debug-btn btn-distracted ${cvState === 'Looking Away' ? 'active' : ''}`}
              >
                Look Away
              </button>
              <button 
                type="button" 
                onClick={() => setCvState('Phone Detected')} 
                className={`debug-btn btn-phone ${cvState === 'Phone Detected' ? 'active' : ''}`}
              >
                Hold Phone
              </button>
            </div>

            <div className="classroom-alert-indicator-box">
              {cvState !== 'Attentive' && (
                <div className="alarm-log-alert-pill active animate-pulse">
                  <AlertTriangle size={14} />
                  <span>TRANSMITTING FOCUS LOG ALARM TO INSTRUCTOR</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRoom;
