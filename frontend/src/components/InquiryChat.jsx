import { useEffect, useState, useRef, useCallback } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

function InquiryChat({ selectedInquiry, userId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const messagesEndRef = useRef(null);

  const resolvedUserId = String(userId || selectedInquiry?.buyer_id || "").trim();
  const buyerId = String(selectedInquiry?.buyer_id || "").trim();
  const sellerId = String(selectedInquiry?.seller_id || "").trim();
  const isUserBuyer = resolvedUserId === buyerId;
  const currentUserName = isUserBuyer
    ? selectedInquiry?.buyer_name || "Buyer"
    : selectedInquiry?.seller_name || "Seller";

  const fetchMessages = useCallback(async () => {
    if (!selectedInquiry?._id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/inquiries/messages/${selectedInquiry._id}`);
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
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedInquiry || sending) return;
    if (!resolvedUserId) {
      alert("Your session ID is missing. Please log out and log in again.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/inquiries/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: selectedInquiry._id,
          sender_id: resolvedUserId,
          sender_name: currentUserName,
          buyer_id: buyerId,
          seller_id: sellerId,
          message_body: newMessage.trim(),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to send message.");
      }
      setMessages((prev) => [...prev, body]);
      setNewMessage("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
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
      setMessages((prev) => prev.map((m) => (m._id === editingId ? updatedMsg : m)));
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
          background: "linear-gradient(180deg, rgba(17,17,25,0.96) 0%, rgba(12,12,18,0.96) 100%)",
        }}
      >
        <p style={{ fontWeight: 600 }}>Select an inquiry to view chat</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "linear-gradient(180deg, rgba(17,17,25,0.96) 0%, rgba(12,12,18,0.96) 100%)" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>{selectedInquiry.subject}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>ID: #{selectedInquiry._id?.slice(-6).toUpperCase()}</div>
        </div>
        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 700, background: selectedInquiry.status === "open" ? "rgba(34,197,94,0.16)" : "rgba(245,158,11,0.16)", color: selectedInquiry.status === "open" ? "#4ade80" : "#f59e0b" }}>
          {selectedInquiry.status}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
            <p>No messages yet. Start the conversation.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isSent = String(msg.sender_id || "") === resolvedUserId;
          const isEditing = editingId === msg._id;
          const displayName = isSent ? currentUserName : selectedInquiry.seller_name || "Seller";

          return (
            <div key={msg._id} style={{ display: "flex", justifyContent: isSent ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-start" }}>
              <div style={{ maxWidth: "68%", padding: "10px 14px", borderRadius: 12, fontSize: 13, background: isSent ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.08)", color: "white", borderBottomRightRadius: isSent ? 3 : 12, borderBottomLeftRadius: isSent ? 12 : 3, border: "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.82 }}>{displayName}</div>
                {isEditing ? (
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", fontSize: 13, resize: "none" }} rows={2} />
                ) : (
                  <>
                    <div>{msg.message_body}</div>
                    {msg.isEdited && <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, fontStyle: "italic" }}>Edited</div>}
                  </>
                )}
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: "right" }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                {isEditing && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                    <button onClick={handleSaveEdit} style={{ background: "rgba(16,185,129,0.9)", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Save</button>
                    <button onClick={() => { setEditingId(null); setEditText(""); }} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>
              {isSent && !isEditing && !msg.isInitialMessage && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleEdit(msg)} style={{ background: "transparent", color: "#60a5fa", border: "none", cursor: "pointer", fontSize: 12 }}>Edit</button>
                  <button onClick={() => handleDeleteMessage(msg._id)} style={{ background: "transparent", color: "#f87171", border: "none", cursor: "pointer", fontSize: 12 }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
        <textarea
          rows={2}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, fontSize: 13, background: "rgba(15,23,42,0.55)", color: "#f8fafc", resize: "none", outline: "none" }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          style={{ background: sending || !newMessage.trim() ? "rgba(148,163,184,0.5)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer", alignSelf: "flex-end" }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default InquiryChat;
