import { useState, useEffect } from 'react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, formatDate, isDatePast } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

const AnnualCalendar = ({ year = 2026 }) => {
  const { user, allUsers } = useAuth();
  const [bookings, setBookings] = useState({});

  useEffect(() => {
    // Load bookings from local storage for the specific year
    const storageKey = `cannes_bookings_${year}`;
    const storedBookings = localStorage.getItem(storageKey);

    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    } else {
      // Mock some initial bookings only for 2026
      if (year === 2026) {
        const mockBookings = {
          '2026-07-15': { status: 'booked', user: { name: 'Uncle Jean', username: 'brother' } },
          '2026-07-16': { status: 'booked', user: { name: 'Uncle Jean', username: 'brother' } },
          '2026-07-17': { status: 'booked', user: { name: 'Uncle Jean', username: 'brother' } },
          '2026-08-01': { status: 'booked', user: { name: 'Sarah', username: 'friend' } },
          '2026-08-02': { status: 'booked', user: { name: 'Sarah', username: 'friend' } },
        };
        setBookings(mockBookings);
        localStorage.setItem(storageKey, JSON.stringify(mockBookings));
      } else {
        setBookings({});
      }
    }
  }, [year]);

  const handleDateClick = (month, day) => {
    const dateStr = formatDate(year, month, day);
    const currentBooking = bookings[dateStr];

    // If booked by someone else
    if (currentBooking && currentBooking.user.username !== user.username) {
      // Allow override if admin
      if (user.role === 'admin') {
        const confirmOverride = window.confirm(`Override booking by ${currentBooking.user.name}?`);
        if (!confirmOverride) return;
      } else {
        return; // Regular user cannot touch others' bookings
      }
    }

    const newBookings = { ...bookings };

    // If it's my booking OR I'm admin overriding someone else's
    if (currentBooking) {
      // Unbook
      delete newBookings[dateStr];
    } else {
      // Book
      newBookings[dateStr] = {
        status: 'booked',
        user: { name: user.name, username: user.username }
      };
    }

    setBookings(newBookings);
    localStorage.setItem(`cannes_bookings_${year}`, JSON.stringify(newBookings));
  };

  const getUserColor = (username) => {
    const foundUser = allUsers.find(u => u.username === username);
    return foundUser ? foundUser.color : '#ccc';
  };

  const getDayStyle = (month, day) => {
    const dateStr = formatDate(year, month, day);
    const booking = bookings[dateStr];

    if (booking) {
      const color = getUserColor(booking.user.username);
      return { backgroundColor: color, color: 'white' };
    }
    return {};
  };

  const getTooltip = (month, day) => {
    const dateStr = formatDate(year, month, day);
    const booking = bookings[dateStr];
    if (booking) {
      return booking.user.username === user.username ? 'Booked by You' : `Booked by ${booking.user.name}`;
    }
    return 'Available';
  };

  return (
    <div className="calendar-grid">
      {MONTHS.map((monthName, monthIndex) => (
        <div key={monthName} className="month-card">
          <h3 className="month-title">{monthName}</h3>

          <div className="days-header">
            {DAYS.map((d, i) => <span key={i} className="day-label">{d}</span>)}
          </div>

          <div className="days-grid">
            {/* Empty cells for start of month */}
            {Array(getFirstDayOfMonth(year, monthIndex)).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="day-cell empty" />
            ))}

            {/* Days */}
            {Array(getDaysInMonth(year, monthIndex)).fill(null).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(year, monthIndex, day);
              const isBooked = !!bookings[dateStr];

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(monthIndex, day)}
                  className={`day-cell ${isBooked ? 'booked' : ''}`}
                  style={getDayStyle(monthIndex, day)}
                  title={getTooltip(monthIndex, day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <style>{`
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          padding-bottom: 4rem;
        }

        .month-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .month-title {
          text-align: center;
          color: var(--color-ocher);
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .day-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          border-radius: 50%;
          color: var(--text-primary);
          transition: all 0.2s;
        }

        .day-cell:not(.empty):hover {
          background-color: var(--color-lavender);
          cursor: pointer;
        }

        .day-cell.booked {
          /* Background handled by inline style */
          cursor: pointer; /* Allow clicking to see if override possible */
        }
        
        .day-cell.booked:hover {
           opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default AnnualCalendar;
