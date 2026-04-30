import InquiryDashboard from "./InquiryDashboard";
import NotificationPanel from "./NotificationPanel";

function BuyerDashboard({ onBack, user }) {
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
                  background: "#667eea",
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
            Buyer Dashboard
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
            Create inquiries and chat with sellers
          </p>
        </div>
        <NotificationPanel userId={user?.id || user?._id || "user001"} />
      </div>

      {/* Content with enhanced styling */}
      <div style={{ padding: "24px" }}>
        <InquiryDashboard
          showSellerReply={false}
          userId={user?.id || user?._id || "user001"}
          userRole="buyer"
          currentUser={user}
        />
      </div>
    </div>
  );
}

export default BuyerDashboard;
