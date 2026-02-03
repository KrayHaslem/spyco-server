import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import type { Repair, User, Unit, RepairStatus } from "../../types";
import AppLayout from "../core/AppLayout";

const STATUS_OPTIONS: { value: RepairStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

function AllRepairsPage() {
  const { user } = useAuth();
  const history = useHistory();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<RepairStatus | "">("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const params: { status?: string; owner_id?: string; unit_id?: string } = {};
    if (statusFilter) params.status = statusFilter;
    if (ownerFilter) params.owner_id = ownerFilter;
    if (unitFilter) params.unit_id = unitFilter;

    const response = await api.getAllRepairs(params);
    if (response.error) {
      setError(response.error);
      setRepairs([]);
    } else if (response.data) {
      setRepairs(response.data as Repair[]);
    }
    setIsLoading(false);
  }, [statusFilter, ownerFilter, unitFilter]);

  const loadFilterOptions = useCallback(async () => {
    // Only admins can see the full user/unit lists for filtering
    if (user?.is_admin) {
      const [usersRes, unitsRes] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getUnits(),
      ]);
      if (usersRes.data) setUsers(usersRes.data as User[]);
      if (unitsRes.data) setUnits(unitsRes.data as Unit[]);
    }
  }, [user?.is_admin]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadRepairs();
  }, [loadRepairs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const clearFilters = () => {
    setStatusFilter("");
    setOwnerFilter("");
    setUnitFilter("");
  };

  const hasActiveFilters = statusFilter || ownerFilter || unitFilter;

  // Check access - must be admin, approver, or technician
  if (!user?.is_admin && !user?.is_approver && !user?.is_technician) {
    return (
      <AppLayout>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state__title">Access Denied</p>
            <p className="empty-state__description">
              You must be an admin, approver, or technician to view all repairs.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="all-orders-page">
        <div className="card">
          <div className="card__header">
            <h1 className="card__title">All Repairs</h1>
          </div>

          {/* Filters */}
          <div className="all-orders-page__filters">
            <div className="all-orders-page__filter-row">
              <div className="form-group">
                <label className="form-group__label">Status</label>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as RepairStatus | "")
                  }
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {user?.is_admin && (
                <>
                  <div className="form-group">
                    <label className="form-group__label">Requested By</label>
                    <select
                      className="form-select"
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                      <option value="">All Users</option>
                      {users
                        .filter((u) => u.is_active)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.full_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-group__label">Unit</label>
                    <select
                      className="form-select"
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                    >
                      <option value="">All Units</option>
                      {units
                        .filter((u) => u.is_active)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_number}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {hasActiveFilters && (
                <button
                  className="btn btn--secondary"
                  onClick={clearFilters}
                  style={{ alignSelf: "flex-end" }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="form-group__error" style={{ margin: "1rem" }}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="loading">Loading repairs...</div>
          ) : repairs.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">No repairs found</p>
              <p className="empty-state__description">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : "No repairs have been created yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="table all-orders-page__table">
                <thead>
                  <tr>
                    <th>Repair Number</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {repairs.map((repair) => (
                    <tr
                      key={repair.id}
                      onClick={() => history.push(`/repair/${repair.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{repair.repair_number}</strong>
                      </td>
                      <td>{repair.description}</td>
                      <td>{repair.unit?.unit_number || "-"}</td>
                      <td>{repair.requested_by?.full_name || "-"}</td>
                      <td>
                        <span className={getStatusBadgeClass(repair.status)}>
                          {repair.status}
                        </span>
                      </td>
                      <td>{formatDate(repair.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="all-orders-page__cards">
                {repairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="order-card"
                    onClick={() => history.push(`/repair/${repair.id}`)}
                  >
                    <div className="order-card__info">
                      <span className="order-card__number">
                        {repair.repair_number}
                      </span>
                      <span className="order-card__description">
                        {repair.description}
                      </span>
                      <span className="order-card__meta">
                        Unit: {repair.unit?.unit_number} •{" "}
                        {formatDate(repair.created_at)}
                        {repair.requested_by &&
                          ` • By ${repair.requested_by.full_name}`}
                      </span>
                    </div>
                    <span className={getStatusBadgeClass(repair.status)}>
                      {repair.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Results count */}
          {!isLoading && repairs.length > 0 && (
            <div className="all-orders-page__footer">
              Showing {repairs.length} repair{repairs.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default AllRepairsPage;
