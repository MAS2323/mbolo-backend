const UserSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    location: { type: String, required: true },
    mobile: { type: String, required: true },
    userType: { type: String },
    friendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sentFriendRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    carts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],

    // Nuevo campo para referenciar la tienda del usuario
    tienda: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tienda",
    },
  },
  {
    timestamps: true,
  }
);
