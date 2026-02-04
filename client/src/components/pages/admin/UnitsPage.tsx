import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { useTableFeatures } from "../../../hooks/useTableFeatures";
import SearchInput from "../../core/SearchInput";
import FilterDropdown from "../../core/FilterDropdown";
import SortableHeader from "../../core/SortableHeader";
import Pagination from "../../core/Pagination";
import type { Unit, Department, PaginatedResponse } from "../../../types";

const UNIT_TYPES = ["vehicle", "trailer", "equipment", "location", "other"];

function UnitsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    unit_number: "",
    description: "",
    unit_type: "other",
    department_id: "",
  });
  const [error, setError] = useState("");

  const fetchUnits = useCallback(async (params: URLSearchParams) => {
    return api.admin.getUnits(params) as Promise<{
      data?: PaginatedResponse<Unit>;
      error?: string;
    }>;
  }, []);

  const {
    data: units,
    isLoading,
    search,
    setSearch,
    filters,
    setFilter,
    sort,
    setSort,
    pagination,
    setPage,
    refresh,
  } = useTableFeatures<Unit>(fetchUnits, {
    defaultSort: { column: "unit_number", direction: "asc" },
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    const response = await api.admin.getDepartments();
    if (response.data) {
      setDepartments(response.data as Department[]);
    }
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setFormData({
      unit_number: "",
      description: "",
      unit_type: "other",
      department_id: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      unit_number: unit.unit_number,
      description: unit.description || "",
      unit_type: unit.unit_type,
      department_id: unit.department_id || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.unit_number.trim()) {
      setError("Unit number is required");
      return;
    }

    const response = editingUnit
      ? await api.admin.updateUnit(editingUnit.id, formData)
      : await api.admin.createUnit(formData);

    if (response.error) {
      setError(response.error);
      return;
    }

    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this unit?")) return;

    const response = await api.admin.deleteUnit(id);
    if (response.error) {
      alert(response.error);
      return;
    }
    refresh();
  };

  const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const typeOptions = UNIT_TYPES.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Units</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add Unit
          </button>
        </div>

        <div className="table-controls">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search units..."
          />
          <FilterDropdown
            label="Status"
            value={filters.is_active || ""}
            options={statusOptions}
            onChange={(value) => setFilter("is_active", value)}
          />
          <FilterDropdown
            label="Type"
            value={filters.unit_type || ""}
            options={typeOptions}
            onChange={(value) => setFilter("unit_type", value)}
          />
          <FilterDropdown
            label="Department"
            value={filters.department_id || ""}
            options={departmentOptions}
            onChange={(value) => setFilter("department_id", value)}
          />
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : units.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No units found</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader
                    column="unit_number"
                    label="Unit Number"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortableHeader
                    column="description"
                    label="Description"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortableHeader
                    column="unit_type"
                    label="Type"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th>Department</th>
                  <SortableHeader
                    column="is_active"
                    label="Status"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.unit_number}</td>
                    <td>{unit.description || "-"}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {unit.unit_type}
                    </td>
                    <td>{unit.department?.name || "-"}</td>
                    <td>
                      <span
                        className={`status-badge status-badge--${
                          unit.is_active ? "approved" : "rejected"
                        }`}
                      >
                        {unit.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn--link btn--sm"
                        onClick={() => openEditModal(unit)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--link btn--sm"
                        style={{ color: "#dc2626" }}
                        onClick={() => handleDelete(unit.id)}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {editingUnit ? "Edit Unit" : "Add Unit"}
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
                <label className="form-group__label">Unit Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.unit_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unit_number: e.target.value,
                    }))
                  }
                  placeholder="e.g., T-101, SHOP, V-2045"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Type</label>
                <select
                  className="form-select"
                  value={formData.unit_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      unit_type: e.target.value,
                    }))
                  }
                >
                  {UNIT_TYPES.map((type) => (
                    <option
                      key={type}
                      value={type}
                      style={{ textTransform: "capitalize" }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
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
              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingUnit ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnitsPage;
