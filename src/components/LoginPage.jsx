import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = login(password);
        if (!success) {
            setError('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Maison de Cannes</h1>
                <p className="subtitle">Bienvenue à notre maison</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter access code"
                            className="password-input"
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
          background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), 
                      url('https://images.unsplash.com/photo-1506606401543-2e73709cebb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
          background-size: cover;
          background-position: center;
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

        .password-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          font-family: var(--font-body);
          transition: border-color 0.3s;
        }

        .password-input:focus {
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
