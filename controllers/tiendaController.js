import Tienda from "../models/Tienda.js";
import User from "../models/User.js";
import Location from "../models/Location.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import fs from "fs";

// Crear una tienda
export const crearTienda = async (req, res) => {
  try {
    const {
      name,
      description,
      phone_number,
      address,
      owner,
      specific_location,
    } = req.body;

    // Validar campos requeridos
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!phone_number) missingFields.push("phone_number");
    if (!address) missingFields.push("address");
    if (!owner) missingFields.push("owner");
    if (!specific_location) missingFields.push("specific_location");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Los siguientes campos son obligatorios: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res
        .status(400)
        .json({ message: "El ID del propietario no es válido." });
    }
    if (!mongoose.Types.ObjectId.isValid(address)) {
      return res
        .status(400)
        .json({ message: "El ID de la ubicación no es válido." });
    }

    // Verificar si el usuario existe
    const usuarioExistente = await User.findById(owner);
    if (!usuarioExistente) {
      return res
        .status(404)
        .json({ message: "El usuario propietario no existe." });
    }

    // Verificar si el usuario ya tiene una tienda (doble chequeo)
    const tiendaExistente = await Tienda.findOne({ owner });
    if (tiendaExistente || usuarioExistente.tienda) {
      return res.status(400).json({
        message:
          "No puedes crear otra tienda. Cada usuario puede tener solo una tienda.",
      });
    }

    // Verificar si la ubicación existe
    const ubicacionExistente = await Location.findById(address);
    if (!ubicacionExistente) {
      return res.status(404).json({ message: "La ubicación no existe." });
    }

    // Validar imágenes
    if (!req.files || !req.files.logo || !req.files.banner) {
      return res
        .status(400)
        .json({ message: "El logo y el banner son obligatorios." });
    }

    // Subir imágenes a Cloudinary
    const folderName = "tiendas";
    let logo = null;
    let banner = null;

    try {
      const logoResult = await uploadImage(req.files.logo[0].path, folderName);
      logo = {
        url: logoResult.url,
        public_id: logoResult.public_id,
      };

      const bannerResult = await uploadImage(
        req.files.banner[0].path,
        folderName
      );
      banner = {
        url: bannerResult.url,
        public_id: bannerResult.public_id,
      };
    } catch (error) {
      console.error("Error al subir imágenes a Cloudinary:", error);
      if (logo) {
        await deleteImage(logo.public_id).catch((err) =>
          console.error("Error al eliminar logo de Cloudinary:", err)
        );
      }
      if (banner) {
        await deleteImage(banner.public_id).catch((err) =>
          console.error("Error al eliminar banner de Cloudinary:", err)
        );
      }
      return res.status(500).json({
        error: "Error al subir imágenes a Cloudinary",
        details: error.message,
      });
    } finally {
      if (req.files.logo) fs.unlinkSync(req.files.logo[0].path);
      if (req.files.banner) fs.unlinkSync(req.files.banner[0].path);
    }

    // Crear la tienda
    const nuevaTienda = new Tienda({
      name,
      description,
      logo,
      banner,
      phone_number,
      address,
      owner,
      specific_location,
      products: [],
    });

    const savedTienda = await nuevaTienda.save();

    // Actualizar el campo tienda del usuario
    await User.findByIdAndUpdate(owner, {
      $set: { tienda: savedTienda._id },
    });

    // Poblar datos para la respuesta
    const tiendaPoblada = await Tienda.findById(savedTienda._id)
      .populate("owner", "userName")
      .populate("address", "name");

    res.status(201).json({
      message: "Tienda creada exitosamente",
      tienda: tiendaPoblada,
    });
  } catch (error) {
    console.error("Error al crear la tienda:", error);
    if (req.files) {
      if (req.files.logo) {
        const logoPath = req.files.logo[0].path;
        if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
      }
      if (req.files.banner) {
        const bannerPath = req.files.banner[0].path;
        if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);
      }
    }
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
};

