import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AnnualCalendar from './AnnualCalendar';
import AdminPage from './AdminPage';
import ProfileSettings from './ProfileSettings';

const CalendarPage = () => {
  const { logout, user } = useAuth();
  const [view, setView] = useState('calendar'); // 'calendar' or 'admin'
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="calendar-page">
      <header className="app-header">
        <div className="container header-content">
          <div className="brand">
            <h2>Maison de Cannes</h2>
            <span className="year-badge">2026</span>
          </div>
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
        {view === 'calendar' ? <AnnualCalendar /> : <AdminPage />}
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

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
          }
          .user-controls {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
