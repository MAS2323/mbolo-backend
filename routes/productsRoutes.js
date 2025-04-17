import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import productController from "../controllers/productControllers.js";
import { uploadMiddleware, multerErrorHandling } from "../utils/multer.js";
const app = express();

router.get("/", productController.getAllProduct);
router.get("/:id", productController.getProduct);
router.get("/search/:key", productController.searchProduct);
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  productController.updateProduct
);
router.get(
  "/filter/products",
  productController.getProductsByCategoryAndSubcategory
);
router.get("/generate-link/:productId", productController.generateShortLink);
router.get("/link/:shortCode", productController.redirectToProduct);

router.post(
  "/:userId",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  productController.createProduct
);
router.delete("/:id", productController.deleteProduct);
router.post("/comment/:id", productController.addComment);
router.get("/comments/:id", productController.getComments);
// New route: Get products by tienda ID
router.get("/tienda/:tiendaId", productController.getProductsByTienda);
app.use(multerErrorHandling);
export default router;

/**
 * rutas de getProductsByCategoryAndSubcategory
 * /products/filter?category=categoryId
 * /products/filter?subcategory=subcategoryId
 * /products/filter?category=categoryId&subcategory=subcategoryId
 *
 */
