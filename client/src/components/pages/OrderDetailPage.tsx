import { useState, useEffect, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import type { Order, Approver } from "../../types";
import AppLayout from "../core/AppLayout";

interface EditableLineItem {
  id: string;
  description: string;
  quantity: string;
  unit_cost: string;
}

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin line item editing state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState<EditableLineItem[]>([]);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    const [orderRes, approversRes] = await Promise.all([
      api.getOrder(id),
      api.getOrderApprovers(id),
    ]);

    if (orderRes.error) {
      setError(orderRes.error);
    } else if (orderRes.data) {
      setOrder(orderRes.data as Order);
    }

    if (approversRes.data) {
      setApprovers(approversRes.data as Approver[]);
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    const response = await api.submitOrder(order.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadOrder();
    }
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!order) return;
    setIsSubmitting(true);
    const response = await api.approveOrder(order.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadOrder();
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!order) return;
    setIsSubmitting(true);
    const response = await api.rejectOrder(order.id, rejectComment);
    if (response.error) {
      setError(response.error);
    } else {
      setShowRejectModal(false);
      setRejectComment("");
      loadOrder();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!order) return;
    if (!confirm("Are you sure you want to delete this order?")) return;

    const response = await api.deleteOrder(order.id);
    if (response.error) {
      setError(response.error);
    } else {
      history.push("/");
    }
  };

  const handleMarkPaid = async () => {
    if (!order) return;
    setIsSubmitting(true);
    const response = await api.markOrderPaid(order.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadOrder();
    }
    setIsSubmitting(false);
  };

  const startEditingItems = () => {
    if (!order?.items) return;
    setEditableItems(
      order.items.map((item, idx) => ({
        id: String(idx + 1),
        description: item.description,
        quantity: item.quantity !== null ? String(item.quantity) : "",
        unit_cost: item.unit_cost !== null ? String(item.unit_cost) : "",
      }))
    );
    setIsEditingItems(true);
  };

  const cancelEditingItems = () => {
    setIsEditingItems(false);
    setEditableItems([]);
  };

  const updateEditableItem = (
    id: string,
    field: keyof EditableLineItem,
    value: string
  ) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addEditableItem = () => {
    setEditableItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", quantity: "", unit_cost: "" },
    ]);
  };

  const removeEditableItem = (id: string) => {
    if (editableItems.length === 1) return;
    setEditableItems((prev) => prev.filter((item) => item.id !== id));
  };

  const saveEditedItems = async () => {
    if (!order) return;
    setIsSubmitting(true);
    setError("");

    const validItems = editableItems.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      setError("At least one line item is required");
      setIsSubmitting(false);
      return;
    }

    const response = await api.adminUpdateOrderItems(
      order.id,
      validItems.map((item) => ({
        description: item.description.trim(),
        quantity: item.quantity ? parseFloat(item.quantity) : null,
        unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
      }))
    );

    if (response.error) {
      setError(response.error);
    } else {
      setIsEditingItems(false);
      loadOrder();
    }
    setIsSubmitting(false);
  };

  const calculateEditableTotal = () => {
    return editableItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const canApprove =
    order?.status === "pending" &&
    user?.is_approver &&
    approvers.some((a) => a.user_id === user?.id);
  const canSubmit =
    (order?.status === "draft" || order?.status === "rejected") &&
    order?.ordered_by_id === user?.id;
  const canEdit =
    (order?.status === "draft" || order?.status === "rejected") &&
    order?.ordered_by_id === user?.id;
  const canDelete =
    order?.status === "draft" &&
    (order?.ordered_by_id === user?.id || user?.is_admin);
  const canAdminEditItems =
    user?.is_admin &&
    (order?.status === "approved" || order?.status === "paid");
  const canMarkPaid = user?.is_admin && order?.status === "approved";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="loading">Loading order...</div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="card">
          <p>Order not found.</p>
          <button
            className="btn btn--secondary"
            onClick={() => history.push("/")}
          >
            Back to Home
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="order-detail-page">
        <div className="card">
          <div className="card__header">
            <div>
              <h1 className="card__title">{order.order_number}</h1>
              <span
                className={getStatusBadgeClass(order.status)}
                style={{ marginTop: "0.5rem", display: "inline-block" }}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {canEdit && (
                <button
                  className="btn btn--secondary"
                  onClick={() => history.push(`/order/${order.id}/edit`)}
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button className="btn btn--danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              className="form-group__error"
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "#fef2f2",
                borderRadius: "0.375rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Vendor
              </h3>
              <p style={{ fontSize: "1rem" }}>{order.vendor?.name || "-"}</p>
              {order.vendor?.contact_info && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                    whiteSpace: "pre-line",
                  }}
                >
                  {order.vendor.contact_info}
                </p>
              )}
            </div>
            <div>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Unit
              </h3>
              <p style={{ fontSize: "1rem" }}>
                {order.unit?.unit_number || "None"}
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Ordered By
              </h3>
              <p style={{ fontSize: "1rem" }}>
                {order.ordered_by?.full_name || "-"}
              </p>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Created
              </h3>
              <p style={{ fontSize: "1rem" }}>{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#6b7280",
                marginBottom: "0.25rem",
              }}
            >
              Description
            </h3>
            <p style={{ fontSize: "1rem" }}>{order.description}</p>
          </div>

          {order.notes && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                Notes
              </h3>
              <p style={{ fontSize: "1rem" }}>{order.notes}</p>
            </div>
          )}

          {order.po_group && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#eff6ff",
                borderRadius: "0.375rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#1e40af",
                  marginBottom: "0.25rem",
                }}
              >
                PO Group
              </h3>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "#1e3a8a",
                }}
              >
                PO: {order.po_group.po_number}
              </p>
            </div>
          )}

          <div className="line-items-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <h3 className="line-items-section__title" style={{ margin: 0 }}>
                Line Items
              </h3>
              {canAdminEditItems && !isEditingItems && (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={startEditingItems}
                >
                  Edit Items
                </button>
              )}
            </div>

            {isEditingItems ? (
              /* Admin Editing Mode */
              <div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                  }}
                >
                  {editableItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          width: "24px",
                          paddingTop: "0.5rem",
                          color: "#9ca3af",
                        }}
                      >
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 2 }}
                        value={item.description}
                        onChange={(e) =>
                          updateEditableItem(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Item description"
                      />
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: "100px" }}
                        value={item.quantity}
                        onChange={(e) =>
                          updateEditableItem(
                            item.id,
                            "quantity",
                            e.target.value
                          )
                        }
                        placeholder="Qty"
                        step="0.01"
                      />
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: "120px" }}
                        value={item.unit_cost}
                        onChange={(e) =>
                          updateEditableItem(
                            item.id,
                            "unit_cost",
                            e.target.value
                          )
                        }
                        placeholder="Unit cost"
                        step="0.01"
                      />
                      <span
                        style={{
                          width: "100px",
                          paddingTop: "0.5rem",
                          textAlign: "right",
                          color: "#6b7280",
                        }}
                      >
                        {item.quantity && item.unit_cost
                          ? `$${(
                              parseFloat(item.quantity) *
                              parseFloat(item.unit_cost)
                            ).toFixed(2)}`
                          : "-"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEditableItem(item.id)}
                        className="btn btn--link"
                        style={{ color: "#dc2626", padding: "0.5rem" }}
                        disabled={editableItems.length === 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addEditableItem}
                  className="btn btn--secondary btn--sm"
                  style={{ marginBottom: "1rem" }}
                >
                  + Add Line Item
                </button>

                {calculateEditableTotal() > 0 && (
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: "1.125rem",
                      fontWeight: "600",
                      padding: "1rem",
                      background: "#f9fafb",
                      borderRadius: "0.375rem",
                      marginBottom: "1rem",
                    }}
                  >
                    Total: ${calculateEditableTotal().toFixed(2)}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn--secondary"
                    onClick={cancelEditingItems}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={saveEditedItems}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Items"}
                  </button>
                </div>
              </div>
            ) : (
              /* Normal View Mode */
              <>
                {/* Desktop Table View */}
                <table className="table line-items-section__table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Unit Cost</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.line_number}</td>
                        <td>{item.description}</td>
                        <td style={{ textAlign: "right" }}>
                          {item.quantity ?? "-"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {item.unit_cost != null &&
                          Number.isFinite(Number(item.unit_cost))
                            ? `$${Number(item.unit_cost).toFixed(2)}`
                            : "-"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {item.total != null &&
                          Number.isFinite(Number(item.total))
                            ? `$${Number(item.total).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                    {Number.isFinite(Number(order.total)) && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ textAlign: "right", fontWeight: "600" }}
                        >
                          Total:
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "600" }}>
                          ${Number(order.total).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="line-items-section__cards">
                  {order.items?.map((item) => (
                    <div key={item.id} className="line-item-card">
                      <div className="line-item-card__header">
                        <span className="line-item-card__number">
                          #{item.line_number}
                        </span>
                        <span className="line-item-card__total">
                          {item.total != null &&
                          Number.isFinite(Number(item.total))
                            ? `$${Number(item.total).toFixed(2)}`
                            : "-"}
                        </span>
                      </div>
                      <p className="line-item-card__description">
                        {item.description}
                      </p>
                      <div className="line-item-card__details">
                        <span>Qty: {item.quantity ?? "-"}</span>
                        <span>
                          Unit Cost:{" "}
                          {item.unit_cost != null &&
                          Number.isFinite(Number(item.unit_cost))
                            ? `$${Number(item.unit_cost).toFixed(2)}`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {Number.isFinite(Number(order.total)) && (
                    <div className="line-items-section__total">
                      <span>Total:</span>
                      <span>${Number(order.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {order.status === "pending" && approvers.length > 0 && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#fefce8",
                borderRadius: "0.375rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#854d0e",
                  marginBottom: "0.5rem",
                }}
              >
                Pending Approval From
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#713f12" }}>
                {approvers.map((a) => a.user?.full_name).join(", ")}
              </p>
            </div>
          )}

          {order.status === "approved" && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#f0fdf4",
                borderRadius: "0.375rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#166534",
                  marginBottom: "0.25rem",
                }}
              >
                Approved
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#15803d" }}>
                By {order.approved_by?.full_name} on{" "}
                {formatDate(order.approved_at)}
              </p>
            </div>
          )}

          {order.status === "paid" && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#f0f9ff",
                borderRadius: "0.375rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#0369a1",
                  marginBottom: "0.25rem",
                }}
              >
                Paid
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#0284c7" }}>
                Approved by {order.approved_by?.full_name} on{" "}
                {formatDate(order.approved_at)}
              </p>
            </div>
          )}

          {order.status === "rejected" && (
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "#fef2f2",
                borderRadius: "0.375rem",
              }}
            >
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#991b1b",
                  marginBottom: "0.25rem",
                }}
              >
                Rejected
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#dc2626" }}>
                By {order.rejected_by?.full_name} on{" "}
                {formatDate(order.rejected_at)}
              </p>
              {order.rejection_comment && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#7f1d1d",
                    marginTop: "0.5rem",
                  }}
                >
                  Reason: {order.rejection_comment}
                </p>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn--secondary"
              onClick={() => history.push("/")}
            >
              Back
            </button>

            {canSubmit && (
              <button
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {order?.status === "rejected"
                  ? "Re-submit for Approval"
                  : "Submit for Approval"}
              </button>
            )}

            {canApprove && (
              <>
                <button
                  className="btn btn--success"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  Approve
                </button>
                <button
                  className="btn btn--danger"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isSubmitting}
                >
                  Reject
                </button>
              </>
            )}

            {canMarkPaid && (
              <button
                className="btn btn--primary"
                onClick={handleMarkPaid}
                disabled={isSubmitting}
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Reject Order</h2>
              <button
                className="modal__close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-group">
              <label className="form-group__label">
                Reason for rejection (optional)
              </label>
              <textarea
                className="form-textarea"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Explain why this order is being rejected..."
              />
            </div>
            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Rejecting..." : "Reject Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default OrderDetailPage;
