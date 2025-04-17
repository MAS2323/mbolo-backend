// models/Product.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    supplier: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    images: [{ url: String, public_id: String }],
    videos: [{ url: String, public_id: String }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategoryp", // Cambiado de "Subcategory" a "Subcategoryp" para coincidir con el nombre original
      required: true,
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    type: {
      type: String,
      enum: ["product"],
      required: true,
    },
    tienda: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tienda",
      required: true,
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Favorites" }],
    tallas: {
      type: [String],
      default: [],
    },
    numeros_calzado: {
      type: [Number],
      default: [],
    },
    colores: {
      type: [String],
      default: [],
    },
    comentarios: [commentSchema],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
