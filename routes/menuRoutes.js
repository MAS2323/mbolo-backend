import express from "express";
const router = express.Router();
import upload from "../utils/multer.js"; // Para la carga de imágenes
import menuController from "../controllers/menuController.js"; // Controlador para los menús

// Ruta para obtener los menús por categoría
router.get("/category/:categoryId", menuController.getMenusByCategory);

// Ruta para crear un nuevo menú en función de la categoría
router.post(
  "/subcategories/category/:categoryId",
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "pdf", maxCount: 3 },
  ]), // Permitimos hasta 5 imágenes
  menuController.createMenu
);

// Ruta para obtener un menú por su ID
router.get("/:menuId", menuController.getMenuById);

// Ruta para actualizar un menú por su ID
router.put("/:menuId", menuController.updateMenuById);

// Ruta para eliminar un menú por su ID
router.delete("/:menuId", menuController.deleteMenuById);

// Ruta para obtener todos los menús
router.get("/", menuController.getAllMenus);

// Ruta para buscar menús por texto
router.get("/search/:key", menuController.searchMenus);

// Agrega esta nueva ruta para obtener menús por subcategoría
router.get("/subcategory/:subcategoryId", menuController.getMenusBySubcategory);

// O modifica la existente para manejar ambos casos:
router.get(
  "/category/:categoryId",
  menuController.getMenusByCategoryOrSubcategory
);
export default router;
