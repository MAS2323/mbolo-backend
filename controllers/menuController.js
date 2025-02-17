import Menu from "../models/Menu.js";
import mongoose from "mongoose";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
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

      const folderName = "menu_mbolo"; // Nombre de la carpeta en Cloudinary
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

      // Crear el menú en la base de datos
      const menu = new Menu({
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

      const savedMenu = await menu.save();
      res.status(201).json({
        message: "Menú creado exitosamente",
        menu: savedMenu,
      });
    } catch (error) {
      console.error("Error creating menu:", error);

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
      const menus = await Menu.find().lean().populate("location category");
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
