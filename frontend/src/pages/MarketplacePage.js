import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import API from "../utils/api";
import InquiryList from "../components/InquiryList";
import InquiryChat from "../components/InquiryChat";
import SellerReplyPanel from "../components/SellerReplyPanel";
import InquiryDetails from "../components/InquiryDetails";
import NotificationPanel from "../components/NotificationPanel";

const FUEL_COLORS = { petrol: "#f59e0b", diesel: "#6b7280", electric: "#22c55e", hybrid: "#3b82f6" };
const formatLKR = (amount) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));




function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>⚠ {msg}</div>;
}

function Spinner({ size = 40 }) {
  return <div style={{ width: size, height: size, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}

const validateVehicle = (f) => {
  const e = {};
  if (!f.title?.trim() || f.title.trim().length < 5) e.title = "Title must be at least 5 characters";
  if (!f.make?.trim()) e.make = "Make is required";
  if (!f.model?.trim()) e.model = "Model is required";
  if (!f.year) e.year = "Year is required";
  else if (f.year < 1990 || f.year > new Date().getFullYear() + 1) e.year = "Enter valid year (1990-present)";
  if (!f.price) e.price = "Price is required";
  else if (Number(f.price) <= 0) e.price = "Price must be greater than 0";
  if (f.mileage !== "" && f.mileage !== undefined && Number(f.mileage) < 0) e.mileage = "Kilometers cannot be negative";
  return e;
};


function ImageUploader({ images, setImages }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const MAX = 6;

  const process = (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) { toast.error("Only image files allowed"); return; }
    const slots = MAX - images.length;
    if (slots <= 0) { toast.error("Max 6 images"); return; }
    imgs.slice(0, slots).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(file.name + " exceeds 5MB"); return; }
      const reader = new FileReader();
      reader.onload = e => setImages(p => [...p, { url: e.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  };

  return (

    // Add vehicle images with details to list
    <div>
      {images.length < MAX && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); process(e.dataTransfer.files); }}
          onClick={() => ref.current.click()}
          style={{ border: "2px dashed " + (drag ? "var(--accent)" : "var(--border-light)"), borderRadius: "var(--radius)", padding: "20px", textAlign: "center", cursor: "pointer", background: drag ? "var(--accent-dim)" : "var(--bg-elevated)", marginBottom: 10, transition: "all 0.2s" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}></div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Drag and drop or click to upload photos</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 3 }}>Max 6 photos, 5MB each (JPG, PNG, WEBP)</div>
          <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => process(e.target.files)} />
        </div>
      )}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer" }}>×</button>
              {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: "var(--accent)", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 700 }}>MAIN</div>}
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{images.length}/{MAX} photos</div>}
    </div>
  );
}

// Listed details

