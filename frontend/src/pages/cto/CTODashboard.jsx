import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';
import { useAuth } from '../../AuthContext';

export default function CTODashboard() {
  const [data, setData] = useState(null);
  const [mgrData, setMgrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiGet('/api/cto/overview'),
      apiGet('/api/manager/dashboard'),
    ]).then(([cto, mgr]) => {
      setData(cto);
      setMgrData(mgr);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const s = mgrData?.stats || {};
  const priorities = data?.priority_breakdown || [];
  const resRate = data?.resolution_rate || 0;
  const avgRating = data?.avg_rating || 0;

  return (
    <div>
      <div className="page-header">
        <h1>CTO Executive Overview</h1>
        <p>Welcome back, {user?.name}. High-level system health and KPIs.</p>
      </div>

      {/* Top-level KPIs */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon success">📈</div></div>
          <div className="stat-card-label">Resolution Rate</div>
          <div className="stat-card-value">{resRate}%</div>
          <div className="stat-card-sub">of all sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon warning">⭐</div></div>
          <div className="stat-card-label">Avg Customer Rating</div>
          <div className="stat-card-value">{avgRating}/5</div>
          <div className="stat-card-sub">{s.total_feedback || 0} feedbacks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon primary">👥</div></div>
          <div className="stat-card-label">Total Customers</div>
          <div className="stat-card-value">{data?.total_customers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon primary">💬</div></div>
          <div className="stat-card-label">Total Sessions</div>
          <div className="stat-card-value">{data?.total_sessions || 0}</div>
        </div>
      </div>

      {/* Tickets Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="section-card">
          <div className="section-card-header"><h3>Ticket Status Breakdown</h3></div>
          <div className="section-card-body">
            {[
              { label: 'Pending', value: s.pending_tickets || 0, color: '#f59e0b' },
              { label: 'In Progress', value: s.in_progress_tickets || 0, color: '#00338D' },
              { label: 'Resolved', value: s.resolved_tickets || 0, color: '#10b981' },
              { label: 'Escalated', value: s.escalated_tickets || 0, color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid #f0f2f5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '2px solid #e2e8f0', marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total Tickets</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#00338D' }}>{s.total_tickets || 0}</span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-card-header"><h3>Priority Distribution</h3></div>
          <div className="section-card-body">
            {priorities.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <h4>No tickets yet</h4>
              </div>
            ) : (
              <>
                {priorities.map((p, i) => {
                  const colors = { critical: '#ef4444', high: '#f43f5e', medium: '#f59e0b', low: '#10b981' };
                  const total = priorities.reduce((a, b) => a + b.count, 0) || 1;
                  const pct = Math.round((p.count / total) * 100);
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{p.priority}</span>
                        <span style={{ fontSize: 13, color: '#64748b' }}>{p.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[p.priority] || '#94a3b8', borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {mgrData?.category_breakdown?.length > 0 && (
        <div className="section-card">
          <div className="section-card-header"><h3>Issues by Service Category</h3></div>
          <div className="section-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {mgrData.category_breakdown.map((c, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, maxWidth: '70%' }}>{c.name || 'Uncategorized'}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#00338D' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Health */}
      <div className="section-card" style={{ marginTop: 24 }}>
        <div className="section-card-header"><h3>Chat System Health</h3></div>
        <div className="section-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Chats', val: s.total_chats || 0, icon: '💬' },
              { label: 'Resolved Chats', val: s.resolved_chats || 0, icon: '✅' },
              { label: 'Escalated Chats', val: s.escalated_chats || 0, icon: '🔺' },
              { label: 'Active Now', val: s.active_chats || 0, icon: '🟢' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1e293b' }}>{item.val}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/cto/tickets')}>View All Tickets</button>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/cto/tracking')}>Issue Tracking</button>
      </div>
    </div>
  );
}
