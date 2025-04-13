import Tienda from "../models/Tienda.js"; // Importa el modelo Tienda
import User from "../models/User.js"; // Importa el modelo User (opcional, para validaciones)
import Location from "../models/Location.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import fs from "fs";
// Crear una tienda
export const crearTienda = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    const { name, description, phone_number, address, owner } = req.body;

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!phone_number) missingFields.push("phone_number");
    if (!address) missingFields.push("address");
    if (!owner) missingFields.push("owner");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Los siguientes campos de texto son obligatorios: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    if (!req.files || !req.files.logo || !req.files.banner) {
      return res
        .status(400)
        .json({ message: "El logo y el banner son obligatorios." });
    }

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

    const usuarioExistente = await User.findById(owner);
    if (!usuarioExistente) {
      return res
        .status(404)
        .json({ message: "El usuario propietario no existe." });
    }

    if (usuarioExistente.tienda) {
      return res
        .status(400)
        .json({ message: "El usuario ya tiene una tienda asociada." });
    }

    const ubicacionExistente = await Location.findById(address);
    if (!ubicacionExistente) {
      return res.status(404).json({ message: "La ubicación no existe." });
    }

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
      throw new Error("Error al subir imágenes a Cloudinary");
    } finally {
      if (req.files.logo) fs.unlinkSync(req.files.logo[0].path);
      if (req.files.banner) fs.unlinkSync(req.files.banner[0].path);
    }

    const nuevaTienda = new Tienda({
      name,
      description,
      logo,
      banner,
      phone_number,
      address,
      owner,
      products: [],
    });

    const savedTienda = await nuevaTienda.save();

    usuarioExistente.tienda = savedTienda._id;
    await usuarioExistente.save();

    res
      .status(201)
      .json({ message: "Tienda creada exitosamente", tienda: savedTienda });
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

    // Buscar la tienda por ID y poblar los productos y el propietario
    const tienda = await Tienda.findById(id)
      .populate("owner", "userName email") // Poblar datos del propietario
      .populate("products", "title price"); // Poblar datos de los productos

    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada." });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda:", error);
    res.status(500).json({ message: "Hubo un error al obtener la tienda." });
  }
};
export const obtenerTodasTiendas = async (req, res) => {
  try {
    const tiendas = await Tienda.find()
      .populate("owner", "userName email")
      .populate("products", "title price sales"); // Include "sales" if it exists in your Product schema
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
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "La tienda no existe." });
    }

    const folderName = "tiendas";
    let updatedLogo = tienda.logo;
    let updatedBanner = tienda.banner;

    if (req.files.logo) {
      const logoResult = await updateImage(
        tienda.logo.public_id,
        req.files.logo[0].path,
        folderName
      );
      updatedLogo = {
        url: logoResult.url,
        public_id: logoResult.public_id,
      };
      fs.unlinkSync(req.files.logo[0].path);
    }

    if (req.files.banner) {
      const bannerResult = await updateImage(
        tienda.banner.public_id,
        req.files.banner[0].path,
        folderName
      );
      updatedBanner = {
        url: bannerResult.url,
        public_id: bannerResult.public_id,
      };
      fs.unlinkSync(req.files.banner[0].path);
    }

    // Update the store with new image data
    tienda.logo = updatedLogo;
    tienda.banner = updatedBanner;
    await tienda.save();

    res
      .status(200)
      .json({ message: "Imágenes actualizadas exitosamente", tienda });
  } catch (error) {
    console.error("Error al actualizar las imágenes:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
    });
  }
};

// Eliminar una tienda
export const eliminarTienda = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "El ID de la tienda no es válido." });
    }

    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "La tienda no existe." });
    }

    // Delete logo and banner from Cloudinary
    if (tienda.logo.public_id) {
      await deleteImage(tienda.logo.public_id).catch((err) =>
        console.error("Error al eliminar logo de Cloudinary:", err)
      );
    }
    if (tienda.banner.public_id) {
      await deleteImage(tienda.banner.public_id).catch((err) =>
        console.error("Error al eliminar banner de Cloudinary:", err)
      );
    }

    // Delete the store from the database
    await Tienda.findByIdAndDelete(id);

    // Update the user's tienda field
    await User.findByIdAndUpdate(tienda.owner, { tienda: null });

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

export const obtenerTiendaPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar la tienda asociada al ID del usuario
    const tienda = await Tienda.findOne({ owner: userId })
      .populate("owner", "userName email") // Poblar datos del propietario
      .populate("products", "title price"); // Poblar datos de los productos

    if (!tienda) {
      return res.status(404).json({
        message: "Tienda no encontrada para el usuario proporcionado.",
      });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda por ID de usuario:", error);
    res.status(500).json({
      message: "Hubo un error al obtener la tienda por ID de usuario.",
    });
  }
};
