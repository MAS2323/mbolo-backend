import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    videos: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
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
    customFields: {
      type: Object,
      default: {},
    },
    type: {
      type: String,
      default: "product",
    },
    tienda: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tienda",
      required: true,
    },
    phone_number: {
      type: String,
      required: true, // Required since it defaults to tienda's phone_number
    },
    tallas: {
      type: [String],
      default: [],
    },
    numeros_calzado: {
      type: [Number],
      default: [],
    },
    colores: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ["new", "used", "refurbished"],
      default: "new",
    },
    year: {
      type: Number,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: "cm" },
    },
    weight: {
      value: Number,
      unit: { type: String, default: "kg" },
    },
    features: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Object,
      default: {},
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    warranty: {
      duration: Number,
      description: String,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comentarios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
