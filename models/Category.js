import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["product", "menu"], // Permite diferenciar tipos de categorías
      required: true,
    },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