function VehicleModal({ vehicle, onClose, onSuccess }) {
  const isEdit = !!vehicle;
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const blank = { title: "", make: "", model: "", year: new Date().getFullYear(), price: "", mileage: "", fuelType: "petrol", transmission: "manual", condition: "used", vehicleType: "local", status: "available", description: "" };
  const [form, setForm] = useState(vehicle ? { ...blank, ...vehicle, price: String(vehicle.price || ""), mileage: String(Math.round(Number(vehicle.mileage || 0))) } : blank);

  useEffect(() => {
    if (vehicle?.images?.length) setImages(vehicle.images.map((url, i) => ({ url, name: "img-" + i })));
  }, [vehicle]);

  const set = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name]) {
      const errs = validateVehicle(updated);
      setErrors(p => ({ ...p, [name]: errs[name] || "" }));
    }
  };

  const blur = (e) => {
    setTouched(p => ({ ...p, [e.target.name]: true }));
    const errs = validateVehicle(form);
    setErrors(p => ({ ...p, [e.target.name]: errs[e.target.name] || "" }));
  };

  const inp = (name) => ({ name, value: form[name] || "", onChange: set, onBlur: blur, className: "form-input", style: { borderColor: errors[name] ? "#ef4444" : undefined } });
  const sel = (name) => ({ name, value: form[name] || "", onChange: set, className: "form-select", style: { borderColor: errors[name] ? "#ef4444" : undefined } });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateVehicle(form);
    if (Object.keys(errs).length) { setErrors(errs); setTouched(Object.fromEntries(Object.keys(blank).map(k => [k, true]))); toast.error("Fix errors before submitting"); return; }
    setLoading(true);
    try {
      const payload = { ...form, year: Number(form.year), price: Number(form.price), mileage: Math.max(0, Math.round(Number(form.mileage) || 0)), images: images.map(i => i.url) };
      if (isEdit) await API.put("/vehicles/" + vehicle._id, payload);
      else await API.post("/vehicles", payload);
      toast.success(isEdit ? "Vehicle updated!" : "Vehicle listed!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error - please try again");
    } finally { setLoading(false); }
  };

  const sec = { marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border)" };
  const secH = { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", marginBottom: 12 };
  const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const g3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 660, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">{isEdit ? "EDIT VEHICLE" : "LIST A VEHICLE"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
          <div style={sec}>
            <div style={secH}>Vehicle Photos</div>
            <ImageUploader images={images} setImages={setImages} />
          </div>
          <div style={sec}>
            <div style={secH}> Basic Information</div>
            <div style={g2}>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Listing Title *</label>
                <input {...inp("title")} placeholder="e.g. 2022 Toyota Camry SE - Excellent Condition" />
                <FieldError msg={errors.title} />
              </div>
              <div className="form-group">
                <label className="form-label">Make *</label>
                <input {...inp("make")} placeholder="Toyota" />
                <FieldError msg={errors.make} />
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input {...inp("model")} placeholder="Camry" />
                <FieldError msg={errors.model} />
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <input {...inp("year")} type="number" min="1990" max={new Date().getFullYear() + 1} />
                <FieldError msg={errors.year} />
              </div>
              <div className="form-group">
                <label className="form-label">Price (USD) *</label>
                <input {...inp("price")} type="number" min="1" placeholder="25000" />
                <FieldError msg={errors.price} />
              </div>
              <div className="form-group">
                <label className="form-label">Kilometers (km)</label>
                <input {...inp("mileage")} type="number" min="0" step="1" placeholder="45000" onWheel={(e) => e.currentTarget.blur()} />
                <FieldError msg={errors.mileage} />
              </div>
            </div>
          </div>
          <div style={sec}>
            <div style={secH}>Specifications</div>
            <div style={g3}>
              <div className="form-group">
                <label className="form-label">Fuel Type *</label>
                <select {...sel("fuelType")}>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transmission *</label>
                <select {...sel("transmission")}>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Condition *</label>
                <select {...sel("condition")}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="certified">Certified Pre-owned</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type *</label>
                <select {...sel("vehicleType")}>
                  <option value="local">Local</option>
                  <option value="import">Import</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Listing Status *</label>
                <select {...sel("status")}>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <div style={secH}> Description</div>
            <div className="form-group">
              <label className="form-label">Additional Details</label>
              <textarea name="description" className="form-textarea" value={form.description} onChange={set}
                placeholder="Vehicle history, features, modifications, service records..." style={{ minHeight: 80 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "List Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

//  Edit,Delete the listed 

function VehicleCard({ vehicle, onInquire, onOpen, onEdit, onDelete, onRateSeller, canRateSeller, canInquire, isMine }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = vehicle.images || [];
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      onClick={() => { if (!isMine && onOpen) onOpen(vehicle); }}
    >
      <div style={{ position: "relative", height: 185, background: "var(--bg-elevated)" }}>
        {imgs.length > 0
          ? <img src={imgs[imgIdx]} alt={vehicle.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}><span style={{ fontSize: 44 }}></span><span style={{ fontSize: 11, color: "var(--text-muted)" }}>No photos</span></div>}
        {imgs.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {imgs.map((_, i) => <div key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }} style={{ width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === imgIdx ? "var(--accent)" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />)}
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: vehicle.condition === "new" ? "rgba(34,197,94,0.85)" : vehicle.condition === "certified" ? "rgba(59,130,246,0.85)" : "rgba(0,0,0,0.65)", color: "#fff", backdropFilter: "blur(4px)" }}>{vehicle.condition}</span>
        </div>
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: vehicle.status === "sold" ? "rgba(239,68,68,0.9)" : vehicle.status === "pending" ? "rgba(245,158,11,0.9)" : "rgba(34,197,94,0.9)", color: "#fff" }}>
            {vehicle.status || "available"}
          </span>
        </div>
        {imgs.length > 1 && <div style={{ position: "absolute", top: 36, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 7px", borderRadius: 10 }}>{imgs.length} photos</div>}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>{vehicle.make} • {vehicle.model}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, lineHeight: 1.3 }}>{vehicle.title}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: vehicle.vehicleType === "import" ? "rgba(59,130,246,0.18)" : "rgba(34,197,94,0.18)", color: vehicle.vehicleType === "import" ? "#60a5fa" : "#22c55e" }}>
            {vehicle.vehicleType || "local"}
          </span>
          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: (FUEL_COLORS[vehicle.fuelType] || "#888") + "22", color: FUEL_COLORS[vehicle.fuelType] || "#888" }}>{vehicle.fuelType}</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{vehicle.transmission}</span>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{vehicle.year}</span>
          {vehicle.mileage > 0 && <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{vehicle.mileage.toLocaleString()} km</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMine ? 10 : 6 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--accent)", letterSpacing: "0.02em" }}>{formatLKR(vehicle.price)}</div>
          {!isMine && (
            <div style={{ display: "flex", gap: 8 }}>
              {canRateSeller && <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); onRateSeller(vehicle); }}>Rate Seller</button>}
              {canInquire && (
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onInquire?.(vehicle); }}>
                  Inquire
                </button>
              )}
            </div>
          )}
        </div>
        {isMine
          ? <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}>Edit</button>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)" }} onClick={(e) => { e.stopPropagation(); onDelete(vehicle._id); }}>Delete</button>
            </div>
          : <div style={{ fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              By <strong style={{ color: "var(--text-secondary)" }}>{vehicle.seller?.name}</strong>
              {vehicle.seller?.isTopRatedSeller && (
                <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: "rgba(250,204,21,0.18)", color: "#facc15" }}>
                  TOP RATED
                </span>
              )}
            </div>}
      </div>
    </div>
  );
}

