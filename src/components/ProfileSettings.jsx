import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfileSettings = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [color, setColor] = useState(user.color || '#87CEEB');

  const handleSave = (e) => {
    e.preventDefault();
    updateUser(user.username, { color });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Profile Settings</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Display Name</label>
            <input value={user.name} disabled className="disabled-input" />
            <span className="hint">Contact admin to change name</span>
          </div>

          <div className="form-group">
            <label>My Booking Color</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-input"
              />

            </div>
            <p className="hint">This color will identify your bookings on the calendar.</p>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>

      <style>{`
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

        h3 {
          margin-bottom: 1.5rem;
          color: var(--color-ocher);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .disabled-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #eee;
          background: #f9f9f9;
          border-radius: 6px;
          color: #666;
        }

        .color-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .color-input {
          width: 50px;
          height: 50px;
          padding: 0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .color-preview {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid #eee;
        }

        .hint {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
};

export default ProfileSettings;
