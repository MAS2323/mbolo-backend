import Product from "../models/Products.js";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
import fs from "node:fs";

export default {
  createProduct: async (req, res) => {
    try {
      const {
        title,
        supplier,
        price,
        product_location,
        description,
        phoneNumber,
        whatsapp,
        category,
        subcategory,
        customFields, // Nuevo campo personalizado
        type, // Asegurándonos de que 'type' está presente
      } = req.body;

      // Validación de campos requeridos
      const requiredFields = [
        title,
        supplier,
        price,
        product_location,
        description,
        phoneNumber,
        whatsapp,
        category,
        subcategory,
      ];
      if (requiredFields.some((field) => !field)) {
        return res
          .status(400)
          .json({ message: "Todos los campos son obligatorios" });
      }

      // Validación de tipo de producto
      if (type !== "product") {
        return res
          .status(400)
          .json({ message: "El campo 'type' debe ser 'product'" });
      }

      // Validación de archivos (imágenes)
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Debes subir al menos una imagen" });
      }

      const folderName = "productos_mbolo"; // Nombre de la carpeta en Cloudinary
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

      // Crear el producto en la base de datos
      const newProduct = new Product({
        title,
        supplier,
        price,
        product_location,
        description,
        phoneNumber,
        whatsapp,
        images,
        category,
        subcategory,
        customFields: customFields || {}, // Agregar campos personalizados
        type: "product", // Aseguramos que el tipo es siempre 'product'
        user: req.user?._id || null, // Asumiendo que el usuario está autenticado
      });

      const savedProduct = await newProduct.save();
      res.status(201).json({
        message: "Producto creado exitosamente",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);
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
      const products = await Product.find()
        .populate("product_location") // Obtiene detalles de la ubicación
        .populate("category") // Obtiene detalles de la categoría
        .populate("subcategory") // Obtiene detalles de la subcategoría
        .sort({ createdAt: -1 });

      res.status(200).json(products);
    } catch (error) {
      console.error("Error al obtener los productos:", error);
      res.status(500).json({ message: "Fallo al obtener los productos" });
    }
  },

  getProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate("product_location") // Obtiene detalles de la ubicación
        .populate("category") // Obtiene detalles de la categoría
        .populate("subcategory"); // Obtiene detalles de la subcategoría

      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error("Error al obtener el producto:", error);
      res.status(500).json({ message: "Fallo al obtener el producto" });
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
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          ...req.body,
          customFields: req.body.customFields || product.customFields,
        }, // Actualizar customFields
        { new: true } // Devuelve el documento actualizado
      );

      res.status(200).json(updatedProduct);
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
