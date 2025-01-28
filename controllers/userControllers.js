import dotenv from "dotenv";
dotenv.config();
// Define createToken function based on the userId
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Asegúrate de que esta ruta esté correcta
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import fs from "node:fs";

const createToken = (_id) => {
  return jwt.sign({ user: { id: _id } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  try {
    const { userName, email, password, location, mobile, userType } = req.body;
    const file = req.file; // Asume que estás usando multer para manejar la subida de archivos

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    let imageResult = null;
    if (file) {
      const folderName = "userPerfil"; // Nombre de la carpeta en Cloudinary

      try {
        // Subir la imagen a Cloudinary
        imageResult = await uploadImage(file.path, folderName);
        fs.unlinkSync(file.path); // Eliminar el archivo temporal
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }
    }

    // Crear un nuevo usuario
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      image: imageResult
        ? { url: imageResult.url, public_id: imageResult.public_id }
        : null,
      location,
      mobile,
      userType,
    });

    await newUser.save();
    res.status(200).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error registrando usuario", error);

    // Manejo específico del error de clave duplicada
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // Si hubo un error y se subió una imagen, eliminarla de Cloudinary
    if (imageResult) {
      await deleteImage(imageResult.public_id).catch((err) =>
        console.error("Error al eliminar imagen de Cloudinary:", err)
      );
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
  const { id } = req.params; // ID del usuario a actualizar
  const { userName, email, password, location, mobile, userType } = req.body;
  const file = req.file; // Nueva imagen de perfil (si se proporciona)

  try {
    // Buscar el usuario existente
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si el nuevo email ya está en uso por otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso" });
      }
      user.email = email;
    }

    // Actualizar campos del usuario
    if (userName) user.userName = userName;
    if (location) user.location = location;
    if (mobile) user.mobile = mobile;
    if (userType) user.userType = userType;

    // Actualizar la contraseña si se proporciona
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Manejo de la imagen de perfil
    if (file) {
      const folderName = "userPerfil"; // Carpeta en Cloudinary

      // Subir la nueva imagen a Cloudinary
      const imageResult = await uploadImage(file.path, folderName);

      // Eliminar la imagen anterior de Cloudinary si existe
      if (user.image && user.image.public_id) {
        await deleteImage(user.image.public_id).catch((err) =>
          console.error(
            "Error al eliminar la imagen anterior de Cloudinary:",
            err
          )
        );
      }

      // Actualizar la información de la imagen en el usuario
      user.image = {
        url: imageResult.url,
        public_id: imageResult.public_id,
      };

      // Eliminar el archivo temporal del servidor
      fs.unlinkSync(file.path);
    }

    // Guardar los cambios en la base de datos
    await user.save();

    // Responder con el usuario actualizado
    res.status(200).json({ message: "Usuario actualizado con éxito", user });
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    // Manejo de errores específicos
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está en uso" });
    }

    res.status(500).json({ message: "Error actualizando el usuario" });
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
  // Agregar el resto de los métodos aquí
};
