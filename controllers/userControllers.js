const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

  // Define createToken function based on the userId
  (createToken = (_id) => {
    return jwt.sign({ user: { id: User._id } }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  }),
    (module.exports = {
      registerUser: async (req, res) => {
        try {
          const { userName, email, password, image, location, mobile } =
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
      },

      loginUser: async (req, res) => {
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

          const userToken = jwt.sign(
            {
              email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          ); // Llamada a createToken con el ID del usuario
          const {
            password: _,
            __v,
            createdAt,
            updatedAt,
            ...userData
          } = user._doc;

          res.status(200).json({ ...userData, token: userToken });
        } catch (error) {
          console.error("Error in loginUser:", error);
          res.status(500).json({ message: "Error al iniciar sesión" });
        }
      },
      getUserData: async (req, res) => {
        try {
          const userToken = req.body; // Asumiendo que el payload del token contiene el ID del usuario
          const user = await User.findById(userToken); // Excluir la contraseña de la respuesta

          const { password, __v, createdAt, updatedAt, ...userData } =
            user._doc;
          res.status(200).json(userData);
          res.json(user);
        } catch (error) {
          res.status(500).json({
            message: "Error recuperando los datos del usuario",
            error,
          });
        }
      },
      getUsersExceptLoggedInUser: async (req, res) => {
        try {
          const loggedInUserId = req.params.userId;
          if (!loggedInUserId) {
            return res.status(400).json({ message: "User ID is required" });
          }
          const users = await User.find({ _id: { $ne: loggedInUserId } });
          res.status(200).json(users);
        } catch (error) {
          console.error("Error retrieving users", error);
          res.status(500).json({ message: "Error retrieving users" });
        }
      },

      sendFriendRequest: async (req, res) => {
        try {
          const { currentUserId, selectedUserId } = req.body;
          await User.findByIdAndUpdate(selectedUserId, {
            $push: { friendRequests: currentUserId },
          });
          await User.findByIdAndUpdate(currentUserId, {
            $push: { sentFriendRequests: selectedUserId },
          });
          res.sendStatus(200);
        } catch (error) {
          console.error("Error sending friend request", error);
          res.sendStatus(500);
        }
      },

      getFriendRequests: async (req, res) => {
        try {
          const userId = req.params.userId;
          const user = await User.findById(userId)
            .populate("friendRequests", "userName email image")
            .lean();
          const friendRequests = user.friendRequests;
          res.status(200).json(friendRequests);
        } catch (error) {
          console.error("Error retrieving friend requests", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      },

      acceptFriendRequest: async (req, res) => {
        try {
          const { senderId, recipientId } = req.body;
          const sender = await User.findById(senderId);
          const recipient = await User.findById(recipientId);

          if (!sender || !recipient) {
            return res
              .status(404)
              .json({ message: "Sender or recipient not found" });
          }

          sender.friends.push(recipientId);
          recipient.friends.push(senderId);

          recipient.friendRequests = recipient.friendRequests.filter(
            (request) => request.toString() !== senderId.toString()
          );
          sender.sentFriendRequests = sender.sentFriendRequests.filter(
            (request) => request.toString() !== recipientId.toString()
          );

          await Promise.all([sender.save(), recipient.save()]);
          res
            .status(200)
            .json({ message: "Friend request accepted successfully" });
        } catch (error) {
          console.error("Error accepting friend request", error);
          res.status(500).json({ message: "Internal server error" });
        }
      },
      FriendRequestAccep: async (req, res) => {
        try {
          const { userId } = req.params;
          const user = await User.findById(userId).populate(
            "friends",
            "name email image"
          );
          const acceptedFriends = user.friends;
          res.json(acceptedFriends);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      },
      getFriends: async (req, res) => {
        try {
          const userId = req.params.userId;
          const user = await User.findById(userId).populate(
            "friends",
            "name email image"
          );
          const friendIds = user.friends.map((friend) => friend._id);
          res.status(200).json(friendIds);
        } catch (error) {
          console.error("Error retrieving friends", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      },
      updateUser: async (req, res) => {
        const { id } = req.params;
        const { userName, email, password, image, location, mobile } = req.body;

        try {
          const updateData = {
            userName,
            email,
            image,
            location,
            mobile,
          };

          // If a new password is provided, hash it before updating
          if (password) {
            updateData.password = await bcrypt.hash(password, 10);
          }

          // Use updateOne method to update the user based on email
          await User.updateOne({ _id: id }, { $set: updateData });

          // Fetch the updated user to send back in the response
          const updatedUser = await User.findById(id);

          if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
          }

          const {
            password: _,
            __v,
            createdAt,
            updatedAt,
            ...userData
          } = updatedUser._doc;

          res.status(200).json(userData);
        } catch (error) {
          console.error("Error updating user:", error);
          res.status(500).json({ message: "Failed to update user", error });
        }
      },

      getUser: async (req, res) => {
        try {
          // Validar que el ID proporcionado es válido
          const { id } = req.params;
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de usuario no válido" });
          }

          // Buscar el usuario por ID
          const user = await User.findById(id);
          if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
          }

          // Excluir campos no deseados
          const { password, __v, createdAt, updatedAt, image, ...userData } =
            user._doc;

          // Responder con los datos del usuario
          res.status(200).json(userData);
        } catch (error) {
          console.error("Error retrieving user", error);
          res.status(500).json({ message: "Error al recuperar el usuario" });
        }
      },
      getAllUsers: async (req, res) => {
        try {
          const users = await User.find();
          res.status(200).json(users);
        } catch (error) {
          console.error("Error retrieving users:", error);
          res.status(500).json({ message: "Error retrieving users" });
        }
      },
      deleteUser: async (req, res) => {
        try {
          await User.findByIdAndDelete(req.params.id);
          res.status(200).json("Usuario Eliminado");
        } catch (error) {
          console.error("Error deleting user", error);
          res.status(500).json(error);
        }
      },
    });
