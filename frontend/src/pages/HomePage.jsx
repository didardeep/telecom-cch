import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'customer') navigate('/customer/dashboard');
      else if (user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/cto/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      <nav className="home-nav">
        <div className="home-logo">
          <div className="home-logo-icon">📡</div>
          Customer Handling
        </div>
        <div className="home-nav-actions">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Register</button>
        </div>
      </nav>

      <div className="home-hero">
        <div className="home-hero-content">
          <div className="home-badge">
            🤖 AI-Powered Customer Support
          </div>

          <h1>
            Smart Telecom<br />
            <span>Complaint Resolution</span>
          </h1>

          <p>
            An intelligent customer complaint handling platform built for the telecom industry.
            Powered by AI, it provides instant resolution steps for common issues across mobile, broadband,
            DTH, landline, and enterprise services. Our multilingual chatbot understands your problem semantically
            and guides you through step-by-step troubleshooting — all in your preferred language. Unresolved
            issues are automatically escalated with full context to human support agents for faster resolution.
          </p>

          <div className="home-features">
            <div className="home-feature">
              <div className="home-feature-icon">💬</div>
              Multilingual AI Chat
            </div>
            <div className="home-feature">
              <div className="home-feature-icon">🎫</div>
              Auto Ticket Escalation
            </div>
            <div className="home-feature">
              <div className="home-feature-icon">📊</div>
              Manager Dashboard
            </div>
            <div className="home-feature">
              <div className="home-feature-icon">⚡</div>
              Instant Resolutions
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleGetStarted}>
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
