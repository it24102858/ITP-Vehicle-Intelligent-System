import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Package name required"],
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      required: [true, "Price required"],
      min: [0, "Price must be positive"]
    },

    duration: {
      type: String,
      required: [true, "Duration required"],
      trim: true
    },

    type: {
      type: String,
      enum: ["normal", "promotion"],
      default: "normal"
    }
}

);


export default mongoose.model("normalPackage", packageSchema);
