import SubCategoryP from "../models/Subcategoryp.js";
import Category from "../models/Category.js"; // Para validaciones
import Subcategoryp from "../models/Subcategoryp.js";
import Product from "../models/Products.js";

// Crear una nueva subcategoría
export const createSubCategoryP = async (req, res) => {
  const { name, category } = req.body;

  try {
    // Verificar si la categoría existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Crear la subcategoría
    const subCategoryP = new SubCategoryP({
      name,
      category,
    });

    await subCategoryP.save();
    res.status(201).json(subCategoryP);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la subcategoría" });
  }
};

// Obtener todas las subcategorías
export const getSubCategoriesP = async (req, res) => {
  try {
    const subCategories = await SubCategoryP.find().populate(
      "category",
      "name"
    ); // Populate para mostrar la categoría
    res.status(200).json(subCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las subcategorías" });
  }
};

// Actualizar una subcategoría
export const updateSubCategoryP = async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  try {
    // Verificar si la subcategoría existe
    const subCategoryP = await SubCategoryP.findById(id);
    if (!subCategoryP) {
      return res.status(404).json({ message: "Subcategoría no encontrada" });
    }

    // Verificar si la categoría existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Actualizar la subcategoría
    subCategoryP.name = name;
    subCategoryP.category = category;

    await subCategoryP.save();
    res.status(200).json(subCategoryP);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la subcategoría" });
  }
};

export const getSubCategoriesByCategory = async (req, res) => {
  const { categoryId } = req.params;
  console.log("Received categoryId:", categoryId); // Para verificar
  try {
    // Buscar las subcategorías que pertenezcan a la categoría dada
    const subcategories = await Subcategoryp.find({ category: categoryId });

    if (!subcategories || subcategories.length === 0) {
      return res.status(404).json({
        message: "No se encontraron subcategorías para esta categoría",
      });
    }

    res.status(200).json(subcategories);
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getProductsByCategoryAndSubcategory = async (req, res) => {
  const { category, subcategory } = req.query;

  try {
    let filter = {};

    // Filtrar por categoría si se proporciona
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: "ID de categoría inválido" });
      }
      filter["subcategory.category"] = mongoose.Types.ObjectId(category);
    }

    // Filtrar por subcategoría si se proporciona
    if (subcategory) {
      if (!mongoose.Types.ObjectId.isValid(subcategory)) {
        return res.status(400).json({ message: "ID de subcategoría inválido" });
      }
      filter.subcategory = mongoose.Types.ObjectId(subcategory);
    }

    // Buscar productos con el filtro aplicado
    const products = await Product.find(filter)
      .populate("product_location")
      .populate("subcategory")
      .sort({ createdAt: -1 });

    // Si no se encuentran productos
    if (products.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron productos para esta categoría y subcategoría",
      });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
