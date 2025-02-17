import SubCategoryP from "../models/SubcategoryP.js";
import Category from "../models/Category.js"; // Para validaciones

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

  try {
    // Verificar si la categoría existe y es del tipo "menu"
    const category = await Category.findById(categoryId);
    console.log("Category found:", category); // Verificar la categoría obtenida

    if (!category) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    if (category.type !== "menu") {
      return res
        .status(400)
        .json({ message: "La categoría no es de tipo 'menu'" });
    }

    // Obtener las subcategorías asociadas a la categoría seleccionada
    const subCategories = await SubCategoryP.find({ category: categoryId });

    if (subCategories.length === 0) {
      return res.status(404).json({
        message: "No se encontraron subcategorías para esta categoría",
      });
    }

    // Responder con las subcategorías encontradas
    res.status(200).json(subCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las subcategorías" });
  }
};
