import React from 'react';
import BrainCanvas from './BrainCanvas';
import LoginCard from './LoginCard';

const AuthPortal = ({ role, setRole, onLoginSuccess, onBack }) => {
  return (
    <div className="split-auth-container animate-fade-in">
      {/* Left panel holds the rotating 3D particle brain network */}
      <div className="auth-visual-panel">
        <div className="visual-glow-background" />
        <BrainCanvas theme={role} />
        <div className="visual-content-overlay-spacer" />
      </div>

      {/* Right panel holds the login card inputs */}
      <div className="auth-form-panel">
        <LoginCard 
          role={role} 
          setRole={setRole} 
          onLoginSuccess={onLoginSuccess} 
          onBack={onBack}
        />
      </div>
    </div>
  );
};

export default AuthPortal;
