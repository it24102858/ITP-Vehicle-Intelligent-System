import { useState } from "react";
import InquiryList from "./InquiryList";
import InquiryChat from "./InquiryChat";
import InquiryDetails from "./InquiryDetails";
import NewInquiryForm from "./NewInquiryForm";
import SellerReplyPanel from "./SellerReplyPanel";

function InquiryDashboard({
  showSellerReply = true,
  userId = "user001",
  userRole = "buyer",
  currentUser = null,
}) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState("buyer");

  
  const handleInquiryCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShowNewForm(false);
  };

  const handleInquiryUpdated = (updatedInquiry) => {
    setSelectedInquiry(updatedInquiry);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={{ padding: "0", fontFamily: "Inter, sans-serif" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb, #1e3a8a)",
          borderRadius: "0",
          padding: "32px 32px",
          marginBottom: "0",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "4px" }}>
          Inquiry & Communication 💬
        </h2>
        <p
          style={{
            color: "#cbd5e1",
            fontSize: "14px",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Send and manage inquiries about vehicles. Chat directly with sellers.
        </p>
        <div style={{ display: "flex", gap: "40px", marginTop: "20px" }}>
          <div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#93c5fd" }}
            >
              Live
            </div>
            <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
              Real-time Chat
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#93c5fd" }}
            >
              Safe
            </div>
            <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
              Secure Messaging
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "20px", fontWeight: 700, color: "#93c5fd" }}
            >
              Fast
            </div>
            <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
              Quick Replies
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: "24px" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: 8 }}>
              Inquiries
            </h3>
            {showSellerReply && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => setActiveTab("buyer")}
                  style={{
                    background: activeTab === "buyer" ? "#2563eb" : "#f8fafc",
                    color: activeTab === "buyer" ? "white" : "#475569",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Buyer Chat
                </button>
                <button
                  onClick={() => setActiveTab("seller")}
                  style={{
                    background: activeTab === "seller" ? "#2563eb" : "#f8fafc",
                    color: activeTab === "seller" ? "white" : "#475569",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  Seller Reply
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8";
              e.currentTarget.style.boxShadow =
                "0 4px 8px rgba(37, 99, 235, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.boxShadow =
                "0 2px 4px rgba(37, 99, 235, 0.2)";
            }}
          >
            {showNewForm ? "✕ Cancel" : "+ New Inquiry"}
          </button>
        </div>

        {/* New Inquiry Form */}
        {showNewForm && (
          <NewInquiryForm
            onInquiryCreated={handleInquiryCreated}
            userId={userId}
            currentUser={currentUser}
          />
        )}

        {/* 3 Panel Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 260px",
            gap: "16px",
            height: "calc(100vh - 280px)",
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <InquiryList
              selectedInquiry={selectedInquiry}
              setSelectedInquiry={setSelectedInquiry}
              refreshTrigger={refreshTrigger}
              userId={userId}
              userRole={userRole}
            />
          </div>
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            {!showSellerReply || activeTab === "buyer" ? (
              <InquiryChat selectedInquiry={selectedInquiry} userId={userId} />
            ) : (
              <SellerReplyPanel
                selectedInquiry={selectedInquiry}
                userId={userId}
              />
            )}
          </div>
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <InquiryDetails
              selectedInquiry={selectedInquiry}
              onInquiryUpdated={handleInquiryUpdated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default InquiryDashboard;
