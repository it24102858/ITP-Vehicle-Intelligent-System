function NotificationIcon({ unreadCount = 0, onClick, isOpen = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        background: isOpen ? "var(--accent-dim)" : "transparent",
        border: isOpen ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "8px",
        padding: "8px 10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        width: "42px",
        height: "42px",
        minWidth: "42px",
        color: "var(--text-primary)",
      }}
      
      title="Notifications"
      onMouseEnter={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = "var(--bg-elevated)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {/* Bell Icon SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "white",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            border: "2px solid var(--bg-card)",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationIcon;
