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
      ref: "Subcategory",
      required: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
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
        url: { type: String },
        public_id: { type: String },
      },
    ],
    pdf: { type: String, default: null },
    customFields: [
      {
        fieldName: { type: String, required: true },
        fieldType: { type: String, required: true },
        value: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true }
);

// Crear el modelo de Menu
const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
