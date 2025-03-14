import SubCategoryP from "../models/Subcategoryp.js";
import Category from "../models/Category.js"; // Para validaciones
import Subcategoryp from "../models/Subcategoryp.js";
import Product from "../models/Products.js";

// Crear una nueva subcategoría
export const createSubCategoryP = async (req, res) => {
  try {
    const { name, category, type, imageUrl } = req.body;

    // Validar que el tipo sea válido
    if (!["menusubcat", "productsubcat"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Tipo de subcategoría no válido" });
    }

    const subcategory = new Subcategoryp({
      name,
      category,
      type,
      imageUrl,
    });

    const savedSubcategory = await subcategory.save();
    res.status(201).json(savedSubcategory);
  } catch (error) {
    console.error("Error creating subcategory:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
  // console.log("Received categoryId:", categoryId); // Para verificar
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
      .populate("product_location") // Poblar la ubicación del producto
      .populate({
        path: "subcategory",
        populate: {
          path: "category", // Poblar la categoría dentro de la subcategoría
        },
      })
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación (más reciente primero)

    // Si no se encuentran productos
    if (products.length === 0) {
      return res.status(404).json({
        message:
          "No se encontraron productos para esta categoría y subcategoría",
      });
    }

    // Retornar los productos encontrados
    res.status(200).json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
