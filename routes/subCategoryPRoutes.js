import express from "express";
import {
  createSubCategoryP,
  getSubCategoriesP,
  getSubCategoriesByCategory, // Importa la nueva función
  updateSubCategoryP,
} from "../controllers/subCategoryPController.js";

const router = express.Router();

// Ruta para crear una subcategoría
router.post("/subcategories", createSubCategoryP);

// Ruta para obtener todas las subcategorías
router.get("/subcategories", getSubCategoriesP);

// Ruta para obtener las subcategorías por ID de categoría
router.get("/category/:categoryId", getSubCategoriesByCategory); // Nueva ruta

// Ruta para actualizar una subcategoría
router.put("/subcategories/:id", updateSubCategoryP);

export default router;
