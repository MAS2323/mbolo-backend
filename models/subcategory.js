const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  image: String,
  pdf: String, // Nuevo campo para almacenar la URL del PDF
  location: String,
  contact: {
    phoneNumber: String,
    whatsapp: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favorites",
      required: true,
    },
  ],
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);

module.exports = Subcategory;

// const mongoose = require("mongoose");

// const SubcategorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, "Path `name` is required."],
//   },
//   description: String,
//   image: String,
//   location: String,
//   contactPhone: String,
//   whatsapp: String,
//   pdf: String,
// });

// module.exports = mongoose.model("Subcategory", SubcategorySchema);
