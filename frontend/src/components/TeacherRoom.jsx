import React, { useState, useEffect } from 'react';
import { Brain, Users, Sparkles, AlertTriangle, ArrowLeft, ArrowRight, Play, Eye, Volume2, ShieldAlert } from 'lucide-react';

const TeacherRoom = ({ initialRoomData, onLeave }) => {
  const [roomData, setRoomData] = useState(initialRoomData);
  const [activeSlide, setActiveSlide] = useState(0);
  const [students, setStudents] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [topicChangeSuccess, setTopicChangeSuccess] = useState(false);

  const roomId = roomData.roomId;

  // 1. Fetch live student engagement & slide details (Poll every 1.5s)
  useEffect(() => {
    const pollRoomState = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/engage`);
        if (!response.ok) throw new Error('Failed to fetch room');
        const data = await response.json();
        
        setStudents(data.students || []);
        setActiveSlide(data.currentSlideIndex || 0);

        // Update topic if modified on backend
        if (data.topic !== roomData.topic) {
          setRoomData(prev => ({ ...prev, topic: data.topic }));
        }

        // Scan for distracted/sleeping students to push to log alerts
        data.students.forEach(student => {
          if (student.state !== 'Attentive') {
            const timestamp = new Date().toLocaleTimeString();
            const alertMsg = `${student.name} (${student.email}) is ${student.state}!`;
            
            // Avoid duplicate log alarms
            setAlerts(prev => {
              const alreadyLogged = prev.some(a => a.msg === alertMsg && (Date.now() - a.time) < 8000);
              if (alreadyLogged) return prev;
              return [{ id: Math.random(), msg: alertMsg, stamp: timestamp, type: student.state, time: Date.now() }, ...prev].slice(0, 15);
            });
          }
        });

      } catch (err) {
        console.error('Error polling teacher telemetry:', err);
      }
    };

    pollRoomState();
    const interval = setInterval(pollRoomState, 1500);

    return () => clearInterval(interval);
  }, [roomId, roomData.topic]);

  // 2. Change active slide on backend
  const changeSlide = async (newIndex) => {
    if (newIndex < 0 || newIndex >= roomData.slides.length) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/slide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ index: newIndex }),
      });

      if (response.ok) {
        setActiveSlide(newIndex);
      }
    } catch (err) {
      console.error('Failed to change slide:', err);
    }
  };

  // 3. Update lesson topic (fetch new content from simulated Gemini API)
  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setLoadingTopic(true);
    setTopicChangeSuccess(false);

    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}/update-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });

      const updatedRoom = await response.json();
      if (!response.ok) {
        throw new Error(updatedRoom.message || 'Failed to update topic');
      }

      setRoomData(updatedRoom);
      setActiveSlide(0);
      setTopicInput('');
      setTopicChangeSuccess(true);
      setTimeout(() => setTopicChangeSuccess(false), 3000);
    } catch (err) {
      console.error('Error changing room topic:', err);
    } finally {
      setLoadingTopic(false);
    }
  };

  // Calculations for dashboard indicators
  const totalStudents = students.length;
  const distractedStudents = students.filter(s => s.state !== 'Attentive').length;
  const attentiveCount = totalStudents - distractedStudents;
  const averageFocusScore = totalStudents > 0 
    ? Math.floor(students.reduce((acc, curr) => acc + curr.engagementScore, 0) / totalStudents) 
    : 100;

  return (
    <div className="classroom-layout-container teacher-portal animate-fade-in">
      {/* Top Banner Bar */}
      <header className="classroom-header-bar glass">
        <div className="header-logo-group" onClick={onLeave}>
          <Brain className="sidebar-logo-icon" size={22} />
          <h2>MindBridge Educator Desk</h2>
        </div>
        <div className="header-middle-topic">
          <span>Active Topic: <strong>{roomData.topic}</strong></span>
        </div>
        <div className="header-right-actions">
          <span className="room-badge teacher">ROOM KEY: {roomId}</span>
          <button onClick={onLeave} className="leave-classroom-btn teacher">
            Close Session
          </button>
        </div>
      </header>

      {/* Main Grid: Control left, Telemetry right */}
      <div className="classroom-grid">
        {/* LEFT COLUMN: Presentation deck manager & topic changes */}
        <div className="presentation-deck teacher glass">
          <div className="teacher-control-header">
            <h3>Lesson Deck Controls</h3>
            <div className="deck-control-row">
              <button 
                type="button" 
                onClick={() => changeSlide(activeSlide - 1)} 
                disabled={activeSlide === 0}
                className="deck-arrow-btn"
                title="Previous Slide"
              >
                <ArrowLeft size={16} />
              </button>
              <span className="deck-slide-indicator">Slide {activeSlide + 1} of {roomData.slides.length}</span>
              <button 
                type="button" 
                onClick={() => changeSlide(activeSlide + 1)} 
                disabled={activeSlide === roomData.slides.length - 1}
                className="deck-arrow-btn"
                title="Next Slide"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Current slide preview card */}
          <div className="teacher-slide-preview-box">
            <span className="preview-label">Live Presentation Preview</span>
            <h4>{roomData.slides[activeSlide]?.title}</h4>
            <ul className="preview-bullets">
              {roomData.slides[activeSlide]?.bullets.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          </div>

          {/* Dynamic Topic Fetcher */}
          <div className="topic-fetcher-section">
            <h4>
              <Sparkles size={16} className="teacher-glow" />
              <span>Redirect Lesson Topic (Live Gemini Update)</span>
            </h4>
            <p className="topic-subtext">
              Enter a new academic topic. Submitting will rebuild the slide content, update student visual graphics, and compile a new audio narration script instantly.
            </p>
            
            <form onSubmit={handleUpdateTopic} className="topic-update-form">
              <input
                type="text"
                placeholder="e.g. Solar System Orbits, or Machine Learning Basics"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                required
              />
              <button type="submit" disabled={loadingTopic} className="topic-submit-btn teacher">
                {loadingTopic ? 'Generating slides...' : 'Push Topic Change'}
              </button>
            </form>

            {topicChangeSuccess && (
              <div className="success-banner-alert animate-fade-in">
                Success! Presentation updated and synced with students.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Realtime Student Telemetry Dashboard */}
        <div className="telemetry-deck teacher">
          {/* Aggregate focus widgets */}
          <div className="telemetry-aggregates-row">
            <div className="aggregate-box glass">
              <span className="agg-label">Attentiveness Index</span>
              <span className={`agg-val focus-${averageFocusScore > 75 ? 'good' : 'warning'}`}>{averageFocusScore}%</span>
            </div>
            <div className="aggregate-box glass">
              <span className="agg-label">Total Scholars</span>
              <span className="agg-val">{totalStudents} Joined</span>
            </div>
            <div className="aggregate-box glass">
              <span className="agg-label">Distracted/Sleeping</span>
              <span className={`agg-val alert-${distractedStudents > 0 ? 'active' : 'inactive'}`}>{distractedStudents}</span>
            </div>
          </div>

          {/* Live Student list grid */}
          <div className="students-status-scrollpane glass">
            <h4>
              <Users size={16} />
              <span>Live Student Telemetry Streams</span>
            </h4>

            {totalStudents === 0 ? (
              <div className="no-students-placeholder">
                <Users size={32} className="animate-pulse" />
                <p>Waiting for students to join classroom room <strong>{roomId}</strong>...</p>
              </div>
            ) : (
              <div className="students-grid-list">
                {students.map(student => (
                  <div key={student.email} className={`student-telemetry-card ${student.state}`}>
                    <div className="card-top-info">
                      <div className="name-box">
                        <h5>{student.name}</h5>
                        <span>{student.email}</span>
                      </div>
                      <span className={`state-badge status-badge-color-${student.state}`}>
                        {student.state}
                      </span>
                    </div>

                    <div className="card-telemetry-metrics">
                      <div className="metric-row">
                        <span>Engagement score:</span>
                        <span className="metric-score">{student.engagementScore}%</span>
                      </div>
                      <div className="engagement-gauge-track">
                        <div 
                          className={`engagement-gauge-fill ${student.state}`} 
                          style={{ width: `${student.engagementScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Alert logs */}
          <div className="teacher-alerts-logbox glass">
            <h4>
              <AlertTriangle size={15} />
              <span>Live Computer Vision Security Log</span>
            </h4>
            
            <div className="alerts-history-list">
              {alerts.length === 0 ? (
                <div className="no-alerts-notice">
                  <span>No facial scanning alarms triggered. Classroom focus is optimal.</span>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`alert-log-row ${alert.type} animate-slide-down`}>
                    <span className="timestamp">[{alert.stamp}]</span>
                    <span className="message">{alert.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherRoom;
