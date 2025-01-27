import Product from "../models/Products.js";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
import fs from "node:fs";

export default {
  createProduct: async (req, res) => {
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

  getAllProduct: async (req, res) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json("failed to get the products");
    }
  },

  getProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json("failed to get the product");
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;

      // Obtener el producto actual de la base de datos
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Verificar si se están actualizando las imágenes
      if (req.files && req.files.length > 0) {
        const folderName = "productos_mbolo"; // Nombre de la carpeta en Cloudinary

        // Eliminar las imágenes antiguas de Cloudinary
        for (const image of product.images) {
          await deleteImage(image.public_id);
        }

        // Subir las nuevas imágenes a Cloudinary en la carpeta especificada
        const newImages = [];
        for (const file of req.files) {
          const { url, public_id } = await updateImage(file.path, folderName);
          newImages.push({ url, public_id });
          fs.unlinkSync(file.path); // Eliminar el archivo temporal
        }

        // Actualizar el campo de imágenes en el producto
        req.body.images = newImages;
      }

      // Actualizar el producto en la base de datos
      const productUpdated = await Product.findByIdAndUpdate(id, req.body, {
        new: true, // Devuelve el documento actualizado
      });

      return res.json(productUpdated);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      res
        .status(500)
        .json({ message: "Fallo a la hora de actualizar el producto" });
    }
  },

  searchProduct: async (req, res) => {
    try {
      const result = await Product.aggregate([
        {
          $search: {
            index: "mbolo_app",
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
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to get the products" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json("product not found");
      }

      // Eliminar las imágenes de Cloudinary
      for (const image of product.images) {
        try {
          await deleteImage(image.public_id);
          console.log(`Imagen eliminada: ${image.public_id}`);
        } catch (error) {
          console.error("Error al eliminar la imagen de Cloudinary:", error);
        }
      }

      res.status(200).json("product deleted successfully");
    } catch (error) {
      res.status(500).json("failed to delete the product");
    }
  },
};
