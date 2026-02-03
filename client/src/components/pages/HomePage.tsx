import { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../utils/api";
import type { Order } from "../../types";
import AppLayout from "../core/AppLayout";

function HomePage() {
  const { user } = useAuth();
  const history = useHistory();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    const response = await api.getOrders();
    if (response.data) {
      setOrders(response.data as Order[]);
    }
    setIsLoading(false);
  };

  const groupedOrders = {
    draft: orders.filter((order) => order.status === "draft"),
    pending: orders.filter((order) => order.status === "pending"),
    approved: orders.filter((order) => order.status === "approved"),
    paid: orders.filter((order) => order.status === "paid"),
    rejected: orders.filter((order) => order.status === "rejected"),
  };

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-badge--${status}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderOrderCard = (order: Order, showOrderedBy = false) => (
    <div
      key={order.id}
      className="order-card"
      onClick={() => history.push(`/order/${order.id}`)}
    >
      <div className="order-card__info">
        <span className="order-card__number">
          {order.order_number}
          {order.po_group && (
            <span className="order-card__po-group">
              PO: {order.po_group.po_number}
            </span>
          )}
        </span>
        <span className="order-card__description">{order.description}</span>
        <span className="order-card__meta">
          {order.vendor?.name} • {formatDate(order.created_at)}
          {showOrderedBy &&
            order.ordered_by &&
            ` • By ${order.ordered_by.full_name}`}
        </span>
      </div>
      <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
    </div>
  );

  return (
    <AppLayout>
      <div className="home-page">
        <div className="home-page__header">
          <h1>Orders</h1>
          <Link to="/order/new" className="btn btn--primary">
            New Order
          </Link>
        </div>

        {isLoading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No orders yet</p>
            <p className="empty-state__description">
              Create your first order to get started.
            </p>
          </div>
        ) : (
          <div className="home-page__sections">
            {user?.is_approver && groupedOrders.pending.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Pending Approval ({groupedOrders.pending.length})
                </h2>
                <div className="order-list">
                  {groupedOrders.pending.map((order) =>
                    renderOrderCard(order, true)
                  )}
                </div>
              </section>
            )}

            {groupedOrders.draft.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Drafts ({groupedOrders.draft.length})
                </h2>
                <div className="order-list">
                  {groupedOrders.draft.map((order) => renderOrderCard(order))}
                </div>
              </section>
            )}

            {groupedOrders.pending.filter(
              (order) => order.ordered_by_id === user?.id
            ).length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  My Pending (
                  {
                    groupedOrders.pending.filter(
                      (order) => order.ordered_by_id === user?.id
                    ).length
                  }
                  )
                </h2>
                <div className="order-list">
                  {groupedOrders.pending
                    .filter((order) => order.ordered_by_id === user?.id)
                    .map((order) => renderOrderCard(order))}
                </div>
              </section>
            )}

            {groupedOrders.approved.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Approved ({groupedOrders.approved.length})
                </h2>
                <div className="order-list">
                  {groupedOrders.approved
                    .slice(0, 10)
                    .map((order) => renderOrderCard(order))}
                </div>
              </section>
            )}

            {groupedOrders.paid.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Paid ({groupedOrders.paid.length})
                </h2>
                <div className="order-list">
                  {groupedOrders.paid
                    .slice(0, 10)
                    .map((order) => renderOrderCard(order))}
                </div>
              </section>
            )}

            {groupedOrders.rejected.length > 0 && (
              <section className="order-section">
                <h2 className="order-section__title">
                  Rejected ({groupedOrders.rejected.length})
                </h2>
                <div className="order-list">
                  {groupedOrders.rejected.map((order) =>
                    renderOrderCard(order)
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

export default HomePage;
