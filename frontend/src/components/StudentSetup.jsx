import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, ShieldAlert, Sparkles, Brain, Check, RefreshCw } from 'lucide-react';

const StudentSetup = ({ roomId, user, onJoinConfirm, onBack }) => {
  const [cameraPermission, setCameraPermission] = useState('pending'); // 'pending', 'granted', 'denied'
  const [micPermission, setMicPermission] = useState('pending');
  const [stream, setStream] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const requestRef = useRef(null);

  // Initialize camera and mic permissions
  const startDiagnostics = async () => {
    // Clear old streams if any
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setCameraPermission('pending');
    setMicPermission('pending');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true
      });

      setStream(mediaStream);
      setCameraPermission('granted');
      setMicPermission('granted');

      // Bind webcam to video preview element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Analyze microphone levels in real time
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let values = 0;
        const length = dataArray.length;
        for (let i = 0; i < length; i++) {
          values += dataArray[i];
        }
        const average = values / length;
        setAudioLevel(Math.min(100, Math.floor((average / 128) * 100)));
        requestRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();

    } catch (err) {
      console.error('Device diagnostics failed:', err);
      // Determine what failed
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setCameraPermission('denied');
        setMicPermission('denied');
      } else {
        setCameraPermission('error');
        setMicPermission('error');
      }
    }
  };

  useEffect(() => {
    startDiagnostics();

    return () => {
      // Clean up media streams and animations on unmount
      cancelAnimationFrame(requestRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleProceed = () => {
    // Stop local setup streams
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Proceed to room
    onJoinConfirm();
  };

  return (
    <div className="setup-diagnostics-wrapper animate-fade-in">
      <div className="setup-diagnostics-card glass">
        <div className="diagnostics-header">
          <Brain className="diag-logo-icon animate-pulse" size={28} />
          <h2>Hardware Diagnostics Setup</h2>
          <span className="room-label">Joining Session: <strong>{roomId}</strong></span>
        </div>

        <p className="diagnostics-desc">
          To enter the AI-guided tutoring classroom, your camera and microphone must remain authorized. The AI utilizes local camera video feeds to track focus levels. No video is recorded or sent to servers; only attention statistics are transmitted.
        </p>

        {/* Video Circle Container */}
        <div className="diagnostics-visuals">
          <div className="webcam-preview-circle">
            {cameraPermission === 'granted' ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="preview-video-stream"
              />
            ) : cameraPermission === 'pending' ? (
              <div className="preview-placeholder">
                <RefreshCw className="animate-spin text-secondary" size={32} />
                <span>Initializing webcam...</span>
              </div>
            ) : (
              <div className="preview-placeholder error">
                <ShieldAlert size={36} className="text-error" />
                <span>Camera Blocked</span>
              </div>
            )}
            
            {/* Holographic scanner effect overlay */}
            <div className="scanner-line-animation" />
          </div>

          {/* Sound bar meter */}
          <div className="mic-volume-container">
            <div className="mic-label">
              <Mic size={14} />
              <span>Microphone Input Level</span>
            </div>
            <div className="volume-meter-track">
              <div 
                className="volume-meter-fill student" 
                style={{ width: `${cameraPermission === 'granted' ? audioLevel : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Permissions checklists */}
        <div className="checklist-container">
          <div className="check-item">
            <div className={`check-icon ${cameraPermission === 'granted' ? 'success' : 'pending'}`}>
              {cameraPermission === 'granted' ? <Check size={14} /> : <Camera size={14} />}
            </div>
            <div className="check-details">
              <h4>Webcam Authorization</h4>
              <p>
                {cameraPermission === 'granted' 
                  ? 'Authorized successfully. Camera feed active.' 
                  : cameraPermission === 'pending'
                  ? 'Waiting for camera permissions dialog...'
                  : 'Blocked. Please check browser settings and reload.'}
              </p>
            </div>
          </div>

          <div className="check-item">
            <div className={`check-icon ${micPermission === 'granted' ? 'success' : 'pending'}`}>
              {micPermission === 'granted' ? <Check size={14} /> : <Mic size={14} />}
            </div>
            <div className="check-details">
              <h4>Microphone Authorization</h4>
              <p>
                {micPermission === 'granted' 
                  ? 'Authorized successfully. Audio level detected.' 
                  : micPermission === 'pending'
                  ? 'Waiting for audio permissions dialog...'
                  : 'Blocked. Please check microphone hardware.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions button */}
        <div className="diagnostics-actions">
          <button 
            type="button" 
            onClick={onBack} 
            className="diag-btn secondary"
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            onClick={handleProceed} 
            className="diag-btn primary student"
            disabled={cameraPermission !== 'granted' || micPermission !== 'granted'}
          >
            <Sparkles size={16} />
            <span>Join Meeting Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSetup;
