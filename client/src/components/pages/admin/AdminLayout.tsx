import { type ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <div className="admin-sidebar__header">
          <Link
            to="/"
            className="app-header__title"
            style={{ padding: "1rem 1.5rem", display: "block" }}
          >
            ← Home
          </Link>
        </div>
        <nav className="admin-nav">
          <NavLink
            to="/admin/users"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/po-groups"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            PO Groups
          </NavLink>
          <NavLink
            to="/admin/vendors"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Vendors
          </NavLink>
          <NavLink
            to="/admin/units"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Units
          </NavLink>
          <NavLink
            to="/admin/approvers"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Approvers
          </NavLink>
          <NavLink
            to="/admin/technicians"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Technicians
          </NavLink>
          <NavLink
            to="/admin/departments"
            className="admin-nav__item"
            activeClassName="admin-nav__item--active"
          >
            Departments
          </NavLink>
        </nav>
        <div
          style={{
            marginTop: "auto",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {user?.full_name}
          </span>
          <button
            onClick={logout}
            className="btn btn--link"
            style={{ display: "block", marginTop: "0.5rem" }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-layout__content">{children}</main>
    </div>
  );
}

export default AdminLayout;
