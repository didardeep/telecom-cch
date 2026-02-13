import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';
import { useAuth } from '../../AuthContext';

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiGet('/api/customer/dashboard').then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

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
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.sector_name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.query_text || '—'}
                    </td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
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