// Obtener una tienda por su ID
export const obtenerTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const tienda = await Tienda.findById(id)
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada." });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda:", error);
    res.status(500).json({ message: "Hubo un error al obtener la tienda." });
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
    res.status(500).json({ message: "Hubo un error al obtener las tiendas." });
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
    } = req.body;

    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "La tienda no existe." });
    }

    // Validar campos requeridos
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!phone_number) missingFields.push("phone_number");
    if (!address) missingFields.push("address");
    if (!owner) missingFields.push("owner");
    if (!specific_location) missingFields.push("specific_location");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Los siguientes campos son obligatorios: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res
        .status(400)
        .json({ message: "El ID del propietario no es válido." });
    }
    if (!mongoose.Types.ObjectId.isValid(address)) {
      return res
        .status(400)
        .json({ message: "El ID de la ubicación no es válido." });
    }

    // Verificar usuario y ubicación
    const usuarioExistente = await User.findById(owner);
    if (!usuarioExistente) {
      return res
        .status(404)
        .json({ message: "El usuario propietario no existe." });
    }

    const ubicacionExistente = await Location.findById(address);
    if (!ubicacionExistente) {
      return res.status(404).json({ message: "La ubicación no existe." });
    }

    // Actualizar campos
    tienda.name = name;
    tienda.description = description;
    tienda.phone_number = phone_number;
    tienda.address = address;
    tienda.specific_location = specific_location;
    tienda.owner = owner;

    // Manejar imágenes
    const folderName = "tiendas";
    if (req.files) {
      try {
        if (req.files.logo) {
          if (tienda.logo.public_id) {
            await deleteImage(tienda.logo.public_id);
          }
          const logoResult = await uploadImage(
            req.files.logo[0].path,
            folderName
          );
          tienda.logo = {
            url: logoResult.url,
            public_id: logoResult.public_id,
          };
          fs.unlinkSync(req.files.logo[0].path);
        }

        if (req.files.banner) {
          if (tienda.banner.public_id) {
            await deleteImage(tienda.banner.public_id);
          }
          const bannerResult = await uploadImage(
            req.files.banner[0].path,
            folderName
          );
          tienda.banner = {
            url: bannerResult.url,
            public_id: bannerResult.public_id,
          };
          fs.unlinkSync(req.files.banner[0].path);
        }
      } catch (error) {
        console.error("Error al actualizar imágenes en Cloudinary:", error);
        if (req.files.logo) fs.unlinkSync(req.files.logo[0].path);
        if (req.files.banner) fs.unlinkSync(req.files.banner[0].path);
        return res.status(500).json({
          error: "Error al actualizar imágenes en Cloudinary",
          details: error.message,
        });
      }
    }

    const updatedTienda = await tienda.save();

    // Poblar datos para la respuesta
    const tiendaPoblada = await Tienda.findById(updatedTienda._id)
      .populate("owner", "userName")
      .populate("address", "name");

    res.status(200).json({
      message: "Tienda actualizada exitosamente",
      tienda: tiendaPoblada,
    });
  } catch (error) {
    console.error("Error al actualizar la tienda:", error);
    if (req.files) {
      if (req.files.logo) {
        const logoPath = req.files.logo[0].path;
        if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
      }
      if (req.files.banner) {
        const bannerPath = req.files.banner[0].path;
        if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);
      }
    }
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
};

// Eliminar una tienda
export const eliminarTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "La tienda no existe." });
    }

    if (tienda.logo.public_id) {
      await deleteImage(tienda.logo.public_id);
    }
    if (tienda.banner.public_id) {
      await deleteImage(tienda.banner.public_id);
    }

    await User.findByIdAndUpdate(tienda.owner, {
      $unset: { tienda: "" },
    });

    await Tienda.findByIdAndDelete(id);

    res.status(200).json({ message: "Tienda eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar la tienda:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details:
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
        .json({ message: "El ID del usuario no es válido." });
    }

    const tienda = await Tienda.findOne({ owner: userId })
      .populate("owner", "userName")
      .populate("products", "title price")
      .populate("address", "name");

    if (!tienda) {
      return res
        .status(404)
        .json({ message: "No se encontró una tienda para este usuario." });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda por usuario:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Contacta al soporte técnico",
    });
  }
};
