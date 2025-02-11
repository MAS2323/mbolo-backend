import Category from "../models/Category.js";

export default {
  // Obtener todas las categorías con filtro por tipo (opcional)
  getAllCategories: async (req, res) => {
    try {
      const { type } = req.query; // Permite filtrar por tipo si se envía en la query

      const filter = type ? { type } : {}; // Si hay un tipo, filtra por él
      const categories = await Category.find(filter);

      res.json(categories); // Devuelve las categorías filtradas
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  },

  // Crear una nueva categoría con tipo
  createCategory: async (req, res) => {
    const { name, imageUrl, type } = req.body;

    // Validación del tipo
    if (!["product", "menu"].includes(type)) {
      return res.status(400).json({ message: "Invalid category type" });
    }

    try {
      const newCategory = new Category({ name, imageUrl, type });
      await newCategory.save();
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  },
  // Obtener una categoría por su ID y tipo
  getCategoryByIdAndType: async (req, res) => {
    try {
      const { id, type } = req.params;

      // Validación del tipo
      if (!["product", "menu"].includes(type)) {
        return res.status(400).json({ message: "Invalid category type" });
      }

      const category = await Category.findOne({ _id: id, type });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error("Error fetching category by ID and type:", error);
      res.status(500).json({ message: "Error fetching category", error });
    }
  },
  // Obtener todas las categorías a las que pertenece una subcategoría
  getAllCategoriesBySubcategoryId: async (req, res) => {
    try {
      const { subcategoryId } = req.params;

      // Encuentra la categoría a la que pertenece la subcategoría
      const category = await Category.findOne({ _id: subcategoryId });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error("Error fetching category by subcategory ID:", error);
      res.status(500).json({ message: "Error fetching category", error });
    }
  },
};
