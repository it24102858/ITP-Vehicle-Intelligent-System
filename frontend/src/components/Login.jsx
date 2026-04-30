import { useState } from "react";

function Login({ onLoginSuccess, onSignupClick }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Call callback with user data
      onLoginSuccess(data.user);
    } catch (err) {
      setError("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            💼
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              margin: "0 0 8px 0",
              color: "#0f172a",
            }}
          >
            Vehicle Inquiry Platform
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              margin: "0 0 16px 0",
            }}
          >
            Login to your account
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#f8fafc",
            padding: "32px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Email Field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#64748b",
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                padding: "12px",
                borderRadius: "8px",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "#94a3b8" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              !loading && (e.target.style.background = "#2563eb")
            }
            onMouseLeave={(e) =>
              !loading && (e.target.style.background = "#3b82f6")
            }
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Signup Link */}
          <div
            style={{
              textAlign: "center",
              marginTop: 16,
              fontSize: 14,
              color: "#64748b",
            }}
          >
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSignupClick}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
