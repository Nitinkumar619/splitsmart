import { ArrowRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

export default function BalancesPanel({ balances, currency = '₹' }) {
  const { balances: memberBalances, settlements } = balances;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Net Balances */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>
          Net Balances
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {memberBalances.map((b, i) => {
            const isPositive = b.net > 0;
            const isNeutral = Math.abs(b.net) < 0.01;
            return (
              <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `hsl(${(b.user?.name?.charCodeAt(0) || 65) * 5}, 55%, 30%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {b.user?.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{b.user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isNeutral ? 'Settled up' : isPositive ? 'is owed money' : 'owes money'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!isNeutral && (isPositive
                    ? <TrendingUp size={14} color="var(--green)" />
                    : <TrendingDown size={14} color="var(--red)" />
                  )}
                  <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                    color: isNeutral ? 'var(--text-muted)' : isPositive ? 'var(--green)' : 'var(--red)',
                  }}>
                    {isNeutral ? '✓' : `${isPositive ? '+' : ''}${currency}${Math.abs(b.net).toFixed(0)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlements */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>
          Settlements Needed
        </h3>
        {settlements.length === 0 ? (
          <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <CheckCircle2 size={36} color="var(--green)" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>All settled up!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No outstanding balances in this group</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {settlements.map((s, i) => (
              <div key={i} className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    background: 'var(--red-dim)', color: 'var(--red)',
                    padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  }}>
                    {s.from?.name}
                  </div>
                  <ArrowRight size={14} color="var(--text-muted)" />
                  <div style={{
                    background: 'var(--green-dim)', color: 'var(--green)',
                    padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  }}>
                    {s.to?.name}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currency}{s.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.from?.name} pays {s.to?.name}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 2px' }}>
              ✦ Optimized to {settlements.length} transaction{settlements.length !== 1 ? 's' : ''} using greedy settlement
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
