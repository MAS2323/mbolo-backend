import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Tienda from "../models/Tienda.js"; // Import Tienda model
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import fs from "node:fs";

export default {
  getUserOrders: async (req, res) => {
    const { id: userId } = req.params;

    try {
      console.log(
        "getUserOrders - Received userId:",
        userId,
        "Type:",
        typeof userId
      );
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }

      const userOrders = await Order.find({ userId })
        .populate({
          path: "products.productId",
          select:
            "title supplier price images tallas colores numeros_calzado stock",
        })
        .populate("storeId", "name paymentMethods") // Populate store details
        .sort({ createdAt: -1 })
        .lean();

      if (!userOrders.length) {
        return res
          .status(404)
          .json({ message: "No orders found for this user" });
      }

      res.status(200).json(userOrders);
    } catch (error) {
      console.error("Error fetching user orders:", {
        message: error.message,
        stack: error.stack,
      });
      res
        .status(500)
        .json({ message: "Error fetching orders", error: error.message });
    }
  },

  createOrder: async (req, res) => {
    let body = req.body;
    let paymentReceipt = { url: null, public_id: null };

    try {
      console.log("createOrder - Request details:", {
        method: req.method,
        headers: req.headers,
        body: req.body,
        file: req.file,
      });

      // Parse FormData JSON
      if (body.data) {
        try {
          body = JSON.parse(body.data);
        } catch (error) {
          console.error("Invalid JSON in data field:", error.message);
          return res
            .status(400)
            .json({ message: "Invalid JSON in data field" });
        }
      } else {
        console.error("Missing data field in request body");
        return res.status(400).json({ message: "Missing data field" });
      }

      const { userId, name, contact, products, paymentMethod } = body;

      if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "User name is required" });
      }
      if (!contact || typeof contact !== "string") {
        return res.status(400).json({ message: "User contact is required" });
      }
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res
          .status(400)
          .json({ message: "Products array is required and cannot be empty" });
      }
      if (!paymentMethod || typeof paymentMethod !== "object") {
        return res.status(400).json({ message: "Payment method is required" });
      }
      const { name: paymentMethodName, accountNumber } = paymentMethod;
      if (!paymentMethodName || !accountNumber) {
        return res.status(400).json({
          message: "Payment method name and account number are required",
        });
      }

      // Verify store and payment method (assuming storeId is derived from product)
      const product = await Product.findById(products[0].productId).select(
        "tienda"
      );
      if (!product || !product.tienda) {
        return res.status(404).json({ message: "Product or store not found" });
      }
      const storeId = product.tienda;
      const store = await Tienda.findById(storeId).select("paymentMethods");
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      const validPaymentMethod = store.paymentMethods.find(
        (pm) =>
          pm.name === paymentMethodName && pm.accountNumber === accountNumber
      );
      if (!validPaymentMethod) {
        return res
          .status(400)
          .json({ message: "Invalid payment method selected" });
      }

      // Handle payment receipt upload
      if (req.file) {
        const folderName = "mbolo_payment_receipts";
        try {
          console.log(`Uploading payment receipt: ${req.file.originalname}`, {
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
          });
          const result = await uploadImage(req.file.path, folderName);
          paymentReceipt = { url: result.url, public_id: result.public_id };
          fs.unlinkSync(req.file.path); // Clean up local file
        } catch (error) {
          console.error("Error uploading payment receipt to Cloudinary:", {
            message: error.message,
            stack: error.stack,
          });
          const errorMessage = error.message.includes("File size too large")
            ? "El archivo es demasiado grande. Máximo 40MB."
            : "Error uploading payment receipt to Cloudinary";
          return res
            .status(500)
            .json({ message: errorMessage, error: error.message });
        }
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let calculatedTotal = 0;
        const validatedProducts = [];

        for (const item of products) {
          const { productId, quantity, subtotal, color, talla } = item;

          if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error(`Invalid productId: ${productId}`);
          }
          if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error(`Invalid quantity for product ${productId}`);
          }
          if (typeof subtotal !== "number" || subtotal <= 0) {
            throw new Error(`Invalid subtotal for product ${productId}`);
          }

          const product = await Product.findById(productId).session(session);
          if (!product) {
            throw new Error(`Product not found: ${productId}`);
          }
          if (product.stock < quantity) {
            throw new Error(`Insufficient stock for product ${product.title}`);
          }
          if (color && !product.colores.includes(color)) {
            throw new Error(
              `Invalid color ${color} for product ${product.title}`
            );
          }
          if (talla) {
            if (product.tallas.length > 0 && !product.tallas.includes(talla)) {
              throw new Error(
                `Invalid talla ${talla} for product ${product.title}`
              );
            }
            if (
              product.numeros_calzado.length > 0 &&
              !product.numeros_calzado.includes(parseFloat(talla))
            ) {
              throw new Error(
                `Invalid numero_calzado ${talla} for product ${product.title}`
              );
            }
          }

          const expectedSubtotal = product.price * quantity;
          if (Math.abs(subtotal - expectedSubtotal) > 0.01) {
            throw new Error(
              `Subtotal mismatch for product ${product.title}: provided ${subtotal}, expected ${expectedSubtotal}`
            );
          }

          validatedProducts.push({
            productId,
            quantity,
            subtotal,
            color: color || null,
            talla: talla || null,
          });
          calculatedTotal += subtotal;
        }

        const newOrder = new Order({
          userId,
          name,
          contact,
          products: validatedProducts,
          paymentMethod: {
            name: paymentMethodName,
            accountNumber,
            image: validPaymentMethod.image,
          },
          paymentReceipt,
        });

        await newOrder.save({ session });

        // Update store's orders array
        await Tienda.findByIdAndUpdate(storeId, {
          $push: { orders: newOrder._id },
        }).session(session);

        await session.commitTransaction();

        res
          .status(201)
          .json({ message: "Order created successfully", order: newOrder });
      } catch (error) {
        await session.abortTransaction();
        if (paymentReceipt.public_id) {
          await deleteImage(paymentReceipt.public_id).catch((err) =>
            console.error("Error deleting payment receipt:", err)
          );
        }
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("Error creating order:", {
        message: error.message,
        stack: error.stack,
        requestBody: body,
      });
      if (paymentReceipt.public_id) {
        await deleteImage(paymentReceipt.public_id).catch((err) =>
          console.error("Error deleting payment receipt:", err)
        );
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      res
        .status(400)
        .json({ message: error.message || "Error creating order" });
    }
  },
  getOrderById: async (req, res) => {
    const { orderId } = req.params;

    try {
      console.log("getOrderById - Received orderId:", orderId);
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid orderId format" });
      }

      const order = await Order.findById(orderId)
        .populate({
          path: "products.productId",
          select: "title supplier price images tallas colores numeros_calzado",
        })
        .populate("storeId", "name paymentMethods")
        .lean();

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", {
        message: error.message,
        stack: error.stack,
      });
      res
        .status(500)
        .json({ message: "Error fetching order", error: error.message });
    }
  },

  getStorePaymentMethods: async (req, res) => {
    const { storeId } = req.params;

    try {
      console.log("getStorePaymentMethods - Received storeId:", storeId);
      if (!mongoose.Types.ObjectId.isValid(storeId)) {
        return res.status(400).json({ message: "Invalid storeId format" });
      }

      const store = await Tienda.findById(storeId)
        .select("paymentMethods name")
        .lean();
      if (!store) {
        console.log(`Store not found for storeId: ${storeId}`);
        return res.status(404).json({ message: "Store not found" });
      }

      console.log(
        `Payment methods for store ${store.name}:`,
        store.paymentMethods
      );
      res.status(200).json(store.paymentMethods || []);
    } catch (error) {
      console.error("Error fetching payment methods for storeId:", storeId, {
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        message: "Error fetching payment methods",
        error: error.message,
      });
    }
  },
};
