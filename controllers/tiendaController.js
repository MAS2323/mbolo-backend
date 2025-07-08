import mongoose from "mongoose";
import Tienda from "../models/Tienda.js";
import User from "../models/User.js";
import Location from "../models/Location.js";
import Producto from "../models/Products.js"; // Ensure Producto model is imported
import fs from "fs";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// Predefined payment method images
const PAYMENT_METHOD_IMAGES = {
  EcoBank: {
    url: "https://res.cloudinary.com/masonewe/image/upload/v1751954380/productos_mbolo/ulctnuggoadr0pz9h5uc.png",
    public_id: "productos_mbolo/ulctnuggoadr0pz9h5uc",
  },
  BGFBank: {
    url: "https://res.cloudinary.com/masonewe/image/upload/v1751954381/productos_mbolo/ylqjdm33hr72qiogaafj.png",
    public_id: "productos_mbolo/ylqjdm33hr72qiogaafj",
  },
  "Muni-Dinero": {
    url: "https://res.cloudinary.com/masonewe/image/upload/v1751954379/productos_mbolo/indmbmcxzan7hewzxaga.png",
    public_id: "productos_mbolo/indmbmcxzan7hewzxaga",
  },
};

// Crear una tienda
export const crearTienda = async (req, res) => {
  try {
    const {
      name,
      description,
      phone_number,
      address,
      specific_location,
      owner,
      documentType,
      paymentMethods,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !phone_number ||
      !address ||
      !specific_location ||
      !owner ||
      !documentType ||
      !paymentMethods
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Validate documentType
    const validDocumentTypes = ["DIP", "Pasaporte", "Permiso de Residencia"];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({ message: "Tipo de documento inválido" });
    }

    // Parse paymentMethods
    let parsedPaymentMethods;
    try {
      parsedPaymentMethods = JSON.parse(paymentMethods);
      if (!Array.isArray(parsedPaymentMethods)) {
        return res
          .status(400)
          .json({ message: "paymentMethods debe ser un arreglo" });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Formato de métodos de pago inválido" });
    }

    // Validate payment methods
    const validPaymentMethods = ["EcoBank", "BGFBank", "Muni-Dinero"];
    for (const method of parsedPaymentMethods) {
      if (!validPaymentMethods.includes(method.name)) {
        return res
          .status(400)
          .json({ message: `Método de pago inválido: ${method.name}` });
      }
      if (!method.accountNumber) {
        return res
          .status(400)
          .json({ message: `Número de cuenta requerido para ${method.name}` });
      }
      if (!PAYMENT_METHOD_IMAGES[method.name]) {
        return res.status(400).json({
          message: `No se encontró imagen predefinida para ${method.name}`,
        });
      }
    }

    // Validate owner
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }
    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validate address
    console.log("Validating address ID:", address);
    if (!mongoose.Types.ObjectId.isValid(address)) {
      return res.status(400).json({ message: "ID de ciudad inválido" });
    }
    const location = await Location.findOne({ _id: address, type: "City" });
    if (!location) {
      return res
        .status(404)
        .json({ message: "Ciudad no encontrada o no es una ciudad válida" });
    }

    // Check for existing store
    const existingStore = await Tienda.findOne({ owner });
    if (existingStore) {
      return res
        .status(400)
        .json({ message: "El usuario ya tiene una tienda" });
    }

    // Handle file uploads
    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];
    const documentFiles = req.files?.document || [];

    if (!logoFile || !bannerFile) {
      return res
        .status(400)
        .json({ message: "Logo y banner son obligatorios" });
    }
    if (documentFiles.length < 1 || documentFiles.length > 2) {
      return res.status(400).json({
        message: "Se requiere entre 1 y 2 imágenes para el documento",
      });
    }

    // Upload files to Cloudinary
    console.log("Uploading files to Cloudinary:", {
      logo: logoFile?.path,
      banner: bannerFile?.path,
      documents: documentFiles.map((file) => file.path),
    });
    const logoResult = await uploadImage(logoFile.path);
    const bannerResult = await uploadImage(bannerFile.path);
    const documentResults = await Promise.all(
      documentFiles.map((file) => uploadImage(file.path))
    );

    // Clean up temporary files
    [logoFile, bannerFile, ...documentFiles].forEach((file) => {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`Error eliminando archivo temporal ${file.path}:`, err);
        }
      }
    });

    // Create new store
    const tienda = new Tienda({
      name,
      description,
      phone_number,
      address,
      specific_location,
      owner,
      logo: { url: logoResult.url, public_id: logoResult.public_id },
      banner: { url: bannerResult.url, public_id: bannerResult.public_id },
      document: documentResults.map((result) => ({
        type: documentType,
        url: result.url,
        public_id: result.public_id,
      })),
      paymentMethods: parsedPaymentMethods.map((method) => ({
        name: method.name,
        accountNumber: method.accountNumber,
        image: {
          url: PAYMENT_METHOD_IMAGES[method.name].url,
          public_id: PAYMENT_METHOD_IMAGES[method.name].public_id,
        },
      })),
      products: [], // Initialize empty products array
    });

    await tienda.save();

    // Populate response
    const tiendaPoblada = await Tienda.findById(tienda._id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    res
      .status(201)
      .json({ message: "Tienda creada exitosamente", tienda: tiendaPoblada });
  } catch (error) {
    console.error("Error creando tienda:", error);
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (file && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error(
                `Error eliminando archivo temporal ${file.path}:`,
                err
              );
            }
          }
        });
    }
    res.status(500).json({
      message: "Error al crear la tienda",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Obtener una tienda por su ID
export const obtenerTienda = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de tienda inválido" });
    }

    const tienda = await Tienda.findById(id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda:", error);
    res.status(500).json({
      message: "Error al obtener la tienda",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Obtener todas las tiendas
export const obtenerTodasTiendas = async (req, res) => {
  try {
    const tiendas = await Tienda.find()
      .populate("owner", "userName")
      .populate("products", "title price sales")
      .populate("address", "name");
    res.status(200).json(tiendas);
  } catch (error) {
    console.error("Error al obtener las tiendas:", error);
    res.status(500).json({
      message: "Error al obtener las tiendas",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Actualizar una tienda
export const actualizarTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      phone_number,
      address,
      specific_location,
      owner,
      documentType,
      paymentMethods,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !phone_number ||
      !address ||
      !specific_location ||
      !owner ||
      !documentType ||
      !paymentMethods
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Validate ID de la tienda
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de tienda inválido" });
    }

    // Validate documentType
    const validDocumentTypes = ["DIP", "Pasaporte", "Permiso de Residencia"];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({ message: "Tipo de documento inválido" });
    }

    // Parse paymentMethods
    let parsedPaymentMethods;
    try {
      parsedPaymentMethods = JSON.parse(paymentMethods);
      if (!Array.isArray(parsedPaymentMethods)) {
        return res
          .status(400)
          .json({ message: "paymentMethods debe ser un arreglo" });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Formato de métodos de pago inválido" });
    }

    // Validate payment methods
    const validPaymentMethods = ["EcoBank", "BGFBank", "Muni-Dinero"];
    for (const method of parsedPaymentMethods) {
      if (!validPaymentMethods.includes(method.name)) {
        return res
          .status(400)
          .json({ message: `Método de pago inválido: ${method.name}` });
      }
      if (!method.accountNumber) {
        return res
          .status(400)
          .json({ message: `Número de cuenta requerido para ${method.name}` });
      }
      if (!PAYMENT_METHOD_IMAGES[method.name]) {
        return res.status(400).json({
          message: `No se encontró imagen predefinida para ${method.name}`,
        });
      }
    }

    // Validate owner
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }
    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validate address
    console.log("Validating address ID:", address);
    if (!mongoose.Types.ObjectId.isValid(address)) {
      return res.status(400).json({ message: "ID de ciudad inválido" });
    }
    const location = await Location.findOne({ _id: address, type: "City" });
    if (!location) {
      return res
        .status(404)
        .json({ message: "Ciudad no encontrada o no es una ciudad válida" });
    }

    // Buscar la tienda existente
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }
    if (tienda.owner.toString() !== owner) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para editar esta tienda" });
    }

    // Handle file uploads
    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];
    const documentFiles = req.files?.document || [];

    if (documentFiles.length > 2) {
      return res.status(400).json({
        message: "Solo se permiten hasta 2 imágenes para el documento",
      });
    }

    const updateData = {
      name,
      description,
      phone_number,
      address,
      specific_location,
      owner,
      paymentMethods: parsedPaymentMethods.map((method) => ({
        name: method.name,
        accountNumber: method.accountNumber,
        image: {
          url: PAYMENT_METHOD_IMAGES[method.name].url,
          public_id: PAYMENT_METHOD_IMAGES[method.name].public_id,
        },
      })),
    };

    // Handle logo
    if (logoFile) {
      console.log("Uploading logo to Cloudinary:", logoFile.path);
      const logoResult = await uploadImage(logoFile.path);
      updateData.logo = {
        url: logoResult.url,
        public_id: logoResult.public_id,
      };
      if (tienda.logo.public_id) {
        await deleteImage(tienda.logo.public_id);
      }
      if (fs.existsSync(logoFile.path)) {
        try {
          fs.unlinkSync(logoFile.path);
        } catch (err) {
          console.error(
            `Error eliminando archivo temporal ${logoFile.path}:`,
            err
          );
        }
      }
    }

    // Handle banner
    if (bannerFile) {
      console.log("Uploading banner to Cloudinary:", bannerFile.path);
      const bannerResult = await uploadImage(bannerFile.path);
      updateData.banner = {
        url: bannerResult.url,
        public_id: bannerResult.public_id,
      };
      if (tienda.banner.public_id) {
        await deleteImage(tienda.banner.public_id);
      }
      if (fs.existsSync(bannerFile.path)) {
        try {
          fs.unlinkSync(bannerFile.path);
        } catch (err) {
          console.error(
            `Error eliminando archivo temporal ${bannerFile.path}:`,
            err
          );
        }
      }
    }

    // Handle documents
    if (documentFiles.length > 0) {
      console.log(
        "Uploading documents to Cloudinary:",
        documentFiles.map((file) => file.path)
      );
      const documentResults = await Promise.all(
        documentFiles.map((file) => uploadImage(file.path))
      );
      updateData.document = documentResults.map((result) => ({
        type: documentType,
        url: result.url,
        public_id: result.public_id,
      }));
      // Delete old document images
      for (const doc of tienda.document) {
        if (doc.public_id) {
          await deleteImage(doc.public_id);
        }
      }
      documentFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error(
              `Error eliminando archivo temporal ${file.path}:`,
              err
            );
          }
        }
      });
    } else if (documentType !== tienda.document[0]?.type) {
      // Update document type if no new images are uploaded
      updateData.document = tienda.document.map((doc) => ({
        ...doc,
        type: documentType,
      }));
    }

    // Actualizar la tienda
    const updatedTienda = await Tienda.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Poblar datos para la respuesta
    const tiendaPoblada = await Tienda.findById(updatedTienda._id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    res.status(200).json({
      message: "Tienda actualizada exitosamente",
      tienda: tiendaPoblada,
    });
  } catch (error) {
    console.error("Error actualizando tienda:", error);
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (file && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error(
                `Error eliminando archivo temporal ${file.path}:`,
                err
              );
            }
          }
        });
    }
    res.status(500).json({
      message: "Error al actualizar la tienda",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Eliminar una tienda
export const eliminarTienda = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de tienda inválido" });
    }

    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // Delete images from Cloudinary
    if (tienda.logo.public_id) {
      await deleteImage(tienda.logo.public_id);
    }
    if (tienda.banner.public_id) {
      await deleteImage(tienda.banner.public_id);
    }
    for (const doc of tienda.document) {
      if (doc.public_id) {
        await deleteImage(doc.public_id);
      }
    }

    await User.findByIdAndUpdate(tienda.owner, { $unset: { tienda: "" } });
    await Tienda.findByIdAndDelete(id);

    res.status(200).json({ message: "Tienda eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar tienda:", error);
    res.status(500).json({
      message: "Error al eliminar la tienda",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Obtener tienda por usuario
export const obtenerTiendaPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "El ID del usuario no es válido" });
    }

    const tienda = await Tienda.findOne({ owner: userId })
      .populate({
        path: "owner",
        select: "userName",
      })
      .populate({
        path: "products",
        select: "title price",
        match: { deleted: { $ne: true } }, // Only populate non-deleted products
      })
      .populate({
        path: "address",
        select: "name",
      });

    if (!tienda) {
      return res
        .status(404)
        .json({ message: "No se encontró una tienda para este usuario" });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda por usuario:", error);
    res.status(500).json({
      message: "Error al obtener la tienda por usuario",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};

// Añadir producto a una tienda
export const addProductToTienda = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const { productId } = req.body;

    console.log("PATCH /tienda/:tiendaId/add-product", { tiendaId, productId });

    if (
      !mongoose.Types.ObjectId.isValid(tiendaId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res
        .status(400)
        .json({ message: "ID de tienda o producto inválido" });
    }

    // Verify product exists
    const product = await Producto.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const tienda = await Tienda.findByIdAndUpdate(
      tiendaId,
      { $addToSet: { products: productId } }, // Use $addToSet to avoid duplicates
      { new: true }
    );

    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // Populate response
    const tiendaPoblada = await Tienda.findById(tienda._id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    res
      .status(200)
      .json({ message: "Producto añadido a la tienda", tienda: tiendaPoblada });
  } catch (error) {
    console.error("Error al añadir producto a la tienda:", error);
    res.status(500).json({
      message: "Error al añadir producto a la tienda",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};
