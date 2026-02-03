import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import type { User, Department } from "../../../types";
import PasswordInput from "../../core/PasswordInput";

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    department_id: "",
    job_title: "",
    is_admin: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [usersRes, deptsRes] = await Promise.all([
      api.admin.getUsers(),
      api.admin.getDepartments(),
    ]);
    if (usersRes.data) setUsers(usersRes.data as User[]);
    if (deptsRes.data) setDepartments(deptsRes.data as Department[]);
    setIsLoading(false);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      department_id: "",
      job_title: "",
      is_admin: false,
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      department_id: user.department_id || "",
      job_title: user.job_title || "",
      is_admin: user.is_admin,
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const data = { ...formData };
    if (!data.password && editingUser) {
      const { password: _, ...rest } = data;
      Object.assign(data, rest);
    }

    const response = editingUser
      ? await api.admin.updateUser(editingUser.id, data)
      : await api.admin.createUser(data);

    if (response.error) {
      setError(response.error);
      return;
    }

    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    const response = await api.admin.deleteUser(id);
    if (response.error) {
      alert(response.error);
      return;
    }
    loadData();
  };

  const handleReactivate = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this user?")) return;

    const response = await api.admin.updateUser(id, { is_active: true });
    if (response.error) {
      alert(response.error);
      return;
    }
    loadData();
  };

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Users</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add User
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No users yet</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.department?.name || "-"}</td>
                  <td>
                    {user.is_admin && (
                      <span className="status-badge status-badge--pending">
                        Admin
                      </span>
                    )}
                    {user.is_approver && (
                      <span
                        className="status-badge status-badge--approved"
                        style={{ marginLeft: "0.25rem" }}
                      >
                        Approver
                      </span>
                    )}
                    {!user.is_admin && !user.is_approver && "-"}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-badge--${
                        user.is_active ? "approved" : "rejected"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn--link btn--sm"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    {user.is_active ? (
                      <button
                        className="btn btn--link btn--sm"
                        style={{ color: "#dc2626" }}
                        onClick={() => handleDelete(user.id)}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        className="btn btn--link btn--sm"
                        style={{ color: "#16a34a" }}
                        onClick={() => handleReactivate(user.id)}
                      >
                        Reactivate
                      </button>
                    )}
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
              <h2 className="modal__title">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button
                className="modal__close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="form-group__error"
                  style={{ marginBottom: "1rem" }}
                >
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-group__label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <PasswordInput
                label={
                  <>Password {editingUser && "(leave blank to keep current)"}</>
                }
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required={!editingUser}
                minLength={8}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-group__label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-group__label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-group__label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Department</label>
                <select
                  className="form-select"
                  value={formData.department_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department_id: e.target.value,
                    }))
                  }
                >
                  <option value="">-- None --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-group__label">Job Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      job_title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_admin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_admin: e.target.checked,
                      }))
                    }
                  />
                  Admin (can manage all settings)
                </label>
              </div>
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingUser ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
