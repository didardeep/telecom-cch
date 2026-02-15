import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../../api';
import { useAuth } from '../../AuthContext';

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const refreshDashboard = () => {
    apiGet('/api/customer/dashboard').then(d => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleClearChat = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await apiPut(`/api/chat/session/${sessionId}/resolve`, {});
      refreshDashboard();
    } catch {}
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const stats = data?.stats || {};
  const sessions = data?.recent_sessions || [];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's a summary of your support activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon primary">💬</div>
          </div>
          <div className="stat-card-label">Total Chats</div>
          <div className="stat-card-value">{stats.total_chats || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon success">✅</div>
          </div>
          <div className="stat-card-label">Resolved</div>
          <div className="stat-card-value">{stats.resolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon warning">🎫</div>
          </div>
          <div className="stat-card-label">Pending Tickets</div>
          <div className="stat-card-value">{stats.pending_tickets || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon danger">🔺</div>
          </div>
          <div className="stat-card-label">Escalated</div>
          <div className="stat-card-value">{stats.escalated || 0}</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <h3>Sessions</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/customer/chat')}>
            New Chat
          </button>
        </div>
        <div className="section-card-body-scroll">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <h4>No sessions yet</h4>
              <p>Start a chat to get help with your telecom issues</p>
            </div>
          ) : (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}
                    style={s.status === 'active' ? { cursor: 'pointer', background: '#eff6ff' } : {}}
                    onClick={() => s.status === 'active' && navigate(`/customer/chat?resume=${s.id}`)}
                    title={s.status === 'active' ? 'Click to resume this chat' : ''}
                  >
                    <td>#{s.id}</td>
                    <td>{s.sector_name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.query_text || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${s.status}`}>{s.status}</span>
                      {s.status === 'active' && <span style={{ fontSize: 11, color: '#3b82f6', marginLeft: 6 }}>Resume</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {s.status === 'active' && (
                        <button
                          className="btn btn-sm"
                          style={{
                            padding: '4px 10px', fontSize: 11, background: '#fef2f2',
                            color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6,
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                          }}
                          onClick={(e) => handleClearChat(e, s.id)}
                          title="End this chat session"
                        >
                          Clear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
