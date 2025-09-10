import mongoose from "mongoose";
import Tienda from "../models/Tienda.js";
import User from "../models/User.js";
import Location from "../models/Location.js";
import Producto from "../models/Products.js";
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

// Retry mechanism for Cloudinary uploads
const uploadWithRetry = async (
  fileBuffer,
  folderName = "productos_mbolo",
  retries = 3,
  delay = 1000
) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to upload file to folder: ${folderName}`);
      const result = await uploadImage(fileBuffer, folderName);
      console.log(`Upload successful: ${result.url}`);
      return result;
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Crear una tienda
// Crear una tienda
export const crearTienda = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

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
      console.error("Missing required fields:", {
        name,
        description,
        phone_number,
        address,
        specific_location,
        owner,
        documentType,
        paymentMethods,
      });
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Validate documentType
    const validDocumentTypes = ["DIP", "Pasaporte", "Permiso de Residencia"];
    if (!validDocumentTypes.includes(documentType)) {
      console.error("Invalid documentType:", documentType);
      return res.status(400).json({ message: "Tipo de documento inválido" });
    }

    // Parse paymentMethods
    let parsedPaymentMethods;
    try {
      parsedPaymentMethods = JSON.parse(paymentMethods);
      console.log("Parsed payment methods:", parsedPaymentMethods);
      if (!Array.isArray(parsedPaymentMethods)) {
        console.error("paymentMethods is not an array:", parsedPaymentMethods);
        return res
          .status(400)
          .json({ message: "paymentMethods debe ser un arreglo" });
      }
    } catch (error) {
      console.error("Error parsing paymentMethods:", error.message);
      return res
        .status(400)
        .json({ message: "Formato de métodos de pago inválido" });
    }

    // Validate payment methods
    const validPaymentMethods = ["EcoBank", "BGFBank", "Muni-Dinero"];
    for (const method of parsedPaymentMethods) {
      if (!validPaymentMethods.includes(method.name)) {
        console.error("Invalid payment method name:", method.name);
        return res
          .status(400)
          .json({ message: `Método de pago inválido: ${method.name}` });
      }
      if (!method.accountNumber) {
        console.error("Missing accountNumber for method:", method.name);
        return res
          .status(400)
          .json({ message: `Número de cuenta requerido para ${method.name}` });
      }
      if (!PAYMENT_METHOD_IMAGES[method.name]) {
        console.error("No predefined image for method:", method.name);
        return res.status(400).json({
          message: `No se encontró imagen predefinida para ${method.name}`,
        });
      }
    }

    // Validate owner
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      console.error("Invalid owner ID:", owner);
      return res.status(400).json({ message: "ID de usuario inválido" });
    }
    const user = await User.findById(owner);
    if (!user) {
      console.error("User not found for owner ID:", owner);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validate address
    console.log("Validating address ID:", address);
    if (!mongoose.Types.ObjectId.isValid(address)) {
      console.error("Invalid address ID:", address);
      return res.status(400).json({ message: "ID de ciudad inválido" });
    }
    const location = await Location.findOne({ _id: address, type: "City" });
    if (!location) {
      console.error("Location not found or not a city:", address);
      return res
        .status(404)
        .json({ message: "Ciudad no encontrada o no es una ciudad válida" });
    }

    // Check for existing store
    const existingStore = await Tienda.findOne({ owner });
    if (existingStore) {
      console.error("User already has a store:", owner);
      return res
        .status(400)
        .json({ message: "El usuario ya tiene una tienda" });
    }

    // Handle file uploads
    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.banner?.[0];
    const documentFiles = req.files?.document || [];

    if (!logoFile || !bannerFile) {
      console.error("Missing logo or banner:", { logoFile, bannerFile });
      return res
        .status(400)
        .json({ message: "Logo y banner son obligatorios" });
    }
    if (documentFiles.length < 1 || documentFiles.length > 2) {
      console.error("Invalid number of document files:", documentFiles.length);
      return res.status(400).json({
        message: "Se requiere entre 1 y 2 imágenes para el documento",
      });
    }

    // Upload files to Cloudinary sequentially using file paths
    console.log("Uploading files to Cloudinary:", {
      logo: logoFile?.path,
      banner: bannerFile?.path,
      documents: documentFiles.map((file) => file.path),
    });
    const logoResult = await uploadWithRetry(logoFile.path, "productos_mbolo");
    const bannerResult = await uploadWithRetry(
      bannerFile.path,
      "productos_mbolo"
    );
    const documentResults = [];
    for (const file of documentFiles) {
      const result = await uploadWithRetry(
        file.path,
        "productos_mbolo/documents"
      );
      documentResults.push(result);
    }

    // Clean up temporary files
    [logoFile, bannerFile, ...documentFiles].forEach((file) => {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted temporary file: ${file.path}`);
        } catch (err) {
          console.error(`Error deleting temporary file ${file.path}:`, err);
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
      products: [],
    });

    await tienda.save();
    console.log("Store saved successfully:", tienda._id);

    // Populate response
    const tiendaPoblada = await Tienda.findById(tienda._id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    res
      .status(201)
      .json({ message: "Tienda creada exitosamente", tienda: tiendaPoblada });
  } catch (error) {
    console.error("Error creating store:", error);
    // Clean up any remaining temporary files
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (file && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(
                `Deleted temporary file in error handler: ${file.path}`
              );
            } catch (err) {
              console.error(`Error deleting temporary file ${file.path}:`, err);
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
    const validPaymentMethods = ["EcoBank", "BGFBank", "Hawkins"];
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
      console.log("Uploading logo to Cloudinary:", logoFile.originalname);
      try {
        const logoResult = await uploadWithRetry(logoFile, "productos_mbolo");
        updateData.logo = {
          url: logoResult.url,
          public_id: logoResult.public_id,
        };
        if (tienda.logo.public_id) {
          await deleteImage(tienda.logo.public_id);
        }
      } catch (error) {
        console.error("Error uploading logo:", error);
        throw new Error(`Failed to upload logo: ${error.message}`);
      } finally {
        // Clean up temporary file
        if (logoFile?.path) {
          try {
            await fs.unlink(logoFile.path);
            console.log("Deleted temporary logo file:", logoFile.path);
          } catch (err) {
            console.error("Error deleting temporary logo file:", err.message);
          }
        }
      }
    }

    // Handle banner
    if (bannerFile) {
      console.log("Uploading banner to Cloudinary:", bannerFile.originalname);
      try {
        const bannerResult = await uploadWithRetry(
          bannerFile,
          "productos_mbolo"
        );
        updateData.banner = {
          url: bannerResult.url,
          public_id: bannerResult.public_id,
        };
        if (tienda.banner.public_id) {
          await deleteImage(tienda.banner.public_id);
        }
      } catch (error) {
        console.error("Error uploading banner:", error);
        throw new Error(`Failed to upload banner: ${error.message}`);
      } finally {
        // Clean up temporary file
        if (bannerFile?.path) {
          try {
            await fs.unlink(bannerFile.path);
            console.log("Deleted temporary banner file:", bannerFile.path);
          } catch (err) {
            console.error("Error deleting temporary banner file:", err.message);
          }
        }
      }
    }

    // Handle documents
    if (documentFiles.length > 0) {
      console.log(
        "Uploading documents to Cloudinary:",
        documentFiles.map((file) => file.originalname)
      );
      const documentResults = [];
      for (const file of documentFiles) {
        try {
          const result = await uploadWithRetry(
            file,
            "productos_mbolo/documents"
          );
          documentResults.push(result);
        } catch (error) {
          console.error("Error uploading document:", error);
          throw new Error(`Failed to upload document: ${error.message}`);
        }
      }
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
      // Clean up temporary document files
      for (const file of documentFiles) {
        if (file?.path) {
          try {
            await fs.unlink(file.path);
            console.log("Deleted temporary document file:", file.path);
          } catch (err) {
            console.error(
              "Error deleting temporary document file:",
              err.message
            );
          }
        }
      }
    } else if (documentType !== tienda.document[0]?.type) {
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
    res.status(500).json({
      message: "Error al actualizar la tienda",
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
        match: { deleted: { $ne: true } },
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
      { $addToSet: { products: productId } },
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
