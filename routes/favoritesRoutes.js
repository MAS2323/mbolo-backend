import express from "express";
const router = express.Router();
import favoritesController from "../controllers/favoritesController.js";

// Ruta para obtener los favoritos de un usuario específico
router.get("/:userId", favoritesController.getFavorites);

// Ruta para agregar un ítem a los favoritos de un usuario específico
router.post("/:userId/:itemId", favoritesController.addToFavorites);

// Ruta para eliminar un ítem de los favoritos de un usuario específico
router.delete("/:userId/:subcategoryId", favoritesController.removeFavorite);

export default router;
