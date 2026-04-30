function MainPage({ onSelect }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
        }}
      >
        {/* Header Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 80,
          }}
        >
          {/* Hero Icon */}
          <div
            style={{
              fontSize: 80,
              marginBottom: 32,
              display: "inline-block",
            }}
          >
            💼
          </div>

          <h1
            style={{
              fontSize: 56,
              fontWeight: 800,
              margin: 0,
              color: "#0f172a",
              marginBottom: 16,
              letterSpacing: "-1px",
            }}
          >
            Vehicle Inquiry Platform
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#475569",
              marginTop: 0,
              marginBottom: 32,
              lineHeight: 1.8,
              maxWidth: 700,
              margin: "0 auto 32px",
            }}
          >
            Connect buyers and sellers seamlessly. Manage inquiries, reply to
            messages, and build lasting relationships through our intelligent
            communication platform.
          </p>

          {/* Feature highlights */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 48,
              marginTop: 40,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>⚡</span>
              <div>
                <div
                  style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}
                >
                  Instant Messaging
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  Real-time communication
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🔒</span>
              <div>
                <div
                  style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}
                >
                  Secure & Private
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  Protected conversations
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>📱</span>
              <div>
                <div
                  style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}
                >
                  Responsive Design
                </div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  Works everywhere
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 32,
          }}
        >
          {/* Buyer Card */}
          <button
            type="button"
            onClick={() => onSelect("buyer")}
            style={{
              background: "white",
              border: "2px solid #e2e8f0",
              borderRadius: 16,
              padding: "48px 40px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
              transform: "translateY(0)",
              outline: "none",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.borderColor = "#667eea";
              e.currentTarget.style.boxShadow =
                "0 12px 32px rgba(102, 126, 234, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(0, 0, 0, 0.08)";
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: 52,
                marginBottom: 20,
                display: "inline-block",
              }}
            >
              👤
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 12px 0",
              }}
            >
              Buyer Portal
            </h3>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 13,
                color: "#667eea",
                fontWeight: 600,
                margin: "0 0 16px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              For Customers
            </p>

            {/* Description */}
            <p
              style={{
                fontSize: 15,
                color: "#475569",
                lineHeight: 1.8,
                margin: 0,
                marginBottom: 28,
              }}
            >
              Create inquiries about vehicles, communicate directly with
              sellers, and track conversations in real-time. All your buyer
              interactions in one place.
            </p>

            {/* Features List */}
            <ul
              style={{
                margin: "0 0 24px 0",
                padding: 0,
                listStyle: "none",
                fontSize: 14,
              }}
            >
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#667eea", fontWeight: 700 }}>✓</span>
                Create new vehicle inquiries
              </li>
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#667eea", fontWeight: 700 }}>✓</span>
                Message sellers in real-time
              </li>
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#667eea", fontWeight: 700 }}>✓</span>
                Edit & delete your messages
              </li>
            </ul>

            {/* CTA */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "#667eea",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 20px",
                borderRadius: 8,
                background: "#f0f4ff",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#667eea";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f0f4ff";
                e.currentTarget.style.color = "#667eea";
              }}
            >
              <span>Get Started</span>
              <span style={{ fontSize: 16 }}>→</span>
            </div>
          </button>

          {/* Seller Card */}
          <button
            type="button"
            onClick={() => onSelect("seller")}
            style={{
              background: "white",
              border: "2px solid #e2e8f0",
              borderRadius: 16,
              padding: "48px 40px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
              transform: "translateY(0)",
              outline: "none",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.borderColor = "#764ba2";
              e.currentTarget.style.boxShadow =
                "0 12px 32px rgba(118, 75, 162, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(0, 0, 0, 0.08)";
            }}
          >
            {/* Icon */}
            <div
              style={{
                fontSize: 52,
                marginBottom: 20,
                display: "inline-block",
              }}
            >
              🏪
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 12px 0",
              }}
            >
              Seller Dashboard
            </h3>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 13,
                color: "#764ba2",
                fontWeight: 600,
                margin: "0 0 16px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              For Vendors
            </p>

            {/* Description */}
            <p
              style={{
                fontSize: 15,
                color: "#475569",
                lineHeight: 1.8,
                margin: 0,
                marginBottom: 28,
              }}
            >
              Manage all buyer inquiries efficiently, respond to messages
              instantly, and organize conversations by vehicle. Grow your
              business with ease.
            </p>

            {/* Features List */}
            <ul
              style={{
                margin: "0 0 24px 0",
                padding: 0,
                listStyle: "none",
                fontSize: 14,
              }}
            >
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#764ba2", fontWeight: 700 }}>✓</span>
                View all buyer inquiries
              </li>
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#764ba2", fontWeight: 700 }}>✓</span>
                Reply to customer messages
              </li>
              <li
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#764ba2", fontWeight: 700 }}>✓</span>
                Track inquiry details & status
              </li>
            </ul>

            {/* CTA */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                color: "#764ba2",
                fontWeight: 700,
                fontSize: 14,
                padding: "12px 20px",
                borderRadius: 8,
                background: "#faf8fd",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#764ba2";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#faf8fd";
                e.currentTarget.style.color = "#764ba2";
              }}
            >
              <span>Enter Dashboard</span>
              <span style={{ fontSize: 16 }}>→</span>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 40,
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>
            Secure platform • Trusted by thousands • Available 24/7
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
