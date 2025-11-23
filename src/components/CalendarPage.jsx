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
            <h2>Maison de Cannes</h2>
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
                <span className="legend-item"><span className="dot available"></span>Available</span>
                <span className="legend-item"><span className="dot booked"></span>Booked</span>
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

            <button onClick={logout} className="btn btn-outline">
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
          background: white;
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .year-badge {
          background: var(--color-lavender);
          color: var(--color-lavender-dark);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .year-nav {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-primary);
          padding: 4px;
          border-radius: 20px;
        }
        
        .year-btn {
          border: none;
          background: transparent;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        
        .year-btn:hover {
          color: var(--text-primary);
          background: rgba(0,0,0,0.05);
        }
        
        .year-btn.active {
          background: var(--color-mediterranean);
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .user-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .legend {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
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
        
        .dot.available { border: 1px solid #ddd; }
        .dot.booked { background: #eee; }
        .dot.my-booking { background: var(--color-azure); }

        .btn-outline {
          border: 1px solid var(--text-secondary);
          background: transparent;
          color: var(--text-secondary);
          padding: 6px 16px;
        }

        .btn-outline:hover {
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }
          .user-controls {
            flex-direction: column;
            gap: 1rem;
          }
          .year-nav {
            order: 3;
            width: 100%;
            justify-content: center;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
