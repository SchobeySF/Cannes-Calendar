import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, writeBatch, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate } from '../utils/dateUtils';

const AdminPage = () => {
  const { allUsers, addUser, updateUser, deleteUser, user: currentUser } = useAuth();

  // Add User State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [error, setError] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', password: '', role: 'user', color: '' });

  // Booking Management State
  const [manageDate, setManageDate] = useState('');
  const [dateBookings, setDateBookings] = useState([]);
  const [selectedBookingUsers, setSelectedBookingUsers] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      setError('All fields are required');
      return;
    }

    if (allUsers.some(u => u.username === newUsername)) {
      setError('Username already exists');
      return;
    }

    addUser({ username: newUsername, password: newPassword, name: newName, role: newRole });
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setNewRole('user');
    setError('');
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({ ...user });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    updateUser(editingUser.username, editForm);
    setEditingUser(null);
  };

  const handleImport2026 = async () => {
    if (!window.confirm("This will OVERWRITE all bookings for 2026. Are you sure?")) return;

    // 1. Define Users from Image
    const importUsers = [
      { name: 'Hannes', username: 'hannes', color: '#4169E1', role: 'user' }, // Royal Blue
      { name: 'Agnes', username: 'agnes', color: '#00008B', role: 'user' }, // Dark Blue
      { name: 'Sylvia & Jens', username: 'sylvia_jens', color: '#40E0D0', role: 'user' }, // Turquoise
      { name: 'Oliver', username: 'oliver', color: '#191970', role: 'user' }, // Midnight Blue
      { name: 'Sylvia', username: 'sylvia', color: '#DA70D6', role: 'user' }, // Orchid
      { name: 'Tom', username: 'tom', color: '#FFA500', role: 'user' } // Orange
    ];

    // 2. Ensure Users Exist
    for (const u of importUsers) {
      const exists = allUsers.some(existing => existing.username === u.username);
      if (!exists) {
        await addUser({ ...u, password: '123' }); // Default password
      }
    }

    // 3. Define Bookings (Ranges)
    // Format: [Start, End, Username] (Inclusive)
    const ranges = [
      ['2026-02-07', '2026-02-14', 'hannes'],
      ['2026-02-21', '2026-02-28', 'agnes'],
      ['2026-03-02', '2026-03-15', 'sylvia_jens'],
      ['2026-03-21', '2026-04-04', 'oliver'],
      ['2026-03-28', '2026-04-11', 'sylvia'],
      ['2026-04-04', '2026-04-25', 'sylvia_jens'],
      ['2026-05-09', '2026-05-23', 'sylvia_jens'],
      ['2026-05-23', '2026-05-31', 'sylvia'],
      ['2026-06-01', '2026-06-10', 'sylvia'],
      ['2026-06-06', '2026-06-17', 'agnes'],
      ['2026-06-10', '2026-06-24', 'sylvia_jens'],
      ['2026-06-20', '2026-07-03', 'tom'],
      ['2026-07-02', '2026-07-15', 'tom'],
      ['2026-07-15', '2026-08-05', 'sylvia_jens'],
      ['2026-08-02', '2026-08-16', 'sylvia_jens'],
      ['2026-08-15', '2026-08-31', 'sylvia'],
      ['2026-09-01', '2026-09-10', 'sylvia'],
      ['2026-09-01', '2026-09-15', 'sylvia_jens'],
      ['2026-10-15', '2026-10-31', 'sylvia_jens'],
      ['2026-11-02', '2026-11-15', 'sylvia_jens']
    ];

    // 4. Generate Booking Data
    const newBookings = {};

    const getDates = (start, end) => {
      const dates = [];
      let current = new Date(start);
      const stop = new Date(end);
      while (current <= stop) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };

    for (const [start, end, username] of ranges) {
      const dates = getDates(start, end);
      const userObj = importUsers.find(u => u.username === username) || allUsers.find(u => u.username === username);

      dates.forEach(date => {
        if (!newBookings[date]) newBookings[date] = [];
        // Check if already booked by this user (avoid duplicates from overlapping ranges in list)
        if (!newBookings[date].some(b => b.user.username === username)) {
          newBookings[date].push({
            status: 'booked',
            user: { name: userObj.name, username: userObj.username }
          });
        }
      });
    }

    // 5. Save to Firestore
    try {
      await setDoc(doc(db, 'bookings', '2026'), { data: newBookings });
      alert("Import successful! Please refresh the calendar.");
    } catch (e) {
      console.error(e);
      alert("Import failed: " + e.message);
    }
  };

  const handleClearYear = async (year) => {
    if (!window.confirm(`Are you sure you want to DELETE ALL DATA for ${year}? This cannot be undone.`)) return;

    try {
      await setDoc(doc(db, 'bookings', String(year)), { data: {} });
      alert(`All data for ${year} has been deleted.`);
    } catch (e) {
      console.error(e);
      alert("Deletion failed: " + e.message);
    }
  };

  const fetchBookingsForDate = async () => {
    if (!manageDate) {
      alert("Please select a date first.");
      return;
    }

    const year = manageDate.split('-')[0];
    const dateStr = manageDate;

    try {
      const docRef = doc(db, 'bookings', year);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data().data || {};
        // Normalize
        let bookingsForDate = data[dateStr];
        if (!bookingsForDate) bookingsForDate = [];
        else if (!Array.isArray(bookingsForDate)) bookingsForDate = [bookingsForDate];

        setDateBookings(bookingsForDate);
        setShowBookingModal(true);
        setSelectedBookingUsers([]);
      } else {
        setDateBookings([]);
        setShowBookingModal(true);
      }
    } catch (e) {
      console.error("Error fetching bookings:", e);
      alert("Failed to fetch bookings.");
    }
  };

  const handleRemoveUsersFromDate = async () => {
    if (selectedBookingUsers.length === 0) return;

    const year = manageDate.split('-')[0];
    const dateStr = manageDate;

    try {
      const docRef = doc(db, 'bookings', year);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const data = docSnap.data().data || {};
      let currentBookings = data[dateStr];

      // Normalize
      if (!Array.isArray(currentBookings)) currentBookings = [currentBookings];

      const updatedBookings = currentBookings.filter(b => !selectedBookingUsers.includes(b.user.username));

      const newData = { ...data };
      if (updatedBookings.length === 0) {
        delete newData[dateStr];
      } else {
        newData[dateStr] = updatedBookings;
      }

      await setDoc(docRef, { data: newData });

      // Update local state
      setDateBookings(updatedBookings);
      setSelectedBookingUsers([]);
      alert("Users removed successfully.");
    } catch (e) {
      console.error("Error updating bookings:", e);
      alert("Failed to update bookings.");
    }
  };

  const toggleBookingUserSelection = (username) => {
    if (selectedBookingUsers.includes(username)) {
      setSelectedBookingUsers(selectedBookingUsers.filter(u => u !== username));
    } else {
      setSelectedBookingUsers([...selectedBookingUsers, username]);
    }
  };

  return (
    <div className="admin-container">
      <h2>Admin Dashboard</h2>

      <div className="admin-grid">
        <div className="card add-user-card">
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
            <div className="form-group">
              <label>Name (Display Name)</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Aunt Marie"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="e.g. marie"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="e.g. 123"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="role-select"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super-Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn btn-primary">Add User</button>
          </form>
        </div>

        <div className="card user-list-card">
          <h3>Manage Users</h3>
          <div className="user-list">
            {allUsers.map(u => (
              <div key={u.username} className="user-item">
                <div className="user-info">
                  <div className="user-header">
                    <span className="color-dot" style={{ backgroundColor: u.color }}></span>
                    <span className="user-name">{u.name}</span>
                  </div>
                  <span className="user-meta">@{u.username} • {u.role}</span>
                </div>
                <div className="user-actions">
                  <button
                    onClick={() => startEdit(u)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  {u.username !== currentUser.username && u.username !== 'admin' && (
                    <button
                      onClick={() => deleteUser(u.username)}
                      className="btn-delete"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card data-tools-card">
          <h3>Data Tools</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Use this to populate the calendar with data from the 2026 plan image.
          </p>
          <button onClick={handleImport2026} className="btn btn-primary" style={{ backgroundColor: '#2c3e50' }}>
            Import 2026 Data from Image
          </button>
        </div>

        {currentUser.role === 'super-admin' && (
          <div className="card booking-manager-card">
            <h3>Manage Bookings</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Select a date to view and remove bookings.
            </p>
            <div className="form-group">
              <input
                type="date"
                value={manageDate}
                onChange={(e) => setManageDate(e.target.value)}
              />
            </div>
            <button onClick={fetchBookingsForDate} className="btn btn-primary">
              Manage Date
            </button>
          </div>
        )}

        {currentUser.role === 'super-admin' && (
          <div className="card danger-zone-card">
            <h3 style={{ color: 'var(--color-terracotta)' }}>Danger Zone</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              These actions are irreversible.
            </p>
            <button
              onClick={() => handleClearYear(2026)}
              className="btn"
              style={{ backgroundColor: 'var(--color-terracotta)', color: 'white', border: 'none' }}
            >
              Delete All 2026 Data
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit User: {editingUser.username}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="role-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super-admin">Super-Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={editForm.color}
                  onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                  style={{ height: '40px', padding: '2px' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Management Modal */}
      {showBookingModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Manage: {manageDate}</h3>
            {dateBookings.length === 0 ? (
              <p>No bookings for this date.</p>
            ) : (
              <div className="booking-list">
                {dateBookings.map((b, idx) => (
                  <div key={idx} className="booking-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedBookingUsers.includes(b.user.username)}
                        onChange={() => toggleBookingUserSelection(b.user.username)}
                      />
                      <span className="booking-name">{b.user.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowBookingModal(false)} className="btn btn-outline">Close</button>
              {dateBookings.length > 0 && (
                <button
                  onClick={handleRemoveUsersFromDate}
                  disabled={selectedBookingUsers.length === 0}
                  className="btn"
                  style={{ backgroundColor: 'var(--color-terracotta)', color: 'white', opacity: selectedBookingUsers.length === 0 ? 0.5 : 1 }}
                >
                  Remove Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-container {
          padding: 2rem 0;
        }

        h2 {
          color: var(--color-ocher);
          margin-bottom: 2rem;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }

        .card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        h3 {
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        input, .role-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: var(--font-body);
        }

        .error {
          color: var(--color-terracotta);
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .user-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: var(--bg-primary);
          border-radius: 8px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .user-name {
          font-weight: 600;
        }

        .user-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-left: 20px; /* Indent to align with name */
        }

        .user-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit, .btn-delete {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          background: transparent;
        }

        .btn-edit {
          border: 1px solid var(--color-azure);
          color: var(--color-azure);
        }

        .btn-edit:hover {
          background: var(--color-azure);
          color: white;
        }

        .btn-delete {
          border: 1px solid var(--color-terracotta);
          color: var(--color-terracotta);
        }

        .btn-delete:hover {
          background: var(--color-terracotta);
          color: white;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
