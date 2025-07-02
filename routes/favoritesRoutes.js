import express from "express";
const router = express.Router();
import favoritesController from "../controllers/favoritesController.js";

// Ruta para verificar el estado de favorito de un producto para un usuario
router.get("/check", favoritesController.checkFavoriteStatus);

// Ruta para agregar/eliminar un producto de los favoritos de un usuario
router.post("/toggle", favoritesController.toggleFavorite);

// Ruta para obtener los favoritos de un usuario específico
router.get("/:userId", favoritesController.getFavorites);

// Ruta para agregar un ítem a los favoritos de un usuario específico
// router.post("/:userId/:itemId", favoritesController.addToFavorites);

// Ruta para eliminar un ítem de los favoritos de un usuario específico
router.delete("/:userId/:subcategoryId", favoritesController.removeFavorite);

export default router;
