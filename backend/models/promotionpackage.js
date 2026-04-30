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
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    promotionTopic: {
      type: String,
      trim: true
    },

    finalPrice: {
      type: Number
    }
  },
  { timestamps: true }
);

// AUTO CALCULATE FINAL PRICE 


packageSchema.pre("save", async function () {
  if (this.type === "promotion" && this.discount > 0) {
    this.finalPrice = this.price - (this.price * this.discount) / 100;
  } else {
    this.finalPrice = this.price;
  }
});

// VALIDATION 

packageSchema.pre("validate", async function () {
  if (this.type === "promotion") {
    if (!this.discount) {
      this.invalidate("discount", "Discount required for promotion");
    }
    if (!this.promotionTopic) {
      this.invalidate("promotionTopic", "Promotion topic required for promotion");
    }
  }
});

export default mongoose.model("promotionPackage", packageSchema);
