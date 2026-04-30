import { useEffect, useState, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

const statusStyles = {
  open: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
  pending: { bg: "rgba(245, 158, 11, 0.16)", color: "#f59e0b" },
  closed: { bg: "rgba(59, 130, 246, 0.16)", color: "#60a5fa" },
};

function Icon({ name, size = 14, color = "currentColor" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "inbox") {
    return (
      <svg {...common}>
        <path d="M3 12.5L6 5h12l3 7.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6.5z" />
        <path d="M3 13h5l2 3h4l2-3h5" />
      </svg>
    );
    
  }
  if (name === "vehicle") {
    return (
      <svg {...common}>
        <path d="M5 15l1.5-4h11L19 15" />
        <rect x="3" y="15" width="18" height="4" rx="1" />
        <circle cx="7.5" cy="18.5" r="1" />
        <circle cx="16.5" cy="18.5" r="1" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6l4 2" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M7 6l1 14h8l1-14" />
      </svg>
    );
  }
  return null;
}

function InquiryList({
  selectedInquiry,
  setSelectedInquiry,
  refreshTrigger,
  hideDelete,
  userId,
  userRole = "buyer",
}) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/inquiries`);
      if (!res.ok) throw new Error("Failed to load inquiries.");
      const data = await res.json();

      let filteredInquiries = data;
      if (userRole === "seller" && userId) {
        filteredInquiries = data.filter(
          (inq) => String(inq.seller_id) === String(userId),
        );
      } else if (userRole === "buyer" && userId) {
        filteredInquiries = data.filter(
          (inq) => String(inq.buyer_id) === String(userId),
        );
      }

      setInquiries(filteredInquiries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole, userId]);

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 15000);
    return () => clearInterval(interval);
  }, [fetchInquiries, refreshTrigger]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this inquiry?")) return;
    try {
      await fetch(`${API_BASE}/inquiries/${id}`, { method: "DELETE" });
      setInquiries((prev) => prev.filter((i) => i._id !== id));
      if (selectedInquiry?._id === id) setSelectedInquiry(null);
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(17,17,25,0.96) 0%, rgba(12,12,18,0.96) 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "#f8fafc",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="inbox" size={14} color="#f97316" />
          Inquiries
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{inquiries.length} total</span>
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: 10 }}>
        {loading && (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>
            Loading inquiries...
          </p>
        )}
        {error && (
          <p style={{ color: "#f87171", padding: 12, fontSize: 13 }}>{error}</p>
        )}
        {!loading && inquiries.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "50px 16px",
              color: "#94a3b8",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                margin: "0 auto 10px",
                display: "grid",
                placeItems: "center",
                background: "rgba(148, 163, 184, 0.12)",
              }}
            >
              <Icon name="inbox" size={22} color="#94a3b8" />
            </div>
            <p>No inquiries yet.</p>
          </div>
        )}

        {inquiries.map((inq) => {
          const active = selectedInquiry?._id === inq._id;
          const status = statusStyles[inq.status] || statusStyles.pending;
          return (
            <div
              key={inq._id}
              onClick={() => setSelectedInquiry(inq)}
              style={{
                padding: "12px 12px 10px",
                borderRadius: 12,
                cursor: "pointer",
                marginBottom: 8,
                border: active
                  ? "1px solid rgba(249,115,22,0.9)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: active
                  ? "linear-gradient(135deg, rgba(249,115,22,0.22) 0%, rgba(234,88,12,0.1) 100%)"
                  : "rgba(255,255,255,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#f8fafc",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inq.subject}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: status.bg,
                    color: status.color,
                    letterSpacing: "0.04em",
                  }}
                >
                  {inq.status || "pending"}
                </span>
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#cbd5e1",
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="vehicle" size={12} color="#94a3b8" />
                {inq.vehicle_id || "Vehicle unavailable"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#cbd5e1",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon name="user" size={12} color="#94a3b8" />
                {userRole === "seller"
                  ? inq.buyer_name || "Unknown buyer"
                  : inq.seller_name || "Unknown seller"}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="clock" size={11} color="#64748b" />
                  {new Date(inq.createdAt).toLocaleString()}
                </span>
                {!hideDelete && (
                  <button
                    onClick={(e) => handleDelete(inq._id, e)}
                    style={{
                      background: "rgba(239,68,68,0.16)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.4)",
                      borderRadius: 7,
                      padding: "2px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name="trash" size={11} color="#f87171" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InquiryList;
