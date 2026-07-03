import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'other'];

export default function AddExpenseModal({ group, onClose, onAdded }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    description: '',
    amount: '',
    paidBy: user?._id || '',
    splitType: 'equal',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Track which members are participating
  const [participating, setParticipating] = useState(
    Object.fromEntries(group.members.map(m => [m.user._id, true]))
  );
  const [customSplits, setCustomSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  const participatingIds = Object.entries(participating).filter(([, v]) => v).map(([k]) => k);
  const participatingMembers = group.members.filter(m => participatingIds.includes(m.user._id));

  // Recompute splits whenever amount, splitType, or participating members change
  useEffect(() => {
    const total = parseFloat(form.amount) || 0;
    if (form.splitType === 'equal') {
      const count = participatingMembers.length || 1;
      const per = +(total / count).toFixed(2);
      setCustomSplits(group.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        amount: participating[m.user._id] ? per : 0,
      })));
    } else if (form.splitType === 'percentage') {
      const count = participatingMembers.length || 1;
      const perPct = +(100 / count).toFixed(2);
      setCustomSplits(group.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        percentage: participating[m.user._id] ? perPct : 0,
        amount: participating[m.user._id] ? +(total * perPct / 100).toFixed(2) : 0,
      })));
    } else {
      // custom — keep existing amounts, just zero out non-participating
      setCustomSplits(prev => {
        if (prev.length === 0) {
          return group.members.map(m => ({ userId: m.user._id, name: m.user.name, amount: 0 }));
        }
        return prev.map(s => participating[s.userId] ? s : { ...s, amount: 0 });
      });
    }
  }, [form.amount, form.splitType, JSON.stringify(participating)]);

  const toggleMember = (userId) => {
    // Don't allow unchecking if only 1 left
    const currentCount = Object.values(participating).filter(Boolean).length;
    if (participating[userId] && currentCount <= 1) return toast.error('At least one member must participate');
    setParticipating(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleAmountChange = (val) => {
    setForm(p => ({ ...p, amount: val }));
  };

  const handleSplitTypeChange = (type) => {
    setForm(p => ({ ...p, splitType: type }));
  };

  const updateSplitAmount = (userId, val) => {
    setCustomSplits(prev => prev.map(s => s.userId === userId ? { ...s, amount: parseFloat(val) || 0 } : s));
  };

  const updateSplitPct = (userId, val) => {
    const pct = parseFloat(val) || 0;
    const total = parseFloat(form.amount) || 0;
    setCustomSplits(prev => prev.map(s =>
      s.userId === userId ? { ...s, percentage: pct, amount: +(total * pct / 100).toFixed(2) } : s
    ));
  };

  const activeSplits = customSplits.filter(s => participating[s.userId]);
  const splitsTotal = activeSplits.reduce((s, x) => s + (x.amount || 0), 0);
  const amount = parseFloat(form.amount) || 0;
  const splitsDiff = Math.abs(splitsTotal - amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Description required');
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    if (participatingMembers.length === 0) return toast.error('Select at least one member');
    if (splitsDiff > 0.5) return toast.error(`Splits total (${splitsTotal.toFixed(2)}) must equal amount (${amount})`);

    setLoading(true);
    try {
      await api.post('/expenses', {
        groupId: group._id,
        description: form.description,
        amount,
        paidBy: form.paidBy,
        splitType: form.splitType,
        splits: customSplits
          .filter(s => participating[s.userId])
          .map(s => ({ user: s.userId, amount: s.amount })),
        category: form.category,
        date: form.date,
        notes: form.notes,
      });
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Add Expense</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 10px' }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description + Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Description *</label>
              <input className="input" placeholder="Dinner at Pizza Hut" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                onChange={e => handleAmountChange(e.target.value)} required />
            </div>
          </div>

          {/* Paid By + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Paid By</label>
              <select className="input" value={form.paidBy} onChange={e => setForm(p => ({ ...p, paidBy: e.target.value }))}>
                {group.members.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Who's included */}
          <div>
            <label className="label">Split Between</label>
            <div style={{
              background: 'var(--bg-card2)', borderRadius: 10,
              border: '1px solid var(--border)', overflow: 'hidden'
            }}>
              {group.members.map((m, i) => {
                const isOn = participating[m.user._id];
                return (
                  <div key={m.user._id} onClick={() => toggleMember(m.user._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', cursor: 'pointer',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                      background: isOn ? 'transparent' : 'rgba(0,0,0,0.2)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isOn ? 'var(--accent-dim)' : 'rgba(0,0,0,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = isOn ? 'transparent' : 'rgba(0,0,0,0.2)'}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${isOn ? 'var(--accent)' : 'var(--text-muted)'}`,
                      background: isOn ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isOn && <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>}
                    </div>
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isOn
                        ? `hsl(${(m.user.name?.charCodeAt(0) || 65) * 5}, 55%, 35%)`
                        : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                      opacity: isOn ? 1 : 0.5, transition: 'all 0.15s',
                    }}>
                      {m.user.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 500,
                      color: isOn ? 'var(--text-primary)' : 'var(--text-muted)',
                      flex: 1, transition: 'color 0.15s',
                    }}>
                      {m.user.name}
                    </span>
                    {isOn && amount > 0 && form.splitType === 'equal' && (
                      <span style={{ fontSize: 13, color: 'var(--accent-light)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        ₹{(amount / participatingMembers.length).toFixed(0)}
                      </span>
                    )}
                    {!isOn && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>excluded</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              {participatingMembers.length} of {group.members.length} members · equal share: ₹{amount > 0 ? (amount / (participatingMembers.length || 1)).toFixed(0) : '0'}
            </p>
          </div>

          {/* Split Type */}
          <div>
            <label className="label">Split Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['equal', 'custom', 'percentage'].map(type => (
                <button key={type} type="button" onClick={() => handleSplitTypeChange(type)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)',
                    background: form.splitType === type ? 'var(--accent)' : 'var(--bg-card2)',
                    color: form.splitType === type ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                  }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom / Percentage split detail — only for non-equal */}
          {form.splitType !== 'equal' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="label" style={{ margin: 0 }}>Split Amounts</label>
                {splitsDiff > 0.5 && (
                  <span style={{ fontSize: 12, color: 'var(--red)' }}>
                    Diff: ₹{splitsDiff.toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customSplits.filter(s => participating[s.userId]).map(split => (
                  <div key={split.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `hsl(${(split.name?.charCodeAt(0) || 65) * 5}, 55%, 35%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {split.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{split.name}</span>
                    {form.splitType === 'percentage' && (
                      <input className="input" type="number" min="0" max="100" step="0.01"
                        value={split.percentage || ''} onChange={e => updateSplitPct(split.userId, e.target.value)}
                        style={{ width: 72 }} placeholder="%" />
                    )}
                    <input className="input" type="number" min="0" step="0.01"
                      value={split.amount || ''} onChange={e => updateSplitAmount(split.userId, e.target.value)}
                      style={{ width: 100 }} placeholder="0.00" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date + Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Optional note" value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"
              disabled={loading || (form.splitType !== 'equal' && splitsDiff > 0.5)}>
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
