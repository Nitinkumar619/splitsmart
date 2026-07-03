import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Users, ChevronRight, Wallet, TrendingUp, Receipt } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const totalSpend = groups.reduce((sum, g) => sum + (g.totalExpenses || 0), 0);

  const emojis = ['🍕', '✈️', '🏠', '🎉', '🏖️', '🎮', '🍜', '⛺'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track and split expenses with your groups</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Group
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: <Users size={20} />, label: 'Groups', value: groups.length, color: 'var(--accent)' },
          { icon: <Receipt size={20} />, label: 'Total Tracked', value: `₹${totalSpend.toLocaleString('en-IN')}`, color: 'var(--green)' },
          { icon: <TrendingUp size={20} />, label: 'Avg per Group', value: groups.length ? `₹${Math.round(totalSpend / groups.length).toLocaleString('en-IN')}` : '₹0', color: 'var(--yellow)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>Your Groups</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{groups.length} groups</span>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 120, background: 'var(--bg-card2)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card empty-state">
          <Wallet size={44} />
          <h3>No groups yet</h3>
          <p style={{ fontSize: 13 }}>Create a group to start splitting expenses with friends</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
            <Plus size={15} /> Create your first group
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {groups.map(group => (
            <div key={group._id} className="card" onClick={() => navigate(`/group/${group._id}`)}
              style={{ cursor: 'pointer', transition: 'all 0.18s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{group.emoji || '👥'}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{group.name}</div>
                    {group.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{group.description}</div>}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex' }}>
                    {group.members.slice(0, 4).map((m, i) => (
                      <div key={i} style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: `hsl(${(m.user?.name?.charCodeAt(0) || 65) * 5}, 60%, 35%)`,
                        border: '2px solid var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i,
                      }}>
                        {m.user?.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{group.members.length} members</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                    {group.currency || '₹'}{(group.totalExpenses || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>total spent</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => { setGroups(prev => [g, ...prev]); setShowCreate(false); toast.success('Group created!'); }}
        />
      )}
    </div>
  );
}
