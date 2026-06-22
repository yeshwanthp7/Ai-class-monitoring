import React, { useState } from 'react';
import { Mail, Lock, User, GraduationCap, ArrowRight, BookOpen, X } from 'lucide-react';

const LoginCard = ({ role, setRole, onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const bodyData = isLogin 
      ? { email, password, role } 
      : { name, email, password, role };

    try {
      // Connect to the express API
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      localStorage.setItem('userInfo', JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className={`login-card ${role}`}>
      {onBack && (
        <button type="button" onClick={onBack} className="close-card-btn" title="Back to Landing">
          <X size={18} />
        </button>
      )}
      {/* Header section with changing roles representation */}
      <div className="card-header">
        <div className="icon-glow-wrapper">
          {role === 'teacher' ? (
            <GraduationCap className="role-icon" size={32} />
          ) : (
            <BookOpen className="role-icon" size={32} />
          )}
        </div>
        <h2>{role === 'teacher' ? 'Educator Space' : 'Scholar Portal'}</h2>
        <p>
          {isLogin 
            ? `Sign in to access your AI-powered ${role === 'teacher' ? 'teaching assistant' : 'learning path'}` 
            : `Create an account to unlock tailored ${role === 'teacher' ? 'lessons & grading' : 'study materials'}`}
        </p>
      </div>

      {/* Role Toggle Tabs */}
      <div className="role-toggle-tabs">
        <button
          type="button"
          className={`tab-btn student ${role === 'student' ? 'active' : ''}`}
          onClick={() => {
            setRole('student');
            setError('');
          }}
        >
          <BookOpen size={16} />
          <span>Student</span>
        </button>
        <button
          type="button"
          className={`tab-btn teacher ${role === 'teacher' ? 'active' : ''}`}
          onClick={() => {
            setRole('teacher');
            setError('');
          }}
        >
          <GraduationCap size={16} />
          <span>Teacher</span>
        </button>
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="error-alert animate-fade-in">
          {error}
        </div>
      )}

      {/* Auth Fields */}
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="input-group animate-slide-down">
            <span className="input-icon-wrapper">
              <User size={18} />
            </span>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="input-group">
          <span className="input-icon-wrapper">
            <Mail size={18} />
          </span>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <span className="input-icon-wrapper">
            <Lock size={18} />
          </span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={`submit-btn ${role}`} disabled={loading}>
          <span>{loading ? 'Processing...' : isLogin ? 'Authenticate' : 'Create Account'}</span>
          {!loading && <ArrowRight size={18} className="arrow-icon" />}
        </button>
      </form>

      {/* Toggle Form Mode Button */}
      <div className="card-footer">
        <button type="button" onClick={toggleMode} className="toggle-mode-btn">
          {isLogin ? (
            <>
              First time here? <span className="highlight-text">Join the platform</span>
            </>
          ) : (
            <>
              Already have an account? <span className="highlight-text">Log in here</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginCard;
