const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "cod"],
      required: true,
    },
    transactionId: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paidAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
