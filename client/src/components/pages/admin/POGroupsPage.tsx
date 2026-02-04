import { useCallback } from "react";
import { Link, useHistory } from "react-router-dom";
import { api } from "../../../utils/api";
import { useTableFeatures } from "../../../hooks/useTableFeatures";
import SearchInput from "../../core/SearchInput";
import SortableHeader from "../../core/SortableHeader";
import Pagination from "../../core/Pagination";
import type { POGroup, PaginatedResponse } from "../../../types";

function POGroupsPage() {
  const history = useHistory();

  const fetchPOGroups = useCallback(async (params: URLSearchParams) => {
    return api.getPOGroups(params) as Promise<{
      data?: PaginatedResponse<POGroup>;
      error?: string;
    }>;
  }, []);

  const {
    data: poGroups,
    isLoading,
    search,
    setSearch,
    sort,
    setSort,
    pagination,
    setPage,
  } = useTableFeatures<POGroup>(fetchPOGroups, {
    defaultSort: { column: "created_at", direction: "desc" },
  });

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

        <div className="table-controls">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search PO numbers..."
          />
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : poGroups.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No PO Groups found</p>
            <p className="empty-state__description">
              Create a PO Group to organize approved orders under an accounting
              PO number.
            </p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader
                    column="po_number"
                    label="PO Number"
                    sort={sort}
                    onSort={setSort}
                  />
                  <th>Orders</th>
                  <th>Total</th>
                  <SortableHeader
                    column="created_at"
                    label="Created"
                    sort={sort}
                    onSort={setSort}
                  />
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
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default POGroupsPage;
