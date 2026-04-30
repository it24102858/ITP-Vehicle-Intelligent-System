import { useState } from "react";
import InquiryList from "./InquiryList";
import SellerReplyPanel from "./SellerReplyPanel";
import InquiryDetails from "./InquiryDetails";
import NotificationPanel from "./NotificationPanel";

function SellerDashboard({ onBack, user }) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const handleInquirySelected = (inquiry) => {
    setSelectedInquiry(inquiry);
  };

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
        background: "#ffffff",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "1px solid #dc2626",
              color: "#dc2626",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s",
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#dc2626";
            }}
          >
            Logout
          </button>
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 12,
                borderLeft: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#764ba2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}
                >
                  {user.name}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            Seller Dashboard
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
            Manage inquiries and reply to customers
          </p>
        </div>
        <NotificationPanel userId={user?.id || user?._id || "seller001"} />
      </div>

      {/* Content Area */}
      <div style={{ padding: "24px" }}>
        {/* Banner Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            borderRadius: "12px",
            padding: "32px 40px",
            marginBottom: "32px",
            color: "white",
          }}
        >
          <h3
            style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}
          >
            Welcome to Seller Dashboard 🏪
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "14px",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Manage all buyer inquiries, respond to messages instantly, and build
            strong customer relationships. Your efficiency is our priority.
          </p>
          <div style={{ display: "flex", gap: "40px", marginTop: "24px" }}>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#e9d5ff",
                  marginBottom: "4px",
                }}
              >
                Instant
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                Quick Responses
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#e9d5ff",
                  marginBottom: "4px",
                }}
              >
                Organized
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                Inquiry Management
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#e9d5ff",
                  marginBottom: "4px",
                }}
              >
                Secure
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                Protected Data
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 260px",
            gap: "20px",
            height: "calc(100vh - 280px)",
          }}
        >
          {/* Inquiries List Panel */}
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <InquiryList
              selectedInquiry={selectedInquiry}
              setSelectedInquiry={handleInquirySelected}
              hideDelete
              userId={user?.id || user?._id || "seller001"}
              userRole="seller"
            />
          </div>

          {/* Reply Panel */}
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SellerReplyPanel
              selectedInquiry={selectedInquiry}
              userId={user?.id || user?._id || "seller001"}
            />
          </div>

          {/* Details Panel */}
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <InquiryDetails
              selectedInquiry={selectedInquiry}
              hideBuyerPrivateInfo
              hideInquiryActions
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;
