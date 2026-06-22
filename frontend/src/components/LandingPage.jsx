import React, { useEffect } from 'react';
import GravitySandbox from './GravitySandbox';
import { Menu, X, Brain, GraduationCap, BookOpen, Settings, UploadCloud, ChevronRight, Mail, Phone, MapPin, Sparkles } from 'lucide-react';

const LandingPage = ({ 
  setShowLogin, 
  setRole, 
  showSidebar, 
  setShowSidebar 
}) => {

  // Scroll reveal Intersection Observer hook
  useEffect(() => {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });
    
    revealElements.forEach(el => observer.observe(el));
    
    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-pages-wrapper">
      {/* 1. COLLAPSIBLE DRAWER SIDEBAR */}
      <>
        <div 
          className={`sidebar-overlay ${showSidebar ? 'visible' : ''}`} 
          onClick={() => setShowSidebar(false)}
        />
        <aside className={`left-sidebar ${showSidebar ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-group">
              <Brain className="sidebar-logo-icon" size={24} />
              <h2>MindBridge</h2>
            </div>
            <button onClick={() => setShowSidebar(false)} className="sidebar-close-btn" title="Close Menu">
              <X size={20} />
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <span className="sidebar-nav-label">Main Portal</span>
            <button onClick={() => { setShowSidebar(false); scrollToSection('hero-section'); }} className="sidebar-link">
              <ChevronRight size={14} className="chevron" />
              <span>Home Page</span>
            </button>
            <button onClick={() => { setShowSidebar(false); setShowLogin(true); }} className="sidebar-link">
              <ChevronRight size={14} className="chevron" />
              <span>Launch Assistant</span>
            </button>

            <span className="sidebar-nav-label">Academic Services</span>
            <button onClick={() => { setShowSidebar(false); setShowLogin(true); setRole('teacher'); }} className="sidebar-link">
              <GraduationCap size={16} />
              <span>Educator Desk</span>
            </button>
            <button onClick={() => { setShowSidebar(false); setShowLogin(true); setRole('student'); }} className="sidebar-link">
              <BookOpen size={16} />
              <span>Student Hub</span>
            </button>
            <button onClick={() => { setShowSidebar(false); setShowLogin(true); }} className="sidebar-link">
              <UploadCloud size={16} />
              <span>Course Uploader</span>
            </button>

            <span className="sidebar-nav-label">Preferences</span>
            <button onClick={() => { setShowSidebar(false); }} className="sidebar-link">
              <Settings size={16} />
              <span>System Configurations</span>
            </button>
          </nav>
          <div className="sidebar-footer">
            <div className="status-indicator">
              <div className="status-dot green" />
              <span>AI Agent Nodes Active</span>
            </div>
          </div>
        </aside>
      </>

      {/* 2. TOP HEADER NAVIGATION BAR */}
      <header className="landing-navbar">
        <div className="nav-left">
          <button onClick={() => setShowSidebar(true)} className="hamburger-btn" title="Open Sidebar Menu">
            <Menu size={20} />
          </button>
          <div className="nav-logo" onClick={() => scrollToSection('hero-section')}>
            <Brain className="nav-logo-icon animate-pulse" size={22} />
            <span>MindBridge AI</span>
          </div>
        </div>
        
        <nav className="nav-center-links">
          <button onClick={() => scrollToSection('hero-section')} className="nav-link-anchor">Home</button>
          <button onClick={() => scrollToSection('features-section')} className="nav-link-anchor">Features</button>
          <button onClick={() => scrollToSection('sandbox-section')} className="nav-link-anchor">AI Sandbox</button>
          <button onClick={() => scrollToSection('about-section')} className="nav-link-anchor">About Us</button>
        </nav>

        <div className="nav-right-actions">
          <button onClick={() => setShowLogin(true)} className="nav-btn-signin">Portal Access</button>
          <button onClick={() => { setRole('student'); setShowLogin(true); }} className="nav-btn-getstarted">Get Started</button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="hero-section" className="landing-section hero-viewport">
        <div className="hero-columns-container">
          <div className="hero-text-column">
            <div className="badge-wrapper">
              <Sparkles className="sparkle" size={14} />
              <span>Next-Generation AI Tutoring</span>
            </div>
            <h2>Bridging Classrooms With Neural Intelligence</h2>
            <p>
              MindBridge AI acts as an active assistant. For teachers, it automates course syllabus structures and simplifies grading pipelines. For students, it generates personalized learning pathways and consolidates academic materials.
            </p>
            <div className="hero-buttons-row">
              <button onClick={() => setShowLogin(true)} className="hero-cta-btn primary">
                Launch Assistant
              </button>
              <button onClick={() => scrollToSection('sandbox-section')} className="hero-cta-btn secondary">
                Explore Sandbox
              </button>
            </div>
          </div>

          <div className="hero-graphic-column">
            {/* Floating Feature Card Stack */}
            <div className="feature-card-stack">
              {/* Card 1: AI Automated Grader */}
              <div className="stacked-card card-1 glass">
                <div className="card-badge student-badge">GRADER ACTIVE</div>
                <h4>Automated Grader</h4>
                <div className="card-preview-content">
                  <span className="file-name">essay_grading_rubric.py</span>
                  <div className="score-meter">Score: <strong className="glow-text">94%</strong></div>
                  <p className="grading-comment">"Excellent structural flow and depth of vocabulary arguments."</p>
                </div>
              </div>
              {/* Card 2: AI Study Companion Chat */}
              <div className="stacked-card card-2 glass">
                <div className="card-badge teacher-badge">COMPANION ONLINE</div>
                <h4>Live Study Buddy</h4>
                <div className="chat-bubble user-bubble">"Explain binary tree search..."</div>
                <div className="chat-bubble bot-bubble">"It recursively splits search space in half..."</div>
              </div>
              {/* Card 3: Neural Roadmap Tracker */}
              <div className="stacked-card card-3 glass">
                <div className="card-badge admin-badge">PATH BUILDER ACTIVE</div>
                <h4>Learning Path</h4>
                <div className="roadmap-flow">
                  <div className="flow-step done">Syllabus</div>
                  <div className="flow-line active" />
                  <div className="flow-step active">Algorithms</div>
                  <div className="flow-line" />
                  <div className="flow-step">Deployment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT FEATURES SECTION */}
      <section id="features-section" className="landing-section features-view">
        <div className="section-title-group scroll-reveal reveal-up">
          <h3>Core Platform Capabilities</h3>
          <p>Designed to optimize learning workflows for scholars and lesson administration for educators.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass scroll-reveal reveal-left">
            <div className="feature-icon student">
              <BookOpen size={24} />
            </div>
            <h4>Scholar Workspace</h4>
            <p>Unlocks custom learning paths, interactive quizzes, and dynamic memory maps that match individual student learning velocities.</p>
          </div>

          <div className="feature-card glass scroll-reveal reveal-up">
            <div className="feature-icon teacher">
              <GraduationCap size={24} />
            </div>
            <h4>Educator Suite</h4>
            <p>Empowers teachers with automated syllabus compilers, question bank builders, and instant essay grading rubrics.</p>
          </div>

          <div className="feature-card glass scroll-reveal reveal-right">
            <div className="feature-icon admin">
              <Settings size={24} />
            </div>
            <h4>Neural Architecture</h4>
            <p>Operates using decentralized subject nodes that consolidate key syllabus modules into structured, connected nodes.</p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PHYSICS SANDBOX SECTION */}
      <section id="sandbox-section" className="landing-section sandbox-view">
        <div className="section-title-group scroll-reveal reveal-up">
          <h3>AI Neural Node Sandbox</h3>
          <p>Interact with our custom educational workspace. Spawning topics gravitate into the centralized neural network to consolidate knowledge.</p>
        </div>

        <div className="sandbox-wrapper-component scroll-reveal reveal-up">
          <GravitySandbox />
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about-section" className="landing-section about-view">
        <div className="section-title-group scroll-reveal reveal-up">
          <h3>About MindBridge</h3>
          <p>Dedicated to strengthening academic infrastructures by introducing unified intelligent assistance.</p>
        </div>
        <div className="about-text-content glass scroll-reveal reveal-up">
          <h4>Empowering Education Through Technology</h4>
          <p>
            MindBridge AI is designed to alleviate teaching overheads, enabling educators to prioritize personalized student mentoring, while facilitating self-paced mastery for scholars. With robust MERN-stack foundations and interactive graphics, this system highlights how AI can safely consolidate modern educational workflows.
          </p>
        </div>
      </section>

      {/* CORPORATE Bottom FOOTER SECTION */}
      <footer id="contact-section" className="corporate-footer">
        <div className="footer-columns-grid">
          {/* Column 1: Info and brand */}
          <div className="footer-column brand-col">
            <div className="footer-logo">
              <Brain className="logo-icon" size={24} />
              <span>MindBridge AI</span>
            </div>
            <p className="brand-desc">
              Connecting schools with real-time neural tutoring systems, driving student velocity while minimizing grading workloads.
            </p>
            <div className="contact-details-list">
              <div className="contact-item">
                <Mail size={14} />
                <span>info@mindbridge.edu</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>+1 (800) 555-NODE</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} />
                <span>Neural Valley, California</span>
              </div>
            </div>
          </div>

          {/* Column 2: Educator Suite links */}
          <div className="footer-column">
            <h4>Educator Suite</h4>
            <ul className="footer-links">
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('teacher'); }}>Lesson Planner</a></li>
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('teacher'); }}>Auto Grader</a></li>
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('teacher'); }}>Syllabus Compiler</a></li>
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('teacher'); }}>Classroom Insights</a></li>
            </ul>
          </div>

          {/* Column 3: Student Suite links */}
          <div className="footer-column">
            <h4>Student Suite</h4>
            <ul className="footer-links">
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('student'); }}>Study Chatbot</a></li>
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('student'); }}>Knowledge Maps</a></li>
              <li><a href="#hero-section" onClick={(e) => { e.preventDefault(); setShowLogin(true); setRole('student'); }}>Mock Exams</a></li>
              <li><a href="#sandbox-section">Consolidation Sandbox</a></li>
            </ul>
          </div>

          {/* Column 4: Resources and Policies */}
          <div className="footer-column">
            <h4>Resources & Help</h4>
            <ul className="footer-links">
              <li><a href="#about-section">System Manuals</a></li>
              <li><a href="#about-section">API Documentation</a></li>
              <li><a href="#about-section">Privacy Protection</a></li>
              <li><a href="#about-section">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} MindBridge AI Inc. All rights reserved. Platform engineered for student-teacher tutoring workflows.</p>
          <div className="footer-socials">
            <span className="social-icon">Twitter</span>
            <span className="social-icon">GitHub</span>
            <span className="social-icon">LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
