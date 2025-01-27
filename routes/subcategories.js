import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import subcategoriesController from "../controllers/subcategoriesController.js";

router.get(
  "/category/:categoryId",
  subcategoriesController.getSubcategoriesByCategory
);
router.post(
  "/category/:categoryId",
  upload.array("images", 6),
  subcategoriesController.createSubcategory
);
router.get("/:subcategoryId", subcategoriesController.getSubcategoryById);
router.put("/:subcategoryId", subcategoriesController.updateSubcategoryById);
router.delete("/:subcategoryId", subcategoriesController.deleteSubcategoryById);
router.get("/", subcategoriesController.getAllSubcategories);
router.get("/search/:key", subcategoriesController.searchSubcategories);
export default router;
