import express from "express";
const router = express.Router();
import categoryController from "../controllers/categoryController.js";

// Ruta para crear una nueva categoría
router.post("/", categoryController.createCategory);

// Ruta para obtener todas las categorías
router.get("/", categoryController.getAllCategories);

router.get(
  "/:subcategoryId",
  categoryController.getAllCategoriesBySubcategoryId
);
router.get("/:id/:type", categoryController.getCategoryByIdAndType);

export default router;
