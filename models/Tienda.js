import mongoose from "mongoose";

// Definir el esquema de la tienda
const tiendaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    logo_url: {
      type: String,
      required: true,
    },
    banner_url: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location", // Referencia al modelo Location
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
  },
  {
    timestamps: true, // Agrega los campos createdAt y updatedAt
  }
);

// Crear el modelo de Tienda
const Tienda = mongoose.model("Tienda", tiendaSchema);

export default Tienda;
