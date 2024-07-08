const Category = require("../models/Category");

module.exports = {
  // Obtener todas las categorías
getAllCategories: async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
},

// Crear una nueva categoría
createCategory: async (req, res) => {
  const { name, imageUrl } = req.body;

  try {
    const newCategory = new Category({ name, imageUrl });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({ message: "Failed to create category" });
  }
},

  getAllCategoriesBySubcategoryId: async (req, res) =>{
  try {
    const { subcategoryId } = req.params;
    const categories = await Category.find({ subcategoryId });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
  }
}

};
