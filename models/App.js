import mongoose from "mongoose";

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Entry Utilities",
      "Urban Transport",
      "Travel",
      "Convenience & Life",
      "Fund Services",
      "Charity",
    ],
  },
  webViewData: {
    type: Object,
    default: {},
  },
});

export default mongoose.model("App", appSchema);
