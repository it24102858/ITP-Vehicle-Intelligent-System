import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import MarketplacePage from "./pages/MarketplacePage";
import AdminDashboard from "./pages/AdminDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import UserDashboard from "./pages/UserDashboard";
import Dashboard from "./pages/admin/Dashboard";
import AllDeliveries from "./pages/admin/AllDeliveries";
import ManageDelivery from "./pages/admin/ManageDelivery";
import MyDeliveries from "./pages/client/MyDeliveries";
import NewDelivery from "./pages/client/NewDelivery";
import TrackDelivery from "./pages/client/TrackDelivery";

function routeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "delivery_management") return "/admin/dashboard";
  if (["service_provider", "insurance"].includes(role)) return "/provider-dashboard";
  if (role === "buyer") return "/marketplace";
  if (role === "seller") return "/marketplace";
  return "/login";
}

function ProtectedRoute({ children, allowedRoles, fallback = "/login" }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to={fallback} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={routeForRole(user.role)} replace />;
  }

  return children;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute allowedRoles={["buyer", "seller"]}>
            <MarketplacePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/provider-dashboard"
        element={
          <ProtectedRoute allowedRoles={["service_provider", "insurance"]}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-services"
        element={
          <ProtectedRoute allowedRoles={["buyer"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/my-deliveries"
        element={
          <ProtectedRoute allowedRoles={["buyer", "seller", "admin", "delivery_management"]}>
            <>
              <Navbar />
              <MyDeliveries />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/new"
        element={
          <ProtectedRoute allowedRoles={["buyer", "seller", "admin", "delivery_management"]}>
            <>
              <Navbar />
              <NewDelivery />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/track/:id"
        element={
          <ProtectedRoute allowedRoles={["buyer", "seller", "admin", "delivery_management"]}>
            <>
              <Navbar />
              <TrackDelivery />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "delivery_management"]}>
            <>
              <Navbar />
              <Dashboard />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/deliveries"
        element={
          <ProtectedRoute allowedRoles={["admin", "delivery_management"]}>
            <>
              <Navbar />
              <AllDeliveries />
            </>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/deliveries/:id"
        element={
          <ProtectedRoute allowedRoles={["admin", "delivery_management"]}>
            <>
              <Navbar />
              <ManageDelivery />
            </>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span>{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}

function AppShell() {
  const { theme } = useTheme();
  return (
    <AuthProvider>
      <Router>
        <ThemeToggle />
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          theme={theme}
          toastStyle={{
            background: theme === "dark" ? "#16161c" : "#f4f5fa",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)"
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
