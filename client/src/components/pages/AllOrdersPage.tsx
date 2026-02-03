import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import type { Order, User, Vendor, OrderStatus } from "../../types";
import AppLayout from "../core/AppLayout";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

function AllOrdersPage() {
  const { user } = useAuth();
  const history = useHistory();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const params: { status?: string; owner_id?: string; vendor_id?: string } =
      {};
    if (statusFilter) params.status = statusFilter;
    if (ownerFilter) params.owner_id = ownerFilter;
    if (vendorFilter) params.vendor_id = vendorFilter;

    const response = await api.getAllOrders(params);
    if (response.error) {
      setError(response.error);
      setOrders([]);
    } else if (response.data) {
      setOrders(response.data as Order[]);
    }
    setIsLoading(false);
  }, [statusFilter, ownerFilter, vendorFilter]);

  const loadFilterOptions = useCallback(async () => {
    // Only admins can see the full user/vendor lists for filtering
    if (user?.is_admin) {
      const [usersRes, vendorsRes] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getVendors(),
      ]);
      if (usersRes.data) setUsers(usersRes.data as User[]);
      if (vendorsRes.data) setVendors(vendorsRes.data as Vendor[]);
    }
  }, [user?.is_admin]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const clearFilters = () => {
    setStatusFilter("");
    setOwnerFilter("");
    setVendorFilter("");
  };

  const hasActiveFilters = statusFilter || ownerFilter || vendorFilter;

  // Check access - must be admin or approver
  if (!user?.is_admin && !user?.is_approver) {
    return (
      <AppLayout>
        <div className="card">
          <div className="empty-state">
            <p className="empty-state__title">Access Denied</p>
            <p className="empty-state__description">
              You must be an admin or approver to view all orders.
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
            <h1 className="card__title">All Orders</h1>
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
                    setStatusFilter(e.target.value as OrderStatus | "")
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
                    <label className="form-group__label">Owner</label>
                    <select
                      className="form-select"
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                      <option value="">All Owners</option>
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
                    <label className="form-group__label">Vendor</label>
                    <select
                      className="form-select"
                      value={vendorFilter}
                      onChange={(e) => setVendorFilter(e.target.value)}
                    >
                      <option value="">All Vendors</option>
                      {vendors
                        .filter((v) => v.is_active)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
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
            <div className="loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__title">No orders found</p>
              <p className="empty-state__description">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : "No orders have been created yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <table className="table all-orders-page__table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Owner</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => history.push(`/order/${order.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{order.order_number}</strong>
                      </td>
                      <td>{order.description}</td>
                      <td>
                        <div>{order.vendor?.name || "-"}</div>
                        {order.vendor?.contact_info && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6b7280",
                              marginTop: "0.125rem",
                              whiteSpace: "pre-line",
                            }}
                          >
                            {order.vendor.contact_info}
                          </div>
                        )}
                      </td>
                      <td>{order.ordered_by?.full_name || "-"}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <span className={getStatusBadgeClass(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="all-orders-page__cards">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="order-card"
                    onClick={() => history.push(`/order/${order.id}`)}
                  >
                    <div className="order-card__info">
                      <span className="order-card__number">
                        {order.order_number}
                      </span>
                      <span className="order-card__description">
                        {order.description}
                      </span>
                      <span className="order-card__meta">
                        {order.vendor?.name} • {formatDate(order.created_at)}
                        {order.ordered_by &&
                          ` • By ${order.ordered_by.full_name}`}
                      </span>
                      {order.vendor?.contact_info && (
                        <span
                          className="order-card__contact"
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {order.vendor.contact_info}
                        </span>
                      )}
                      <span className="order-card__total">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <span className={getStatusBadgeClass(order.status)}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Results count */}
          {!isLoading && orders.length > 0 && (
            <div className="all-orders-page__footer">
              Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default AllOrdersPage;
