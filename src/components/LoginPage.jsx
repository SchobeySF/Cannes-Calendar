import { useState } from 'react';
// Force rebuild
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // New state for reset mode
  const [message, setMessage] = useState(''); // Success message
  const [error, setError] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    let result;
    if (isResetting) {
      result = await resetPassword(email);
      if (result.success) {
        setMessage('Check your email for password reset instructions.');
        return;
      }
    } else if (isSignUp) {
      result = await signUp(email, password);
    } else {
      result = await signIn(email, password);
    }

    if (!result.success) {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('https://images.unsplash.com/photo-1499002238440-d264edd596ec?fm=jpg&q=80&w=2000&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="login-card">
        <h1 translate="no" className="notranslate">Maison Schober</h1>
        <p className="subtitle">Bienvenue à notre maison</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="login-input"
              required
            />
          </div>

          {!isResetting && (
            <div className="input-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="login-input"
                required
              />
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button type="submit" className="btn btn-primary login-btn">
            {isResetting ? 'Reset Password' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {!isResetting && !isSignUp && (
            <button
              type="button"
              onClick={() => setIsResetting(true)}
              className="link-btn"
            >
              Forgot Password?
            </button>
          )}

          {isResetting ? (
            <button
              type="button"
              onClick={() => { setIsResetting(false); setMessage(''); setError(''); }}
              className="link-btn"
            >
              Back to Log In
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="link-btn"
            >
              {isSignUp ? 'Already have an account? Log In' : 'First time? Sign Up'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card {
          background: #07074cd4;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 40px rgba(255, 255, 255, 0.5);
          text-align: center;
          max-width: 400px;
          width: 90%;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        h1 {
          font-family: var(--font-heading);
          color: white;
          margin-bottom: 0.5rem;
          font-size: 2.5rem;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          font-style: italic;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .login-input {
          width: 100%;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-size: 1rem;
          font-family: var(--font-body);
          transition: all 0.3s;
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .login-input:focus {
          outline: none;
          border-color: white;
          background: rgba(255, 255, 255, 0.2);
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 1.1rem;
          margin-top: 1rem;
          background: white;
          color: #07074c;
          border: none;
          font-weight: 600;
        }
        
        .login-btn:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .error-message {
          color: #ff6b6b;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .success-message {
            color: #51cf66;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .link-btn {
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            text-decoration: underline;
            font-size: 0.9rem;
        }
        
        .link-btn:hover {
            color: white;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