// INQUIRY MODAL
function FeedbackModal({ vehicle, currentUser, onClose, onSuccess }) {
  const existingFeedback = (vehicle?.seller?.sellerFeedbacks || []).find((f) => {
    const buyerId = f?.buyerId?._id || f?.buyerId;
    const myId = currentUser?._id || currentUser?.id;
    return String(buyerId) === String(myId) && (f?.source !== "admin");
  });

  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please select a star rating");
    setLoading(true);
    try {
      if (existingFeedback) {
        await API.put("/vehicles/" + vehicle._id + "/feedback", { rating, comment });
        toast.success("Seller feedback updated");
      } else {
        await API.post("/vehicles/" + vehicle._id + "/feedback", { rating, comment });
        toast.success("Seller feedback submitted");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const removeFeedback = async () => {
    if (!existingFeedback) return;
    if (!window.confirm("Delete your feedback for this seller-")) return;
    setLoading(true);
    try {
      await API.delete("/vehicles/" + vehicle._id + "/feedback");
      toast.success("Seller feedback deleted");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">RATE SELLER</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: 14, color: "var(--text-secondary)", fontSize: 13 }}>
          Seller: <strong style={{ color: "var(--text-primary)" }}>{vehicle.seller?.name || "Unknown"}</strong>
        </div>
        {existingFeedback && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.1)", fontSize: 12, color: "#93c5fd" }}>
            You already submitted feedback. You can edit or delete it.
          </div>
        )}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Your Rating *</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  style={{ fontSize: 30, lineHeight: 1, border: "none", background: "transparent", color: i <= (hover || rating) ? "#f59e0b" : "#3a3a46", cursor: "pointer" }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Comment</label>
            <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience with this seller..." style={{ minHeight: 90 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            {existingFeedback && (
              <button type="button" className="btn btn-ghost" style={{ color: "var(--error)" }} disabled={loading} onClick={removeFeedback}>
                Delete Feedback
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function InquiryModal({ vehicle, onClose, currentUser }) {
  const feedbacks = Array.isArray(vehicle?.seller?.sellerFeedbacks) ? vehicle.seller.sellerFeedbacks : [];
  const [subject, setSubject] = useState(`Inquiry about ${vehicle?.title || "vehicle"}`);
  const [message, setMessage] = useState("");
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone || "");
  const [submitting, setSubmitting] = useState(false);

  const postInquiryWithPortFallback = async (payload) => {
    let primaryErr = null;
    try {
      return await API.post("/inquiries", payload);
    } catch (err) {
      primaryErr = err;
      const currentBase = String(API.defaults.baseURL || "").trim();
      const altBase = currentBase.includes(":5001")
        ? currentBase.replace(":5001", ":5000")
        : currentBase.includes(":5000")
          ? currentBase.replace(":5000", ":5001")
          : "";

      const isRetryable =
        !err.response || err.response?.status === 404 || err.code === "ERR_NETWORK";

      if (!altBase || !isRetryable) throw err;

      const token = localStorage.getItem("token");
      try {
        return await axios.post(`${altBase}/inquiries`, payload, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (fallbackErr) {
        if (primaryErr?.response?.status === 404) {
          throw new Error(
            "Inquiry API route is missing on the running backend (HTTP 404 on /api/inquiries). Restart backend with the latest code.",
          );
        }
        throw fallbackErr;
      }
    }
  };

  const submitInquiry = async () => {
    if (String(currentUser?.role || "").toLowerCase() !== "buyer") {
      toast.error("Only buyers can send inquiries.");
      return;
    }
    const buyerId = String(currentUser?.id || currentUser?._id || "").trim();
    const sellerId = String(vehicle?.seller?._id || vehicle?.seller?.id || "").trim();
    const vehicleId = String(vehicle?._id || "").trim();
    const buyerName = String(currentUser?.name || "").trim();

    if (!buyerId || !buyerName) {
      toast.error("Please log in again to send an inquiry.");
      return;
    }
    if (!sellerId || !vehicleId) {
      toast.error("Vehicle or seller details are missing.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error("Please add subject and message.");
      return;
    }
    if (!/^\d{10}$/.test(String(buyerPhone || "").trim())) {
      toast.error("Buyer phone must contain exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    try {
      await postInquiryWithPortFallback({
        vehicle_id: vehicleId,
        buyer_id: buyerId,
        buyer_name: buyerName,
        buyer_phone: String(buyerPhone).trim(),
        seller_id: sellerId,
        seller_name: String(vehicle?.seller?.name || "").trim(),
        seller_phone: String(vehicle?.seller?.phone || "").trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success("Inquiry sent successfully.");
      onClose();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message;
      toast.error(serverMessage || "Failed to send inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2 className="modal-title">VEHICLE INQUIRY</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        {vehicle.images?.[0] && <img src={vehicle.images[0]} alt={vehicle.title} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 16 }} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, fontSize: 15 }}>{vehicle.title}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--accent)", marginBottom: 4 }}>{formatLKR(vehicle.price)}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{vehicle.year} {vehicle.make} {vehicle.model} | {vehicle.fuelType} | {vehicle.transmission} | {vehicle.mileage?.toLocaleString()} km</div>
          </div>
          <div style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Seller Contact</div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{vehicle.seller?.name}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{vehicle.seller?.email}</div>
            {vehicle.seller?.phone && <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{vehicle.seller.phone}</div>}
            {(vehicle.seller?.sellerRating || 0) > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                {"★".repeat(Math.round(vehicle.seller?.sellerRating || 0))}
                {"☆".repeat(5 - Math.round(vehicle.seller?.sellerRating || 0))}
                {" "}{vehicle.seller?.sellerRating} ({vehicle.seller?.sellerReviewCount || 0})
              </div>
            )}
          </div>
          <div style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Seller Feedback
            </div>
            {feedbacks.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No feedback yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                {feedbacks.slice(0, 8).map((f, idx) => (
                  <div key={f._id || f.createdAt || idx} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: 12 }}>
                          {f.buyerId?.name || "User"}
                        </strong>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          borderRadius: 10,
                          padding: "2px 8px",
                          textTransform: "uppercase",
                          background: (f.source === "admin" || f.buyerId?.role === "admin") ? "rgba(239,68,68,0.16)" : "rgba(59,130,246,0.16)",
                          color: (f.source === "admin" || f.buyerId?.role === "admin") ? "#ef4444" : "#60a5fa"
                        }}>
                          {(f.source === "admin" || f.buyerId?.role === "admin") ? "Admin" : "Buyer"}
                        </span>
                      </div>
                      <span style={{ color: "#f59e0b", fontSize: 12 }}>
                        {"★".repeat(Number(f.rating || 0))}
                        {"☆".repeat(5 - Number(f.rating || 0))}
                      </span>
                    </div>
                    {f.comment && <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>{f.comment}</div>}
                    <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                      {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {vehicle.description && <div style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>{vehicle.description}</div>}
          <div style={{ padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
              Send Inquiry
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Your Phone *</label>
              <input className="form-input" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="0771234567" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Message *</label>
              <textarea className="form-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, is this vehicle still available-" style={{ minHeight: 90 }} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={submitting} onClick={submitInquiry}>
            {submitting ? "Sending..." : "Send Inquiry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehiclePreviewModal({ vehicle, onClose, onInquire, canInquire }) {
  const [idx, setIdx] = useState(0);
  const imgs = vehicle.images || [];
  const feedbacks = Array.isArray(vehicle?.seller?.sellerFeedbacks) ? vehicle.seller.sellerFeedbacks : [];

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 className="modal-title">VEHICLE PREVIEW</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          {imgs.length > 0 ? (
            <img src={imgs[idx]} alt={vehicle.title} style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: "var(--radius)" }} />
          ) : (
            <div style={{ height: 260, borderRadius: "var(--radius)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>No images</div>
          )}
          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
              {imgs.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 5, background: i === idx ? "var(--accent)" : "var(--border)", cursor: "pointer" }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
          <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>{vehicle.title}</div>
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: vehicle.status === "sold" ? "rgba(239,68,68,0.9)" : vehicle.status === "pending" ? "rgba(245,158,11,0.9)" : "rgba(34,197,94,0.9)", color: "#fff" }}>
            {vehicle.status || "available"}
          </span>
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 10 }}>
          {vehicle.year} {vehicle.make} {vehicle.model} • {vehicle.fuelType} • {vehicle.transmission} • {vehicle.condition}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: vehicle.vehicleType === "import" ? "rgba(59,130,246,0.18)" : "rgba(34,197,94,0.18)", color: vehicle.vehicleType === "import" ? "#60a5fa" : "#22c55e" }}>
            {vehicle.vehicleType || "local"}
          </span>
          {vehicle.mileage > 0 && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{vehicle.mileage.toLocaleString()} km</span>}
          <span style={{ fontFamily: "var(--font-display)", color: "var(--accent)", fontSize: 22 }}>{formatLKR(vehicle.price)}</span>
        </div>
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Seller</div>
          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 700 }}>{vehicle.seller?.name || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{vehicle.seller?.email || ""}</div>
          {vehicle.seller?.phone && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{vehicle.seller.phone}</div>}
        </div>
        {vehicle.description && (
          <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", marginBottom: 10, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
            {vehicle.description}
          </div>
        )}
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-elevated)", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Seller Feedback</div>
          {feedbacks.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No feedback yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
              {feedbacks.slice(0, 6).map((f, i) => (
                <div key={f._id || f.createdAt || i} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ fontSize: 12, color: "var(--text-primary)" }}>{f.buyerId?.name || "User"}</strong>
                    <span style={{ fontSize: 12, color: "#f59e0b" }}>{"★".repeat(Number(f.rating || 0))}{"☆".repeat(5 - Number(f.rating || 0))}</span>
                  </div>
                  {f.comment && <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-secondary)" }}>{f.comment}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {canInquire && (
            <button className="btn btn-primary" onClick={() => { onClose(); onInquire?.(vehicle); }}>
              Inquire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onUpdate }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "", email: user.email });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.name?.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (form.phone && !/^[\d\s+\-()\.]{7,15}$/.test(form.phone)) e.phone = "Invalid phone number";
    return e;
  };
  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const updated = { ...user, ...form };
    localStorage.setItem("user", JSON.stringify(updated));
    toast.success("Profile updated!");
    onUpdate(updated);
    onClose();
  };
  const rc = user.role === "buyer" ? "#3b82f6" : "#d4a843";
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2 className="modal-title">MY PROFILE</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: 14, background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: rc + "22", border: "2px solid " + rc, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, color: rc }}>{user.name[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>{user.name}</div>
            <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: rc + "22", color: rc, textTransform: "uppercase" }}>{user.role}</span>
          </div>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ borderColor: errors.name ? "#ef4444" : undefined }} />
            <FieldError msg={errors.name} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ borderColor: errors.email ? "#ef4444" : undefined }} />
            <FieldError msg={errors.email} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ borderColor: errors.phone ? "#ef4444" : undefined }} />
            <FieldError msg={errors.phone} />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SERVICE INQUIRY MODAL ────────────────────────────────────────────────────
