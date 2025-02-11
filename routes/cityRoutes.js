import express from "express";
import {
  getCities,
  getCityById,
  createCity,
} from "../controllers/cityController.js";

const router = express.Router();

router.get("/", getCities);
router.get("/:id", getCityById);
router.post("/", createCity);

export default router;
