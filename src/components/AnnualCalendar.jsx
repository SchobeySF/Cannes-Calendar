import { useState, useEffect } from 'react';
import { MONTHS, DAYS, getDaysInMonth, getFirstDayOfMonth, formatDate, isDatePast } from '../utils/dateUtils';

const AnnualCalendar = () => {
    const YEAR = 2026;
    const [bookings, setBookings] = useState({});
    const [selectedDates, setSelectedDates] = useState(new Set());

    useEffect(() => {
        // Load bookings from local storage
        const storedBookings = localStorage.getItem('cannes_bookings_2026');
        if (storedBookings) {
            setBookings(JSON.parse(storedBookings));
        } else {
            // Mock some initial bookings
            const mockBookings = {
                '2026-07-15': { status: 'booked', user: 'Uncle Jean' },
                '2026-07-16': { status: 'booked', user: 'Uncle Jean' },
                '2026-07-17': { status: 'booked', user: 'Uncle Jean' },
                '2026-08-01': { status: 'booked', user: 'Sarah' },
                '2026-08-02': { status: 'booked', user: 'Sarah' },
            };
            setBookings(mockBookings);
            localStorage.setItem('cannes_bookings_2026', JSON.stringify(mockBookings));
        }
    }, []);

    const handleDateClick = (month, day) => {
        const dateStr = formatDate(YEAR, month, day);

        // If already booked by someone else, ignore
        if (bookings[dateStr] && bookings[dateStr].user !== 'Me') return;

        const newBookings = { ...bookings };

        if (newBookings[dateStr] && newBookings[dateStr].user === 'Me') {
            // Unbook
            delete newBookings[dateStr];
        } else {
            // Book
            newBookings[dateStr] = { status: 'booked', user: 'Me' };
        }

        setBookings(newBookings);
        localStorage.setItem('cannes_bookings_2026', JSON.stringify(newBookings));
    };

    const getDayStatus = (month, day) => {
        const dateStr = formatDate(YEAR, month, day);
        const booking = bookings[dateStr];

        if (booking) {
            return booking.user === 'Me' ? 'my-booking' : 'booked';
        }
        return 'available';
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
                        {Array(getFirstDayOfMonth(YEAR, monthIndex)).fill(null).map((_, i) => (
                            <div key={`empty-${i}`} className="day-cell empty" />
                        ))}

                        {/* Days */}
                        {Array(getDaysInMonth(YEAR, monthIndex)).fill(null).map((_, i) => {
                            const day = i + 1;
                            const status = getDayStatus(monthIndex, day);
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(monthIndex, day)}
                                    className={`day-cell ${status}`}
                                    title={status === 'booked' ? 'Booked' : 'Available'}
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
          background-color: #eee;
          color: #aaa;
          text-decoration: line-through;
          cursor: not-allowed;
        }

        .day-cell.my-booking {
          background-color: var(--color-azure);
          color: white;
        }
        
        .day-cell.my-booking:hover {
          background-color: var(--color-azure-light);
        }
      `}</style>
        </div>
    );
};

export default AnnualCalendar;
