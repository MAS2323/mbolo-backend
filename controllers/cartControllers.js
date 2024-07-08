const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const { getCachedData, setCachedData } = require("../utils/cache");

module.exports = {
 addToCart: async (req, res) => {
    const { userId, productId } = req.params;

    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ message: "Invalid userId or productId" });
      }

      let cart = await Cart.findOne({ user: userId });

      if (cart) {
        // Si el producto no está en el carrito, agrégalo
        if (!cart.products.includes(productId)) {
          cart.products.push(productId);
          await cart.save();
          setCachedData(`cart_${userId}`, cart, 60000); // Actualiza la cache
        }
      } else {
        // Si no existe carrito para este usuario, crea uno nuevo
        const newCart = new Cart({
          user: userId,
          products: [productId],
        });
        await newCart.save();
        setCachedData(`cart_${userId}`, newCart, 60000); // Actualiza la cache
      }

      return res.status(200).json("Producto añadido al carrito");
    } catch (error) {
      console.error("Error adding product to cart:", error);
      return res.status(500).json(error.message || "Internal server error");
    }
  },

  getCart: async (req, res) => {
    const userId = req.params.id;

    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }

      const cart = await Cart.findOne({ user: userId }).populate(
        "products",
        "_id title supplier price imageUrl"
      );

      if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
      }

      res.status(200).json(cart);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Internal server error" });
    }

  },

 deleteCartItem: async (req, res) => {
const { userId, productId } = req.params;

try {
  // Validar que userId y productId sean ObjectIds válidos
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    return res.status(400).json({ message: "Invalid userId or productId" });
  }

  // Buscar el carrito del usuario por userId
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  // Eliminar el productId del array products en el carrito
  const updatedCart = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  );

  if (!updatedCart) {
    return res.status(404).json({ message: "Product not found in cart" });
  }

  return res
    .status(200)
    .json({ message: "Product removed from cart successfully", updatedCart });
} catch (error) {
  console.error("Error removing product from cart:", error);
  return res
    .status(500)
    .json({ message: "Failed to remove product from cart" });
}
},

  decrementCartItem: async (req, res) => {
    const { userId, productId } = req.body;

    try {
      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(productId)
      ) {
        return res.status(400).json({ message: "Invalid userId or productId" });
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json("Cart not found");
      }

      const productIndex = cart.products.indexOf(productId);

      if (productIndex === -1) {
        return res.status(404).json("Product not found in cart");
      }

      cart.products.splice(productIndex, 1);
      await cart.save();

      setCachedData(`cart_${userId}`, cart, 60000); // Update cache
      res.status(200).json("Product removed from cart");
    } catch (error) {
      console.error("Error decrementing cart item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
