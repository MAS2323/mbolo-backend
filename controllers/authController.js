import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Location from "../models/Location.js"; // Importamos Location en lugar de City
import mongoose from "mongoose";
import { uploadImage } from "../utils/cloudinary.js";
import fs from "node:fs";

const registerUser = async (req, res) => {
  try {
    const { userName, email, password, ciudad, mobile, userType } = req.body;
    const file = req.file;

    // Validar que el ID de la ubicación sea válido
    if (!mongoose.Types.ObjectId.isValid(ciudad)) {
      return res.status(400).json({ message: "ID de ubicación inválido" });
    }

    // Buscar la ubicación y verificar que sea una ciudad
    const location = await Location.findOne({ _id: ciudad, type: "City" });
    if (!location) {
      return res
        .status(400)
        .json({ message: "La ubicación seleccionada no es una ciudad válida" });
    }

    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Subir imagen a Cloudinary si se proporciona
    let imageResult = null;
    if (file) {
      const folderName = "userPerfil";
      try {
        imageResult = await uploadImage(file.path, folderName);
        fs.unlinkSync(file.path); // Eliminar archivo local después de subirlo
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }
    }

    // Crear el nuevo usuario
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      image: imageResult
        ? { url: imageResult.url, public_id: imageResult.public_id }
        : null,
      ciudad: { id: ciudad, name: location.name },
      mobile,
      userType: userType || "user",
    });

    // Guardar el usuario en la base de datos
    await newUser.save();
    res.status(200).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error registrando usuario:", error);
    res.status(500).json({ message: "Error registrando el usuario" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

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
    const userToken = jwt.sign(
      { user: { id: user._id } },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Excluir campos sensibles del objeto de usuario
    const { password: _, __v, createdAt, updatedAt, ...userData } = user._doc;
    res
      .status(200)
      .json({ ...userData, token: userToken, userType: user.userType });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

export default { registerUser, loginUser };
