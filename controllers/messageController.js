const Message = require("../models/message");
const User = require("../models/User");
const { getUserId } = require("../utils/authUtils");


const multer = require("multer");

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/"); // Specify the desired destination folder
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const postMessageStore = async (req, res) => {
  upload.single("imageFile");
  try {
    const { senderId, recepientId, messageType, messageText } = req.body;

    if (!recepientId) {
      return res.status(400).json({ error: "RecepientId is required" });
    }

    const newMessage = new Message({
      senderId,
      recepientId,
      messageType,
      message: messageText,
      timestamp: new Date(),
      imageUrl: messageType === "image" ? req.file.path : null,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchMessage = async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, recepientId: recepientId },
        { senderId: recepientId, recepientId: senderId },
      ],
    }).populate("senderId", "_id name");

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const sendMessage = async (req, res) => {
  const userId = getUserId(req); // Obtenemos el ID del usuario autenticado
  const { receiverId, content } = req.body;

  try {
    // Verificamos que el usuario receptor exista en la base de datos
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // Creamos y guardamos el mensaje
    const message = new Message({
      senderId: userId,
      receiverId,
      content,
    });
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

const getMessages = async (req, res) => {
  const userId = getUserId(req); // Obtenemos el ID del usuario autenticado
  const { otherUserId } = req.params;

  try {
    // Verificamos que ambos usuarios sean parte de la aplicación
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);
    if (!user || !otherUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Obtenemos los mensajes entre los dos usuarios
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
  
};
const deleteMessage = async (req, res) => {
 try {
   const { messages } = req.body;

   if (!Array.isArray(messages) || messages.length === 0) {
     return res.status(400).json({ message: "invalid req body!" });
   }

   await Message.deleteMany({ _id: { $in: messages } });

   res.json({ message: "Message deleted successfully" });
 } catch (error) {
   console.log(error);
   res.status(500).json({ error: "Internal Server" });
 }
};

module.exports = {
  sendMessage,
  getMessages,
  deleteMessage,
  postMessageStore,
  fetchMessage,
};
