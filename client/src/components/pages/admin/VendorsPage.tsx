import { useState, useCallback } from "react";
import { api } from "../../../utils/api";
import { useTableFeatures } from "../../../hooks/useTableFeatures";
import SearchInput from "../../core/SearchInput";
import FilterDropdown from "../../core/FilterDropdown";
import SortableHeader from "../../core/SortableHeader";
import Pagination from "../../core/Pagination";
import type { Vendor, PaginatedResponse } from "../../../types";

function VendorsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({ name: "", contact_info: "" });
  const [error, setError] = useState("");

  const fetchVendors = useCallback(async (params: URLSearchParams) => {
    return api.admin.getVendors(params) as Promise<{
      data?: PaginatedResponse<Vendor>;
      error?: string;
    }>;
  }, []);

  const {
    data: vendors,
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
  } = useTableFeatures<Vendor>(fetchVendors, {
    defaultSort: { column: "name", direction: "asc" },
  });

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData({ name: "", contact_info: "" });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_info: vendor.contact_info || "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.contact_info.trim()) {
      setError("Contact info is required");
      return;
    }

    const response = editingVendor
      ? await api.admin.updateVendor(editingVendor.id, formData)
      : await api.admin.createVendor(formData);

    if (response.error) {
      setError(response.error);
      return;
    }

    setShowModal(false);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this vendor?")) return;

    const response = await api.admin.deleteVendor(id);
    if (response.error) {
      alert(response.error);
      return;
    }
    refresh();
  };

  const handleReactivate = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this vendor?")) return;

    const response = await api.admin.updateVendor(id, { is_active: true });
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

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">Vendors</h1>
          <button className="btn btn--primary" onClick={openCreateModal}>
            Add Vendor
          </button>
        </div>

        <div className="table-controls">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vendors..."
          />
          <FilterDropdown
            label="Status"
            value={filters.is_active || ""}
            options={statusOptions}
            onChange={(value) => setFilter("is_active", value)}
          />
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : vendors.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No vendors found</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader
                    column="name"
                    label="Name"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortableHeader
                    column="contact_info"
                    label="Contact Info"
                    sort={sort}
                    onSort={setSort}
                  />
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
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>{vendor.name}</td>
                    <td
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {vendor.contact_info || "-"}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-badge--${
                          vendor.is_active ? "approved" : "rejected"
                        }`}
                      >
                        {vendor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn--link btn--sm"
                        onClick={() => openEditModal(vendor)}
                      >
                        Edit
                      </button>
                      {vendor.is_active ? (
                        <button
                          className="btn btn--link btn--sm"
                          style={{ color: "#dc2626" }}
                          onClick={() => handleDelete(vendor.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          className="btn btn--link btn--sm"
                          style={{ color: "#16a34a" }}
                          onClick={() => handleReactivate(vendor.id)}
                        >
                          Reactivate
                        </button>
                      )}
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
                {editingVendor ? "Edit Vendor" : "Add Vendor"}
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
                <label className="form-group__label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-group__label">Contact Info *</label>
                <textarea
                  className="form-textarea"
                  value={formData.contact_info}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_info: e.target.value,
                    }))
                  }
                  placeholder="Phone, email, address, etc."
                  required
                />
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
                  {editingVendor ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorsPage;
