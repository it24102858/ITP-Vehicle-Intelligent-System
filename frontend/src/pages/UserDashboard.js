import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import PaymentModal from "../components/PaymentModal";
import { downloadAppointmentPdf } from "../utils/appointmentPdf";
import {
  getPackages,
  getPromotions,
  applyService,
  createRequest,
  getRequests,
  deleteRequest,
  updateRequest,
  payRequest,
} from "../services/api";
import { getMyDeliveries } from "../services/deliveryService";
import { formatDate, shortId } from "../utils/statusHelpers";

const formatLKR = (amount) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const panel = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: 16,
};

const DASHBOARD_TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "services", label: "Vehicle Services", icon: "🔧" },
  { id: "services1", label: "Delivery Service", icon: "🚚" },
  { id: "services2", label: "Insurance Service", icon: "🛡️" },
];

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          letterSpacing: "0.04em",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 5 }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatusPill({ value, type }) {
  const lower = String(value || "").toLowerCase();
  let style = { background: "rgba(107,114,128,0.18)", color: "#9ca3af" };

  if (type === "payment") {
    style =
      lower === "paid"
        ? { background: "rgba(34,197,94,0.16)", color: "#22c55e" }
        : { background: "rgba(239,68,68,0.16)", color: "#ef4444" };
  }

  if (type === "request") {
    if (lower === "approved")
      style = { background: "rgba(34,197,94,0.16)", color: "#22c55e" };
    else if (lower === "pending")
      style = { background: "rgba(245,158,11,0.16)", color: "#f59e0b" };
    else if (lower === "rejected")
      style = { background: "rgba(239,68,68,0.16)", color: "#ef4444" };
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {value || "-"}
    </span>
  );
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryLookup, setDeliveryLookup] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [profileEdit, setProfileEdit] = useState(false);

  const [requestForm, setRequestForm] = useState({
    problem: "",
    vehicle: "",
    brand: "",
    year: "",
  });
  const [requestErrors, setRequestErrors] = useState({});

  const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback;

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const packageRequests = useMemo(
    () => requests.filter((item) => item.requestType === "package-booking"),
    [requests],
  );

  const customRequests = useMemo(
    () => requests.filter((item) => item.requestType !== "package-booking"),
    [requests],
  );
  const pendingPaymentCount = useMemo(
    () =>
      requests.filter(
        (item) => item.appointmentFee && item.paymentStatus !== "Paid",
      ).length,
    [requests],
  );
  const approvedAppointmentCount = useMemo(
    () =>
      requests.filter(
        (item) => item.appointmentDate && item.status === "Approved",
      ).length,
    [requests],
  );
  const inTransitDeliveries = useMemo(
    () =>
      deliveries.filter(
        (item) => item.status === "Assigned" || item.status === "Shipped",
      ).length,
    [deliveries],
  );
  const deliveredCount = useMemo(
    () => deliveries.filter((item) => item.status === "Delivered").length,
    [deliveries],
  );
  const latestDeliveries = useMemo(
    () =>
      [...deliveries]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 6),
    [deliveries],
  );

  const resolveDeliverySearchTerm = () => {
    const fromProfile = String(profileForm.name || "").trim();
    if (fromProfile) return fromProfile;
    const fromUser = String(user?.name || "").trim();
    if (fromUser) return fromUser;
    return "";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const searchTerm = resolveDeliverySearchTerm();
      const [pkg, promo, reqs, myDeliveriesRes] = await Promise.all([
        getPackages(),
        getPromotions(),
        getRequests(),
        searchTerm
          ? getMyDeliveries(searchTerm)
          : Promise.resolve({ data: { data: [] } }),
      ]);
      setPackages(pkg.data || []);
      setPromotions(promo.data || []);
      setRequests(reqs.data || []);
      setDeliveries(myDeliveriesRes?.data?.data || []);
      setDeliveryLookup(searchTerm);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error("Name is required");
    if (!profileForm.email.trim()) return toast.error("Email is required");

    try {
      const raw = localStorage.getItem("user");
      const current = raw ? JSON.parse(raw) : {};
      const updated = { ...current, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile updated locally");
      setProfileEdit(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const handleApply = async (service) => {
    if (!window.confirm("Apply this service package?")) return;
    try {
      const appliedPrice =
        service.type === "promotion"
          ? (service.finalPrice ?? service.price)
          : service.price;
      await applyService({
        packageId: service._id,
        name: service.name,
        price: appliedPrice,
        originalPrice: service.price,
        discount: service.type === "promotion" ? service.discount : 0,
        finalPrice:
          service.type === "promotion"
            ? (service.finalPrice ?? service.price)
            : service.price,
        type: service.type || "normal",
        applyDate: new Date(),
      });
      toast.success("Service applied");
      fetchData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to apply service"));
    }
  };

  //Validation User Request Form

  const handleRequest = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!requestForm.problem.trim()) errors.problem = "Problem is required";
    if (!requestForm.vehicle.trim()) errors.vehicle = "Vehicle is required";
    if (!requestForm.brand.trim()) errors.brand = "Brand is required";
    if (!requestForm.year.trim()) errors.year = "Year is required";
    else if (!/^\d{4}$/.test(requestForm.year.trim()))
      errors.year = "Year must be 4 digits";
    setRequestErrors(errors);
    if (Object.keys(errors).length > 0)
      return toast.error("Please fill all required fields correctly");

    try {
      await createRequest({
        ...requestForm,
        status: "Pending",
        paymentStatus: "Unpaid",
        requestType: "custom",
        assignedRole: "service_provider",
      });
      toast.success("Request submitted");
      setRequestForm({
        problem: "",
        vehicle: "",
        brand: "",
        year: "",
      });
      setRequestErrors({});
      fetchData();
      setActiveTab("services");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create request"));
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    try {
      await deleteRequest(id);
      setRequests((prev) => prev.filter((item) => item._id !== id));
      toast.success("Request deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Delete failed"));
    }
  };

  const handleEditRequest = async (item) => {
    if (item.status !== "Pending")
      return toast.info("Only pending requests can be edited");
    const updatedProblem = prompt("Edit your problem:", item.problem || "");
    if (!updatedProblem || updatedProblem === item.problem) return;
    try {
      await updateRequest(item._id, { problem: updatedProblem });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === item._id ? { ...r, problem: updatedProblem } : r,
        ),
      );
      toast.success("Request updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Update failed"));
    }
  };

  const handlePay = (item) => {
    setSelectedRequest(item);
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    if (!selectedRequest) return;
    try {
      await payRequest(selectedRequest._id);
      setRequests((prev) =>
        prev.map((r) =>
          r._id === selectedRequest._id ? { ...r, paymentStatus: "Paid" } : r,
        ),
      );
      setShowPayment(false);
      setSelectedRequest(null);
      toast.success("Payment marked as paid");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Payment failed"));
    }
  };

  const openDeliveryPortal = () => navigate("/client/my-deliveries");
  const openNewDelivery = () => navigate("/client/new");

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            ...panel,
            marginBottom: 14,
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(232,64,28,0.08), var(--bg-card))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(30px, 5vw, 42px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  color: "var(--text-primary)",
                }}
              >
                USER PROFILE DASHBOARD
              </h1>
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  fontSize: 13,
                }}
              >
                Manage your profile, vehicle marketplace access, and service
                activities in one place.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/marketplace")}
              >
                Go To Marketplace
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 8,
          }}
        >
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              className="btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:
                  activeTab === tab.id ? "var(--accent)" : "var(--bg-card)",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                border:
                  "1px solid " +
                  (activeTab === tab.id ? "var(--accent)" : "var(--border)"),
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            <div style={panel}>
              <SectionTitle
                title="My Profile"
                subtitle="Your account details"
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "var(--accent-dim)",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {String(profileForm.name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div
                    style={{ color: "var(--text-primary)", fontWeight: 700 }}
                  >
                    {profileForm.name || "User"}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {user?.role || "buyer"}
                  </div>
                </div>
              </div>

              {!profileEdit ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      Email
                    </div>
                    <div style={{ color: "var(--text-primary)", fontSize: 14 }}>
                      {profileForm.email || "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      Phone
                    </div>
                    <div style={{ color: "var(--text-primary)", fontSize: 14 }}>
                      {profileForm.phone || "-"}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setProfileEdit(true)}
                    style={{ width: "fit-content" }}
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={saveProfile}
                  style={{ display: "grid", gap: 10 }}
                >
                  <input
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Name"
                  />
                  <input
                    className="form-input"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="Email"
                  />
                  <input
                    className="form-input"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="Phone"
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setProfileEdit(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  ...panel,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Available Packages",
                    value: packages.length,
                    color: "#3b82f6",
                  },
                  {
                    label: "Promotions",
                    value: promotions.length,
                    color: "#f59e0b",
                  },
                  {
                    label: "Applied Services",
                    value: packageRequests.length,
                    color: "#22c55e",
                  },
                  {
                    label: "Custom Requests",
                    value: customRequests.length,
                    color: "#a855f7",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 28,
                        lineHeight: 1,
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 11,
                        marginTop: 5,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div style={panel}>
                <SectionTitle title="Other Services" subtitle="Quick access" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate("/marketplace")}
                    style={{ justifyContent: "flex-start" }}
                  >
                    Vehicle Marketplace
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("services")}
                    style={{ justifyContent: "flex-start" }}
                  >
                    Vehicle Services
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={openDeliveryPortal}
                    style={{ justifyContent: "flex-start" }}
                  >
                    Delivery Service
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("services2")}
                    style={{ justifyContent: "flex-start" }}
                  >
                    Insurance Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div
            style={{
              display: "grid",
              gap: 24,
              marginTop: 18,
              marginBottom: 20,
            }}
          >
            <div style={panel}>
              <SectionTitle
                title="Service Packages"
                subtitle="Choose and apply a package"
              />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 8,
                }}
              >
                {packages.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No packages available.
                  </div>
                ) : (
                  packages.map((s) => (
                    <div
                      key={s._id}
                      style={{
                        minWidth: 255,
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 12,
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 700,
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        style={{
                          color: "var(--accent)",
                          fontFamily: "var(--font-display)",
                          fontSize: 24,
                          marginTop: 4,
                        }}
                      >
                        {formatLKR(s.price)}
                      </div>
                      <div
                        style={{ color: "var(--text-secondary)", fontSize: 12 }}
                      >
                        {s.duration}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: 12,
                          marginTop: 6,
                          minHeight: 32,
                        }}
                      >
                        {s.description}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={() => handleApply(s)}
                      >
                        Apply
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={panel}>
              <SectionTitle title="Promotions" subtitle="Limited time offers" />
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 8,
                }}
              >
                {promotions.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    No promotions available.
                  </div>
                ) : (
                  promotions.map((s) => (
                    (() => {
                      const topicText =
                        s.promotionTopic ||
                        s.promotiontopic ||
                        s.topic ||
                        s.description ||
                        "Not provided";
                      const periodText =
                        s.promotionStartDate && s.promotionEndDate
                          ? `${new Date(s.promotionStartDate).toLocaleDateString()} - ${new Date(s.promotionEndDate).toLocaleDateString()}`
                          : "Not provided";
                      return (
                    <div
                      key={s._id}
                      style={{
                        minWidth: 270,
                        border: "1px solid rgba(245,158,11,0.4)",
                        borderRadius: 10,
                        padding: 12,
                        background:
                          "linear-gradient(145deg, rgba(245,158,11,0.12), var(--bg-elevated))",
                      }}
                    >
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 700,
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ marginTop: 5 }}>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            textDecoration: "line-through",
                            fontSize: 12,
                          }}
                        >
                          {formatLKR(s.price)}
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#f59e0b",
                            fontFamily: "var(--font-display)",
                            fontSize: 22,
                          }}
                        >
                          {formatLKR(s.finalPrice ?? s.price)}
                        </span>
                      </div>
                      <div
                        style={{ color: "var(--text-secondary)", fontSize: 12 }}
                      >
                        {s.duration} - {s.discount}% off
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(245,158,11,0.38)",
                          background: "rgba(245,158,11,0.12)",
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 22,
                        }}
                      >
                        <span style={{ color: "#f59e0b" }}>Promotion</span>{" "}
                        <span style={{ color: "var(--text-primary)" }}>{topicText}</span>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          padding: "6px 8px",
                          borderRadius: 8,
                          border: "1px solid rgba(59,130,246,0.4)",
                          background: "rgba(59,130,246,0.12)",
                          color: "#93c5fd",
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 22,
                        }}
                      >
                        Period: {periodText}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={() => handleApply(s)}
                      >
                        Apply Promotion
                      </button>
                    </div>
                      );
                    })()
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            <div style={panel}>
              <SectionTitle
                title="Create Service Request"
                subtitle="Submit custom issue details"
              />
              <form onSubmit={handleRequest}>
                <div className="form-group">
                  <label className="form-label">Problem *</label>
                  <textarea
                    className="form-textarea"
                    value={requestForm.problem}
                    onChange={(e) => {
                      setRequestForm((p) => ({
                        ...p,
                        problem: e.target.value,
                      }));
                      setRequestErrors((p) => ({ ...p, problem: "" }));
                    }}
                    style={{
                      minHeight: 86,
                      borderColor: requestErrors.problem
                        ? "var(--error)"
                        : undefined,
                    }}
                  />
                  {requestErrors.problem && (
                    <div
                      style={{
                        color: "var(--error)",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {requestErrors.problem}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div>
                    <input
                      className="form-input"
                      placeholder="Vehicle *"
                      value={requestForm.vehicle}
                      onChange={(e) => {
                        setRequestForm((p) => ({
                          ...p,
                          vehicle: e.target.value,
                        }));
                        setRequestErrors((p) => ({ ...p, vehicle: "" }));
                      }}
                      style={{
                        borderColor: requestErrors.vehicle
                          ? "var(--error)"
                          : undefined,
                      }}
                    />
                    {requestErrors.vehicle && (
                      <div
                        style={{
                          color: "var(--error)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {requestErrors.vehicle}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      className="form-input"
                      placeholder="Brand *"
                      value={requestForm.brand}
                      onChange={(e) => {
                        setRequestForm((p) => ({
                          ...p,
                          brand: e.target.value,
                        }));
                        setRequestErrors((p) => ({ ...p, brand: "" }));
                      }}
                      style={{
                        borderColor: requestErrors.brand
                          ? "var(--error)"
                          : undefined,
                      }}
                    />
                    {requestErrors.brand && (
                      <div
                        style={{
                          color: "var(--error)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {requestErrors.brand}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      className="form-input"
                      placeholder="Year *"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      value={requestForm.year}
                      onChange={(e) => {
                        const onlyDigits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setRequestForm((p) => ({ ...p, year: onlyDigits }));
                        setRequestErrors((p) => ({ ...p, year: "" }));
                      }}
                      style={{
                        borderColor: requestErrors.year
                          ? "var(--error)"
                          : undefined,
                      }}
                    />
                    {requestErrors.year && (
                      <div
                        style={{
                          color: "var(--error)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {requestErrors.year}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                >
                  Submit Request
                </button>
              </form>
            </div>

            <div style={panel}>
              <SectionTitle
                title="Applied Package Services"
                subtitle="Track package bookings and payments"
              />
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Type</th>
                      <th>Appointment</th>
                      <th>Fee</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No applied package services
                        </td>
                      </tr>
                    ) : (
                      packageRequests.map((item) => (
                        <tr key={item._id}>
                          <td>{item.serviceName || item.problem || "-"}</td>
                          <td>{item.packageType || "-"}</td>
                          <td>{item.appointmentDate || "-"}</td>
                          <td>
                            {item.appointmentFee
                              ? formatLKR(item.appointmentFee)
                              : "-"}
                          </td>
                          <td>
                            <StatusPill
                              type="payment"
                              value={item.paymentStatus || "Unpaid"}
                            />
                          </td>
                          <td>
                            <StatusPill
                              type="request"
                              value={item.status || "Pending"}
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{
                                  color: "#ef4444",
                                  borderColor: "rgba(239,68,68,0.4)",
                                }}
                                onClick={() => handleDeleteRequest(item._id)}
                              >
                                Delete
                              </button>
                              {item.appointmentFee &&
                                item.paymentStatus !== "Paid" && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handlePay(item)}
                                  >
                                    Pay
                                  </button>
                                )}
                              {item.appointmentDate &&
                                item.status === "Approved" && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() =>
                                      downloadAppointmentPdf({
                                        ...item,
                                        buyerName:
                                          profileForm.name ||
                                          user?.name ||
                                          item.buyerName,
                                      })
                                    }
                                  >
                                    PDF
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={panel}>
              <SectionTitle
                title="Custom Service Requests"
                subtitle="Edit or manage your created requests"
              />
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Problem</th>
                      <th>Vehicle</th>
                      <th>Appointment</th>
                      <th>Fee</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No custom service requests
                        </td>
                      </tr>
                    ) : (
                      customRequests.map((item) => (
                        <tr key={item._id}>
                          <td>{item.problem || "-"}</td>
                          <td>
                            {[item.vehicle, item.brand, item.year]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </td>
                          <td>{item.appointmentDate || "-"}</td>
                          <td>
                            {item.appointmentFee
                              ? formatLKR(item.appointmentFee)
                              : "-"}
                          </td>
                          <td>
                            <StatusPill
                              type="payment"
                              value={item.paymentStatus || "Unpaid"}
                            />
                          </td>
                          <td>
                            <StatusPill
                              type="request"
                              value={item.status || "Pending"}
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{
                                  color: "#ef4444",
                                  borderColor: "rgba(239,68,68,0.4)",
                                }}
                                onClick={() => handleDeleteRequest(item._id)}
                              >
                                Delete
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{
                                  color: "#3b82f6",
                                  borderColor: "rgba(59,130,246,0.45)",
                                }}
                                onClick={() => handleEditRequest(item)}
                              >
                                Edit
                              </button>
                              {item.appointmentFee &&
                                item.paymentStatus !== "Paid" && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handlePay(item)}
                                  >
                                    Pay
                                  </button>
                                )}
                              {item.appointmentDate &&
                                item.status === "Approved" && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() =>
                                      downloadAppointmentPdf({
                                        ...item,
                                        buyerName:
                                          profileForm.name ||
                                          user?.name ||
                                          item.buyerName,
                                      })
                                    }
                                  >
                                    PDF
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services1" && (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            <div
              style={{
                ...panel,
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(59,130,246,0.1), var(--bg-card))",
              }}
            >
              <SectionTitle
                title="Delivery Service Portal"
                subtitle="Plan, submit, and monitor delivery requests with a smoother flow"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Delivery Requests",
                    value: deliveries.length,
                    color: "#f59e0b",
                  },
                  {
                    label: "In Transit",
                    value: inTransitDeliveries,
                    color: "#3b82f6",
                  },
                  {
                    label: "Delivered",
                    value: deliveredCount,
                    color: "#22c55e",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 28,
                        lineHeight: 1,
                        color: card.color,
                      }}
                    >
                      {card.value}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 11,
                        marginTop: 5,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              <div style={panel}>
                <SectionTitle
                  title="Quick Actions"
                  subtitle="Jump directly to delivery operations"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                  }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={openNewDelivery}
                    style={{ justifyContent: "flex-start" }}
                  >
                    + Create New Delivery
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={openDeliveryPortal}
                    style={{ justifyContent: "flex-start" }}
                  >
                    View My Deliveries
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={fetchData}
                    style={{ justifyContent: "flex-start" }}
                  >
                    Refresh Delivery Updates
                  </button>
                </div>
              </div>

              <div style={panel}>
                <SectionTitle
                  title="Delivery Workflow"
                  subtitle="How requests move across your teams"
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                  }}
                >
                  {[
                    {
                      step: "1",
                      title: "Submit",
                      text: "Customer creates a delivery request with full details.",
                    },
                    {
                      step: "2",
                      title: "Assign & Track",
                      text: "Delivery management assigns agents and updates status.",
                    },
                    {
                      step: "3",
                      title: "Complete",
                      text: "Final delivery confirmation closes the request lifecycle.",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                        borderRadius: 10,
                        padding: 12,
                        display: "grid",
                        gridTemplateColumns: "30px 1fr",
                        gap: 10,
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "rgba(245,158,11,0.18)",
                          border: "1px solid rgba(245,158,11,0.45)",
                          color: "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div
                          style={{
                            color: "var(--text-primary)",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            marginTop: 3,
                            color: "var(--text-secondary)",
                            fontSize: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={panel}>
              <SectionTitle
                title="Latest Delivery Updates"
                subtitle={
                  deliveryLookup
                    ? `Showing updates matched by: "${deliveryLookup}"`
                    : "Set your name in profile to load delivery responses"
                }
              />
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Agent Response</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestDeliveries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No delivery updates yet. Create a delivery request to see agent responses here.
                        </td>
                      </tr>
                    ) : (
                      latestDeliveries.map((item) => (
                        <tr key={item._id}>
                          <td>{shortId(item._id)}</td>
                          <td>{item.orderDetails || "-"}</td>
                          <td>
                            <StatusPill type="request" value={item.status || "Pending"} />
                          </td>
                          <td>{item.agentId || "Awaiting delivery agent assignment"}</td>
                          <td>{formatDate(item.updatedAt || item.createdAt)}</td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/client/track/${item._id}`)}
                            >
                              Track
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "services2" && (
          <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
            <div style={panel}>
              <SectionTitle title="Insurance Service Portal" />
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setSelectedRequest(null);
        }}
        onConfirm={confirmPayment}
        amount={selectedRequest?.appointmentFee || 0}
      />
    </div>
  );
}
