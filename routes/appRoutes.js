import express from "express";
import {
  getAppsByCategory,
  createApp,
  deleteApp,
  updateApp,
  initializeDatabase,
} from "../controllers/appController.js";

const router = express.Router();

// Ruta para crear una nueva app
router.post("/apps", createApp);

// Ruta para obtener apps por categoría
router.get("/apps/:category", getAppsByCategory);

// Ruta para eliminar una app por ID
router.delete("/apps/:id", deleteApp);

// Ruta para actualizar una app por ID
router.put("/apps/:id", updateApp);

// Ruta para inicializar la base de datos (opcional, para pruebas)
router.post("/initialize", initializeDatabase);

export default router;
