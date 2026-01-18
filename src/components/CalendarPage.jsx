import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnnualCalendar from './AnnualCalendar';
import AdminPage from './AdminPage';
import ProfileSettings from './ProfileSettings';

const CalendarPage = () => {
  const { logout, user, actingUser, impersonate, allUsers } = useAuth();
  const [view, setView] = useState('calendar'); // 'calendar' or 'admin'
  const [showProfile, setShowProfile] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [isMinimized, setIsMinimized] = useState(false);

  const YEARS = [2026, 2027, 2028, 2029, 2030];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="calendar-page">
      <header className={`app-header ${isMinimized ? 'minimized' : ''}`}>
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

            {/* User Dropdown / Impersonation Control */}
            <div className="user-identity-control">
              <span
                className="dot my-booking"
                style={{
                  background: actingUser?.color || '#ccc',
                  marginRight: '8px'
                }}
              ></span>

              {(user.role === 'admin' || user.role === 'super-admin') ? (
                <div className="impersonation-wrapper">
                  <select
                    value={actingUser?.email || user.email}
                    onChange={(e) => impersonate(e.target.value)}
                    className="impersonation-select"
                  >
                    {/* Sort users alphabetically */}
                    {[...allUsers].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(u => (
                      <option key={u.email} value={u.email}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  onClick={() => setShowProfile(true)}
                  className="btn-profile-link"
                >
                  {user.name}
                </button>
              )}
            </div>


            {(user.role === 'admin' || user.role === 'super-admin') && (
              <button
                onClick={() => setView(view === 'calendar' ? 'admin' : 'calendar')}
                className="btn btn-primary"
                style={{ fontSize: '0.9rem', padding: '6px 16px' }}
              >
                {view === 'calendar' ? 'Admin Dashboard' : 'Back to Calendar'}
              </button>
            )}

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
            transition: all 0.3s ease;
          }
          .user-controls {
            flex-direction: column;
            gap: 1rem;
            margin-right: 0;
            transition: all 0.3s ease;
          }
          .year-nav {
            order: 3;
            width: 100%;
            justify-content: center;
            overflow-x: auto;
          }
          
          /* Minimized State Styles */
          .app-header.minimized {
            padding: 0.5rem 0;
          }

          .app-header.minimized .header-content {
            flex-direction: row; /* Force row layout when minimized */
            justify-content: space-between;
            padding: 0 1rem;
          }

          .app-header.minimized .brand h2 {
            display: none; /* Hide logo text */
          }

          .app-header.minimized .year-nav {
            display: none; /* Hide year buttons */
          }

          .app-header.minimized .user-controls {
            flex-direction: row;
            margin-right: 0;
            gap: 1rem;
          }

          .app-header.minimized .btn-primary,
          .app-header.minimized .btn-outline {
            display: none; /* Hide Admin and Sign Out buttons */
          }
          
          /* Ensure User Identity (Dropdown/Name) stays visible */
          .app-header.minimized .user-identity-control {
            display: flex;
          }
        }
          
          .user-identity-control {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 12px 4px 8px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .impersonation-select {
            background: transparent;
            color: white;
            border: none;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            padding-right: 20px; /* Space for arrow */
            outline: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
             /* Custom arrow indicator could go here, but default is often fine or removed */
          }
          
          .impersonation-select option {
            color: black; /* Options need dark text on white bg usually */
          }

          .btn-profile-link {
            background: transparent;
            border: none;
            color: white;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
          }
          
          .btn-profile-link:hover {
            text-decoration: underline;
          }

        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
