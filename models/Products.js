import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    supplier: { type: String, required: true, trim: true },
    domicilio: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    product_location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    description: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true },
    whatsapp: { type: String, required: true },
    images: [{ url: String, public_id: String }],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      // required: true,
    }, // ✅ Asegúrate de tener esto
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategoryp",
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
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tienda: { type: mongoose.Schema.Types.ObjectId, ref: "Tienda" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Favorites" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
