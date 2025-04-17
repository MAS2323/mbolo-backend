import Product from "../models/Products.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import ShortLink from "../models/ShortLink.js";
import Tienda from "../models/Tienda.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import fs from "node:fs";

export default {
  createProduct: async (req, res) => {
    try {
      console.log("Received POST to /products/:userId", {
        userId: req.params.userId,
        body: req.body,
        files: req.files
          ? Object.keys(req.files).map((key) =>
              req.files[key].map((f) => ({
                path: f.path,
                mimetype: f.mimetype,
                size: f.size,
              }))
            )
          : null,
      });

      const {
        title,
        supplier,
        price,
        description,
        category,
        subcategory,
        customFields,
        tallas,
        numeros_calzado,
        colores,
      } = req.body;

      const userId = req.params.userId;

      // Validations
      if (
        !title ||
        !supplier ||
        !price ||
        !description ||
        !category ||
        !subcategory ||
        !userId
      ) {
        return res
          .status(400)
          .json({ message: "All required fields must be present" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(category) ||
        !mongoose.Types.ObjectId.isValid(subcategory)
      ) {
        return res.status(400).json({ message: "One or more IDs are invalid" });
      }

      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "User does not exist" });
      }

      const tienda = await Tienda.findOne({ owner: userId });
      if (!tienda) {
        return res
          .status(404)
          .json({ message: "User does not have an associated store" });
      }

      const folderName = "productos_mbolo";
      const images = [];
      const videos = [];

      // Handle file uploads
      if (req.files && (req.files.images || req.files.videos)) {
        const imageFiles = req.files.images || [];
        const videoFiles = req.files.videos || [];

        for (const file of [...imageFiles, ...videoFiles]) {
          try {
            const isVideo = file.mimetype.startsWith("video/");
            console.log(`Uploading file: ${file.originalname}`, {
              path: file.path,
              mimetype: file.mimetype,
              size: file.size,
            });
            const result = await uploadImage(file.path, folderName, "auto");
            console.log(`Uploaded file: ${file.originalname}`, {
              url: result.url,
              public_id: result.public_id,
            });
            if (isVideo) {
              videos.push({ url: result.url, public_id: result.public_id });
            } else {
              images.push({ url: result.url, public_id: result.public_id });
            }
          } catch (error) {
            console.error(`Error uploading file ${file.originalname}:`, {
              message: error.message,
              details: error,
            });
            // Clean up uploaded files
            for (const img of images) {
              await deleteImage(img.public_id, "image").catch((err) =>
                console.error("Error deleting image:", err)
              );
            }
            for (const vid of videos) {
              await deleteImage(vid.public_id, "video").catch((err) =>
                console.error("Error deleting video:", err)
              );
            }
            let errorMessage = "Error uploading file to Cloudinary";
            if (error.message.includes("File size too large")) {
              errorMessage =
                "El archivo es demasiado grande. El tamaño máximo permitido es 40MB. Por favor, comprime el video.";
            }
            return res.status(500).json({
              error: errorMessage,
              details: error.message,
            });
          } finally {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error(`Error deleting temp file ${file.path}:`, err);
            }
          }
        }
      } else {
        return res
          .status(400)
          .json({ message: "At least one image or video is required" });
      }

      // Parse and validate optional fields
      let parsedTallas = [];
      if (tallas) {
        try {
          parsedTallas = JSON.parse(tallas);
          if (!Array.isArray(parsedTallas)) {
            return res
              .status(400)
              .json({ message: "tallas must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid tallas format" });
        }
      }

      let parsedNumerosCalzado = [];
      if (numeros_calzado) {
        try {
          parsedNumerosCalzado = JSON.parse(numeros_calzado);
          if (
            !Array.isArray(parsedNumerosCalzado) ||
            !parsedNumerosCalzado.every(Number.isInteger)
          ) {
            return res.status(400).json({
              message: "numeros_calzado must be an array of integers",
            });
          }
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid numeros_calzado format" });
        }
      }

      let parsedColores = [];
      if (colores) {
        try {
          parsedColores = JSON.parse(colores);
          if (!Array.isArray(parsedColores)) {
            return res
              .status(400)
              .json({ message: "colores must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid colores format" });
        }
      }

      let parsedCustomFields = {};
      if (customFields) {
        try {
          parsedCustomFields = JSON.parse(customFields);
          if (
            typeof parsedCustomFields !== "object" ||
            Array.isArray(parsedCustomFields)
          ) {
            return res
              .status(400)
              .json({ message: "customFields must be an object" });
          }
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid customFields format" });
        }
      }

      // Create new product
      const newProduct = new Product({
        title,
        supplier,
        price: parseFloat(price),
        description,
        images,
        videos,
        category,
        subcategory,
        customFields: parsedCustomFields,
        type: "product",
        tienda: tienda._id,
        tallas: parsedTallas,
        numeros_calzado: parsedNumerosCalzado,
        colores: parsedColores,
        favorites: [],
        comentarios: [],
      });

      const savedProduct = await newProduct.save();
      console.log("Product saved:", savedProduct._id);

      // Update Tienda with new product
      await Tienda.findByIdAndUpdate(tienda._id, {
        $push: { products: savedProduct._id },
      });

      res.status(201).json({
        message: "Product created successfully",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating product:", {
        message: error.message,
        stack: error.stack,
      });
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Validation error", details: error.message });
      }
      res.status(500).json({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Contact technical support",
      });
    }
  },

  getAllProduct: async (req, res) => {
    try {
      const products = await Product.find()
        .populate("tienda")
        .populate("subcategory") // Asegúrate de que "Subcategoryp" (o "Subcategory") esté registrado
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
        .populate("tienda")
        .populate("subcategory");
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
      let newVideos = product.videos || [];

      if (req.files && req.files.length > 0) {
        const folderName = "productos_mbolo";

        // Eliminar imágenes y videos antiguos si se proporcionan nuevos
        if (product.images && product.images.length > 0) {
          for (const img of product.images) {
            if (img.public_id) {
              await deleteImage(img.public_id);
              console.log(`Imagen antigua eliminada: ${img.public_id}`);
            }
          }
        }
        if (product.videos && product.videos.length > 0) {
          for (const vid of product.videos) {
            if (vid.public_id) {
              await deleteImage(vid.public_id);
              console.log(`Video antiguo eliminado: ${vid.public_id}`);
            }
          }
        }

        // Subir nuevas imágenes y videos
        newImages = [];
        newVideos = [];
        for (const file of req.files) {
          const isVideo = file.mimetype.startsWith("video/");
          const { url, public_id } = await uploadImage(file.path, folderName);
          if (isVideo) {
            newVideos.push({ url, public_id });
          } else {
            newImages.push({ url, public_id });
          }
          fs.unlinkSync(file.path);
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          ...req.body,
          images: newImages,
          videos: newVideos,
          customFields: req.body.customFields || product.customFields,
          tallas: req.body.tallas || product.tallas,
          numeros_calzado: req.body.numeros_calzado || product.numeros_calzado,
          colores: req.body.colores || product.colores,
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
      })
        .populate("category subcategory")
        .populate("tienda");

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

      // Eliminar las imágenes y videos de Cloudinary si existen
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          if (img.public_id) {
            await deleteImage(img.public_id);
            console.log(`Imagen eliminada: ${img.public_id}`);
          }
        }
      }
      if (product.videos && product.videos.length > 0) {
        for (const vid of product.videos) {
          if (vid.public_id) {
            await deleteImage(vid.public_id);
            console.log(`Video eliminado: ${vid.public_id}`);
          }
        }
      }

      // Eliminar el producto de la tienda
      await Tienda.findByIdAndUpdate(product.tienda, {
        $pull: { products: product._id },
      });

      res.status(200).json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      res.status(500).json({ message: "Fallo al eliminar el producto" });
    }
  },

  generateShortLink: async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de producto no válido" });
    }

    try {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      const shortLink = `${process.env.BASE_URL}/producto/${id}`;
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

  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, comment } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res
          .status(400)
          .json({ message: "ID de producto o usuario no válido" });
      }

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (!comment || comment.trim() === "") {
        return res
          .status(400)
          .json({ message: "El comentario no puede estar vacío" });
      }

      product.comentarios.push({ user: userId, comment });
      await product.save();

      res
        .status(200)
        .json({ message: "Comentario añadido exitosamente", product });
    } catch (error) {
      console.error("Error al añadir comentario:", error);
      res.status(500).json({ message: "Fallo al añadir el comentario" });
    }
  },

  getComments: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de producto no válido" });
      }

      const product = await Product.findById(id).populate("comentarios.user");
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.status(200).json({ comments: product.comentarios });
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Fallo al obtener los comentarios" });
    }
  },

  
  // New controller: Get products by tienda ID
  getProductsByTienda: async (req, res) => {
    try {
      const { tiendaId } = req.params;

      // Validate tiendaId
      if (!mongoose.Types.ObjectId.isValid(tiendaId)) {
        return res.status(400).json({ message: "ID de tienda no válido" });
      }

      // Verify tienda exists
      const tienda = await Tienda.findById(tiendaId);
      if (!tienda) {
        return res.status(404).json({ message: "Tienda no encontrada" });
      }

      // Find products associated with the tienda
      const products = await Product.find({ tienda: tiendaId })
        .populate("tienda", "name logo") // Populate tienda details (e.g., name, logo)
        .populate("category", "name") // Populate category name
        .populate("subcategory", "name") // Populate subcategory name
        .sort({ createdAt: -1 }); // Sort by newest first

      // Check if products exist
      if (!products || products.length === 0) {
        return res.status(200).json({
          message: "No se encontraron productos para esta tienda",
          products: [],
        });
      }

      res.status(200).json({
        message: "Productos obtenidos exitosamente",
        products,
      });
    } catch (error) {
      console.error("Error al obtener los productos por tienda:", {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Error interno del servidor",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Contact technical support",
      });
    }
  },
};
