import { useState, useEffect, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import type { Repair, Approver } from "../../types";
import AppLayout from "../core/AppLayout";

function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();
  const [repair, setRepair] = useState<Repair | null>(null);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRepair = useCallback(async () => {
    setIsLoading(true);
    const [repairRes, approversRes] = await Promise.all([
      api.getRepair(id),
      api.getRepairApprovers(id),
    ]);

    if (repairRes.error) {
      setError(repairRes.error);
    } else if (repairRes.data) {
      setRepair(repairRes.data as Repair);
    }

    if (approversRes.data) {
      setApprovers(approversRes.data as Approver[]);
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    loadRepair();
  }, [loadRepair]);

  const handleSubmit = async () => {
    if (!repair) return;
    setIsSubmitting(true);
    const response = await api.submitRepair(repair.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadRepair();
    }
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    if (!repair) return;
    setIsSubmitting(true);
    const response = await api.approveRepair(repair.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadRepair();
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!repair) return;
    setIsSubmitting(true);
    const response = await api.rejectRepair(repair.id, rejectComment);
    if (response.error) {
      setError(response.error);
    } else {
      setShowRejectModal(false);
      setRejectComment("");
      loadRepair();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!repair) return;
    if (!confirm("Are you sure you want to delete this repair?")) return;

    const response = await api.deleteRepair(repair.id);
    if (response.error) {
      setError(response.error);
    } else {
      history.push("/repairs");
    }
  };

  const handleComplete = async () => {
    if (!repair) return;
    setIsSubmitting(true);
    const response = await api.completeRepair(repair.id);
    if (response.error) {
      setError(response.error);
    } else {
      loadRepair();
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const canApprove =
    repair?.status === "pending" &&
    user?.is_approver &&
    approvers.some((a) => a.user_id === user?.id);
  const canSubmit =
    (repair?.status === "draft" || repair?.status === "rejected") &&
    repair?.requested_by_id === user?.id;
  const canEdit =
    (repair?.status === "draft" || repair?.status === "rejected") &&
    repair?.requested_by_id === user?.id;
  const canDelete =
    repair?.status === "draft" &&
    (repair?.requested_by_id === user?.id || user?.is_admin);
  const canComplete = user?.is_technician && repair?.status === "approved";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="loading">Loading repair...</div>
      </AppLayout>
    );
  }

  if (!repair) {
    return (
      <AppLayout>
        <div className="card">
          <p>Repair not found.</p>
          <button
            className="btn btn--secondary"
            onClick={() => history.push("/repairs")}
          >
            Back to Repairs
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
              <h1 className="card__title">{repair.repair_number}</h1>
              <span
                className={getStatusBadgeClass(repair.status)}
                style={{ marginTop: "0.5rem", display: "inline-block" }}
              >
                {repair.status.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {canEdit && (
                <button
                  className="btn btn--secondary"
                  onClick={() => history.push(`/repair/${repair.id}/edit`)}
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
                Unit
              </h3>
              <p style={{ fontSize: "1rem" }}>
                {repair.unit?.unit_number || "-"}
                {repair.unit?.description && (
                  <span style={{ color: "#6b7280" }}>
                    {" "}
                    - {repair.unit.description}
                  </span>
                )}
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
                Requested By
              </h3>
              <p style={{ fontSize: "1rem" }}>
                {repair.requested_by?.full_name || "-"}
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
              <p style={{ fontSize: "1rem" }}>
                {formatDate(repair.created_at)}
              </p>
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
            <p style={{ fontSize: "1rem" }}>{repair.description}</p>
          </div>

          {repair.notes && (
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
              <p style={{ fontSize: "1rem" }}>{repair.notes}</p>
            </div>
          )}

          <div className="line-items-section">
            <h3 className="line-items-section__title">Repair Items</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {repair.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: "#f9fafb",
                    borderRadius: "0.375rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "500",
                      color: "#6b7280",
                      minWidth: "24px",
                    }}
                  >
                    {item.line_number}.
                  </span>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>

          {repair.status === "pending" && approvers.length > 0 && (
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

          {repair.status === "approved" && (
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
                By {repair.approved_by?.full_name} on{" "}
                {formatDate(repair.approved_at)}
              </p>
            </div>
          )}

          {repair.status === "completed" && (
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
                Completed
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#0284c7" }}>
                By {repair.completed_by?.full_name} on{" "}
                {formatDate(repair.completed_at)}
              </p>
              {repair.approved_by && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "0.25rem",
                  }}
                >
                  Originally approved by {repair.approved_by.full_name}
                </p>
              )}
            </div>
          )}

          {repair.status === "rejected" && (
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
                By {repair.rejected_by?.full_name} on{" "}
                {formatDate(repair.rejected_at)}
              </p>
              {repair.rejection_comment && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#7f1d1d",
                    marginTop: "0.5rem",
                  }}
                >
                  Reason: {repair.rejection_comment}
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
              onClick={() => history.push("/repairs")}
            >
              Back
            </button>

            {canSubmit && (
              <button
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {repair?.status === "rejected"
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

            {canComplete && (
              <button
                className="btn btn--primary"
                onClick={handleComplete}
                disabled={isSubmitting}
              >
                Mark as Completed
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
              <h2 className="modal__title">Reject Repair</h2>
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
                placeholder="Explain why this repair request is being rejected..."
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
                {isSubmitting ? "Rejecting..." : "Reject Repair"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default RepairDetailPage;
