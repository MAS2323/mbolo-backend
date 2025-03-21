import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "El título del anuncio es obligatorio"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La descripción del anuncio es obligatoria"],
      trim: true,
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    category: {
      type: String,
      required: [true, "La categoría del anuncio es obligatoria"],
      enum: ["tecnologia", "moda", "hogar", "deportes", "salud", "otros"], // Ejemplo de categorías
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ad", adSchema);
