import Subcategory from "../models/Subcategoryp.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import fs from "node:fs";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
export default {
  /**
   * Obtiene subcategorías por categoría.
   */
  getSubcategoriesByCategory: async (req, res) => {
    const { categoryId } = req.params;
    const { subcategoryId } = req.query; // Se obtiene el ID de la subcategoría desde la query

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId format" });
    }

    try {
      // Verificar si la categoría existe
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ message: "Category not found" });
      }

      let query = { category: categoryId };

      // Si se especifica un subcategoryId, buscar solo esa subcategoría
      if (subcategoryId) {
        if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
          return res
            .status(400)
            .json({ message: "Invalid subcategoryId format" });
        }
        query._id = subcategoryId;
      }

      const subcategories = await Subcategory.find(query);

      if (subcategories.length === 0) {
        return res.status(404).json({ message: "Subcategory not found" });
      }

      res.json(subcategoryId ? subcategories[0] : subcategories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getSubcategoriesByCategoryMenu: async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).send("Invalid categoryId format");
    }

    try {
      const subcategories = await Subcategory.find({ category: categoryId });
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  // Obtener todas las subcategorías
  getSubCategories: async (req, res) => {
    try {
      const subCategories = await Subcategory.find().populate(
        "category",
        "name"
      ); // Populate para mostrar la categoría
      res.status(200).json(subCategories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener las subcategorías" });
    }
  },

  /**
   * Crea una nueva subcategoría.
   */
  createSubcategory: async (req, res) => {
    try {
      const {
        name,
        description,
        location,
        socialMedia,
        horario,
        phoneNumber,
        whatsapp,
        pdf,
        category,
      } = req.body;

      // Validación de campos requeridos
      const requiredFields = [
        name,
        description,
        location,
        phoneNumber,
        whatsapp,
        category,
      ];
      if (requiredFields.some((field) => !field)) {
        return res
          .status(400)
          .json({ message: "Todos los campos son obligatorios" });
      }

      // Validación de archivos (imágenes)
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Debes subir al menos una imagen" });
      }

      const folderName = "subcategory_mbolo"; // Nombre de la carpeta en Cloudinary
      const images = [];

      // Subir imágenes a Cloudinary
      for (const file of req.files) {
        try {
          const result = await uploadImage(file.path, folderName);
          images.push({
            url: result.url,
            public_id: result.public_id,
          });
          fs.unlinkSync(file.path); // Eliminar el archivo temporal
        } catch (error) {
          console.error("Error al subir la imagen:", error);

          // Si falla la subida de una imagen, eliminar las imágenes ya subidas
          if (images.length > 0) {
            for (const image of images) {
              await deleteImage(image.public_id).catch((err) =>
                console.error("Error al eliminar imagen de Cloudinary:", err)
              );
            }
          }

          return res.status(500).json({
            error: "Error al subir la imagen a Cloudinary",
            details: error.message,
          });
        }
      }

      // Crear la subcategoría en la base de datos
      const subcategory = new Subcategory({
        name,
        description,
        location,
        socialMedia: socialMedia || [], // Valor por defecto si no se proporciona
        horario: horario || [], // Valor por defecto si no se proporciona
        phoneNumber,
        whatsapp,
        images,
        pdf: pdf || null, // Valor por defecto si no se proporciona
        category,
      });

      const savedSubcategory = await subcategory.save();
      res.status(201).json({
        message: "Subcategoría creada exitosamente",
        subcategory: savedSubcategory,
      });
    } catch (error) {
      console.error("Error creating subcategory:", error);

      // Manejo de errores específicos
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Error de validación",
          details: error.message,
        });
      }

      res.status(500).json({
        error: "Error interno del servidor",
        details: error.message,
      });
    }
  },

  /**
   * Obtiene una subcategoría por su ID.
   */
  getSubcategoryById: async (req, res) => {
    try {
      const { subcategoryId } = req.params;
      const subcategory = await Subcategory.findById(subcategoryId);
      if (!subcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      res.json(subcategory);
    } catch (error) {
      console.error("Error fetching subcategory:", error);
      res.status(500).json({ error: "Failed to fetch subcategory" });
    }
  },

  /**
   * Obtiene todas las subcategorías.
   */
  getAllSubcategories: async (req, res) => {
    try {
      const subcategories = await Subcategory.find().lean();
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res
        .status(500)
        .json({ message: "Server error while fetching subcategories" });
    }
  },

  /**
   * Actualiza una subcategoría por su ID.
   */
  updateSubcategoryById: async (req, res) => {
    try {
      const { subcategoryId } = req.params;
      const {
        name,
        description,
        location,
        socialMedia,
        horario,
        phoneNumber,
        whatsapp,
        images,
        pdf,
        category,
        isActive,
      } = req.body;

      const updatedSubcategory = await Subcategory.findByIdAndUpdate(
        subcategoryId,
        {
          name,
          description,
          location,
          socialMedia,
          horario,
          phoneNumber,
          whatsapp,
          images,
          pdf,
          category,
          isActive,
        },
        { new: true } // Devuelve el documento actualizado
      );

      if (!updatedSubcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      res.json(updatedSubcategory);
    } catch (error) {
      console.error("Error updating subcategory:", error);
      res.status(500).json({ error: "Failed to update subcategory" });
    }
  },

  /**
   * Elimina una subcategoría por su ID.
   */
  deleteSubcategoryById: async (req, res) => {
    try {
      const { subcategoryId } = req.params;
      const deletedSubcategory = await Subcategory.findByIdAndDelete(
        subcategoryId
      );
      if (!deletedSubcategory) {
        return res.status(404).json({ error: "Subcategory not found" });
      }
      res.json({ message: "Subcategory deleted successfully" });
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      res.status(500).json({ error: "Failed to delete subcategory" });
    }
  },

  /**
   * Busca subcategorías por texto.
   */
  searchSubcategories: async (req, res) => {
    try {
      const result = await Subcategory.aggregate([
        {
          $search: {
            index: "subcategorias",
            text: {
              query: req.params.key,
              path: {
                wildcard: "*",
              },
            },
          },
        },
      ]);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to get the subcategories" });
    }
  },
};
