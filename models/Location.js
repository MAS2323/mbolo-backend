import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    direccion: { type: String, required: true },
    ciudad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);

export default Location;
