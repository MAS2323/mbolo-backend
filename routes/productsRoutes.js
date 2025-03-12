import express from "express";
import menuController from "../controllers/menuController.js";

const router = express.Router();

// Obtener menús por categoría
router.get("/category/:categoryId", menuController.getMenusByCategory);

// Crear un nuevo menú
router.post("/", menuController.createMenu);

// Obtener un menú por su ID
router.get("/:menuId", menuController.getMenuById);

// Obtener todos los menús
router.get("/", menuController.getAllMenus);

// Actualizar un menú por su ID
router.put("/:menuId", menuController.updateMenuById);

// Eliminar un menú por su ID
router.delete("/:menuId", menuController.deleteMenuById);

// Buscar menús por texto
router.get("/search/:key", menuController.searchMenus);

export default router;
