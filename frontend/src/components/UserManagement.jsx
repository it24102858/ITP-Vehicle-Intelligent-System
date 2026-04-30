import { useState, useEffect } from "react";

function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/users");
      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      setError("Error fetching users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/users/${userId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        setError("Failed to delete user");
        return;
      }

      setUsers(users.filter((u) => u._id !== userId));
      setDeleteConfirm(null);
    } catch (err) {
      setError("Error deleting user: " + err.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return { bg: "#ede9fe", text: "#7c3aed", label: "Admin" };
      case "seller":
        return { bg: "#dbeafe", text: "#0284c7", label: "Seller" };
      case "buyer":
        return { bg: "#dcfce7", text: "#16a34a", label: "Buyer" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: role };
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: "0 0 8px 0",
                color: "#0f172a",
              }}
            >
              User Management
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                margin: 0,
              }}
            >
              Manage all users in the system
            </p>
          </div>
          <button
            onClick={onBack}
            style={{
              padding: "10px 16px",
              background: "#e2e8f0",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            ← Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No users found
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f1f5f9",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Phone
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Joined
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleInfo = getRoleColor(user.role);
                    return (
                      <tr
                        key={user._id}
                        style={{
                          borderBottom: "1px solid #e2e8f0",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#0f172a",
                            fontWeight: 500,
                          }}
                        >
                          {user.name}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#64748b",
                          }}
                        >
                          {user.email}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#64748b",
                          }}
                        >
                          {user.phone}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              background: roleInfo.bg,
                              color: roleInfo.text,
                              padding: "4px 12px",
                              borderRadius: "16px",
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {roleInfo.label}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#64748b",
                          }}
                        >
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => setDeleteConfirm(user._id)}
                            style={{
                              padding: "6px 12px",
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.target.style.background = "#fecaca")
                            }
                            onMouseLeave={(e) =>
                              (e.target.style.background = "#fee2e2")
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "white",
                padding: "32px",
                borderRadius: "12px",
                maxWidth: "400px",
                width: "90%",
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: "0 0 8px 0",
                  color: "#0f172a",
                }}
              >
                Delete User?
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  margin: "0 0 24px 0",
                }}
              >
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                }}
              >
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#e2e8f0",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
