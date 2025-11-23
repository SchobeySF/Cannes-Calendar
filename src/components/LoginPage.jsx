import { useState } from 'react';
// Force rebuild
import { useAuth } from '../context/AuthContext';
import frontyardImg from '../assets/Frontyard.jpg';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Incorrect username or password.');
      setPassword('');
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${frontyardImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="login-card">
        <h1>Maison de Cannes</h1>
        <p className="subtitle">Bienvenue à notre maison</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="login-input"
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="login-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn">
            Enter
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 400px;
          width: 90%;
          backdrop-filter: blur(10px);
        }

        h1 {
          font-family: var(--font-heading);
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 2.5rem;
        }

        .subtitle {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          font-style: italic;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .login-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          font-family: var(--font-body);
          transition: border-color 0.3s;
        }

        .login-input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          font-size: 1.1rem;
          margin-top: 1rem;
        }

        .error-message {
          color: var(--color-terracotta);
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
