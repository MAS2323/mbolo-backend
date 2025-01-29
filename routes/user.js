import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import userController from "../controllers/userControllers.js";
// const authMiddleware = require("../../middleware/auth");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/users/:userId", userController.getUsersExceptLoggedInUser);
router.put("/user/:id", upload.single("image"), userController.updateUser);
router.get("/users", userController.getAllUsers); // Ruta protegida
router.get("/user/:id", userController.getUserById); // Ruta protegida
router.delete("/user/:id", userController.deleteUser); // Ruta protegida

export default router;
