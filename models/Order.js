import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      // quantity: {
      //   type: Number,
      //   required: true,
      // },
      // subtotal: {
      //   type: Number,
      //   required: true,
      // },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  delivery_status: {
    type: String,
    default: "pending",
  },
  payment_status: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
