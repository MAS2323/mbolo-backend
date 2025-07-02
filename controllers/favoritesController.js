import Favorites from "../models/Favorites.js";
import mongoose from "mongoose";

export default {
  // Verificar si un producto está en favoritos
  checkFavoriteStatus: async (req, res) => {
    const { userId, productId } = req.query;

    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ message: "Invalid userId or productId" });
      }

      const favorites = await Favorites.findOne({ user: userId });
      const isFavorite = favorites?.products?.includes(productId) || false;

      res.status(200).json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({
        message: "Error checking favorite status",
        error: error.message,
      });
    }
  },

  // Alternar (agregar/eliminar) un producto en favoritos
  toggleFavorite: async (req, res) => {
    const { userId, productId } = req.body;

    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ message: "Invalid userId or productId" });
      }

      let favorites = await Favorites.findOne({ user: userId });

      if (!favorites) {
        favorites = new Favorites({
          user: userId,
          products: [],
          subcategories: [],
        });
      }

      const productIndex = favorites.products.indexOf(productId);
      if (productIndex === -1) {
        favorites.products.push(productId);
        await favorites.save();
        return res
          .status(200)
          .json({ isFavorite: true, message: "Añadido a favoritos" });
      } else {
        favorites.products.splice(productIndex, 1);
        await favorites.save();
        return res
          .status(200)
          .json({ isFavorite: false, message: "Eliminado de favoritos" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res
        .status(500)
        .json({ message: "Error toggling favorite", error: error.message });
    }
  },

  // (Opcional) Mantener getFavorites y removeFavorite si aún los necesitas
  getFavorites: async (req, res) => {
    const userId = req.params.userId;
    try {
      const favorites = await Favorites.findOne({ user: userId }).populate(
        "subcategories",
        "_id name description image location contact"
      );
      if (!favorites) {
        return res.status(200).json({ subcategories: [], products: [] });
      }
      res.status(200).json(favorites);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({
        message: "Error al obtener favoritos",
        error: error.message,
      });
    }
  },

  removeFavorite: async (req, res) => {
    const { userId, subcategoryId } = req.body;
    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(subcategoryId)
      ) {
        return res
          .status(400)
          .json({ message: "Invalid userId or subcategoryId" });
      }
      const favorites = await Favorites.findOne({ user: userId });
      if (!favorites) {
        return res.status(404).json("Favorites not found");
      }
      const subcategoryIndex = favorites.subcategories.indexOf(subcategoryId);
      if (subcategoryIndex === -1) {
        return res.status(404).json("Subcategory not found in favorites");
      }
      favorites.subcategories.splice(subcategoryIndex, 1);
      await favorites.save();
      res.status(200).json("Subcategory removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
