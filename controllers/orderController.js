const Order = require("../models/Order");

module.exports = {
  getUserOrders: async (req, res) => {
    const userId = req.params.id;

    try {
      const userOrders = await Order.find({ userId })
        .populate({
          path: "products.productId",
          select: "title supplier price imageUrl",
        })
        .exec();

      res.status(200).json(userOrders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error });
    }
  },

  createOrder: async (req, res) => {
    const { userId, customerId, products, total, payment_status } = req.body;

    try {
      const newOrder = new Order({
        userId,
        customerId,
        products,
        total,
        payment_status,
      });

      await newOrder.save();
      res.status(201).json("Order created successfully");
    } catch (error) {
      res.status(500).json({ message: "Error creating order", error });
    }
  },

  getOrderById: async (req, res) => {
    const orderId = req.params.orderId;

    try {
      const order = await Order.findById(orderId)
        .populate({
          path: "products.productId",
          select: "title supplier price imageUrl",
        })
        .exec();

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: "Error fetching order", error });
    }
  },
};
