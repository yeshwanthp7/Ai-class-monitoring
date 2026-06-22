import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPortal from './components/AuthPortal';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherRoom from './components/TeacherRoom';
import StudentDashboard from './components/StudentDashboard';
import StudentSetup from './components/StudentSetup';
import StudentRoom from './components/StudentRoom';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student'); // 'student' or 'teacher'
  const [view, setView] = useState('landing'); // 'landing', 'auth', 'dashboard', 'setup', 'room'
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Meeting details
  const [activeRoomId, setActiveRoomId] = useState('');
  const [activeRoomData, setActiveRoomData] = useState(null);

  // Sync session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setRole(parsedUser.role);
      setView('dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setRole(userData.role);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    setView('landing');
    setActiveRoomId('');
    setActiveRoomData(null);
  };

  const handleStartTeacherRoom = (roomData) => {
    setActiveRoomData(roomData);
    setActiveRoomId(roomData.roomId);
    setView('room');
  };

  const handleJoinStudentSetup = (roomId) => {
    setActiveRoomId(roomId);
    setView('setup');
  };

  const handleConfirmStudentJoin = () => {
    setView('room');
  };

  // State-based Routing engine
  const renderCurrentView = () => {
    // 1. Authenticated views
    if (user) {
      if (role === 'teacher') {
        if (view === 'room' && activeRoomData) {
          return (
            <TeacherRoom 
              initialRoomData={activeRoomData} 
              onLeave={() => setView('dashboard')}
            />
          );
        }
        return (
          <TeacherDashboard 
            user={user} 
            onLogout={handleLogout} 
            onStartRoom={handleStartTeacherRoom}
          />
        );
      } else {
        // Scholar portals
        if (view === 'setup') {
          return (
            <StudentSetup 
              roomId={activeRoomId} 
              user={user} 
              onJoinConfirm={handleConfirmStudentJoin} 
              onBack={() => setView('dashboard')}
            />
          );
        }
        if (view === 'room') {
          return (
            <StudentRoom 
              roomId={activeRoomId} 
              user={user} 
              onLeave={() => setView('dashboard')}
            />
          );
        }
        return (
          <StudentDashboard 
            user={user} 
            onLogout={handleLogout} 
            onJoinRoom={handleJoinStudentSetup}
          />
        );
      }
    }

    // 2. Unauthenticated views
    if (view === 'auth') {
      return (
        <AuthPortal 
          role={role} 
          setRole={setRole} 
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => setView('landing')}
        />
      );
    }

    // Default Landing Page
    return (
      <LandingPage 
        setShowLogin={() => setView('auth')} 
        setRole={setRole} 
        showSidebar={showSidebar} 
        setShowSidebar={setShowSidebar}
      />
    );
  };

  return (
    <div className={`app-container ${role}`}>
      <main className="main-viewport-content">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
