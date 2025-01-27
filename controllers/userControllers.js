import dotenv from "dotenv";
dotenv.config();
// Define createToken function based on the userId
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Asegúrate de que esta ruta esté correcta

const createToken = (_id) => {
  return jwt.sign({ user: { id: _id } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  try {
    const { userName, email, password, image, location, mobile, userType } =
      req.body;

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      image,
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
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  // Agregar el resto de los métodos aquí
};
