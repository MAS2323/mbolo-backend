import express from "express";
import {
  getLocations,
  createLocation,
  getCities
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocation);
router.get("/cities", getCities);
export default router;

