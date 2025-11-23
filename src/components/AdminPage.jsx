import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPage = () => {
    const { allUsers, addUser, deleteUser, user: currentUser } = useAuth();
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

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

        addUser({ username: newUsername, password: newPassword, name: newName });
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        setError('');
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
                                    <span className="user-name">{u.name}</span>
                                    <span className="user-meta">@{u.username} • {u.role}</span>
                                </div>
                                {u.username !== currentUser.username && u.username !== 'admin' && (
                                    <button
                                        onClick={() => deleteUser(u.username)}
                                        className="btn-delete"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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

        input {
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

        .user-name {
          font-weight: 600;
        }

        .user-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .btn-delete {
          background: transparent;
          border: 1px solid var(--color-terracotta);
          color: var(--color-terracotta);
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .btn-delete:hover {
          background: var(--color-terracotta);
          color: white;
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
