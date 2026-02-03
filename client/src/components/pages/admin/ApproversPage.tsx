import { useState, useEffect } from 'react'
import { api } from '../../../utils/api'
import type { Approver, User, Department } from '../../../types'

function ApproversPage() {
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingApprover, setEditingApprover] = useState<Approver | null>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    department_ids: [] as string[],
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const [approversRes, usersRes, deptsRes] = await Promise.all([
      api.admin.getApprovers(),
      api.admin.getUsers(),
      api.admin.getDepartments(),
    ])
    if (approversRes.data) setApprovers(approversRes.data as Approver[])
    if (usersRes.data) setUsers((usersRes.data as User[]).filter((u) => u.is_active))
    if (deptsRes.data) setDepartments((deptsRes.data as Department[]).filter((d) => d.is_active))
    setIsLoading(false)
  }

  const openCreateModal = () => {
    setEditingApprover(null)
    setFormData({ user_id: '', department_ids: [] })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (approver: Approver) => {
    setEditingApprover(approver)
    setFormData({
      user_id: approver.user_id,
      department_ids: approver.department_ids || [],
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!editingApprover && !formData.user_id) {
      setError('User is required')
      return
    }

    const response = editingApprover
      ? await api.admin.updateApprover(editingApprover.id, { department_ids: formData.department_ids })
      : await api.admin.createApprover(formData)

    if (response.error) {
      setError(response.error)
      return
    }

    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this approver?')) return

    const response = await api.admin.deleteApprover(id)
    if (response.error) {
      alert(response.error)
      return
    }
    loadData()
  }

  const toggleDepartment = (deptId: string) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter((id) => id !== deptId)
        : [...prev.department_ids, deptId],
    }))
  }

  const availableUsers = users.filter(
    (u) => !approvers.some((a) => a.user_id === u.id) || editingApprover?.user_id === u.id
  )

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Approvers</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add Approver
          </button>
        </div>

        <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Approvers can approve or reject purchase orders. Assign departments to limit which POs they can approve,
          or leave empty for global approval access.
        </p>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : approvers.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No approvers configured</p>
            <p className="empty-state__description">Add approvers to enable the PO approval workflow.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Departments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvers.map((approver) => (
                <tr key={approver.id}>
                  <td>
                    {approver.user?.full_name}
                    <span style={{ color: '#9ca3af', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                      {approver.user?.email}
                    </span>
                  </td>
                  <td>
                    {approver.is_global_approver ? (
                      <span className="status-badge status-badge--approved">All Departments</span>
                    ) : (
                      approver.departments?.map((d) => (
                        <span key={d.id} className="status-badge status-badge--draft" style={{ marginRight: '0.25rem' }}>
                          {d.name}
                        </span>
                      ))
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${approver.is_active ? 'approved' : 'rejected'}`}>
                      {approver.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn--link btn--sm" onClick={() => openEditModal(approver)}>
                      Edit
                    </button>
                    <button className="btn btn--link btn--sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(approver.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingApprover ? 'Edit Approver' : 'Add Approver'}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="form-group__error" style={{ marginBottom: '1rem' }}>{error}</div>}

              {!editingApprover && (
                <div className="form-group">
                  <label className="form-group__label">User</label>
                  <select
                    className="form-select"
                    value={formData.user_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                    required
                  >
                    <option value="">-- Select User --</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingApprover && (
                <div className="form-group">
                  <label className="form-group__label">User</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingApprover.user?.full_name || ''}
                    disabled
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-group__label">Departments (leave empty for all)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {departments.map((dept) => (
                    <label key={dept.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.department_ids.includes(dept.id)}
                        onChange={() => toggleDepartment(dept.id)}
                      />
                      {dept.name}
                    </label>
                  ))}
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {formData.department_ids.length === 0
                    ? 'This approver will be notified of ALL purchase orders.'
                    : `This approver will only be notified of POs from users in: ${formData.department_ids.map((id) => departments.find((d) => d.id === id)?.name).join(', ')}`}
                </p>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingApprover ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApproversPage
