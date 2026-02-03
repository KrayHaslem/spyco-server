export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  department_id: string | null;
  department?: Department | null;
  job_title: string | null;
  is_admin: boolean;
  is_approver: boolean;
  is_technician: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_info: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UnitType =
  | "vehicle"
  | "trailer"
  | "equipment"
  | "location"
  | "other";

export interface Unit {
  id: string;
  unit_number: string;
  description: string | null;
  unit_type: UnitType;
  department_id: string | null;
  department?: Department | null;
  is_active: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

export interface OrderItem {
  id: string;
  order_id: string;
  line_number: number;
  description: string;
  quantity: number | null;
  unit_cost: number | null;
  total: number | null;
  created_at: string;
  updated_at: string;
}

export interface POGroup {
  id: string;
  po_number: string;
  created_by_id: string | null;
  created_by?: User | null;
  order_count: number;
  total: number;
  orders?: Order[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  vendor_id: string;
  vendor?: Vendor | null;
  unit_id: string | null;
  unit?: Unit | null;
  po_group_id: string | null;
  po_group?: POGroup | null;
  description: string;
  status: OrderStatus;
  ordered_by_id: string;
  ordered_by?: User | null;
  approved_by_id: string | null;
  approved_by?: User | null;
  approved_at: string | null;
  rejected_by_id: string | null;
  rejected_by?: User | null;
  rejected_at: string | null;
  rejection_comment: string | null;
  notes: string | null;
  total: number;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Approver {
  id: string;
  user_id: string;
  user?: User;
  is_active: boolean;
  is_global_approver: boolean;
  departments?: Department[];
  department_ids?: string[];
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  vendor_id: string;
  unit_id: string;
  description: string;
  notes?: string | null;
  items: {
    description: string;
    quantity?: number | null;
    unit_cost?: number | null;
  }[];
}

export type RepairStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export interface RepairItem {
  id: string;
  repair_id: string;
  line_number: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  repair_number: string;
  unit_id: string;
  unit?: Unit | null;
  description: string;
  status: RepairStatus;
  requested_by_id: string;
  requested_by?: User | null;
  approved_by_id: string | null;
  approved_by?: User | null;
  approved_at: string | null;
  rejected_by_id: string | null;
  rejected_by?: User | null;
  rejected_at: string | null;
  rejection_comment: string | null;
  completed_by_id: string | null;
  completed_by?: User | null;
  completed_at: string | null;
  notes: string | null;
  items?: RepairItem[];
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  user_id: string;
  user?: User;
  is_active: boolean;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRepairData {
  unit_id: string;
  description: string;
  notes?: string | null;
  items: {
    description: string;
  }[];
}
