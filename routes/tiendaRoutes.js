import express from "express";
import {
  crearTienda,
  obtenerTienda,
  actualizarTienda,
  eliminarTienda,
} from "../controllers/tiendaController.js";

const router = express.Router();

// Rutas para la tienda
router.post("/", crearTienda); // Crear una tienda
router.get("/:id", obtenerTienda); // Obtener una tienda por ID
router.put("/:id", actualizarTienda); // Actualizar una tienda por ID
router.delete("/:id", eliminarTienda); // Eliminar una tienda por ID

export default router;
