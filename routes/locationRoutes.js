import express from "express";
import {
  getLocations,
  getProvinces,
  getCities,
  getCitiesByProvince,
  createLocation,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations); // Obtener todas las ubicaciones (filtradas por query `?type=City` o `?type=Province`)
router.get("/provinces", getProvinces); // Obtener todas las provincias
router.get("/cities", getCities); // Obtener todas las ciudades
router.get("/cities/:provinceId", getCitiesByProvince); // Obtener ciudades de una provincia
router.post("/", createLocation); // Crear una ubicación

export default router;
