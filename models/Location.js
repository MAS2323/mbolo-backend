import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["City", "Province"], required: true },
    address: { type: String, trim: true },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    }, // Referencia a la provincia si es una ciudad
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);
export default Location;
