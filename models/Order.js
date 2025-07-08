import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      subtotal: {
        type: Number,
        required: true,
      },
      color: {
        type: String,
        default: null,
      },
      talla: {
        type: String,
        default: null,
      },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  paymentReceipt: {
    url: {
      type: String,
      default: null,
    },
    public_id: {
      type: String,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Order", orderSchema);
