const Favorites = require("../models/Favorites");
const mongoose = require("mongoose");


module.exports = {
  addToFavorites: async (req, res) => {
    const { subcategoryId } = req.body;
    const { userId } = req.params;

    try {
      let favorites = await Favorites.findOne({ user: userId });

      if (!favorites) {
        favorites = new Favorites({
          user: userId,
          products: [],
          subcategories: [],
        });
      }

      if (subcategoryId && !favorites.subcategories.includes(subcategoryId)) {
        favorites.subcategories.push(subcategoryId);
      }

      await favorites.save();
      res.status(200).json("Elemento agregado a favoritos");
    } catch (error) {
      console.error("Error al agregar a favoritos:", error);
      res.status(500).json({
        message: "Error al agregar a favoritos",
        error: error.message,
      });
    }
  },

  getFavorites: async (req, res) => {
    const userId = req.params.userId;

    try {
      const favorites = await Favorites.findOne({ user: userId }).populate(
        "subcategories",
        "_id name description image location contact"
      );

      if (!favorites) {
        return res.status(404).json({ message: "Favoritos no encontrados" });
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
     // Validar que userId y subcategoryId sean ObjectIds válidos
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
