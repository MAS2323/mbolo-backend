import mongoose from "mongoose";

const tiendaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    specific_location: { type: String, required: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    logo: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    banner: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    document: [
      {
        type: {
          type: String,
          enum: ["DIP", "Pasaporte", "Permiso de Residencia"],
          required: true,
        },
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    paymentMethods: [
      {
        name: { type: String, required: true },
        accountNumber: { type: String, required: true },
        image: {
          public_id: { type: String, required: true },
          url: { type: String, required: true },
        },
      },
    ],
  },
  { timestamps: true }
);

const Tienda = mongoose.model("Tienda", tiendaSchema);
export default Tienda;
