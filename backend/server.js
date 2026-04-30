require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const legacyAuthRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin");
const vehicleRoutes = require("./routes/vehicles");
const inquiryRoutes = require("./routes/inquiryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const servicePackagesRoutes = require("./routes/servicePackages");
const serviceRequestsRoutes = require("./routes/serviceRequests");
const serviceApplicationsRoutes = require("./routes/serviceApplications");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin ${origin}`));
    },
    credentials: true,
  }),
);

app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", legacyAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/packages", servicePackagesRoutes);
app.use("/api/requests", serviceRequestsRoutes);
app.use("/api/applications", serviceApplicationsRoutes);

app.use("/api/service-packages", servicePackagesRoutes);
app.use("/api/service-requests", serviceRequestsRoutes);
app.use("/api/deliveries", deliveryRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Vehicle System API running",
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Server startup aborted because MongoDB is unavailable.");
    process.exit(1);
  }
};

startServer();
