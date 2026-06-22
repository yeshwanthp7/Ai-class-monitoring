import React, { useState } from 'react';
import { LogOut, Sparkles, BookOpen, GraduationCap, Brain, CheckCircle, Clock } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      if (user.role === 'teacher') {
        setOutput(`🤖 AI LESSON PLAN GENERATED FOR "${prompt.toUpperCase()}"\n\n1. Introduction (10 mins): Brief overview & historical context.\n2. Core Concepts (20 mins): Key terminology, visuals, and dynamic demos.\n3. Interactive Lab (15 mins): Group breakout sessions and peer review.\n4. AI Prompt Drill (10 mins): Querying the assistant with edge-cases.`);
      } else {
        setOutput(`🤖 STUDY MAP GENERATED FOR "${prompt.toUpperCase()}"\n\n• Target Proficiency: 85% in 4 days.\n• Core Focus Areas: Syntax foundations, logical branching, edge-case debugging.\n• Suggested Practice: Build a simple mini-project using the specified scope.\n• Recommended Quiz: "Fundamentals level 2" (estimated time: 15 mins).`);
      }
      setGenerating(false);
    }, 1500);
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
          <span className={`role-badge ${user.role}`}>
            {user.role === 'teacher' ? <GraduationCap size={14} /> : <BookOpen size={14} />}
            {user.role.toUpperCase()}
          </span>
          <span className="user-name">Welcome, {user.name}</span>
          <button onClick={onLogout} className="logout-btn" title="Log Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <div className="dashboard-grid">
        {/* Left Interactive panel: AI Assistant Command Center */}
        <div className="dashboard-card glass main-panel">
          <div className="card-top">
            <Sparkles className={`accent-icon ${user.role}`} size={20} />
            <h3>{user.role === 'teacher' ? 'AI Lesson Plan Architect' : 'AI Study Buddy'}</h3>
          </div>
          <p className="card-desc">
            {user.role === 'teacher' 
              ? 'Input a subject topic to instantaneously generate structured lesson plans, exercises, and grading rubrics.' 
              : 'Enter a topic you are struggling with to structure an instant revision pathway and custom quiz prompts.'}
          </p>

          <form onSubmit={handleGenerate} className="generator-form">
            <input
              type="text"
              placeholder={user.role === 'teacher' ? 'e.g., Introduction to Quantum Mechanics' : 'e.g., Recursion in JavaScript'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
            <button type="submit" className={`gen-btn ${user.role}`} disabled={generating}>
              {generating ? 'Structuring...' : 'Generate Roadmap'}
            </button>
          </form>

          {output && (
            <div className="ai-response-box animate-fade-in">
              <pre>{output}</pre>
            </div>
          )}
        </div>

        {/* Right Stats & Activities */}
        <div className="right-panel">
          <div className="dashboard-card glass mini-stat">
            <div className="stat-icon-wrapper cyan">
              <Brain size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Neural Capacity</span>
              <span className="stat-value">94.8% Active</span>
            </div>
          </div>

          <div className="dashboard-card glass mini-stat">
            <div className="stat-icon-wrapper purple">
              {user.role === 'teacher' ? <GraduationCap size={20} /> : <BookOpen size={20} />}
            </div>
            <div className="stat-info">
              <span className="stat-label">{user.role === 'teacher' ? 'Classes Supervised' : 'Path Progression'}</span>
              <span className="stat-value">{user.role === 'teacher' ? '4 Sections' : 'Level 12 Scholar'}</span>
            </div>
          </div>

          <div className="dashboard-card glass list-panel">
            <h3>Recent Activity</h3>
            <ul className="activity-list">
              <li>
                <CheckCircle size={16} className="status-icon success" />
                <div className="activity-details">
                  <span className="activity-title">System handshake complete</span>
                  <span className="activity-time">Just now</span>
                </div>
              </li>
              <li>
                <Clock size={16} className="status-icon pending" />
                <div className="activity-details">
                  <span className="activity-title">{user.role === 'teacher' ? 'Midterm grading queue' : 'Data Structures assignment'}</span>
                  <span className="activity-time">Pending AI Audit</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
