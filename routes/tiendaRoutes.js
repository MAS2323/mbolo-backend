import express from "express";
import {
  crearTienda,
  obtenerTienda,
  actualizarTienda,
  eliminarTienda,
  obtenerTiendaPorUsuario,
  obtenerTodasTiendas,
} from "../controllers/tiendaController.js";
import { uploadMiddleware } from "../utils/multer.js";
const router = express.Router();

// Rutas para la tienda
router.post("/", uploadMiddleware, crearTienda); // Crear una tienda
router.get("/:id", obtenerTienda); // Obtener una tienda por ID
router.get("/", obtenerTodasTiendas); // Obtener una tienda por ID
router.put("/:id", actualizarTienda); // Actualizar una tienda por ID
router.delete("/:id", eliminarTienda); // Eliminar una tienda por ID
router.get("/usuario/:userId", obtenerTiendaPorUsuario);

export default router;
