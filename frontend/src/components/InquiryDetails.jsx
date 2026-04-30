import { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

function Icon({ name, size = 14, color = "currentColor" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
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
  if (name === "message") {
    return (
      <svg {...common}>
        <path d="M7 18l-4 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7z" />
      </svg>
    );
  }
  if (name === "status") {
    return (
      <svg {...common}>
        <path d="M4 12h16" />
        <path d="M4 6h16" />
        <path d="M4 18h16" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  return null;
}

function InquiryDetails({
  selectedInquiry,
  onInquiryUpdated,
  hideBuyerPrivateInfo,
  hideInquiryActions,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (selectedInquiry) {
      setSubject(selectedInquiry.subject || "");
      setBuyerName(selectedInquiry.buyer_name || "");
      setBuyerPhone(selectedInquiry.buyer_phone || "");
      setError("");
      setIsEditing(false);
    }
  }, [selectedInquiry]);

  const handleSave = async () => {
    if (!selectedInquiry) return;
    setError("");
    if (
      !subject.trim() ||
      !buyerName.trim() ||
      !/^[0-9]{10}$/.test(buyerPhone)
    ) {
      setError(
        "Please provide subject, buyer name, and a valid 10-digit phone number.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/inquiries/${selectedInquiry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          buyer_name: buyerName.trim(),
          buyer_phone: buyerPhone.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update inquiry.");

      setIsEditing(false);
      if (onInquiryUpdated) onInquiryUpdated(data);
    } catch (err) {
      setError(err.message || "Error saving inquiry.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `${API_BASE}/inquiries/${selectedInquiry._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update status.");
      if (onInquiryUpdated) onInquiryUpdated(data);
    } catch (err) {
      setError(err.message || "Error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!selectedInquiry) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#94a3b8",
          textAlign: "center",
          padding: 24,
          background:
            "linear-gradient(180deg, rgba(17,17,25,0.96) 0%, rgba(12,12,18,0.96) 100%)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            marginBottom: 10,
            display: "grid",
            placeItems: "center",
            background: "rgba(148,163,184,0.14)",
          }}
        >
          <Icon name="file" size={22} color="#94a3b8" />
        </div>
        <p>No inquiry selected.</p>
      </div>
    );
  }

  const sectionTitle = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#94a3b8",
    marginBottom: 8,
    letterSpacing: "0.08em",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  return (
    <div
      style={{
        padding: 16,
        overflowY: "auto",
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(17,17,25,0.96) 0%, rgba(12,12,18,0.96) 100%)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#f8fafc",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="file" size={14} color="#f97316" />
          Inquiry Details
        </h3>
        {!hideInquiryActions && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: "rgba(249,115,22,0.18)",
              color: "#fb923c",
              border: "1px solid rgba(249,115,22,0.45)",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 14, color: "#f87171", fontSize: 12 }}>{error}</div>
      )}

      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={sectionTitle}>
          <Icon name="vehicle" size={12} color="#94a3b8" />
          Vehicle
        </div>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>
          <span style={{ fontWeight: 600, color: "#f8fafc" }}>ID: </span>
          {selectedInquiry.vehicle_id || "-"}
        </div>
      </div>

      {!hideBuyerPrivateInfo && (
        <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={sectionTitle}>
            <Icon name="user" size={12} color="#94a3b8" />
            Buyer
          </div>
          {isEditing ? (
            <>
              <label style={{ display: "block", marginBottom: 10, fontSize: 12, color: "#cbd5e1" }}>
                Name
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(15,23,42,0.6)",
                    color: "#f8fafc",
                  }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 10, fontSize: 12, color: "#cbd5e1" }}>
                Phone
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(15,23,42,0.6)",
                    color: "#f8fafc",
                  }}
                />
              </label>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#f8fafc" }}>Name: </span>
                {selectedInquiry.buyer_name || "-"}
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "#f8fafc" }}>Phone: </span>
                {selectedInquiry.buyer_phone || "-"}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={sectionTitle}>
          <Icon name="message" size={12} color="#94a3b8" />
          Subject
        </div>
        {isEditing ? (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(15,23,42,0.6)",
              color: "#f8fafc",
            }}
          />
        ) : (
          <div style={{ fontSize: 12, color: "#cbd5e1" }}>
            {selectedInquiry.subject || "-"}
          </div>
        )}
      </div>

      {isEditing && !hideInquiryActions && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setSubject(selectedInquiry.subject || "");
              setBuyerName(selectedInquiry.buyer_name || "");
              setBuyerPhone(selectedInquiry.buyer_phone || "");
              setError("");
            }}
            disabled={saving}
            style={{
              background: "rgba(15,23,42,0.4)",
              color: "#cbd5e1",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={sectionTitle}>
          <Icon name="status" size={12} color="#94a3b8" />
          Status
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 999,
              fontWeight: 700,
              background:
                selectedInquiry.status === "open"
                  ? "rgba(34,197,94,0.18)"
                  : "rgba(245,158,11,0.18)",
              color: selectedInquiry.status === "open" ? "#4ade80" : "#f59e0b",
              textTransform: "uppercase",
            }}
          >
            {selectedInquiry.status || "pending"}
          </span>
          {!hideInquiryActions && (
            <>
              <button
                onClick={() => handleStatusChange("open")}
                disabled={updatingStatus || selectedInquiry.status === "open"}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 7,
                  fontWeight: 700,
                  background: "rgba(34,197,94,0.16)",
                  color: "#4ade80",
                  border: "1px solid rgba(34,197,94,0.3)",
                  cursor:
                    selectedInquiry.status === "open" || updatingStatus
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    selectedInquiry.status === "open" || updatingStatus ? 0.6 : 1,
                }}
              >
                Open
              </button>
              <button
                onClick={() => handleStatusChange("pending")}
                disabled={updatingStatus || selectedInquiry.status === "pending"}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 7,
                  fontWeight: 700,
                  background: "rgba(245,158,11,0.16)",
                  color: "#fbbf24",
                  border: "1px solid rgba(245,158,11,0.3)",
                  cursor:
                    selectedInquiry.status === "pending" || updatingStatus
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    selectedInquiry.status === "pending" || updatingStatus
                      ? 0.6
                      : 1,
                }}
              >
                Pending
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <div style={sectionTitle}>
          <Icon name="clock" size={12} color="#94a3b8" />
          Created
        </div>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>
          {new Date(selectedInquiry.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default InquiryDetails;
