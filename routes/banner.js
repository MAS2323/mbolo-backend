import express from "express";
import bannerController from "../controllers/bannerController.js";

const router = express.Router();

// Definir las rutas
router.post("/", bannerController.createBanner);
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.put("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

// Exportar como exportación por defecto
export default router;
