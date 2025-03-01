import express from "express";
import userController from "../controllers/userControllers.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", userController.getAllUsers);
router.get("/user/:userId", userController.getUserData);
router.put("/user/:id", userController.updateUser);
router.delete("/user/:id", userController.deleteUser);

export default router;
