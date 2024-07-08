const router = require("express").Router();
const favoritesController = require("../controllers/favoritesController");

// Ruta para obtener los favoritos de un usuario específico
router.get("/:userId", favoritesController.getFavorites);

// Ruta para agregar un ítem a los favoritos de un usuario específico
router.post("/:userId/:itemId", favoritesController.addToFavorites);

// Ruta para eliminar un ítem de los favoritos de un usuario específico
router.delete("/:userId/:subcategoryId", favoritesController.removeFavorite);

module.exports = router;
