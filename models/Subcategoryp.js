import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["menusubcat", "productsubcat"], // Solo permite estos valores
      default: "productsubcat", // Valor por defecto
    },
  },
  { timestamps: true }
);

// Verifica si el modelo ya existe antes de crear uno nuevo
const Subcategoryp = mongoose.model("Subcategoryp", subCategorySchema);
export default Subcategoryp;
