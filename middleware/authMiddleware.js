import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authenticateUser = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Por favor, autentícate." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Aquí corregimos el acceso al ID
    const user = await User.findById(decoded.user.id);

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
