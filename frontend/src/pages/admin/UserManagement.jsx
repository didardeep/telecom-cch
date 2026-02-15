import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadUsers = () => {
    const params = new URLSearchParams();
    if (roleFilter) params.append('role', roleFilter);
    if (search) params.append('search', search);
    apiGet(`/api/admin/users?${params.toString()}`).then(d => {
      setUsers(d?.users || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const res = await apiPost('/api/admin/users', addForm);
      if (res.error) {
        setAddError(res.error);
      } else {
        setShowAdd(false);
        setAddForm({ name: '', email: '', password: '', role: 'customer' });
        loadUsers();
      }
    } catch {
      setAddError('Something went wrong');
    }
    setAddLoading(false);
  };

  const handleEdit = (u) => {
    setEditingId(u.id);
    setEditData({ name: u.name, email: u.email, role: u.role, password: '' });
    setEditError('');
  };

  const handleUpdate = async (id) => {
    setEditError('');
    const payload = { name: editData.name, email: editData.email, role: editData.role };
    if (editData.password) payload.password = editData.password;
    try {
      const res = await apiPut(`/api/admin/users/${id}`, payload);
      if (res.error) {
        setEditError(res.error);
        return;
      }
      setEditingId(null);
      setEditData({});
      loadUsers();
    } catch {
      setEditError('Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await apiDelete(`/api/admin/users/${id}`);
      if (data?.error) {
        alert(data.error);
      } else {
        setDeleteConfirm(null);
        loadUsers();
      }
    } catch {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Add, edit, and manage all system users</p>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>All Users ({users.length})</h3>
          <div className="table-filters">
            <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
              <option value="cto">CTO</option>
              <option value="admin">Admin</option>
            </select>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
              <input type="text" className="filter-input" placeholder="Search by name or email..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(!showAdd); setAddError(''); }}>
              {showAdd ? 'Cancel' : '+ Add User'}
            </button>
          </div>
        </div>

        {showAdd && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, margin: '0 0 16px' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>Add New User</h4>
            {addError && <div className="form-error" style={{ marginBottom: 10 }}>{addError}</div>}
            <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Name</label>
                <input type="text" className="form-input" placeholder="Full name" required
                  value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Email</label>
                <input type="email" className="form-input" placeholder="user@example.com" required
                  value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Password</label>
                <input type="password" className="form-input" placeholder="Min 6 characters" required
                  value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Role</label>
                <select className="form-input" value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="customer">Customer</option>
                  <option value="manager">Manager</option>
                  <option value="cto">CTO</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addLoading}>
                  {addLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {editError && <div className="form-error" style={{ margin: '0 0 10px' }}>{editError}</div>}

        {users.length === 0 ? (
          <div className="empty-state">
            <h4>No users found</h4>
            <p>Try adjusting your filters or add a new user</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#64748b' }}>#{u.id}</td>
                    <td>
                      {editingId === u.id ? (
                        <input type="text" className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
                      ) : (
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <input type="email" className="form-input" style={{ padding: '4px 8px', fontSize: 13 }}
                          value={editData.email} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                      ) : (
                        <span style={{ fontSize: 13, color: '#64748b' }}>{u.email}</span>
                      )}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <select className="filter-select" value={editData.role}
                          onChange={e => setEditData(d => ({ ...d, role: e.target.value }))}>
                          <option value="customer">Customer</option>
                          <option value="manager">Manager</option>
                          <option value="cto">CTO</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${u.role === 'admin' ? 'escalated' : u.role === 'manager' ? 'active' : u.role === 'cto' ? 'in_progress' : 'resolved'}`}
                          style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {editingId === u.id ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <input type="password" className="form-input" placeholder="New password (optional)"
                            style={{ padding: '4px 8px', fontSize: 11, width: 140 }}
                            value={editData.password} onChange={e => setEditData(d => ({ ...d, password: e.target.value }))} />
                          <button className="btn btn-success btn-sm" onClick={() => handleUpdate(u.id)}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); setEditData({}); setEditError(''); }}>Cancel</button>
                        </div>
                      ) : deleteConfirm === u.id ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                            onClick={() => handleDelete(u.id)}>Confirm</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(u)}>Edit</button>
                          <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                            onClick={() => setDeleteConfirm(u.id)}>Delete</button>
                        </div>
                      )}
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
