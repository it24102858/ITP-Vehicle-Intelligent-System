import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  problem: String,
  vehicle: String,
  brand: String,
  year: String,
  requestType: {
    type: String,
    enum: ["custom", "package-booking"],
    default: "custom"
  },
  packageType: String,
  serviceName: String,
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },

  requestDate: String,

  //  APPOINTMENT
  appointmentDate: String,
  appointmentFee: Number,

  //  PAYMENT
  paymentStatus: {
    type: String,
    default: "Not Paid"
  },

  // STATUS
  status: {
    type: String,
    default: "Pending"
  }
});

export default mongoose.model("Request", requestSchema);
