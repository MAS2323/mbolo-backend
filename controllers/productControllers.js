import Product from "../models/Products.js";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import User from "../models/User.js";
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
        subcategory,
        customFields,
      } = req.body;

      const userId = req.params.userId; // Obtener el userId desde los parámetros de la URL

      // Validar campos obligatorios
      if (
        !title ||
        !supplier ||
        !price ||
        !product_location ||
        !description ||
        !phoneNumber ||
        !whatsapp ||
        !subcategory ||
        !userId
      ) {
        return res
          .status(400)
          .json({ message: "Todos los campos son obligatorios" });
      }

      // Validar imágenes
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Debes subir al menos una imagen" });
      }

      // Validar ID de usuario
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ message: "El ID de usuario no es válido" });
      }

      // Verificar si el usuario existe
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "El usuario no existe" });
      }

      const folderName = "productos_mbolo";
      const images = [];

      // Subir imágenes a Cloudinary
      for (const file of req.files) {
        try {
          const result = await uploadImage(file.path, folderName);
          images.push({
            url: result.url,
            public_id: result.public_id,
          });
        } catch (error) {
          console.error("Error al subir la imagen:", error);
          // Eliminar imágenes ya subidas en caso de error
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
        } finally {
          fs.unlinkSync(file.path); // Eliminar archivo temporal
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
        subcategory,
        customFields: customFields || {},
        type: "product", // Valor por defecto
        user: userId,
      });

      const savedProduct = await newProduct.save();

      // Actualizar el usuario con el nuevo producto
      await User.findByIdAndUpdate(userId, {
        $push: { products: savedProduct._id },
      });

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
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Contacta al soporte técnico",
      });
    }
  },
  getAllProduct: async (req, res) => {
    try {
      const products = await Product.find()
        .populate("product_location") // Obtiene detalles de la ubicación
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
