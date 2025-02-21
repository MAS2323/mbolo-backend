import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    customFields: [
      {
        fieldName: { type: String, required: true },
        fieldType: { type: String, required: true }, // Ejemplo: "string", "number", "boolean"
        required: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Verifica si el modelo ya existe antes de crear uno nuevo
const Subcategoryp = mongoose.model("Subcategoryp", subCategorySchema);
export default Subcategoryp;
