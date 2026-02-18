import { useState, useEffect } from 'react';
import { apiGet } from '../../api';

export default function AgentIssues() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadTickets = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (agentFilter) params.append('agent_id', agentFilter);
    if (search) params.append('search', search);
    apiGet(`/api/admin/agent-tickets?${params.toString()}`).then(d => {
      setTickets(d?.tickets || []);
      if (d?.agents) setAgents(d.agents);
      setLoading(false);
    });
  };

  useEffect(() => { loadTickets(); }, [statusFilter, agentFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadTickets();
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Agent Issues</h1>
        <p>Records of issues handled or being handled by human agents</p>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Agent-Handled Tickets ({tickets.length})</h3>
          <div className="table-filters">
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <select className="filter-select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by customer name, email, ref..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-state">
            <h4>No agent-handled tickets found</h4>
            <p>No tickets are currently assigned to human agents</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref #</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Subcategory</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#00338D', fontWeight: 600 }}>
                        {t.reference_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.user_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.user_email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{t.category || '—'}</td>
                    <td style={{ fontSize: 13 }}>{t.subcategory || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 13, fontWeight: 500, color: '#483698',
                      }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(72,54,152,0.10)', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#483698', flexShrink: 0,
                        }}>
                          {(t.assignee_name || 'U').charAt(0).toUpperCase()}
                        </span>
                        {t.assignee_name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {t.resolved_at ? new Date(t.resolved_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
