import { useEffect, useState, useRef, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

function Icon({ name, size = 14, color = "currentColor" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "chat") {
    return (
      <svg {...common}>
        <path d="M7 18l-4 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7z" />
      </svg>
    );
  }
  if (name === "reply") {
    return (
      <svg {...common}>
        <path d="M10 7L4 12l6 5" />
        <path d="M4 12h10a6 6 0 0 1 6 6" />
      </svg>
    );
  }
  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
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
  if (name === "send") {
    return (
      <svg {...common}>
        <path d="M22 2L11 13" />
        <path d="M22 2L15 22l-4-9-9-4z" />
      </svg>
    );
  }
  return null;
}

function SellerReplyPanel({ selectedInquiry, userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyPreview, setReplyPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef(null);

  const isUserSeller =
    String(selectedInquiry?.seller_id || "") === String(userId || "");
  const currentUserName = isUserSeller
    ? selectedInquiry?.seller_name || "Seller"
    : selectedInquiry?.buyer_name || "Buyer";

  const fetchMessages = useCallback(async () => {
    if (!selectedInquiry) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/inquiries/messages/${selectedInquiry._id}`,
      );
      if (!res.ok) throw new Error("Failed to load messages.");
      const data = await res.json();

      const initialMessage = {
        _id: `inquiry-${selectedInquiry._id}`,
        inquiry_id: selectedInquiry._id,
        sender_id: selectedInquiry.buyer_id,
        sender_name: selectedInquiry.buyer_name || "Buyer",
        message_body: selectedInquiry.message,
        createdAt: selectedInquiry.createdAt,
        isInitialMessage: true,
      };

      setMessages([initialMessage, ...data]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedInquiry]);

  useEffect(() => {
    setMessages([]);
    fetchMessages();
    setReplyTo(null);
    setReplyPreview("");
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedInquiry || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/inquiries/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: selectedInquiry._id,
          sender_id: userId,
          sender_name: currentUserName,
          buyer_id: selectedInquiry.buyer_id,
          seller_id: selectedInquiry.seller_id,
          message_body: newMessage.trim(),
          reply_to: replyTo,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply.");
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      setReplyTo(null);
      setReplyPreview("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReply = (msg) => {
    setReplyTo(msg._id);
    const previewText =
      msg.message_body.length > 80
        ? `${msg.message_body.slice(0, 80)}...`
        : msg.message_body;
    setReplyPreview(`${msg.sender_name || "Buyer"}: ${previewText}`);
  };

  const handleEdit = (msg) => {
    if (msg.isInitialMessage) {
      alert("Cannot edit the initial inquiry message.");
      return;
    }
    setEditingId(msg._id);
    setEditText(msg.message_body);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingId) return;
    try {
      const res = await fetch(`${API_BASE}/inquiries/messages/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_body: editText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to edit message.");
      const updatedMsg = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m._id === editingId ? updatedMsg : m)),
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (id.startsWith("inquiry-")) {
      alert("Cannot delete the initial inquiry message.");
      return;
    }
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${API_BASE}/inquiries/messages/${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert(err.message);
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
            width: 58,
            height: 58,
            borderRadius: "50%",
            marginBottom: 12,
            display: "grid",
            placeItems: "center",
            background: "rgba(148,163,184,0.14)",
          }}
        >
          <Icon name="chat" size={24} color="#94a3b8" />
        </div>
        <p style={{ fontWeight: 600 }}>Select an inquiry to reply as seller</p>
        <p style={{ fontSize: 12, marginTop: 4 }}>Your message thread appears here</p>
      </div>
    );
  }

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
          padding: "13px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#f8fafc",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="chat" size={14} color="#f97316" />
            Seller Reply
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            Respond to buyer messages
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#cbd5e1" }}>
          Buyer: {selectedInquiry.buyer_name || "Unknown"}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {loading && (
          <p style={{ textAlign: "center", color: "#94a3b8" }}>
            Loading messages...
          </p>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
            No chat history yet. Start the conversation with the buyer.
          </div>
        )}

        {messages.map((msg) => {
          const isSent = String(msg.sender_id || "") === String(userId || "");
          const isEditing = editingId === msg._id;
          const displayName = isSent
            ? currentUserName
            : selectedInquiry.buyer_name || "Buyer";

          return (
            <div
              key={msg._id}
              style={{
                display: "flex",
                justifyContent: isSent ? "flex-end" : "flex-start",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "68%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  background: isSent
                    ? "linear-gradient(145deg, #f97316 0%, #ea580c 100%)"
                    : "rgba(255,255,255,0.08)",
                  color: "#fff",
                  borderBottomRightRadius: isSent ? 3 : 12,
                  borderBottomLeftRadius: isSent ? 12 : 3,
                  border: isSent
                    ? "1px solid rgba(255,255,255,0.25)"
                    : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.8 }}>
                  {displayName}
                </div>
                {msg.reply_to && (
                  <div
                    style={{
                      fontSize: 11,
                      marginBottom: 6,
                      padding: "8px 10px",
                      borderLeft: "3px solid #fdba74",
                      background: "rgba(255,255,255,0.12)",
                      color: "#ffedd5",
                    }}
                  >
                    Replying to a previous message
                  </div>
                )}
                {isEditing ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "7px 9px",
                      borderRadius: 7,
                      border: "1px solid rgba(255,255,255,0.3)",
                      fontSize: 13,
                      color: "#0f172a",
                      resize: "none",
                    }}
                    rows={2}
                  />
                ) : (
                  <>
                    <div>{msg.message_body}</div>
                    {msg.isEdited && (
                      <div
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          opacity: 0.7,
                          fontStyle: "italic",
                        }}
                      >
                        Edited
                      </div>
                    )}
                  </>
                )}
                <div
                  style={{
                    fontSize: 10,
                    marginTop: 4,
                    opacity: 0.8,
                    textAlign: "right",
                  }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {isEditing && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        background: "rgba(16,185,129,0.9)",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      style={{
                        background: "rgba(15,23,42,0.45)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {!isEditing && !isSent && !msg.isInitialMessage && (
                  <button
                    onClick={() => handleReply(msg)}
                    style={{
                      marginTop: 8,
                      background: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                      borderRadius: 7,
                      padding: "4px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name="reply" size={11} color="#fff" />
                    Reply
                  </button>
                )}
              </div>

              {isSent && !isEditing && !msg.isInitialMessage && (
                <div style={{ display: "flex", gap: 6, opacity: 0.9 }}>
                  <button
                    onClick={() => handleEdit(msg)}
                    style={{
                      background: "transparent",
                      color: "#f97316",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    title="Edit message"
                  >
                    <Icon name="edit" size={14} color="#f97316" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    style={{
                      background: "transparent",
                      color: "#f87171",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    title="Delete message"
                  >
                    <Icon name="trash" size={14} color="#f87171" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: 16,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {replyPreview && (
          <div
            style={{
              background: "rgba(249,115,22,0.14)",
              border: "1px solid rgba(249,115,22,0.4)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 10,
              position: "relative",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#fdba74" }}>
              Replying to:
            </div>
            <div style={{ fontSize: 12, color: "#fef3c7", paddingRight: 50 }}>
              {replyPreview}
            </div>
            <button
              onClick={() => {
                setReplyTo(null);
                setReplyPreview("");
              }}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "transparent",
                border: "none",
                color: "#fdba74",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <textarea
          rows={3}
          placeholder="Write your seller reply..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 10,
            fontSize: 13,
            background: "rgba(15,23,42,0.55)",
            color: "#f8fafc",
            resize: "vertical",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          style={{
            marginTop: 12,
            background:
              sending || !newMessage.trim()
                ? "rgba(148,163,184,0.5)"
                : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: 14,
            fontWeight: 700,
            cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer",
            width: "100%",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Icon name="send" size={14} color="#fff" />
          {sending ? "Sending..." : "Send Reply"}
        </button>
      </div>
    </div>
  );
}

export default SellerReplyPanel;
