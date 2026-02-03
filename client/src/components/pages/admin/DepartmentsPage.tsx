import { useState, useEffect } from 'react'
import { api } from '../../../utils/api'
import type { Department } from '../../../types'

function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setIsLoading(true)
    const response = await api.admin.getDepartments()
    if (response.data) {
      setDepartments(response.data as Department[])
    }
    setIsLoading(false)
  }

  const openCreateModal = () => {
    setEditingDept(null)
    setFormData({ name: '', description: '' })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (dept: Department) => {
    setEditingDept(dept)
    setFormData({ name: dept.name, description: dept.description || '' })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    const response = editingDept
      ? await api.admin.updateDepartment(editingDept.id, formData)
      : await api.admin.createDepartment(formData)

    if (response.error) {
      setError(response.error)
      return
    }

    setShowModal(false)
    loadDepartments()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    const response = await api.admin.deleteDepartment(id)
    if (response.error) {
      alert(response.error)
      return
    }
    loadDepartments()
  }

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Departments</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add Department
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No departments yet</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>{dept.name}</td>
                  <td>{dept.description || '-'}</td>
                  <td>
                    <span className={`status-badge status-badge--${dept.is_active ? 'approved' : 'rejected'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn--link btn--sm" onClick={() => openEditModal(dept)}>
                      Edit
                    </button>
                    <button className="btn btn--link btn--sm" style={{ color: '#dc2626' }} onClick={() => handleDelete(dept.id)}>
                      Delete
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
              <h2 className="modal__title">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              <button className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && <div className="form-group__error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-group">
                <label className="form-group__label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingDept ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentsPage
