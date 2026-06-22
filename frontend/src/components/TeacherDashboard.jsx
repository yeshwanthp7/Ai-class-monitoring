import React, { useState } from 'react';
import { Sparkles, Brain, LogOut, GraduationCap, Play, RefreshCw, Key } from 'lucide-react';

const TeacherDashboard = ({ user, onLogout, onStartRoom }) => {
  const [roomId, setRoomId] = useState(() => {
    // Generate a random room key, e.g., MB-4927
    return `MB-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateNewKey = () => {
    setRoomId(`MB-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!topic.trim()) {
      setError('Please provide an active lecturing topic.');
      return;
    }

    setLoading(true);

    try {
      // Register room on the backend
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          teacherEmail: user.email,
          topic: topic.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to initialize class session.');
      }

      // Transition to the teacher room screen
      onStartRoom(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper animate-fade-in">
      {/* Top Navbar */}
      <header className="dashboard-header glass">
        <div className="logo-group">
          <div className="logo-icon-wrapper">
            <Brain size={22} className="logo-icon animate-pulse" />
          </div>
          <h1>MindBridge AI</h1>
        </div>

        <div className="user-profile-group">
          <span className="role-badge teacher">
            <GraduationCap size={14} />
            EDUCATOR
          </span>
          <span className="user-name">Welcome, {user.name}</span>
          <button onClick={onLogout} className="logout-btn" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Configuration Card */}
      <div className="dashboard-single-container">
        <div className="dashboard-card glass creator-panel animate-slide-up">
          <div className="card-top">
            <Sparkles className="accent-icon teacher" size={22} />
            <h3>Initialize AI Classroom Portal</h3>
          </div>
          <p className="card-desc">
            Define a unique meeting key and input an academic topic. The AI Assistant will instantly index this topic via search models to present and speak to joined students.
          </p>

          {error && (
            <div className="error-alert animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="setup-form">
            <div className="setup-form-group">
              <label htmlFor="roomId-input">
                <Key size={14} />
                <span>Classroom Meeting ID (Share with students)</span>
              </label>
              <div className="key-input-row">
                <input
                  id="roomId-input"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g., MB-7777"
                  required
                />
                <button 
                  type="button" 
                  onClick={generateNewKey} 
                  className="regenerate-btn" 
                  title="Generate Random Key"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="setup-form-group">
              <label htmlFor="topic-input">
                <Sparkles size={14} className="teacher-glow" />
                <span>Active Tutoring Topic (Google/Gemini fetched)</span>
              </label>
              <input
                id="topic-input"
                type="text"
                placeholder="e.g., Photosynthesis & Light Reactions, or Quantum Computing"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="gen-btn teacher setup-submit-btn" disabled={loading}>
              <Play size={16} />
              <span>{loading ? 'Initializing Classroom...' : 'Start AI Classroom Meeting'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
