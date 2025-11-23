import { useState } from 'react';
// Force rebuild
import { useAuth } from '../context/AuthContext';

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
        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('https://images.unsplash.com/photo-1499002238440-d264edd596ec?fm=jpg&q=80&w=2000&auto=format&fit=crop')`,
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
          background: #07074cd4;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2), 0 0 30px rgba(255, 255, 255, 0.3);
          text-align: center;
          max-width: 400px;
          width: 90%;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
      `}</style>
    </div>
  );
};

export default LoginPage;
