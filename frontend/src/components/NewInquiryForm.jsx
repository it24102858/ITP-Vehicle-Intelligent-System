import { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

function NewInquiryForm({ onInquiryCreated, currentUser = null }) {
  const [vehicleId, setVehicleId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Initialize buyer phone from current user
  useEffect(() => {
    if (currentUser?.phone) {
      setBuyerPhone(currentUser.phone);
    }
  }, [currentUser?.phone]);

  // Fetch sellers on component mount
  useEffect(() => {
    const fetchSellers = async () => {
      setLoadingSellers(true);
      try {
        const res = await fetch(`${API_BASE}/auth/users`);
        if (!res.ok) throw new Error("Failed to load sellers");
        const data = await res.json();
        // Filter only sellers
        const sellersList = data.filter((user) => user.role === "seller");
        setSellers(sellersList);
      } catch (err) {
        console.error("Error fetching sellers:", err);
      } finally {
        setLoadingSellers(false);
      }
    };
    fetchSellers();
  }, []);

  const handleSellerChange = (e) => {
    const selectedId = e.target.value;
    setSellerId(selectedId);
    // Find the seller and set their name
    const selected = sellers.find((s) => s._id === selectedId);
    if (selected) {
      setSellerName(selected.name);
    }
  };

  const validateForm = () => {
    const errors = {};
    const vehicleIdPattern = /^[A-Za-z]{2,3}\d{4}$/;
    const phonePattern = /^\d{10}$/;

    if (!vehicleId.trim()) {
      errors.vehicleId = "Vehicle ID is required.";
    } else if (!vehicleIdPattern.test(vehicleId.trim())) {
      errors.vehicleId =
        "Vehicle ID must be 2 or 3 letters followed by 4 digits, e.g. AB1234 or ABC1234.";
    }

    if (!buyerPhone.trim()) {
      errors.buyerPhone = "Phone number is required.";
    } else if (!phonePattern.test(buyerPhone.trim())) {
      errors.buyerPhone = "Phone number must contain exactly 10 digits.";
    }

    if (!sellerId.trim()) {
      errors.sellerId = "Seller selection is required.";
    }

    if (!subject.trim()) {
      errors.subject = "Subject is required.";
    }

    if (!message.trim()) {
      errors.message = "Message is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const buyerId = String(currentUser?.id || currentUser?._id || "").trim();
    if (!currentUser || !buyerId || !currentUser.name) {
      setError("User information is missing. Please log in again.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicleId.trim(),
          buyer_id: buyerId,
          buyer_name: currentUser.name.trim(),
          buyer_phone: buyerPhone.trim(),
          seller_id: sellerId.trim(),
          seller_name: sellerName.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create inquiry.");
      setVehicleId("");
      setSellerId("");
      setSellerName("");
      setBuyerPhone(currentUser.phone || "");
      setSubject("");
      setMessage("");
      setFieldErrors({});
      setSuccess("✅ Inquiry submitted successfully!");
      onInquiryCreated();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        New Inquiry
      </h3>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            color: "#065f46",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {success}
        </div>
      )}

      {/* Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "block",
              marginBottom: 6,
            }}
          >
            VEHICLE ID
          </label>
          <input
            type="text"
            placeholder="e.g. AB1234 or ABC1234"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Format: 2 or 3 letters + 4 digits (e.g. AB1234 or ABC1234)
          </div>
          {fieldErrors.vehicleId && (
            <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
              {fieldErrors.vehicleId}
            </div>
          )}
        </div>
      </div>

      {/* Buyer Info Display */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "block",
              marginBottom: 6,
            }}
          >
            BUYER NAME
          </label>
          <div
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#f8fafc",
              color: "#475569",
            }}
          >
            {currentUser?.name || "Not logged in"}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            From your account
          </div>
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "block",
              marginBottom: 6,
            }}
          >
            BUYER PHONE
          </label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 5551234567"
            value={buyerPhone}
            onChange={(e) => setBuyerPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
          {fieldErrors.buyerPhone && (
            <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
              {fieldErrors.buyerPhone}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "block",
              marginBottom: 6,
            }}
          >
            SELECT SELLER *
          </label>
          <select
            value={sellerId}
            onChange={handleSellerChange}
            disabled={loadingSellers}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              fontFamily: "Inter, sans-serif",
              backgroundColor: "#fff",
              cursor: loadingSellers ? "not-allowed" : "pointer",
              opacity: loadingSellers ? 0.6 : 1,
            }}
          >
            <option value="">
              {loadingSellers ? "Loading sellers..." : "-- Choose a seller --"}
            </option>
            {sellers.map((seller) => (
              <option key={seller._id} value={seller._id}>
                {seller.name} ({seller.email})
              </option>
            ))}
          </select>
          {fieldErrors.sellerId && (
            <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
              {fieldErrors.sellerId}
            </div>
          )}
        </div>
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "block",
              marginBottom: 6,
            }}
          >
            SUBJECT
          </label>
          <input
            type="text"
            placeholder="e.g. Is this car available?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 14,
              outline: "none",
              fontFamily: "Inter, sans-serif",
            }}
          />
          {fieldErrors.subject && (
            <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
              {fieldErrors.subject}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#475569",
            display: "block",
            marginBottom: 6,
          }}
        >
          MESSAGE
        </label>
        <textarea
          rows={3}
          placeholder="Write your inquiry message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 14,
            outline: "none",
            fontFamily: "Inter, sans-serif",
            resize: "vertical",
          }}
        />
        {fieldErrors.message && (
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>
            {fieldErrors.message}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Submitting..." : "Submit Inquiry"}
      </button>
    </div>
  );
}

export default NewInquiryForm;
