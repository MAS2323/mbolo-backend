import express from "express";
import cartController from "../controllers/cartControllers.js";
const router = express.Router();

// Rutas de carrito
router.post("/add/:userId/:productId", cartController.addToCart);
router.get("/:id", cartController.getCart);
router.delete("/:userId/:productId", cartController.deleteCartItem);
router.put("/decrement", cartController.decrementCartItem);

export default router;
