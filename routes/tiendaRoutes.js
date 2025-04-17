import express from "express";
import {
  crearTienda,
  obtenerTienda,
  actualizarTienda,
  eliminarTienda,
  obtenerTiendaPorUsuario,
  obtenerTodasTiendas,
  addProductToTienda,
} from "../controllers/tiendaController.js";
import { uploadMiddleware } from "../utils/multer.js";
const router = express.Router();

// Rutas para la tienda
router.post("/", uploadMiddleware, crearTienda); // Crear una tienda
router.get("/:id", obtenerTienda); // Obtener una tienda por ID
router.get("/", obtenerTodasTiendas); // Obtener una tienda por ID
router.put("/:id", uploadMiddleware, actualizarTienda); // Actualizar una tienda por ID
router.delete("/:id", eliminarTienda); // Eliminar una tienda por ID
router.get("/owner/:userId", obtenerTiendaPorUsuario);
router.patch("/:tiendaId/add-product", addProductToTienda);
export default router;
