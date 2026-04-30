import Application from "../models/Application.js";
import Request from "../models/Request.js";

// APPLY service
export const createApplication = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (payload.type === "promotion") {
      payload.finalPrice = payload.finalPrice ?? payload.price;
      payload.price = payload.finalPrice;
    }

    const app = new Application(payload);
    await app.save();

    // Auto-create provider request for booked packages (normal/promotion)
    await Request.create({
      problem: `Package booking: ${app.name}`,
      vehicle: app.type === "promotion" ? "Promotion Package" : "Normal Package",
      requestDate: new Date().toISOString(),
      status: "Pending",
      paymentStatus: "Not Paid",
      requestType: "package-booking",
      packageType: app.type || "normal",
      serviceName: app.name,
      applicationId: app._id
    });

    res.json(app);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET all applications
export const getApplications = async (req, res) => {
  const apps = await Application.find();
  res.json(apps);
};

// DELETE application
export const deleteApplication = async (req, res) => {
  await Application.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};
