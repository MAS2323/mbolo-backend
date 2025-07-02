import mongoose from "mongoose";

const FavoritesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategoryp",
      },
    ],
  },
  { timestamps: true }
);

const Favorites = mongoose.model("Favorites ", FavoritesSchema);
export default Favorites;
