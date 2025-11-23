import { useState, useEffect } from 'react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, formatDate, isDatePast } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AnnualCalendar = ({ year = 2026 }) => {
  const { user, allUsers } = useAuth();
  const [bookings, setBookings] = useState({});
  const [hoveredBooking, setHoveredBooking] = useState(null);

  useEffect(() => {
    // Real-time listener for bookings for the specific year
    const bookingsRef = doc(db, 'bookings', String(year));

    const unsubscribe = onSnapshot(bookingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setBookings(docSnap.data().data || {});
      } else {
        // If no document exists for this year, we start empty
        // We don't auto-create it here to avoid empty writes, 
        // we'll create it on first booking.
        setBookings({});
      }
    });

    return () => unsubscribe();
  }, [year]);

  const handleDateClick = async (month, day) => {
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

    // Optimistic update (optional, but good for UI responsiveness)
    setBookings(newBookings);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'bookings', String(year)), {
        data: newBookings
      });
    } catch (error) {
      console.error("Error saving booking:", error);
      // Revert on error (could reload from server or show alert)
      alert("Failed to save booking. Please try again.");
    }
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

  const handleMouseEnter = (e, month, day) => {
    const dateStr = formatDate(year, month, day);
    const booking = bookings[dateStr];
    if (booking) {
      const rect = e.target.getBoundingClientRect();
      setHoveredBooking({
        name: booking.user.name,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredBooking(null);
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
                  onMouseEnter={(e) => handleMouseEnter(e, monthIndex, day)}
                  onMouseLeave={handleMouseLeave}
                  className={`day-cell ${isBooked ? 'booked' : ''}`}
                  style={getDayStyle(monthIndex, day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {hoveredBooking && (
        <div
          className="custom-tooltip"
          style={{
            left: hoveredBooking.x,
            top: hoveredBooking.y
          }}
        >
          <div className="tooltip-label">Booked by</div>
          <div className="tooltip-name">{hoveredBooking.name}</div>
        </div>
      )}

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

        .custom-tooltip {
          position: fixed;
          transform: translate(-50%, -100%);
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          pointer-events: none;
          z-index: 1000;
          text-align: center;
          border: 1px solid rgba(0,0,0,0.05);
          margin-top: -8px;
        }

        .custom-tooltip::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 6px 0;
          border-style: solid;
          border-color: white transparent transparent transparent;
        }

        .tooltip-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .tooltip-name {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--color-mediterranean);
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default AnnualCalendar;
