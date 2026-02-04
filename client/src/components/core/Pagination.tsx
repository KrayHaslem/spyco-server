import type { PaginationInfo } from "../../hooks/useTableFeatures";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <span className="pagination__info">
        Page {page} of {totalPages} ({total} total)
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
