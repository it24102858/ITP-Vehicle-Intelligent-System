import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  discount: Number,
  finalPrice: Number,
  type: String,
  applyDate: Date,

  appointmentDate: Date,
  fee: Number,

  status: {
    type: String,
    default: "Pending"
  }
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);
