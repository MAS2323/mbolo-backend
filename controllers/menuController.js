import Menu from "../models/Menu.js";
import mongoose from "mongoose";
import { uploadImage, deleteImage, uploadPDF } from "../utils/cloudinary.js";
import fs from "node:fs";

export default {
  /**
   * Obtiene los menús por categoría.
   */
  getMenusByCategory: async (req, res) => {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).send("Invalid categoryId format");
    }

    try {
      const menus = await Menu.find({ category: categoryId }).populate(
        "location category"
      );
      res.json(menus);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Crea un nuevo menú.
   */
  createMenu: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const {
        name,
        description,
        location,
        socialMedia,
        horario,
        phoneNumber,
        whatsapp,
        subcategory,
      } = req.body;

      // Validaciones de entrada
      const requiredFields = {
        name,
        description,
        "location.city": location?.city,
        "location.province": location?.province,
        phoneNumber,
        whatsapp,
        subcategory,
        categoryId,
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length) {
        return res.status(400).json({
          message: "Todos los campos son obligatorios",
          missing: missingFields,
        });
      }

      // Validar IDs de MongoDB
      if (
        !mongoose.Types.ObjectId.isValid(categoryId) ||
        !mongoose.Types.ObjectId.isValid(subcategory)
      ) {
        return res.status(400).json({
          message: "Uno o más IDs no son válidos",
          details: { categoryId, subcategory },
        });
      }

      // Convertir req.files a un array plano
      let files = [];
      if (req.files) {
        if (req.files.images) {
          files = files.concat(
            Array.isArray(req.files.images)
              ? req.files.images
              : [req.files.images]
          );
        }
        if (req.files.pdf) {
          files = files.concat(
            Array.isArray(req.files.pdf) ? req.files.pdf : [req.files.pdf]
          );
        }
      }

      // Validar carga de imágenes (debe haber al menos una imagen)
      const imageFiles = files.filter((file) =>
        file.mimetype.startsWith("image")
      );
      if (imageFiles.length === 0) {
        return res
          .status(400)
          .json({ message: "Debes subir al menos una imagen" });
      }

      // Subir imágenes a Cloudinary
      const images = await Promise.all(
        imageFiles.map(async (file) => {
          const result = await uploadImage(file.path, "menu_mbolo");
          // Eliminar el archivo local después de subirlo a Cloudinary
          fs.unlinkSync(file.path);
          return result;
        })
      );

      // Subir PDF a Cloudinary (si existe)
      let pdfResult = null;
      const pdfFile = files.find((file) => file.mimetype === "application/pdf");
      if (pdfFile) {
        pdfResult = await uploadPDF(pdfFile.path, "menu_pdfs");
        // Eliminar el archivo local después de subirlo a Cloudinary
        fs.unlinkSync(pdfFile.path);
      }

      // Parsear campos JSON con manejo de errores
      const parseJsonField = (field, defaultValue = []) => {
        try {
          return field ? JSON.parse(field) : defaultValue;
        } catch (error) {
          console.error(`Error al parsear JSON para campo: ${field}`, error);
          return defaultValue;
        }
      };

      // Crear y guardar el nuevo menú
      const newMenu = new Menu({
        name,
        description,
        location: {
          city: location?.city || "",
          province: location?.province || "",
        },
        socialMedia: parseJsonField(socialMedia),
        horario: parseJsonField(horario),
        phoneNumber,
        whatsapp,
        images,
        pdf: pdfResult ? pdfResult.url : null,
        category: categoryId,
        subcategory,
      });

      const savedMenu = await newMenu.save();

      return res.status(201).json({
        message: "Menú creado exitosamente",
        menu: savedMenu,
      });
    } catch (error) {
      console.error("Error al crear menú:", error);
      return res.status(500).json({
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  },
  /**
   * Obtiene un menú por su ID.
   */
  getMenuById: async (req, res) => {
    try {
      const { menuId } = req.params;
      const menu = await Menu.findById(menuId).populate("location category");
      if (!menu) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json(menu);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  },

  /**
   * Obtiene todos los menús.
   */
  getAllMenus: async (req, res) => {
    try {
      const menus = await Menu.find().populate("location category");
      res.json(menus);
    } catch (error) {
      console.error("Error fetching menus:", error);
      res.status(500).json({ message: "Server error while fetching menus" });
    }
  },

  /**
   * Actualiza un menú por su ID.
   */
  updateMenuById: async (req, res) => {
    try {
      const { menuId } = req.params;
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

      const updatedMenu = await Menu.findByIdAndUpdate(
        menuId,
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

      if (!updatedMenu) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json(updatedMenu);
    } catch (error) {
      console.error("Error updating menu:", error);
      res.status(500).json({ error: "Failed to update menu" });
    }
  },

  /**
   * Elimina un menú por su ID.
   */
  deleteMenuById: async (req, res) => {
    try {
      const { menuId } = req.params;
      const deletedMenu = await Menu.findByIdAndDelete(menuId);
      if (!deletedMenu) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json({ message: "Menu deleted successfully" });
    } catch (error) {
      console.error("Error deleting menu:", error);
      res.status(500).json({ error: "Failed to delete menu" });
    }
  },
  // Opción 1: Controlador específico para subcategorías
  getMenusBySubcategory: async (req, res) => {
    try {
      const { subcategoryId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return res
          .status(400)
          .json({ message: "ID de subcategoría no válido" });
      }

      const menus = await Menu.find({ subcategory: subcategoryId });
      res.json(menus);
    } catch (error) {
      console.error("Error al obtener menús por subcategoría:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  },

  // Opción 2: Controlador unificado
  getMenusByCategoryOrSubcategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { subcategory } = req.query; // Opcional: ?subcategory=true

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: "ID no válido" });
      }

      let query = { category: categoryId };

      if (subcategory === "true") {
        query = { subcategory: categoryId };
      }

      const menus = await Menu.find(query);
      res.json(menus);
    } catch (error) {
      console.error("Error al obtener menús:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  },
  /**
   * Busca menús por texto.
   */
  searchMenus: async (req, res) => {
    try {
      const result = await Menu.aggregate([
        {
          $search: {
            index: "menus",
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
      console.error("Error fetching menus:", error);
      res.status(500).json({ message: "Failed to get the menus" });
    }
  },
};
