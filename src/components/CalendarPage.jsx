import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AnnualCalendar from './AnnualCalendar';
import AdminPage from './AdminPage';
import ProfileSettings from './ProfileSettings';

const CalendarPage = () => {
  const { logout, user } = useAuth();
  const [view, setView] = useState('calendar'); // 'calendar' or 'admin'
  const [showProfile, setShowProfile] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);

  const YEARS = [2026, 2027, 2028, 2029, 2030];

  return (
    <div className="calendar-page">
      <header className="app-header">
        <div className="container header-content">
          <div className="brand">
            <h2 translate="no" className="notranslate">Maison Schober</h2>
            <span className="year-badge">{currentYear}</span>
          </div>

          {view === 'calendar' && (
            <div className="year-nav">
              {YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => setCurrentYear(year)}
                  className={`year-btn ${currentYear === year ? 'active' : ''}`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          <div className="user-controls">
            {view === 'calendar' && (
              <div className="legend">
                <span className="legend-item"><span className="dot my-booking" style={{ background: user.color }}></span>My Booking</span>
              </div>
            )}

            {user.role === 'admin' && (
              <button
                onClick={() => setView(view === 'calendar' ? 'admin' : 'calendar')}
                className="btn btn-primary"
                style={{ fontSize: '0.9rem', padding: '6px 16px' }}
              >
                {view === 'calendar' ? 'Admin Dashboard' : 'Back to Calendar'}
              </button>
            )}

            <button
              onClick={() => setShowProfile(true)}
              className="btn btn-outline"
              style={{ border: 'none', padding: '6px 12px' }}
            >
              Profile
            </button>

            <button onClick={logout} className="btn btn-outline sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {view === 'calendar' ? <AnnualCalendar year={currentYear} /> : <AdminPage />}
      </main>

      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}

      <style>{`
        .app-header {
          background: #07074cd4;
          padding: 1rem 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
          color: white;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          position: relative;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .brand h2 {
          color: white;
        }

        .year-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .year-nav {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px;
          border-radius: 20px;
        }
        
        .year-btn {
          border: none;
          background: transparent;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }
        
        .year-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .year-btn.active {
          background: white;
          color: #07074c;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .user-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-right: 4rem; /* Make space for fixed sign out button */
        }

        .legend {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        
        .dot.my-booking { 
          background: var(--color-azure); 
          border: 1px solid white;
          width: 16px; /* 60% bigger than 10px */
          height: 16px;
        }

        .btn-outline {
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: white;
          padding: 6px 16px;
        }

        .btn-outline:hover {
          border-color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sign-out-btn {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
        }

        @media (max-width: 900px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            padding-right: 0;
          }
          .user-controls {
            flex-direction: column;
            gap: 1rem;
            margin-right: 0;
          }
          .year-nav {
            order: 3;
            width: 100%;
            justify-content: center;
            overflow-x: auto;
          }
          .sign-out-btn {
            position: static;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
