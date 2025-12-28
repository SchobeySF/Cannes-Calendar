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