function ServiceInquiryModal({ company, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", serviceDate: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const meta = SERVICE_META[company.type];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (form.phone && !/^[\d\s+\-()\.]{7,15}$/.test(form.phone)) e.phone = "Invalid phone";
    if (!form.message.trim()) e.message = "Please describe what you need";
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSent(true);
    toast.success("Inquiry sent to " + company.name + "!");
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">SERVICE INQUIRY</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "flex", gap: 12, padding: 14, background: meta.bg, border: "1px solid " + meta.color + "44", borderRadius: "var(--radius)", marginBottom: 20 }}>
          <span style={{ fontSize: 28 }}>{meta.icon}</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{company.name}</div>
            <div style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>{meta.label}</div>
            {company.phone && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>[Phone] {company.phone}</div>}
            {company.email && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>[Email] {company.email}</div>}
            {company.operatingHours && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>[Hours] {company.operatingHours}</div>}
          </div>
        </div>
        {sent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>[OK]</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 8 }}>Inquiry Sent!</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{company.name} will contact you at {form.email}</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" style={{ borderColor: errors.name ? "#ef4444" : undefined }} />
                <FieldError msg={errors.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 000 0000" style={{ borderColor: errors.phone ? "#ef4444" : undefined }} />
                <FieldError msg={errors.phone} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" style={{ borderColor: errors.email ? "#ef4444" : undefined }} />
                <FieldError msg={errors.email} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Preferred Service Date</label>
                <input className="form-input" type="date" value={form.serviceDate} onChange={e => setForm(p => ({ ...p, serviceDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="form-group" style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Message *</label>
                <textarea className="form-textarea" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder={"Describe what you need from " + company.name + "..."} style={{ minHeight: 90, borderColor: errors.message ? "#ef4444" : undefined }} />
                <FieldError msg={errors.message} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{meta.icon} Send Inquiry</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── SERVICES PAGE ────────────────────────────────────────────────────────────
function ServicesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [inquireCompany, setInquireCompany] = useState(null);

  useEffect(() => {
    API.get("/admin/companies")
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => toast.error("Failed to load services"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c => {
    if (!c.isActive) return false;
    if (activeType !== "all" && c.type !== activeType) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "0.04em", marginBottom: 6 }}>VEHICLE SERVICES</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Find trusted service providers, insurance, inspections, delivery and more</p>
      </div>

      {/* Service type cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        <div onClick={() => setActiveType("all")} style={{ padding: "16px 14px", background: activeType === "all" ? "var(--accent)" : "var(--bg-card)", border: "1px solid " + (activeType === "all" ? "var(--accent)" : "var(--border)"), borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>[All]</div>
          <div style={{ fontWeight: 700, fontSize: 13, color: activeType === "all" ? "#fff" : "var(--text-primary)" }}>All Services</div>
          <div style={{ fontSize: 11, color: activeType === "all" ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginTop: 2 }}>{companies.filter(c => c.isActive).length} providers</div>
        </div>
        {Object.entries(SERVICE_META).map(([key, { label, icon, color, bg }]) => {
          const count = companies.filter(c => c.type === key && c.isActive).length;
          const active = activeType === key;
          return (
            <div key={key} onClick={() => setActiveType(active ? "all" : key)}
              style={{ padding: "16px 14px", background: active ? color : "var(--bg-card)", border: "1px solid " + (active ? color : "var(--border)"), borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: active ? "#fff" : "var(--text-primary)", lineHeight: 1.2 }}>{label}</div>
              <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.7)" : "var(--text-muted)", marginTop: 3 }}>{count} providers</div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input className="form-input" placeholder="Search services, companies..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={48} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>[Search]</div>
          <p>No service providers found</p>
          {activeType !== "all" && <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setActiveType("all")}>View all services</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(c => {
            const meta = SERVICE_META[c.type] || SERVICE_META.service_provider;
            return (
              <div key={c._id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderLeft: "4px solid " + meta.color, borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15, marginBottom: 4, lineHeight: 1.2 }}>{c.name}</div>
                    <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                </div>

                {c.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{c.description.length > 120 ? c.description.slice(0, 120) + "..." : c.description}</p>}

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {c.city && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>[Location] {[c.city, c.state, c.country].filter(Boolean).join(", ")}</div>}
                  {c.phone && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>[Phone] {c.phone}</div>}
                  {c.email && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>[Email] {c.email}</div>}
                  {c.operatingHours && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>[Hours] {c.operatingHours}</div>}
                  {c.serviceAreas && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>[Areas] {c.serviceAreas}</div>}
                  {c.specializations && <div style={{ fontSize: 12, color: meta.color }}>[Specs] {c.specializations}</div>}
                </div>

                {c.establishedYear && (
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
                    <span>Est. {c.establishedYear}</span>
                    {c.employeeCount && <span>{c.employeeCount} employees</span>}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)", marginTop: 4 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setInquireCompany(c)}>
                    {meta.icon} Contact {meta.label}
                  </button>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Site</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inquireCompany && <ServiceInquiryModal company={inquireCompany} onClose={() => setInquireCompany(null)} />}
    </div>
  );
}

// ─── MAIN MARKETPLACE PAGE ────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("browse");
  const [vehicles, setVehicles] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [sellerNotices, setSellerNotices] = useState([]);
  const [sellerFeedbacks, setSellerFeedbacks] = useState([]);
  const [sellerSummary, setSellerSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ fuelType: "", condition: "", vehicleType: "", topRated: "", sellerRating: "", sort: "", minPrice: "", maxPrice: "" });
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [previewVehicle, setPreviewVehicle] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [inquireVehicle, setInquireVehicle] = useState(null);
  const [inquireLoading, setInquireLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateVehicle, setRateVehicle] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const dropRef = useRef();

  const isSeller = currentUser.role === "seller";
  const currentUserId = currentUser?.id || currentUser?._id || "";

  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append("search", search);
      if (filters.fuelType) p.append("fuelType", filters.fuelType);
      if (filters.condition) p.append("condition", filters.condition);
      if (filters.vehicleType) p.append("vehicleType", filters.vehicleType);
      if (filters.topRated) p.append("topRated", filters.topRated);
      if (filters.sellerRating) p.append("sellerRating", filters.sellerRating);
      if (filters.sort) p.append("sort", filters.sort);
      if (filters.minPrice) p.append("minPrice", filters.minPrice);
      if (filters.maxPrice) p.append("maxPrice", filters.maxPrice);
      const qs = p.toString();
      const res = await API.get(`/vehicles${qs ? `?${qs}` : ""}`);
      setVehicles(res.data.vehicles);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load vehicles");
    }
    finally { setLoading(false); }
  }, [search, filters]);

  const fetchMyListings = useCallback(async () => {
    if (!isSeller) return;
    try {
      const res = await API.get("/vehicles/seller/my-listings");
      setMyListings(res.data.vehicles);
    } catch { toast.error("Failed to load your listings"); }
  }, [isSeller]);

  const fetchSellerNotices = useCallback(async () => {
    if (!isSeller) return;
    try {
      const res = await API.get("/vehicles/seller/notifications");
      setSellerNotices(res.data.notifications || []);
    } catch { /* no-op */ }
  }, [isSeller]);

  const fetchSellerFeedbacks = useCallback(async () => {
    if (!isSeller) return;
    try {
      const res = await API.get("/vehicles/seller/feedbacks");
      setSellerFeedbacks(res.data.feedbacks || []);
      setSellerSummary(res.data.seller || null);
    } catch {
      setSellerFeedbacks([]);
      setSellerSummary(null);
    }
  }, [isSeller]);

  useEffect(() => { const t = setTimeout(fetchVehicles, 300); return () => clearTimeout(t); }, [fetchVehicles]);
  useEffect(() => { fetchMyListings(); }, [fetchMyListings]);
  useEffect(() => { fetchSellerNotices(); }, [fetchSellerNotices]);
  useEffect(() => { fetchSellerFeedbacks(); }, [fetchSellerFeedbacks]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try { await API.delete("/vehicles/" + id); toast.success("Listing deleted"); fetchMyListings(); fetchVehicles(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleSuccess = () => { setShowModal(false); setEditVehicle(null); fetchMyListings(); fetchVehicles(); fetchSellerNotices(); fetchSellerFeedbacks(); };
  const isBuyer = currentUser.role === "buyer";

  const handleOpenInquiry = async (vehicle) => {
    setInquireLoading(true);
    try {
      const res = await API.get("/vehicles/" + vehicle._id);
      setInquireVehicle(res.data.vehicle || vehicle);
    } catch {
      setInquireVehicle(vehicle);
      toast.error("Loaded limited details only");
    } finally {
      setInquireLoading(false);
    }
  };

  const handleOpenPreview = async (vehicle) => {
    setPreviewLoading(true);
    try {
      const res = await API.get("/vehicles/" + vehicle._id);
      setPreviewVehicle(res.data.vehicle || vehicle);
    } catch {
      setPreviewVehicle(vehicle);
      toast.error("Loaded limited details only");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenRateModal = async (vehicle) => {
    setRateLoading(true);
    try {
      const res = await API.get("/vehicles/" + vehicle._id);
      setRateVehicle(res.data.vehicle || vehicle);
    } catch {
      setRateVehicle(vehicle);
      toast.error("Loaded limited feedback details only");
    } finally {
      setRateLoading(false);
    }
  };

  const TABS = [
    { id: "browse",      label: "Browse" },
    ...(isBuyer ? [{ id: "my-inquiries", label: "My Inquiries" }] : []),
    ...(isSeller ? [{ id: "my-listings", label: "My Listings (" + myListings.length + ")" }] : []),
    ...(isSeller ? [{ id: "inquiries", label: "Inquiries" }] : []),
  ];

  const rc = currentUser.role === "buyer" ? "#3b82f6" : "#d4a843";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.2em", color: "var(--accent)" }}>VEHICLE INTELLIGENT</div>

        <div style={{ display: "flex", gap: 6 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 16px", border: "none", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, transition: "all 0.15s", background: activeTab === tab.id ? "var(--accent)" : "transparent", color: activeTab === tab.id ? "#fff" : "var(--text-secondary)" }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationPanel userId={currentUserId || "user001"} />
          {isSeller && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditVehicle(null); setShowModal(true); }}>+ List Vehicle</button>
          )}
          {/* User dropdown */}
          <div style={{ position: "relative" }} ref={dropRef}>
            <button onClick={() => setShowDropdown(p => !p)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "6px 12px", cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: rc + "22", border: "1px solid " + rc, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: rc }}>{currentUser.name[0]?.toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Dashboard</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}></span>
            </button>
            {showDropdown && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: 220, boxShadow: "var(--shadow-lg)", zIndex: 200, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{currentUser.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{currentUser.email}</div>
                  <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: rc + "22", color: rc, textTransform: "uppercase" }}>{currentUser.role}</span>
                </div>
                <div style={{ padding: 6 }}>
                    {[
                    { label: " My Profile", action: () => { setShowProfile(true); setShowDropdown(false); } },
                    ...(isBuyer ? [{ label: "My Inquiries", action: () => { setActiveTab("my-inquiries"); setShowDropdown(false); } }] : []),
                    ...(isSeller ? [{ label: "My Listings (" + myListings.length + ")", action: () => { setActiveTab("my-listings"); setShowDropdown(false); } }] : []),
                    ...(isSeller ? [{ label: "Seller Inquiries", action: () => { setActiveTab("inquiries"); setShowDropdown(false); } }] : []),
                    ...(isBuyer ? [{ label: " Service Dashboard", action: () => { setShowDropdown(false); window.location.href = "/user-services"; } }] : []),
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: "block", width: "100%", padding: "9px 12px", border: "none", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", borderRadius: 6, textAlign: "left" }}>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />
                  <button onClick={logout}
                    style={{ display: "block", width: "100%", padding: "9px 12px", border: "none", background: "transparent", color: "#ef4444", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer", borderRadius: 6, textAlign: "left" }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>
        {/* Browse Tab */}
        {activeTab === "browse" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "0.04em", marginBottom: 4 }}>VEHICLE MARKETPLACE</h1>
              <p style={{ color: "var(--text-secondary)" }}>{vehicles.length} vehicles available</p>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", padding: "14px 18px", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
              <input className="form-input" placeholder="Search make, model or title..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
              <select className="form-select" value={filters.fuelType} onChange={e => setFilters(p => ({ ...p, fuelType: e.target.value }))} style={{ width: 130 }}>
                <option value="">All Fuels</option>
                <option value="petrol">Petrol</option><option value="diesel">Diesel</option>
                <option value="electric">Electric</option><option value="hybrid">Hybrid</option>
              </select>
              <select className="form-select" value={filters.condition} onChange={e => setFilters(p => ({ ...p, condition: e.target.value }))} style={{ width: 140 }}>
                <option value="">All Conditions</option>
                <option value="new">New</option><option value="used">Used</option><option value="certified">Certified</option>
              </select>
              <select className="form-select" value={filters.vehicleType} onChange={e => setFilters(p => ({ ...p, vehicleType: e.target.value }))} style={{ width: 120 }}>
                <option value="">All Type</option>
                <option value="local">Local</option>
                <option value="import">Import</option>
              </select>
              <select className="form-select" value={filters.topRated} onChange={e => setFilters(p => ({ ...p, topRated: e.target.value }))} style={{ width: 130 }}>
                <option value="">All Sellers</option>
                <option value="true">Top Rated</option>
              </select>
              <select className="form-select" value={filters.sellerRating} onChange={e => setFilters(p => ({ ...p, sellerRating: e.target.value }))} style={{ width: 130 }}>
                <option value="">Seller Rating</option>
                <option value="4">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="5">5.0</option>
              </select>
              <input className="form-input" type="number" placeholder="Min LKR" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} style={{ width: 100 }} />
              <input className="form-input" type="number" placeholder="Max LKR" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} style={{ width: 100 }} />
              <select className="form-select" value={filters.sort} onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))} style={{ width: 160 }}>
                <option value="">Sort: Latest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Newest Year</option>
              </select>
              {(search || Object.values(filters).some(Boolean)) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilters({ fuelType: "", condition: "", vehicleType: "", topRated: "", sellerRating: "", sort: "", minPrice: "", maxPrice: "" }); }}>Clear</button>
              )}
            </div>
            {loading
              ? <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={48} /></div>
              : vehicles.length === 0
                ? <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}></div>
                    <p>No vehicles found. Try adjusting your filters.</p>
                  </div>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                    {vehicles.map(v => <VehicleCard key={v._id} vehicle={v} onOpen={handleOpenPreview} onInquire={handleOpenInquiry} onRateSeller={handleOpenRateModal} canRateSeller={isBuyer} canInquire={isBuyer} isMine={false} />)}
                  </div>}
          </>
        )}

        {/* My Listings Tab */}
        {activeTab === "my-listings" && isSeller && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, letterSpacing: "0.04em", marginBottom: 4 }}>MY LISTINGS</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <p style={{ color: "var(--text-secondary)" }}>{myListings.length} vehicles listed</p>
                  {sellerSummary?.isTopRatedSeller && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(250,204,21,0.2)", color: "#facc15", textTransform: "uppercase" }}>
                      Top Rated Seller
                    </span>
                  )}
                  {(sellerSummary?.sellerRating || 0) > 0 && (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Rating: {sellerSummary.sellerRating} ({sellerSummary.sellerReviewCount || 0})
                    </span>
                  )}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => { setEditVehicle(null); setShowModal(true); }}>+ Add New Listing</button>
            </div>
            {sellerNotices.length > 0 && (
              <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {sellerNotices.map((n, idx) => (
                  <div key={(n._id || n.createdAt || idx)} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>ADMIN NOTICE</div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{n.message || n.title}</div>
                    {n.reason && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Reason: {n.reason}</div>}
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 18, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Seller Feedback ({sellerFeedbacks.length})
              </div>
              {sellerFeedbacks.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No seller feedback yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 240, overflowY: "auto" }}>
                  {sellerFeedbacks.slice(0, 20).map((f, idx) => (
                    <div key={f._id || f.createdAt || idx} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ color: "var(--text-primary)", fontSize: 13 }}>{f.buyerId?.name || "User"}</strong>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 10,
                            padding: "2px 8px",
                            textTransform: "uppercase",
                            background: (f.source === "admin" || f.buyerId?.role === "admin") ? "rgba(239,68,68,0.16)" : "rgba(59,130,246,0.16)",
                            color: (f.source === "admin" || f.buyerId?.role === "admin") ? "#ef4444" : "#60a5fa"
                          }}>
                            {(f.source === "admin" || f.buyerId?.role === "admin") ? "Admin" : "Buyer"}
                          </span>
                        </div>
                        <span style={{ color: "#f59e0b", fontSize: 12 }}>
                          {"★".repeat(Number(f.rating || 0))}
                          {"☆".repeat(5 - Number(f.rating || 0))}
                        </span>
                      </div>
                      {f.comment && <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>{f.comment}</div>}
                      <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                        {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {myListings.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}></div>
                  <p style={{ marginBottom: 16 }}>No listings yet</p>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create First Listing</button>
                </div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                  {myListings.map(v => <VehicleCard key={v._id} vehicle={v} isMine={true} onEdit={(v) => { setEditVehicle(v); setShowModal(true); }} onDelete={handleDelete} />)}
                </div>}
          </>
        )}

        {/* Buyer Inquiries Tab */}
        {activeTab === "my-inquiries" && isBuyer && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, letterSpacing: "0.04em", marginBottom: 4 }}>
                MY INQUIRIES
              </h1>
              <p style={{ color: "var(--text-secondary)" }}>
                View seller replies and continue the conversation.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 260px",
                gap: 20,
                height: "calc(100vh - 280px)",
              }}
            >
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <InquiryList
                  selectedInquiry={selectedInquiry}
                  setSelectedInquiry={setSelectedInquiry}
                  hideDelete
                  userId={currentUserId}
                  userRole="buyer"
                />
              </div>
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <InquiryChat selectedInquiry={selectedInquiry} userId={currentUserId} />
              </div>
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <InquiryDetails selectedInquiry={selectedInquiry} />
              </div>
            </div>
          </>
        )}

        {/* Seller Inquiries Tab */}
        {activeTab === "inquiries" && isSeller && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, letterSpacing: "0.04em", marginBottom: 4 }}>
                SELLER INQUIRIES
              </h1>
              <p style={{ color: "var(--text-secondary)" }}>
                View buyer inquiries and reply directly.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(249,115,22,0.35)", background: "linear-gradient(135deg, rgba(249,115,22,0.16), rgba(234,88,12,0.08))" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fb923c" }}>
                  Active Tab
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 2 }}>Seller Inbox</div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(59,130,246,0.35)", background: "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(59,130,246,0.06))" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#60a5fa" }}>
                  Workflow
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 2 }}>Read -> Reply -> Close</div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.35)", background: "linear-gradient(135deg, rgba(34,197,94,0.16), rgba(34,197,94,0.06))" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4ade80" }}>
                  Auto Refresh
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 2 }}>Every 15 Seconds</div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "280px 1fr 260px",
                gap: 20,
                height: "calc(100vh - 280px)",
              }}
            >
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <InquiryList
                  selectedInquiry={selectedInquiry}
                  setSelectedInquiry={setSelectedInquiry}
                  hideDelete
                  userId={currentUserId}
                  userRole="seller"
                />
              </div>
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <SellerReplyPanel selectedInquiry={selectedInquiry} userId={currentUserId} />
              </div>
              <div
                style={{
                  background: "rgba(10, 10, 12, 0.72)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
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
          </>
        )}
      </div>

      {showModal && <VehicleModal vehicle={editVehicle} onClose={() => { setShowModal(false); setEditVehicle(null); }} onSuccess={handleSuccess} />}
      {previewLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 320, textAlign: "center", padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Spinner size={34} /></div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading full ad details...</div>
          </div>
        </div>
      )}
      {previewVehicle && <VehiclePreviewModal vehicle={previewVehicle} onClose={() => setPreviewVehicle(null)} onInquire={handleOpenInquiry} canInquire={isBuyer} />}
      {rateLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 300, textAlign: "center", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Spinner size={34} /></div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading feedback details...</div>
          </div>
        </div>
      )}
      {rateVehicle && <FeedbackModal vehicle={rateVehicle} currentUser={currentUser} onClose={() => setRateVehicle(null)} onSuccess={() => { setRateVehicle(null); fetchVehicles(); fetchSellerFeedbacks(); }} />}
      {inquireLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 300, textAlign: "center", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Spinner size={34} /></div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading listing details...</div>
          </div>
        </div>
      )}
      {inquireVehicle && <InquiryModal vehicle={inquireVehicle} currentUser={currentUser} onClose={() => setInquireVehicle(null)} />}
      {showProfile && <ProfileModal user={currentUser} onClose={() => setShowProfile(false)} onUpdate={setCurrentUser} />}
    </div>
  );
}









