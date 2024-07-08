const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

module.exports = {
  createUser: async (req, res) => {
    try {
      const { userName, email, location, password, mobile } = req.body;

      const newUser = new User({
        userName,
        email,
        location,
        password: CryptoJS.AES.encrypt(password, process.env.SECRET).toString(),
        mobile,
      });

      await newUser.save();

      res.status(201).json({ message: "Usuario creado correctamente" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json("Introduzca un email válido");
      }

      const decryptedPassword = CryptoJS.AES.decrypt(
        user.password,
        process.env.SECRET
      );
      const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

      if (originalPassword !== password) {
        return res.status(401).json("Clave inválida");
      }

      const userToken = jwt.sign({ id: user.id }, process.env.JWT_SEC, {
        expiresIn: "7d",
      });

      const {
        password: omitPassword,
        __v,
        createdAt,
        updatedAt,
        ...userData
      } = user._doc;

      res.status(200).json({ ...userData, token: userToken });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUsers: async (req, res) => {
    try {
      const user = await User.find({ _id: { $ne: req.user.id } }).select(
        "-password"
      );
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
