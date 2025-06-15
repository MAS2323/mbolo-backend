import Product from "../models/Products.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import ShortLink from "../models/ShortLink.js";
import Tienda from "../models/Tienda.js";
import Location from "../models/Location.js";
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
        description,
        category,
        subcategory,
        customFields,
        tallas,
        numeros_calzado,
        colores,
        brand,
        condition,
        year,
        location,
        dimensions,
        weight,
        features,
        specifications,
        stock,
        warranty,
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

      // Validate location if provided
      let locationId = null;
      if (location) {
        if (!mongoose.Types.ObjectId.isValid(location)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const locationExists = await Location.findById(location);
        if (!locationExists) {
          return res.status(404).json({ message: "Location not found" });
        }
        locationId = location;
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

      let parsedDimensions = {};
      if (dimensions) {
        try {
          parsedDimensions = JSON.parse(dimensions);
          if (
            typeof parsedDimensions !== "object" ||
            Array.isArray(parsedDimensions)
          ) {
            return res
              .status(400)
              .json({ message: "dimensions must be an object" });
          }
          if (
            (parsedDimensions.length &&
              typeof parsedDimensions.length !== "number") ||
            (parsedDimensions.width &&
              typeof parsedDimensions.width !== "number") ||
            (parsedDimensions.height &&
              typeof parsedDimensions.height !== "number")
          ) {
            return res
              .status(400)
              .json({ message: "Dimensions must be numbers" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid dimensions format" });
        }
      }

      let parsedWeight = {};
      if (weight) {
        try {
          parsedWeight = JSON.parse(weight);
          if (typeof parsedWeight !== "object" || Array.isArray(parsedWeight)) {
            return res
              .status(400)
              .json({ message: "weight must be an object" });
          }
          if (parsedWeight.value && typeof parsedWeight.value !== "number") {
            return res
              .status(400)
              .json({ message: "Weight value must be a number" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid weight format" });
        }
      }

      let parsedFeatures = [];
      if (features) {
        try {
          parsedFeatures = JSON.parse(features);
          if (!Array.isArray(parsedFeatures)) {
            return res
              .status(400)
              .json({ message: "features must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid features format" });
        }
      }

      let parsedSpecifications = {};
      if (specifications) {
        try {
          parsedSpecifications = JSON.parse(specifications);
          if (
            typeof parsedSpecifications !== "object" ||
            Array.isArray(parsedSpecifications)
          ) {
            return res
              .status(400)
              .json({ message: "specifications must be an object" });
          }
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid specifications format" });
        }
      }

      let parsedWarranty = {};
      if (warranty) {
        try {
          parsedWarranty = JSON.parse(warranty);
          if (
            typeof parsedWarranty !== "object" ||
            Array.isArray(parsedWarranty)
          ) {
            return res
              .status(400)
              .json({ message: "warranty must be an object" });
          }
          if (
            parsedWarranty.duration &&
            typeof parsedWarranty.duration !== "number"
          ) {
            return res
              .status(400)
              .json({ message: "Warranty duration must be a number" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid warranty format" });
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
        phone_number: tienda.phone_number, // Set from tienda
        tallas: parsedTallas,
        numeros_calzado: parsedNumerosCalzado,
        colores: parsedColores,
        brand,
        condition,
        year: year ? parseInt(year) : undefined,
        location: locationId,
        dimensions: parsedDimensions,
        weight: parsedWeight,
        features: parsedFeatures,
        specifications: parsedSpecifications,
        stock: stock ? parseInt(stock) : 1,
        warranty: {
          duration: parsedWarranty.duration,
          description: parsedWarranty.description,
        },
        favorites: [],
        comentarios: [],
      });

      const savedProduct = await newProduct.save();
      // console.log("Product saved:", savedProduct._id);

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
          .json({ message: "Validation error", details: error.message });
      }
      return res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Contact technical support",
      });
    }
  },

  getAllProduct: async (req, res) => {
    try {
      const products = await Product.find()
        .populate("tienda", "name logo")
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("location", "name address city country") // Populate location details
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
        .populate("tienda", "name logo")
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("location", "name address city country");
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

      if (req.files && (req.files.images || req.files.videos)) {
        const folderName = "productos_mbolo";

        // Delete old images and videos if new ones are provided
        if (product.images && product.images.length > 0) {
          for (const img of product.images) {
            if (img.public_id) {
              await deleteImage(img.public_id, "image").catch((err) =>
                console.error("Error deleting image:", err)
              );
              console.log(`Imagen antigua eliminada: ${img.public_id}`);
            }
          }
        }
        if (product.videos && product.videos.length > 0) {
          for (const vid of product.videos) {
            if (vid.public_id) {
              await deleteImage(vid.public_id, "video").catch((err) =>
                console.error("Error deleting video:", err)
              );
              console.log(`Video antiguo eliminado: ${vid.public_id}`);
            }
          }
        }

        // Upload new images and videos
        newImages = [];
        newVideos = [];
        const imageFiles = req.files.images || [];
        const videoFiles = req.files.videos || [];
        for (const file of [...imageFiles, ...videoFiles]) {
          const isVideo = file.mimetype.startsWith("video/");
          const { url, public_id } = await uploadImage(
            file.path,
            folderName,
            "auto"
          );
          if (isVideo) {
            newVideos.push({ url, public_id });
          } else {
            newImages.push({ url, public_id });
          }
          fs.unlinkSync(file.path);
        }
      }

      // Parse and validate optional fields
      let parsedTallas = product.tallas;
      if (req.body.tallas) {
        try {
          parsedTallas = JSON.parse(req.body.tallas);
          if (!Array.isArray(parsedTallas)) {
            return res
              .status(400)
              .json({ message: "tallas must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid tallas format" });
        }
      }

      let parsedNumerosCalzado = product.numeros_calzado;
      if (req.body.numeros_calzado) {
        try {
          parsedNumerosCalzado = JSON.parse(req.body.numeros_calzado);
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

      let parsedColores = product.colores;
      if (req.body.colores) {
        try {
          parsedColores = JSON.parse(req.body.colores);
          if (!Array.isArray(parsedColores)) {
            return res
              .status(400)
              .json({ message: "colores must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid colores format" });
        }
      }

      let parsedCustomFields = product.customFields;
      if (req.body.customFields) {
        try {
          parsedCustomFields = JSON.parse(req.body.customFields);
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

      let locationId = product.location;
      if (req.body.location) {
        if (!mongoose.Types.ObjectId.isValid(req.body.location)) {
          return res.status(400).json({ message: "Invalid location ID" });
        }
        const locationExists = await Location.findById(req.body.location);
        if (!locationExists) {
          return res.status(404).json({ message: "Location not found" });
        }
        locationId = req.body.location;
      }

      let parsedDimensions = product.dimensions;
      if (req.body.dimensions) {
        try {
          parsedDimensions = JSON.parse(req.body.dimensions);
          if (
            typeof parsedDimensions !== "object" ||
            Array.isArray(parsedDimensions)
          ) {
            return res
              .status(400)
              .json({ message: "dimensions must be an object" });
          }
          if (
            (parsedDimensions.length &&
              typeof parsedDimensions.length !== "number") ||
            (parsedDimensions.width &&
              typeof parsedDimensions.width !== "number") ||
            (parsedDimensions.height &&
              typeof parsedDimensions.height !== "number")
          ) {
            return res
              .status(400)
              .json({ message: "Dimensions must be numbers" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid dimensions format" });
        }
      }

      let parsedWeight = product.weight;
      if (req.body.weight) {
        try {
          parsedWeight = JSON.parse(req.body.weight);
          if (typeof parsedWeight !== "object" || Array.isArray(parsedWeight)) {
            return res
              .status(400)
              .json({ message: "weight must be an object" });
          }
          if (parsedWeight.value && typeof parsedWeight.value !== "number") {
            return res
              .status(400)
              .json({ message: "Weight value must be a number" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid weight format" });
        }
      }

      let parsedFeatures = product.features;
      if (req.body.features) {
        try {
          parsedFeatures = JSON.parse(req.body.features);
          if (!Array.isArray(parsedFeatures)) {
            return res
              .status(400)
              .json({ message: "features must be an array of strings" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid features format" });
        }
      }

      let parsedSpecifications = product.specifications;
      if (req.body.specifications) {
        try {
          parsedSpecifications = JSON.parse(req.body.specifications);
          if (
            typeof parsedSpecifications !== "object" ||
            Array.isArray(parsedSpecifications)
          ) {
            return res
              .status(400)
              .json({ message: "specifications must be an object" });
          }
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Invalid specifications format" });
        }
      }

      let parsedWarranty = product.warranty;
      if (req.body.warranty) {
        try {
          parsedWarranty = JSON.parse(req.body.warranty);
          if (
            typeof parsedWarranty !== "object" ||
            Array.isArray(parsedWarranty)
          ) {
            return res
              .status(400)
              .json({ message: "warranty must be an object" });
          }
          if (
            parsedWarranty.duration &&
            typeof parsedWarranty.duration !== "number"
          ) {
            return res
              .status(400)
              .json({ message: "Warranty duration must be a number" });
          }
        } catch (error) {
          return res.status(400).json({ message: "Invalid warranty format" });
        }
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          ...req.body,
          images: newImages,
          videos: newVideos,
          customFields: parsedCustomFields,
          tallas: parsedTallas,
          numeros_calzado: parsedNumerosCalzado,
          colores: parsedColores,
          brand: req.body.brand || product.brand,
          condition: req.body.condition || product.condition,
          year: req.body.year ? parseInt(req.body.year) : product.year,
          location: locationId,
          dimensions: parsedDimensions,
          weight: parsedWeight,
          features: parsedFeatures,
          specifications: parsedSpecifications,
          stock: req.body.stock ? parseInt(req.body.stock) : product.stock,
          warranty: parsedWarranty,
        },
        { new: true }
      ).populate("location", "name address city country");
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
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("tienda", "name logo")
        .populate("location", "name address city country");

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
              path: ["title", "description", "brand", "features"],
            },
          },
        },
      ]);
      // Populate after aggregation
      const populatedResults = await Product.populate(result, [
        { path: "tienda", select: "name logo" },
        { path: "category", select: "name" },
        { path: "subcategory", select: "name" },
        { path: "location", select: "name address city country" },
      ]);
      res.status(200).json(populatedResults);
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

      // Delete images and videos from Cloudinary
      if (product.images && product.images.length > 0) {
        for (const img of product.images) {
          if (img.public_id) {
            await deleteImage(img.public_id, "image").catch((err) =>
              console.error("Error deleting image:", err)
            );
            console.log(`Imagen eliminada: ${img.public_id}`);
          }
        }
      }
      if (product.videos && product.videos.length > 0) {
        for (const vid of product.videos) {
          if (vid.public_id) {
            await deleteImage(vid.public_id, "video").catch((err) =>
              console.error("Error deleting video:", err)
            );
            console.log(`Video eliminado: ${vid.public_id}`);
          }
        }
      }

      // Remove product from tienda
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

  getProductsByTienda: async (req, res) => {
    try {
      const { tiendaId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(tiendaId)) {
        return res.status(400).json({ message: "ID de tienda no válido" });
      }

      const tienda = await Tienda.findById(tiendaId);
      if (!tienda) {
        return res.status(404).json({ message: "Tienda no encontrada" });
      }

      const products = await Product.find({ tienda: tiendaId })
        .populate("tienda", "name logo")
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("location", "name address city country")
        .sort({ createdAt: -1 });

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
