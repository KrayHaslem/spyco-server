const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "An error occurred" };
    }

    return { data };
  } catch (error) {
    console.error("API call error: ", error);
    return { error: "Network error" };
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => apiCall("/auth/logout", { method: "POST" }),

  checkLogin: () => apiCall("/auth/check-login"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),

  // Orders
  getOrders: () => apiCall("/order/"),
  getAllOrders: (params?: {
    status?: string;
    owner_id?: string;
    vendor_id?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.owner_id) searchParams.set("owner_id", params.owner_id);
    if (params?.vendor_id) searchParams.set("vendor_id", params.vendor_id);
    const queryString = searchParams.toString();
    return apiCall(`/order/all${queryString ? `?${queryString}` : ""}`);
  },
  getOrder: (id: string) => apiCall(`/order/${id}`),
  createOrder: (data: unknown) =>
    apiCall("/order/", { method: "POST", body: JSON.stringify(data) }),
  updateOrder: (id: string, data: unknown) =>
    apiCall(`/order/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOrder: (id: string) => apiCall(`/order/${id}`, { method: "DELETE" }),
  submitOrder: (id: string) =>
    apiCall(`/order/${id}/submit`, { method: "POST" }),
  approveOrder: (id: string) =>
    apiCall(`/order/${id}/approve`, { method: "POST" }),
  rejectOrder: (id: string, comment?: string) =>
    apiCall(`/order/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  getOrderApprovers: (id: string) => apiCall(`/order/${id}/approvers`),
  adminUpdateOrderItems: (
    id: string,
    items: {
      description: string;
      quantity?: number | null;
      unit_cost?: number | null;
    }[]
  ) =>
    apiCall(`/order/${id}/admin-items`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  markOrderPaid: (id: string) =>
    apiCall(`/order/${id}/mark-paid`, { method: "POST" }),

  // Repairs
  getRepairs: () => apiCall("/repair/"),
  getAllRepairs: (params?: {
    status?: string;
    owner_id?: string;
    unit_id?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.owner_id) searchParams.set("owner_id", params.owner_id);
    if (params?.unit_id) searchParams.set("unit_id", params.unit_id);
    const queryString = searchParams.toString();
    return apiCall(`/repair/all${queryString ? `?${queryString}` : ""}`);
  },
  getRepair: (id: string) => apiCall(`/repair/${id}`),
  createRepair: (data: unknown) =>
    apiCall("/repair/", { method: "POST", body: JSON.stringify(data) }),
  updateRepair: (id: string, data: unknown) =>
    apiCall(`/repair/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRepair: (id: string) => apiCall(`/repair/${id}`, { method: "DELETE" }),
  submitRepair: (id: string) =>
    apiCall(`/repair/${id}/submit`, { method: "POST" }),
  approveRepair: (id: string) =>
    apiCall(`/repair/${id}/approve`, { method: "POST" }),
  rejectRepair: (id: string, comment?: string) =>
    apiCall(`/repair/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  getRepairApprovers: (id: string) => apiCall(`/repair/${id}/approvers`),
  completeRepair: (id: string) =>
    apiCall(`/repair/${id}/complete`, { method: "POST" }),

  // PO Groups
  getPOGroups: () => apiCall("/po-group/"),
  getPOGroup: (id: string) => apiCall(`/po-group/${id}`),
  createPOGroup: (poNumber: string) =>
    apiCall("/po-group/", {
      method: "POST",
      body: JSON.stringify({ po_number: poNumber }),
    }),
  updatePOGroup: (id: string, poNumber: string) =>
    apiCall(`/po-group/${id}`, {
      method: "PUT",
      body: JSON.stringify({ po_number: poNumber }),
    }),
  deletePOGroup: (id: string) =>
    apiCall(`/po-group/${id}`, { method: "DELETE" }),
  addOrdersToPOGroup: (poGroupId: string, orderIds: string[]) =>
    apiCall(`/po-group/${poGroupId}/orders`, {
      method: "POST",
      body: JSON.stringify({ order_ids: orderIds }),
    }),
  removeOrderFromPOGroup: (poGroupId: string, orderId: string) =>
    apiCall(`/po-group/${poGroupId}/orders/${orderId}`, { method: "DELETE" }),
  getAvailableOrdersForPOGroup: () => apiCall("/po-group/available-orders"),

  // Lookup
  searchVendors: (query: string) =>
    apiCall(`/lookup/vendors/search?q=${encodeURIComponent(query)}`),
  createVendorQuick: (name: string, contactInfo?: string) =>
    apiCall("/lookup/vendors", {
      method: "POST",
      body: JSON.stringify({ name, contact_info: contactInfo }),
    }),
  searchUnits: (query: string) =>
    apiCall(`/lookup/units/search?q=${encodeURIComponent(query)}`),
  createUnitQuick: (
    unitNumber: string,
    description?: string,
    unitType?: string,
    departmentId?: string
  ) =>
    apiCall("/lookup/units", {
      method: "POST",
      body: JSON.stringify({
        unit_number: unitNumber,
        description,
        unit_type: unitType,
        department_id: departmentId,
      }),
    }),
  getDepartments: () => apiCall("/lookup/departments"),

  // Admin
  admin: {
    // Departments
    getDepartments: () => apiCall("/admin/departments"),
    getDepartment: (id: string) => apiCall(`/admin/departments/${id}`),
    createDepartment: (data: unknown) =>
      apiCall("/admin/departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateDepartment: (id: string, data: unknown) =>
      apiCall(`/admin/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteDepartment: (id: string) =>
      apiCall(`/admin/departments/${id}`, { method: "DELETE" }),

    // Users
    getUsers: () => apiCall("/admin/users"),
    getUser: (id: string) => apiCall(`/admin/users/${id}`),
    createUser: (data: unknown) =>
      apiCall("/admin/users", { method: "POST", body: JSON.stringify(data) }),
    updateUser: (id: string, data: unknown) =>
      apiCall(`/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteUser: (id: string) =>
      apiCall(`/admin/users/${id}`, { method: "DELETE" }),

    // Vendors
    getVendors: () => apiCall("/admin/vendors"),
    getVendor: (id: string) => apiCall(`/admin/vendors/${id}`),
    createVendor: (data: unknown) =>
      apiCall("/admin/vendors", { method: "POST", body: JSON.stringify(data) }),
    updateVendor: (id: string, data: unknown) =>
      apiCall(`/admin/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteVendor: (id: string) =>
      apiCall(`/admin/vendors/${id}`, { method: "DELETE" }),

    // Units
    getUnits: () => apiCall("/admin/units"),
    getUnit: (id: string) => apiCall(`/admin/units/${id}`),
    getUnitTypes: () => apiCall("/admin/unit-types"),
    createUnit: (data: unknown) =>
      apiCall("/admin/units", { method: "POST", body: JSON.stringify(data) }),
    updateUnit: (id: string, data: unknown) =>
      apiCall(`/admin/units/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteUnit: (id: string) =>
      apiCall(`/admin/units/${id}`, { method: "DELETE" }),

    // Approvers
    getApprovers: () => apiCall("/admin/approvers"),
    getApprover: (id: string) => apiCall(`/admin/approvers/${id}`),
    createApprover: (data: unknown) =>
      apiCall("/admin/approvers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateApprover: (id: string, data: unknown) =>
      apiCall(`/admin/approvers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteApprover: (id: string) =>
      apiCall(`/admin/approvers/${id}`, { method: "DELETE" }),

    // Technicians
    getTechnicians: () => apiCall("/admin/technicians"),
    getTechnician: (id: string) => apiCall(`/admin/technicians/${id}`),
    createTechnician: (data: unknown) =>
      apiCall("/admin/technicians", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateTechnician: (id: string, data: unknown) =>
      apiCall(`/admin/technicians/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteTechnician: (id: string) =>
      apiCall(`/admin/technicians/${id}`, { method: "DELETE" }),
  },
};
