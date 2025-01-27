import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
    },
    product_location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: { type: String, required: true },
    whatsapp: { type: String, required: true },
    images: [
      {
        url: String, // URL de la imagen en Cloudinary
        public_id: String, // public_id de la imagen en Cloudinary
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tienda: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tienda", // Referencia a la tienda
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Favorites",
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);
export default Product;
