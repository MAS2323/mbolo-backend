import express from "express";
import upload from "../utils/multer.js"; // Para la carga de imágenes
import {
  createAd,
  getPersonalizedAds,
  getAllAds,
  updateAd,
  deleteAd,
} from "../controllers/adController.js";

const router = express.Router();

// Crear un nuevo anuncio
router.post("/", upload.array("images", 1), createAd);

// Obtener anuncios personalizados
router.get("/personalized", getPersonalizedAds);

// Obtener todos los anuncios
router.get("/", getAllAds);

// Actualizar un anuncio
router.put("/:adId", upload.array("images", 1), updateAd);

// Eliminar un anuncio
router.delete("/:adId", deleteAd);

export default router;
