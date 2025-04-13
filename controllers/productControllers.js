import Product from "../models/Products.js";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
import ShortLink from "../models/ShortLink.js";
import Tienda from "../models/Tienda.js";
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
        domicilio,
        whatsapp,
        category,
        subcategory,
        customFields,
      } = req.body;

      const userId = req.params.userId;

      // 📌 Validaciones de entrada
      if (
        !title ||
        !supplier ||
        !price ||
        !product_location ||
        !description ||
        !domicilio ||
        !phoneNumber ||
        !whatsapp ||
        !category ||
        !subcategory ||
        !userId
      ) {
        return res
          .status(400)
          .json({ message: "Todos los campos son obligatorios" });
      }

      // Validar IDs (usuario, categoría, subcategoría)
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(category) ||
        !mongoose.Types.ObjectId.isValid(subcategory)
      ) {
        return res
          .status(400)
          .json({ message: "Uno o más IDs no son válidos" });
      }

      // Verificar si el usuario existe
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "El usuario no existe" });
      }

      // 📌 Find the store owned by the user
      const tienda = await Tienda.findOne({ owner: userId });
      if (!tienda) {
        return res
          .status(404)
          .json({ message: "El usuario no tiene una tienda asociada" });
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

      // Crear el producto en la base de datos, asociándolo con la tienda
      const newProduct = new Product({
        title,
        supplier,
        price,
        product_location,
        description,
        phoneNumber,
        whatsapp,
        images,
        domicilio,
        category,
        subcategory,
        customFields: customFields || {},
        type: "product",
        user: userId,
        tienda: tienda._id, // 📌 Associate the product with the store
      });

      const savedProduct = await newProduct.save();

      // 📌 Update the store's products array with the new product
      await Tienda.findByIdAndUpdate(tienda._id, {
        $push: { products: savedProduct._id },
      });

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
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      let newImages = product.images || [];

      if (req.files && req.files.length > 0) {
        const folderName = "productos_mbolo";

        // Eliminar imágenes antiguas si se proporcionan nuevas
        if (product.images && product.images.length > 0) {
          for (const image of product.images) {
            if (image.public_id) {
              await deleteImage(image.public_id); // Usar deleteImage importada
              console.log(`Imagen antigua eliminada: ${image.public_id}`);
            } else {
              console.log(
                `No se encontró public_id para imagen antigua: ${image.url}`
              );
            }
          }
        }

        // Subir nuevas imágenes
        newImages = [];
        for (const file of req.files) {
          const { url, public_id } = await uploadImage(file.path, folderName);
          newImages.push({ url, public_id });
          fs.unlinkSync(file.path);
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          ...req.body,
          images: newImages,
          customFields: req.body.customFields || product.customFields,
        },
        { new: true }
      );
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      res
        .status(500)
        .json({ message: "Fallo a la hora de actualizar el producto" });
    }
  },

  getProductsByCategoryAndSubcategory: async (req, res) => {
    try {
      const { category, subcategory } = req.query;

      if (!category || !subcategory) {
        return res
          .status(400)
          .json({ message: "La categoría y subcategoría son obligatorias" });
      }

      const products = await Product.find({
        category,
        subcategory,
      }).populate("category subcategory");

      res.status(200).json({ success: true, products });
    } catch (error) {
      console.error("Error al filtrar productos:", error);
      res.status(500).json({
        error: "Error interno del servidor",
        details: error.message,
      });
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
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      console.log("Imágenes del producto:", product.images);

      // Eliminar las imágenes de Cloudinary si existen
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          let publicId = image.public_id;

          // Si no hay public_id, extraerlo de la URL
          if (!publicId && image.url) {
            const urlParts = image.url.split("/");
            const fileName = urlParts.pop();
            const folder = urlParts.pop();
            publicId = `${folder}/${fileName.split(".")[0]}`;
            console.log(`Extrayendo public_id de la URL: ${publicId}`);
          }

          if (publicId) {
            try {
              await deleteImage(publicId); // Usar deleteImage importada
              console.log(`Imagen eliminada: ${publicId}`);
            } catch (error) {
              console.error(
                "Error al eliminar la imagen de Cloudinary:",
                error
              );
            }
          } else {
            console.log(
              "No se pudo determinar el public_id para la imagen:",
              image.url
            );
          }
        }
      }

      res.status(200).json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      res.status(500).json({ message: "Fallo al eliminar el producto" });
    }
  },
  generateShortLink: async (req, res) => {
    const { id } = req.params;

    // Verifica que el ID del producto sea válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de producto no válido" });
    }

    try {
      // Busca el producto en la base de datos
      const product = await Product.findById(id); // Use 'id' instead of 'productId'
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Genera el enlace corto
      const shortLink = `${process.env.BASE_URL}/producto/${id}`; // Use 'id' instead of 'productId'

      // Devuelve el enlace corto
      res.json({ shortLink });
    } catch (error) {
      console.error("Error al generar el enlace:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
  redirectToProduct: async (req, res) => {
    try {
      const { shortCode } = req.params;
      const shortLink = await ShortLink.findOne({ shortCode }).populate(
        "productId"
      );

      if (!shortLink) {
        return res.status(404).json({ message: "Enlace no encontrado" });
      }

      res.redirect(
        `${process.env.BASE_URL}/producto/${shortLink.productId._id}`
      );
    } catch (error) {
      console.error("Error al redirigir:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};
