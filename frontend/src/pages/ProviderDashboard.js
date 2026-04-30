import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "./ProviderDashboard.css";

const getAllowedSections = (role) => {
  if (role === "service_provider") return ["packages", "promotions", "requests", "security"];
  if (role === "delivery_management" || role === "insurance") return ["requests", "security"];
  return ["security"];
};

const SECTION_LABELS = {
  packages: "Packages",
  promotions: "Promotions",
  requests: "Requests",
  security: "Security"
};

const formatDateOnly = (value) => {
  if (!value) return "-";
  if (typeof value === "string") return value.split("T")[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().split("T")[0];
};

const ProviderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeSection, setActiveSection] = useState("requests");
  const [editingItem, setEditingItem] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const [form, setForm] = useState({
    selectedPackage: "",
    name: "",
    price: "",
    description: "",
    duration: "",
    discount: "",
    promotionTopic: "",
    promotionStartDate: "",
    promotionEndDate: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const allowedSections = getAllowedSections(user?.role);

  useEffect(() => {
    if (!allowedSections.includes(activeSection)) {
      setActiveSection(allowedSections[0]);
    }
  }, [activeSection, user?.role]);

  const getApiErrorMessage = (err, fallback) =>
    err?.response?.data?.msg ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback;

  const promotionPreviewPrice = (() => {
    const price = Number(form.price);
    const discount = Number(form.discount);

    if (
      activeSection !== "promotions" ||
      Number.isNaN(price) ||
      Number.isNaN(discount) ||
      form.price === "" ||
      form.discount === ""
    ) {
      return null;
    }

    const finalPrice = price - (price * discount) / 100;
    return finalPrice >= 0 ? finalPrice.toFixed(2) : null;
  })();

  // FETCH DATA 
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [normalRes, promotionRes, reqRes, packageReqRes] = await Promise.allSettled([
        API.get("/packages/normal"),
        API.get("/packages/promotion"),
        API.get("/requests"),
        API.get("/requests/package-bookings")
      ]);

      const normalData = normalRes.status === "fulfilled" ? normalRes.value.data : [];
      const promotionData = promotionRes.status === "fulfilled" ? promotionRes.value.data : [];
      const reqData = reqRes.status === "fulfilled" ? reqRes.value.data : [];
      const packageReqData = packageReqRes.status === "fulfilled" ? packageReqRes.value.data : [];

      setPackages(normalData);
      setPromotions(promotionData);
      const allRequests = [...(reqData || []), ...(packageReqData || [])];
      const uniqueRequests = Array.from(
        new Map(allRequests.map((item) => [item._id, item])).values()
      );
      setRequests(uniqueRequests);

      if (
        normalRes.status === "rejected" ||
        promotionRes.status === "rejected" ||
        reqRes.status === "rejected" ||
        packageReqRes.status === "rejected"
      ) {
        console.error("PARTIAL FETCH ERRORS:", {
          packages: normalRes.status === "rejected" ? normalRes.reason?.response?.data || normalRes.reason?.message : null,
          promotions: promotionRes.status === "rejected" ? promotionRes.reason?.response?.data || promotionRes.reason?.message : null,
          requests: reqRes.status === "rejected" ? reqRes.reason?.response?.data || reqRes.reason?.message : null,
          packageBookings: packageReqRes.status === "rejected" ? packageReqRes.reason?.response?.data || packageReqRes.reason?.message : null
        });
      }
    } catch (err) {
      console.error("FETCH DATA ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Server Error while fetching data"));
    }
  };

  //FORM HANDLERS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = () => {
    setForm({
      selectedPackage: "",
      name: "",
      price: "",
      description: "",
      duration: "",
      discount: "",
      promotionTopic: "",
      promotionStartDate: "",
      promotionEndDate: ""
    });
    setFormErrors({});
    setEditingItem(null);
  };

  const switchSection = (section) => {
    if (!allowedSections.includes(section)) {
      alert("You are not authorized to access this section");
      return;
    }
    setActiveSection(section);
    setFormErrors({});
    setPasswordErrors({});
    if (section === "packages" || section === "promotions") resetForm();
  };

   //validation for period date when apply the future date while creating a promotion

  const validateServiceForm = ({ isPromotion, requireSelectedPackage = false }) => {
    const errors = {};
    if (requireSelectedPackage && !form.selectedPackage) errors.selectedPackage = "Select a package";
    if (!form.name.trim()) errors.name = "Name is required";
    if (form.price === "" || Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
      errors.price = "Enter a valid price";
    }
    if (!form.duration.trim()) errors.duration = "Duration is required";

    if (isPromotion) {
      const discount = Number(form.discount);
      if (form.discount === "" || Number.isNaN(discount) || discount <= 0 || discount > 100) {
        errors.discount = "Discount must be 1-100";
      }

      //Start and End Date Validation

      if (!form.promotionTopic.trim()) errors.promotionTopic = "Promotion topic is required";
      if (!form.promotionStartDate) errors.promotionStartDate = "Start date is required";
      if (!form.promotionEndDate) errors.promotionEndDate = "End date is required";
      if (form.promotionStartDate && form.promotionEndDate) {
        const startDate = new Date(form.promotionStartDate);
        const endDate = new Date(form.promotionEndDate);
        if (endDate < startDate) {
          errors.promotionEndDate = "End date must be after start date";
        }
      }
    }

    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwordForm.currentPassword) errs.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) errs.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 6) errs.newPassword = "Minimum 6 characters";
    if (!passwordForm.confirmPassword) errs.confirmPassword = "Please confirm password";
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setPasswordErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setSavingPassword(true);
      await API.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to change password"));
    } finally {
      setSavingPassword(false);
    }
  };

  const startEditing = (item, type) => {
    setEditingItem({
      id: item._id,
      type
    });
    setForm({
      name: item.name || "",
      price: item.price?.toString() || "",
      description: item.description || "",
      duration: item.duration || "",
      discount:
        type === "promotion" && item.discount !== undefined
          ? item.discount.toString()
          : "",
      promotionTopic: type === "promotion" ? item.promotionTopic || "" : "",
      promotionStartDate:
        type === "promotion" && item.promotionStartDate
          ? new Date(item.promotionStartDate).toISOString().split("T")[0]
          : "",
      promotionEndDate:
        type === "promotion" && item.promotionEndDate
          ? new Date(item.promotionEndDate).toISOString().split("T")[0]
          : ""
    });
    setActiveSection(type === "promotion" ? "promotions" : "packages");
  };

  const updatePackage = async () => {
    if (!editingItem?.id) return;

    try {
      const isPromotion = editingItem.type === "promotion";
      const errs = validateServiceForm({ isPromotion });
      setFormErrors(errs);
      if (Object.keys(errs).length) return;

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || "No description",
        duration: form.duration.trim(),
        type: isPromotion ? "promotion" : "normal"
      };

      if (isPromotion) {
        payload.discount = Number(form.discount);
        payload.promotionTopic = form.promotionTopic.trim();
        payload.promotionStartDate = form.promotionStartDate;
        payload.promotionEndDate = form.promotionEndDate;
      }

      const endpoint = isPromotion
        ? `/packages/promotion/${editingItem.id}`
        : `/packages/normal/${editingItem.id}`;

      await API.put(endpoint, payload);
      alert(`${isPromotion ? "Promotion" : "Package"} updated successfully`);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("UPDATE PACKAGE ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to update package"));
    }
  };

  // CREATE PACKAGE 
  const createPackage = async () => {
    try {
      const errs = validateServiceForm({ isPromotion: false });
      setFormErrors(errs);
      if (Object.keys(errs).length) return;

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || "No description",
        duration: form.duration.trim(),
        type: "normal"
      };

      await API.post("/packages/normal", payload);
      alert("Package created successfully");
      resetForm();
      fetchData();

 } catch (err) {
  console.error("CREATE PACKAGE ERROR:", err.response?.data || err.message);
  alert(getApiErrorMessage(err, "Failed to create package"));
}
  };

  // CREATE PROMOTION
  const createPromotion = async () => {
    try {
      const errs = validateServiceForm({ isPromotion: true, requireSelectedPackage: true });
      setFormErrors(errs);
      if (Object.keys(errs).length) return;

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || "No description",
        duration: form.duration.trim(),
        discount: Number(form.discount),
        promotionTopic: form.promotionTopic.trim(),
        promotionStartDate: form.promotionStartDate,
        promotionEndDate: form.promotionEndDate,
        type: "promotion"
      };

      await API.post("/packages/promotion", payload);
      alert("Promotion created successfully");
      resetForm();
      fetchData();

    } catch (err) {
      console.error("CREATE PROMOTION ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to create promotion"));
    }
  };

  // DELETE
  const deletePackage = async (id, type) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const endpoint =
        type === "promotion"
          ? `/packages/promotion/${id}`
          : `/packages/normal/${id}`;
      await API.delete(endpoint);
      fetchData();
    } catch (err) {
      console.error("DELETE PACKAGE ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to delete package"));
    }
  };

  // APPOINTMENT / REQUEST HANDLERS with validation
  const setAppointment = async (id) => {
    const date = prompt("Enter Date & Time (YYYY-MM-DD HH:mm)");
    const fee = prompt("Enter Appointment Fee");

    if (!date || !fee) return;
    if (isNaN(fee)) return alert("Fee must be number");

    const selectedDate = new Date(date);
    if (selectedDate < new Date()) return alert("Cannot select past date");

    try {
      await API.put(`/requests/${id}/appointment`, {
        date,
        fee: Number(fee)
      });
      fetchData();
    } catch (err) {
      console.error("SET APPOINTMENT ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to set appointment"));
    }
  };

  const approveRequest = async (id) => {
    const req = requests.find(r => r._id === id);
    if (!req || req.paymentStatus !== "Paid") {
      return alert("User must pay first!");
    }
    const note = prompt("Add note (optional)");
    try {
      await API.put(`/requests/${id}/approve`, { note });
      fetchData();
    } catch (err) {
      console.error("APPROVE REQUEST ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to approve request"));
    }
  };

  const rejectRequest = async (id) => {
    if (!window.confirm("Reject this request?")) return;
    try {
      await API.put(`/requests/${id}/reject`);
      fetchData();
    } catch (err) {
      console.error("REJECT REQUEST ERROR:", err.response?.data || err.message);
      alert(getApiErrorMessage(err, "Failed to reject request"));
    }
  };

  const getStatus = (r) => {
    if (r.status === "Rejected") return "❌ Rejected";
    if (r.status === "Approved") return "✔ Approved";
    if (r.status === "Waiting Payment" && r.paymentStatus !== "Paid") return "Waiting Payment";
    if (r.paymentStatus === "Paid") return "✅ Paid";
    return "⏳ Pending";
  };

  const packageRequests = requests.filter(
    (r) => r.requestType === "package-booking"
  );
  const userRequests = requests.filter(
    (r) => r.requestType !== "package-booking"
  );

  // User Interface
  return (
    <div className="dashboard-container">
      <div className="provider-header">
        <div>
          <h1 className="title">Service Provider Dashboard</h1>
          <div className="subtitle">{user?.name} ({user?.role})</div>
        </div>
        <button
          className="secondary-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sign Out
        </button>
      </div>

      <div className="stats">
        <div className="card">📦 Packages: {packages.length}</div>
        <div className="card">🔥 Promotions: {promotions.length}</div>
        <div className="card">📋 Requests: {requests.length}</div>
      </div>

      <div className="tabs">
        {allowedSections.map((section) => (
          <button
            key={section}
            className={activeSection === section ? "active" : ""}
            onClick={() => switchSection(section)}
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </div>

      {activeSection === "packages" && (
        <div className="section">
          <h2>Service Packages</h2>
          <div className="form">
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              style={formErrors.name ? { borderColor: "var(--error)" } : undefined}
            />
            {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            <input
              name="price"
              placeholder="Price (Rs)"
              value={form.price}
              onChange={handleChange}
              style={formErrors.price ? { borderColor: "var(--error)" } : undefined}
            />
            {formErrors.price && <div className="field-error">{formErrors.price}</div>}
            <input
              name="duration"
              placeholder="Duration"
              value={form.duration}
              onChange={handleChange}
              style={formErrors.duration ? { borderColor: "var(--error)" } : undefined}
            />
            {formErrors.duration && <div className="field-error">{formErrors.duration}</div>}
            <input
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              style={formErrors.description ? { borderColor: "var(--error)" } : undefined}
            />
            {formErrors.description && <div className="field-error">{formErrors.description}</div>}
            <button onClick={editingItem?.type === "normal" ? updatePackage : createPackage}>
              {editingItem?.type === "normal" ? "Update Package" : "+ Add Package"}
            </button>
            {editingItem?.type === "normal" && (
              <button type="button" className="secondary-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>Rs. {p.price}</td>
                  <td>{p.duration}</td>
                  <td>{p.description}</td>
                  <td>
                    <button className="btn-edit" onClick={() => startEditing(p, "normal")}>Edit</button>
                    <button className="btn-delete" onClick={() => deletePackage(p._id, "normal")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "promotions" && (
       <div className="section">
  <h2>Promotion Packages</h2>

  <div className="form promo-form">
    <div className="promo-form-grid">
      <div className="promo-field">
        <label>Select Package</label>
        <select
          name="selectedPackage"
          value={form.selectedPackage || ""}
          onChange={(e) => {
            const pkgId = e.target.value;
            const pkg = packages.find((p) => p._id === pkgId);
            if (pkg) {
              setForm((prev) => ({
                ...prev,
                selectedPackage: pkg._id,
                name: pkg.name,
                price: pkg.price,
                duration: pkg.duration,
                description: pkg.description
              }));
            } else {
              setForm((prev) => ({ ...prev, selectedPackage: "" }));
            }
            setFormErrors((prev) => ({ ...prev, selectedPackage: "" }));
          }}
          style={formErrors.selectedPackage ? { borderColor: "var(--error)" } : undefined}
        >
          <option value="">-- Select a Package --</option>
          {packages.map((pkg) => (
            <option key={pkg._id} value={pkg._id}>
              {pkg.name} - Rs. {pkg.price}
            </option>
          ))}
        </select>
        {formErrors.selectedPackage && <div className="field-error">{formErrors.selectedPackage}</div>}
      </div>

      <div className="promo-field">
        <label>Discount (%)</label>
        <input
          name="discount"
          placeholder="Discount %"
          value={form.discount}
          onChange={handleChange}
          style={formErrors.discount ? { borderColor: "var(--error)" } : undefined}
        />
        {formErrors.discount && <div className="field-error">{formErrors.discount}</div>}
      </div>

      <div className="promo-field promo-field-span-2">
        <label>Why This Promotion</label>
        <input
          name="promotionTopic"
          placeholder="Enter promotion reason/topic"
          value={form.promotionTopic}
          onChange={handleChange}
          style={formErrors.promotionTopic ? { borderColor: "var(--error)" } : undefined}
        />
        {formErrors.promotionTopic && <div className="field-error">{formErrors.promotionTopic}</div>}
      </div>

      <div className="promo-field">
        <label>Promotion Start Date</label>
        <input
          type="date"
          name="promotionStartDate"
          value={form.promotionStartDate}
          onChange={handleChange}
          style={formErrors.promotionStartDate ? { borderColor: "var(--error)" } : undefined}
        />
        {formErrors.promotionStartDate && <div className="field-error">{formErrors.promotionStartDate}</div>}
      </div>

      <div className="promo-field">
        <label>Promotion End Date</label>
        <input
          type="date"
          name="promotionEndDate"
          value={form.promotionEndDate}
          onChange={handleChange}
          style={formErrors.promotionEndDate ? { borderColor: "var(--error)" } : undefined}
        />
        {formErrors.promotionEndDate && <div className="field-error">{formErrors.promotionEndDate}</div>}
      </div>
    </div>

    {promotionPreviewPrice !== null && (
      <p className="price-preview">Calculated Price: Rs. {promotionPreviewPrice}</p>
    )}

    <div className="promo-form-actions">
      <button
        onClick={
          editingItem?.type === "promotion" ? updatePackage : createPromotion
        }
      >
        {editingItem?.type === "promotion"
          ? "Update Promotion"
          : "+ Add Promotion"}
      </button>

      {editingItem?.type === "promotion" && (
        <button type="button" className="secondary-btn" onClick={resetForm}>
          Cancel
        </button>
      )}
    </div>
  </div>


          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Original Price</th>
                <th>Final Price</th>
                <th>Duration</th>
                <th>Discount</th>
                <th>Promotion Topic</th>
                <th>Promotion Period</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>Rs. {p.price}</td>
                  <td>Rs. {p.finalPrice ?? p.price}</td>
                  <td>{p.duration}</td>
                  <td>{p.discount}%</td>
                  <td>{p.promotionTopic || "-"}</td>
                  <td>
                    {p.promotionStartDate && p.promotionEndDate
                      ? `${formatDateOnly(p.promotionStartDate)} - ${formatDateOnly(p.promotionEndDate)}`
                      : "-"}
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => startEditing(p, "promotion")}>Edit</button>
                    <button className="btn-delete" onClick={() => deletePackage(p._id, "promotion")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "requests" && (
        <div className="section">
          <h2>Service Package Requests</h2>
          <table>
            <thead>
              <tr>
                <th>Service Package</th>
                <th>Package Type</th>
                <th>Request Date</th>
                <th>Appointment</th>
                <th>Fee</th>
                <th>Status</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packageRequests.map(r => (
                <tr key={r._id}>
                  <td>{r.serviceName || r.problem || "-"}</td>
                  <td>{r.packageType || "-"}</td>
                  <td>{(r.requestDate || r.createdAt) ? new Date(r.requestDate || r.createdAt).toLocaleString() : "-"}</td>
                  <td>{r.appointmentDate || "Not Scheduled"}</td>
                  <td>{r.appointmentFee ? `Rs. ${r.appointmentFee}` : "-"}</td>
                  <td>{getStatus(r)}</td>
                  
                  <td>
                    <div className="request-actions">
                      <button className="btn-set" onClick={() => setAppointment(r._id)}>Set</button>
                      <button
                        className="btn-approve"
                        onClick={() => approveRequest(r._id)}
                        disabled={r.paymentStatus !== "Paid"}
                        title={
                          r.paymentStatus !== "Paid"
                            ? "User must pay before approval"
                            : "Approve request"
                        }
                      >
                        Approve
                      </button>
                      {r.paymentStatus !== "Paid" && (
                        <span style={{ fontSize: 11, color: "var(--warning)", fontWeight: 700 }}>
                          Waiting user payment
                        </span>
                      )}
                      <button className="btn-reject" onClick={() => rejectRequest(r._id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ marginTop: "24px" }}>User Requests / Appointments</h2>
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Vehicle</th>
                <th>Brand</th>
                <th>Year</th>
                <th>Request Date</th>
                <th>Appointment</th>
                <th>Fee</th>
                <th>Status</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRequests.map(r => (
                <tr key={r._id}>
                  <td>{r.problem || "-"}</td>
                  <td>{r.vehicle || "-"}</td>
                  <td>{r.brand || "-"}</td>
                  <td>{r.year || "-"}</td>
                  <td>{(r.requestDate || r.createdAt) ? new Date(r.requestDate || r.createdAt).toLocaleString() : "-"}</td>
                  <td>{r.appointmentDate || "Not Scheduled"}</td>
                  <td>{r.appointmentFee ? `Rs. ${r.appointmentFee}` : "-"}</td>
                  <td>{getStatus(r)}</td>
                  
                  <td>
                    <div className="request-actions">
                      <button className="btn-set" onClick={() => setAppointment(r._id)}>Set</button>
                      <button
                        className="btn-approve"
                        onClick={() => approveRequest(r._id)}
                        disabled={r.paymentStatus !== "Paid"}
                        title={
                          r.paymentStatus !== "Paid"
                            ? "User must pay before approval"
                            : "Approve request"
                        }
                      >
                        Approve
                      </button>
                      {r.paymentStatus !== "Paid" && (
                        <span style={{ fontSize: 11, color: "var(--warning)", fontWeight: 700 }}>
                          Waiting user payment
                        </span>
                      )}
                      <button className="btn-reject" onClick={() => rejectRequest(r._id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === "security" && (
        <div className="section">
          <h2>Change Password</h2>
          <form className="form" onSubmit={handlePasswordChange}>
            <input
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }));
                setPasswordErrors((p) => ({ ...p, currentPassword: "" }));
              }}
              style={passwordErrors.currentPassword ? { borderColor: "var(--error)" } : undefined}
            />
            {passwordErrors.currentPassword && <div className="field-error">{passwordErrors.currentPassword}</div>}
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                setPasswordErrors((p) => ({ ...p, newPassword: "" }));
              }}
              style={passwordErrors.newPassword ? { borderColor: "var(--error)" } : undefined}
            />
            {passwordErrors.newPassword && <div className="field-error">{passwordErrors.newPassword}</div>}
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => {
                setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                setPasswordErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              style={passwordErrors.confirmPassword ? { borderColor: "var(--error)" } : undefined}
            />
            {passwordErrors.confirmPassword && <div className="field-error">{passwordErrors.confirmPassword}</div>}
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
