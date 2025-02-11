import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true },
    socialMedia: { type: [String], default: [] },
    horario: [{ type: String, trim: true }],
    phoneNumber: { type: String, match: /^[0-9]{7,15}$/ },
    whatsapp: { type: String, match: /^[0-9]{7,15}$/ },
    images: [{ url: String, public_id: String }],
    pdf: { type: String, default: null },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    type: {
      type: String,
      enum: ["menu"], // Solo puede pertenecer a categorías de tipo "menu"
      required: true,
    },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Favorites" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Subcategory = mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;
