import { useState, useEffect, useCallback, useRef } from "react";

export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface TableFeaturesConfig {
  defaultSort?: SortConfig;
  debounceMs?: number;
}

export interface TableFeaturesReturn<T> {
  // Data
  data: T[];
  isLoading: boolean;

  // Search
  search: string;
  setSearch: (value: string) => void;

  // Filters
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;

  // Sorting
  sort: SortConfig;
  setSort: (column: string) => void;

  // Pagination
  pagination: PaginationInfo;
  setPage: (page: number) => void;

  // Refresh
  refresh: () => void;

  // Build query params (for API calls)
  buildQueryParams: () => URLSearchParams;
}

export function useTableFeatures<T>(
  fetchFn: (params: URLSearchParams) => Promise<{
    data?: {
      data: T[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
    error?: string;
  }>,
  config: TableFeaturesConfig = {}
): TableFeaturesReturn<T> {
  const { defaultSort = { column: "", direction: "asc" }, debounceMs = 300 } =
    config;

  // State - always initialize data as empty array
  const [data, setDataInternal] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wrapper to ensure data is always an array
  const setData = useCallback((newData: T[]) => {
    if (Array.isArray(newData)) {
      setDataInternal(newData);
    } else {
      console.error("Attempted to set non-array data: ", newData);
      setDataInternal([]);
    }
  }, []);
  const [search, setSearchInternal] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSortState] = useState<SortConfig>(defaultSort);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 1,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  const setSearch = useCallback(
    (value: string) => {
      setSearchInternal(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, debounceMs);
    },
    [debounceMs]
  );

  // Set filter
  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value === "") {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
      return newFilters;
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Toggle sort
  const setSort = useCallback(
    (column: string) => {
      setSortState((prev) => {
        if (prev.column === column) {
          return {
            column,
            direction: prev.direction === "asc" ? "desc" : "asc",
          };
        }
        return { column, direction: "asc" };
      });
    },
    []
  );

  // Set page
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    if (sort.column) {
      params.set("sort_by", sort.column);
      params.set("sort_dir", sort.direction);
    }

    params.set("page", String(pagination.page));

    return params;
  }, [debouncedSearch, filters, sort, pagination.page]);

  // Fetch data - using ref to always have latest fetchFn
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Build params inline to avoid stale closure issues
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    if (sort.column) {
      params.set("sort_by", sort.column);
      params.set("sort_dir", sort.direction);
    }
    params.set("page", String(pagination.page));

    try {
      const response = await fetchFnRef.current(params);

      if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
        setPagination((prev) => ({
          ...prev,
          page: response.data!.page ?? 1,
          perPage: response.data!.per_page ?? 10,
          total: response.data!.total ?? 0,
          totalPages: response.data!.total_pages ?? 1,
        }));
      } else if (response.error) {
        console.error("API error: ", response.error);
        setData([]);
      } else {
        console.error("Unexpected API response format: ", response);
        setData([]);
      }
    } catch (error) {
      console.error("Fetch error: ", error);
      setData([]);
    }

    setIsLoading(false);
  }, [debouncedSearch, filters, sort, pagination.page]);

  // Refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Ensure data is always an array when returned
  const safeData = Array.isArray(data) ? data : [];

  return {
    data: safeData,
    isLoading,
    search,
    setSearch,
    filters,
    setFilter,
    clearFilters,
    sort,
    setSort,
    pagination,
    setPage,
    refresh,
    buildQueryParams,
  };
}
