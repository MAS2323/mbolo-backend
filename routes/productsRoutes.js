import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import productController from "../controllers/productControllers.js";
import authenticateUser from "../middleware/authMiddleware.js";

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getProduct);
router.get("/search/:key", productController.searchProduct);
router.put("/:id", upload.array("images"), productController.updateProduct);
router.get(
  "/filter/products",
  productController.getProductsByCategoryAndSubcategory
);
// router.get(
//   "/subcategory/:subcategoryId",
//   productController.getProductsByCategoryAndSubcategory
// );
router.get("/generate-link/:productId", productController.generateShortLink);
router.get("/link/:shortCode", productController.redirectToProduct);

router.post(
  "/:userId",
  upload.array("images", 6),
  productController.createProduct
);
router.delete("/:id", productController.deleteProduct); // Nueva ruta para eliminar producto

export default router;

/**
 * rutas de getproductsbycategoryandsubcategory
 * /products/filter?category=categoryId
 * /products/filter?subcategory=subcategoryId
 * /products/filter?category=categoryId&subcategory=subcategoryId
 *
 */
