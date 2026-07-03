import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Sparkles, Users, ArrowRight, Trash2, Receipt, BarChart2, UserPlus } from 'lucide-react';
import AddExpenseModal from '../components/AddExpenseModal';
import AIExpenseModal from '../components/AIExpenseModal';
import BalancesPanel from '../components/BalancesPanel';
import AddMemberModal from '../components/AddMemberModal';
import { format } from 'date-fns';

const CATEGORY_ICONS = {
  food: '🍕', transport: '🚗', accommodation: '🏠',
  entertainment: '🎉', shopping: '🛍️', utilities: '💡', other: '📝',
};

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/groups/${id}/balances`),
      ]);
      setGroup(groupRes.data);
      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
    } catch (err) {
      toast.error('Failed to load group');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
      Loading group...
    </div>
  );

  if (!group) return null;

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '6px 12px', fontSize: 13, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 36 }}>{group.emoji}</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{group.name}</h1>
              {group.description && <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{group.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                {group.members.map((m, i) => (
                  <div key={i} title={m.user?.name} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `hsl(${(m.user?.name?.charCodeAt(0) || 65) * 5}, 55%, 35%)`,
                    border: '2px solid var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                    marginLeft: i > 0 ? -6 : 0,
                  }}>
                    {m.user?.name?.[0]?.toUpperCase()}
                  </div>
                ))}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{group.members.length} members</span>
                <button onClick={() => setShowAddMember(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', fontSize: 12, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <UserPlus size={12} /> Add
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowAI(true)}>
              <Sparkles size={15} /> AI Split
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
              <Plus size={15} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Spent', value: `${group.currency}${totalExpenses.toLocaleString('en-IN')}`, color: 'var(--text-primary)' },
          { label: 'Expenses', value: expenses.length, color: 'var(--text-primary)' },
          { label: 'Settlements Needed', value: balances?.settlements?.length || 0, color: balances?.settlements?.length ? 'var(--yellow)' : 'var(--green)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[
          { key: 'expenses', label: 'Expenses', icon: <Receipt size={14} /> },
          { key: 'balances', label: 'Balances & Settlements', icon: <BarChart2 size={14} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)',
            color: activeTab === tab.key ? 'var(--accent-light)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        expenses.length === 0 ? (
          <div className="card empty-state">
            <Receipt size={44} />
            <h3>No expenses yet</h3>
            <p style={{ fontSize: 13 }}>Add your first expense manually or describe it in plain English using AI Split</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowAI(true)}><Sparkles size={14} /> AI Split</button>
              <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}><Plus size={14} /> Manual</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expenses.map(expense => (
              <div key={expense._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Category icon */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {CATEGORY_ICONS[expense.category] || '📝'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{expense.description}</span>
                    {expense.aiGenerated && (
                      <span className="badge badge-purple" style={{ fontSize: 10 }}><Sparkles size={10} /> AI</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Paid by <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{expense.paidBy?.name}</span>
                    {' · '}{format(new Date(expense.date), 'dd MMM yyyy')}
                    {' · '}<span style={{ textTransform: 'capitalize' }}>{expense.splitType} split</span>
                  </div>
                  {/* Splits mini */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {expense.splits.map((split, i) => (
                      <span key={i} style={{ fontSize: 11, background: 'var(--bg-card2)', padding: '2px 8px', borderRadius: 6, color: 'var(--text-secondary)' }}>
                        {split.user?.name}: {group.currency}{split.amount.toFixed(0)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {group.currency}{expense.amount.toLocaleString('en-IN')}
                  </div>
                  <button onClick={() => deleteExpense(expense._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: 4, padding: 4 }}
                    title="Delete expense">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && balances && (
        <BalancesPanel balances={balances} currency={group.currency} />
      )}

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onAdded={() => { fetchAll(); setShowAddExpense(false); toast.success('Expense added!'); }}
        />
      )}
      {showAI && (
        <AIExpenseModal
          group={group}
          onClose={() => setShowAI(false)}
          onAdded={() => { fetchAll(); setShowAI(false); toast.success('Expense added via AI!'); }}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          groupId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { fetchAll(); setShowAddMember(false); toast.success('Member added!'); }}
        />
      )}
    </div>
  );
}
