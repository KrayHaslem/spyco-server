import { Switch, Route, Redirect } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/pages/LoginPage";
import HomePage from "./components/pages/HomePage";
import CreateOrderPage from "./components/pages/CreateOrder/CreateOrderPage";
import OrderDetailPage from "./components/pages/OrderDetailPage";
import AllOrdersPage from "./components/pages/AllOrdersPage";
import RepairsHomePage from "./components/pages/RepairsHomePage";
import CreateRepairPage from "./components/pages/CreateRepairPage";
import RepairDetailPage from "./components/pages/RepairDetailPage";
import AllRepairsPage from "./components/pages/AllRepairsPage";
import AdminLayout from "./components/pages/admin/AdminLayout";
import DepartmentsPage from "./components/pages/admin/DepartmentsPage";
import UsersPage from "./components/pages/admin/UsersPage";
import VendorsPage from "./components/pages/admin/VendorsPage";
import UnitsPage from "./components/pages/admin/UnitsPage";
import ApproversPage from "./components/pages/admin/ApproversPage";
import TechniciansPage from "./components/pages/admin/TechniciansPage";
import POGroupsPage from "./components/pages/admin/POGroupsPage";
import POGroupDetailPage from "./components/pages/admin/POGroupDetailPage";

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !user?.is_admin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <LoginPage />}
      </Route>

      <Route exact path="/">
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      </Route>

      <Route path="/order/new">
        <ProtectedRoute>
          <CreateOrderPage />
        </ProtectedRoute>
      </Route>

      <Route path="/order/:id/edit">
        <ProtectedRoute>
          <CreateOrderPage />
        </ProtectedRoute>
      </Route>

      <Route path="/order/:id">
        <ProtectedRoute>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>

      <Route path="/all-orders">
        <ProtectedRoute>
          <AllOrdersPage />
        </ProtectedRoute>
      </Route>

      <Route exact path="/repairs">
        <ProtectedRoute>
          <RepairsHomePage />
        </ProtectedRoute>
      </Route>

      <Route path="/repair/new">
        <ProtectedRoute>
          <CreateRepairPage />
        </ProtectedRoute>
      </Route>

      <Route path="/repair/:id/edit">
        <ProtectedRoute>
          <CreateRepairPage />
        </ProtectedRoute>
      </Route>

      <Route path="/repair/:id">
        <ProtectedRoute>
          <RepairDetailPage />
        </ProtectedRoute>
      </Route>

      <Route path="/all-repairs">
        <ProtectedRoute>
          <AllRepairsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute adminOnly>
          <AdminLayout>
            <Switch>
              <Route exact path="/admin">
                <Redirect to="/admin/users" />
              </Route>
              <Route path="/admin/departments">
                <DepartmentsPage />
              </Route>
              <Route path="/admin/users">
                <UsersPage />
              </Route>
              <Route path="/admin/vendors">
                <VendorsPage />
              </Route>
              <Route path="/admin/units">
                <UnitsPage />
              </Route>
              <Route path="/admin/approvers">
                <ApproversPage />
              </Route>
              <Route path="/admin/technicians">
                <TechniciansPage />
              </Route>
              <Route exact path="/admin/po-groups">
                <POGroupsPage />
              </Route>
              <Route path="/admin/po-groups/new">
                <POGroupDetailPage />
              </Route>
              <Route path="/admin/po-groups/:id">
                <POGroupDetailPage />
              </Route>
            </Switch>
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
