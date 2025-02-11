import dotenv from "dotenv";
dotenv.config();
// Define createToken function based on the userId
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import mongoose from "mongoose";
import City from "../models/City.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import fs from "node:fs";

const createToken = (_id) => {
  return jwt.sign({ user: { id: _id } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  try {
    const { userName, email, password, ciudad, mobile, userType } = req.body;
    const file = req.file;

    // Verificar si el ID de la ciudad es un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(ciudad)) {
      return res.status(400).json({ message: "ID de ciudad inválido" });
    }

    // Verificar si la ciudad existe en la base de datos
    const city = await City.findById(ciudad);
    if (!city) {
      return res
        .status(400)
        .json({ message: "La ciudad seleccionada no existe" });
    }

    // Verificar si el correo electrónico ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    let imageResult = null;

    // Manejo de imagen de perfil
    if (file) {
      const folderName = "userPerfil";
      try {
        imageResult = await uploadImage(file.path, folderName);
        fs.unlinkSync(file.path); // Eliminar la imagen temporal
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }
    }

    // Crear el nuevo usuario con ID y nombre de la ciudad
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      image: imageResult
        ? { url: imageResult.url, public_id: imageResult.public_id }
        : null,
      ciudad: {
        id: ciudad, // Almacena el ID de la ciudad
        name: city.name, // Almacena el nombre de la ciudad
      },
      mobile,
      userType: userType || "user", // Establecer tipo de usuario si no se pasa
    });

    await newUser.save();
    res.status(200).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error registrando usuario:", error);

    if (error.code === 11000) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    res.status(500).json({ message: "Error registrando el usuario" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Introduzca los datos correctos" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Clave incorrecta" });
    }

    const userToken = createToken(user._id); // Llamada a createToken con el ID del usuario
    const { password: _, __v, createdAt, updatedAt, ...userData } = user._doc;

    res
      .status(200)
      .json({ ...userData, token: userToken, userType: user.userType });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// Los demás métodos deben seguir igual, pero aquí se resumen para la demostración.
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Obtener todos los usuarios de la base de datos
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error al obtener los usuarios." });
  }
};
const getUsersExceptLoggedInUser = async (req, res) => {
  /* Código aquí */
};
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Eliminar la imagen del usuario de Cloudinary si existe
    if (user.image && user.image.public_id) {
      try {
        await deleteImage(user.image.public_id);
        console.log(`Imagen eliminada: ${user.image.public_id}`);
      } catch (error) {
        console.error("Error al eliminar la imagen de Cloudinary:", error);
      }
    }

    // Eliminar el usuario de la base de datos
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { userName, email, password, city, mobile, userType } = req.body;
  const file = req.file;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso" });
      }
      user.email = email;
    }

    if (userName) user.userName = userName;
    if (city) user.city = city;
    if (mobile) user.mobile = mobile;
    if (userType) user.userType = userType;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    if (file) {
      const folderName = "userPerfil";
      const imageResult = await uploadImage(file.path, folderName);

      if (user.image && user.image.public_id) {
        await deleteImage(user.image.public_id).catch((err) =>
          console.error(
            "Error al eliminar la imagen anterior de Cloudinary:",
            err
          )
        );
      }

      user.image = { url: imageResult.url, public_id: imageResult.public_id };
      fs.unlinkSync(file.path);
    }

    await user.save();
    res.status(200).json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    console.error("Error actualizando usuario", error);
    res.status(500).json({ message: "Error actualizando el usuario" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user); // Only one response is sent
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// ...

export default {
  createToken,
  registerUser,
  loginUser,
  getAllUsers,
  getUsersExceptLoggedInUser,
  deleteUser,
  updateUser,
  getUserById,
  // Agregar el resto de los métodos aquí
};
