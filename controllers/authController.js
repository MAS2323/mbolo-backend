import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Location from "../models/Location.js"; // Importamos Location en lugar de City
import mongoose from "mongoose";
import { uploadImage } from "../utils/cloudinary.js";
import fs from "node:fs";

const registerUser = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    // Validar campos obligatorios
    if (!userName || userName.length < 3) {
      return res
        .status(400)
        .json({ message: "El nombre debe tener al menos 3 caracteres" });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res
        .status(400)
        .json({ message: "El correo electrónico no es válido" });
    }
    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el nuevo usuario
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      userType: "user", // Valor por defecto
    });

    // Guardar el usuario en la base de datos
    await newUser.save();
    res
      .status(200)
      .json({ message: "Usuario registrado con éxito", userId: newUser._id });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({ message: "Error registrando el usuario" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Buscar el usuario por correo electrónico
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Introduzca los datos correctos" });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Clave incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // res.json({ token });
    // Excluir campos sensibles del objeto de usuario
    const { password: _, __v, createdAt, updatedAt, ...userData } = user._doc;
    res.status(200).json({
      ...userData,
      userId: user._id,
      token: token,
      userType: user.userType,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

export default { registerUser, loginUser };
