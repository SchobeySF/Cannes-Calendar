import { useState, useEffect, useRef } from 'react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, formatDate, isDatePast } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';



const AnnualCalendar = ({ year = 2026 }) => {
  const { user, actingUser, allUsers } = useAuth();
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

  // Robustly check if a booking belongs to the acting user
  const isBookingOwner = (bookingUser) => {
    if (bookingUser.email && actingUser.email) {
      return bookingUser.email === actingUser.email;
    }
    return bookingUser.username === actingUser.username;
  };

  // Helper to calculate diff between old and new bookings
  const calculateChanges = (oldBookings, newBookings) => {
    const changes = {
      added: [],
      removed: []
    };

    const allDates = new Set([...Object.keys(oldBookings), ...Object.keys(newBookings)]);

    allDates.forEach(dateStr => {
      const oldList = oldBookings[dateStr] || [];
      const newList = newBookings[dateStr] || [];

      // Check for added bookings for the acting user
      const added = newList.filter(n =>
        isBookingOwner(n.user) &&
        !oldList.some(o => isBookingOwner(o.user))
      );

      if (added.length > 0) {
        changes.added.push(dateStr);
      }

      // Check for removed bookings for the acting user
      const removed = oldList.filter(o =>
        isBookingOwner(o.user) &&
        !newList.some(n => isBookingOwner(n.user))
      );

      if (removed.length > 0) {
        changes.removed.push(dateStr);
      }
    });

    return changes;
  };

  const updateBookings = async (newBookings) => {
    // Calculate changes before updating state
    const changes = calculateChanges(bookings, newBookings);

    // Optimistic update
    setBookings(newBookings);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'bookings', String(year)), {
        data: newBookings
      });

      // Log changes to mail_queue if there are any
      if (changes.added.length > 0 || changes.removed.length > 0) {
        await addDoc(collection(db, 'mail_queue'), {
          year,
          modifiedBy: actingUser.username,
          modifiedByName: actingUser.name,
          timestamp: Date.now(),
          addedDates: changes.added,
          removedDates: changes.removed
        });
        console.log("Logged changes to mail_queue:", changes);
      }

    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking. Please try again.");
    }
  };

  const toggleBooking = (currentBookings, dateStr) => {
    const dateBookings = currentBookings[dateStr] || [];

    // Robust check for existing booking
    const myBookingIndex = dateBookings.findIndex(b => isBookingOwner(b.user));

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
          // Store email for robust ID, keep username/name for legacy display compatibility if needed
          user: {
            name: actingUser.name,
            email: actingUser.email,
            username: actingUser.username || actingUser.email.split('@')[0]
          }
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
    if (actingUser.role === 'guest') return;

    const dateStr = formatDate(year, month, day);

    let newBookings = { ...bookings };

    // Shift Click Logic
    if (e.shiftKey && lastSelectedDateRef.current) {
      const datesToToggle = getDatesInRange(lastSelectedDateRef.current, dateStr);

      const clickedDateBookings = bookings[dateStr] || [];
      const isClickedDateBookedByMe = clickedDateBookings.some(b => isBookingOwner(b.user));
      const intentToBook = !isClickedDateBookedByMe;

      datesToToggle.forEach(d => {
        const dBookings = newBookings[d] || [];
        const myIndex = dBookings.findIndex(b => isBookingOwner(b.user));

        if (intentToBook) {
          if (myIndex === -1) {
            newBookings[d] = [...dBookings, {
              status: 'booked',
              user: {
                name: actingUser.name,
                email: actingUser.email,
                username: actingUser.username || actingUser.email.split('@')[0]
              }
            }];
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



  const getUserColor = (userObj) => {
    // Try to find by email first (robust), then username (legacy)
    if (userObj.email) {
      const found = allUsers.find(u => u.email === userObj.email);
      if (found) return found.color;
    }
    const foundUser = allUsers.find(u => u.username === userObj.username);
    return foundUser ? foundUser.color : '#ccc';
  };

  const getDayStyle = (month, day) => {
    const dateStr = formatDate(year, month, day);
    const dateBookings = bookings[dateStr];

    if (!dateBookings || dateBookings.length === 0) return {};

    if (dateBookings.length === 1) {
      const color = getUserColor(dateBookings[0].user);
      return { backgroundColor: color, color: 'white' };
    }

    // Multiple bookings - Conic Gradient
    const colors = dateBookings.map(b => getUserColor(b.user));
    const segmentSize = 100 / colors.length;
    const gradientParts = colors.map((c, i) => {
      return `${c} ${i * segmentSize}% ${(i + 1) * segmentSize}%`;
    });

    return {
      background: `conic-gradient(${gradientParts.join(', ')})`,
      color: 'white'
    };
  };

  const getBookingRange = (currentDateStr, user) => {
    // Check match by email if available, else username
    const isMe = (bUser) => {
      if (user.email && bUser.email) return user.email === bUser.email;
      return user.username === bUser.username;
    };

    const hasBooking = (dStr) => {
      return bookings[dStr]?.some(b => isMe(b.user));
    };

    // Find start date
    let start = new Date(currentDateStr);
    while (true) {
      const prevDate = new Date(start);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      if (hasBooking(prevDateStr)) {
        start = prevDate;
      } else {
        break;
      }
    }

    // Find end date
    let end = new Date(currentDateStr);
    while (true) {
      const nextDate = new Date(end);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      if (hasBooking(nextDateStr)) {
        end = nextDate;
      } else {
        break;
      }
    }

    const options = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const handleMouseEnter = (e, month, day) => {
    const dateStr = formatDate(year, month, day);
    const dateBookings = bookings[dateStr];

    if (dateBookings && dateBookings.length > 0) {
      const rect = e.target.getBoundingClientRect();

      const tooltipItems = dateBookings.map(b => ({
        name: b.user.name,
        color: getUserColor(b.user),
        range: getBookingRange(dateStr, b.user)
      }));

      setHoveredBooking({
        items: tooltipItems,
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
                  className={`day-cell ${isBooked ? 'booked' : ''} ${actingUser.role === 'guest' ? 'guest-cursor' : ''}`}
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
          {hoveredBooking.items.map((item, i) => (
            <div key={i} className="tooltip-item">
              <div className="tooltip-header">
                <span className="tooltip-dot" style={{ backgroundColor: item.color }}></span>
                <span className="tooltip-name">{item.name}</span>
              </div>
              <div className="tooltip-range">{item.range}</div>
            </div>
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

        .tooltip-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 8px;
        }

        .tooltip-item:last-child {
          margin-bottom: 0;
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .tooltip-name {
          font-family: var(--font-heading);
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1rem;
          line-height: 1.2;
        }
        
        .tooltip-range {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: rgba(0,0,0,0.03);
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AnnualCalendar;
