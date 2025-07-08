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
import { uploadMiddleware, multerErrorHandling } from "../utils/multer.js";

const router = express.Router();

// Rutas para la tienda
router.post("/", uploadMiddleware, multerErrorHandling, crearTienda);
router.get("/:id", obtenerTienda);
router.get("/", obtenerTodasTiendas);
router.put("/:id", uploadMiddleware, multerErrorHandling, actualizarTienda);
router.delete("/:id", eliminarTienda);
router.get("/owner/:userId", obtenerTiendaPorUsuario);
router.patch("/:tiendaId/add-product", addProductToTienda);

export default router;
