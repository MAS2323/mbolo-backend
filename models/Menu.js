import mongoose from "mongoose";

// Definir el esquema de Menu
const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategoryp",
      required: true,
    },
    location: {
      city: { type: String, required: true },
      province: { type: String, required: true },
    },
    socialMedia: [
      {
        platform: { type: String },
        url: { type: String },
      },
    ],
    horario: [
      {
        day: { type: String },
        open: { type: String },
        close: { type: String },
      },
    ],
    contact: {
      phoneNumber: { type: String },
      whatsapp: { type: String },
      email: { type: String },
      website: { type: String },
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    pdf: {
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

// Crear el modelo de Menu
const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
