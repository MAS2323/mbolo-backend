import express from "express";
const router = express.Router();
import orderController from "../controllers/orderController.js";

router.post("/", orderController.createOrder);
router.get("/:id", orderController.getUserOrders);
router.get("/order/:orderId", orderController.getOrderById);

export default router;
