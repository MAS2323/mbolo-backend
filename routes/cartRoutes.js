import express from "express";
const router = express.Router();
import cartController from "../controllers/cartControllers.js";

router.get("/find/:id", cartController.getCart);
router.post("/add", cartController.addToCart);
router.post("/quantity", cartController.decrementCartItem);
router.delete("/:cartItemId", cartController.deleteCartItem);

module.exports = router;
