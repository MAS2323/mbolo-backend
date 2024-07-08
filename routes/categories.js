const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Ruta para crear una nueva categoría
router.post("/", categoryController.createCategory);

// Ruta para obtener todas las categorías
router.get("/:id", categoryController.getAllCategories);
router.get("/:subcategoryId", categoryController.getAllCategoriesBySubcategoryId);

module.exports = router;
