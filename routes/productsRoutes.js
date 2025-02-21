import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import productController from "../controllers/productControllers.js";
import authenticateUser from "../middleware/authMiddleware.js";

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getProduct);
router.get("/search/:key", productController.searchProduct);
router.put("/:id", productController.updateProduct);
router.post(
  "/",
  authenticateUser,
  upload.array("images", 6),
  productController.createProduct
);
router.delete("/:id", productController.deleteProduct); // Nueva ruta para eliminar producto

export default router;
