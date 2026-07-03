import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, UserPlus } from 'lucide-react';

export default function AddMemberModal({ groupId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post(`/groups/${groupId}/members`, { email });
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Add Member</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 10px' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Member's Email</label>
            <input className="input" type="email" placeholder="friend@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              They must already have a SplitSmart account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <UserPlus size={14} /> {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
