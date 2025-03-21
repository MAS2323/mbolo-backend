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
    contact_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /\S+@\S+\.\S+/,
        "Por favor ingresa un correo electrónico válido.",
      ],
    },
    phone_number: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Relaciona con el modelo de usuario
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Relaciona con el modelo de producto (opcional, si lo usas)
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
