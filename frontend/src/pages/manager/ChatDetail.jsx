import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/api/chat/session/${id}`).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data?.session) return <div className="empty-state"><h4>Session not found</h4></div>;

  const s = data.session;
  const msgs = data.messages || [];

  return (
    <div className="chat-detail">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div>
          <h1>Chat #{s.id}</h1>
          <p>Full conversation details</p>
        </div>
      </div>

      <div className="chat-detail-card">
        <div className="chat-detail-meta">
          <div className="meta-item">
            <label>Customer</label>
            <span>{s.user_name} ({s.user_email})</span>
          </div>
          <div className="meta-item">
            <label>Status</label>
            <span className={`badge badge-${s.status}`}>{s.status}</span>
          </div>
          <div className="meta-item">
            <label>Category</label>
            <span>{s.sector_name || '—'}</span>
          </div>
          <div className="meta-item">
            <label>Subcategory</label>
            <span>{s.subprocess_name || '—'}</span>
          </div>
          <div className="meta-item">
            <label>Language</label>
            <span>{s.language || 'English'}</span>
          </div>
          <div className="meta-item">
            <label>Created At</label>
            <span>{s.created_at ? new Date(s.created_at).toLocaleString() : '—'}</span>
          </div>
          <div className="meta-item">
            <label>Resolved At</label>
            <span>{s.resolved_at ? new Date(s.resolved_at).toLocaleString() : '—'}</span>
          </div>
          {s.ticket_id && (
            <div className="meta-item">
              <label>Ticket ID</label>
              <span style={{ color: '#00338D', fontWeight: 600 }}>#{s.ticket_id}</span>
            </div>
          )}
        </div>

        {s.summary && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              AI Summary
            </div>
            <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{s.summary}</div>
          </div>
        )}

        {s.query_text && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Customer Query
            </div>
            <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>{s.query_text}</div>
          </div>
        )}
      </div>

      <div className="chat-detail-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Conversation ({msgs.length} messages)</h3>
        {msgs.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <h4>No messages recorded</h4>
            <p>Messages are saved during chat interactions</p>
          </div>
        ) : (
          <div className="chat-messages-list">
            {msgs.map(m => (
              <div key={m.id} className={`chat-msg ${m.sender}`}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {m.sender} · {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}
                </div>
                {m.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
