import { useState, useEffect } from "react";
import Login from "./components/Login";
import Signup from "./components/Signup";
import MainPage from "./components/MainPage";
import BuyerDashboard from "./components/BuyerDashboard";
import SellerDashboard from "./components/SellerDashboard";
import UserManagement from "./components/UserManagement";

export default function App() {
  const [view, setView] = useState("login");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Route based on role
        if (userData.role === "seller") {
          setView("seller");
        } else if (userData.role === "buyer") {
          setView("buyer");
        } else if (userData.role === "admin") {
          setView("users");
        } else {
          setView("main");
        }
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setView("login");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Route based on role
    if (userData.role === "seller") {
      setView("seller");
    } else if (userData.role === "buyer") {
      setView("buyer");
    } else if (userData.role === "admin") {
      setView("users");
    } else {
      setView("main");
    }
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    // Route based on role
    if (userData.role === "seller") {
      setView("seller");
    } else if (userData.role === "buyer") {
      setView("buyer");
    } else if (userData.role === "admin") {
      setView("users");
    } else {
      setView("main");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setView("login");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ fontSize: 18, color: "#64748b" }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {view === "login" && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSignupClick={() => setView("signup")}
        />
      )}
      {view === "signup" && (
        <Signup
          onSignupSuccess={handleSignupSuccess}
          onLoginClick={() => setView("login")}
        />
      )}
      {view === "main" && <MainPage onSelect={setView} />}
      {view === "buyer" && (
        <BuyerDashboard onBack={() => handleLogout()} user={user} />
      )}
      {view === "seller" && (
        <SellerDashboard onBack={() => handleLogout()} user={user} />
      )}
      {view === "users" && <UserManagement onBack={() => handleLogout()} />}
    </>
  );
}
