import { useState, useEffect, useCallback } from "react";
import { Link, useHistory } from "react-router-dom";
import { api } from "../../../utils/api";
import type { POGroup } from "../../../types";

function POGroupsPage() {
  const history = useHistory();
  const [poGroups, setPOGroups] = useState<POGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPOGroups = useCallback(async () => {
    setIsLoading(true);
    const response = await api.getPOGroups();
    if (response.data) {
      setPOGroups(response.data as POGroup[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPOGroups();
  }, [loadPOGroups]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div>
      <div className="card">
        <div className="card__header">
          <h1 className="card__title">PO Groups</h1>
          <Link to="/admin/po-groups/new" className="btn btn--primary">
            Create PO Group
          </Link>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : poGroups.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No PO Groups yet</p>
            <p className="empty-state__description">
              Create a PO Group to organize approved orders under an accounting
              PO number.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Orders</th>
                <th>Total</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {poGroups.map((poGroup) => (
                <tr
                  key={poGroup.id}
                  onClick={() => history.push(`/admin/po-groups/${poGroup.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{poGroup.po_number}</strong>
                  </td>
                  <td>{poGroup.order_count}</td>
                  <td>{formatCurrency(poGroup.total)}</td>
                  <td>{formatDate(poGroup.created_at)}</td>
                  <td>
                    <Link
                      to={`/admin/po-groups/${poGroup.id}`}
                      className="btn btn--link btn--sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default POGroupsPage;
