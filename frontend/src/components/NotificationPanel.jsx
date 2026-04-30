import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../services/api";
import NotificationIcon from "./NotificationIcon";

function NotificationPanel({ userId = "user001" }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationType = (notification) => {
    if (notification.message_id) {
      return { icon: "Message", label: "Message" };
    }
    return { icon: "Inquiry", label: "New Inquiry" };
  };
  

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const updated = await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? updated : n)),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <NotificationIcon
        unreadCount={unreadCount}
        onClick={() => setShowPanel(!showPanel)}
        isOpen={showPanel}
      />

      {showPanel && (
        <div
          style={{
            position: "absolute",
            right: "-10px",
            top: "50px",
            width: "380px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            maxHeight: "500px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
              Notifications ({notifications.length})
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#94a3b8",
              }}
            >
              x
            </button>
          </div>

          <div
            style={{
              flexGrow: 1,
              overflowY: "auto",
              maxHeight: "400px",
            }}
          >
            {loading ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 24px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                <p style={{ margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const notifType = getNotificationType(notification);
                return (
                  <div
                    key={notification._id}
                    onClick={() =>
                      !notification.is_read &&
                      handleMarkAsRead(notification._id)
                    }
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: notification.is_read ? "default" : "pointer",
                      background: notification.is_read ? "white" : "#f0f9ff",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!notification.is_read) {
                        e.currentTarget.style.background = "#e0f2fe";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notification.is_read) {
                        e.currentTarget.style.background = "#f0f9ff";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "8px",
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: notification.is_read ? 400 : 600,
                            color: "#0f172a",
                            marginBottom: "4px",
                          }}
                        >
                          [{notifType.icon}]{" "}
                          {notification.sender_name ||
                            notification.buyer_name ||
                            "User"}
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            margin: 0,
                            marginBottom: "4px",
                            lineHeight: 1.4,
                          }}
                        >
                          {notification.message_preview}
                        </p>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                          }}
                        >
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: 0,
                          marginTop: "2px",
                        }}
                        title="Delete"
                      >
                        x
                      </button>
                    </div>
                    {!notification.is_read && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          background: "#2563eb",
                          borderRadius: "50%",
                          marginTop: "8px",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <button
                onClick={() => loadNotifications()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
