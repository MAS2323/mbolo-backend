import mongoose from "mongoose";

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
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Ubicación (si aplica)
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

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
