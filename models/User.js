import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ciudad: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
      name: { type: String },
    },
    mobile: { type: String },
    userType: { type: String, default: "user" },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    birthday: { type: String },
    sex: {
      type: String,
      enum: ["Masculino", "Femenino", "No especificar"], // Valores permitidos
      default: "No especificar",
    },
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sentFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    order: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    carts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cart" }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
export default User;
