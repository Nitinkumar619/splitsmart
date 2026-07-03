import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Sparkles, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EXAMPLES = [
  "I paid ₹800 for dinner, split equally among all 4 of us",
  "Rahul paid 1200 for Uber, Nitin owes half and rest is equal among others",
  "Pizza was ₹600, I paid, split equally except Priya who is vegetarian pays only ₹100",
  "Hotel was 5000, paid by Arjun, split equally among everyone",
];

export default function AIExpenseModal({ group, onClose, onAdded }) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState(null);
  const [step, setStep] = useState('input'); // input | preview | saving
  const [loading, setLoading] = useState(false);

  const parseExpense = async () => {
    if (!prompt.trim()) return toast.error('Describe the expense first');
    setLoading(true);
    try {
      const res = await api.post('/ai/parse-expense', {
        prompt,
        members: group.members.map(m => ({ id: m.user._id, name: m.user.name })),
      });
      const data = res.data.data;

      // Map names to user IDs
      const memberMap = {};
      group.members.forEach(m => {
        memberMap[m.user.name.toLowerCase()] = m.user;
      });

      // Resolve paidBy
      const paidByUser = Object.entries(memberMap).find(([name]) =>
        data.paidBy?.toLowerCase().includes(name) || name.includes(data.paidBy?.toLowerCase())
      );
      const paidById = paidByUser ? paidByUser[1]._id : group.members[0].user._id;
      const paidByName = paidByUser ? paidByUser[1].name : group.members[0].user.name;

      // Resolve splits
      const resolvedSplits = data.splits.map(split => {
        const match = Object.entries(memberMap).find(([name]) =>
          split.name?.toLowerCase().includes(name) || name.includes(split.name?.toLowerCase())
        );
        return {
          userId: match ? match[1]._id : null,
          name: match ? match[1].name : split.name,
          amount: split.amount,
        };
      }).filter(s => s.userId);

      setParsed({
        ...data,
        paidById,
        paidByName,
        resolvedSplits,
      });
      setStep('preview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI parsing failed. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAndSave = async () => {
    setStep('saving');
    try {
      await api.post('/expenses', {
        groupId: group._id,
        description: parsed.description,
        amount: parsed.amount,
        paidBy: parsed.paidById,
        splitType: parsed.splitType || 'custom',
        splits: parsed.resolvedSplits.map(s => ({ user: s.userId, amount: s.amount })),
        category: parsed.category || 'other',
        aiGenerated: true,
        originalPrompt: prompt,
      });
      onAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
      setStep('preview');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="var(--accent-light)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>AI Expense Split</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 10px' }}><X size={16} /></button>
        </div>

        {step === 'input' && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Describe the expense in plain English. Mention who paid, how much, and how to split.
            </p>

            {/* Group members hint */}
            <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              Members: {group.members.map(m => m.user.name).join(', ')}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Describe the expense</label>
              <textarea className="input" rows={3} placeholder="I paid ₹1200 for dinner, split equally among all of us..."
                value={prompt} onChange={e => setPrompt(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            {/* Examples */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Try an example:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} type="button" onClick={() => setPrompt(ex)}
                    style={{
                      background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8,
                      padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                      fontSize: 12, color: 'var(--text-secondary)', transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={parseExpense} disabled={loading || !prompt.trim()}>
                {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...</> : <><Sparkles size={14} /> Parse with AI <ArrowRight size={14} /></>}
              </button>
            </div>
          </>
        )}

        {step === 'preview' && parsed && (
          <>
            <div style={{ marginBottom: 6 }}>
              <span className="badge badge-purple"><Sparkles size={11} /> AI Parsed</span>
              {parsed.confidence && (
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  Confidence: <span style={{ color: parsed.confidence === 'high' ? 'var(--green)' : parsed.confidence === 'medium' ? 'var(--yellow)' : 'var(--red)' }}>{parsed.confidence}</span>
                </span>
              )}
            </div>

            {parsed.interpretation && (
              <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--accent-light)' }}>
                💡 {parsed.interpretation}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
                  <div style={{ fontWeight: 600 }}>{parsed.description}</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>AMOUNT</div>
                  <div style={{ fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>₹{parsed.amount}</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>PAID BY</div>
                  <div style={{ fontWeight: 600 }}>{parsed.paidByName}</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CATEGORY</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{parsed.category}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>SPLITS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parsed.resolvedSplits.map((split, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card2)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: `hsl(${(split.name?.charCodeAt(0) || 65) * 5}, 55%, 35%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {split.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontSize: 14 }}>{split.name}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{split.amount?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep('input')}><RefreshCw size={14} /> Re-parse</button>
              <button className="btn btn-primary" onClick={confirmAndSave} disabled={step === 'saving'}>
                <Check size={14} /> {step === 'saving' ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
