import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Plus, Trash2 } from 'lucide-react';

const EMOJIS = ['👥', '🍕', '✈️', '🏠', '🎉', '🏖️', '🎮', '🍜', '⛺', '🎓', '💼', '🏋️'];

export default function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', emoji: '👥', currency: '₹' });
  const [memberEmails, setMemberEmails] = useState(['']);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Group name is required');
    setLoading(true);
    try {
      const emails = memberEmails.filter(e => e.trim());
      const res = await api.post('/groups', { ...form, memberEmails: emails });
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>New Group</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 10px' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Emoji Picker */}
          <div>
            <label className="label">Group Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm(p => ({ ...p, emoji: e }))}
                  style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 20, cursor: 'pointer',
                    border: form.emoji === e ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: form.emoji === e ? 'var(--accent-dim)' : 'var(--bg-card2)',
                    transition: 'all 0.15s',
                  }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
            <div>
              <label className="label">Group Name *</label>
              <input className="input" placeholder="Goa Trip, Flat Expenses..." value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                <option value="₹">₹ INR</option>
                <option value="$">$ USD</option>
                <option value="€">€ EUR</option>
                <option value="£">£ GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="Optional note about this group" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          {/* Member Emails */}
          <div>
            <label className="label">Invite Members (by email)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {memberEmails.map((email, i) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="email" placeholder="friend@example.com" value={email}
                    onChange={e => { const arr = [...memberEmails]; arr[i] = e.target.value; setMemberEmails(arr); }} />
                  {memberEmails.length > 1 && (
                    <button type="button" className="btn btn-danger" style={{ padding: '0 12px', flexShrink: 0 }}
                      onClick={() => setMemberEmails(memberEmails.filter((_, idx) => idx !== i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 13 }}
                onClick={() => setMemberEmails([...memberEmails, ''])}>
                <Plus size={14} /> Add another
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Members must already have a SplitSmart account. You can also add them later.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
