import { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../utils/api";
import type { Repair } from "../../types";
import AppLayout from "../core/AppLayout";

function RepairsHomePage() {
  const { user } = useAuth();
  const history = useHistory();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    setIsLoading(true);
    const response = await api.getRepairs();
    if (response.data) {
      setRepairs(response.data as Repair[]);
    }
    setIsLoading(false);
  };

  const groupedRepairs = {
    draft: repairs.filter((repair) => repair.status === "draft"),
    pending: repairs.filter((repair) => repair.status === "pending"),
    approved: repairs.filter((repair) => repair.status === "approved"),
    completed: repairs.filter((repair) => repair.status === "completed"),
    rejected: repairs.filter((repair) => repair.status === "rejected"),
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderRepairCard = (repair: Repair, showRequestedBy = false) => (
    <div
      key={repair.id}
      className="order-card"
      onClick={() => history.push(`/repair/${repair.id}`)}
    >
      <div className="order-card__info">
        <span className="order-card__number">{repair.repair_number}</span>
        <span className="order-card__description">{repair.description}</span>
        <span className="order-card__meta">
          Unit: {repair.unit?.unit_number} • {formatDate(repair.created_at)}
          {showRequestedBy &&
            repair.requested_by &&
            ` • By ${repair.requested_by.full_name}`}
        </span>
      </div>
      <span className={getStatusBadgeClass(repair.status)}>
        {repair.status}
      </span>
    </div>
  );

  return (
    <AppLayout>
      <div className="home-page">
        <div className="home-page__header">
          <h1>Repairs</h1>
          <Link to="/repair/new" className="btn btn--primary">
            New Repair
          </Link>
        </div>

        {isLoading ? (
          <div className="loading">Loading repairs...</div>
        ) : repairs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No repairs yet</p>
            <p className="empty-state__description">
              Create your first repair request to get started.
            </p>
          </div>
        ) : (
          <div className="home-page__sections">
            {user?.is_approver && groupedRepairs.pending.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Pending Approval ({groupedRepairs.pending.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.pending.map((repair) =>
                    renderRepairCard(repair, true)
                  )}
                </div>
              </section>
            )}

            {user?.is_technician && groupedRepairs.approved.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Ready for Completion ({groupedRepairs.approved.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.approved.map((repair) =>
                    renderRepairCard(repair, true)
                  )}
                </div>
              </section>
            )}

            {groupedRepairs.draft.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Drafts ({groupedRepairs.draft.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.draft.map((repair) =>
                    renderRepairCard(repair)
                  )}
                </div>
              </section>
            )}

            {groupedRepairs.pending.filter(
              (repair) => repair.requested_by_id === user?.id
            ).length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  My Pending (
                  {
                    groupedRepairs.pending.filter(
                      (repair) => repair.requested_by_id === user?.id
                    ).length
                  }
                  )
                </h2>
                <div className="order-list">
                  {groupedRepairs.pending
                    .filter((repair) => repair.requested_by_id === user?.id)
                    .map((repair) => renderRepairCard(repair))}
                </div>
              </section>
            )}

            {!user?.is_technician && groupedRepairs.approved.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Approved ({groupedRepairs.approved.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.approved
                    .slice(0, 10)
                    .map((repair) => renderRepairCard(repair))}
                </div>
              </section>
            )}

            {groupedRepairs.completed.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Completed ({groupedRepairs.completed.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.completed
                    .slice(0, 10)
                    .map((repair) => renderRepairCard(repair))}
                </div>
              </section>
            )}

            {groupedRepairs.rejected.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Rejected ({groupedRepairs.rejected.length})
                </h2>
                <div className="order-list">
                  {groupedRepairs.rejected.map((repair) =>
                    renderRepairCard(repair)
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default RepairsHomePage;
