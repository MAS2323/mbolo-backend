import express from "express";
const router = express.Router();
import userController from "../controllers/userControllers.js";
// const authMiddleware = require("../../middleware/auth");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.get("/users/:userId", userController.getUsersExceptLoggedInUser);
router.get("/users", userController.getAllUsers); // Ruta protegida
router.delete("/user/:id", userController.deleteUser); // Ruta protegida

// router.post("/friend-request", userController.sendFriendRequest);
// router.get("/friend-request/:userId", userController.getFriendRequests);
// router.get("/accepted-friends/:userId", userController.FriendRequestAccep);
// router.post("/friend-request/accept", userController.acceptFriendRequest);
// router.get("/friends/:userId", userController.getFriends);
// router.get("/user/:id", userController.getUser);
// router.delete("/user/:id", userController.deleteUser);
// router.put("/user/update-profile/:id", userController.updateUser); // Nueva ruta
// router.get("/users", userController.getAllUsers);

export default router;

// const express = require("express");
// const router = express.Router();
// const userController = require("../controllers/userControllers");
// const authMiddleware = require("../middleware/auth");

// // Rutas públicas
// router.post("/register", userController.registerUser);
// router.post("/login", userController.loginUser);

// // Middleware de autenticación para rutas protegidas
// router.use(authMiddleware);

// // Rutas protegidas que requieren autenticación
// router.get("/users/:userId", userController.getUsersExceptLoggedInUser);
// router.get("/users", userController.getUserData);
// router.post("/friend-request", userController.sendFriendRequest);
// router.get("/friend-request/:userId", userController.getFriendRequests);
// router.get("/accepted-friends/:userId", userController.FriendRequestAccep);
// router.post("/friend-request/accept", userController.acceptFriendRequest);
// router.get("/friends/:userId", userController.getFriends);
// router.get("/:id", userController.getUser);
// router.delete("/:id", userController.deleteUser);

// module.exports = router;
