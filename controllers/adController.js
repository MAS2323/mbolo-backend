import Ad from "../models/Ad.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import fs from "node:fs";

// Crear un nuevo anuncio
export const createAd = async (req, res) => {
  try {
    const { title, description, category, link } = req.body;

    // Validar campos requeridos
    if (
      !title ||
      !description ||
      !category ||
      !req.files ||
      req.files.length === 0
    ) {
      return res
        .status(400)
        .json({
          message: "Todos los campos son obligatorios, incluyendo una imagen",
        });
    }

    // Subir imagen a Cloudinary
    const folderName = "ads";
    const image = await uploadImage(req.files[0].path, folderName);
    fs.unlinkSync(req.files[0].path); // Eliminar archivo temporal

    const newAd = new Ad({
      title,
      description,
      category,
      link: link || null,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
    });

    const savedAd = await newAd.save();
    res
      .status(201)
      .json({ message: "Anuncio creado exitosamente", ad: savedAd });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al crear el anuncio", details: error.message });
  }
};

// Obtener anuncios personalizados según categoría
export const getPersonalizedAds = async (req, res) => {
  try {
    const { category } = req.query; // Categoría enviada desde el frontend
    if (!category) {
      return res
        .status(400)
        .json({
          message: "La categoría es obligatoria para personalizar anuncios",
        });
    }

    const ads = await Ad.find({ category, isActive: true }).limit(5); // Limitar a 5 anuncios
    if (ads.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron anuncios para esta categoría" });
    }

    res.json(ads);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener anuncios", details: error.message });
  }
};

// Obtener todos los anuncios (para admin, por ejemplo)
export const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find();
    res.json(ads);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al obtener los anuncios", details: error.message });
  }
};

// Actualizar un anuncio
export const updateAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const { title, description, category, link, isActive } = req.body;

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    // Si se sube una nueva imagen, eliminar la anterior y subir la nueva
    if (req.files && req.files.length > 0) {
      await deleteImage(ad.image.public_id);
      const folderName = "ads";
      const image = await uploadImage(req.files[0].path, folderName);
      fs.unlinkSync(req.files[0].path);
      ad.image = { url: image.url, public_id: image.public_id };
    }

    ad.title = title || ad.title;
    ad.description = description || ad.description;
    ad.category = category || ad.category;
    ad.link = link !== undefined ? link : ad.link;
    ad.isActive = isActive !== undefined ? isActive : ad.isActive;

    const updatedAd = await ad.save();
    res.json({ message: "Anuncio actualizado exitosamente", ad: updatedAd });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al actualizar el anuncio",
        details: error.message,
      });
  }
};

// Eliminar un anuncio
export const deleteAd = async (req, res) => {
  try {
    const { adId } = req.params;
    const ad = await Ad.findByIdAndDelete(adId);
    if (!ad) {
      return res.status(404).json({ error: "Anuncio no encontrado" });
    }

    // Eliminar imagen de Cloudinary
    await deleteImage(ad.image.public_id);
    res.json({ message: "Anuncio eliminado exitosamente" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al eliminar el anuncio", details: error.message });
  }
};
