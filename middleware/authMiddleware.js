import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authenticateUser = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Por favor, autentícate." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Access the `id` field directly from the decoded payload
    const user = await User.findById(decoded.id); // Use `decoded.id` instead of `decoded.user.userId`
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }

    req.user = user; // Adjuntar el usuario autenticado a la request
    next();
  } catch (error) {
    console.error("Error en la autenticación:", error);
    res.status(401).json({ message: "Token inválido o expirado." });
  }
};

export default authenticateUser;
