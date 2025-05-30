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

// import mongoose from "mongoose";

// const commentSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   comment: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const productSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     supplier: { type: String, required: true, trim: true },
//     price: { type: Number, required: true, min: 0 },
//     description: { type: String, required: true, trim: true },
//     images: [{ url: String, public_id: String }],
//     videos: [{ url: String, public_id: String }],
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     subcategory: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Subcategoryp", // Matches the original schema
//       required: true,
//     },
//     customFields: {
//       type: mongoose.Schema.Types.Mixed,
//       default: {},
//     },
//     type: {
//       type: String,
//       enum: ["product"],
//       required: true,
//     },
//     tienda: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Tienda",
//       required: true,
//     },
//     favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Favorites" }],
//     tallas: {
//       type: [String],
//       default: [],
//     },
//     numeros_calzado: {
//       type: [Number],
//       default: [],
//     },
//     colores: {
//       type: [String],
//       default: [],
//     },
//     // New optional fields for diverse product types
//     brand: { type: String, trim: true }, // e.g., Samsung, Toyota, etc.
//     condition: {
//       type: String,
//       enum: ["new", "used", "refurbished"],
//       default: "new",
//     }, // e.g., new, used for cars, electronics
//     year: { type: Number, min: 1900, max: new Date().getFullYear() + 1 }, // e.g., car model year, book publication year
//     location: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Location", // Reference to the separate Location model
//     }, // For real estate, cars, or location-specific items
//     dimensions: {
//       length: { type: Number, min: 0 }, // in cm or meters
//       width: { type: Number, min: 0 },
//       height: { type: Number, min: 0 },
//       unit: { type: String, enum: ["cm", "m", "in", "ft"], default: "cm" },
//     }, // For furniture, electronics, etc.
//     phone_number: {
//       type: String,
//       required: true, // Make it required since it defaults to tienda's phone_number
//     },
//     weight: {
//       value: { type: Number, min: 0 },
//       unit: { type: String, enum: ["g", "kg", "lb"], default: "kg" },
//     }, // For shipping calculations
//     features: [{ type: String, trim: true }], // e.g., "4K display", "leather seats"
//     specifications: {
//       type: Map,
//       of: String,
//     }, // e.g., {"RAM": "16GB", "Engine": "V8"}
//     stock: { type: Number, min: 0, default: 1 }, // Inventory count
//     warranty: {
//       duration: { type: Number, min: 0 }, // in months
//       description: { type: String, trim: true },
//     }, // e.g., "2 years manufacturer warranty"
//     comentarios: [commentSchema],
//   },
//   { timestamps: true }
// );

// // Add indexes for common queries
// productSchema.index({ category: 1, subcategory: 1 });
// productSchema.index({ tienda: 1 });
// productSchema.index({
//   title: "text",
//   description: "text",
//   brand: "text",
//   features: "text",
// });

// const Product = mongoose.model("Product", productSchema);
// export default Product;
