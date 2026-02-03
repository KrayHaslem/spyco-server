import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__links">
          <Link to="/" className="app-header__title" onClick={closeMenu}>
            Orders
          </Link>
          <Link to="/repairs" className="app-header__title" onClick={closeMenu}>
            Repairs
          </Link>
        </div>
        <button
          type="button"
          className="app-header__menu-trigger"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="app-header__nav"
        >
          <span className="app-header__menu-icon" />
        </button>
        <nav
          id="app-header__nav"
          className={`app-header__nav ${
            isMenuOpen ? "app-header__nav--open" : ""
          }`}
        >
          {(user?.is_admin || user?.is_approver) && (
            <Link
              to="/all-orders"
              className="btn btn--secondary btn--sm"
              onClick={closeMenu}
            >
              All Orders
            </Link>
          )}
          {(user?.is_admin || user?.is_approver || user?.is_technician) && (
            <Link
              to="/all-repairs"
              className="btn btn--secondary btn--sm"
              onClick={closeMenu}
            >
              All Repairs
            </Link>
          )}
          {user?.is_admin && (
            <Link
              to="/admin"
              className="btn btn--secondary btn--sm"
              onClick={closeMenu}
            >
              Admin
            </Link>
          )}
          <span className="app-header__user">{user?.full_name}</span>
          <button
            onClick={() => {
              closeMenu();
              logout();
            }}
            className="btn btn--link"
          >
            Logout
          </button>
        </nav>
        {isMenuOpen && (
          <button
            type="button"
            className="app-header__backdrop"
            onClick={closeMenu}
            aria-label="Close menu"
          />
        )}
      </header>
      <main className="app-content">{children}</main>
    </div>
  );
}

export default AppLayout;
