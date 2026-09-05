import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../services/api/client';
import { useAuthStore } from '../../../store/authStore';
import medioraIcon from '../../../assets/mediora-icon.png';
import '../AuthPage.css';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Sliding panel state: true = Sign Up active, false = Sign In active
  const [isActive, setIsActive] = useState(location.pathname === '/signup');

  // Sign In form fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up form fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Sync state if route changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsActive(true);
    } else if (location.pathname === '/login') {
      setIsActive(false);
    }
  }, [location.pathname]);

  const toggleToSignUp = (e) => {
    if (e) e.preventDefault();
    setSignInError('');
    setSignUpError('');
    setIsActive(true);
    window.history.replaceState(null, '', '/signup');
  };

  const toggleToSignIn = (e) => {
    if (e) e.preventDefault();
    setSignInError('');
    setSignUpError('');
    setIsActive(false);
    window.history.replaceState(null, '', '/login');
  };

  // Handle Sign In submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', signInEmail.trim());
      formData.append('password', signInPassword);

      const response = await apiClient.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      login(access_token, {
        email: signInEmail.trim(),
        name: signInEmail.split('@')[0],
      });

      navigate('/category');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSignInError(
        typeof detail === 'string'
          ? detail
          : 'Authentication failed. Please check your email and password.'
      );
    } finally {
      setSignInLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError('');

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please verify.');
      return;
    }

    setSignUpLoading(true);

    try {
      const response = await apiClient.post('/api/auth/signup', {
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
      });

      const { access_token, user } = response.data;
      login(
        access_token,
        user || { email: signUpEmail.trim(), name: signUpName.trim() }
      );

      navigate('/category');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setSignUpError(
        typeof detail === 'string'
          ? detail
          : 'Registration failed. Please verify your details.'
      );
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="mediora-auth-wrapper">
      <div className={`auth-container ${isActive ? 'active' : ''}`} id="container">
        {/* SIGN UP FORM */}
        <div className="auth-form-container auth-sign-up">
          <form onSubmit={handleSignUp}>
            <div className="auth-logo">
              <img src={medioraIcon} alt="Mediora" className="auth-logo-icon" />
              <span>
                Medi<em>o</em>ra
              </span>
            </div>

            <h1 className="auth-title">Create your Mediora account</h1>
            <p className="auth-subtitle">Enter your details to get started</p>

            {signUpError && <div className="auth-alert-error">{signUpError}</div>}

            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                required
                placeholder="Jane Doe"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                required
                placeholder="you@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                placeholder="••••••••"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
              />
            </div>

            <button
              id="signup-submit-btn"
              className="auth-submit-btn"
              type="submit"
              disabled={signUpLoading}
            >
              {signUpLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="auth-switch-line auth-mobile-switch">
              Already have an account?{' '}
              <a href="#signin" onClick={toggleToSignIn}>
                Sign In
              </a>
            </p>
          </form>
        </div>

        {/* SIGN IN FORM */}
        <div className="auth-form-container auth-sign-in">
          <form onSubmit={handleSignIn}>
            <div className="auth-logo">
              <img src={medioraIcon} alt="Mediora" className="auth-logo-icon" />
              <span>
                Medi<em>o</em>ra
              </span>
            </div>

            <h1 className="auth-title">Welcome back to Mediora</h1>
            <p className="auth-subtitle">Sign in to access your health reports</p>

            {signInError && <div className="auth-alert-error">{signInError}</div>}

            <div className="auth-field">
              <label htmlFor="signin-email">Email Address</label>
              <input
                id="signin-email"
                type="email"
                required
                placeholder="you@example.com"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signin-password">Password</label>
              <input
                id="signin-password"
                type="password"
                required
                placeholder="••••••••"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
              />
            </div>

            <div className="auth-forgot">
              <a href="#forgot" onClick={(e) => e.preventDefault()}>
                Forgot your password?
              </a>
            </div>

            <button
              id="signin-submit-btn"
              className="auth-submit-btn"
              type="submit"
              disabled={signInLoading}
            >
              {signInLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <p className="auth-switch-line auth-mobile-switch">
              Don't have an account?{' '}
              <a href="#signup" onClick={toggleToSignUp}>
                Sign Up
              </a>
            </p>
          </form>
        </div>

        {/* SLIDING TOGGLE OVERLAY */}
        <div className="auth-toggle-container">
          <div className="auth-toggle">
            {/* Left Panel (visible during Sign Up) */}
            <div className="auth-toggle-panel auth-toggle-left">
              <div className="mini-logo">
                <img
                  src={medioraIcon}
                  alt="Mediora"
                  className="auth-logo-icon mini"
                />
                <span>Mediora</span>
              </div>
              <h2>Welcome Back!</h2>
              <p>Sign in to keep track of your health reports and stay on top of your care.</p>
              <button
                id="login-toggle-btn"
                className="ghost"
                type="button"
                onClick={toggleToSignIn}
              >
                Sign In
              </button>
            </div>

            {/* Right Panel (visible during Sign In) */}
            <div className="auth-toggle-panel auth-toggle-right">
              <div className="mini-logo">
                <img
                  src={medioraIcon}
                  alt="Mediora"
                  className="auth-logo-icon mini"
                />
                <span>Mediora</span>
              </div>
              <h2>New Here?</h2>
              <p>Create your Mediora account to get started with your health reports.</p>
              <button
                id="register-toggle-btn"
                className="ghost"
                type="button"
                onClick={toggleToSignUp}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
