import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import type { Technician, User } from "../../../types";

function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [techniciansRes, usersRes] = await Promise.all([
      api.admin.getTechnicians(),
      api.admin.getUsers(),
    ]);
    if (techniciansRes.data)
      setTechnicians(techniciansRes.data as Technician[]);
    if (usersRes.data)
      setUsers((usersRes.data as User[]).filter((u) => u.is_active));
    setIsLoading(false);
  };

  const openCreateModal = () => {
    setFormData({ user_id: "" });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.user_id) {
      setError("User is required");
      return;
    }

    const response = await api.admin.createTechnician(formData);

    if (response.error) {
      setError(response.error);
      return;
    }

    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this technician?")) return;

    const response = await api.admin.deleteTechnician(id);
    if (response.error) {
      alert(response.error);
      return;
    }
    loadData();
  };

  const handleToggleActive = async (technician: Technician) => {
    const response = await api.admin.updateTechnician(technician.id, {
      is_active: !technician.is_active,
    });
    if (response.error) {
      alert(response.error);
      return;
    }
    loadData();
  };

  const availableUsers = users.filter(
    (u) => !technicians.some((t) => t.user_id === u.id)
  );

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Technicians</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add Technician
          </button>
        </div>

        <p
          style={{
            marginBottom: "1rem",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          Technicians can mark approved repair requests as completed. They can
          complete any approved repair regardless of department.
        </p>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : technicians.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No technicians configured</p>
            <p className="empty-state__description">
              Add technicians to enable repair completion workflow.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((technician) => (
                <tr key={technician.id}>
                  <td>
                    {technician.user?.full_name}
                    <span
                      style={{
                        color: "#9ca3af",
                        marginLeft: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {technician.user?.email}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-badge--${
                        technician.is_active ? "approved" : "rejected"
                      }`}
                    >
                      {technician.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn--link btn--sm"
                      onClick={() => handleToggleActive(technician)}
                    >
                      {technician.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn--link btn--sm"
                      style={{ color: "#dc2626" }}
                      onClick={() => handleDelete(technician.id)}
                    >
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
              <h2 className="modal__title">Add Technician</h2>
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
                <label className="form-group__label">User</label>
                <select
                  className="form-select"
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      user_id: e.target.value,
                    }))
                  }
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

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TechniciansPage;
