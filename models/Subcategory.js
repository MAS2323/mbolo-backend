import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
      trim: true,
      minlength: 3, // Longitud mínima para el nombre.
    },
    description: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 500, // Limita el tamaño de la descripción.
    },
    location: {
      type: String,
      // required: true,
      trim: true,
    },
    socialMedia: {
      type: [String], // Define un array de strings para enlaces de redes sociales.
      default: [], // Valor por defecto para evitar campos vacíos.
    },
    horario: [
      {
        type: String,
        trim: true, // Elimina espacios innecesarios.
      },
    ],
    phoneNumber: {
      type: String,
      // required: true,
      match: /^[0-9]{7,15}$/, // Validación para números telefónicos.
    },
    whatsapp: {
      type: String,
      // required: true,
      match: /^[0-9]{7,15}$/, // Validación para números de WhatsApp.
    },
    images: [
      {
        url: String, // URL de la imagen en Cloudinary
        public_id: String, // public_id de la imagen en Cloudinary
      },
    ],
    pdf: {
      type: String,
      default: null, // Archivo PDF opcional.
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Favorites",
      },
    ],
    isActive: {
      type: Boolean,
      default: true, // Indica si la subcategoría está activa.
    },
  },
  {
    timestamps: true, // Agrega automáticamente `createdAt` y `updatedAt`.
  }
);

// Middleware para actualizar `updatedAt` antes de guardar.
subcategorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;
