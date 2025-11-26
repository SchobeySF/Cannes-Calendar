import { useState, useEffect, useRef } from 'react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, formatDate, isDatePast } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AnnualCalendar = ({ year = 2026 }) => {
  const { user, allUsers } = useAuth();
  const [bookings, setBookings] = useState({});
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const lastSelectedDateRef = useRef(null);

  useEffect(() => {
    // Real-time listener for bookings for the specific year
    const bookingsRef = doc(db, 'bookings', String(year));

    const unsubscribe = onSnapshot(bookingsRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log("Loaded bookings for year", year);
        const data = docSnap.data().data || {};
        // Migration/Normalization: Ensure all entries are arrays
        const normalizedData = {};
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            normalizedData[key] = data[key];
          } else {
            // Convert legacy single object to array
            normalizedData[key] = [data[key]];
          }
        });
        setBookings(normalizedData);
      } else {
        console.log("No bookings found for year", year);
        setBookings({});
      }
    }, (error) => {
      console.error("Error listening to bookings:", error);
    });

    return () => unsubscribe();
  }, [year]);

  const updateBookings = async (newBookings) => {
    // Optimistic update
    setBookings(newBookings);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'bookings', String(year)), {
        data: newBookings
      });
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking. Please try again.");
    }
  };

  const toggleBooking = (currentBookings, dateStr) => {
    const dateBookings = currentBookings[dateStr] || [];
    const myBookingIndex = dateBookings.findIndex(b => b.user.username === user.username);

    if (myBookingIndex >= 0) {
      // Remove my booking
      const updated = [...dateBookings];
      updated.splice(myBookingIndex, 1);
      if (updated.length === 0) {
        delete currentBookings[dateStr];
      } else {
        currentBookings[dateStr] = updated;
      }
    } else {
      // Add my booking
      currentBookings[dateStr] = [
        ...dateBookings,
        {
          status: 'booked',
          user: { name: user.name, username: user.username }
        }
      ];
    }
    return currentBookings;
  };

  const getDatesInRange = (startStr, endStr) => {
    // Simple date range calculation
    // Format is YYYY-MM-DD
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dates = [];

    // Ensure start is before end
    const [s, e] = start < end ? [start, end] : [end, start];

    const current = new Date(s);
    while (current <= e) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleDateClick = async (month, day, e) => {
    if (user.role === 'guest') return;

    const dateStr = formatDate(year, month, day);
    let newBookings = { ...bookings };

    // Shift Click Logic
    if (e.shiftKey && lastSelectedDateRef.current) {
      const datesToToggle = getDatesInRange(lastSelectedDateRef.current, dateStr);

      // Determine intent based on the clicked date
      // If clicked date is NOT booked by me, we want to BOOK the range
      // If clicked date IS booked by me, we want to UNBOOK the range
      const clickedDateBookings = bookings[dateStr] || [];
      const isClickedDateBookedByMe = clickedDateBookings.some(b => b.user.username === user.username);
      const intentToBook = !isClickedDateBookedByMe;

      datesToToggle.forEach(d => {
        const dBookings = newBookings[d] || [];
        const myIndex = dBookings.findIndex(b => b.user.username === user.username);

        if (intentToBook) {
          if (myIndex === -1) {
            newBookings[d] = [...dBookings, { status: 'booked', user: { name: user.name, username: user.username } }];
          }
        } else {
          if (myIndex >= 0) {
            const updated = [...dBookings];
            updated.splice(myIndex, 1);
            if (updated.length === 0) delete newBookings[d];
            else newBookings[d] = updated;
          }
        }
      });

    } else {
      // Normal Click
      newBookings = toggleBooking(newBookings, dateStr);
    }

    lastSelectedDateRef.current = dateStr;
    await updateBookings(newBookings);
  };

  const getUserColor = (username) => {
    const foundUser = allUsers.find(u => u.username === username);
    return foundUser ? foundUser.color : '#ccc';
  };

  const getDayStyle = (month, day) => {
    const dateStr = formatDate(year, month, day);
    const dateBookings = bookings[dateStr];

    if (!dateBookings || dateBookings.length === 0) return {};

    if (dateBookings.length === 1) {
      const color = getUserColor(dateBookings[0].user.username);
      return { backgroundColor: color, color: 'white' };
    }

    // Multiple bookings - Conic Gradient
    const colors = dateBookings.map(b => getUserColor(b.user.username));
    const segmentSize = 100 / colors.length;
    const gradientParts = colors.map((c, i) => {
      return `${c} ${i * segmentSize}% ${(i + 1) * segmentSize}%`;
    });

    return {
      background: `conic-gradient(${gradientParts.join(', ')})`,
      color: 'white'
    };
  };

  const handleMouseEnter = (e, month, day) => {
    const dateStr = formatDate(year, month, day);
    const dateBookings = bookings[dateStr];

    if (dateBookings && dateBookings.length > 0) {
      const rect = e.target.getBoundingClientRect();
      setHoveredBooking({
        names: dateBookings.map(b => b.user.name),
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
              const dateBookings = bookings[dateStr];
              const isBooked = dateBookings && dateBookings.length > 0;

              return (
                <button
                  key={day}
                  onClick={(e) => handleDateClick(monthIndex, day, e)}
                  onMouseEnter={(e) => handleMouseEnter(e, monthIndex, day)}
                  onMouseLeave={handleMouseLeave}
                  className={`day-cell ${isBooked ? 'booked' : ''} ${user.role === 'guest' ? 'guest-cursor' : ''}`}
                  style={getDayStyle(monthIndex, day)}
                >
                  <span className="day-number">{day}</span>
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
          {hoveredBooking.names.map((name, i) => (
            <div key={i} className="tooltip-name">{name}</div>
          ))}
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
          position: relative;
          overflow: hidden; /* For conic gradient */
        }
        
        .day-number {
           position: relative;
           z-index: 2;
           text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .day-cell:not(.empty):hover {
          background-color: var(--color-lavender);
          cursor: pointer;
        }
        
        .day-cell.guest-cursor {
           cursor: default !important;
        }
        .day-cell.guest-cursor:hover {
           background-color: transparent !important;
        }

        .day-cell.booked {
          /* Background handled by inline style */
          cursor: pointer; 
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
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};

export default AnnualCalendar;
