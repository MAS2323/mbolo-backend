const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'image'],
    },
    message: String,
    imageUrl: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);

// const mongoose = require("mongoose");

// const MessageSchema = new mongoose.Schema(
//   {
//     senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     recepientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     messageType: { type: String },
//     message: { type: String },
//     timestamp: { type: Date },
//     imageUrl: { type: String },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Message", MessageSchema);
