import express from "express";
import * as professionalController from "../controllers/professionalController.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Routes
router.post(
  "/",
  upload.single("avatar"),
  professionalController.createProfessional
);
router.get("/owner/:ownerId", professionalController.getProfessionalByOwner);
router.get("/:id", professionalController.getProfessionalById);
router.put(
  "/:id",
  upload.single("avatar"),
  professionalController.updateProfessional
);
router.delete("/:id", professionalController.deleteProfessional);

export default router;
