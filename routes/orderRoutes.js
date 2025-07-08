import express from "express";
import { uploadOrderMiddleware, multerErrorHandling } from "../utils/multer.js";
import orderController from "../controllers/orderController.js";

const router = express.Router();

// Use uploadOrderMiddleware for /orders route
router.post(
  "/",
  uploadOrderMiddleware,
  multerErrorHandling,
  orderController.createOrder
);
router.get("/:id", orderController.getUserOrders);
router.get("/order/:orderId", orderController.getOrderById);

export default router;
