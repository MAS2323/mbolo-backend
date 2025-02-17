import mongoose from "mongoose";

// Definir el esquema de Menu
const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Nombre del menú
    description: { type: String, required: true }, // Descripción del menú
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Relación con el modelo de Location
      required: true,
    },
    socialMedia: [
      {
        platform: { type: String }, // Red social
        url: { type: String }, // URL de la red social
      },
    ],
    horario: [
      {
        day: { type: String }, // Día de la semana
        open: { type: String }, // Hora de apertura
        close: { type: String }, // Hora de cierre
      },
    ],
    phoneNumber: { type: String, required: true }, // Número de teléfono
    whatsapp: { type: String, required: true }, // Número de WhatsApp
    images: [
      {
        url: { type: String },
        public_id: { type: String },
      },
    ],
    pdf: { type: String, default: null }, // URL o ID del archivo PDF
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Relación con el modelo de Category
      required: true,
    },
  },
  { timestamps: true }
);

// Crear el modelo de Menu
const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
